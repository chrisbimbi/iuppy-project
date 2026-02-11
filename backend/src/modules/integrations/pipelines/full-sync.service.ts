
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

                    if (Object.keys(fieldMapping).length > 0) {
                        // Use AutoMapper with custom mapping on the raw original record
                        mappedUser = this.autoMapper.mapRecord(extUserRecord, fieldMapping);

                        // Fallback to normalized if mapping missed basic fields
                        if (!mappedUser.email) mappedUser.email = extUserRecord.email;
                        if (!mappedUser.fullName) mappedUser.fullName = extUserRecord.fullName;
                    }

                    // Final safety check for required fields
                    const matchEmail = mappedUser.email || extUserRecord.email;
                    const matchName = mappedUser.name || mappedUser.fullName || extUserRecord.fullName;

                    if (!matchEmail) {
                        this.logger.warn(`Skipping user without email: ${JSON.stringify(extUserRecord)}`);
                        continue;
                    }

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

                        await this.usersService.update(userId, {
                            name: matchName,
                            jobTitle: mappedUser.jobTitle || undefined,
                            department: mappedUser.department || undefined,
                            phone: mappedUser.phone || mappedUser.mobile || undefined
                        });
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
                            await this.usersService.update(userId, {
                                name: matchName,
                                jobTitle: mappedUser.jobTitle || undefined,
                                department: mappedUser.department || undefined,
                                phone: mappedUser.phone || undefined,
                                hireDate: mappedUser.hireDate ? new Date(mappedUser.hireDate) : undefined,
                                birthDate: mappedUser.birthDate ? new Date(mappedUser.birthDate) : undefined,
                                registrationNumber: mappedUser.registrationNumber || undefined,
                                costCenter: mappedUser.costCenter || undefined,
                                terminationDate: mappedUser.terminationDate ? new Date(mappedUser.terminationDate) : undefined,
                                payrollData: mappedUser.payrollData || undefined,
                                vacationData: mappedUser.vacationData || undefined,
                                contractType: mappedUser.contractType || undefined,
                                workShift: mappedUser.workShift || undefined,
                                managerEmail: mappedUser.managerEmail || undefined
                            });
                            updated++;
                        } else {
                            // C. Create new user
                            const newUser = await this.usersService.create({
                                email: matchEmail,
                                name: matchName,
                                password: crypto.randomUUID(),
                                companyId: run.connection.companyId,
                                role: 'user',
                                department: mappedUser.department,
                                jobTitle: mappedUser.jobTitle,
                                phone: mappedUser.phone,
                                hireDate: mappedUser.hireDate ? new Date(mappedUser.hireDate) : undefined,
                                birthDate: mappedUser.birthDate ? new Date(mappedUser.birthDate) : undefined,
                                registrationNumber: mappedUser.registrationNumber,
                                costCenter: mappedUser.costCenter,
                                terminationDate: mappedUser.terminationDate ? new Date(mappedUser.terminationDate) : undefined,
                                payrollData: mappedUser.payrollData,
                                vacationData: mappedUser.vacationData,
                                contractType: mappedUser.contractType,
                                workShift: mappedUser.workShift,
                                managerEmail: mappedUser.managerEmail,
                                firstLoginAt: null
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
