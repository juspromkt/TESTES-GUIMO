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
  ChevronDown,
  Volume2,
  VolumeX
} from 'lucide-react';
import { toast } from 'sonner';
import { useMessageEvents } from '../../pages/MessageEventsContext';
import { loadChats, updateCacheFromMessage, setCache, getCache, setChatListLoaded } from '../../utils/chatCache';
import { onChatUpdate, type ChatUpdateEventData } from '../../utils/chatUpdateEvents';


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
  // Props externas opcionais (quando controlado externamente)
  externalSearchTerm?: string;
  externalUsuarioFiltroId?: number | null;
  externalTagFiltroId?: number | null;
  externalUsuarioFiltroIds?: number[];
  externalTagFiltroIds?: number[];
  externalDepartamentoFiltroIds?: number[];
  externalFunilId?: number | null;
  externalStageFiltroIds?: string[];
  externalStartDate?: Date | null;
  externalEndDate?: Date | null;
  externalIaStatusFilter?: 'all' | 'active' | 'inactive';
  externalShowOnlyUnread?: boolean;
  externalShowUnanswered?: boolean;
  externalActiveTab?: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered';
  externalHandleTabChange?: (tab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered') => void;
  onFilteredCountChange?: (count: number) => void;
  onCategoryCountsChange?: (counts: { ia: number; unread: number; unanswered: number; transfers: number }) => void;
}

