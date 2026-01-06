import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1EvidenceFile, EvidenceType } from '../entities/nr1-evidence-file.entity';
import * as crypto from 'crypto';
import { FirebaseStorageService } from '../../../uploads/firebase-storage.service';

@Injectable()
export class EvidenceVaultService {
    constructor(
        @InjectRepository(Nr1EvidenceFile)
        private readonly evidenceRepo: Repository<Nr1EvidenceFile>,
        private readonly storageService: FirebaseStorageService,
    ) { }

    async listEvidence(companyId: string) {
        return this.evidenceRepo.find({
            where: { company_id: companyId },
            order: { created_at: 'DESC' },
        });
    }

    async storeEvidence(
        companyId: string,
        type: EvidenceType,
        file: Express.Multer.File,
    ) {
        // Calculate SHA-256 of the buffer
        const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Upload to Firebase Storage
        const fileUrl = await this.storageService.uploadFile(
            file.buffer,
            `${hash}_${file.originalname}`,
            file.mimetype,
            'nr1/evidence'
        );

        const entity = this.evidenceRepo.create({
            company_id: companyId,
            tipo: type,
            file_url: fileUrl,
            sha256: hash,
            assinado_icp: false,
        });

        return this.evidenceRepo.save(entity);
    }

    async signEvidence(companyId: string, id: string) {
        const evidence = await this.evidenceRepo.findOneBy({ id, company_id: companyId });
        if (!evidence) throw new NotFoundException('Evidence not found');

        if (evidence.assinado_icp) return evidence;

        // Load Certificate
        const fs = require('fs');
        const forge = require('node-forge');

        const certPath = process.env.ICP_CERT_PATH || 'certs/iuppy-test.p12';
        const certPass = process.env.ICP_CERT_PASS || '123456';

        let p12Buffer;
        try {
            p12Buffer = fs.readFileSync(certPath);
        } catch (e) {
            throw new Error(`Certificado não encontrado em: ${certPath}`);
        }

        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certPass);

        // Get Private Key (usually in the first safe bag)
        const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
        const privateKey = keyBag.key;

        // Sign the hash (RSA-SHA256)
        const md = forge.md.sha256.create();
        md.update(evidence.sha256, 'utf8');
        const signature = privateKey.sign(md);
        const signatureHex = forge.util.bytesToHex(signature);

        // Extract Signer Info (CN)
        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = certBags[forge.pki.oids.certBag][0];
        const cert = certBag.cert;
        const subject = cert.subject.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');

        evidence.assinado_icp = true;
        evidence.manifesto = JSON.stringify({
            signed_at: new Date().toISOString(),
            signer: subject,
            algorithm: 'SHA256withRSA',
            original_hash: evidence.sha256,
            signature: signatureHex
        });

        return this.evidenceRepo.save(evidence);
    }

    async generateAuditBundle(companyId: string) {
        const allEvidence = await this.listEvidence(companyId);

        const manifest = {
            generated_at: new Date().toISOString(),
            company_id: companyId,
            total_files: allEvidence.length,
            files: allEvidence.map(e => ({
                id: e.id,
                type: e.tipo,
                url: e.file_url,
                sha256: e.sha256,
                signed: e.assinado_icp,
                timestamp: e.created_at
            }))
        };

        return manifest;
    }
}
