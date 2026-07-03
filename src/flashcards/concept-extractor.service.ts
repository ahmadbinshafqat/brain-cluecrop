import { Injectable } from '@nestjs/common';

type GeneratedCard = { question: string; answer: string; score: number };
type GeneratedChunk = { text: string; embeddingRef: string };

const STOPWORDS = new Set(['the','and','for','with','that','this','from','are','was','were','will','would','could','should','into','about','after','before','because','between','their','there','these','those','then','than','have','has','had','not','but','you','your','they','them','his','her','its','our','can','also','when','where','what','which','while','over','under','more','most','such','each','may','use','used','using','very','one','two','all','any','how']);

@Injectable()
export class ConceptExtractorService {
  generate(sourceText: string): { cards: GeneratedCard[]; chunks: GeneratedChunk[] } {
    const sentences = this.sentences(sourceText);
    const termCounts = this.globalTermCounts(sentences);
    const ranked = sentences
      .map((text) => ({ text, score: this.scoreSentence(text, termCounts), terms: this.terms(text) }))
      .filter((item) => item.terms.length > 0 && item.text.length > 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const chunks = ranked.map((item) => ({ text: item.text, embeddingRef: JSON.stringify(this.hashVector(item.terms)) }));
    const cards = ranked.map((item) => this.cardFromSentence(item.text, item.score, termCounts));
    return { cards, chunks };
  }

  suggestTitle(text: string): string {
    const first = this.sentences(text)[0] || 'Untitled Study Set';
    const cleaned = first.replace(/^[#\-\s]+/, '').slice(0, 70).trim();
    return cleaned.length > 8 ? cleaned : 'Untitled Study Set';
  }

  private sentences(text: string): string[] {
    return text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private terms(text: string): string[] {
    return text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g)?.filter((t) => !STOPWORDS.has(t)) || [];
  }

  private globalTermCounts(sentences: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const sentence of sentences) {
      for (const term of new Set(this.terms(sentence))) counts.set(term, (counts.get(term) || 0) + 1);
    }
    return counts;
  }

  private scoreSentence(sentence: string, counts: Map<string, number>): number {
    const terms = this.terms(sentence);
    const repeated = terms.reduce((sum, term) => sum + (counts.get(term) || 0), 0);
    const lengthBonus = Math.min(sentence.length / 180, 1.5);
    const definitionBonus = /\b(is|are|means|refers to|defined as|because|therefore|enables|causes)\b/i.test(sentence) ? 3 : 0;
    return Number((repeated / Math.max(terms.length, 1) + lengthBonus + definitionBonus).toFixed(3));
  }

  private cardFromSentence(sentence: string, score: number, counts: Map<string, number>): GeneratedCard {
    const significant = this.terms(sentence).sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0))[0] || 'concept';
    const answer = sentence.replace(/^[\-•\d.)\s]+/, '').trim();
    let question: string;
    const defMatch = answer.match(/^(.{3,60}?)\s+(is|are|means|refers to)\s+(.+)/i);
    if (defMatch) {
      question = `What ${defMatch[2].toLowerCase()} ${defMatch[1].trim()}?`;
    } else if (/because|therefore|causes|enables/i.test(answer)) {
      question = `Why is ${significant} important in this topic?`;
    } else {
      question = `What should you remember about ${significant}?`;
    }
    return { question, answer, score };
  }

  private hashVector(terms: string[]): Record<string, number> {
    const vector: Record<string, number> = {};
    for (const term of terms) {
      const bucket = `b${this.hash(term) % 32}`;
      vector[bucket] = (vector[bucket] || 0) + 1;
    }
    const norm = Math.sqrt(Object.values(vector).reduce((s, v) => s + v * v, 0)) || 1;
    for (const key of Object.keys(vector)) vector[key] = Number((vector[key] / norm).toFixed(4));
    return vector;
  }

  private hash(value: string): number {
    let h = 0;
    for (let i = 0; i < value.length; i++) h = Math.imul(31, h) + value.charCodeAt(i) | 0;
    return Math.abs(h);
  }
}
