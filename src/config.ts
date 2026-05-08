// OpenRouter configuration
// Set EXPO_PUBLIC_OPENROUTER_API_KEY in .env for build-time,
// or set it at runtime via Settings > AI Coach (persisted in AsyncStorage)

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_MODEL = 'qwen/qwen2.5-vl-72b-instruct:free';
export const AI_TIMEOUT_MS = 30000;
export const MAX_HISTORY_MESSAGES = 10;
