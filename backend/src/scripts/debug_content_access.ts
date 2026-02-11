
import { AppDataSource } from '../config/data-source';
import { UserEntity } from '../users/user.entity';
import { NewsEntity } from '../news/news.entity';
import { FormEntity } from '../modules/forms/entities/form.entity';
import { Channel } from '../channels/channel.entity';

async function debugAccess() {
    try {
        await AppDataSource.initialize();

        console.log('🔍 CHECKING USER CHRIS (12345678910)...');
        // Search by phone (checking various formats just in case)
        const chris = await AppDataSource.getRepository(UserEntity)
            .createQueryBuilder("user")
            .where("user.phone LIKE :phone", { phone: '%12345678910%' })
            .orWhere("user.displayName = :name", { name: 'Chris' })
            .getOne();

        if (chris) {
            console.log(`✅ FOUND User: ${chris.name} (ID: ${chris.id})\n   Company: ${chris.companyId}\n   Phone: ${chris.phone}\n   Groups: ${chris.groups}`);
        } else {
            console.log('❌ User with phone 12345678910 NOT FOUND in DB.');
        }

        console.log('\n📰 CHECKING NEWS ITEMS:');
        const news = await AppDataSource.getRepository(NewsEntity).find({
            relations: ['channel'],
            take: 5
        });
        news.forEach(n => {
            console.log(`- [${n.id}] ${n.title}`);
            console.log(`  Channel: ${n.channel?.name}`);
            console.log(`  Company: ${n.companyId}`);
            console.log(`  Published: ${n.publishedAt}`);
        });

        console.log('\n📝 CHECKING FORMS:');
        const forms = await AppDataSource.getRepository(FormEntity).find({
            take: 5
        });
        forms.forEach(f => {
            console.log(`- [${f.id}] ${f.title['pt-BR'] || JSON.stringify(f.title)}`);
            console.log(`  Status: ${f.status}`);
            console.log(`  Company: ${f.companyId}`);
            console.log(`  Audience Spaces: ${f.audienceSpaceIds}`);
            console.log(`  Visibility: ${f.visibility}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}

debugAccess();
