import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConceptExtractorService } from './concept-extractor.service';
import { GenerateFlashcardsDto, UpdateFlashcardSetDto } from './dto';
import { FlashcardSet } from './entities/flashcard-set.entity';
import { Flashcard } from './entities/flashcard.entity';
import { SourceChunk } from './entities/source-chunk.entity';

export type FlashcardSetListSort = 'recent' | 'oldest' | 'title' | 'cards';

export interface FlashcardSetListOptions {
  q?: string;
  sort?: FlashcardSetListSort;
  minCards?: number;
}

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectRepository(FlashcardSet)
    private readonly setRepository: Repository<FlashcardSet>,
    @InjectRepository(Flashcard)
    private readonly flashcardRepository: Repository<Flashcard>,
    @InjectRepository(SourceChunk)
    private readonly chunkRepository: Repository<SourceChunk>,
    private readonly conceptExtractor: ConceptExtractorService,
  ) {}

  async list(options: FlashcardSetListOptions = {}) {
    const q = (options.q || '').trim().toLowerCase();
    const sort = this.normalizeSort(options.sort);
    const minCards = Number.isFinite(options.minCards)
      ? Math.max(0, Math.floor(options.minCards as number))
      : 0;

    const sets = await this.setRepository.find({
      relations: ['flashcards'],
      order: { updatedAt: 'DESC' },
    });

    let filtered = sets;

    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((set) => {
        const haystack = [
          set.title,
          (set as any).sourceText,
          ...(set.flashcards || []).flatMap((card) => [card.question, card.answer]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return terms.every((term) => haystack.includes(term));
      });
    }

    if (minCards > 0) {
      filtered = filtered.filter((set) => (set.flashcards || []).length >= minCards);
    }

    filtered.sort((a, b) => {
      if (sort === 'oldest') {
        return this.dateValue(a.updatedAt) - this.dateValue(b.updatedAt);
      }
      if (sort === 'title') {
        return (a.title || '').localeCompare(b.title || '', undefined, {
          sensitivity: 'base',
        });
      }
      if (sort === 'cards') {
        return (b.flashcards || []).length - (a.flashcards || []).length;
      }
      return this.dateValue(b.updatedAt) - this.dateValue(a.updatedAt);
    });

    return filtered.map((set) => ({
      id: set.id,
      title: set.title,
      createdAt: set.createdAt,
      updatedAt: set.updatedAt,
      cardCount: (set.flashcards || []).length,
    }));
  }

  async get(id: number) {
    const set = await this.setRepository.findOne({
      where: { id },
      relations: ['flashcards', 'chunks'],
      order: {
        flashcards: { rank: 'ASC' },
        chunks: { rank: 'ASC' },
      } as any,
    });

    if (!set) {
      throw new NotFoundException(`Flashcard set ${id} not found`);
    }

    return set;
  }

  async generate(dto: GenerateFlashcardsDto) {
    const sourceText = dto.sourceText.trim();
    const extracted = this.conceptExtractor.extract(sourceText);

    const set = this.setRepository.create({
      title: dto.title?.trim() || extracted.title,
      sourceText,
    } as Partial<FlashcardSet>);

    const savedSet = await this.setRepository.save(set);

    const chunks = extracted.chunks.map((chunk) =>
      this.chunkRepository.create({
        flashcardSet: savedSet,
        text: chunk.text,
        rank: chunk.rank,
        keywords: chunk.keywords.join(', '),
        embeddingRef: chunk.embeddingRef,
      } as Partial<SourceChunk>),
    );
    await this.chunkRepository.save(chunks);

    const cards = extracted.flashcards.map((card) =>
      this.flashcardRepository.create({
        flashcardSet: savedSet,
        question: card.question,
        answer: card.answer,
        rank: card.rank,
      } as Partial<Flashcard>),
    );
    await this.flashcardRepository.save(cards);

    return this.get(savedSet.id);
  }

  async update(id: number, dto: UpdateFlashcardSetDto) {
    const set = await this.get(id);

    if (dto.title !== undefined) {
      set.title = dto.title.trim() || set.title;
    }

    if (Array.isArray(dto.flashcards)) {
      await this.flashcardRepository.delete({ flashcardSet: { id } } as any);
      const cards = dto.flashcards.map((card, index) =>
        this.flashcardRepository.create({
          flashcardSet: set,
          question: card.question,
          answer: card.answer,
          rank: index + 1,
        } as Partial<Flashcard>),
      );
      await this.flashcardRepository.save(cards);
    }

    await this.setRepository.save(set);
    return this.get(id);
  }

  async remove(id: number) {
    const set = await this.setRepository.findOne({ where: { id } });
    if (!set) {
      throw new NotFoundException(`Flashcard set ${id} not found`);
    }

    await this.setRepository.remove(set);
    return { ok: true };
  }

  private normalizeSort(sort?: FlashcardSetListSort): FlashcardSetListSort {
    if (sort === 'oldest' || sort === 'title' || sort === 'cards') {
      return sort;
    }
    return 'recent';
  }

  private dateValue(value: Date | string | undefined): number {
    if (!value) {
      return 0;
    }
    return new Date(value).getTime();
  }
}
