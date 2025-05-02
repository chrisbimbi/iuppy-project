import { 
    Controller, Get, Post, Put, Delete, 
    Param, Body, Query, ParseUUIDPipe 
  } from '@nestjs/common';
  import { GroupsService } from './groups.service';
  import { CreateGroupDto } from './dto/create-group.dto';
  import { UpdateGroupDto } from './dto/update-group.dto';
  import { UserGroup } from '@shared/types';
  
  @Controller('groups')
  export class GroupsController {
    constructor(private readonly svc: GroupsService) {}
  
    @Get()
    findAll(@Query('companyId', ParseUUIDPipe) companyId: string): Promise<UserGroup[]> {
      return this.svc.findAll(companyId);
    }
  
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserGroup> {
      return this.svc.findOne(id);
    }
  
    @Post()
    create(@Body() dto: CreateGroupDto): Promise<UserGroup> {
      return this.svc.create(dto);
    }
  
    @Put(':id')
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateGroupDto
    ): Promise<UserGroup> {
      return this.svc.update(id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
      return this.svc.remove(id);
    }
  }