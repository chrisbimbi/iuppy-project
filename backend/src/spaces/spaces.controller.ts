// backend/src/spaces/spaces.controller.ts
import { Controller, Get, Query, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SpaceEntity } from './space.entity';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) { }

  // GET /spaces?companyId=xxx
  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.spacesService.findAll(companyId);
  }

  @Get()
  find(
    @Query('companyId') companyId?: string,
  ): Promise<SpaceEntity[]> {
    return this.spacesService.findByCompany(companyId);
  }

  @Post()
  create(@Body() dto: CreateSpaceDto) {
    return this.spacesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSpaceDto) {
    return this.spacesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spacesService.remove(id);
  }
}
