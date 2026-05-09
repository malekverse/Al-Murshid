import { saveConversationMessage, getRecentConversationMessages, deleteOldConversationMessages } from '../../store/database';

const MAX_STORED_MESSAGES = 50;

export const persistConversationMessage = async (role: 'user' | 'assistant', content: string) => {
  const timestamp = Date.now();
  await saveConversationMessage(role, content, timestamp);
};

export const loadRecentConversation = async () => {
  return await getRecentConversationMessages(MAX_STORED_MESSAGES);
};

export const trimConversationHistory = async () => {
  await deleteOldConversationMessages(MAX_STORED_MESSAGES);
};
