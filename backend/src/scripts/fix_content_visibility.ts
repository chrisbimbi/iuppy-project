
import { AppDataSource } from '../config/data-source';
import { FormEntity } from '../modules/forms/entities/form.entity';
import { JourneyEntity } from '../modules/journeys/entities/journey.entity';
import { SpaceEntity } from '../spaces/space.entity';

async function fixContentVisibility() {
    try {
        await AppDataSource.initialize();

        const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982'; // Iuppy Tech (on port 5433)
        const spaces = await AppDataSource.getRepository(SpaceEntity).find({ where: { companyId } });
        const spaceIds = spaces.map(s => s.id);

        if (spaceIds.length === 0) {
            console.log('No spaces found for company.');
            return;
        }

        console.log('Found Spaces:', spaceIds);

        // 1. Fix Forms
        // Set audienceSpaceIds to ALL spaces so they appear everywhere
        await AppDataSource.createQueryBuilder()
            .update(FormEntity)
            .set({ audienceSpaceIds: spaceIds })
            .where("companyId = :companyId", { companyId })
            .execute();

        console.log('✅ Forms updated to be visible in all spaces.');

        // 2. Fix Journeys
        const geralSpace = spaces.find(s => s.slug === 'geral') || spaces[0];
        // Assign to Geral space
        await AppDataSource.createQueryBuilder()
            .update(JourneyEntity)
            .set({ spaceId: geralSpace.id })
            .where("companyId = :companyId", { companyId })
            .execute();

        console.log(`✅ Journeys assigned to space: ${geralSpace.name} (${geralSpace.id})`);

    } catch (e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}

fixContentVisibility();
