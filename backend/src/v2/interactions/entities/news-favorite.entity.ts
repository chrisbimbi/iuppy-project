import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    Unique,
} from 'typeorm';

@Entity('news_favorite')
@Index(['companyId', 'userId'])
@Unique('uniq_user_favorite_news', ['companyId', 'newsId', 'userId'])
export class NewsFavoriteEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    companyId!: string;

    @Column('uuid')
    newsId!: string;

    @Column('uuid')
    userId!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}
