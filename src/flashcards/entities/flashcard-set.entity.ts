import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Flashcard } from './flashcard.entity';
import { SourceChunk } from './source-chunk.entity';

@Entity()
export class FlashcardSet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  sourceText: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Flashcard, (card) => card.set, { cascade: true })
  flashcards: Flashcard[];

  @OneToMany(() => SourceChunk, (chunk) => chunk.set, { cascade: true })
  chunks: SourceChunk[];
}
