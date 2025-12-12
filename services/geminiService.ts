import { GoogleGenAI, Type } from "@google/genai";
import { LabelData, LanguageCode } from "../types";

// Initialize Gemini
// NOTE: API key must be provided via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getModelId = () => "gemini-2.5-flash"; // Optimized for speed

export const analyzeImage = async (input: string | string[], language: LanguageCode): Promise<LabelData> => {
  const modelId = getModelId();
  const outputLanguage = language === 'hi' ? 'Hindi' : 'English';

  const SYSTEM_INSTRUCTION = `
You are LabelReader, an assistive AI for visually impaired users.
Your task is to analyze one or more images of a product label or object and extract key information.
If multiple images are provided, combine the information found on all sides to provide a complete answer.

Return the output in strict JSON format.

Rules:
1. "item_name": Short, clear name.
2. "expiry": Expiration date if visible. If not found, say "No date found" (translated to ${outputLanguage}).
3. "usage": A 1-sentence summary of how to use/cook/consume.
4. "warnings": Any allergen warnings (nuts, dairy) or safety warnings (flammable, medicine dosage). If none, say "None" (translated to ${outputLanguage}).
5. "ingredients": List the main ingredients if clearly visible. If none found, say "None" (translated to ${outputLanguage}).
6. "confidence_score": A number between 0.0 and 1.0 indicating how readable the text is.
7. "is_medicine": Boolean, true if it looks like a medication/pill bottle.
8. "visual_details": If is_medicine is FALSE, describe color, shape, and packaging (e.g. "Red cylindrical metal can"). If is_medicine is TRUE, return "N/A". Translate value to ${outputLanguage}.
9. "seal_status": If is_medicine is FALSE, estimate if the item is "Sealed" or "Opened" based on the cap/lid. If unsure, say "Unknown". If is_medicine is TRUE, return "N/A". Translate value to ${outputLanguage}.
10. "quantity_estimate": If is_medicine is TRUE, estimate the quantity left (e.g., "Full bottle", "About 10 pills", "Cannot see inside"). If is_medicine is FALSE, return "N/A". Translate value to ${outputLanguage}.

CRITICAL: Translate the VALUES of "item_name", "expiry", "usage", "warnings", "ingredients", "visual_details", "seal_status", and "quantity_estimate" into ${outputLanguage}. 
Do not translate the keys.

If the confidence score is below 0.5, set "item_name" to "Image unclear" (translated) and suggest retaking the photo in "usage".
`;

  // Prepare content parts
  const images = Array.isArray(input) ? input : [input];
  const imageParts = images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img,
    },
  }));

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            item_name: { type: Type.STRING },
            expiry: { type: Type.STRING },
            usage: { type: Type.STRING },
            warnings: { type: Type.STRING },
            ingredients: { type: Type.STRING },
            confidence_score: { type: Type.NUMBER },
            is_medicine: { type: Type.BOOLEAN },
            visual_details: { type: Type.STRING },
            seal_status: { type: Type.STRING },
            quantity_estimate: { type: Type.STRING },
          },
          required: ["item_name", "expiry", "usage", "warnings", "ingredients"],
        },
      },
      contents: {
        parts: [
          ...imageParts,
          {
            text: `Analyze this product. Output the content in ${outputLanguage}.`,
          },
        ],
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text from Gemini");

    return JSON.parse(text) as LabelData;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};

export const askProductQuestion = async (
  input: string | string[], 
  contextData: LabelData, 
  question: string, 
  language: LanguageCode
): Promise<string> => {
  const modelId = getModelId();
  const outputLanguage = language === 'hi' ? 'Hindi' : 'English';

  // Prepare content parts
  const images = Array.isArray(input) ? input : [input];
  const imageParts = images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img,
    },
  }));

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      config: {
        systemInstruction: `You are a helpful assistant for the visually impaired. 
        You have already analyzed the product image(s) and found: ${JSON.stringify(contextData)}.
        User is asking a follow-up question.
        Answer briefly, clearly, and directly in ${outputLanguage}.`,
      },
      contents: {
        parts: [
          ...imageParts,
          {
            text: `Question: ${question}`,
          },
        ],
      },
    });

    if (!response.text) throw new Error("No response text");
    return response.text;

  } catch (error) {
    console.error("Gemini Q&A Error:", error);
    throw new Error("Failed to get answer.");
  }
};