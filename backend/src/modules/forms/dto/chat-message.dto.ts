import { IsString, MinLength, IsIn, IsOptional } from 'class-validator';

export class ChatMessageDto {
    @IsString()
    @MinLength(1)
    message: string;

    @IsIn(['user', 'rh'])
    actor: 'user' | 'rh';
    
    @IsOptional()
    @IsString()
    userId?: string; // O backend deve preencher isso pelo token, mas o app pode mandar
}