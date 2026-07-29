import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { GenerateFlashcardsDto, UpdateFlashcardSetDto } from './dto';
import { FlashcardsService, FlashcardSetListSort } from './flashcards.service';

@Controller('api/flashcard-sets')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('sort') sort?: FlashcardSetListSort,
    @Query('minCards') minCards?: string,
  ) {
    return this.flashcardsService.list({
      q,
      sort,
      minCards: minCards ? Number(minCards) : undefined,
    });
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.flashcardsService.get(id);
  }

  @Post('generate')
  generate(@Body() dto: GenerateFlashcardsDto) {
    return this.flashcardsService.generate(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFlashcardSetDto,
  ) {
    return this.flashcardsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.flashcardsService.remove(id);
  }
}
