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
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    speed: '⚡⚡ Ultra Smart (~280 t/s)',
    contextWindow: '131k tokens',
    description: '120B Parameter flagship reasoning model with deep railway knowledge',
    recommended: true
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    speed: '🚀 Instant (0.07s / ~650 t/s)',
    contextWindow: '131k tokens',
    description: 'Lightning-fast instant response for staff & chainage lookups'
  },
  {
    id: 'qwen/qwen3.6-27b',
    name: 'Qwen 3.6 27B',
    speed: '⚡ High Precision (~400 t/s)',
    contextWindow: '131k tokens',
    description: 'High precision multilingual Hindi & English reasoning'
  },
  {
    id: 'groq/compound',
    name: 'Groq Compound',
    speed: '⚡ High Speed',
    contextWindow: '131k tokens',
    description: 'Groq native multi-step reasoning agent'
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
  const saved = localStorage.getItem(GROQ_MODEL_KEY);
  if (!saved || saved.includes('llama')) {
    return 'openai/gpt-oss-120b';
  }
  return saved;
};

export const setGroqModel = (model: string): void => {
  localStorage.setItem(GROQ_MODEL_KEY, model);
};

/**
 * Quick connection test to verify the user's Groq API Key
 */
export const testGroqConnection = async (testKey?: string, modelOverride?: string): Promise<{ success: boolean; message: string; modelUsed: string }> => {
  const key = (testKey || getGroqApiKey()).trim();
  if (!key) {
    return { success: false, message: 'Groq API Key is empty. Please enter your gsk_... key.', modelUsed: '' };
  }

  const model = modelOverride || getGroqModel();
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
        max_tokens: 15,
        temperature: 0.1
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = err?.error?.message || `HTTP ${res.status}: Connection failed`;

      // Fallback to 20B model if needed
      if (model !== 'openai/gpt-oss-20b' && errMsg.toLowerCase().includes('does not exist')) {
        setGroqModel('openai/gpt-oss-20b');
        return testGroqConnection(key, 'openai/gpt-oss-20b');
      }

      return {
        success: false,
        message: errMsg,
        modelUsed: model
      };
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || 'Connected';
    return {
      success: true,
      message: `✓ Groq AI Connected successfully! (${reply.trim()} via ${model})`,
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

  let model = customModel || getGroqModel();
  if (model.includes('llama')) model = 'openai/gpt-oss-120b';

  const startTime = performance.now();

  const systemPrompt = `You are the Official DFCCIL Railway Senior Section Engineer & P-Way Intelligence AI Assistant for Section KRJN–SMUN–SBJN–NSIR–SNL (Km 1167.210 to 1249.720, Total 88.679 Km under IMSD SMUN HQ).
You are answering Shri Vivek Kumar Azad (APM / Civil / SMUN) and railway staff.

Here is the LIVE, REAL-TIME RAILWAY ERP DATABASE CONTEXT:
=========================================================
${contextSummary}
=========================================================

RESPONSE GUIDELINES:
1. Answer accurately, professionally, and concisely using the real live railway data above.
2. Format your response with clear markdown headers, tables, bullet points, and appropriate railway emojis.
3. If asking for staff or beat lookups, provide exact names, mobile numbers, chainages (Km), and AWPO IDs from the database context.
4. Support both English and Hinglish/Hindi naturally according to the user's language.
5. Emphasize track safety, railway guidelines (DFCCIL / IRPWM standards), and audit compliance where relevant.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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

  // Fallback to 20B if 120B is overloaded or unavailable
  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const errMsg = errJson?.error?.message || '';
    if (model !== 'openai/gpt-oss-20b' && (errMsg.includes('does not exist') || errMsg.includes('overloaded') || response.status === 429)) {
      model = 'openai/gpt-oss-20b';
      setGroqModel('openai/gpt-oss-20b');
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    }

    if (!response.ok) {
      const errRetry = await response.json().catch(() => ({}));
      throw new Error(errRetry?.error?.message || `HTTP ${response.status}: Groq API request failed`);
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
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
