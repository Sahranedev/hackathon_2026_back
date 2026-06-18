import {
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { getDeduplicationKey } from 'src/tires/utils/tire-recommendation';
import { AiService } from './ai.service';
import { AiTimeoutError } from './errors/ai-timeout.error';
import {
  tireRecommendationPrompt,
  toCompactTireCatalogEntry,
} from './prompts/tire-recommendation.prompt';
import { AiTireRecommendationResponse } from './types/ai-tire-recommendation.type';

const DEFAULT_MISTRAL_MODEL = 'mistral-small-latest';
const MAX_RECOMMENDATIONS = 5;

type AiRecommendationItem = {
  id: number;
  reason: string;
};

@Injectable()
export class TireRecommendationAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async recommendFromPrompt(
    prompt: string,
  ): Promise<AiTireRecommendationResponse> {
    const trimmedPrompt = prompt?.trim();
    if (!trimmedPrompt) {
      throw new BadRequestException('Le prompt est requis.');
    }

    const catalog = await this.prisma.tireData.findMany({
      orderBy: { id: 'asc' },
    });

    if (catalog.length === 0) {
      throw new BadRequestException('Aucun pneu disponible dans le catalogue.');
    }

    const messages = tireRecommendationPrompt(
      trimmedPrompt,
      catalog.map(toCompactTireCatalogEntry),
    );

    let rawResponse: string;
    try {
      rawResponse = await this.ai.chat({
        provider: 'mistral',
        messages,
        model: process.env.MISTRAL_MODEL ?? DEFAULT_MISTRAL_MODEL,
        temperature: 0.2,
      });
    } catch (error) {
      if (error instanceof AiTimeoutError) {
        throw new GatewayTimeoutException(
          "L'analyse IA a pris trop de temps. Réessayez dans quelques instants.",
        );
      }

      throw new ServiceUnavailableException(
        "Le service d'analyse IA est temporairement indisponible.",
      );
    }

    const aiItems = this.parseAiRecommendations(rawResponse);
    const recommendations = this.mapToRecommendations(aiItems, catalog);

    if (recommendations.length === 0) {
      throw new InternalServerErrorException(
        "L'IA n'a pas pu produire de recommandations valides.",
      );
    }

    return { recommendations };
  }

  private parseAiRecommendations(raw: string): AiRecommendationItem[] {
    const jsonText = this.extractJsonArray(raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText) as unknown;
    } catch {
      throw new InternalServerErrorException(
        'Réponse IA invalide : JSON non parseable.',
      );
    }

    if (!Array.isArray(parsed)) {
      throw new InternalServerErrorException(
        'Réponse IA invalide : tableau attendu.',
      );
    }

    return parsed
      .map((item) => {
        if (
          typeof item !== 'object' ||
          item === null ||
          !('id' in item) ||
          !('reason' in item)
        ) {
          return null;
        }

        const id = Number((item as AiRecommendationItem).id);
        const reason = String((item as AiRecommendationItem).reason).trim();

        if (!Number.isInteger(id) || id <= 0 || !reason) {
          return null;
        }

        return { id, reason };
      })
      .filter((item): item is AiRecommendationItem => item !== null);
  }

  private extractJsonArray(raw: string): string {
    const trimmed = raw.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return fenced ? fenced[1].trim() : trimmed;
  }

  private mapToRecommendations(
    aiItems: AiRecommendationItem[],
    catalog: TireData[],
  ) {
    const catalogById = new Map(catalog.map((tire) => [tire.id, tire]));
    const deduped = new Map<string, AiRecommendationItem>();

    for (const item of aiItems) {
      const tire = catalogById.get(item.id);
      if (!tire) {
        continue;
      }

      const key = getDeduplicationKey(tire);
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    }

    return Array.from(deduped.values())
      .slice(0, MAX_RECOMMENDATIONS)
      .map((item) => {
        const tire = catalogById.get(item.id)!;
        return {
          id: tire.id,
          model: tire.model,
          reason: item.reason,
          terrainTypes: tire.terrainTypes,
          usageType: tire.usageType,
          familyName: tire.familyName,
          productRange: tire.productRange,
          performanceProfiles: tire.performanceProfiles,
        };
      });
  }
}
