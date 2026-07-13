import api from './api';

export interface Conversation {
  userId: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  mine: boolean;
  read: boolean;
  createdAt: string;
}

export interface ConversationDetail {
  otherUser: { id: string; name: string; avatarUrl?: string };
  messages: ChatMessage[];
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/api/messages/conversations');
  return data.data as Conversation[];
}

export async function getConversation(otherUserId: string): Promise<ConversationDetail> {
  const { data } = await api.get(`/api/messages/${otherUserId}`);
  return data.data as ConversationDetail;
}

export async function sendMessage(recipientId: string, content: string): Promise<ChatMessage> {
  const { data } = await api.post('/api/messages', { recipientId, content });
  return data.data as ChatMessage;
}
