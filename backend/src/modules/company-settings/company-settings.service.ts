import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CompanySettingsEntity } from './company-settings.entity'
import { UpsertCompanySettingsDto } from './dto/upsert-company-settings.dto'
import { CompanySettings } from '@shared/types'

@Injectable()
export class CompanySettingsService {
    constructor(
        @InjectRepository(CompanySettingsEntity) private repo: Repository<CompanySettingsEntity>,
    ) { }

    async get(companyId: string): Promise<CompanySettings> {
        const row = await this.repo.findOne({ where: { companyId } })
        return row ? this.map(row) : this.map(await this.repo.save({ companyId }))
    }

    async upsert(companyId: string, dto: UpsertCompanySettingsDto): Promise<CompanySettings> {
        const curr = await this.repo.findOne({ where: { companyId } }) || this.repo.create({ companyId })

        if (dto.defaultLocale) curr.defaultLocale = dto.defaultLocale
        if (dto.supportedLocales) curr.supportedLocales = dto.supportedLocales

        if (dto.branding) {
            const b = dto.branding as any
            Object.assign(curr, {
                logoUrl: b.logoUrl ?? curr.logoUrl,
                appTitle: b.appTitle ?? curr.appTitle,
                appSubtitle: b.appSubtitle ?? curr.appSubtitle,
                primary: b.primary ?? curr.primary,
                success: b.success ?? curr.success,
                info: b.info ?? curr.info,
                warning: b.warning ?? curr.warning,
                danger: b.danger ?? curr.danger,
                gray900: b.gray900 ?? curr.gray900,
                gray600: b.gray600 ?? curr.gray600,
                background: b.background ?? curr.background,
                textOnBackground: b.textOnBackground ?? curr.textOnBackground,
            })
        }

        curr.updatedAt = new Date()
        return this.map(await this.repo.save(curr))
    }

    private map(e: CompanySettingsEntity): CompanySettings {
        return {
            companyId: e.companyId,
            defaultLocale: e.defaultLocale as any,
            supportedLocales: (e.supportedLocales?.length ? e.supportedLocales : ['pt', 'en', 'es', 'de']) as any,
            branding: {
                logoUrl: e.logoUrl,
                appTitle: e.appTitle,
                appSubtitle: e.appSubtitle,
                primary: e.primary, success: e.success, info: e.info, warning: e.warning, danger: e.danger,
                gray900: e.gray900, gray600: e.gray600,
                background: e.background,
                textOnBackground: e.textOnBackground,
            },
            updatedAt: e.updatedAt,
        }
    }
}