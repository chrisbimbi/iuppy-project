import {
    IsUUID, IsNotEmpty, IsString, IsEnum, IsOptional, IsArray, ArrayNotEmpty, ArrayUnique
} from 'class-validator';
import { Type } from 'class-transformer';
import { GroupType } from '@shared/constants/GroupType';

export class CreateGroupDto {
    @IsNotEmpty() @IsUUID()
    companyId: string;

    @IsNotEmpty() @IsString()
    name: string;

    @IsOptional() @IsString()
    identifier?: string;

    @IsNotEmpty() @IsEnum(GroupType)
    type: GroupType;

    @IsOptional() @IsArray()
    @ArrayUnique()
    @Type(() => String)
    conditions?: string[];

    @IsOptional() @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsUUID('4', { each: true })
    adminIds?: string[];
}