import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-2.5-flash as it is more stable for JSON tasks than flash-lite
const FAST_MODEL = 'gemini-2.5-flash';
const VISION_MODEL = 'gemini-3-pro-preview';

interface ColorResult {
  name: string;
  hex: string;
}

const cleanAndParseJSON = (text: string | undefined): any => {
    if (!text) return null;
    try {
        // Remove markdown code blocks if present (e.g. ```json ... ```)
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleaned);
    } catch (e) {
        // Fallback: Try to find a JSON object in the text using regex
        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (innerE) {
                return null;
            }
        }
        return null;
    }
};

/**
 * Analyzes an image to extract a dominant color palette using Gemini Pro Vision.
 */
export const extractColorsFromImage = async (base64Image: string): Promise<ColorResult[]> => {
  try {
    // Detect Mime Type
    const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = match ? match[1] : 'image/png';
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Extract the dominant color and 3 distinct accent colors from this image."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            colors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING }
                },
                required: ["name", "hex"]
              }
            }
          },
          required: ["colors"]
        }
      }
    });

    const parsed = cleanAndParseJSON(response.text);
    return parsed?.colors && Array.isArray(parsed.colors) ? parsed.colors : [];
  } catch (error) {
    console.error("Gemini Image Analysis Error:", error);
    throw error;
  }
};

/**
 * Asks Gemini for a quick color suggestion or explanation.
 */
export const askGeminiFast = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful UI/UX color expert. Keep answers very brief, concise, and practical."
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini Fast Text Error:", error);
    return "Sorry, I couldn't reach the AI at the moment.";
  }
};

/**
 * Asks Gemini to generate a palette based on a text description.
 */
export const generatePaletteFromText = async (description: string): Promise<ColorResult[]> => {
    try {
        const response = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: `Create a color palette of 5 distinct colors for: "${description}".`,
            config: {
                responseMimeType: "application/json",
                // Strict Schema definition ensures we get a JSON object with a 'palette' array
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    palette: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          hex: { type: Type.STRING }
                        },
                        required: ["name", "hex"]
                      }
                    }
                  },
                  required: ["palette"]
                }
            }
        });
        
        const text = response.text || "";
        const parsed = cleanAndParseJSON(text);
        
        if (parsed?.palette && Array.isArray(parsed.palette) && parsed.palette.length > 0) {
            return parsed.palette;
        }

        // --- Fallback Strategy (in case model ignores schema, though unlikely with 2.5-flash) ---
        const results: ColorResult[] = [];

        // 1. Try matching "Name: #HEX" or "**Name**: #HEX" patterns
        // Matches: * **Deep Plum:** `#3A1F4C` or Name: #3A1F4C
        const richRegex = /(?:^|\s|[*])(?:\*\*)?([^*:]+)(?:\*\*)?:\s*`?(#[0-9A-Fa-f]{6})`?/g;
        let match;
        while ((match = richRegex.exec(text)) !== null) {
            if (match[1] && match[2]) {
                const name = match[1].replace(/^\*+\s*/, '').trim(); // Clean leading bullets
                results.push({
                    name: name,
                    hex: match[2].toUpperCase()
                });
            }
        }

        if (results.length > 0) return results;

        // 2. Last resort: Just find HEX codes
        const hexMatches = text.match(/#[0-9A-Fa-f]{6}/g);
        if (hexMatches && hexMatches.length > 0) {
            return hexMatches.slice(0, 5).map((hex, i) => ({
                name: `Palette Color ${i + 1}`,
                hex: hex.toUpperCase()
            }));
        }

        return [];
    } catch (error) {
        console.error("Gemini Palette Generation Error", error);
        throw error;
    }
};

/**
 * Generates a specific variant using AI for better semantic matching.
 */
export const generateVariantWithAI = async (baseHex: string, type: 'dark' | 'light'): Promise<ColorResult> => {
  try {
    const prompt = type === 'dark' 
      ? `Create a "Dark Mode" UI background variant of ${baseHex}. It should be dark, desaturated, and have a slight cool hue shift if appropriate.`
      : `Create a "Light Mode" or pastel variant of ${baseHex}. High brightness, moderate saturation.`;

    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            hex: { type: Type.STRING }
          },
          required: ["name", "hex"]
        }
      }
    });

    const json = cleanAndParseJSON(response.text);
    return json?.hex ? json : { name: `${type} Variant`, hex: baseHex };
  } catch (error) {
    console.error("Gemini Variant Error", error);
    return { name: 'AI Failed', hex: baseHex };
  }
};