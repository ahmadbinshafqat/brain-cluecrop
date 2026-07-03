import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlashcardSet } from './entities/flashcard-set.entity';
import { Flashcard } from './entities/flashcard.entity';
import { SourceChunk } from './entities/source-chunk.entity';
import { ConceptExtractorService } from './concept-extractor.service';
import { GenerateFlashcardsDto, UpdateFlashcardSetDto } from './dto';

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectRepository(FlashcardSet) private sets: Repository<FlashcardSet>,
    @InjectRepository(Flashcard) private cards: Repository<Flashcard>,
    @InjectRepository(SourceChunk) private chunks: Repository<SourceChunk>,
    private extractor: ConceptExtractorService,
  ) {}

  list() {
    return this.sets.find({ select: ['id', 'title', 'createdAt'], order: { createdAt: 'DESC' } });
  }

  get(id: number) {
    return this.sets.findOne({
      where: { id },
      relations: ['flashcards', 'chunks'],
      order: { flashcards: { order: 'ASC' }, chunks: { id: 'ASC' } },
    });
  }

  async generate(dto: GenerateFlashcardsDto) {
    const generated = this.extractor.generate(dto.sourceText);
    const title = dto.title?.trim() || this.extractor.suggestTitle(dto.sourceText);
    const set = await this.sets.save(this.sets.create({ title, sourceText: dto.sourceText }));

    await this.chunks.save(generated.chunks.map((chunk) => this.chunks.create({ ...chunk, setId: set.id })));
    await this.cards.save(generated.cards.map((card, index) => this.cards.create({ ...card, order: index + 1, setId: set.id })));
    return this.get(set.id);
  }

  async update(id: number, dto: UpdateFlashcardSetDto) {
    const set = await this.get(id);
    if (!set) throw new NotFoundException('Flashcard set not found');
    await this.sets.update(id, { title: dto.title.trim() });
    await this.cards.delete({ setId: id });
    await this.cards.save(dto.flashcards.map((card, index) => this.cards.create({
      setId: id,
      question: card.question.trim(),
      answer: card.answer.trim(),
      score: card.score ?? 0,
      order: card.order || index + 1,
    })));
    return this.get(id);
  }

  async remove(id: number) {
    await this.sets.delete(id);
    return { ok: true };
  }
}
