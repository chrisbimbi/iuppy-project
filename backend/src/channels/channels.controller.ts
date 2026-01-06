import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './channel.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  getAll(
    @Query('companyId', new ParseUUIDPipe()) companyId: string,
    @Query('spaceId') spaceId?: string,
  ): Promise<Channel[]> {
    return this.channelsService.findByCompanyAndSpace(companyId, spaceId);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.channelsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, updateChannelDto);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.channelsService.remove(id);
  }

  /** Novo endpoint para reordenar canais globalmente */
  @Post('order')
  async reorder(
    @Body('companyId', new ParseUUIDPipe()) companyId: string,
    @Body('channelIds') channelIds: string[],
  ) {
    await this.channelsService.reorderChannels(companyId, channelIds);
    return { success: true };
  }
}
