import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FlashcardSet } from './flashcard-set.entity';

@Entity()
export class Flashcard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  setId: number;

  @ManyToOne(() => FlashcardSet, (set) => set.flashcards, { onDelete: 'CASCADE' })
  set: FlashcardSet;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column('real')
  score: number;

  @Column()
  order: number;
}
