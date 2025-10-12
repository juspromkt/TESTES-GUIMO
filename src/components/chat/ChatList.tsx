import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiClient, Chat, Contact, getCacheKey, clearApiCache } from './utils/api';
import type { Tag } from '../../types/tag';
import { formatTimestamp, getMessageTypeDisplay } from './utils/dateUtils';
import {
  ArrowLeft,
  Image,
  Play,
  FileText,
  Send,
  Paperclip,
  MessageCircle,
  Search,
  MoreVertical,
  Phone,
  Video,
  MessageSquarePlus,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useMessageEvents } from '../../pages/MessageEventsContext';
import { loadChats, updateCacheFromMessage, setCache, getCache, setChatListLoaded } from '../../utils/chatCache';


const TRANSFER_STORAGE_KEY = 'chat_transfer_remote_jids';
const TRANSFER_UPDATED_EVENT = 'chat_transfers_updated';
const TRANSFER_RELOAD_EVENT = 'chat_transfers_request_reload';

const RESUME_REFRESH_DELAY_MS = 150;
const RECENT_UPDATE_WINDOW_MS = 15000;
const MIN_REFRESH_INTERVAL_MS = 5000;
const USER_INTERACTION_GUARD_MS = 1200;

function toTransferRemoteJid(value: any): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}


interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
  whatsappType?: string;
}

export function ChatList({ onChatSelect, selectedChatId, whatsappType }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatsRef = useRef<Chat[]>([]);
  const pageRef = useRef(1);
  const loadingMoreFlagRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const didInitialLoad = useRef(false);
  const resumeRefreshTimeoutRef = useRef<number | null>(null);
  const lastRefreshRef = useRef(0);
  const lastRealtimeUpdateRef = useRef(Date.now());
  const lastUserInteractionRef = useRef(0);
  const [searchTerm, setSearchTerm] = useState('');
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;
  const [usuariosPorContato, setUsuariosPorContato] = useState<any[]>([]);
  const [tagsMap, setTagsMap] = useState<Record<string, Tag[]>>({});
  const [usuarioFiltroId, setUsuarioFiltroId] = useState<number | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagFiltroId, setTagFiltroId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [permanentExclusions, setPermanentExclusions] = useState<any[]>([]);
  const [iaStatusFilter, setIaStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [contactMap, setContactMap] = useState<Record<string, Contact>>({});
  const [contactSearch, setContactSearch] = useState('');
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const normalizedSelectedChatId = useMemo(
    () => (selectedChatId ? normalizeRemoteJid(selectedChatId) : null),
    [selectedChatId]
  );
  const [transferSet, setTransferSet] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set<string>();
    try {
      const raw = window.localStorage.getItem(TRANSFER_STORAGE_KEY);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set<string>();
      const normalized = parsed
        .map(toTransferRemoteJid)
        .filter((jid): jid is string => Boolean(jid));
      return new Set(normalized);
    } catch {
      return new Set<string>();
    }
  });
  const transferLoadedRef = useRef(false);
  const transferLoadingRef = useRef(false);
  const loadTransfers = useCallback(
    async (force = false, showToastOnError = false) => {
      if (!token) return;

      if (transferLoadingRef.current) {
        if (!force) return;
      }

      if (!force && transferLoadedRef.current) return;

      transferLoadingRef.current = true;
      try {
        const response = await fetch(
          'https://n8n.lumendigital.com.br/webhook/chat/transferencia/get',
          {
            method: 'GET',
            headers: { token },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data: any = [];
        try {
          data = await response.json();
        } catch {
          data = [];
        }

        const remoteJids: string[] = [];
        const appendValue = (value: any) => {
          if (Array.isArray(value)) {
            value.forEach(appendValue);
            return;
          }
          const normalized = toTransferRemoteJid(value);
          if (normalized) remoteJids.push(normalized);
        };

        if (Array.isArray(data)) {
          data.forEach((entry: any) => {
            if (entry && typeof entry === 'object' && 'transferencia' in entry) {
              appendValue((entry as any).transferencia);
            } else {
              appendValue(entry);
            }
          });
        }

        const unique = Array.from(new Set(remoteJids));

        setTransferSet(new Set(unique));
        transferLoadedRef.current = true;

        try {
          window.localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(unique));
        } catch {}

        window.dispatchEvent(
          new CustomEvent(TRANSFER_UPDATED_EVENT, {
            detail: { remoteJids: unique },
          })
        );
      } catch (err) {
        console.error('Erro ao carregar transferências:', err);
        if (showToastOnError) {
          toast.error('Não foi possível atualizar as transferências');
        }
      } finally {
        transferLoadingRef.current = false;
      }
    },
    [token]
  );

  const [activeTab, setActiveTab] = useState<'all' | 'ia' | 'transfers' | 'unread' | 'unanswered'>('all');

  function handleTabChange(tab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered') {
    lastUserInteractionRef.current = Date.now();
    setActiveTab(tab);
    switch (tab) {
      case 'ia':
        setIaStatusFilter('active');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
        break;
      case 'transfers':
        setIaStatusFilter('all');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
        void loadTransfers();
        break;
      case 'unread':
        setIaStatusFilter(prev => (prev === 'active' ? 'all' : prev));
        setShowOnlyUnread(true);
        setShowUnanswered(false);
        break;
      case 'unanswered':
        setIaStatusFilter(prev => (prev === 'active' ? 'all' : prev));
        setShowOnlyUnread(false);
        setShowUnanswered(true);
        break;
      default:
        setIaStatusFilter(prev => (prev === 'active' ? 'all' : prev));
        setShowOnlyUnread(false);
        setShowUnanswered(false);
    }
  }

  const hasActiveFilters = useMemo(
    () =>
      searchTerm.trim() !== '' ||
      activeTab !== 'all' ||
      iaStatusFilter !== 'all' ||
      usuarioFiltroId !== null ||
      tagFiltroId !== null ||
      showOnlyUnread ||
      showUnanswered,
    [
      searchTerm,
      activeTab,
      iaStatusFilter,
      usuarioFiltroId,
      tagFiltroId,
      showOnlyUnread,
      showUnanswered,
    ]
  );

  const prevHasActiveFilters = useRef(hasActiveFilters);
  useEffect(() => {
    if (hasActiveFilters && !prevHasActiveFilters.current) {
      setShowControls(true);
    }
    prevHasActiveFilters.current = hasActiveFilters;
  }, [hasActiveFilters]);

  // Adicione esta função após loadSessionData:
  const loadUnreadMessages = useCallback(async () => {
    if (!token) return;
    try {
      const unread = await apiClient.findMensagensNaoLidas(token);
      const unreadMap: Record<string, number> = {};
      unread.forEach((item: any) => {
        unreadMap[normalizeRemoteJid(item.remoteJid)] = item.qtdMensagens;
      });
      setUnreadMessages(unreadMap);
    } catch (err) {
      console.error('Erro ao carregar mensagens não lidas:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const schedule = () => {
      loadTransfers().catch(() => {});
    };

    const idleCb = (window as any).requestIdleCallback;
    if (typeof idleCb === 'function') {
      idleId = idleCb(schedule);
    } else {
      timeoutId = window.setTimeout(schedule, 1500);
    }

    return () => {
      if (idleId !== null && typeof (window as any).cancelIdleCallback === 'function') {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [token, loadTransfers]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ remoteJids?: string[] }>).detail;
      const list = Array.isArray(detail?.remoteJids) ? detail?.remoteJids : null;
      if (!list) return;
      const normalized = list
        .map(toTransferRemoteJid)
        .filter((jid): jid is string => Boolean(jid));
      setTransferSet(new Set(normalized));
      try {
        window.localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(normalized));
      } catch {}
    };
    window.addEventListener(TRANSFER_UPDATED_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(TRANSFER_UPDATED_EVENT, handler as EventListener);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      void loadTransfers(true);
    };
    window.addEventListener(TRANSFER_RELOAD_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(TRANSFER_RELOAD_EVENT, handler as EventListener);
    };
  }, [loadTransfers]);

  // popovers from Radix handle their own open/close logic


  function extractPhoneNumber(remoteJid: string): string {
    return remoteJid.replace(/\D/g, '');
  }

  function sanitizePushName(
    name: string | undefined,
    remoteJid: string,
  ): string | undefined {
    if (!name) return undefined;
    return name.toLowerCase() === 'você' ? extractPhoneNumber(remoteJid) : name;
  }

  function normalizeRemoteJid(jid: string): string {
    const value = String(jid || '').trim();
    if (!value) return '';

    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      if (domain === 's.whatsapp.net' || domain === 'lid') {
        const digits = local.replace(/\D/g, '');
        return digits ? `${digits}@${domain}` : value;
      }
      return value;
    }

    const digits = value.replace(/\D/g, '');
    return digits ? `${digits}@s.whatsapp.net` : value;
  }

