import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import { AiProvider } from '../ai-provider.interface';
import { withTimeout } from '../utils/with-timeout';

const DEFAULT_TIMEOUT_MS = 60_000;

@Injectable()
export class MistralProvider implements AiProvider {
  name = 'mistral';

  constructor(private readonly config: ConfigService) {}

  async chat(input: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    model: string;
    temperature?: number;
  }): Promise<string> {
    const apiKey = this.config.get<string>('MISTRAL_API_KEY');
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not configured');
    }

    const timeoutMs = Number(
      this.config.get<string>('MISTRAL_TIMEOUT_MS') ?? DEFAULT_TIMEOUT_MS,
    );

    const client = new Mistral({ apiKey });

    const response = await withTimeout(
      client.chat.complete({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature,
      }),
      timeoutMs,
    );

    const content = response?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Mistral returned no text content');
    }

    return content;
  }
}
