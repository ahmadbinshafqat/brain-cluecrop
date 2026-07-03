import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { FlashcardSet } from './flashcards/entities/flashcard-set.entity';
import { Flashcard } from './flashcards/entities/flashcard.entity';
import { SourceChunk } from './flashcards/entities/source-chunk.entity';

async function seed() {
  const ds = new DataSource({ type: 'sqlite', database: process.env.DATABASE_PATH || './data/cluecrop.sqlite', entities: [FlashcardSet, Flashcard, SourceChunk], synchronize: true });
  await ds.initialize();
  const setRepo = ds.getRepository(FlashcardSet);
  if (await setRepo.count()) return ds.destroy();
  const set = await setRepo.save({ title: 'Sample: Learning Science', sourceText: 'Spaced repetition is a study technique that schedules reviews over increasing intervals. Retrieval practice strengthens memory because learners actively recall information instead of rereading it. Interleaving mixes related problem types so students learn to choose the right strategy.' });
  await ds.getRepository(Flashcard).save([
    { setId: set.id, question: 'What is spaced repetition?', answer: 'Spaced repetition is a study technique that schedules reviews over increasing intervals.', score: 5, order: 1 },
    { setId: set.id, question: 'Why is retrieval practice important?', answer: 'Retrieval practice strengthens memory because learners actively recall information instead of rereading it.', score: 4.8, order: 2 },
  ]);
  await ds.destroy();
}
seed();