function jidDigits(jid: string): string | null {
  const digits = String(jid || '').replace(/\D/g, '');
  return digits || null;
}

function jidCandidates(value: string): string[] {
  const raw = String(value ?? '');
  const normalized = normalizeRemoteJid(raw);
  const set = new Set<string>();

  if (raw) {
    set.add(raw);
  }

  if (normalized) {
    set.add(normalized);
  }

  return Array.from(set);
}

function normalizeTimestamp(ts: any): number {
   const n = typeof ts === 'string' ? Number(ts) : Number(ts ?? 0);
   if (!Number.isFinite(n) || n <= 0) return 0;
   return n >= 1e11 ? Math.floor(n / 1000) : Math.floor(n);
 }

  function deriveId(chat: Chat): string {
    const primary = normalizeRemoteJid(chat.remoteJid);
    if (primary) return primary;

    if (chat.remoteJid) return chat.remoteJid;

    if (chat.senderLid) {
      const fallback = normalizeRemoteJid(chat.senderLid);
      if (fallback) return fallback;
      return chat.senderLid;
    }

    return '';
  }

function mergeChats(existing: Chat[], incoming: Chat[]): Chat[] {
  const map = new Map<string, Chat>();

  [...existing, ...incoming].forEach(chat => {
    const id = deriveId(chat);
    const entry = { ...chat, id };

    const current = id ? map.get(id) : undefined;
    if (!current) {
      if (id) {
        map.set(id, entry);
      }
      return;
    }

    const currentTs = current.lastMessage?.messageTimestamp ?? 0;
    const entryTs = entry.lastMessage?.messageTimestamp ?? 0;
    const latest = entryTs >= currentTs ? entry : current;

    map.set(id, {
      ...latest,
      contactId: latest.contactId ?? current.contactId,
      lastMessage: latest.lastMessage ?? current.lastMessage,
      lastInboundTimestamp:
        (latest as any)?.lastInboundTimestamp ??
        (current as any)?.lastInboundTimestamp,
    });
  });

  return Array.from(map.values()).sort(
    (a, b) => (b.lastMessage?.messageTimestamp ?? 0) - (a.lastMessage?.messageTimestamp ?? 0)
  );
}

  const loadUsuarios = useCallback(async () => {
    if (!token) return;
    try {
      const usuarios = await apiClient.findContactsByUsuario(token);
      setUsuariosPorContato(usuarios);
    } catch (err) {
      console.error('Erro ao carregar usuários por contato:', err);
    }
  }, [token]);

  const loadTags = useCallback(async () => {
    if (!token) return;
    try {
      const [tagsList, assoc] = await Promise.all([
        apiClient.findTags(token),
        apiClient.findTagsByContact(token)
      ]);
      const tagsArray = Array.isArray(tagsList) ? tagsList : [];
      setAvailableTags(tagsArray);
      const map: Record<string, Tag[]> = {};
      const assocArr = Array.isArray(assoc) ? assoc : [];
      assocArr.forEach((rel: any) => {
        const tagIds = (Array.isArray(rel.id_tag) ? rel.id_tag : [rel.id_tag]).map(Number);
        const remotes = Array.isArray(rel.remoteJid) ? rel.remoteJid : [rel.remoteJid];
        remotes.forEach(value => {
          const normalized = normalizeRemoteJid(String(value));
          const digits = jidDigits(String(value));
          const keys = new Set<string>();
          if (normalized) keys.add(normalized);
          if (digits) keys.add(digits);
          keys.forEach(r => {
            tagIds.forEach(tid => {
              const tag = tagsArray.find(t => t.Id === tid);
              if (tag) {
                if (!map[r]) map[r] = [];
                if (!map[r].some(t => t.Id === tag.Id)) {
                  map[r].push(tag);
                }
              }
            });
          });
        });
      });
      setTagsMap(map);
    } catch (err) {
      console.error('Erro ao carregar tags por contato:', err);
    }
  }, [token]);

  const loadInternalContacts = useCallback(async () => {
    if (!token) return;
    try {
      const list = await apiClient.findContactInterno(token);
      setContactMap(prev => {
        const updated = { ...prev } as Record<string, Contact>;
        (Array.isArray(list) ? list : []).forEach((item: any) => {
          const telefone = String(item?.telefone || '').replace(/\D/g, '');
          const nome = typeof item?.nome === 'string' ? item.nome.trim() : '';
          if (!telefone || !nome || !/\D/.test(nome)) return;
          const baseJid = `${telefone}@s.whatsapp.net`;
          const normalized = normalizeRemoteJid(baseJid);
          const existing = updated[baseJid] || { id: baseJid, remoteJid: baseJid, profilePicUrl: null };
          const enriched = { ...existing, pushName: nome };
          updated[baseJid] = enriched;
          if (normalized && normalized !== baseJid) {
            updated[normalized] = { ...enriched, remoteJid: normalized };
          }
          const digits = jidDigits(baseJid);
          if (digits && !updated[digits]) {
            updated[digits] = enriched;
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Erro ao carregar contatos internos:', err);
    }
  }, [token]);

  useEffect(() => {
  const handler = (e: Event) => {
    const { remoteJid } = (e as CustomEvent<{ remoteJid: string }>).detail || {};
    if (!remoteJid) return;
    setUnreadMessages(prev => ({ ...prev, [remoteJid]: 0 }));
    setChats(prev => prev.map(c =>
      normalizeRemoteJid(c.remoteJid) === remoteJid ? { ...c, hasNewMessage: false } : c
    ));
  };
  window.addEventListener('messages_marked_as_read', handler as EventListener);
  return () => window.removeEventListener('messages_marked_as_read', handler as EventListener);
}, []);

  
  useEffect(() => {
    const timer = setTimeout(loadTags, 0);
    const handler = (e: StorageEvent) => {
      if (e.key === 'tags_updated') {
        loadTags();
      }
    };
    window.addEventListener('storage', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handler);
    };
  }, [loadTags]);

  const loadContactMap = useCallback(async () => {
    if (!token || whatsappType === 'WHATSAPP-BUSINESS') return;
    try {
      const list = await apiClient.findContacts(token);
      const map: Record<string, Contact> = {};
      (Array.isArray(list) ? list : []).forEach(c => {
        const remote = c.remoteJid || '';
        const normalized = normalizeRemoteJid(remote);
        const digits = jidDigits(remote);
        if (remote) {
          map[remote] = c;
        }
        if (normalized && normalized !== remote) {
          map[normalized] = c;
        }
        if (digits && !map[digits]) {
          map[digits] = c;
        }
      });
      setContactMap(map);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
    }
  }, [token, whatsappType]);

  useEffect(() => {
    loadContactMap();
  }, [loadContactMap]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'contacts_updated') {
        loadContactMap();
        loadInternalContacts();
      }
    };
    const customHandler = () => {
      loadContactMap();
      loadInternalContacts();
    };
    window.addEventListener('storage', handler);
    window.addEventListener('contacts_updated', customHandler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('contacts_updated', customHandler as EventListener);
    };
  }, [loadContactMap, loadInternalContacts]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => {
      loadInternalContacts();
    }, 3000);
    return () => clearTimeout(timer);
  }, [token, loadInternalContacts]);

  useEffect(() => {
    if (!Object.keys(contactMap).length) return;
    setChats(prev => {
      const updated = prev.map(chat => {
        const normalized = normalizeRemoteJid(chat.remoteJid);
        const digits = jidDigits(chat.remoteJid);
        const c =
          contactMap[chat.remoteJid] ||
          (normalized ? contactMap[normalized] : undefined) ||
          (digits ? contactMap[digits] : undefined);
        return {
          ...chat,
          contactId: (c as any)?.Id ?? (c as any)?.id ?? chat.contactId,
          pushName:
            sanitizePushName(c?.pushName || chat.pushName, chat.remoteJid) ||
            chat.remoteJid.split('@')[0],
          profilePicUrl: c?.profilePicUrl ?? chat.profilePicUrl ?? null,
        };
      });
      setCache(updated);
      return updated;
    });
  }, [contactMap]);

  const loadSessionData = useCallback(async () => {
    if (!token) return;

  // cada chamada cai em [] se quebrar o JSON ou der qualquer erro
  const safeFind = async <T,>(fn: (t: string) => Promise<T>): Promise<T | []> => {
    try {
      const r = await fn(token);
      return Array.isArray(r) ? r : [];
    } catch (e) {
      console.error('Erro ao carregar sessões/intervenções (tolerado):', e);
      return [];
    }
  };

  try {
    const [sess, interv, perm] = await Promise.all([
      safeFind(apiClient.findSessions),
      safeFind(apiClient.findInterventions),
      safeFind(apiClient.findPermanentExclusions),
    ]);

    setSessions(Array.isArray(sess) ? sess : []);
    setInterventions(Array.isArray(interv) ? interv : []);
    setPermanentExclusions(Array.isArray(perm) ? perm : []);
  } catch {
    // não deve cair aqui, mas se cair, zera para não quebrar UI
    setSessions([]);
    setInterventions([]);
    setPermanentExclusions([]);
  }
}, [token]);


  useEffect(() => {
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sessions_updated') {
        loadSessionData();
      }
    };
    const customHandler = () => {
      loadSessionData();
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('sessions_updated', customHandler as EventListener);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('sessions_updated', customHandler as EventListener);
    };
  }, [loadSessionData]);

  useEffect(() => {
    return () => {
      setChatListLoaded(false);
    };
  }, []);


  useEffect(() => {
    if (!token || didInitialLoad.current) return;

    didInitialLoad.current = true;
    setLoading(true);

    if (whatsappType === 'WHATSAPP-BUSINESS') {
      apiClient.findChats(token)
        .then((chats) => {
          const rawChats = Array.isArray(chats) ? chats : [];
          const normalized = rawChats.map(c => ({
            ...c,
            lastMessage: {
              ...c.lastMessage,
              messageTimestamp: normalizeTimestamp(c.lastMessage.messageTimestamp)
            }
          }));
          setChats(normalized);
          setHasMore(rawChats.length >= 50);
          pageRef.current = 1;
          lastScrollTopRef.current = 0;
          loadingMoreFlagRef.current = false;

          loadSessionData();
          setTimeout(loadTags, 0);
          setTimeout(loadUsuarios, 0);
          setTimeout(loadUnreadMessages, 0);

          const now = Date.now();
          setCache(normalized, now, rawChats.length);
          lastRefreshRef.current = now;
          lastRealtimeUpdateRef.current = now;

        })
        .catch(err => {
          console.error('Erro ao carregar dados:', err);
          toast.error('Erro ao carregar conversas');
        })
        .finally(() => {
          setLoading(false);
          setChatListLoaded(true);
        });
      return;
    }

    loadChats(token)
      .then(({ chats, pageSize }) => {
        const safeChats = Array.isArray(chats) ? chats : [];
        const safePageSize = typeof pageSize === 'number' ? pageSize : safeChats.length;
        const enriched = safeChats.map(chat => {
          const normalized = normalizeRemoteJid(chat.remoteJid);
          const digits = jidDigits(chat.remoteJid);
          const c =
            contactMap[chat.remoteJid] ||
            (normalized ? contactMap[normalized] : undefined) ||
            (digits ? contactMap[digits] : undefined);
          return {
            ...chat,
            contactId: (c as any)?.Id ?? (c as any)?.id ?? chat.contactId,
            pushName:
              sanitizePushName(c?.pushName || chat.pushName, chat.remoteJid) ||
              chat.remoteJid.split('@')[0],
            profilePicUrl: c?.profilePicUrl ?? chat.profilePicUrl ?? null,
            lastMessage: {
              ...chat.lastMessage,
              messageTimestamp: normalizeTimestamp(chat.lastMessage.messageTimestamp),
            },
          };
        });

        const merged = mergeChats(enriched, []);
        setChats(merged);
        setHasMore(safePageSize >= 50);
        pageRef.current = 1;
        lastScrollTopRef.current = 0;
        loadingMoreFlagRef.current = false;
        const now = Date.now();
        setCache(merged, now, safePageSize);
        lastRefreshRef.current = now;
        lastRealtimeUpdateRef.current = now;
        setTimeout(loadUsuarios, 0);
        setTimeout(loadTags, 0);
        loadSessionData();
      })
      .catch(err => {
        console.error('Erro ao carregar dados:', err);
        toast.error('Erro ao carregar conversas');
      })
      .finally(() => {
        setLoading(false);
        setChatListLoaded(true);
      });

      setTimeout(loadUnreadMessages, 0);
  }, [token, whatsappType]);

  const fetchChats = useCallback(
    async (pageNum: number) => {
      if (!token) return;
      if (pageNum <= 1) return;
      if (loadingMoreFlagRef.current) return;
      if (pageNum <= pageRef.current) return;

      loadingMoreFlagRef.current = true;
      setLoadingMore(true);

      try {
        const response = await apiClient.findChats(token, pageNum, 50);
        const newChats = Array.isArray(response) ? response : [];
        const pageHasMore = newChats.length === 50;

        if (newChats.length === 0) {
          pageRef.current = Math.max(pageRef.current, pageNum);
          setHasMore(false);
          setCache(chatsRef.current, Date.now(), newChats.length);
          return;
        }

        const enrichedChats = newChats.map(chat => {
          const normalized = normalizeRemoteJid(chat.remoteJid);
          const digits = jidDigits(chat.remoteJid);
          const c =
            contactMap[chat.remoteJid] ||
            (normalized ? contactMap[normalized] : undefined) ||
            (digits ? contactMap[digits] : undefined);
          return {
            ...chat,
            contactId: (c as any)?.Id ?? (c as any)?.id ?? chat.contactId,
            pushName:
              sanitizePushName(c?.pushName || chat.pushName, chat.remoteJid) ||
              chat.remoteJid.split('@')[0],
            profilePicUrl: c?.profilePicUrl ?? chat.profilePicUrl ?? null,
            lastMessage: {
              ...chat.lastMessage,
              messageTimestamp: normalizeTimestamp(chat.lastMessage.messageTimestamp),
            },
          };
        });

        setChats(prev => {
          const merged = mergeChats(prev, enrichedChats);
          const timestamp = Date.now();
          setCache(merged, timestamp, newChats.length);
          if (normalizedSelectedChatId) {
            const sel = merged.find(c => c.id === normalizedSelectedChatId);
            if (sel) onChatSelect(sel);
          }
          return merged;
        });

        pageRef.current = Math.max(pageRef.current, pageNum);
        setHasMore(pageHasMore);
        lastRealtimeUpdateRef.current = Date.now();
      } catch (error) {
        console.error('Erro ao carregar chats:', error);
        toast.error('Erro ao carregar conversas');
      } finally {
        loadingMoreFlagRef.current = false;
        setLoadingMore(false);
      }
    },
    [token, contactMap, normalizedSelectedChatId, onChatSelect]
  );

  const handleRefresh = useCallback(
    async (options?: { preserveExisting?: boolean }) => {
      if (!token) return;
      const preserveExisting = options?.preserveExisting ?? false;

      if (resumeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(resumeRefreshTimeoutRef.current);
        resumeRefreshTimeoutRef.current = null;
      }

      const startedAt = Date.now();
      lastRefreshRef.current = startedAt;

      if (!preserveExisting) {
        setLoading(true);
        setHasMore(true);
        pageRef.current = 1;
        lastScrollTopRef.current = 0;
        loadingMoreFlagRef.current = false;
      }

      try {
        void loadTransfers(true, !preserveExisting);
        if (whatsappType === 'WHATSAPP-BUSINESS') {
          if (!preserveExisting) {
            clearApiCache([
              getCacheKey('findContactInterno', token),
              getCacheKey('findChats', token, { page: 1, offset: 50 }),
            ]);
          }

          const [contacts, chats] = await Promise.all([
            apiClient.findContactInterno(token),
            apiClient.findChats(token, 1, 50, true),
          ]);

          const map: Record<string, Contact> = {};
          (Array.isArray(contacts) ? contacts : []).forEach((item: any) => {
            const telefone = String(item?.telefone || '').replace(/\D/g, '');
            if (!telefone) return;
            const baseJid = `${telefone}@s.whatsapp.net`;
            const normalized = normalizeRemoteJid(baseJid);
            const contact: Contact = {
              id: baseJid,
              remoteJid: baseJid,
              pushName:
                sanitizePushName(
                  typeof item?.nome === 'string' ? item.nome : undefined,
                  baseJid,
                ) || baseJid.split('@')[0],
              profilePicUrl: null,
            };
            map[baseJid] = contact;
            if (normalized && normalized !== baseJid) {
              map[normalized] = { ...contact, remoteJid: normalized };
            }
            const digits = jidDigits(baseJid);
            if (digits && !map[digits]) {
              map[digits] = contact;
            }
          });
          setContactMap(map);

          const chatList = Array.isArray(chats) ? chats : [];
          const normalized = chatList.map(chat => {
            const normalizedJid = normalizeRemoteJid(chat.remoteJid);
            const digits = jidDigits(chat.remoteJid);
            const contact =
              map[chat.remoteJid] ||
              (normalizedJid ? map[normalizedJid] : undefined) ||
              (digits ? map[digits] : undefined);
            return {
              ...chat,
              contactId:
                (contact as any)?.Id ?? (contact as any)?.id ?? chat.contactId,
              pushName:
                sanitizePushName(contact?.pushName || chat.pushName, chat.remoteJid) ||
                chat.remoteJid.split('@')[0],
              profilePicUrl:
                contact?.profilePicUrl ?? chat.profilePicUrl ?? null,
              lastMessage: {
                ...chat.lastMessage,
                messageTimestamp: normalizeTimestamp(
                  chat.lastMessage.messageTimestamp,
                ),
              },
            };
          });

          const pageHasMore = chatList.length >= 50;
          const base = preserveExisting ? chatsRef.current : [];
          const merged = mergeChats(base, normalized);
          setChats(merged);
          setHasMore(pageHasMore);
          setCache(merged, Date.now(), chatList.length);
        } else {
          const { chats: refreshedChats, pageSize } = await loadChats(token, true);
          const safeChats = Array.isArray(refreshedChats) ? refreshedChats : [];
          const safePageSize = typeof pageSize === 'number' ? pageSize : safeChats.length;
          const enriched = safeChats.map(chat => {
            const normalized = normalizeRemoteJid(chat.remoteJid);
            const digits = jidDigits(chat.remoteJid);
            const c =
              contactMap[chat.remoteJid] ||
              (normalized ? contactMap[normalized] : undefined) ||
              (digits ? contactMap[digits] : undefined);
            return {
              ...chat,
              contactId: (c as any)?.Id ?? (c as any)?.id ?? chat.contactId,
              pushName:
                sanitizePushName(c?.pushName || chat.pushName, chat.remoteJid) ||
                chat.remoteJid.split('@')[0],
              profilePicUrl: c?.profilePicUrl ?? chat.profilePicUrl ?? null,
              lastMessage: {
                ...chat.lastMessage,
                messageTimestamp: normalizeTimestamp(chat.lastMessage.messageTimestamp),
              },
            };
          });
          const base = preserveExisting ? chatsRef.current : [];
          const merged = mergeChats(base, enriched);
          setChats(merged);
          setHasMore(safePageSize >= 50);
          setCache(merged, Date.now(), safePageSize);
        }
        setTimeout(loadUsuarios, 0);
        setTimeout(loadTags, 0);
        setTimeout(loadUnreadMessages, 0);
        loadSessionData();
        const now = Date.now();
        lastRefreshRef.current = now;
        lastRealtimeUpdateRef.current = now;
      } catch (err) {
        console.error('Erro ao atualizar conversas:', err);
        if (!preserveExisting) {
          toast.error('Erro ao atualizar conversas');
        }
      } finally {
        if (!preserveExisting) {
          setLoading(false);
        }
      }
    },
    [
      token,
      whatsappType,
      contactMap,
      loadUsuarios,
      loadTags,
      loadUnreadMessages,
      loadSessionData,
      loadTransfers,
    ]
  );

  const handleManualRefresh = useCallback(() => {
    lastUserInteractionRef.current = Date.now();
    void handleRefresh();
  }, [handleRefresh]);


  const handleStartChat = (contact: Contact) => {
    lastUserInteractionRef.current = Date.now();
    const normalized = normalizeRemoteJid(contact.remoteJid);
    const chat: Chat = {
      id: normalized || contact.remoteJid,
      remoteJid: contact.remoteJid,
      contactId: (contact as any)?.Id ?? (contact as any)?.id,
      pushName:
        sanitizePushName(contact.pushName, contact.remoteJid) ||
        contact.remoteJid.split('@')[0],
      profilePicUrl: contact.profilePicUrl,
      lastMessage: {
        messageType: 'conversation',
        fromMe: false,
        conversation: '',
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    };
    setChats(prev => {
      const merged = mergeChats(prev, [chat]);
      setCache(merged);
      return merged;
    });
    lastRealtimeUpdateRef.current = Date.now();
    onChatSelect(chat);
    setContactPopoverOpen(false);
  };


  useEffect(() => {
    const listElement = chatListRef.current;
    if (!listElement || loading || loadingMore || !hasMore) return;

    lastScrollTopRef.current = listElement.scrollTop;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = listElement;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const isScrollingDown = scrollTop > lastScrollTopRef.current;

      lastScrollTopRef.current = scrollTop;

      if (!isScrollingDown) return;
      if (distanceFromBottom > 100) return;

      const nextPage = pageRef.current + 1;
      void fetchChats(nextPage);
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, fetchChats]);







const usuarioOwnerMap = useMemo(() => {
  const map = new Map<string, any>();

  if (!Array.isArray(usuariosPorContato)) {
    return map;
  }

  for (const usuario of usuariosPorContato) {
    const contatos = Array.isArray(usuario.contatos) ? usuario.contatos : [];
    for (const contato of contatos) {
      const digits = String(contato?.telefone || '').replace(/\D/g, '');
      if (!digits) continue;

      const waJid = `${digits}@s.whatsapp.net`;
      const lidJid = `${digits}@lid`;

      if (!map.has(waJid)) map.set(waJid, usuario);
      if (!map.has(lidJid)) map.set(lidJid, usuario);
      if (!map.has(digits)) map.set(digits, usuario);
    }
  }

  return map;
}, [usuariosPorContato]);

const resolveUsuarioDono = useCallback(
  (remoteJid: string) => {
    const normalized = normalizeRemoteJid(remoteJid);
    const digits = jidDigits(remoteJid);

    return (
      (normalized ? usuarioOwnerMap.get(normalized) : null) ??
      (digits ? usuarioOwnerMap.get(digits) : null) ??
      null
    );
  },
  [usuarioOwnerMap]
);

const sessionsSet = useMemo(() => {
  const arr = Array.isArray(sessions) ? sessions : [];
  const keys: string[] = [];
  for (const s of arr) {
    const digits = String(s?.telefone || '').replace(/\D/g, '');
    if (!digits) continue;
    keys.push(`${digits}@s.whatsapp.net`);
    keys.push(`${digits}@lid`);
  }
  return new Set(keys);
}, [sessions]);

const interventionsSet = useMemo(() => {
  const arr = Array.isArray(interventions) ? interventions : [];
  const keys: string[] = [];
  for (const i of arr) {
    const digits = String(i?.telefone || '').replace(/\D/g, '');
    if (!digits) continue;
    keys.push(`${digits}@s.whatsapp.net`);
    keys.push(`${digits}@lid`);
  }
  return new Set(keys);
}, [interventions]);

const permanentSet = useMemo(() => {
  const arr = Array.isArray(permanentExclusions) ? permanentExclusions : [];
  const keys: string[] = [];
  for (const p of arr) {
    const digits = String(p?.telefone || '').replace(/\D/g, '');
    if (!digits) continue;
    keys.push(`${digits}@s.whatsapp.net`);
    keys.push(`${digits}@lid`);
  }
  return new Set(keys);
}, [permanentExclusions]);


const contactsArray = useMemo(
  () =>
    Object.values(contactMap).sort((a, b) => {
      const nameA = a.pushName || '';
      const nameB = b.pushName || '';
      return nameA.localeCompare(nameB);
    }),
  [contactMap]
);

const filteredContacts = useMemo(() => {
  const query = contactSearch.toLowerCase();
  return contactsArray.filter(c => {
    const name = c.pushName?.toLowerCase() || '';
    const jid = c.remoteJid || '';
    return name.includes(query) || jid.includes(contactSearch);
  });
}, [contactsArray, contactSearch]);


  const getDisplayName = (chat) => {
    return (
      sanitizePushName(chat.pushName, chat.remoteJid) ||
      chat.remoteJid.split('@')[0] ||
      'Contato'
    );
  };

const filteredChats = useMemo(() => {
  const query = searchTerm.toLowerCase();

  return chats.filter(chat => {
    const displayName =
      sanitizePushName(chat.pushName, chat.remoteJid) ||
      chat.remoteJid.split('@')[0] ||
      'Contato';
    const matchesSearch = displayName.toLowerCase().includes(query);
    const jidNorm = normalizeRemoteJid(chat.remoteJid);
    const unreadCount = unreadMessages[jidNorm] || 0;
    const digitsKey = jidDigits(chat.remoteJid);
    const transferKey = digitsKey ? `${digitsKey}@s.whatsapp.net` : null;
    const isTransferChat =
      transferSet.has(jidNorm) || (transferKey ? transferSet.has(transferKey) : false);

    if (usuarioFiltroId) {
      const dono = resolveUsuarioDono(chat.remoteJid);
      if (!dono || dono.Id !== usuarioFiltroId) return false;
    }

    if (tagFiltroId) {
      const normalized = normalizeRemoteJid(chat.remoteJid);
      const digits = jidDigits(chat.remoteJid);
      const tags =
        tagsMap[normalized] ||
        (digits ? tagsMap[digits] : undefined) ||
        [];
      if (!tags.some(t => t.Id === tagFiltroId)) return false;
    }

    if (showOnlyUnread && unreadCount === 0) return false;
    if (showUnanswered && chat.lastMessage.fromMe) return false;

    if (activeTab === 'transfers' && !isTransferChat) return false;

    if (iaStatusFilter !== 'all') {
      const isIAPermanente = permanentSet.has(jidNorm);
      const isIAAtiva =
        sessionsSet.has(jidNorm) && !interventionsSet.has(jidNorm) && !isIAPermanente;
      const isIAInativa = interventionsSet.has(jidNorm) && !isIAPermanente;

      if (iaStatusFilter === 'active' && !isIAAtiva) return false;
      if (iaStatusFilter === 'inactive' && !(isIAInativa || isIAPermanente)) return false;
    }

    return matchesSearch;
  });
}, [
  chats,
  searchTerm,
  unreadMessages,
  showOnlyUnread,
  showUnanswered,
  activeTab,
  iaStatusFilter,
  transferSet,
  sessionsSet,
  interventionsSet,
  permanentSet,
  tagsMap,
  tagFiltroId,
  resolveUsuarioDono,
  usuarioFiltroId,
]);

const chatsToShow = filteredChats;

  const [flashChatIds, setFlashChatIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

const scheduleResumeRefresh = useCallback(
  (reason: 'focus' | 'visibility' | 'online' | 'pageshow') => {
    if (!didInitialLoad.current) return;
    if (loading || loadingMore) return;

    const now = Date.now();

    if (
      reason === 'focus' &&
      now - lastUserInteractionRef.current < USER_INTERACTION_GUARD_MS
    ) {
      return;
    }

    if (resumeRefreshTimeoutRef.current !== null) return;

    if (now - lastRefreshRef.current < MIN_REFRESH_INTERVAL_MS) {
      return;
    }

    if (reason !== 'online' && now - lastRealtimeUpdateRef.current < RECENT_UPDATE_WINDOW_MS) {
      return;
    }

    resumeRefreshTimeoutRef.current = window.setTimeout(() => {
      resumeRefreshTimeoutRef.current = null;
      void handleRefresh({ preserveExisting: true });
    }, RESUME_REFRESH_DELAY_MS);
  },
  [handleRefresh, loading, loadingMore]
);

useEffect(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const onVisibilityChange = () => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      scheduleResumeRefresh('visibility');
    }
  };

  const onFocus = () => scheduleResumeRefresh('focus');
  const onOnline = () => scheduleResumeRefresh('online');
  const onPageShow = () => {
    scheduleResumeRefresh('pageshow');
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onOnline);
  window.addEventListener('pageshow', onPageShow);

  return () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('pageshow', onPageShow);
    if (resumeRefreshTimeoutRef.current !== null) {
      window.clearTimeout(resumeRefreshTimeoutRef.current);
      resumeRefreshTimeoutRef.current = null;
    }
  };
}, [scheduleResumeRefresh]);

