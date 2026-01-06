import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('news_acknowledgment')
@Index(['newsId', 'userId'], { unique: true })
export class NewsAcknowledgmentEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    @Index()
    newsId!: string;

    @Column('uuid')
    @Index()
    userId!: string;

    @Column('uuid')
    @Index()
    companyId!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;
}