export function ChatList({
  onChatSelect,
  selectedChatId,
  whatsappType,
  externalSearchTerm,
  externalUsuarioFiltroId,
  externalTagFiltroId,
  externalUsuarioFiltroIds,
  externalTagFiltroIds,
  externalDepartamentoFiltroIds,
  externalFunilId,
  externalStageFiltroIds,
  externalStartDate,
  externalEndDate,
  externalIaStatusFilter,
  externalShowOnlyUnread,
  externalShowUnanswered,
  externalActiveTab,
  externalHandleTabChange,
  onFilteredCountChange,
  onCategoryCountsChange,
}: ChatListProps) {
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

  // Estados internos (usados quando não há controle externo)
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [internalUsuarioFiltroId, setInternalUsuarioFiltroId] = useState<number | null>(null);
  const [internalTagFiltroId, setInternalTagFiltroId] = useState<number | null>(null);
  const [internalUsuarioFiltroIds, setInternalUsuarioFiltroIds] = useState<number[]>([]);
  const [internalTagFiltroIds, setInternalTagFiltroIds] = useState<number[]>([]);
  const [internalDepartamentoFiltroIds, setInternalDepartamentoFiltroIds] = useState<number[]>([]);
  const [internalStageFiltroIds, setInternalStageFiltroIds] = useState<string[]>([]);
  const [internalStartDate, setInternalStartDate] = useState<Date | null>(null);
  const [internalEndDate, setInternalEndDate] = useState<Date | null>(null);
  const [internalIaStatusFilter, setInternalIaStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [internalShowOnlyUnread, setInternalShowOnlyUnread] = useState(false);
  const [internalShowUnanswered, setInternalShowUnanswered] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<'all' | 'ia' | 'transfers' | 'unread' | 'unanswered'>('all');

  // Estado para controlar som de notificação
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('chat_sound_enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Usa valores externos se fornecidos, senão usa internos
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalSearchTerm !== undefined ? () => {} : setInternalSearchTerm;
  const usuarioFiltroId = externalUsuarioFiltroId !== undefined ? externalUsuarioFiltroId : internalUsuarioFiltroId;
  const setUsuarioFiltroId = externalUsuarioFiltroId !== undefined ? () => {} : setInternalUsuarioFiltroId;
  const tagFiltroId = externalTagFiltroId !== undefined ? externalTagFiltroId : internalTagFiltroId;
  const setTagFiltroId = externalTagFiltroId !== undefined ? () => {} : setInternalTagFiltroId;
  const usuarioFiltroIds = externalUsuarioFiltroIds !== undefined ? externalUsuarioFiltroIds : internalUsuarioFiltroIds;
  const setUsuarioFiltroIds = externalUsuarioFiltroIds !== undefined ? () => {} : setInternalUsuarioFiltroIds;
  const tagFiltroIds = externalTagFiltroIds !== undefined ? externalTagFiltroIds : internalTagFiltroIds;
  const setTagFiltroIds = externalTagFiltroIds !== undefined ? () => {} : setInternalTagFiltroIds;
  const departamentoFiltroIds = externalDepartamentoFiltroIds !== undefined ? externalDepartamentoFiltroIds : internalDepartamentoFiltroIds;
  const setDepartamentoFiltroIds = externalDepartamentoFiltroIds !== undefined ? () => {} : setInternalDepartamentoFiltroIds;
  const stageFiltroIds = externalStageFiltroIds !== undefined ? externalStageFiltroIds : internalStageFiltroIds;
  const setStageFiltroIds = externalStageFiltroIds !== undefined ? () => {} : setInternalStageFiltroIds;
  const startDate = externalStartDate !== undefined ? externalStartDate : internalStartDate;
  const setStartDate = externalStartDate !== undefined ? () => {} : setInternalStartDate;
  const endDate = externalEndDate !== undefined ? externalEndDate : internalEndDate;
  const setEndDate = externalEndDate !== undefined ? () => {} : setInternalEndDate;
  const iaStatusFilter = externalIaStatusFilter !== undefined ? externalIaStatusFilter : internalIaStatusFilter;
  const setIaStatusFilter = externalIaStatusFilter !== undefined ? () => {} : setInternalIaStatusFilter;
  const showOnlyUnread = externalShowOnlyUnread !== undefined ? externalShowOnlyUnread : internalShowOnlyUnread;
  const setShowOnlyUnread = externalShowOnlyUnread !== undefined ? () => {} : setInternalShowOnlyUnread;
  const showUnanswered = externalShowUnanswered !== undefined ? externalShowUnanswered : internalShowUnanswered;
  const setShowUnanswered = externalShowUnanswered !== undefined ? () => {} : setInternalShowUnanswered;
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = externalActiveTab !== undefined ? () => {} : setInternalActiveTab;

  // Determina se está sendo controlado externamente
  const isExternallyControlled = externalSearchTerm !== undefined;

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;
  const [usuariosPorContato, setUsuariosPorContato] = useState<any[]>([]);
  const [tagsMap, setTagsMap] = useState<Record<string, Tag[]>>({});
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [departamentosMap, setDepartamentosMap] = useState<Record<string, any[]>>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [permanentExclusions, setPermanentExclusions] = useState<any[]>([]);
  const [contactMap, setContactMap] = useState<Record<string, Contact>>({});
  const [contactSearch, setContactSearch] = useState('');
  const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [manuallyMarkedUnread, setManuallyMarkedUnread] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('manually_marked_unread');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [showControls, setShowControls] = useState(false);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        // Criar contexto de áudio
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Criar oscilador para tom
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configurar som de notificação (tom duplo agradável)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

        // Configurar volume com fade out
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        // Tocar som
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (err) {
        console.log('Erro ao tocar som:', err);
      }
    }
  };

  // Função para alternar som e salvar no localStorage
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('chat_sound_enabled', JSON.stringify(newValue));
  };

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

        let data: any = [];
        if (response.ok) {
          try {
            const text = await response.text();
            data = text ? JSON.parse(text) : [];
          } catch (err) {
            console.warn('⚠️ Resposta vazia ou inválida ao carregar transferências');
            data = [];
          }
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

  function handleTabChange(tab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered') {
    lastUserInteractionRef.current = Date.now();

    // Usa função externa se disponível
    if (externalHandleTabChange) {
      externalHandleTabChange(tab);
      if (tab === 'transfers') {
        void loadTransfers();
      }
      return;
    }

    // Lógica interna
    setInternalActiveTab(tab);
    switch (tab) {
      case 'ia':
        setInternalIaStatusFilter('active');
        setInternalShowOnlyUnread(false);
        setInternalShowUnanswered(false);
        break;
      case 'transfers':
        setInternalIaStatusFilter('all');
        setInternalShowOnlyUnread(false);
        setInternalShowUnanswered(false);
        void loadTransfers();
        break;
      case 'unread':
        setInternalIaStatusFilter(prev => (prev === 'active' ? 'all' : prev));
        setInternalShowOnlyUnread(true);
        setInternalShowUnanswered(false);
        break;
      case 'unanswered':
        setInternalIaStatusFilter(prev => (prev === 'active' ? 'all' : prev));
        setInternalShowOnlyUnread(false);
        setInternalShowUnanswered(true);
        break;
      default:
        setInternalIaStatusFilter(prev => (prev === 'active' ? 'all' : prev));
        setInternalShowOnlyUnread(false);
        setInternalShowUnanswered(false);
    }
  }

  const hasActiveFilters = useMemo(
    () =>
      searchTerm.trim() !== '' ||
      activeTab !== 'all' ||
      iaStatusFilter !== 'all' ||
      usuarioFiltroId !== null ||
      tagFiltroId !== null ||
      usuarioFiltroIds.length > 0 ||
      tagFiltroIds.length > 0 ||
      stageFiltroIds.length > 0 ||
      startDate !== null ||
      endDate !== null ||
      showOnlyUnread ||
      showUnanswered,
    [
      searchTerm,
      activeTab,
      iaStatusFilter,
      usuarioFiltroId,
      tagFiltroId,
      usuarioFiltroIds,
      tagFiltroIds,
      stageFiltroIds,
      startDate,
      endDate,
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

  // Função para enriquecer chats com dados de negociação
  const enrichChatsWithDeals = useCallback(async (chats: Chat[]): Promise<Chat[]> => {
    if (!token || chats.length === 0) return chats;

    try {
      console.log('[enrichChatsWithDeals] Iniciando enriquecimento de', chats.length, 'chats');

      // 1. Buscar as 100 negociações mais recentes
      const allDeals = await apiClient.findDeals(token, 1, 100);
      console.log('[enrichChatsWithDeals] Buscadas', allDeals.length, 'negociações');

      if (!allDeals || allDeals.length === 0) {
        console.log('[enrichChatsWithDeals] Nenhuma negociação encontrada');
        return chats;
      }

      // 2. Criar mapa de negociações por id_contato
      const dealsByContactId: Record<number, any> = {};
      allDeals.forEach((deal) => {
        // Tenta várias variações do campo id_contato
        const idContato = deal.id_contato || deal.idContato || deal.IdContato || deal.contactId;
        if (idContato) {
          dealsByContactId[idContato] = deal;
        }
      });

      console.log('[enrichChatsWithDeals] Mapa de negociações criado:', Object.keys(dealsByContactId).length, 'contatos mapeados');

      // 3. Enriquecer cada chat com os dados da negociação
      let enrichedCount = 0;
      const enrichedChats = chats.map(chat => {
        const contactId = chat.contactId;

        if (!contactId) {
          return chat;
        }

        const deal = dealsByContactId[contactId];

        if (deal) {
          enrichedCount++;
          return {
            ...chat,
            chatFunilId: deal.id_funil,
            chatStageId: String(deal.id_estagio),
          };
        }

        return chat;
      });

      console.log('[enrichChatsWithDeals] Enriquecidos', enrichedCount, 'chats com dados de negociação');
      return enrichedChats;
    } catch (error) {
      console.error('[enrichChatsWithDeals] Erro ao enriquecer chats:', error);
      return chats; // Retorna os chats originais em caso de erro
    }
  }, [token]);

  // Adicione esta função após loadSessionData:
  const loadUnreadMessages = useCallback(async () => {
    if (!token) return;
    try {
      const unread = await apiClient.findMensagensNaoLidas(token);
      const unreadMap: Record<string, number> = {};
      unread.forEach((item: any) => {
        unreadMap[normalizeRemoteJid(item.remoteJid)] = item.qtdMensagens;
      });

      // Aplica override para conversas marcadas manualmente como não lidas
      manuallyMarkedUnread.forEach(jid => {
        // Se não tem mensagens não lidas do servidor, marca com -1
        if (!unreadMap[jid] || unreadMap[jid] === 0) {
          unreadMap[jid] = -1;
        }
      });

      setUnreadMessages(unreadMap);
    } catch (err) {
      console.error('Erro ao carregar mensagens não lidas:', err);
    }
  }, [token, manuallyMarkedUnread]);

  // Atualiza mensagens não lidas a cada 3 segundos
  useEffect(() => {
    if (!token) return;

    // Carrega imediatamente
    loadUnreadMessages();

    // Atualiza a cada 3 segundos
    const intervalId = setInterval(() => {
      loadUnreadMessages();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [token, loadUnreadMessages]);

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

  function removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

  const loadDepartamentos = useCallback(async () => {
    if (!token) return;
    try {
      const { isDepartamento } = await import('../../types/departamento');

      // Buscar departamentos disponíveis
      const produtosRes = await fetch('https://n8n.lumendigital.com.br/webhook/produtos/get', {
        headers: { token }
      });
      const produtosData = produtosRes.ok ? await produtosRes.json() : [];
      const departamentos = Array.isArray(produtosData) ? produtosData.filter(isDepartamento) : [];

      console.log('🏢 [loadDepartamentos] Departamentos disponíveis:', departamentos.length);

      // Buscar negociações usando apiClient
      const negociacoesData = await apiClient.findDeals(token, 1, 1000);
      const negociacoes = Array.isArray(negociacoesData) ? negociacoesData : [];

      console.log('📋 [loadDepartamentos] Negociações carregadas:', negociacoes.length);

      const map: Record<string, any[]> = {};
      let processadas = 0;

      // Para cada negociação, buscar seus departamentos
      for (const negociacao of negociacoes) {
        try {
          const telefone = String(negociacao.telefone_lead || '').replace(/\D/g, '');
          if (!telefone) continue;

          // Buscar departamentos desta negociação
          const response = await fetch(
            `https://n8n.lumendigital.com.br/webhook/produtos/lead/get?id_negociacao=${negociacao.Id}`,
            { headers: { token } }
          );

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              const deptIds = data.filter(item => item.id_produto).map(item => item.id_produto);
              const depts = departamentos.filter(dept => deptIds.includes(dept.Id));

              if (depts.length > 0) {
                // Criar variações de chaves
                const baseJid = `${telefone}@s.whatsapp.net`;
                const normalized = normalizeRemoteJid(baseJid);
                const digits = jidDigits(baseJid);

                const keys = [baseJid];
                if (normalized && normalized !== baseJid) keys.push(normalized);
                if (digits) keys.push(digits);

                // Adicionar departamentos para todas as chaves
                keys.forEach(key => {
                  if (!map[key]) map[key] = [];
                  depts.forEach(dept => {
                    if (!map[key].some(d => d.Id === dept.Id)) {
                      map[key].push(dept);
                    }
                  });
                });

                processadas++;
              }
            }
          }
        } catch (err) {
          // Ignora erros individuais
          continue;
        }
      }

      console.log('✅ [loadDepartamentos] Processadas:', processadas, 'negociações com departamentos');
      console.log('📦 [loadDepartamentos] Total de chaves mapeadas:', Object.keys(map).length);

      setDepartamentosMap(map);
    } catch (err) {
      console.error('❌ Erro ao carregar departamentos:', err);
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

  useEffect(() => {
    const timer = setTimeout(loadDepartamentos, 0);
    const handler = (e: StorageEvent) => {
      if (e.key === 'departamentos_updated') {
        loadDepartamentos();
      }
    };
    window.addEventListener('storage', handler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handler);
    };
  }, [loadDepartamentos]);

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

  // 🔹 Lê contatos criados manualmente do cache local e adiciona ao contactMap
useEffect(() => {
  try {
    const cache = localStorage.getItem('contacts_cache');
    if (cache) {
      const parsed = JSON.parse(cache);
      setContactMap(prev => ({ ...prev, ...parsed }));
      console.log('✅ Contatos locais carregados do contacts_cache:', Object.keys(parsed).length);
    }
  } catch (err) {
    console.warn('⚠️ Erro ao carregar contacts_cache local:', err);
  }
}, []);


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
    const contactUpdatedHandler = () => {
      // Recarrega dados do usuário responsável quando contato é atualizado
      loadUsuarios();
      loadContactMap();
      loadInternalContacts();
    };
    window.addEventListener('storage', handler);
    window.addEventListener('contacts_updated', customHandler as EventListener);
    window.addEventListener('contactUpdated', contactUpdatedHandler as EventListener);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('contacts_updated', customHandler as EventListener);
      window.removeEventListener('contactUpdated', contactUpdatedHandler as EventListener);
    };
  }, [loadContactMap, loadInternalContacts, loadUsuarios]);

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

  // ✅ NOVO: Recarregar ChatList ao trocar responsável
  useEffect(() => {
    const handleResponsavelUpdate = () => {
      console.log("[ChatList] Responsável atualizado — recarregando sessões");
      loadSessionData(); // força recarregamento dos dados de sessões/usuários
    };

    window.addEventListener("responsavel_updated", handleResponsavelUpdate);

    return () => {
      window.removeEventListener("responsavel_updated", handleResponsavelUpdate);
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
        .then(async (chats) => {
          const rawChats = Array.isArray(chats) ? chats : [];
          const normalized = rawChats.map(c => ({
            ...c,
            lastMessage: {
              ...c.lastMessage,
              messageTimestamp: normalizeTimestamp(c.lastMessage.messageTimestamp)
            }
          }));

          // Enriquecer com dados de negociação
          const enriched = await enrichChatsWithDeals(normalized);

          setChats(enriched);
          setHasMore(rawChats.length >= 50);
          pageRef.current = 1;
          lastScrollTopRef.current = 0;
          loadingMoreFlagRef.current = false;

          loadSessionData();
          setTimeout(loadTags, 0);
          setTimeout(loadUsuarios, 0);
          setTimeout(loadUnreadMessages, 0);

          const now = Date.now();
          setCache(enriched, now, rawChats.length);
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
      .then(async ({ chats, pageSize }) => {
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

        // Enriquecer com dados de negociação
        const enrichedWithDeals = await enrichChatsWithDeals(enriched);

        const merged = mergeChats(enrichedWithDeals, []);
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

      // 🔹 Declara dealsByContactId no escopo da função para uso em ambos os blocos
      let dealsByContactId: Record<number, any> = {};

      try {
        void loadTransfers(true, !preserveExisting);

        // 🔹 CARREGA NEGOCIAÇÕES (INDEPENDENTE DO TIPO DE WHATSAPP)
        console.log('🚀 INICIANDO CARREGAMENTO DE NEGOCIAÇÕES', {
          externalFunilId
        });

        // Carrega todas as negociações
        const dealsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token },
          body: JSON.stringify({ page: 1, offset: 1000 })
        }).then(async r => {
          if (!r.ok) return [];
          try {
            const text = await r.text();
            return text ? JSON.parse(text) : [];
          } catch (err) {
            console.warn('⚠️ Resposta vazia ou inválida ao carregar negociações');
            return [];
          }
        });

        const allDealsRaw = Array.isArray(dealsResponse) ? dealsResponse : [];
        console.log('📊 Negociações carregadas:', allDealsRaw.length);

        // Remove duplicados por ID
        const uniqueDealsMap = new Map<number, any>();
        for (const d of allDealsRaw) {
          if (d.Id && !uniqueDealsMap.has(d.Id)) {
            uniqueDealsMap.set(d.Id, d);
          }
        }
        const allDeals = Array.from(uniqueDealsMap.values());

        // DEBUG: Mostra amostra da estrutura das negociações
        if (allDeals.length > 0) {
          console.log('📝 Amostra de negociação (primeira):', allDeals[0]);
          console.log('🔍 Campos importantes:', {
            'id_contato': allDeals[0].id_contato,
            'id_funil': allDeals[0].id_funil,
            'id_estagio': allDeals[0].id_estagio
          });
        }

        // 🔹 Popula o mapa de negociações por id_contato
        allDeals.forEach((deal: any) => {
          const idContato = deal.id_contato || deal.idContato || deal.IdContato || deal.contactId;
          if (idContato) {
            const existing = dealsByContactId[idContato];
            if (!existing || new Date(deal.UpdatedAt || deal.CreatedAt) > new Date(existing.UpdatedAt || existing.CreatedAt)) {
              dealsByContactId[idContato] = deal;
            }
          }
        });

        console.log('🗺️ Negociações mapeadas por id_contato:', Object.keys(dealsByContactId).length, 'contatos');

        if (whatsappType === 'WHATSAPP-BUSINESS') {
          if (!preserveExisting) {
            clearApiCache([
              getCacheKey('findContactInterno', token),
              getCacheKey('findChats', token, { page: 1, offset: 50 }),
            ]);
          }

          console.log('🚀 CARREGANDO DADOS CRM (WHATSAPP-BUSINESS)', {
            externalFunilId,
            useCRMEnriched: true
          });

          // 🔹 REPLICANDO EXATAMENTE A LÓGICA DO CRM
          // Carrega: contatos CRM e chats WhatsApp
          const [contatosCRM, chats] = await Promise.all([
            // Usa o mesmo endpoint do CRM para carregar contatos
            fetch('https://n8n.lumendigital.com.br/webhook/prospecta/contato/get', {
              headers: { token }
            }).then(async r => {
              if (!r.ok) return [];
              try {
                const text = await r.text();
                return text ? JSON.parse(text) : [];
              } catch (err) {
                console.warn('⚠️ Resposta vazia ou inválida ao carregar contatos CRM');
                return [];
              }
            }),
            apiClient.findChats(token, 1, 50, true)
          ]);

          // 🔹 Mapeia contatos CRM para o formato do chat
          const map: Record<string, Contact> = {};
          const contactosCRMArray = Array.isArray(contatosCRM) ? contatosCRM : [];

          console.log('👥 Contatos CRM carregados:', contactosCRMArray.length);
          if (contactosCRMArray.length > 0) {
            console.log('📝 Amostra de contato (primeiro):', contactosCRMArray[0]);
            console.log('📝 Campos disponíveis:', Object.keys(contactosCRMArray[0]));
            console.log('🔍 VERIFICANDO CAMPOS DO CONTATO:', {
              'contato.Id': contactosCRMArray[0].Id,
              'contato.id': contactosCRMArray[0].id,
              'contato.ID': contactosCRMArray[0].ID,
              'contato.contactId': contactosCRMArray[0].contactId
            });
          }

          let matchCount = 0;
          let noMatchCount = 0;

          contactosCRMArray.forEach((contatoCRM: any, index: number) => {
            const telefone = String(contatoCRM?.telefone || '').replace(/\D/g, '');
            if (!telefone) return;

            const baseJid = `${telefone}@s.whatsapp.net`;
            const normalized = normalizeRemoteJid(baseJid);

            // 🔹 Busca a negociação deste contato (IGUAL AO CRM)
            // Tenta diferentes variações do campo ID
            const contatoId = contatoCRM?.Id || contatoCRM?.id || contatoCRM?.ID || contatoCRM?.contactId;
            const deal = contatoId ? dealsByContactId[contatoId] : null;

            // Log detalhado para os primeiros 3 contatos
            if (index < 3) {
              console.log(`🔍 Tentando mapear contato #${index}:`, {
                nome: contatoCRM?.nome,
                contatoId,
                'contatoCRM.Id': contatoCRM?.Id,
                'contatoCRM.id': contatoCRM?.id,
                dealEncontrado: !!deal,
                dealInfo: deal ? { id_funil: deal.id_funil, id_estagio: deal.id_estagio } : null
              });
            }
            const estagioId = deal?.id_estagio ? String(deal.id_estagio) : null;
            const funilId = deal?.id_funil || null;

            const contact: Contact = {
              id: baseJid,
              remoteJid: baseJid,
              pushName:
                sanitizePushName(
                  typeof contatoCRM?.nome === 'string' ? contatoCRM.nome : undefined,
                  baseJid,
                ) || baseJid.split('@')[0],
              profilePicUrl: null,
              estagioId,
              funilId,
              Id: contatoId
            };

            // Contabiliza matches
            if (deal) {
              matchCount++;
            } else if (contatoId) {
              noMatchCount++;
            }

            // DEBUG - Log detalhado dos dados (apenas para primeiros 5)
            if (index < 5) {
              if (deal) {
                console.log('✅ Contato COM negociação:', {
                  nome: contatoCRM?.nome,
                  telefone,
                  contactId: contatoId,
                  deal: {
                    Id: deal.Id,
                    titulo: deal.titulo,
                    id_contato: deal.id_contato || deal.idContato || deal.IdContato,
                    id_funil: deal.id_funil,
                    id_estagio: deal.id_estagio
                  },
                  parsed: {
                    funilId,
                    estagioId
                  }
                });
              } else if (contatoId) {
                console.log('⚠️ Contato SEM negociação:', {
                  nome: contatoCRM?.nome,
                  telefone,
                  contactId: contatoId
                });
              }
            }

            map[baseJid] = contact;
            if (normalized && normalized !== baseJid) {
              map[normalized] = { ...contact, remoteJid: normalized };
            }
            const digits = jidDigits(baseJid);
            if (digits && !map[digits]) {
              map[digits] = contact;
            }
          });

          // DEBUG: Resumo final
          const contatosComNegociacao = Object.values(map).filter(c => c.funilId).length;
          console.log('📈 RESUMO FINAL:', {
            totalContatos: Object.keys(map).length,
            contatosComNegociacao,
            contatosSemNegociacao: Object.keys(map).length - contatosComNegociacao,
            matchesDuranteProcessamento: matchCount,
            semMatchDuranteProcessamento: noMatchCount
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

            // 🔹 BUSCA NEGOCIAÇÃO DO CONTATO PARA PEGAR id_funil e id_estagio
            const contactId = (contact as any)?.Id ?? (contact as any)?.id ?? chat.contactId;
            const deal = contactId ? dealsByContactId[contactId] : null;

            const chatFunilId = deal?.id_funil || null;
            const chatStageId = deal?.id_estagio ? String(deal.id_estagio) : null;

            // DEBUG: Log dos primeiros 3 chats enriquecidos
            const enrichedChat = {
              ...chat,
              contactId,
              pushName:
                sanitizePushName(contact?.pushName || chat.pushName, chat.remoteJid) ||
                chat.remoteJid.split('@')[0],
              profilePicUrl:
                contact?.profilePicUrl ?? chat.profilePicUrl ?? null,
              chatFunilId,  // 🔹 USA O NOME CORRETO: chatFunilId
              chatStageId,  // 🔹 USA O NOME CORRETO: chatStageId
              lastMessage: {
                ...chat.lastMessage,
                messageTimestamp: normalizeTimestamp(
                  chat.lastMessage.messageTimestamp,
                ),
              },
            };

            return enrichedChat;
          }).map((chat, index) => {
            // DEBUG: Log dos primeiros 3 chats enriquecidos
            if (index < 3) {
              console.log(`💬 Chat enriquecido (BUSINESS) #${index}:`, {
                remoteJid: chat.remoteJid,
                pushName: chat.pushName,
                contactId: (chat as any).contactId,
                chatFunilId: (chat as any).chatFunilId,
                chatStageId: (chat as any).chatStageId
              });
            }
            return chat;
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

            const contactId = (c as any)?.Id ?? (c as any)?.id ?? chat.contactId;

            return {
              ...chat,
              contactId,
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

          // Enriquecer com dados de negociação
          const enrichedWithDeals = await enrichChatsWithDeals(enriched);

          const base = preserveExisting ? chatsRef.current : [];
          const merged = mergeChats(base, enrichedWithDeals);
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


  // Ref para o elemento sentinela (detecta quando chegamos ao final)
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // IntersectionObserver - Funciona independente de qual elemento está fazendo o scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || loading || loadingMore || !hasMore) {
      isLoadingRef.current = false;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        // Evitar múltiplos carregamentos simultâneos
        if (entry.isIntersecting && !isLoadingRef.current && !loadingMore) {
          isLoadingRef.current = true;
          const nextPage = pageRef.current + 1;

          void fetchChats(nextPage).finally(() => {
            isLoadingRef.current = false;
          });
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
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
  const query = searchTerm.toLowerCase().trim();

  const result = chats.filter(chat => {
    const displayName =
      sanitizePushName(chat.pushName, chat.remoteJid) ||
      chat.remoteJid.split('@')[0] ||
      'Contato';

    // 🔍 FIRST: Search by name OR phone (including partial matches)
    if (query) {
      const phoneDigits = extractPhoneNumber(chat.remoteJid);
      const displayNameLower = displayName.toLowerCase();
      const displayNameNormalized = removeAccents(displayNameLower);
      const queryNormalized = removeAccents(query);
      const queryDigitsOnly = query.replace(/\D/g, '');

      const nameMatch = displayNameNormalized.includes(queryNormalized);
      // Only match phone if query contains digits
      const phoneMatch = queryDigitsOnly.length > 0 && phoneDigits.includes(queryDigitsOnly);

      if (!nameMatch && !phoneMatch) return false;
    }

    const jidNorm = normalizeRemoteJid(chat.remoteJid);
    const unreadCount = unreadMessages[jidNorm] || 0;
    const digitsKey = jidDigits(chat.remoteJid);
    const transferKey = digitsKey ? `${digitsKey}@s.whatsapp.net` : null;
    const isTransferChat =
      transferSet.has(jidNorm) || (transferKey ? transferSet.has(transferKey) : false);

    // Legacy single-select filters (for backward compatibility)
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

    // Multi-select filter for responsibles
    if (usuarioFiltroIds.length > 0) {
      const dono = resolveUsuarioDono(chat.remoteJid);
      if (!dono || !usuarioFiltroIds.includes(dono.Id)) return false;
    }

    // Multi-select filter for tags
    if (tagFiltroIds.length > 0) {
      const normalized = normalizeRemoteJid(chat.remoteJid);
      const digits = jidDigits(chat.remoteJid);
      const tags =
        tagsMap[normalized] ||
        (digits ? tagsMap[digits] : undefined) ||
        [];
      // Check if chat has at least one of the selected tags
      if (!tags.some(t => tagFiltroIds.includes(t.Id))) return false;
    }

    // Multi-select filter for departamentos
    if (departamentoFiltroIds.length > 0) {
      const normalized = normalizeRemoteJid(chat.remoteJid);
      const digits = jidDigits(chat.remoteJid);

      // Tentar encontrar departamentos usando múltiplas chaves possíveis
      const departamentos =
        departamentosMap[chat.remoteJid] || // Formato original
        departamentosMap[normalized] || // Normalizado
        (digits ? departamentosMap[digits] : undefined) || // Apenas dígitos
        [];

      // Debug: log quando filtrar
      if (departamentos.length > 0) {
        console.log('🔍 [Filtro Departamentos] Chat:', chat.pushName, 'remoteJid:', chat.remoteJid, 'departamentos:', departamentos.map((d: any) => d.nome));
      }

      // Check if chat has at least one of the selected departamentos
      if (!departamentos.some((d: any) => departamentoFiltroIds.includes(d.Id))) return false;
    }

    // Multi-select filter for stages (etapas do funil)
    // 🔹 Filtra pelo chatStageId (id_estagio da negociação vinculada ao chat)
    if (stageFiltroIds.length > 0) {
      const chatStageId = (chat as any).chatStageId;

      // Verifica se o chat tem um dos estágios selecionados
      if (!chatStageId || !stageFiltroIds.includes(chatStageId)) {
        return false;
      }
    }

    // Date range filter (filters by last message timestamp)
    if (startDate || endDate) {
      const messageTimestamp = normalizeTimestamp(chat.lastMessage.messageTimestamp);
      const messageDate = new Date(messageTimestamp * 1000);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (messageDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (messageDate > end) return false;
      }
    }

    if (showOnlyUnread && unreadCount === 0) return false;
    if (showUnanswered && chat.lastMessage.fromMe) return false;

    // Filter by active tab
    if (activeTab === 'ia') {
      // Show only chats with active IA
      const isIAPermanente = permanentSet.has(jidNorm);
      const isIAAtiva =
        sessionsSet.has(jidNorm) && !interventionsSet.has(jidNorm) && !isIAPermanente;
      if (!isIAAtiva) return false;
    } else if (activeTab === 'unread') {
      // Show only unread chats
      if (unreadCount === 0) return false;
    } else if (activeTab === 'unanswered') {
      // Show only unanswered chats (last message is not from me)
      if (chat.lastMessage.fromMe) return false;
    } else if (activeTab === 'transfers') {
      // Show only transfer chats
      if (!isTransferChat) return false;
    }

    if (iaStatusFilter !== 'all') {
      const isIAPermanente = permanentSet.has(jidNorm);
      const isIAAtiva =
        sessionsSet.has(jidNorm) && !interventionsSet.has(jidNorm) && !isIAPermanente;
      const isIAInativa = interventionsSet.has(jidNorm) && !isIAPermanente;

      if (iaStatusFilter === 'active' && !isIAAtiva) return false;
      if (iaStatusFilter === 'inactive' && !(isIAInativa || isIAPermanente)) return false;
    }

    return true;
  });

  return result;
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
  tagFiltroIds,
  usuarioFiltroIds,
  stageFiltroIds,
  startDate,
  endDate,
  resolveUsuarioDono,
  usuarioFiltroId,
  contactMap,
]);

const chatsToShow = filteredChats;

  const [flashChatIds, setFlashChatIds] = useState<Set<string>>(new Set());

  // Notify parent of filtered count changes
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredChats.length);
    }
  }, [filteredChats, onFilteredCountChange]);

  // Calculate category counts for all filter tabs
  // This counts ALL chats matching base filters (search, tags, dates, etc) but ignores activeTab
  useEffect(() => {
    if (!onCategoryCountsChange) return;

    let iaCount = 0;
    let unreadCount = 0;
    let unansweredCount = 0;
    let transfersCount = 0;

    // Process all chats (not just loaded ones)
    chats.forEach(chat => {
      const jidNorm = normalizeRemoteJid(chat.remoteJid);
      const displayName = sanitizePushName(chat.pushName, chat.remoteJid) || chat.remoteJid.split('@')[0] || 'Contato';
      const unreadMsgCount = unreadMessages[jidNorm] || 0;
      const digitsKey = jidDigits(chat.remoteJid);
      const transferKey = digitsKey ? `${digitsKey}@s.whatsapp.net` : null;
      const isTransfer = transferSet.has(jidNorm) || (transferKey ? transferSet.has(transferKey) : false);

      // Apply base filters (same as filteredChats but WITHOUT activeTab filter)

      // Search filter
      const query = searchTerm.toLowerCase().trim();
      if (query) {
        const phoneDigits = extractPhoneNumber(chat.remoteJid);
        const displayNameLower = displayName.toLowerCase();
        const displayNameNormalized = removeAccents(displayNameLower);
        const queryNormalized = removeAccents(query);
        const queryDigitsOnly = query.replace(/\D/g, '');
        const nameMatch = displayNameNormalized.includes(queryNormalized);
        const phoneMatch = queryDigitsOnly.length > 0 && phoneDigits.includes(queryDigitsOnly);
        if (!nameMatch && !phoneMatch) return;
      }

      // Legacy filters
      if (usuarioFiltroId) {
        const dono = resolveUsuarioDono(chat.remoteJid);
        if (!dono || dono.Id !== usuarioFiltroId) return;
      }
      if (tagFiltroId) {
        const tags = tagsMap[jidNorm] || (digitsKey ? tagsMap[digitsKey] : undefined) || [];
        if (!tags.some(t => t.Id === tagFiltroId)) return;
      }

      // Multi-select filters
      if (usuarioFiltroIds && usuarioFiltroIds.length > 0) {
        const dono = resolveUsuarioDono(chat.remoteJid);
        if (!dono || !usuarioFiltroIds.includes(dono.Id)) return;
      }
      if (tagFiltroIds && tagFiltroIds.length > 0) {
        const tags = tagsMap[jidNorm] || (digitsKey ? tagsMap[digitsKey] : undefined) || [];
        if (!tags.some(t => tagFiltroIds.includes(t.Id))) return;
      }
      if (stageFiltroIds && stageFiltroIds.length > 0) {
        const chatStageId = (chat as any).chatStageId;
        if (!chatStageId || !stageFiltroIds.includes(chatStageId)) return;
      }

      // Date range filter
      if (startDate || endDate) {
        const messageTimestamp = normalizeTimestamp(chat.lastMessage.messageTimestamp);
        const messageDate = new Date(messageTimestamp * 1000);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (messageDate < start) return;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (messageDate > end) return;
        }
      }

      // Legacy boolean filters
      if (showOnlyUnread && unreadMsgCount === 0) return;
      if (showUnanswered && chat.lastMessage.fromMe) return;

      // IA status filter
      if (iaStatusFilter !== 'all') {
        const isIAPermanente = permanentSet.has(jidNorm);
        const isIAAtiva = sessionsSet.has(jidNorm) && !interventionsSet.has(jidNorm) && !isIAPermanente;
        const isIAInativa = interventionsSet.has(jidNorm) && !isIAPermanente;
        if (iaStatusFilter === 'active' && !isIAAtiva) return;
        if (iaStatusFilter === 'inactive' && !(isIAInativa || isIAPermanente)) return;
      }

      // Now count for each category (this chat passed all base filters)
      const isIAPermanente = permanentSet.has(jidNorm);
      const isIAAtiva = sessionsSet.has(jidNorm) && !interventionsSet.has(jidNorm) && !isIAPermanente;

      if (isIAAtiva) iaCount++;
      if (unreadMsgCount > 0) unreadCount++;
      if (!chat.lastMessage.fromMe) unansweredCount++;
      if (isTransfer) transfersCount++;
    });

    onCategoryCountsChange({ ia: iaCount, unread: unreadCount, unanswered: unansweredCount, transfers: transfersCount });
  }, [chats, searchTerm, unreadMessages, transferSet, sessionsSet, interventionsSet, permanentSet, tagsMap, departamentosMap, tagFiltroId, tagFiltroIds, departamentoFiltroIds, usuarioFiltroId, usuarioFiltroIds, stageFiltroIds, startDate, endDate, iaStatusFilter, showOnlyUnread, showUnanswered, onCategoryCountsChange, contactMap, resolveUsuarioDono, sanitizePushName, extractPhoneNumber, removeAccents]);

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
  const onForceReload = () => {
    scheduleResumeRefresh('force_reload');
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onOnline);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('chat_list_force_reload', onForceReload);

  return () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('pageshow', onPageShow);
    window.removeEventListener('chat_list_force_reload', onForceReload);
    if (resumeRefreshTimeoutRef.current !== null) {
      window.clearTimeout(resumeRefreshTimeoutRef.current);
      resumeRefreshTimeoutRef.current = null;
    }
  };
}, [scheduleResumeRefresh]);

useMessageEvents((msg) => {
  // 1. Atualiza o cache primeiro
  updateCacheFromMessage(msg);

  lastRealtimeUpdateRef.current = Date.now();

  const resolved = normalizeRemoteJid(msg.key.remoteJid);
  const isInbound = !msg.key.fromMe;
  const ts =
    typeof (msg as any).messageTimestamp === 'number'
      ? normalizeTimestamp((msg as any).messageTimestamp)
      : Math.floor(Date.now() / 1000);

  // Tocar som se for mensagem recebida (não enviada por mim)
  if (isInbound) {
    playNotificationSound();
  }

  // 2. Pega os chats atualizados do cache (já ordenados)
  const cachedChats = getCache().chats || [];

  // 3. Enriquece com dados de contato e mantém lastMessage atualizado
  const updated = cachedChats.map(chat => {
    const normalized = normalizeRemoteJid(chat.remoteJid);
    const digits = jidDigits(chat.remoteJid);
    const c =
      contactMap[chat.remoteJid] ||
      (normalized ? contactMap[normalized] : undefined) ||
      (digits ? contactMap[digits] : undefined);

    // Se for inbound para este chat, salva o timestamp
    const lastInboundTimestamp = (chat.id === resolved && isInbound) ? ts : (chat as any).lastInboundTimestamp;

    return {
      ...chat,
      contactId: (c as any)?.Id ?? (c as any)?.id ?? chat.contactId,
      pushName:
        sanitizePushName(c?.pushName || chat.pushName, chat.remoteJid) ||
        chat.remoteJid.split('@')[0],
      profilePicUrl: c?.profilePicUrl ?? chat.profilePicUrl ?? null,
      lastInboundTimestamp,
      // lastMessage já vem atualizado do cache
    };
  });

  // 4. Atualiza o estado com os chats ordenados e atualizados
  setChats(updated);

  if (normalizedSelectedChatId) {
    const sel = updated.find(c => c.id === normalizedSelectedChatId);
    if (sel && sel.id !== normalizedSelectedChatId) {
      onChatSelect(sel);
    }
  }

  // 5. Flash visual no chat selecionado
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

// 🔔 Listener para atualização em tempo real de TODOS os campos do chat
useEffect(() => {
  const unsubscribe = onChatUpdate('chat:update', async (data: ChatUpdateEventData) => {
    console.log('📥 Evento recebido em ChatList:', data);
    const { remoteJid, ...updates } = data;

    if (!remoteJid) {
      // Se não tiver remoteJid, recarregar toda a lista
      if (token) {
        try {
          const result = await loadChats(token, true);
          const enriched = result.chats.map(chat => {
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

          // Enriquecer com dados de negociação
          const enrichedWithDeals = await enrichChatsWithDeals(enriched);

          setChats(enrichedWithDeals);
        } catch (err) {
          console.error('Erro ao recarregar lista:', err);
        }
      }
      return;
    }

    // Atualização específica de um chat
    const normalized = normalizeRemoteJid(remoteJid);

    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id !== normalized && chat.remoteJid !== remoteJid) {
          return chat;
        }

        // Aplicar todas as atualizações
        const updatedChat = { ...chat };

        if (updates.tags !== undefined) {
          (updatedChat as any).tags = updates.tags;
        }
        if (updates.iaStatus !== undefined) {
          (updatedChat as any).iaStatus = updates.iaStatus;
        }
        if (updates.stage !== undefined) {
          (updatedChat as any).stage = updates.stage;
        }
        if (updates.name !== undefined) {
          updatedChat.pushName = sanitizePushName(updates.name, chat.remoteJid) || chat.remoteJid.split('@')[0];
        }
        if (updates.responsibleId !== undefined) {
          (updatedChat as any).responsibleId = updates.responsibleId;
        }
        if (updates.lastMessage !== undefined) {
          updatedChat.lastMessage = {
            ...updatedChat.lastMessage,
            ...updates.lastMessage
          };
        }

        return updatedChat;
      });

      // Se lastMessage foi atualizado, reordenar a lista
      if (updates.lastMessage !== undefined) {
        return updated.sort(
          (a, b) => (b.lastMessage?.messageTimestamp ?? 0) - (a.lastMessage?.messageTimestamp ?? 0)
        );
      }

      return updated;
    });

    console.log('✅ Chat atualizado em tempo real:', remoteJid, updates);
  });

  return unsubscribe;
}, [token, contactMap]);

// 🔔 Listener para refresh completo da lista
useEffect(() => {
  const unsubscribe = onChatUpdate('chat:refresh_all', async () => {
    if (!token) return;

    try {
      const result = await loadChats(token, true);
      const enriched = result.chats.map(chat => {
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

      // Enriquecer com dados de negociação
      const enrichedWithDeals = await enrichChatsWithDeals(enriched);

      setChats(enrichedWithDeals);
      console.log('✅ Lista de chats recarregada completamente');
    } catch (err) {
      console.error('Erro ao recarregar lista completa:', err);
    }
  });

  return unsubscribe;
}, [token, contactMap, enrichChatsWithDeals]);


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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header - oculto quando controlado externamente */}
      {!isExternallyControlled && (
        <div className="border-b border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 transition-colors duration-200">
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">Conversas</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowControls(prev => !prev)}
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    showControls ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
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
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Atualizar lista"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {/* Toggle de Som de Notificação */}
                <button
                  onClick={toggleSound}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                    soundEnabled
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={soundEnabled ? 'Som de notificação ativado' : 'Som de notificação desativado'}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                {/* Nova conversa */}
                <Popover.Root open={contactPopoverOpen} onOpenChange={setContactPopoverOpen}>
                  <Popover.Trigger asChild>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      title="Nova conversa"
                    >
                      <MessageSquarePlus className="h-4 w-4" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content sideOffset={6} className="z-50 w-60 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-2xl transition-colors duration-200">
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={e => {
                          lastUserInteractionRef.current = Date.now();
                          setContactSearch(e.target.value);
                        }}
                        placeholder="Buscar contato"
                        className="mb-2 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 text-sm focus:border-emerald-400 focus:outline-none transition-colors duration-200"
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {filteredContacts.map(c => (
                          <button
                            key={c.id}
                            onClick={() => handleStartChat(c)}
                            className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {c.profilePicUrl ? (
                              <img src={c.profilePicUrl} className="mr-2 h-7 w-7 rounded-full" />
                            ) : (
                              <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600 text-xs font-medium text-gray-600 dark:text-gray-300">
                                {c.pushName?.[0] || c.id[0]}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{c.pushName || c.id}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{c.id}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => {
                  lastUserInteractionRef.current = Date.now();
                  setSearchTerm(e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-colors duration-200"
              />
            </div>

            {showControls && (
            <div className="border-t border-gray-300 dark:border-gray-700 pt-3 transition-colors duration-200">
              <div
                className="space-y-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 p-3 shadow-sm max-h-64 overflow-y-auto transition-colors duration-200"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148, 163, 184, 0.35) transparent' }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 dark:text-gray-400 transition-colors ${
                          iaStatusFilter !== 'all'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title="Filtrar por status de IA"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M313h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content sideOffset={6} className="z-50 w-48 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-2xl transition-colors duration-200">
                        <div className="space-y-1">
                          <button
                            onClick={() => setIaStatusFilter('active')}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            IA Ativa
                          </button>
                          <button
                            onClick={() => setIaStatusFilter('inactive')}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Intervenção
                          </button>
                          <button
                            onClick={() => setIaStatusFilter('all')}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
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
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 dark:text-gray-400 transition-colors ${
                          usuarioFiltroId !== null
                            ? 'border-blue-300 bg-blue-50 text-blue-700'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title="Filtrar por usuário"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content sideOffset={6} className="z-50 w-48 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-2xl transition-colors duration-200">
                        <div className="max-h-60 space-y-1 overflow-y-auto">
                          <button
                            onClick={() => setUsuarioFiltroId(null)}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Todos os usuários
                          </button>
                          {usuariosPorContato.map((u) => (
                            <button
                              key={u.Id}
                              onClick={() => setUsuarioFiltroId(u.Id)}
                              className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                                usuarioFiltroId === u.Id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
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
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 dark:text-gray-400 transition-colors ${
                          tagFiltroId !== null
                            ? 'border-purple-300 bg-purple-50 text-purple-700'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title="Filtrar por etiqueta"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content sideOffset={6} className="z-50 w-48 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 shadow-2xl transition-colors duration-200">
                        <div className="max-h-60 space-y-1 overflow-y-auto">
                          <button
                            onClick={() => setTagFiltroId(null)}
                            className="block w-full rounded px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
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

                <div className="flex flex-wrap gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">
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
                          : 'border-transparent bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
      )}

      {/* Lista de conversas */}
      <div
        ref={chatListRef}
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
        style={{
          maxHeight: '100%',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db transparent'
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 rounded-full animate-spin transition-colors duration-200"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-gray-600 dark:border-t-gray-400 rounded-full animate-spin transition-colors duration-200"></div>
            </div>
            <p className="text-gray-600/70 dark:text-gray-400/70 text-sm transition-colors duration-200">Carregando conversas...</p>
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

              // Clean WhatsApp Web style
              const baseContainerClasses =
                'group relative flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all duration-150 border-b border-gray-100 dark:border-gray-700';

              const isUnread = unreadCount > 0 || unreadCount === -1;

              let containerTone = 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700';
              if (isSelected) {
                containerTone = 'bg-gray-100 dark:bg-gray-700';
              } else if (isUnread) {
                // Card com mensagem não lida tem fundo levemente esverdeado
                containerTone = 'bg-teal-100 dark:bg-teal-900/40 hover:bg-teal-200 dark:hover:bg-teal-900/50';
              }

              const nameColorClass = isUnread ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-900 dark:text-white';
              const metaTextClass = isUnread ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-gray-500 dark:text-gray-400';
              const messageTextClass = isUnread ? 'text-gray-900 dark:text-gray-300 font-medium' : 'text-gray-600 dark:text-gray-400';

              const containerClasses = [
                baseContainerClasses,
                containerTone,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={chat.id}
                  className={`${containerClasses} relative`}
                >
                  {/* Botão de marcar como não lida */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const jid = normalizeRemoteJid(chat.remoteJid);

                      // Adiciona ao Set de marcadas manualmente
                      setManuallyMarkedUnread(prev => {
                        const newSet = new Set(prev);
                        newSet.add(jid);
                        // Salva no localStorage
                        localStorage.setItem('manually_marked_unread', JSON.stringify(Array.from(newSet)));
                        return newSet;
                      });

                      // Marca como não lida imediatamente (bolinha verde sem número)
                      setUnreadMessages(prev => ({ ...prev, [jid]: -1 }));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 z-10"
                    title="Marcar como não lida"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>

                  {/* Container clicável */}
                  <div
                    onClick={() => {
                      lastUserInteractionRef.current = Date.now();
                      const jid = normalizeRemoteJid(chat.remoteJid);

                      // Remove do Set de marcadas manualmente
                      setManuallyMarkedUnread(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(jid);
                        // Atualiza localStorage
                        localStorage.setItem('manually_marked_unread', JSON.stringify(Array.from(newSet)));
                        return newSet;
                      });

                      setUnreadMessages(prev => ({ ...prev, [jid]: 0 }));
                      setChats(prev =>
                        prev.map(c => (c.id === chat.id ? { ...c, hasNewMessage: false } : c))
                      );

                      if (token) {
                        apiClient.visualizarMensagens(token, jid).catch(() => {});
                      }

                      onChatSelect({ ...chat, id: jid, remoteJid: jid });
                    }}
                    className="flex items-center gap-3 w-full cursor-pointer"
                  >
                  {/* Foto do usuário */}
                  <div className="flex-shrink-0">
                    {chat.profilePicUrl ? (
                      <img
                        src={chat.profilePicUrl}
                        alt={chat.pushName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm transition-colors duration-200">
                        {getInitials(chat.pushName)}
                      </div>
                    )}
                  </div>

                  {/* Conteúdo da conversa */}
                  <div className="flex-1 min-w-0">
                    {/* Linha 1: Nome + Timestamp */}
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <h3 className={`text-[15px] truncate flex-1 ${nameColorClass} transition-colors duration-200`}>
                        {displayName}
                      </h3>
                      <span className={`text-xs flex-shrink-0 ${metaTextClass} transition-colors duration-200`}>
                        {formatTimestamp(normalizeTimestamp(chat.lastMessage.messageTimestamp))}
                      </span>
                    </div>

                    {/* Linha 2: Última mensagem + Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {chat.lastMessage.fromMe && (
                          <svg className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <p className={`text-sm truncate ${messageTextClass} transition-colors duration-200`}>
                          {getLastMessageText(chat)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {unreadCount > 0 && (
                          <span className="inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-teal-500 text-white px-1.5 text-xs font-semibold">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                        {unreadCount === -1 && (
                          <span className="inline-flex w-2.5 h-2.5 rounded-full bg-teal-500" title="Não lida"></span>
                        )}

                        {/* Transfer Badge */}
                        {isTransfer && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                            TRANSF
                          </span>
                        )}

                        {(() => {
                          const keys = jidCandidates(chat.remoteJid);
                          const hasSession = keys.some(k => sessionsSet.has(k));
                          const hasIntervention = keys.some(k => interventionsSet.has(k));
                          const hasPermanent = keys.some(k => permanentSet.has(k));
                          const iaAtiva = hasSession && !hasIntervention && !hasPermanent;
                          const iaInativa = hasIntervention && !hasPermanent;
                          const iaPermanente = hasPermanent;

                          if (iaAtiva) {
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">
                                IA
                              </span>
                            );
                          }
                          if (iaInativa) {
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                                IA PAUSADA
                              </span>
                            );
                          }
                          if (iaPermanente) {
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                                IA DESATIVADA
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>

                    {/* Linha 3: Responsável */}
                    <div className="flex items-center gap-2 mt-0.5">
                      {/* Responsável */}
                      {dono && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 transition-colors duration-200">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {dono.nome}
                        </span>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}

            {/* Elemento sentinela para IntersectionObserver */}
            {hasMore && !loading && (
              <div
                ref={sentinelRef}
                className="h-1 w-full"
                style={{ background: 'transparent' }}
              />
            )}

            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300 dark:border-gray-600 transition-colors duration-200"></div>
              </div>
            )}

            {!hasMore && (
              <div className="text-center py-4 text-sm text-gray-600/70 dark:text-gray-400/70 transition-colors duration-200">
                Você chegou ao final da lista
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}