useMessageEvents((msg) => {
  updateCacheFromMessage(msg);

  lastRealtimeUpdateRef.current = Date.now();

  const resolved = normalizeRemoteJid(msg.key.remoteJid);
  const isInbound = !msg.key.fromMe;
  const ts =
    typeof (msg as any).messageTimestamp === 'number'
      ? normalizeTimestamp((msg as any).messageTimestamp)
      : Math.floor(Date.now() / 1000);

  setChats(prev => {
    return prev.map(chat => {
      if (chat.id !== resolved) return chat;

      // Se for inbound, registra o último inbound conhecido
      const next: any = isInbound
        ? { ...chat, lastInboundTimestamp: ts }
        : { ...chat };

      // NÃO sobrescrevemos lastMessage aqui (fica a cargo do seu cache/stream),
      // apenas garantimos que o inbound fique salvo para cálculo da janela.
      return next;
    });
  });

  // (restante do seu handler continua igual...)
  const updated = (getCache().chats || []).map(chat => {
    const normalized = normalizeRemoteJid(chat.remoteJid);
    const digits = jidDigits(chat.remoteJid);
    const c =
      contactMap[chat.remoteJid] ||
      (normalized ? contactMap[normalized] : undefined) ||
      (digits ? contactMap[digits] : undefined);
    return {
      ...chat,
      contactId: (c as any)?.Id ?? (c as any)?.id ?? chat.contactId,
      pushName:
        sanitizePushName(c?.pushName || chat.pushName, chat.remoteJid) ||
        chat.remoteJid.split('@')[0],
      profilePicUrl: c?.profilePicUrl ?? chat.profilePicUrl ?? null,
    };
  });
  setChats(updated);

  if (normalizedSelectedChatId) {
    const sel = updated.find(c => c.id === normalizedSelectedChatId);
    if (sel && sel.id !== normalizedSelectedChatId) {
      onChatSelect(sel);
    }
  }

  if (normalizedSelectedChatId && resolved === normalizedSelectedChatId) {
    setFlashChatIds(prev => {
      const newSet = new Set(prev);
      newSet.add(normalizedSelectedChatId);
      setTimeout(() => {
        setFlashChatIds(prev2 => {
          const nextSet = new Set(prev2);
          nextSet.delete(normalizedSelectedChatId);
          return nextSet;
        });
      }, 2000);
      return newSet;
    });
  }
});


