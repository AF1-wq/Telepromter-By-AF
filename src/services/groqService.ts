export const GROQ_API_URL = 'https://telepromter-by-af.onrender.com/api/chat';
export const MODEL_NAME = 'llama-3.1-8b-instant';

export interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const callGroqApi = async (prompt: string, systemPrompt: string = 'You are a helpful assistant.'): Promise<string> => {
  let response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        systemPrompt,
        temperature: 0.7,
        max_tokens: 4000,
      })
    });
  } catch (_error) {
    // Si fetch falla completamente (ej. CORS, red caída, proxy muerto)
    throw new Error('La IA está procesando peticiones muy rápido. Por favor, espera un par de segundos y vuelve a intentar.', { cause: _error });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error?.message;
    throw new Error(errorMessage || 'Error de conexión con la API de Groq');
  }

  const data: GroqResponse = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const improveCadence = async (text: string): Promise<string> => {
  return callGroqApi(
    text,
    'You are a teleprompter script editor. Improve the cadence and flow of the text. Separate into short paragraphs. Output ONLY the improved text.'
  );
};

export const translateToEnglish = async (text: string): Promise<string> => {
  return callGroqApi(
    text,
    "You are a professional translator. You MUST translate the user's text into natural, fluent English suitable for a teleprompter. Output ONLY the English translation. DO NOT add conversational filler."
  );
};

export const englishPronunciationCoach = async (text: string): Promise<string> => {
  return callGroqApi(
    text,
    'You are a diction coach. Keep the text in its original language, but insert phonetic pronunciation in brackets [ ] immediately after difficult words. Return ONLY the modified text.'
  );
};

export const chatWithAi = async (text: string, promptText: string): Promise<string> => {
  return callGroqApi(
    `Texto actual del editor:\n"""\n${text}\n"""\n\nComando del usuario: ${promptText}\n\nResponde únicamente con el texto modificado según el comando, sin texto introductorio ni explicaciones adicionales, listo para ser insertado en el editor.`,
    'Eres un asistente experto en edición de guiones de teleprompter.'
  );
};
