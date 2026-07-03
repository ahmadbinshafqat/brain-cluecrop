import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';
import { FlashcardSet } from './entities/flashcard-set.entity';
import { Flashcard } from './entities/flashcard.entity';
import { SourceChunk } from './entities/source-chunk.entity';
import { ConceptExtractorService } from './concept-extractor.service';

@Module({
  imports: [TypeOrmModule.forFeature([FlashcardSet, Flashcard, SourceChunk])],
  controllers: [FlashcardsController],
  providers: [FlashcardsService, ConceptExtractorService],
})
export class FlashcardsModule {}
