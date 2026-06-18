export class AiTimeoutError extends Error {
  constructor() {
    super('AI request timed out');
    this.name = 'AiTimeoutError';
  }
}
