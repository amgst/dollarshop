
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

export const getAIBundleSuggestions = async (userIntent: string, products: Product[], maxItems: number, bundlePrice: number) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || 'AIzaSyDF7GKF4zfqvxbDBa2dL46ItOFi6-_yTrQ';
  const ai = new GoogleGenAI({ apiKey });
  
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

export const analyzeProductImage = async (file: File): Promise<{ name: string; description: string; category: string } | null> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || 'AIzaSyDF7GKF4zfqvxbDBa2dL46ItOFi6-_yTrQ';
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Starting AI analysis for file:", file.name, file.type, file.size);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(new Error(`FileReader failed: ${e.target?.error}`));
      reader.readAsDataURL(file);
    });
    
    // Fallback if type is missing (common on some mobile browsers/captures)
    // Ensure we send a valid mime type that Gemini supports
    let mimeType = file.type;
    if (!mimeType || mimeType === '') {
        mimeType = 'image/jpeg'; // Default assumption
    }
    
    const base64Data = base64.split(',')[1];

    console.log("Sending request to Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze this product image and generate a catchy title (name), a short marketing description, and categorize it into exactly one of these categories: 'Snacks', 'Stationery', 'Houseware', 'Gadgets', 'Self-Care'." },
            { inlineData: { mimeType: mimeType, data: base64Data } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Snacks', 'Stationery', 'Houseware', 'Gadgets', 'Self-Care'] }
          },
          required: ["name", "description", "category"]
        }
      }
    });

    console.log("Gemini response received");
    const text = typeof response.text === 'function' ? response.text() : response.text;
    console.log("Gemini text:", text);
    
    if (!text) {
        throw new Error("Empty response from AI");
    }

    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Analysis failed detailed:", error);
    // Rethrow with a user-friendly message
    if (error.message?.includes('403') || error.message?.includes('API key')) {
        throw new Error("Invalid or expired API Key. Please check your settings.");
    }
    throw error;
  }
};
