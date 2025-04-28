import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel } from './channel.entity';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
  ) {}

  /* ------------------------------------------------- */
  /* CRUD                                              */
  /* ------------------------------------------------- */
  create(dto: CreateChannelDto) {
    const channel = this.channelRepository.create(dto);
    return this.channelRepository.save(channel);
  }

  findByCompanyAndSpace(companyId: string, spaceId?: string) {
    const qb = this.channelRepository
      .createQueryBuilder('c')
      .where('c."companyId" = :companyId', { companyId });

    if (spaceId) {
      // usa snake_case real da coluna
      qb.andWhere(':spaceId = ANY(c."space_ids")', { spaceId });
    }

    return qb.orderBy('c."name"', 'ASC').getMany();
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
}
