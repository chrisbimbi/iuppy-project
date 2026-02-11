
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';
import { SpaceEntity } from '../spaces/space.entity';
import { UserSpaceEntity } from '../spaces/user-space.entity';

async function assignUserSpaces() {
    try {
        await AppDataSource.initialize();

        const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982'; // Iuppy Tech
        const phone = '12345678910';

        const user = await AppDataSource.getRepository(UserEntity).findOne({ where: { phone } });
        if (!user) {
            console.log('User Chris not found');
            return;
        }

        const spaces = await AppDataSource.getRepository(SpaceEntity).find({ where: { companyId } });
        const userSpaceRepo = AppDataSource.getRepository(UserSpaceEntity);

        for (const space of spaces) {
            const exists = await userSpaceRepo.findOne({ where: { userId: user.id, spaceId: space.id } });
            if (!exists) {
                console.log(`Assigning Chris to space: ${space.name}`);
                await userSpaceRepo.save({
                    userId: user.id,
                    spaceId: space.id,
                    companyId: companyId,
                    role: 'member', // Default role
                    isPrimary: space.slug === 'geral'
                });
            } else {
                console.log(`Chris already in space: ${space.name}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}

assignUserSpaces();
