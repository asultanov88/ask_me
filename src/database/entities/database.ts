import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'database' })
export class DatabaseEntity {
  // Dummy class to make typeorm work with database stored procedures.
  @PrimaryGeneratedColumn()
  id: number;
}
