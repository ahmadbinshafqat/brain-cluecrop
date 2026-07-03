import { IsArray, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateFlashcardsDto {
  @IsString()
  @MinLength(40)
  sourceText: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;
}

export class UpdateFlashcardDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @MinLength(3)
  question: string;

  @IsString()
  @MinLength(1)
  answer: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsNumber()
  order: number;
}

export class UpdateFlashcardSetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateFlashcardDto)
  flashcards: UpdateFlashcardDto[];
}
