import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialModule1733940000000 implements MigrationInterface {
    name = 'AddSocialModule1733940000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Social Post
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "social_posts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyId" character varying NOT NULL,
                "channelId" character varying NOT NULL,
                "authorId" uuid NOT NULL,
                "content" text NOT NULL,
                "media" jsonb NOT NULL DEFAULT '[]',
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "reactionsCount" integer NOT NULL DEFAULT 0,
                "commentsCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "publishedAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_social_posts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_social_posts_company_channel" ON "social_posts" ("companyId", "channelId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_social_posts_company_author" ON "social_posts" ("companyId", "authorId")`);

        // Social Comment
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "social_comments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyId" character varying NOT NULL,
                "postId" uuid NOT NULL,
                "authorId" uuid NOT NULL,
                "content" text NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_social_comments" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_social_comments_post" ON "social_comments" ("postId")`);

        // Social Reaction
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "social_reactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyId" character varying NOT NULL,
                "postId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL DEFAULT 'LIKE',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_social_reactions" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_social_reactions_unique" ON "social_reactions" ("postId", "userId", "type")`);

        // Social Interaction Event
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "social_interaction_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "companyId" character varying NOT NULL,
                "postId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_social_interaction_events" PRIMARY KEY ("id")
            )
        `);

        // Foreign Keys
        await queryRunner.query(`
            ALTER TABLE "social_posts" 
            ADD CONSTRAINT "FK_social_posts_author" 
            FOREIGN KEY ("authorId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "social_comments" 
            ADD CONSTRAINT "FK_social_comments_post" 
            FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "social_comments" 
            ADD CONSTRAINT "FK_social_comments_author" 
            FOREIGN KEY ("authorId") REFERENCES "user_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "social_reactions" 
            ADD CONSTRAINT "FK_social_reactions_post" 
            FOREIGN KEY ("postId") REFERENCES "social_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "social_reactions" 
            ADD CONSTRAINT "FK_social_reactions_user" 
            FOREIGN KEY ("userId") REFERENCES "user_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_reactions" DROP CONSTRAINT IF EXISTS "FK_social_reactions_user"`);
        await queryRunner.query(`ALTER TABLE "social_reactions" DROP CONSTRAINT IF EXISTS "FK_social_reactions_post"`);
        await queryRunner.query(`ALTER TABLE "social_comments" DROP CONSTRAINT IF EXISTS "FK_social_comments_author"`);
        await queryRunner.query(`ALTER TABLE "social_comments" DROP CONSTRAINT IF EXISTS "FK_social_comments_post"`);
        await queryRunner.query(`ALTER TABLE "social_posts" DROP CONSTRAINT IF EXISTS "FK_social_posts_author"`);

        await queryRunner.query(`DROP TABLE "social_interaction_events"`);
        await queryRunner.query(`DROP TABLE "social_reactions"`);
        await queryRunner.query(`DROP TABLE "social_comments"`);
        await queryRunner.query(`DROP TABLE "social_posts"`);
    }
}
