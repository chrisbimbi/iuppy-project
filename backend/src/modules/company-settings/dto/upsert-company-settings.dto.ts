import { Type } from 'class-transformer';
import {
    IsOptional,
    IsIn,
    IsArray,
    ArrayMinSize,
    IsString,
    Matches,
    ValidateNested,
} from 'class-validator';

const LOCALES = ['pt', 'en', 'es', 'de'] as const;
type Locale = (typeof LOCALES)[number];

class BrandingDto {
    @IsOptional() @IsString() logoUrl?: string;

    // nomes exibidos no app mobile
    @IsOptional() @IsString() appTitle?: string;
    @IsOptional() @IsString() appSubtitle?: string;

    // cores hex #RRGGBB
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/, { message: 'primary deve ser hex (#RRGGBB)' }) primary?: string;
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) success?: string;
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) info?: string;
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) warning?: string;
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) danger?: string;
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) gray900?: string;
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) gray600?: string;

    // fundo e texto do preview/app
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) background?: string;
    @IsOptional() @Matches(/^#([0-9A-Fa-f]{6})$/) textOnBackground?: string;
}

export class UpsertCompanySettingsDto {
    @IsOptional() @IsIn(LOCALES as unknown as string[], { message: `defaultLocale deve ser um de: ${LOCALES.join(', ')}` })
    defaultLocale?: Locale;

    @IsOptional() @IsArray() @ArrayMinSize(1)
    @IsIn(LOCALES as unknown as string[], { each: true, message: `Cada supportedLocale deve ser um de: ${LOCALES.join(', ')}` })
    supportedLocales?: Locale[];

    @IsOptional() @ValidateNested() @Type(() => BrandingDto)
    branding?: BrandingDto;
}