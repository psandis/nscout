export interface ProviderAdapter {
  readonly name: string;
  isAvailable(): boolean;
  complete(prompt: string, limit: number): Promise<string[]>;
}
