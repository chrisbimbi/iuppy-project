import {
    IsNotEmpty,
    IsUUID,
    IsString,
    IsOptional,
    IsEnum,
    IsArray,
} from 'class-validator';
import { UserGroupType } from '@shared/types';

export class CreateGroupDto {
    @IsNotEmpty() @IsUUID()
    companyId: string;

    @IsNotEmpty() @IsString()
    name: string;

    @IsOptional() @IsString()
    identifier?: string;

    @IsNotEmpty() @IsEnum(UserGroupType)
    type: UserGroupType;

    @IsOptional() @IsArray() @IsString({ each: true })
    conditions?: string[];

    @IsOptional() @IsArray() @IsUUID('all', { each: true })
    adminIds?: string[];
}