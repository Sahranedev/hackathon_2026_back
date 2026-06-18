export interface AiProvider {
  name: string;

  chat(input: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    model?: string;
    temperature?: number;
  }): Promise<string>;
}
