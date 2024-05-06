import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Exclude({ toPlainOnly: true })
  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true, type: String })
  refreshToken?: string | null;
}
