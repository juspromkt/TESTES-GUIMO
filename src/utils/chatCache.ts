export interface CachedChat {
  id: string;
  remoteJid: string;
  senderLid?: string;
  pushName: string;
  profilePicUrl?: string | null;
  lastMessage: {
    messageType: string;
    fromMe: boolean;
    conversation: string | null;
    messageTimestamp: number;
  };
  hasNewMessage?: boolean;
}

const CACHE_TTL = Infinity;

interface ChatCacheState {
  timestamp: number;
  chats: CachedChat[] | null;
  lastPageSize: number;
}

let cache: ChatCacheState = {
  timestamp: 0,
  chats: null,
  lastPageSize: 0,
};

let chatListLoaded = false;

export function setChatListLoaded(loaded: boolean) {
  chatListLoaded = loaded;
}

export function isChatListLoaded() {
  return chatListLoaded;
}

export function clearChatCache() {
  cache = { timestamp: 0, chats: null, lastPageSize: 0 };
  chatListLoaded = false;
}

export function getCache() {
  return cache;
}

export function setCache(
  chats: CachedChat[],
  timestamp: number = Date.now(),
  lastPageSize?: number,
) {
  cache = {
    chats,
    timestamp,
    lastPageSize:
      typeof lastPageSize === 'number' ? lastPageSize : cache.lastPageSize,
  };
}

import { apiClient } from '../components/chat/utils/api';
import { resolveJid, saveJidMapping } from './jidMapping';

function deriveId(chat: CachedChat): string {
  const aliases = [chat.remoteJid];
  if (chat.senderLid) aliases.push(chat.senderLid);
  for (const alias of aliases) {
    const resolved = resolveJid(alias);
    if (resolved.includes('@s.whatsapp.net')) return resolved;
  }
  return resolveJid(chat.remoteJid);
}

function mergeChats(list: CachedChat[]): CachedChat[] {
  const map = new Map<string, CachedChat>();
  list.forEach(chat => {
    if (chat.senderLid && chat.remoteJid.includes('@s.whatsapp.net')) {
      saveJidMapping(chat.senderLid, chat.remoteJid);
    }
    const id = deriveId(chat);
    const entry = { ...chat, id };
    const existing = map.get(id);
    if (!existing) {
      map.set(id, entry);
    } else {
      const prefer =
        entry.remoteJid.includes('@s.whatsapp.net') || entry.senderLid?.includes('@s.whatsapp.net')
          ? entry
          : existing.remoteJid.includes('@s.whatsapp.net') || existing.senderLid?.includes('@s.whatsapp.net')
          ? existing
          : entry.lastMessage.messageTimestamp > existing.lastMessage.messageTimestamp
          ? entry
          : existing;
      const lastMessage =
        entry.lastMessage.messageTimestamp > existing.lastMessage.messageTimestamp
          ? entry.lastMessage
          : existing.lastMessage;
      map.set(id, { ...prefer, lastMessage });
    }
  });
  return Array.from(map.values()).sort(
    (a, b) => b.lastMessage.messageTimestamp - a.lastMessage.messageTimestamp
  );
}

export interface LoadChatsResult {
  chats: CachedChat[];
  pageSize: number;
}

export async function loadChats(
  token: string,
  forceRefresh = false,
): Promise<LoadChatsResult> {
  const now = Date.now();
  const canUseCache =
    Array.isArray(cache.chats) &&
    chatListLoaded &&
    !forceRefresh &&
    now - cache.timestamp < CACHE_TTL;

  if (canUseCache) {
    return {
      chats: cache.chats as CachedChat[],
      pageSize: cache.lastPageSize,
    };
  }
  const chats = await apiClient.findChats(token, 1, 50, forceRefresh);
  const unique = mergeChats(chats);
  setCache(unique, now, chats.length);
  return {
    chats: unique,
    pageSize: chats.length,
  };
}

function sanitizeName(name: string | undefined, remoteJid: string) {
  if (!name) return remoteJid.replace(/\D/g, '');
  return name.toLowerCase() === 'você' ? remoteJid.replace(/\D/g, '') : name;
}

export interface MessageEventPayload {
  id: string | null;
  key: { remoteJid: string; fromMe: boolean; id: string };
  senderLid?: string;
  pushName?: string;
  messageType: string;
  message: { conversation?: string; mediaUrl?: string };
  messageTimestamp: number;
}

export function updateCacheFromMessage(msg: MessageEventPayload) {
  const remote = msg.key.remoteJid;
  if (msg.senderLid && remote.includes('@s.whatsapp.net')) {
    saveJidMapping(msg.senderLid, remote);
  }
  const displayName = sanitizeName(msg.pushName, remote);
  const newChat: CachedChat = {
    id: resolveJid(msg.senderLid || remote),
    remoteJid: remote,
    senderLid: msg.senderLid,
    pushName: displayName,
    profilePicUrl: null,
    lastMessage: {
      messageType: msg.messageType,
      fromMe: msg.key.fromMe,
      conversation: msg.message.conversation || '',
      messageTimestamp: msg.messageTimestamp,
    },
    hasNewMessage: true,
  };
  const existing = cache.chats || [];
  cache.chats = mergeChats([...existing, newChat]);
  cache.timestamp = Date.now();
}