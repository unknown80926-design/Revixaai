import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractMetadata(text: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this study material:\n\n${text}`,
    config: {
      systemInstruction: `You are a study material analyzer. Extract structured metadata from the provided text.
Respond ONLY with valid JSON, no markdown, no explanation.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "short descriptive title" },
          subject: { type: Type.STRING, description: "one word subject area" },
          concepts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "up to 15 key concepts as strings" },
          summary: { type: Type.STRING, description: "2-3 sentence summary of the material" }
        },
        required: ["title", "subject", "concepts", "summary"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch {
    return { title: "Untitled", subject: "General", concepts: [], summary: "" };
  }
}

export async function generateQuiz(systemPrompt: string, text: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Study material:\n\n${text}`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["mcq", "integer"] },
                q: { type: Type.STRING },
                opts: { type: Type.ARRAY, items: { type: Type.STRING } },
                ans: { type: Type.INTEGER },
                intAns: { type: Type.STRING },
                explanation: { type: Type.STRING },
                concept: { type: Type.STRING }
              },
              required: ["type", "q", "opts", "explanation", "concept"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"questions":[]}');
  } catch {
    return { questions: [] };
  }
}

export async function generateFlashcards(text: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Study material:\n\n${text}`,
    config: {
      systemInstruction: `You are a flashcard creator for students.
Create 12 high-quality flashcards from the study material.
Each front should be a concept, term, or question. Each back should be a clear, educational explanation.`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ["front", "back"]
            }
          }
        },
        required: ["cards"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{"cards":[]}');
  } catch {
    return { cards: [] };
  }
}

export async function chatWithTutor(pdfName: string, concepts: string[], text: string, history: any[]) {
  const messages = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }]
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: messages,
    config: {
      systemInstruction: `You are Revixa AI Tutor helping a student understand their study material.

STUDY MATERIAL: "${pdfName}"

Key concepts covered: ${concepts.join(", ") || "(general material)"}

Context from the document:
${text}

Instructions:
- Answer ONLY based on the provided study material context
- Use **bold** for key terms
- Be clear, educational, and use examples
- If a question is outside the material, say so and redirect
- Keep responses focused and appropriately concise`
    }
  });

  return response.text || "I couldn't generate a response. Please try again.";
}
