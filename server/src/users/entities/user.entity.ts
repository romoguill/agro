import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: false })
  password: string;

  @Column({ default: 'user' })
  role: string;
}
