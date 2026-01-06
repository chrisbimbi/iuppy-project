import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { UsersService } from '../../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../users/user.entity';
import { Repository } from 'typeorm';

@Controller('gamification')
export class GamificationController {
    constructor(
        @InjectRepository(UserEntity)
        private userRepo: Repository<UserEntity>,
    ) { }

    @UseGuards(JwtAccessGuard)
    @Get('leaderboard')
    async getLeaderboard(@Query('limit') limit = 10) {
        const users = await this.userRepo.find({
            order: { xp: 'DESC' },
            take: limit,
            select: ['id', 'name', 'avatarUrl', 'xp', 'department', 'jobTitle'],
        });

        // Calculate level for each user (same logic as mobile)
        return users.map(u => ({
            ...u,
            level: this.getLevelFromXP(u.xp)
        }));
    }

    private getLevelFromXP(xp: number): number {
        const thresholds = {
            1: 0, 2: 100, 3: 250, 4: 500, 5: 1000,
            6: 2000, 7: 3500, 8: 5500, 9: 8000, 10: 12000
        };
        let level = 1;
        for (const [lvl, threshold] of Object.entries(thresholds)) {
            if (xp >= threshold) level = Number(lvl);
            else break;
        }
        return level;
    }
}
