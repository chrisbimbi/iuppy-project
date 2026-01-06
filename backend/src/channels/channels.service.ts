import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Channel } from './channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private readonly dataSource: DataSource,
  ) {}

  create(dto: CreateChannelDto) {
    const channel = this.channelRepository.create(dto);
    return this.channelRepository.save(channel);
  }

  /**
   * Lista canais publicados de uma company e, opcionalmente, filtrados por spaceId
   * - Mantém o comportamento: somente publicados (COALESCE(is_published, true))
   * - Usa :spaceId = ANY(c."space_ids") para filtrar arrays
   * - Ordena por posição (NULLS LAST) e depois por nome ASC
   */
  async findByCompanyAndSpace(companyId: string, spaceId?: string) {
    const qb = this.channelRepository
      .createQueryBuilder('c')
      .where('c."companyId" = :companyId', { companyId })
      .andWhere('COALESCE(c."is_published", true) = true');

    if (spaceId) {
      // robusto: compara texto com texto e força o array para text[]
      qb.andWhere(':spaceId::text = ANY(c."space_ids"::text[])', { spaceId });
    }

    // Forçar NULLS LAST de forma portável:
    // 1) primeiro ordena por "c.position IS NULL" (false < true) => não-nulos vêm antes
    // 2) depois por "c.position" ASC
    // 3) depois por "c.name" ASC
    return qb
      .orderBy('c."position" IS NULL', 'ASC')
      .addOrderBy('c."position"', 'ASC')
      .addOrderBy('c."name"', 'ASC')
      .getMany();
  }

  findOne(id: string) {
    return this.channelRepository.findOneBy({ id });
  }

  async update(id: string, dto: UpdateChannelDto) {
    await this.channelRepository.update(id, dto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.channelRepository.delete(id);
  }

  /**
   * Persiste a nova ordem global dos canais.
   * Faz em transação e em lote (CASE WHEN) para reduzir I/O.
   */
  async reorderChannels(companyId: string, channelIds: string[]) {
    if (!Array.isArray(channelIds) || channelIds.length === 0) return;

    await this.dataSource.transaction(async (manager) => {
      // Monta um UPDATE com CASE WHEN para todos de uma vez
      const cases = channelIds
        .map((id, idx) => `WHEN id = '${id.replace(/'/g, "''")}' THEN ${idx}`)
        .join(' ');
      const idsList = channelIds
        .map((id) => `'${id.replace(/'/g, "''")}'`)
        .join(',');

      await manager.query(
        `
        UPDATE "channel"
           SET "position" = CASE ${cases} ELSE "position" END
         WHERE "companyId" = $1
           AND id IN (${idsList})
        `,
        [companyId],
      );
    });
  }
}
