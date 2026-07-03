import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { GenerateFlashcardsDto, UpdateFlashcardSetDto } from './dto';

@Controller('api/flashcard-sets')
export class FlashcardsController {
  constructor(private readonly service: FlashcardsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  async get(@Param('id', ParseIntPipe) id: number) {
    const set = await this.service.get(id);
    if (!set) throw new NotFoundException('Flashcard set not found');
    return set;
  }

  @Post('generate')
  generate(@Body() dto: GenerateFlashcardsDto) {
    return this.service.generate(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFlashcardSetDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
