import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FlashcardSet } from './flashcards/entities/flashcard-set.entity';
import { Flashcard } from './flashcards/entities/flashcard.entity';
import { SourceChunk } from './flashcards/entities/source-chunk.entity';
import { FlashcardsModule } from './flashcards/flashcards.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', 'public') }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH || './data/cluecrop.sqlite',
      entities: [FlashcardSet, Flashcard, SourceChunk],
      synchronize: true,
    }),
    FlashcardsModule,
  ],
})
export class AppModule {}
