export type ScaleSource = 'manual' | 'ai-palette' | 'image' | 'ai-variant' | 'algo-variant';

export interface ColorScale {
  id: string;
  name: string;
  baseColor: string;
  steps: Record<number, string>; // 50, 100, ... 950
  source: ScaleSource;
}

export type VariantType = 'dark' | 'light';

export interface GeminiResponse {
  colors?: string[];
  explanation?: string;
}