import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nr1EsocialQueue, EsocialEventType, EsocialStatus } from '../entities/nr1-esocial-queue.entity';
import { Nr1EsocialResult } from '../entities/nr1-esocial-result.entity';
import { Nr1RiskRecord } from '../entities/nr1-risk-record.entity';

@Injectable()
export class Nr1EsocialService {
    private readonly logger = new Logger('Nr1EsocialService');

    constructor(
        @InjectRepository(Nr1EsocialQueue)
        private readonly queueRepo: Repository<Nr1EsocialQueue>,
        @InjectRepository(Nr1EsocialResult)
        private readonly resultRepo: Repository<Nr1EsocialResult>,
        @InjectRepository(Nr1RiskRecord)
        private readonly riskRepo: Repository<Nr1RiskRecord>,
    ) { }

    // --- QUEUE MANAGEMENT ---

    async listQueue(companyId: string, status?: EsocialStatus) {
        const where: any = { company_id: companyId };
        if (status) where.status = status;

        return this.queueRepo.find({
            where,
            order: { created_at: 'DESC' },
            take: 50,
        });
    }

    // --- S-2240 GENERATION ---

    async queueS2240(companyId: string, employeeId: string) {
        // 1. Fetch relevant Risks for this Employee/GHE
        // MVP: Just fetching all risks for the company as a mockup of "Employee exposure"
        const risks = await this.riskRepo.find({ where: { company_id: companyId } });

        // 2. Build XML Payload (Mock JSON)
        const payload = {
            evtExpRisco: {
                ideEvento: {
                    indRetif: 1,
                    nrRecibo: "",
                },
                ideEmpregador: {
                    tpInsc: 1,
                    nrInsc: "12345678000199",
                },
                ideVinculo: {
                    cpfTrab: employeeId, // Mock usage of ID as CPF
                    matricula: "MAT-001",
                },
                infoExpRisco: {
                    dtIniCondicao: new Date().toISOString().split('T')[0],
                    infoAmb: {
                        localAmb: 1,
                        dscSetor: "Produção",
                        tpInsc: 1,
                        nrInsc: "12345678000199",
                    },
                    fatoresRisco: risks.map(r => ({
                        codFatRis: '01.01.001', // TODO: Add column to entity later
                        dscFatRis: r.perigo,
                    })),
                },
            },
        };

        // 3. Enqueue
        const item = this.queueRepo.create({
            company_id: companyId,
            event_type: EsocialEventType.S2240,
            payload,
            status: EsocialStatus.QUEUED,
        });

        return this.queueRepo.save(item);
    }

    // --- PROCESSING WORKER ---

    async processQueue(companyId: string) {
        // Fetch pending items
        const items = await this.queueRepo.find({
            where: { company_id: companyId, status: EsocialStatus.QUEUED },
            take: 10,
        });

        const results = [];

        for (const item of items) {
            try {
                const fs = require('fs');
                const https = require('https');
                const axios = require('axios');

                const certPath = process.env.ICP_CERT_PATH || 'certs/iuppy-test.p12';
                const certPass = process.env.ICP_CERT_PASS || '123456';

                // eSocial Endpoint (Production Restricted / Sandbox)
                const env = process.env.ESOCIAL_ENV === '1' ? 'https://webservices.esocial.gov.br/servicos/empregador/lotedeeventos/WsLoteEventos.svc' : 'https://webservices.producaorestrita.esocial.gov.br/servicos/empregador/lotedeeventos/WsLoteEventos.svc';

                let agent;
                if (fs.existsSync(certPath)) {
                    const pfx = fs.readFileSync(certPath);
                    agent = new https.Agent({
                        pfx,
                        passphrase: certPass,
                        rejectUnauthorized: false // Often needed for sandbox with self-signed or specific gov chains
                    });
                } else {
                    this.logger.warn(`Certificate not found at ${certPath}, skipping real transmission for item ${item.id}`);
                    throw new Error("Certificado não encontrado");
                }

                // SOAP Envelope (Simplified)
                const soapBody = `
                    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:esoc="http://www.esocial.gov.br/schema/lote/eventos/envio/v1_1_1">
                        <soap:Header/>
                        <soap:Body>
                            <esoc:EnviarLoteEventos>
                                <esoc:loteEventos>
                                    <esoc:evento id="${item.id}">${JSON.stringify(item.payload)}</esoc:evento>
                                </esoc:loteEventos>
                            </esoc:EnviarLoteEventos>
                        </soap:Body>
                    </soap:Envelope>
                 `;

                const response = await axios.post(env, soapBody, {
                    headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
                    httpsAgent: agent,
                    timeout: 5000
                });

                item.status = EsocialStatus.SENT;
                const result = new Nr1EsocialResult();
                result.queue_id = item.id;
                result.status_code = response.status; // axios status is number
                result.status_msg = "Transmissão realizada com sucesso";
                result.receipt = `REC-${Date.now()}`;
                await this.resultRepo.save(result);

            } catch (e: any) {
                // If network error, mark failed
                item.status = EsocialStatus.FAILED;
                item.retries += 1;
                item.last_error = e.message || "Erro de comunicação";

                const result = new Nr1EsocialResult();
                result.queue_id = item.id;
                result.status_code = 500; // Use number
                result.status_msg = e.message || "Erro desconhecido";
                await this.resultRepo.save(result);
            }
            await this.queueRepo.save(item);
            results.push(item);
        }

        return results;
    }
}
