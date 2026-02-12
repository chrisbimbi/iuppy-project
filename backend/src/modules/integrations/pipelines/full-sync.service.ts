
import { Injectable, Logger } from '@nestjs/common';
import { IntegrationRun } from '../entities/integration_run.entity';
import { BaseConnector } from '../connectors/base.connector';
import { InjectRepository } from '@nestjs/typeorm';
import { IdentityLink } from '../entities/identity_link.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../../../users/users.service';
import { IntegrationConfigEntity } from '../entities/integration_config.entity';
import { AutoMapperService } from '../mapper/auto-mapper.service';

@Injectable()
export class FullSyncService {
    private readonly logger = new Logger(FullSyncService.name);

    constructor(
        @InjectRepository(IdentityLink)
        private identityRepo: Repository<IdentityLink>,
        @InjectRepository(IntegrationConfigEntity)
        private configRepo: Repository<IntegrationConfigEntity>,
        private usersService: UsersService,
        private autoMapper: AutoMapperService,
    ) { }

    async execute(run: IntegrationRun, connector: BaseConnector) {
        this.logger.log(`Executing Full Sync for Run ${run.id}`);

        // 0. Load Configuration for Mapping
        const config = await this.configRepo.findOneBy({ connectionId: run.connection.id });
        const fieldMapping = config?.fieldMapping || {};
        this.logger.log(`Using Mapping: ${JSON.stringify(fieldMapping)}`);

        let cursor: string | undefined = undefined;
        let hasMore = true;
        let pageCount = 0;

        let added = 0;
        let updated = 0;
        let failed = 0;

        let totalProcessed = 0;

        while (hasMore) {
            pageCount++;
            this.logger.log(`Fetching page ${pageCount} (Cursor: ${cursor || 'Initial'})...`);

            // 1. Fetch from source
            const result = await connector.syncUsers(cursor);
            this.logger.log(`Fetched ${result.data.length} users from connector (Page ${pageCount})`);

            totalProcessed += result.data.length;

            // 2. Upsert Logic
            for (const extUserRecord of result.data) {
                // ... (existing logic)

                try {
                    // If mapping is available, use it. Otherwise fallback to connector's normalized fields.
                    let mappedUser: any = extUserRecord; // Default fallback

                    // ...
                    if (Object.keys(fieldMapping).length > 0) {
                        // Use AutoMapper with custom mapping on the raw original record
                        mappedUser = this.autoMapper.mapRecord(extUserRecord.rawPayload || extUserRecord, fieldMapping);
                    }

                    // Final safety check for required fields
                    const matchEmail = mappedUser.email || extUserRecord.email;
                    const matchName = mappedUser.name || mappedUser.fullName || extUserRecord.fullName;

                    if (!matchEmail) {
                        this.logger.warn(`Skipping user without email: ${JSON.stringify(extUserRecord)}`);
                        continue;
                    }

                    // --- Deactivation Logic (Soft-Delete) ---
                    let isActive = extUserRecord.isActive; // Start with connector's status
                    if (mappedUser.active === false) isActive = false;

                    const now = new Date();
                    if (mappedUser.terminationDate && new Date(mappedUser.terminationDate) <= now) {
                        isActive = false;
                        this.logger.log(`Deactivating user ${matchEmail} due to termination date: ${mappedUser.terminationDate}`);
                    }

                    // Assemble exhaustive user data object for create/update
                    const userData: any = {
                        name: matchName,
                        isActive,
                        // --- Nome e Pessoal ---
                        middleName: mappedUser.middleName || undefined,
                        preferredName: mappedUser.preferredName || undefined,
                        birthDate: mappedUser.birthDate ? new Date(mappedUser.birthDate) : undefined,
                        gender: mappedUser.gender || undefined,
                        maritalStatus: mappedUser.maritalStatus || undefined,
                        nationality: mappedUser.nationality || undefined,
                        academicLevel: mappedUser.academicLevel || undefined,
                        raceColor: mappedUser.raceColor || undefined,
                        disabilityType: mappedUser.disabilityType || undefined,

                        // --- Documentos ---
                        cpf: mappedUser.cpf || undefined,
                        rg: mappedUser.rg || undefined,
                        rgIssuer: mappedUser.rgIssuer || undefined,
                        rgState: mappedUser.rgState || undefined,
                        rgIssueDate: mappedUser.rgIssueDate ? new Date(mappedUser.rgIssueDate) : undefined,
                        pis: mappedUser.pis || undefined,
                        ctpsNumber: mappedUser.ctpsNumber || undefined,
                        ctpsSeries: mappedUser.ctpsSeries || undefined,
                        ctpsState: mappedUser.ctpsState || undefined,
                        voterId: mappedUser.voterId || undefined,

                        // --- Contato e Endereço ---
                        secondaryEmail: mappedUser.secondaryEmail || undefined,
                        personalEmail: mappedUser.personalEmail || undefined,
                        phone: mappedUser.phone || undefined,
                        mobilePhone: mappedUser.mobile || undefined,
                        emergencyContactName: mappedUser.emergencyContactName || undefined,
                        emergencyContactPhone: mappedUser.emergencyContactPhone || undefined,
                        address: mappedUser.address || undefined,
                        addressStreet: mappedUser.addressStreet || undefined,
                        addressNumber: mappedUser.addressNumber || undefined,
                        addressComplement: mappedUser.addressComplement || undefined,
                        addressNeighborhood: mappedUser.addressNeighborhood || undefined,
                        addressCity: mappedUser.addressCity || undefined,
                        addressState: mappedUser.addressState || undefined,
                        addressZipCode: mappedUser.addressZipCode || undefined,

                        // --- Emprego e Hierarquia ---
                        registrationNumber: mappedUser.registrationNumber || undefined,
                        jobTitle: mappedUser.jobTitle || undefined,
                        department: mappedUser.department || undefined,
                        costCenter: mappedUser.costCenter || undefined,
                        legalEntity: mappedUser.legalEntity || undefined,
                        contractType: mappedUser.contractType || undefined,
                        employmentStatus: mappedUser.employmentStatus || (isActive ? 'Ativo' : 'Desligado'),
                        workShift: mappedUser.workShift || undefined,
                        managerEmail: mappedUser.managerEmail || undefined,
                        positionId: mappedUser.positionId || undefined,
                        location: mappedUser.location || undefined,
                        hireDate: mappedUser.hireDate ? new Date(mappedUser.hireDate) : undefined,
                        admissionDate: mappedUser.hireDate ? new Date(mappedUser.hireDate) : undefined,
                        salary: mappedUser.baseSalary || undefined,
                        hiringType: mappedUser.contractType || undefined,
                        terminationDate: mappedUser.terminationDate ? new Date(mappedUser.terminationDate) : undefined,
                        probationEndDate: mappedUser.probationEndDate ? new Date(mappedUser.probationEndDate) : undefined,

                        // --- Remuneração e Financeiro ---
                        payrollData: {
                            baseSalary: mappedUser.baseSalary || undefined,
                            hourlyRate: mappedUser.hourlyRate || undefined,
                            payFrequency: mappedUser.payFrequency || undefined,
                            currency: mappedUser.currency || 'BRL',
                            bankName: mappedUser.bankName || undefined,
                            bankBranch: mappedUser.bankBranch || undefined,
                            bankAccount: mappedUser.bankAccount || undefined,
                            bankAccountType: mappedUser.bankAccountType || undefined,
                            pixKey: mappedUser.pixKey || undefined,
                            ...mappedUser.payrollData
                        },
                        vacationData: mappedUser.vacationData || undefined,
                        customAttributes: mappedUser.customAttributes || {},
                        syncKey: extUserRecord.externalId
                    };


                    // A. Check if link exists
                    let link = await this.identityRepo.findOneBy({
                        providerKey: run.connection.providerKey,
                        externalId: extUserRecord.externalId,
                        companyId: run.connection.companyId
                    });

                    let userId: string;

                    if (link) {
                        // Update existing user
                        userId = link.internalUserId;
                        await this.usersService.update(userId, userData);
                        updated++;
                    } else {
                        // B. Link not found, check if user exists by email (Auto-Match)
                        let user = await this.usersService.findByEmail(matchEmail);

                        if (user) {
                            userId = user.id;
                            // Link existing user
                            link = this.identityRepo.create({
                                providerKey: run.connection.providerKey,
                                companyId: run.connection.companyId,
                                externalId: extUserRecord.externalId,
                                internalUserId: user.id
                            });
                            await this.identityRepo.save(link);

                            // Update fields
                            await this.usersService.update(userId, userData);
                            updated++;
                        } else {
                            // C. Create new user
                            const newUser = await this.usersService.create({
                                email: matchEmail,
                                password: crypto.randomUUID(),
                                companyId: run.connection.companyId,
                                firstLoginAt: null,
                                ...userData
                            } as any);

                            userId = newUser.id;

                            // Create Link
                            link = this.identityRepo.create({
                                providerKey: run.connection.providerKey,
                                companyId: run.connection.companyId,
                                externalId: extUserRecord.externalId,
                                internalUserId: newUser.id
                            });
                            await this.identityRepo.save(link);
                            added++;
                        }
                    }
                } catch (err) {
                    this.logger.error(`Failed to sync user ${extUserRecord.email}: ${err.message}`);
                    failed++;
                }
            }

            // Prepare for next page
            hasMore = result.hasMore;
            cursor = result.nextCursor;
        }

        // 3. Update Stats
        run.stats = {
            processed: totalProcessed,
            added,
            updated,
            failed
        };
    }
}
