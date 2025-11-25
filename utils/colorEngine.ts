import { 
  oklch, 
  formatHex, 
  interpolate, 
  wcagContrast, 
  Color 
} from 'culori';
import { ColorScale, VariantType, ScaleSource } from '../types';

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const TARGET_LUMINANCE: Record<number, number> = {
  50: 0.97,
  100: 0.94,
  200: 0.88,
  300: 0.80,
  400: 0.70,
  500: 0.60,
  600: 0.50,
  700: 0.40,
  800: 0.30,
  900: 0.20,
  950: 0.10
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const generateScale = (baseHex: string, name?: string, source: ScaleSource = 'manual'): ColorScale => {
  const baseObj = oklch(baseHex);
  
  if (!baseObj) {
    // Fallback if invalid hex
    console.warn("Invalid color passed to engine:", baseHex);
    return {
      id: generateId(),
      name: name || 'Invalid Scale',
      baseColor: '#000000',
      steps: STEPS.reduce((acc, step) => ({...acc, [step]: '#000000'}), {}),
      source
    };
  }

  const baseL = baseObj.l;

  let closestStep = 500;
  let minDiff = 1;

  for (const step of STEPS) {
    const diff = Math.abs(baseL - TARGET_LUMINANCE[step]);
    if (diff < minDiff) {
      minDiff = diff;
      closestStep = step;
    }
  }

  const white = oklch('#ffffff')!;
  const black = oklch('#000000')!;

  const createLightInterpolator = interpolate([white, baseObj], 'oklch');
  const createDarkInterpolator = interpolate([baseObj, black], 'oklch');

  const generatedSteps: Record<number, string> = {};

  STEPS.forEach(step => {
    if (step === closestStep) {
      generatedSteps[step] = formatHex(baseObj);
    } else if (step < closestStep) {
      const t = step / closestStep; 
      generatedSteps[step] = formatHex(createLightInterpolator(t));
    } else {
      const range = 1000 - closestStep;
      const progress = step - closestStep;
      const t = progress / range;
      generatedSteps[step] = formatHex(createDarkInterpolator(t));
    }
  });

  return {
    id: generateId(),
    name: name || `Scale ${formatHex(baseObj)}`,
    baseColor: formatHex(baseObj),
    steps: generatedSteps,
    source
  };
};

export const generateVariant = (baseHex: string, type: VariantType): string => {
  const color = oklch(baseHex);
  if (!color) return baseHex;

  let newColor: Color = { ...color };

  if (type === 'dark') {
    // For dark variants: 
    // 1. Drastically reduce lightness (aim for slate/charcoal vibes around 0.25)
    // 2. Reduce Chroma to avoid neon darks
    // 3. Hue Shift: slightly towards blue (270) for "cool" dark mode feel
    
    newColor.l = 0.25; 
    newColor.c = (newColor.c || 0) * 0.4;
    
    // Subtle cool shift if hue is defined
    if (newColor.h !== undefined) {
       // Pull hue slightly towards 270 (Blue)
       const dist = 270 - newColor.h;
       newColor.h += dist * 0.1; 
    }
  } else {
    // For light variants:
    // 1. High lightness
    // 2. Keep some chroma for pastel look, don't wash out completely
    newColor.l = 0.94;
    newColor.c = Math.min(0.1, (newColor.c || 0) * 0.8);
  }

  return formatHex(newColor);
};

export const getContrastColor = (hex: string): string => {
  const whiteContrast = wcagContrast(hex, '#ffffff');
  return whiteContrast >= 4.5 ? '#ffffff' : '#000000';
};