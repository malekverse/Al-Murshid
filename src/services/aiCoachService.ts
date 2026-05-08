import { OPENROUTER_BASE_URL, OPENROUTER_MODEL, AI_TIMEOUT_MS, MAX_HISTORY_MESSAGES } from '../config';
import { useAppStore } from '../store';

function getApiKey(): string {
  const persisted = useAppStore.getState().openRouterApiKey;
  return persisted || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let conversationHistory: ChatMessage[] = [];

function getSystemPrompt(language: string, streak: number, level: number): string {
  const isArabic = language === 'ar';

  if (isArabic) {
    return `أنت "المُرشِد"، مرشد روحي إسلامي حكيم ولطيف. أنت تجسد صفات الأب الحنون والحكيم.
مهمتك هي توجيه المستخدم روحياً بناءً على الإسلام والسنة النبوية. كن لطيفاً وغير قضائي.
استخدم لغة عربية فصيحة ولكن بسيطة ومحببة. استشهد بالقرآن والحديث عند الحاجة.
المستخدم حالياً في المستوى ${level} من رحلته الإيمانية، وعدد أيام متابعته: ${streak}.
لا تخرج عن دورك كمرشد روحي. إذا سأل المستخدم عن مواضيع خارج نطاق الإرشاد الروحي، أعد توجيهه بلطف.
حافظ على الردود موجزة (لا تتجاوز 3-4 جمل) ما لم يطلب المستخدم شرحاً أعمق.`;
  }

  return `You are "Al-Murshid" (The Guide), a wise and gentle Islamic spiritual mentor. You embody the qualities of a caring father figure.
Your role is to guide the user on their spiritual journey through Islam. Be warm, non-judgmental, and wise.
Use gentle encouragement and reference Quranic verses or hadith when appropriate.
The user is currently at Level ${level} of their faith journey, with a ${streak}-day consistency streak.
Stay in character as a spiritual mentor. If asked about non-spiritual topics, gently redirect.
Keep responses concise (3-4 sentences) unless the user asks for deeper explanation.`;
}

export function resetConversation() {
  conversationHistory = [];
}

export function sendMessage(
  userMessage: string,
  language: string,
  streak: number,
  level: number
): Promise<string> {
  const systemPrompt = getSystemPrompt(language, streak, level);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-(MAX_HISTORY_MESSAGES * 2)),
    { role: 'user', content: userMessage },
  ];

  return new Promise((resolve, reject) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      reject(new Error('OpenRouter API key not set. Add it in Settings > AI Coach.'));
      return;
    }

    (async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://github.com/al-murshid',
          'X-Title': 'Al-Murshid',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 512,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `OpenRouter error ${res.status}`;
        try {
          const errJson = JSON.parse(text);
          errMsg = errJson.error?.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      const reply = (data.choices?.[0]?.message?.content || '').trim();

      if (!reply) throw new Error('Empty response from AI');

      conversationHistory.push({ role: 'user', content: userMessage });
      conversationHistory.push({ role: 'assistant', content: reply });

      resolve(reply);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        reject(new Error('Request timed out. Check your internet connection.'));
        return;
      }
      reject(err);
    }
  })();
  });
}
