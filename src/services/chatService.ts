import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { ChatMessage } from "../types";

export interface ChatConversation {
  id: number;
  tipo: string;
  trilhaId: number | null;
  nome: string;
}

interface BackendMessage {
  id: number;
  conversaId: number;
  remetenteId: number;
  conteudo: string;
  tipo: string;
  enviadoEm: string;
}

export const chatService = {
  getTeacherMessages: async (): Promise<ChatMessage[]> => {
    const raw = await AsyncStorage.getItem("cursify_teacher_chat");
    return raw ? JSON.parse(raw) : [];
  },

  sendTeacherMessage: async (senderId: string, senderName: string, content: string): Promise<void> => {
    const msgs = await chatService.getTeacherMessages();
    msgs.push({ message_id: Math.random().toString(36).slice(2), sender_id: senderId, sender_name: senderName, content, created_at: new Date().toISOString() });
    await AsyncStorage.setItem("cursify_teacher_chat", JSON.stringify(msgs));
  },

  getPrivateMessages: async (studentId: string, teacherId: string): Promise<ChatMessage[]> => {
    const raw = await AsyncStorage.getItem(`cursify_chat_${[studentId, teacherId].sort().join("_")}`);
    return raw ? JSON.parse(raw) : [];
  },

  sendPrivateMessage: async (studentId: string, teacherId: string, senderId: string, senderName: string, content: string): Promise<void> => {
    const key = `cursify_chat_${[studentId, teacherId].sort().join("_")}`;
    const raw = await AsyncStorage.getItem(key);
    const msgs: ChatMessage[] = raw ? JSON.parse(raw) : [];
    msgs.push({ message_id: Math.random().toString(36).slice(2), sender_id: senderId, sender_name: senderName, content, created_at: new Date().toISOString() });
    await AsyncStorage.setItem(key, JSON.stringify(msgs));
  },

  getLastMessage: async (userA: string, userB: string): Promise<ChatMessage | null> => {
    const raw = await AsyncStorage.getItem(`cursify_chat_${[userA, userB].sort().join("_")}`);
    if (!raw) return null;
    const msgs: ChatMessage[] = JSON.parse(raw);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  },

  hasUnread: async (userId: string, otherId: string): Promise<boolean> => {
    const raw = await AsyncStorage.getItem(`cursify_chat_${[userId, otherId].sort().join("_")}`);
    if (!raw) return false;
    const msgs: ChatMessage[] = JSON.parse(raw);
    return msgs.some((m) => m.sender_id !== userId);
  },

  getHiddenContacts: async (userId: string): Promise<string[]> => {
    const raw = await AsyncStorage.getItem(`cursify_hidden_${userId}`);
    return raw ? JSON.parse(raw) : [];
  },

  markAsRead: async (userA: string, userB: string): Promise<void> => {
    await AsyncStorage.setItem(`cursify_read_cursify_chat_${[userA, userB].sort().join("_")}`, new Date().toISOString());
  },

  clearMessages: async (userA: string, userB: string): Promise<void> => {
    const key = `cursify_chat_${[userA, userB].sort().join("_")}`;
    await AsyncStorage.removeItem(key);
  },

  hideContact: async (userId: string, otherId: string): Promise<void> => {
    const hidden = await chatService.getHiddenContacts(userId);
    if (!hidden.includes(otherId)) hidden.push(otherId);
    await AsyncStorage.setItem(`cursify_hidden_${userId}`, JSON.stringify(hidden));
  },

  getConversations: async (): Promise<ChatConversation[]> => {
    const response = await api.get<ChatConversation[]>("/chat/conversas");
    return response.data;
  },

  getMessages: async (conversationId: number): Promise<ChatMessage[]> => {
    const response = await api.get<BackendMessage[]>(`/chat/conversas/${conversationId}/mensagens`);
    return response.data.map((item) => ({
      message_id: String(item.id),
      sender_id: String(item.remetenteId),
      sender_name: `Usuario ${item.remetenteId}`,
      content: item.conteudo,
      created_at: item.enviadoEm,
    }));
  },

  sendMessage: async (conversationId: number, senderId: number, content: string): Promise<void> => {
    await api.post(`/chat/conversas/${conversationId}/mensagens`, {
      remetenteId: senderId,
      conteudo: content,
      tipo: "TEXTO",
    });
  },

  getUnreadCount: async (userId: string, otherId: string): Promise<number> => {
    const msgs = await chatService.getPrivateMessages(userId, otherId);
    return msgs.filter((m) => m.sender_id !== userId).length;
  },
};
