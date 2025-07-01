import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Channel } from './channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel) private readonly channelRepository: Repository<Channel>,
    private readonly dataSource: DataSource,
  ) {}

  create(dto: CreateChannelDto) {
    const channel = this.channelRepository.create(dto);
    return this.channelRepository.save(channel);
  }

  findByCompanyAndSpace(companyId: string, spaceId?: string) {
    const qb = this.channelRepository
      .createQueryBuilder('c')
      .where('c."companyId" = :companyId', { companyId });

    if (spaceId) {
      qb.andWhere(':spaceId = ANY(c."space_ids")', { spaceId });
    }

    // ordena pela posição antes do nome
    return qb
      .orderBy('c."position"', 'ASC')
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

  /** Persistir nova ordem global dos canais */
  async reorderChannels(companyId: string, channelIds: string[]) {
    for (let idx = 0; idx < channelIds.length; idx++) {
      await this.channelRepository.update(
        { id: channelIds[idx], companyId },
        { position: idx },
      );
    }
  }
}