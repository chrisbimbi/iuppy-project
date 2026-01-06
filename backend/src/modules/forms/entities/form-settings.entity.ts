import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('form_notification_setting')
@Index(['companyId', 'spaceId'], { unique: true })
export class FormNotificationSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  companyId: string;

  @Column('text')
  spaceId: string;

  // lista de e-mails separados por vírgula
  @Column('text', { default: '' })
  emails: string;
}