useEffect(() => {
  if (normalizedSelectedChatId) {
    setChats(prev => {
      return prev.map(chat => {
        if (chat.id === normalizedSelectedChatId) {
          return { ...chat, hasNewMessage: false };
        }
        return chat;
      });
    });
  }
}, [normalizedSelectedChatId]);


const getInitials = (name?: string | null) => {
  if (!name || typeof name !== 'string') {
    return '??';
  }

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean) // evita strings vazias
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '??';
};



const getLastMessageText = (chat) => {
  const { lastMessage } = chat;
  
  // Verificar se é uma mensagem de conversation
  if (lastMessage.messageType === 'conversation' && lastMessage.conversation) {
    // Verificar se é um template (formato ▶️nome_template◀️)
    const isTemplate = /^▶️.*◀️$/.test(lastMessage.conversation);
    
    if (isTemplate) {
      // Extrair nome do template e formatar
      const templateName = lastMessage.conversation.match(/^▶️(.*)◀️$/)?.[1] || 'template';
      const formattedName = templateName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `📝 Template: ${formattedName}`;
    }
    
    // Retornar texto normal da conversa
    return lastMessage.conversation;
  }
  
  // Verificar templateButtonReplyMessage
  if (lastMessage.messageType === 'templateButtonReplyMessage' && lastMessage.templateButtonReplyMessage) {
    const reply = lastMessage.templateButtonReplyMessage;
    return `✅ Selecionou: "${reply.selectedDisplayText}"`;
  }
  
  // Verificar templateMessage
  if (lastMessage.messageType === 'templateMessage' && lastMessage.templateMessage?.hydratedTemplate) {
    const template = lastMessage.templateMessage.hydratedTemplate;
    const content = template.hydratedContentText || template.hydratedTitleText || 'Template';
    // Mostrar apenas os primeiros 50 caracteres
    return `📝 ${content.length > 50 ? content.substring(0, 50) + '...' : content}`;
  }
  
  // Para outros tipos de mensagem, usar a função de display padrão
  return getMessageTypeDisplay(lastMessage.messageType);
};

  const formatPhoneNumber = (jid: string) => {
    const cleaned = jid.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      const match = cleaned.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
      if (match) {
        return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
      }
    }
    return jid;
  };

  function formatShort(text?: string | null, max = 16): string {
  try {
    if (!text) return "";
    const s = String(text).trim();
    return s.length <= max ? s : s.slice(0, max) + "...";
  } catch {
    return "";
  }
}


  function formatShortName(name?: string | null): string {
  try {
    if (!name) return "";
    const str = String(name).trim();
    if (str.length <= 13) return str;
    return str.slice(0, 13) + "...";
  } catch {
    return "";
  }
}


  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b border-gray-300 bg-white/90">
        <div className="px-3 py-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-700">Conversas</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowControls(prev => !prev)}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  showControls ? 'bg-gray-100 text-gray-700 border-gray-300' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                }`}
              >
                <span>{showControls ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
                {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showControls ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={handleManualRefresh}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50"
                title="Atualizar lista"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => {
                lastUserInteractionRef.current = Date.now();
                setSearchTerm(e.target.value);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
            />
          </div>

          {showControls && (
            <div className="border-t border-gray-300 pt-3">
              <div
                className="space-y-3 rounded-lg border border-gray-300 bg-white/95 p-3 shadow-sm max-h-64 overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148, 163, 184, 0.35) transparent' }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Popover.Root open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                    <Popover.Trigger asChild>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                        title="Nova conversa"
                      >
                        <MessageSquarePlus className="h-4 w-4" />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content sideOffset={6} className="z-50 w-60 rounded-xl border border-gray-300 bg-white p-3 shadow-2xl">
                        <input
                          type="text"
                          value={contactSearch}
                          onChange={e => {
                            lastUserInteractionRef.current = Date.now();
                            setContactSearch(e.target.value);
                          }}
                          placeholder="Buscar contato"
                          className="mb-2 w-full rounded border border-gray-300 p-2 text-sm focus:border-emerald-400 focus:outline-none"
                        />
                        <div className="max-h-60 overflow-y-auto">
                          {filteredContacts.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleStartChat(c)}
                              className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              {c.profilePicUrl ? (
                                <img src={c.profilePicUrl} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-xs font-medium text-white">
                                  {getInitials(c.pushName)}
                                </div>
                              )}
                              <span className="ml-2 truncate">{c.pushName}</span>
                            </button>
                          ))}
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>

                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 transition-colors ${
                          iaStatusFilter !== 'all'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                        title="Filtrar por status de IA"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M313h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content sideOffset={6} className="z-50 w-48 rounded-xl border border-gray-300 bg-white p-3 shadow-2xl">
                        <div className="space-y-1">
                          <button
                            onClick={() => setIaStatusFilter('active')}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            IA Ativa
                          </button>
                          <button
                            onClick={() => setIaStatusFilter('inactive')}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                          >
                            Intervenção
                          </button>
                          <button
                            onClick={() => setIaStatusFilter('all')}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Mostrar todas
                          </button>
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>

                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 transition-colors ${
                          usuarioFiltroId !== null
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                        title="Filtrar por usuário"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content sideOffset={6} className="z-50 w-48 rounded-xl border border-gray-300 bg-white p-3 shadow-2xl">
                        <div className="max-h-60 space-y-1 overflow-y-auto">
                          <button
                            onClick={() => setUsuarioFiltroId(null)}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Todos os usuários
                          </button>
                          {usuariosPorContato.map((u) => (
                            <button
                              key={u.Id}
                              onClick={() => setUsuarioFiltroId(u.Id)}
                              className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                                usuarioFiltroId === u.Id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-blue-50'
                              }`}
                            >
                              {u.nome}
                            </button>
                          ))}
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>

                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 transition-colors ${
                          tagFiltroId !== null
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                        title="Filtrar por etiqueta"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content sideOffset={6} className="z-50 w-48 rounded-xl border border-gray-300 bg-white p-3 shadow-2xl">
                        <div className="max-h-60 space-y-1 overflow-y-auto">
                          <button
                            onClick={() => setTagFiltroId(null)}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Todas as etiquetas
                          </button>
                          {availableTags.map((tag) => (
                            <button
                              key={tag.Id}
                              onClick={() => setTagFiltroId(tag.Id)}
                              className="block w-full rounded px-3 py-1 text-left text-sm"
                              style={{
                                backgroundColor: tag.cor,
                                color: tag.cor_texto,
                                border: `1px solid ${tag.cor}`,
                              }}
                            >
                              {tag.nome}
                            </button>
                          ))}
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </div>

                <div className="flex flex-wrap gap-1 text-[11px] font-medium text-gray-600">
                  {[
                    { key: 'all', label: 'Todas as Conversas' },
                    { key: 'ia', label: 'IA Ativa' },
                    { key: 'transfers', label: 'Transferências' },
                    { key: 'unread', label: 'Não lidas' },
                    { key: 'unanswered', label: 'Não respondidas' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key as typeof activeTab)}
                      className={`flex-1 min-w-[120px] rounded-md border px-2.5 py-1 transition-colors ${
                        activeTab === tab.key
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-transparent bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de conversas */}
      <div ref={chatListRef} className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-300 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-gray-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600/70 text-sm">Carregando conversas...</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {chatsToShow.map((chat) => {
              const displayName = getDisplayName(chat);
              const isSelected = normalizedSelectedChatId === chat.id;
              const dono = resolveUsuarioDono(chat.remoteJid);
              const jidNorm = normalizeRemoteJid(chat.remoteJid);
              const unreadCount = unreadMessages[jidNorm] || 0;
              const unansweredFor = !chat.lastMessage.fromMe
                ? formatDistanceToNow(
                    new Date(normalizeTimestamp(chat.lastMessage.messageTimestamp) * 1000),
                    { addSuffix: true, locale: ptBR }
                  )
                : null;
              const digitsKey = jidDigits(chat.remoteJid);
              const transferKey = digitsKey ? `${digitsKey}@s.whatsapp.net` : null;
              const isTransfer =
                transferSet.has(jidNorm) || (transferKey ? transferSet.has(transferKey) : false);
              const isSelectedTransfer = isSelected && isTransfer;

              const baseContainerClasses =
                'group relative flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-200';
              let containerTone =
                'bg-white hover:bg-gray-50 border border-transparent';
              if (isSelectedTransfer) {
                containerTone = 'bg-amber-100 border border-amber-300';
              } else if (isSelected) {
                containerTone = 'bg-emerald-50 border border-emerald-300 shadow-sm';
              } else if (isTransfer) {
                containerTone = 'bg-amber-50 border border-amber-200 hover:bg-amber-100';
              } else if (unreadCount > 0) {
                containerTone = 'bg-white border border-emerald-200 shadow-sm hover:border-emerald-300';
              } else if (chat.hasNewMessage) {
                containerTone = 'bg-emerald-50 border border-emerald-200';
              }

              const nameColorClass = isSelectedTransfer
                ? 'text-amber-900'
                : isSelected
                  ? 'text-emerald-700'
                  : isTransfer
                    ? 'text-amber-900'
                    : 'text-gray-800';

              const secondaryTextClass = isSelectedTransfer
                ? 'text-amber-800'
                : isSelected
                  ? 'text-emerald-600'
                  : isTransfer
                    ? 'text-amber-700'
                    : 'text-slate-500';

              const metaTextClass = isSelectedTransfer
                ? 'text-amber-800'
                : isSelected
                  ? 'text-emerald-600'
                  : isTransfer
                    ? 'text-amber-700'
                    : 'text-gray-500';

              const messageTextClass = isSelectedTransfer
                ? 'text-amber-900'
                : isSelected
                  ? 'text-emerald-700'
                  : isTransfer
                    ? 'text-amber-800'
                    : 'text-gray-600';

              const containerClasses = [
                baseContainerClasses,
                containerTone,
                isSelected && !isSelectedTransfer ? 'ring-1 ring-emerald-200/80' : '',
                isSelectedTransfer ? 'ring-2 ring-amber-200/80' : '',
                flashChatIds.has(chat.id) ? 'animate-pulse' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    lastUserInteractionRef.current = Date.now();
                    const jid = normalizeRemoteJid(chat.remoteJid);

                    setUnreadMessages(prev => ({ ...prev, [jid]: 0 }));
                    setChats(prev =>
                      prev.map(c => (c.id === chat.id ? { ...c, hasNewMessage: false } : c))
                    );

                    if (token) {
                      apiClient.visualizarMensagens(token, jid).catch(() => {});
                    }

                    onChatSelect({ ...chat, id: jid, remoteJid: jid });
                  }}
                  className={containerClasses}
                >
                  {/* Container da foto com status de IA */}
                  <div className="relative">
                    {/* Status de IA posicionado acima da foto */}
                    {(() => {
                      const keys = jidCandidates(chat.remoteJid);
                      const hasSession = keys.some(k => sessionsSet.has(k));
                      const hasIntervention = keys.some(k => interventionsSet.has(k));
                      const hasPermanent = keys.some(k => permanentSet.has(k));
                      const iaAtiva = hasSession && !hasIntervention && !hasPermanent;
                      const iaInativa = hasIntervention && !hasPermanent;
                      const iaPermanente = hasPermanent;

                      if (!iaAtiva && !iaInativa && !iaPermanente) return null;

                      return (
                        <div className="absolute -top-2 -right-2 z-10 flex flex-col space-y-1">
                          {iaAtiva && (
                            <div className="bg-green-500 text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                                IA
                              </div>
                            </div>
                          )}
                          {iaInativa && (
                            <div className="bg-red-500 text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                                Int.
                              </div>
                            </div>
                          )}
                          {iaPermanente && (
                            <div className="bg-red-700 text-white text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full shadow-lg border-2 border-white">
                              <div className="flex items-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                                Exc. Perm.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Foto do usuário */}
                    {chat.profilePicUrl ? (
                      <img
                        src={chat.profilePicUrl}
                        alt={chat.pushName}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 transition-all duration-200 group-hover:ring-emerald-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-2 ring-slate-100 transition-all duration-200 group-hover:ring-emerald-200">
                        {getInitials(chat.pushName)}
                      </div>
                    )}
                  </div>

                  {/* Conteúdo da conversa */}
                  <div className="flex-1 min-w-0">
                    {/* Área de metadados */}
                    <div className="mb-1.5 space-y-1">
                      {/* Usuário responsável */}
                      {dono && (
                        <div className="flex items-center">
                          <div
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                              isSelectedTransfer
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : isSelected
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <svg
                              className="w-2.5 h-2.5 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {dono.nome}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const all = tagsMap[normalizeRemoteJid(chat.remoteJid)] || [];
                        if (!all.length) return null;

                        const visible = all.slice(0, 3);
                        const hidden = all.length - visible.length;

                        return (
                          <div className="flex flex-wrap items-center gap-1">
                            {visible.map(tag => (
                              <span
                                key={tag.Id}
                                className="inline-block rounded-full px-1.5 py-[1px] text-[10px] leading-none font-medium border truncate max-w-[120px]"
                                style={{
                                  backgroundColor: tag.cor,
                                  color: tag.cor_texto,
                                  borderColor: tag.cor,
                                }}
                                title={`#${tag.nome}`}
                              >
                                #{formatShort(tag.nome, 14)}
                              </span>
                            ))}
                            {hidden > 0 && (
                              <span
                                className={`inline-block rounded-full px-1.5 py-[1px] text-[10px] leading-none font-medium border ${
                                  isSelectedTransfer
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : isSelected
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : 'bg-gray-100 text-gray-700 border-gray-300'
                                }`}
                                title={`${hidden} etiqueta(s) adicional(is)`}
                              >
                                +{hidden}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {isTransfer && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border border-amber-200 bg-amber-50 text-amber-700">
                          Transferência
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      {/* Nome + número */}
                      <div className="flex flex-col">
                        <h3
                          className={`font-semibold text-sm truncate transition-colors ${nameColorClass}`}
                        >
                          {formatShortName(displayName)}
                        </h3>

                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] truncate ${secondaryTextClass}`}>
                            {formatPhoneNumber(chat.remoteJid)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-medium ${metaTextClass}`}>
                          {formatTimestamp(normalizeTimestamp(chat.lastMessage.messageTimestamp))}
                        </span>

                        {unreadCount > 0 && (
                          <span
                            className={`inline-flex min-w-[20px] h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                              isSelectedTransfer ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                            }`}
                            title="Mensagens não lidas"
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {chat.lastMessage.fromMe && (
                        <div className={`flex-shrink-0 ${metaTextClass}`}>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <p className={`text-xs truncate ${messageTextClass}`}>
                        {getLastMessageText(chat)}
                      </p>
                    </div>

                    {unansweredFor && (
                      <p
                        className={`mt-1 text-[10px] font-medium ${
                          isSelectedTransfer ? 'text-amber-800' : 'text-red-500'
                        }`}
                      >
                        Sem resposta {unansweredFor}
                      </p>
                    )}
                  </div>

                  {/* Indicador visual */}
                  {isSelected && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="h-8 w-1.5 rounded-full bg-emerald-400/60"></div>
                    </div>
                  )}
                </div>
              );
            })}

            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-3000"></div>
              </div>
            )}
            
            {!hasMore && (
              <div className="text-center py-4 text-sm text-gray-600/70">
                Você chegou ao final da lista
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}