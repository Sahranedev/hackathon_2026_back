import { Injectable } from '@nestjs/common';
import { MistralProvider } from './providers/mistral.provider';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class AiService {
  constructor(private readonly mistral: MistralProvider) {}

  private getProvider(provider: string): AiProvider {
    switch (provider) {
      case 'mistral':
      default:
        return this.mistral;
    }
  }

  async chat(params: {
    provider: 'mistral';
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    model: string;
    temperature?: number;
  }) {
    const provider = this.getProvider(params.provider);

    return provider.chat({
      messages: params.messages,
      model: params.model,
      temperature: params.temperature,
    });
  }
}
