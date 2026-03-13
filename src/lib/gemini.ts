import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing. Please set it in the Secrets panel.");
      throw new Error("GEMINI_API_KEY is missing. Please set it in the Secrets panel.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export type FileContent = string | { fileUri: string; mimeType: string; name?: string };

function buildContents(content: FileContent, prompt: string): any {
  if (typeof content === 'string') {
    return `${prompt}\n\n${content}`;
  } else {
    return [
      { fileData: { fileUri: content.fileUri, mimeType: content.mimeType } },
      { text: prompt }
    ];
  }
}

export async function uploadToGeminiWithProgress(file: File, onProgress: (pct: number) => void): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API key missing");

  const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': file.size.toString(),
      'X-Goog-Upload-Header-Content-Type': file.type,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ file: { displayName: file.name } })
  });
  
  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Failed to start upload: ${initRes.status} ${errText}`);
  }
  let uploadUrl = initRes.headers.get('X-Goog-Upload-URL');
  if (!uploadUrl) throw new Error("Failed to get upload URL");
  
  if (!uploadUrl.includes('key=')) {
    uploadUrl += (uploadUrl.includes('?') ? '&' : '?') + `key=${apiKey}`;
  }

  const fileInfo: any = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('X-Goog-Upload-Offset', '0');
    xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText).file);
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${xhr.responseText}`));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
      }
    };
    
    xhr.onerror = () => reject(new Error("Upload failed (Network Error / CORS)"));
    xhr.send(file);
  });

  // Wait for processing
  while (true) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileInfo.name}?key=${apiKey}`);
    const check = await res.json();
    if (check.state === 'ACTIVE') return check;
    if (check.state === 'FAILED') throw new Error("File processing failed");
    await new Promise(r => setTimeout(r, 3000));
  }
}

export async function extractMetadata(content: FileContent) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: buildContents(content, `Analyze this study material. Extract structured metadata. Respond ONLY with valid JSON, no markdown, no explanation.`),
      config: {
        systemInstruction: `You are a study material analyzer. Extract structured metadata from the provided text or document.
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

    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Error extracting metadata:", e);
    return { title: "Untitled", subject: "General", concepts: [], summary: "" };
  }
}

export async function generateQuiz(systemPrompt: string, content: FileContent) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: buildContents(content, `Study material provided. Please generate the quiz based on it.`),
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

    return JSON.parse(response.text || '{"questions":[]}');
  } catch (e) {
    console.error("Error generating quiz:", e);
    return { questions: [] };
  }
}

export async function generateFlashcards(content: FileContent) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: buildContents(content, `Study material provided. Create flashcards based on it.`),
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

    return JSON.parse(response.text || '{"cards":[]}');
  } catch (e) {
    console.error("Error generating flashcards:", e);
    return { cards: [] };
  }
}

export async function chatWithTutor(pdfName: string, concepts: string[], content: FileContent, history: any[]) {
  try {
    const ai = getAI();
    const messages: any[] = [];
    
    // Add document context as the first message
    if (typeof content === 'string') {
      messages.push({ role: 'user', parts: [{ text: `Context document:\n\n${content}` }] });
    } else {
      messages.push({ role: 'user', parts: [
        { fileData: { fileUri: content.fileUri, mimeType: content.mimeType } },
        { text: `Context document provided.` }
      ]});
    }
    
    // Add history
    for (const m of history) {
      messages.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: messages,
      config: {
        systemInstruction: `You are Revixa AI Tutor helping a student understand their study material.

STUDY MATERIAL: "${pdfName}"

Key concepts covered: ${concepts.join(", ") || "(general material)"}

Instructions:
- Answer ONLY based on the provided study material context
- Use **bold** for key terms
- Be clear, educational, and use examples
- If a question is outside the material, say so and redirect
- Keep responses focused and appropriately concise`
      }
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (e) {
    console.error("Error in tutor chat:", e);
    return "I'm sorry, I encountered an error. Please check your API key and try again.";
  }
}
