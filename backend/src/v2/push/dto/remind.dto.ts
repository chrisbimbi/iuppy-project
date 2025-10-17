import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator'

export class RemindDto {
  @ApiPropertyOptional({ description: 'Reenviar apenas para quem NÃO abriu', default: true })
  @IsOptional()
  @IsBoolean()
  onlyNotOpened?: boolean = true

  @ApiPropertyOptional({
    description:
      'Filtra quem não abriu em X horas desde a entrega do push (usa deliveredAt/open). Ex.: 4 = >=4h sem abrir após entrega.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minHoursSinceDelivery?: number
}
