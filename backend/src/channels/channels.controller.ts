// backend/src/channels/channels.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Channel } from './channel.entity';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) { }

  @Post()
  async create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  getAll(@Query('companyId') companyId: string,
    @Query('spaceId') spaceId?: string) {
    return this.channelsService.findByCompanyAndSpace(companyId, spaceId)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelsService.update(id, updateChannelDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.channelsService.remove(id);
  }
}