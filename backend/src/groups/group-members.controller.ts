import { Controller, Get, Post, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { GroupMembersService } from './group-members.service';
import { User } from '@shared/types';

@Controller('groups/:groupId/members')
export class GroupMembersController {
    constructor(private readonly svc: GroupMembersService) { }

    @Get()
    list(@Param('groupId', ParseUUIDPipe) groupId: string): Promise<User[]> {
        return this.svc.listMembers(groupId);
    }

    @Post()
    add(
        @Param('groupId', ParseUUIDPipe) groupId: string,
        @Body('userId', ParseUUIDPipe) userId: string,
    ): Promise<void> {
        return this.svc.addMember(groupId, userId);
    }

    @Delete(':userId')
    remove(
        @Param('groupId', ParseUUIDPipe) groupId: string,
        @Param('userId', ParseUUIDPipe) userId: string,
    ): Promise<void> {
        return this.svc.removeMember(groupId, userId);
    }
}