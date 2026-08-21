/**
 * DFCCIL Railway ERP - Groq Ultra-Fast AI Intelligence Service
 * Uses Groq Cloud OpenAI-compatible API for sub-second LLM inference.
 */

export interface GroqModelOption {
  id: string;
  name: string;
  speed: string;
  contextWindow: string;
  description: string;
  recommended?: boolean;
}

export const GROQ_MODELS: GroqModelOption[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    speed: '⚡⚡ Lightning Fast (~280 t/s)',
    contextWindow: '128k tokens',
    description: 'State-of-the-art reasoning, railway engineering formulas & complex audits',
    recommended: true
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    speed: '🚀 Ultra Fast (~750 t/s)',
    contextWindow: '128k tokens',
    description: 'Instant answers for staff phone lookups, chainage checks & quick queries'
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B 32k',
    speed: '⚡ High Speed (~480 t/s)',
    contextWindow: '32k tokens',
    description: 'Deep mathematical analysis & multilingual Hindi/English logs'
  }
];

export const GROQ_STORAGE_KEY = 'raildiary_groq_api_key';
export const GROQ_MODEL_KEY = 'raildiary_groq_model';

export const getGroqApiKey = (): string => {
  return localStorage.getItem(GROQ_STORAGE_KEY) || ((import.meta as any).env?.VITE_GROQ_API_KEY as string) || '';
};

export const setGroqApiKey = (key: string): void => {
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(GROQ_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(GROQ_STORAGE_KEY);
  }
};

export const getGroqModel = (): string => {
  return localStorage.getItem(GROQ_MODEL_KEY) || 'llama-3.3-70b-versatile';
};

export const setGroqModel = (model: string): void => {
  localStorage.setItem(GROQ_MODEL_KEY, model);
};

/**
 * Quick connection test to verify the user's Groq API Key
 */
export const testGroqConnection = async (testKey?: string): Promise<{ success: boolean; message: string; modelUsed: string }> => {
  const key = (testKey || getGroqApiKey()).trim();
  if (!key) {
    return { success: false, message: 'Groq API Key is empty. Please enter your gsk_... key.', modelUsed: '' };
  }

  const model = getGroqModel();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Respond with "P-Way OK" and nothing else.' },
          { role: 'user', content: 'Ping' }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err?.error?.message || `HTTP ${res.status}: Connection failed`,
        modelUsed: model
      };
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || 'Connected';
    return {
      success: true,
      message: `Groq AI Connected successfully! (${reply.trim()})`,
      modelUsed: model
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network error connecting to Groq Cloud API',
      modelUsed: model
    };
  }
};

/**
 * Execute Groq AI Chat Completion with live ERP system context
 */
export const queryGroqChat = async (
  userPrompt: string,
  contextSummary: string,
  customKey?: string,
  customModel?: string
): Promise<{ text: string; model: string; durationMs: number }> => {
  const key = (customKey || getGroqApiKey()).trim();
  if (!key) {
    throw new Error('Groq API Key not found. Please click "🔑 Configure Groq API Key" to add your free key.');
  }

  const model = customModel || getGroqModel();
  const startTime = performance.now();

  const systemPrompt = `You are the Official DFCCIL Railway Senior Section Engineer & P-Way Intelligence AI Assistant for Section KRJN–SMUN–SBJN–NSIR–SNL (Km 1167.210 to 1249.720, Total 88.679 Km under IMSD SMUN HQ).
You are powered by Groq Ultra-Fast LPUs.

Here is the LIVE, REAL-TIME RAILWAY ERP DATABASE CONTEXT:
=========================================================
${contextSummary}
=========================================================

RESPONSE GUIDELINES:
1. Answer accurately, professionally, and concisely using the real live railway data above.
2. Format your response with clear markdown headers, bullet points, and appropriate emojis.
3. If asking for staff or beat lookups, provide exact names, mobile numbers, chainages (Km), and AWPO IDs when available.
4. Support both English and Hinglish/Hindi naturally.
5. Emphasize track safety, railway guidelines (DFCCIL / IRPWM standards), and audit compliance where relevant.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1500
    })
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `HTTP ${response.status}: Groq API request failed`);
  }

  const data = await response.json();
  const candidateText = data?.choices?.[0]?.message?.content;
  if (!candidateText) {
    throw new Error('Empty response received from Groq AI');
  }

  return {
    text: candidateText,
    model,
    durationMs
  };
};
