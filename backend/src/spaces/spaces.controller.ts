import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SpaceEntity } from './space.entity';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  async create(@Body() createSpaceDto: CreateSpaceDto): Promise<SpaceEntity> {
    return this.spacesService.create(createSpaceDto);
  }

  @Get()
  async findAll(): Promise<SpaceEntity[]> {
    return this.spacesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SpaceEntity> {
    return this.spacesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto): Promise<SpaceEntity> {
    return this.spacesService.update(id, updateSpaceDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.spacesService.remove(id);
  }
}