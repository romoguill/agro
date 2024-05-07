import { Exclude } from 'class-transformer';
import { IsNotEmpty, ValidateIf } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  googleId: string;

  @ValidateIf((entity) => entity.googleId !== null)
  @IsNotEmpty()
  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ nullable: true, type: String })
  refreshToken?: string | null;
}
