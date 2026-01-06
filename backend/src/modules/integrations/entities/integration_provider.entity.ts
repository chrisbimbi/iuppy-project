import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AuthFlowType {
    OAUTH2_CC_MTLS = 'oauth2_cc_mtls',
    OAUTH2_CC = 'oauth2_cc',
    JWT_BEARER = 'jwt_bearer',
    BASIC_CERT = 'basic_cert',
    API_KEY = 'api_key',
}

@Entity('integration_providers')
export class IntegrationProvider {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string; // adp, sap-sf, totvs-protheus, etc.

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: AuthFlowType,
        default: AuthFlowType.OAUTH2_CC
    })
    auth_flow: AuthFlowType;

    @Column('simple-array', { nullable: true })
    default_scopes: string[];

    @Column({ nullable: true })
    api_version: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
