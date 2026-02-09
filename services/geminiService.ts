
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

export const getAIBundleSuggestions = async (userIntent: string, products: Product[], maxItems: number, bundlePrice: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Only send minimal data to AI to stay within token limits and improve speed
  const inventorySlice = products.map(p => ({ id: p.id, name: p.name }));
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the user's request: "${userIntent}", pick exactly ${maxItems} items from this inventory: ${JSON.stringify(inventorySlice)}. The items will be bundled for a total of Rs. ${bundlePrice}. Return the IDs of the recommended items.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendedIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of item IDs from the inventory."
          },
          explanation: {
            type: Type.STRING,
            description: "A short, fun explanation of why this bundle was picked."
          }
        },
        required: ["recommendedIds", "explanation"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return null;
  }
};
