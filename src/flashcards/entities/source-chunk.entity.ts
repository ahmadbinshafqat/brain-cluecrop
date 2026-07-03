import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FlashcardSet } from './flashcard-set.entity';

@Entity()
export class SourceChunk {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  setId: number;

  @ManyToOne(() => FlashcardSet, (set) => set.chunks, { onDelete: 'CASCADE' })
  set: FlashcardSet;

  @Column('text')
  text: string;

  @Column('text')
  embeddingRef: string;
}
