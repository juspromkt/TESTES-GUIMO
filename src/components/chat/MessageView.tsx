import { useEffect, useState, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { apiClient, Message, Chat, getCacheKey, clearApiCache, clearMessageCache } from "./utils/api";
import { formatMessageTime, getMessageTypeDisplay } from "./utils/dateUtils";
import { decryptEvoMedia, MediaKeyInput } from "../decryptEvoMedia";
const TemplateModal = lazy(() => import("./TemplateModal"));
import Modal from "../Modal";
import DealDetailsPanel from "../crm/DealDetailsPanel";
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
  Loader2,
  CheckCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  X,
  Download,
  RefreshCw,
  PauseCircle,
  Ban,
} from "lucide-react";
import { MessageInput } from "./MessageInput";
import { toast } from "sonner";
import { useMessageEvents } from "../../pages/MessageEventsContext";
import { AudioPlayer } from "./AudioPlayer";
import * as Popover from "@radix-ui/react-popover";
import type { Tag } from "../../types/tag";

const TRANSFER_STORAGE_KEY = 'chat_transfer_remote_jids';
const TRANSFER_UPDATED_EVENT = 'chat_transfers_updated';
const TRANSFER_RELOAD_EVENT = 'chat_transfers_request_reload';

function toTransferRemoteJid(value: any): string | null {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return `${digits}@s.whatsapp.net`;
}

interface MessageViewProps {
  selectedChat: Chat;
  onBack: () => void;
  whatsappType?: string;
}

export function MessageView({ selectedChat, onBack, whatsappType }: MessageViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ignoreScrollRef = useRef(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const inFlightPagesRef = useRef<Map<string, Set<number>>>(new Map());
  const noMorePagesRef = useRef(false);
  const inactiveDispatchedRef = useRef(false);
  const firstPageLoadedRef = useRef(false);
  const [dragActive, setDragActive] = useState(false);
  const fileDropRef = useRef<HTMLInputElement>(null);
  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMarkerIndex, setUnreadMarkerIndex] = useState<number | null>(null);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any | null>(null);
  const [sessionInfoLoaded, setSessionInfoLoaded] = useState(false);
  const [isBusiness, setIsBusiness] = useState<boolean>(() =>
  (whatsappType ?? (selectedChat as any)?.whatsappType) === 'WHATSAPP-BUSINESS'
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
  const [removingTransfer, setRemovingTransfer] = useState(false);
  const [nonEssentialReady, setNonEssentialReady] = useState(false);
  const deferredTimeoutsRef = useRef<Set<number>>(new Set());
  const deferredIdleCallbacksRef = useRef<Set<number>>(new Set());

  const cancelDeferredTasks = useCallback(() => {
    if (typeof window === 'undefined') {
      deferredTimeoutsRef.current.clear();
      deferredIdleCallbacksRef.current.clear();
      return;
    }

    deferredTimeoutsRef.current.forEach(id => {
      window.clearTimeout(id);
    });
    deferredTimeoutsRef.current.clear();

    const cancelIdle = (window as any).cancelIdleCallback;
    if (typeof cancelIdle === 'function') {
      deferredIdleCallbacksRef.current.forEach(id => {
        cancelIdle(id);
      });
    }
    deferredIdleCallbacksRef.current.clear();
  }, []);

  const scheduleDeferredTask = useCallback(
    (task: () => void, delay = 400) => {
      if (typeof window === 'undefined') {
        try {
          task();
        } catch (err) {
          console.error('Deferred task execution failed', err);
        }
        return () => {};
      }

      let cancelled = false;
      let idleId: number | null = null;

      const invokeTask = () => {
        if (cancelled) return;
        try {
          task();
        } catch (err) {
          console.error('Deferred task execution failed', err);
        }
      };

      const runWhenIdle = () => {
        if (cancelled) return;
        const idleCb = (window as any).requestIdleCallback;
        if (typeof idleCb === 'function') {
          idleId = idleCb(() => {
            deferredIdleCallbacksRef.current.delete(idleId!);
            invokeTask();
          });
          deferredIdleCallbacksRef.current.add(idleId);
        } else {
          invokeTask();
        }
      };

      const timeoutId = window.setTimeout(() => {
        deferredTimeoutsRef.current.delete(timeoutId);
        runWhenIdle();
      }, delay);

      deferredTimeoutsRef.current.add(timeoutId);

      return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
        deferredTimeoutsRef.current.delete(timeoutId);

        if (idleId !== null) {
          const cancelIdle = (window as any).cancelIdleCallback;
          if (typeof cancelIdle === 'function') {
            cancelIdle(idleId);
          }
          deferredIdleCallbacksRef.current.delete(idleId);
        }
      };
    },
    []
  );

  useEffect(() => cancelDeferredTasks, [cancelDeferredTasks]);

// E adicione este effect para recalcular quando chegar sessionInfo:
useEffect(() => {
  const flag = (whatsappType ?? (selectedChat as any)?.whatsappType ?? sessionInfo?.type) === 'WHATSAPP-BUSINESS';
  setIsBusiness(flag);
}, [whatsappType, selectedChat, sessionInfo?.type]);

  function extractPhoneNumber(remoteJid: string): string {
    return remoteJid.replace(/\D/g, "");
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

  const normalizedSelectedChatJid = useMemo(
    () => normalizeRemoteJid(selectedChat.remoteJid),
    [selectedChat.remoteJid]
  );

  const normalizedSelectedChatAltJid = useMemo(() => {
    const alt = (selectedChat as any)?.remoteJidAlt;
    if (!alt) return null;
    return normalizeRemoteJid(alt);
  }, [selectedChat]);

  const activeChatJids = useMemo(() => {
    const list: string[] = [];
    if (normalizedSelectedChatJid) list.push(normalizedSelectedChatJid);
    if (
      normalizedSelectedChatAltJid &&
      !list.includes(normalizedSelectedChatAltJid)
    ) {
      list.push(normalizedSelectedChatAltJid);
    }
    return list;
  }, [normalizedSelectedChatJid, normalizedSelectedChatAltJid]);

  const selectedChatDigits = useMemo(() => {
    const digits = extractPhoneNumber(
      normalizedSelectedChatJid || selectedChat.remoteJid
    );
    return digits || null;
  }, [normalizedSelectedChatJid, selectedChat.remoteJid]);

type UnreadInfo = {
  remoteJid: string;
  qtdMensagens: number;
};

function normalizeUnreadResponse(res: any): UnreadInfo[] {
  // casos mais comuns: array direto, ou { data: [...] }, ou { items: [...] }
  if (Array.isArray(res)) return res as UnreadInfo[];
  if (res && Array.isArray(res.data)) return res.data as UnreadInfo[];
  if (res && Array.isArray(res.items)) return res.items as UnreadInfo[];

  // objeto único -> vira array de 1
  if (res && typeof res === 'object' && 'remoteJid' in res) return [res as UnreadInfo];

  // qualquer outra coisa => vazio
  return [];
}

const loadUnreadInfo = useCallback(async () => {
  if (!token || !normalizedSelectedChatJid) return;
  try {
    const raw = await apiClient.findMensagensNaoLidas(token);
    const list = normalizeUnreadResponse(raw);

    // se ainda não for array, aborta silenciosamente
    if (!Array.isArray(list)) return;

    const info = list.find((item) =>
      normalizeRemoteJid(item.remoteJid) === normalizedSelectedChatJid
    );

    setUnreadCount(info?.qtdMensagens ?? 0);
  } catch (err) {
  }
}, [token, normalizedSelectedChatJid]);

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
        toast.error('Não foi possível carregar as transferências');
      }
    } finally {
      transferLoadingRef.current = false;
    }
  },
  [token]
);

useEffect(() => {
  if (!token || !nonEssentialReady) return;

  let cancelled = false;
  const cancel = scheduleDeferredTask(() => {
    if (cancelled) return;
    loadTransfers().catch(() => {});
  }, 300);

  return () => {
    cancelled = true;
    cancel();
  };
}, [token, nonEssentialReady, loadTransfers, scheduleDeferredTask]);

useEffect(() => {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ remoteJids?: string[] }>).detail;
    const list = Array.isArray(detail?.remoteJids) ? detail.remoteJids : null;
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
    loadTransfers(true);
  };
  window.addEventListener(TRANSFER_RELOAD_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(TRANSFER_RELOAD_EVENT, handler as EventListener);
  };
}, [loadTransfers]);

const handleRemoveTransfer = useCallback(async () => {
  if (!token || !selectedChatDigits) return;

  setRemovingTransfer(true);
  const digits = selectedChatDigits;
  const normalized = normalizedSelectedChatJid || `${digits}@s.whatsapp.net`;
  const alternate = `${digits}@s.whatsapp.net`;
  let updatedList: string[] = [];

  try {
    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/chat/transferencia/delete',
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify({ remoteJid: digits }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setTransferSet(prev => {
      const updated = new Set(prev);
      updated.delete(normalized);
      updated.delete(alternate);
      updatedList = Array.from(updated);
      return updated;
    });

    try {
      window.localStorage.setItem(TRANSFER_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {}

    window.dispatchEvent(
      new CustomEvent(TRANSFER_UPDATED_EVENT, {
        detail: { remoteJids: updatedList },
      })
    );
    window.dispatchEvent(new Event(TRANSFER_RELOAD_EVENT));
    toast.success('Transferência removida');
  } catch (err) {
    console.error('Erro ao remover transferência:', err);
    toast.error('Não foi possível remover a transferência');
  } finally {
    setRemovingTransfer(false);
  }
}, [token, normalizedSelectedChatJid, selectedChatDigits]);

// Adicione lógica para encontrar o marcador quando as mensagens carregarem:
useEffect(() => {
  if (messages.length > 0 && unreadCount > 0 && !hasMarkedAsRead) {
    // Encontrar as últimas N mensagens do lead (fromMe = false)
    const leadMessages = messages.filter(m => !m.key.fromMe);
    if (leadMessages.length >= unreadCount) {
      const markerMsg = leadMessages[leadMessages.length - unreadCount];
      const markerIdx = messages.findIndex(m => m.id === markerMsg.id);
      setUnreadMarkerIndex(markerIdx);
      
      // Auto-scroll para o marcador
      setTimeout(() => {
        const element = document.getElementById(`unread-marker`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }
}, [messages, unreadCount, hasMarkedAsRead]);

// Adicione função para marcar como lida quando rolar até o final:
const markAsRead = useCallback(async () => {
  if (!token || !unreadCount || hasMarkedAsRead || !normalizedSelectedChatJid) return;
  try {
    await apiClient.visualizarMensagens(token, selectedChat.remoteJid);
    const jid = normalizedSelectedChatJid;
    window.dispatchEvent(
      new CustomEvent('messages_marked_as_read', { detail: { remoteJid: jid } })
    );

    setHasMarkedAsRead(true);
    setUnreadMarkerIndex(null);
    setUnreadCount(0);
  } catch (err) {
    console.error('Erro ao marcar como lida:', err);
  }
}, [
  token,
  selectedChat.remoteJid,
  unreadCount,
  hasMarkedAsRead,
  normalizedSelectedChatJid,
]);

  function sanitizePushName(
    name: string | undefined,
    remoteJid: string,
  ): string | undefined {
    if (!name) return undefined;
    return name.toLowerCase() === "você" ? extractPhoneNumber(remoteJid) : name;
  }

function normalizeTimestamp(ts: number | string): number {
  const n = typeof ts === 'string' ? Number(ts) : ts;
  if (!Number.isFinite(n) || n <= 0) return 0;
  // milissegundos se >= 1e11; segundos se < 1e11
  return n >= 1e11 ? Math.floor(n / 1000) : Math.floor(n);
}

function isMediaMessage(msg: Message): boolean {
  return [
    "imageMessage",
    "videoMessage",
    "audioMessage",
    "documentMessage",
    "stickerMessage",
  ].includes(msg.messageType);
}

function getMediaType(msg: Message):
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | null {
  switch (msg.messageType) {
    case "imageMessage":
      return "image";
    case "videoMessage":
      return "video";
    case "audioMessage":
      return "audio";
    case "documentMessage":
      return "document";
    case "stickerMessage":
      return "sticker";
    default:
      return null;
  }
}

function getMediaPart(msg: Message): any | null {
  const { messageType, message: msgContent } = msg;
  switch (messageType) {
    case "imageMessage":
      return msgContent?.imageMessage;
    case "videoMessage":
      return msgContent?.videoMessage;
    case "audioMessage":
      return msgContent?.audioMessage;
    case "documentMessage":
      return msgContent?.documentMessage;
    case "stickerMessage":
      return msgContent?.stickerMessage;
    default:
      return null;
  }
}

function getMediaUrl(msg: Message): string | null {
  const { messageType, message: msgContent } = msg;
  switch (messageType) {
    case "imageMessage":
      return msgContent?.mediaUrl || msgContent?.imageMessage?.url || null;
    case "videoMessage":
      return msgContent?.mediaUrl || msgContent?.videoMessage?.url || null;
    case "audioMessage":
      return msgContent?.mediaUrl || msgContent?.audioMessage?.url || null;
    case "documentMessage":
      return msgContent?.mediaUrl || msgContent?.documentMessage?.url || null;
    case "stickerMessage":
      return msgContent?.mediaUrl || msgContent?.stickerMessage?.url || null;
    default:
      return null;
  }
}

const handleDownloadMedia = async (msg: Message) => {
  const directUrl = getMediaUrl(msg);
  const part = getMediaPart(msg);
  if (!part) {
    toast.error("Não foi possível baixar a mídia");
    return;
  }

  let finalUrl = directUrl || "";
  try {
    if (isBusiness && part.id && part.sha256) {
      finalUrl =
        (await fetchOfficialMediaUrl({
          id: part.id,
          sha256: part.sha256,
          mime_type: part.mime_type,
        })) || finalUrl;
    } else if (
      directUrl &&
      /whatsapp\.net/.test(directUrl) &&
      part.mediaKey &&
      part.mimetype
    ) {
      finalUrl =
        (await fetchEvoMediaUrl({
          url: directUrl,
          mediaKey: part.mediaKey,
          mimetype: part.mimetype,
          id: part.id,
          fileEncSha256: part.fileEncSha256,
          fileSha256: part.fileSha256,
        })) || finalUrl;
    }
  } catch (e) {
    console.error("Erro ao preparar download de mídia:", e);
  }

  if (!finalUrl) {
    toast.error("Não foi possível baixar a mídia");
    return;
  }

  const link = document.createElement("a");
  link.href = finalUrl;
  link.download = `media-${msg.id}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};


  // Adicione perto das outras helpers
const TZ_OFFSET_SEC = 3 * 60 * 60; // GMT-3

function getLastInboundTimestamp(
  all: Message[],
  selectedChat: Chat,
  sessionInfo?: any
): number | null {
  const fromMessages = normalizeTimestamp(
    [...all]
      .reverse()
      .find((m) => !m.key.fromMe)?.messageTimestamp || 0
  );

  const fromSession = normalizeTimestamp(
    sessionInfo?.ultimoTimestampCliente || sessionInfo?.lastInboundAt
  );
  const fromChat = normalizeTimestamp((selectedChat as any)?.lastInboundTimestamp);

  const candidates = [fromMessages, fromSession, fromChat].filter(
    (ts) => ts > 0
  );
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);
  const [editModal, setEditModal] = useState<{
    open: boolean;
    message: Message | null;
  }>({ open: false, message: null });
  const [editText, setEditText] = useState("");
const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
const sentMessageIds = useRef<Set<string>>(new Set());
const [deals, setDeals] = useState([]);
const [funis, setFunis] = useState([]);
const [showDeals, setShowDeals] = useState(false);
const [loadingDeals, setLoadingDeals] = useState(false);
const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
const messageInputRef = useRef<HTMLTextAreaElement>(null);
const [interventionInfo, setInterventionInfo] = useState<any | null>(null);
const [contactTags, setContactTags] = useState<Tag[]>([]);
const denseContactTagLayout = contactTags.length > 4;
const ultraDenseContactTagLayout = contactTags.length > 9;
const [startingAgent, setStartingAgent] = useState(false);
const [deletingSession, setDeletingSession] = useState(false);
const [deletingIntervention, setDeletingIntervention] = useState(false);
const [permanentInterventionInfo, setPermanentInterventionInfo] = useState<any | null>(null);
const [deletingPermanentIntervention, setDeletingPermanentIntervention] = useState(false);
const [creatingIntervention, setCreatingIntervention] = useState(false);
const [creatingPermanentExclusion, setCreatingPermanentExclusion] = useState(false);
const [contactData, setContactData] = useState<any | null>(null);
const [contactModalOpen, setContactModalOpen] = useState(false);
const [contactForm, setContactForm] = useState({ nome: '', email: '', telefone: '' });
const [savingContact, setSavingContact] = useState(false);
const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  function openPreview(url: string, type: 'image' | 'video') {
    setPreview({ url, type });
  }

  const evaluateSessionActivity = useCallback(
    (arr: Message[]) => {
      if (!isBusiness) return;
      const inboundTs = getLastInboundTimestamp(arr, selectedChat, sessionInfo);

      if (inboundTs === null) {
        if (!sessionInfoLoaded && !(selectedChat as any)?.lastInboundTimestamp) return;
        setIsSessionActive(false);
        if (!inactiveDispatchedRef.current && sessionInfoLoaded) {
          window.dispatchEvent(
            new CustomEvent('chat_force_inactive', {
              detail: { id: selectedChat.id, timestamp: 0 },
            }),
          );
          inactiveDispatchedRef.current = true;
        }
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const active = now - inboundTs <= 86400;
      setIsSessionActive(active);
      if (!active && !inactiveDispatchedRef.current && sessionInfoLoaded) {
        window.dispatchEvent(
          new CustomEvent('chat_force_inactive', {
            detail: { id: selectedChat.id, timestamp: inboundTs },
          }),
        );
        inactiveDispatchedRef.current = true;
      }
    },
    [isBusiness, selectedChat, sessionInfo, sessionInfoLoaded]
  );

const loadSessionInfo = useCallback(async () => {
  if (!token || !selectedChat) return; // <- deixa rodar mesmo sem saber ainda se é business

  // helper para evitar que uma chamada derrube tudo
  const safeCall = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      const r = await fn();
      return r as any;
    } catch {
      return null;
    }
  };

  // normaliza: aceita objeto, ou primeiro objeto válido de um array; ignora vazio/strings
  const normalizeObj = (v: any) => {
    if (!v) return null;
    if (Array.isArray(v)) {
      const firstValid = v.find(
        (x) => x && typeof x === "object" && Object.keys(x).length > 0
      );
      return firstValid || null;
    }
    if (typeof v === "object" && Object.keys(v).length > 0) return v;
    return null;
  };

  try {
    const digits = selectedChatDigits;
    if (!digits) return;

    // limpa caches relacionados (opcional, igual ao seu código)
    clearApiCache([
      getCacheKey("findSessionByRemoteJid", token, { remoteJid: digits }),
      getCacheKey("findInterventionByRemoteJid", token, { remoteJid: digits }),
      getCacheKey("findPermanentExclusionByRemoteJid", token, { remoteJid: digits }),
    ]);

    const [sessRaw, intervRaw, permRaw] = await Promise.all([
      safeCall(() => apiClient.findSessionByRemoteJid(token, digits)),
      safeCall(() => apiClient.findInterventionByRemoteJid(token, digits)),
      safeCall(() => apiClient.findPermanentExclusionByRemoteJid(token, digits)),
    ]);

    const sess = normalizeObj(sessRaw);
    const interv = normalizeObj(intervRaw);
    const perm = normalizeObj(permRaw);

    setSessionInfo(sess);
    setPermanentInterventionInfo(perm);
    setInterventionInfo(perm ? null : interv);

    // atualiza listas globais sem explodir quando vazio
    clearApiCache([
      getCacheKey("findSessions", token),
      getCacheKey("findInterventions", token),
      getCacheKey("findPermanentExclusions", token),
    ]);
    localStorage.setItem("sessions_updated", Date.now().toString());
    window.dispatchEvent(new Event("sessions_updated"));
  } catch (err) {
    // Se ainda assim algo der errado, não quebra a UI
    console.error("Erro ao carregar sessões (tolerado):", err);
    setSessionInfo(null);
    setInterventionInfo(null);
    setPermanentInterventionInfo(null);
  }
  finally {
    setSessionInfoLoaded(true);
  }
}, [token, selectedChat, isBusiness, selectedChatDigits]);

function isValidMsg(m: any): m is Message {
  return (
    !!m &&
    typeof m === "object" &&
    !!m.id &&
    !!m.key &&
    typeof m.key.fromMe === "boolean" &&
    typeof m.key.remoteJid === "string" &&
    typeof m.messageType === "string" &&
    m.messageType.trim() !== ""
  );
}

function ensureKey(m: any, fallbackJid: string): any {
  const key = m?.key ?? {};
  const rawFromMe = key.fromMe ?? m?.fromMe;
  const fromMe =
    typeof rawFromMe === "string"
      ? rawFromMe === "true"
      : Boolean(rawFromMe);

  return {
    ...m,
    id: m?.id ?? key.id ?? String(Date.now()),
    key: {
      id: key.id ?? m?.id ?? String(Date.now()),
      fromMe,
      remoteJid: String(key.remoteJid ?? fallbackJid),
    },
  };
}


  const fetchMessages = useCallback(
    async (
      pageNum: number = 1,
      append: boolean = false,
      overrideJid?: string
    ) => {
      if (!token || noMorePagesRef.current) {
        return;
      }

      if (pageNum > 1 && !firstPageLoadedRef.current) {
        return;
      }

      const overrideTarget = overrideJid
        ? normalizeRemoteJid(overrideJid)
        : undefined;
      const targets = Array.from(
        new Set(
          (overrideTarget
            ? [overrideTarget, ...activeChatJids]
            : activeChatJids
          ).filter((jid): jid is string => Boolean(jid))
        )
      );

      if (targets.length === 0) {
        return;
      }

      const map = inFlightPagesRef.current;
      const anyInFlight = targets.some((target) =>
        (map.get(target)?.has(pageNum))
      );
      if (anyInFlight) {
        return;
      }

      targets.forEach((target) => {
        const pages = map.get(target) ?? new Set<number>();
        pages.add(pageNum);
        map.set(target, pages);
      });

      const initialActiveSet = activeChatJidsRef.current;
      const affectsCurrentChat = targets.some((target) =>
        initialActiveSet.has(target)
      );

      try {
        if (affectsCurrentChat) {
          if (!append) setLoading(true);
          else setLoadingMore(true);
        }

        const forceRefresh = pageNum === 1;

        const responses = await Promise.all(
          targets.map(async (target) => {
            try {
              const data = await apiClient.findMessages(
                token,
                target,
                50,
                pageNum,
                forceRefresh
              );
              return { target, data };
            } catch (error) {
              console.error("Error fetching messages for target:", target, error);
              return { target, data: [] as any[] };
            }
          })
        );

        const currentActiveSet = activeChatJidsRef.current;
        const isCurrentChat = targets.some((target) =>
          currentActiveSet.has(target)
        );
        if (!isCurrentChat) {
          return;
        }

        const combinedMessages = responses.flatMap(({ target, data }) => {
          const fallbackJid = selectedChatJidRef.current || target;
          return (Array.isArray(data) ? data : [])
            .map((m) => ({
              ...ensureKey(m, fallbackJid),
              messageTimestamp: normalizeTimestamp(m?.messageTimestamp),
            }))
            .filter(isValidMsg);
        });

        const noNewMessages = combinedMessages.length === 0;

        if (noNewMessages) {
          if (pageNum === 1) {
            firstPageLoadedRef.current = true;
          }
          setHasMore(false);
          noMorePagesRef.current = true;
          return;
        }

        noMorePagesRef.current = false;
        setHasMore(true);

        const final = applyNormalizedMessages(combinedMessages, append);

        if (pageNum === 1) {
          firstPageLoadedRef.current = true;
        }

        if (isBusiness && (!append || combinedMessages.length > 0)) {
          evaluateSessionActivity(final);
        }
      } catch (error) {
        if (affectsCurrentChat) {
          console.error("Error fetching messages:", error);
          toast.error("Erro ao carregar mensagens");
        } else {
          console.error("Error fetching messages (stale request):", error);
        }
      } finally {
        if (affectsCurrentChat) {
          setLoading(false);
          setLoadingMore(false);
        }
        targets.forEach((target) => {
          const currentPages = inFlightPagesRef.current.get(target);
          if (currentPages) {
            currentPages.delete(pageNum);
            if (currentPages.size === 0) {
              inFlightPagesRef.current.delete(target);
            }
          }
        });
        const currentActiveSet = activeChatJidsRef.current;
        const isCurrentChat = targets.some((target) =>
          currentActiveSet.has(target)
        );
        if (isCurrentChat && pageNum === 1) {
          setNonEssentialReady(true);
        }
      }
    },
    [token, isBusiness, activeChatJids, evaluateSessionActivity]
  );

  const handleReloadMessages = useCallback(() => {
    if (!token || activeChatJids.length === 0) return;
    cancelDeferredTasks();
    setNonEssentialReady(false);

    const cacheKeys: string[] = [];
    activeChatJids.forEach((jid) => {
      clearMessageCache(jid);
      cacheKeys.push(
        getCacheKey('findMessages', token, {
          remoteJid: jid,
          page: 1,
          limit: 50,
        })
      );
    });

    if (cacheKeys.length > 0) {
      clearApiCache(cacheKeys);
    }

    setMessages([]);
    setPage(1);
    setHasMore(true);
    noMorePagesRef.current = false;
    firstPageLoadedRef.current = false;
    fetchMessages(1, false);
  }, [token, activeChatJids, fetchMessages, cancelDeferredTasks]);

  useEffect(() => {
    if (!nonEssentialReady) return;

    let cancelled = false;
    const cancel = scheduleDeferredTask(() => {
      if (cancelled) return;
      loadSessionInfo();
    }, 350);

    return () => {
      cancelled = true;
      cancel();
    };
  }, [nonEssentialReady, loadSessionInfo, scheduleDeferredTask]);

  useEffect(() => {
    if (!isBusiness) return;
    if (messages.length === 0 && !sessionInfo) return;
    evaluateSessionActivity(messages);
  }, [messages, sessionInfo, isBusiness, selectedChat.id, evaluateSessionActivity]);

useEffect(() => {
  if (!isBusiness) {
    // Em hipótese NENHUMA exibir template em API não-oficial:
    // força sessão ativa sempre.
    setIsSessionActive(true);
  }
}, [isBusiness]);

  useEffect(() => {
    if (!token || !selectedChat?.remoteJid || !nonEssentialReady) {
      if (!token) {
        setContactData(null);
      }
      return;
    }

    let cancelled = false;
    const cancel = scheduleDeferredTask(() => {
      if (cancelled) return;
      apiClient
        .getContatoByRemoteJid(token, selectedChat.remoteJid)
        .then(data => {
          if (cancelled) return;
          if (data && typeof data === 'object') {
            setContactData(data);
            setContactForm({
              nome: data.nome || '',
              email: data.email || '',
              telefone: data.telefone || ''
            });
          } else {
            setContactData(null);
          }
        })
        .catch(err => console.error('Erro ao carregar contato:', err));
    }, 400);

    return () => {
      cancelled = true;
      cancel();
    };
  }, [token, selectedChat?.remoteJid, nonEssentialReady, scheduleDeferredTask]);

  const handleSaveContact = async () => {
    if (!token || !contactData) return;
    setSavingContact(true);
    try {
      await apiClient.updateContato(token, {
        id: contactData.Id || contactData.id,
        nome: contactForm.nome,
        email: contactForm.email || null,
        telefone: contactData.telefone,
      });
      toast.success('Contato atualizado');
      const updated = {
        ...contactData,
        nome: contactForm.nome,
        email: contactForm.email,
      };
      setContactData(updated);
      setContactModalOpen(false);
      clearApiCache([
        getCacheKey('findContacts', token),
        getCacheKey('findContactInterno', token),
      ]);
      localStorage.setItem('contacts_updated', Date.now().toString());
      window.dispatchEvent(new Event('contacts_updated'));
    } catch (err) {
      console.error('Erro ao atualizar contato:', err);
      toast.error('Erro ao atualizar contato');
    } finally {
      setSavingContact(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!token || !sessionInfo || !selectedChatDigits) return;
    setDeletingSession(true);
    try {
      await apiClient.deleteSession(token, selectedChatDigits);
      toast.success('Sessão excluída');
      await loadSessionInfo();
    } catch (err) {
      toast.error('Erro ao excluir sessão');
    } finally {
      setDeletingSession(false);
    }
  };

  const handleDeleteIntervention = async () => {
    if (!token || !interventionInfo || !selectedChatDigits) return;
    setDeletingIntervention(true);
    try {
      await apiClient.deleteIntervention(token, selectedChatDigits);
      toast.success('IA inativa excluída');
      await loadSessionInfo();
    } catch (err) {
      toast.error('Erro ao excluir intervenção');
    } finally {
      setDeletingIntervention(false);
    }
  };

  const handleDeletePermanentIntervention = async () => {
    if (!token || !permanentInterventionInfo || !selectedChatDigits) return;
    setDeletingPermanentIntervention(true);
    try {
      await apiClient.deletePermanentExclusion(token, selectedChatDigits);
      toast.success('Exclusão permanente removida');
      await loadSessionInfo();
    } catch (err) {
      toast.error('Erro ao remover exclusão permanente');
    } finally {
      setDeletingPermanentIntervention(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!token || interventionInfo || permanentInterventionInfo || !selectedChatDigits)
      return;
    setCreatingIntervention(true);
    try {
      await apiClient.createIntervention(token, selectedChatDigits);
      toast.success('Intervenção temporária criada');
      await loadSessionInfo();
    } catch (err) {
      toast.error('Erro ao criar intervenção temporária');
    } finally {
      setCreatingIntervention(false);
    }
  };

  const handleCreatePermanentExclusion = async () => {
    if (!token || permanentInterventionInfo || !selectedChatDigits) return;
    setCreatingPermanentExclusion(true);
    try {
      await apiClient.createPermanentExclusion(token, selectedChatDigits);
      toast.success('Exclusão permanente criada');
      await loadSessionInfo();
    } catch (err) {
      toast.error('Erro ao criar exclusão permanente');
    } finally {
      setCreatingPermanentExclusion(false);
    }
  };

const handleStartAgent = async () => {
  setStartingAgent(true); // Inicia a animação de carregamento
  
  try {
    await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/conversa/agente/ativar',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          pushName: selectedChat.pushName,
          remoteJid: selectedChat.remoteJid
        })
      }
    );
    
    toast.success('Agente iniciado');
    
    // Aguarda 2 segundos antes de atualizar
    setTimeout(async () => {
      await loadSessionInfo();
      setStartingAgent(false); // Para a animação de carregamento
    }, 2000);
    
  } catch (err) {
    toast.error('Erro ao iniciar agente');
    setStartingAgent(false); // Para a animação mesmo em caso de erro
  }
};

    const loadContactTags = useCallback(async () => {
    if (!token || !selectedChat) return;
    try {
      const [tagsList, assoc] = await Promise.all([
        apiClient.findTags(token),
        apiClient.findTagsByContact(token)
      ]);
      const tagsArray = Array.isArray(tagsList) ? tagsList : [];
      const assocArr = Array.isArray(assoc) ? assoc : [];
      const jid = normalizedSelectedChatJid;
      const digits = selectedChatDigits;
      const tags: Tag[] = [];
      assocArr.forEach((rel: any) => {
        const tagIds = (Array.isArray(rel.id_tag) ? rel.id_tag : [rel.id_tag]).map(Number);
        const remotes = Array.isArray(rel.remoteJid) ? rel.remoteJid : [rel.remoteJid];
        const normalizedRemotes = remotes.map(value => normalizeRemoteJid(String(value)));
        const digitsRemotes = remotes
          .map(value => jidDigits(String(value)))
          .filter((val): val is string => Boolean(val));
        const matches =
          normalizedRemotes.includes(jid) ||
          (digits ? digitsRemotes.includes(digits) : false);
        if (matches) {
          tagIds.forEach(tid => {
            const tag = tagsArray.find(t => t.Id === tid);
            if (tag && !tags.some(t => t.Id === tag.Id)) {
              tags.push(tag);
            }
          });
        }
      });
      setContactTags(tags);
    } catch (err) {
      console.error('Erro ao carregar tags do contato:', err);
    }
    }, [token, selectedChat, normalizedSelectedChatJid, selectedChatDigits]);

  useEffect(() => {
    if (!nonEssentialReady) return;

    let cancelled = false;
    const cancel = scheduleDeferredTask(() => {
      if (cancelled) return;
      loadContactTags();
    }, 450);

    const handler = (e: StorageEvent) => {
      if (e.key === 'tags_updated') {
        loadContactTags();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handler);
    }

    return () => {
      cancelled = true;
      cancel();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handler);
      }
    };
  }, [nonEssentialReady, loadContactTags, scheduleDeferredTask]);

const handlePaste = useCallback(async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  const hasFile = Array.from(items).some((item) => item.kind === "file");
  if (!hasFile) return; // Allow default paste for plain text

  e.preventDefault();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file && fileDropRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileDropRef.current.files = dt.files;
        fileDropRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    
    if (item.type.startsWith('video/')) {
      const file = item.getAsFile();
      if (file && fileDropRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileDropRef.current.files = dt.files;
        fileDropRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    
    // Para outros tipos de arquivo (documentos, etc)
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file && fileDropRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileDropRef.current.files = dt.files;
        fileDropRef.current.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
  }
}, []);

// 3. UseEffect para adicionar/remover o listener de paste:
useEffect(() => {
  document.addEventListener('paste', handlePaste);
  return () => {
    document.removeEventListener('paste', handlePaste);
  };
}, [handlePaste]);

// 4. Função para focar o input após enviar mensagem:
const focusMessageInput = useCallback(() => {
  setTimeout(() => {
    messageInputRef.current?.focus();
  }, 50);
}, []);

// 5. Modifique a função addMessageToMemory:
const sortMessages = (a: Message, b: Message) => {
  if (a.messageTimestamp === b.messageTimestamp) {
    return (a.id || '').localeCompare(b.id || '');
  }
  return a.messageTimestamp - b.messageTimestamp;
};

const addMessageToMemory = (newMessages: Message[]) => {
  newMessages.forEach(msg => {
    if (msg.key.id) {
      sentMessageIds.current.add(msg.key.id);
      setTimeout(() => {
        sentMessageIds.current.delete(msg.id);
      }, 5000);
    }
  });

  setMessages(prev => [...prev, ...newMessages].sort(sortMessages));
  setTimeout(() => {
    scrollToBottom();
    focusMessageInput(); // Foca o input após enviar
  }, 10); // Reduzido de 100 para 10ms
};

const addTempMessage = (msg: Message) => {
  setMessages(prev => [...prev, msg].sort(sortMessages));
  setTimeout(() => {
    scrollToBottom();
    focusMessageInput();
  }, 10);
};

const replaceTempMessage = (tempId: string, realMessages: Message[]) => {
  setMessages((prev) => prev.filter((m) => m.id !== tempId));
  addMessageToMemory(realMessages);
};

const markTempError = (tempId: string) => {
  setMessages((prev) =>
    prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m))
  );
};

useEffect(() => {
  setShowDeals(false); // <- FECHA automaticamente ao mudar de contato
}, [selectedChat]);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // Se não tiver deals abertos, não faz nada
    if (!showDeals) return;

    // Procura se o click foi dentro do popup ou no botão
    const popup = document.getElementById('deals-popup');
    const button = document.querySelector('[data-deals-button]');
    
    if (popup && !popup.contains(event.target as Node) && 
        button && !button.contains(event.target as Node)) {
      setShowDeals(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showDeals]);

useEffect(() => {
  return () => {
    const jids = Array.from(activeChatJidsRef.current);
    if (!jids.length) return;
    const keys = jids.map((jid) =>
      getCacheKey('findMessages', token, {
        remoteJid: jid,
        page: 1,
        limit: 50
      })
    );
    clearApiCache(keys);
  };
}, [token]);

function normalizeMessages(rawMessages: Message[]): Message[] {
  const valid = (rawMessages || []).filter(isValidMsg);
  const messageMap = new Map<string, Message>();
  const editedMessages: { originalId: string; editedMessage: Message }[] = [];

  valid.forEach(msg => {
    if (msg.messageType === "editedMessage" && msg.message?.editedMessage?.message?.protocolMessage) {
      const originalId = msg.message.editedMessage.message.protocolMessage.key?.id;
      if (originalId) {
        editedMessages.push({ originalId, editedMessage: msg });
      }
    } else {
      messageMap.set(msg.id, msg);
    }
  });

  editedMessages.forEach(({ originalId, editedMessage }) => {
    const originalMessage = messageMap.get(originalId);
    if (originalMessage) {
      const editedText = editedMessage.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation;
      messageMap.set(originalId, {
        ...originalMessage,
        message: {
          ...originalMessage.message,
          conversation: editedText || originalMessage.message?.conversation,
        },
        wasEdited: true,
      });
    }
  });

  return Array.from(messageMap.values()).sort((a, b) => a.messageTimestamp - b.messageTimestamp);
}


const applyNormalizedMessages = (newData: Message[], append: boolean): Message[] => {
  let updated: Message[] = [];
  setMessages(prev => {
    const combined = append ? [...prev, ...newData] : [...newData];
    updated = normalizeMessages(combined);
    return updated;
  });
  return updated;
};

const selectedChatJidRef = useRef(normalizedSelectedChatJid);
const activeChatJidsRef = useRef<Set<string>>(new Set(activeChatJids));

 const createNewDeal = async () => {
  if (!token || !selectedChat?.remoteJid) return;

  try {
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/conversas/deal/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify({ 
        pushName: getDisplayName(selectedChat),
        remoteJid: selectedChat.remoteJid 
      })
    });

    if (response.ok) {
      const result = await response.json();
      toast.success('Nova negociação criada com sucesso!');
      setShowDeals(false);
      if (result.id) {
        setSelectedDealId(result.id);
      }
    } else {
      toast.error('Erro ao criar negociação');
    }
  } catch (err) {
    console.error('Erro ao criar deal:', err);
    toast.error('Erro ao criar negociação');
  }
};


const fetchFunis = useCallback(async () => {
  if (!token) return;
  try {
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      }
    });
    const data = await response.json();
    setFunis(data);
  } catch (err) {
    console.error('Erro ao carregar funis:', err);
  }
}, [token]);

useEffect(() => {
  if (!token || !nonEssentialReady) return;

  let cancelled = false;
  const cancel = scheduleDeferredTask(() => {
    if (cancelled) return;
    fetchFunis();
  }, 500);

  return () => {
    cancelled = true;
    cancel();
  };
}, [token, nonEssentialReady, fetchFunis, scheduleDeferredTask]);


const fetchDeals = async () => {
  if (!token || !selectedChat?.remoteJid) return;

  setLoadingDeals(true);
  try {
    const data = await apiClient.findDealsByContact(token, selectedChat.remoteJid);
    const validDeals = Array.isArray(data)
      ? data.filter(
          deal =>
            deal &&
            typeof deal === 'object' &&
            Object.keys(deal).length > 0 &&
            deal.Id
        )
      : [];

    setDeals(validDeals);
    setShowDeals(true);
  } catch (err) {
    console.error('Erro ao buscar Deals:', err);
    toast.error('Erro ao buscar negociações');
  } finally {
    setLoadingDeals(false);
  }
};

useEffect(() => {
  selectedChatJidRef.current = normalizedSelectedChatJid;
}, [normalizedSelectedChatJid]);

useEffect(() => {
  activeChatJidsRef.current = new Set(activeChatJids);
}, [activeChatJids]);


// Adicione no início do arquivo, após os imports
const MESSAGE_CACHE_TTL = 30 * 1000; // 30 segundos para mensagens

const handleNewMessage = useCallback((msg: any) => {
  const remote = normalizeRemoteJid(msg.key?.remoteJid);
  msg.key.remoteJid = remote;
  // Verifica se é mensagem editada
  if (msg.messageType === "editedMessage") {
    const editedId = msg.message?.editedMessage?.message?.protocolMessage?.key?.id;
    const editedText = msg.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation;

    if (editedId && editedText) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editedId
            ? {
                ...m,
                message: {
                  ...m.message,
                  conversation: editedText,
                },
                wasEdited: true,
              }
            : m
        )
      );
    }
    return;
  }

  // Verifica se a mensagem é para o chat atual
  const activeSet = activeChatJidsRef.current;
  if (!activeSet.has(remote)) {
    return;
  }

  // Cria o objeto da nova mensagem
  const newMessage: Message = {
    id: msg.key.id || msg.id,
    key: {
      id: msg.key.id,
      fromMe: msg.key.fromMe,
      remoteJid: remote,
    },
    pushName: msg.pushName,
    messageType: msg.messageType,
    message: msg.message,
    messageTimestamp: msg.messageTimestamp,
    resposta: msg.resposta || undefined,
    wasEdited: msg.editedMessage || false,
    isEncaminhada: msg.isEncaminhada || false
  };

  if (sentMessageIds.current.has(newMessage.id)) {
  return;
}

  // Limpa o cache específico para as mensagens deste chat
  const cacheKeys = Array.from(activeSet).map((jid) =>
    getCacheKey('findMessages', token, {
      remoteJid: jid,
      page: 1,
      limit: 50
    })
  );
  if (cacheKeys.length > 0) {
    clearApiCache(cacheKeys);
  }

  // Atualiza o estado das mensagens
  setMessages((prev) => {
    // Verifica se a mensagem já existe
    const exists = prev.some((m) => m.id === newMessage.id);
    if (exists) {
      return prev;
    }
    
    // Adiciona a nova mensagem e ordena por timestamp
    const updated = [...prev, newMessage];
    return updated.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
  });

  // após criar newMessage, antes do setTimeout(scrollToBottom):
if (isBusiness && newMessage && newMessage.key && !newMessage.key.fromMe) {
  const now = Math.floor(Date.now() / 1000);
  const inboundTs = normalizeTimestamp(newMessage.messageTimestamp ?? now);
  if (inboundTs && (now - inboundTs) <= 86400) {
    setIsSessionActive(true);
    inactiveDispatchedRef.current = false;
  }
}


  // Rola para baixo após um pequeno delay
  setTimeout(() => {
    scrollToBottom();
  }, 100);

  // Notificar listas de conversa em outras abas somente se a mensagem veio de outro contato
  if (!msg.key.fromMe) {
    // other tabs will receive the same WS event
  }
}, [token]);

  const handleEditModal = (message: Message) => {
    setContextMenu(null);
    setEditText(message.message.conversation || "");
    setEditModal({ open: true, message });
  };


  const handleEditConfirm = async () => {
    if (!editModal.message || !editText.trim()) return;
    try {
      await apiClient.updateMessage(token, {
        number: selectedChat.remoteJid,
        key: {
          id: editModal.message.id,
          fromMe: true,
          remoteJid: editModal.message.key.remoteJid,
        },
        text: editText.trim(),
      });
      fetchMessages(1, false);
      toast.success("Mensagem editada!");
      setEditModal({ open: false, message: null });
    } catch {
      toast.error("Erro ao editar");
    }
  };

  const scrollToBottom = (smooth: boolean = true) => {
    const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  function getDateLabel(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const formatted = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${capitalized} - ${formatted}`;
  }


  const handleDeleteMessage = async (message: Message) => {
    if (!token) return;
    try {
      await apiClient.deleteMessage(token, {
        id: message.id,
        remoteJid: message.key.remoteJid,
        fromMe: true,
      });
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      toast.success("Mensagem excluída!");
    } catch (err) {
      toast.error("Erro ao excluir mensagem");
    }
  };

const mediaUrlCache = useRef<Map<string, string>>(new Map());

const LONG_CACHE_TTL = 365 * 24 * 60 * 60 * 1000; // 1 ano

function toByteArray(value: unknown): number[] | null {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "number" && Number.isFinite(item))) {
      return value.map((item) => Number(item));
    }
    return null;
  }

  if (typeof ArrayBuffer !== "undefined") {
    if (value instanceof ArrayBuffer) {
      return Array.from(new Uint8Array(value));
    }

    if (ArrayBuffer.isView(value)) {
      const view = value as ArrayBufferView;
      return Array.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if ("data" in record && record.data !== value) {
      const nested = toByteArray(record.data);
      if (nested) {
        return nested;
      }
    }

    const numericKeys = Object.keys(record).filter((key) => /^-?\d+$/.test(key));
    if (numericKeys.length) {
      numericKeys.sort((a, b) => Number(a) - Number(b));
      const result: number[] = [];

      for (const key of numericKeys) {
        const raw = record[key];
        if (typeof raw !== "number" || !Number.isFinite(raw)) {
          return null;
        }
        result.push(Number(raw));
      }

      if (result.length) {
        return result;
      }
    }
  }

  return null;
}

function bytesToHex(bytes: ArrayLike<number>): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    const numeric = Number(bytes[i]);
    if (!Number.isFinite(numeric)) {
      continue;
    }
    const clamped = Math.min(255, Math.max(0, Math.floor(numeric)));
    hex += clamped.toString(16).padStart(2, "0");
  }
  return hex;
}

function normalizeHashValue(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  const byteArray = toByteArray(value);
  if (byteArray) {
    return bytesToHex(byteArray);
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildCacheKey(prefix: string, values: unknown[]): string | null {
  const normalized = values
    .map((value) => normalizeHashValue(value))
    .filter((value): value is string => Boolean(value));

  if (!normalized.length) {
    return null;
  }

  const suffix = normalized.join("|").trim();
  if (!suffix) {
    return null;
  }

  return `${prefix}:${suffix}`;
}

function mediaCacheKey(id?: unknown, sha256?: unknown) {
  return buildCacheKey("midia", [id, sha256]);
}
function readMediaFromLocalCache(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.dataUrl || !data?.ts) return null;
    // mesmo com TTL, seguimos a regra de "no máximo 1 vez":
    // se existe no cache, usamos — a expiração é apenas safety.
    if (Date.now() - data.ts > LONG_CACHE_TTL) return data.dataUrl; 
    return data.dataUrl;
  } catch {
    return null;
  }
}
function writeMediaToLocalCache(key: string, dataUrl: string, extra?: any) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), dataUrl, ...extra })
    );
  } catch {
    // pode estourar quota; só ignora
  }
}

// ===== EVO MEDIA CACHE (não-oficial) =====
function evoMediaCacheKey(part: {
  url?: string;
  id?: string;
  fileEncSha256?: unknown;
  fileSha256?: unknown;
}) {
  return buildCacheKey("evo", [part.fileEncSha256, part.fileSha256, part.id, part.url]);
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

const fetchEvoMediaUrl = useCallback(
  async (part: {
    url?: string;
    mediaKey?: MediaKeyInput;
    mimetype?: string;
    id?: string;
    fileEncSha256?: unknown;
    fileSha256?: unknown;
  }): Promise<string | null> => {
    if (!part?.url) return null;

    // Se a URL não é do whatsapp.net, não descriptografa (usa direto)
    const isWhatsappCdn = /whatsapp\.net/.test(part.url);
    if (!isWhatsappCdn) return part.url;

    // cache em memória + persistente
    const key = evoMediaCacheKey(part);
    if (key) {
      const mem = mediaUrlCache.current.get(key);
      if (mem) return mem;

      const persisted = readMediaFromLocalCache(key);
      if (persisted) {
        mediaUrlCache.current.set(key, persisted);
        return persisted;
      }
    }

    // Descriptografa via helper EVO
    try {
      const buffer = await decryptEvoMedia(part.url, part.mediaKey!, part.mimetype!);
      const blob = new Blob([buffer], { type: part.mimetype || "application/octet-stream" });
      const dataUrl = await blobToDataURL(blob);

      // cache
      if (key) {
        writeMediaToLocalCache(key, dataUrl, {
          mimeType: part.mimetype,
          id: part.id,
          fileEncSha256: part.fileEncSha256,
          fileSha256: part.fileSha256,
        });
        mediaUrlCache.current.set(key, dataUrl);
      }
      return dataUrl;
    } catch (e) {
      console.error("Erro ao obter mídia EVO:", e);
      return null;
    }
  },
  []
);


type OfficialPart = { id?: string; sha256?: unknown; mime_type?: string };

const fetchOfficialMediaUrl = useCallback(
  async (part: OfficialPart): Promise<string | null> => {
    if (!part?.id || !part?.sha256) return null;

    const key = mediaCacheKey(part.id, part.sha256);

    if (key) {
      // 1) cache em memória
      const mem = mediaUrlCache.current.get(key);
      if (mem) return mem;

      // 2) cache persistente (localStorage)
      const persisted = readMediaFromLocalCache(key);
      if (persisted) {
        mediaUrlCache.current.set(key, persisted);
        return persisted;
      }
    }

    // 3) request (somente se não tiver NENHUM cache)
    try {
      const resp = await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/chat/findMidia",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { token } : {}),
          },
          body: JSON.stringify({
            // o n8n só precisa identificar a mídia; envie tudo que tiver
            id: part.id,
            sha256: part.sha256,
            mime_type: part.mime_type,
          }),
        }
      );

      if (!resp.ok) {
        console.error(
          "Falha ao baixar mídia oficial:",
          resp.status,
          await resp.text().catch(() => "")
        );
        return null;
      }

      // Novo formato: array com 1 objeto que contém base64 + metadata
      const payload = await resp.json();
      const item = Array.isArray(payload) ? payload[0] : payload;

      if (!item?.base64) {
        console.error("Resposta sem base64 válida:", payload);
        return null;
      }

      const mime =
        item.mimeType || part.mime_type || "application/octet-stream";
      const dataUrl = `data:${mime};base64,${item.base64}`;

      // grava cache persistente + memória
      if (key) {
        writeMediaToLocalCache(key, dataUrl, {
          mimeType: mime,
          fileName: item.fileName,
          fileType: item.fileType,
          fileExtension: item.fileExtension,
        });
        mediaUrlCache.current.set(key, dataUrl);
      }

      return dataUrl;
    } catch (e) {
      console.error("Erro na requisição de mídia oficial:", e);
      return null;
    }
  },
  [token]
);


// Componente interno para resolver e renderizar a mídia binária oficial
function OfficialBinaryMedia({
  part,
  kind,
  isEdited,
}: {
  part: OfficialPart;
  kind: "image" | "video" | "audio" | "document" | "sticker";
  isEdited?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchOfficialMediaUrl(part).then((u) => {
      if (mounted) {
        setUrl(u);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [part?.id, part?.sha256, part?.mime_type, fetchOfficialMediaUrl]);

  if (loading) {
    return (
      <div className="w-40 h-40 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!url) {
    return <div className="text-xs text-red-500">Não foi possível carregar a mídia.</div>;
  }

  switch (kind) {
    case "image":
      return (
        <div className="space-y-1">
          <img
            src={url}
            alt="Imagem"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openPreview(url, "image")}
          />
          {isEdited && <div className="text-[10px] text-emerald-600">Mensagem editada</div>}
        </div>
      );
    case "video":
      return (
        <div className="space-y-1">
          <video
            src={url}
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => openPreview(url, "video")}
          />
          {isEdited && <div className="text-[10px] text-emerald-600">Mensagem editada</div>}
        </div>
      );
    case "audio":
      return <AudioPlayer url={url} />;
    case "document":
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">Documento</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-center">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <a
            href={url}
            download
            className="w-full inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm text-center"
          >
            Baixar arquivo
          </a>
        </div>
      );
    case "sticker":
      return <img src={url} alt="Sticker" className="max-w-[200px] rounded-lg" />;
    default:
      return null;
  }
}

// Componente interno para resolver e renderizar a mídia da API NÃO-OFICIAL (EVO)
function EvoBinaryMedia({
  part,
  kind,
  isEdited,
}: {
  part: {
    url?: string;
    mediaKey?: MediaKeyInput;
    mimetype?: string;
    id?: string;
    fileEncSha256?: unknown;
    fileSha256?: unknown;
    width?: number;
    height?: number;
  };
  kind: "image" | "video" | "audio" | "document" | "sticker";
  isEdited?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      // Se não tem URL, nada a fazer
      if (!part?.url) {
        if (mounted) {
          setUrl(null);
          setLoading(false);
        }
        return;
      }

      try {
        const resolved = await fetchEvoMediaUrl(part);
        if (mounted) {
          setUrl(resolved);
          setLoading(false);
        }
      } catch (e) {
        console.error("EvoBinaryMedia error:", e);
        if (mounted) {
          setUrl(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [part?.url, part?.mediaKey, part?.mimetype, part?.fileEncSha256, part?.fileSha256, fetchEvoMediaUrl]);

  if (loading) {
    return (
      <div className="w-40 h-40 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!url) {
    return <div className="text-xs text-red-500">Não foi possível carregar a mídia.</div>;
  }

  switch (kind) {
    case "image":
      return (
        <div className="space-y-1">
          <img
            src={url}
            alt="Imagem"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openPreview(url, "image")}
            width={part.width}
            height={part.height}
          />
          {isEdited && <div className="text-[10px] text-emerald-600">Mensagem editada</div>}
        </div>
      );

    case "video":
      return (
        <div className="space-y-1">
          <video
            src={url}
            className="max-w-xs rounded-lg cursor-pointer"
            onClick={() => openPreview(url, "video")}
          />
          {isEdited && <div className="text-[10px] text-emerald-600">Mensagem editada</div>}
        </div>
      );

    case "audio":
      return <AudioPlayer url={url} />;

    case "document":
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">Documento</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-center">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <a
            href={url}
            download
            className="w-full inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm text-center"
          >
            Baixar arquivo
          </a>
        </div>
      );

    case "sticker":
      return <img src={url} alt="Sticker" className="max-w-[200px] rounded-lg" />;

    default:
      return null;
  }
}

const AlbumCarousel = ({ items, type }: { items: Message[]; type: string }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === items.length ? new Set() : new Set(items.map(i => i.id))
    );
  };

  const downloadSelected = async () => {
    const targets = items.filter(m => selected.size === 0 || selected.has(m.id));
    for (const m of targets) {
      await handleDownloadMedia(m);
    }
  };

  const AlbumMediaItem = ({ msg, index }: { msg: Message; index: number }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      (async () => {
        const directUrl = getMediaUrl(msg);
        const part = getMediaPart(msg);
        if (!part) return;

        let finalUrl = directUrl || "";
        try {
          if (isBusiness && part.id && part.sha256) {
            finalUrl =
              (await fetchOfficialMediaUrl({
                id: part.id,
                sha256: part.sha256,
                mime_type: part.mime_type,
              })) || finalUrl;
          } else if (
            directUrl &&
            /whatsapp\.net/.test(directUrl) &&
            part.mediaKey &&
            part.mimetype
          ) {
            finalUrl =
              (await fetchEvoMediaUrl({
                url: directUrl,
                mediaKey: part.mediaKey,
                mimetype: part.mimetype,
                id: part.id,
                fileEncSha256: part.fileEncSha256,
                fileSha256: part.fileSha256,
              })) || finalUrl;
          }
        } catch (e) {
          console.error("Album item resolve error:", e);
        }

        if (mounted) setUrl(finalUrl || null);
      })();
      return () => {
        mounted = false;
      };
    }, [msg]);

    if (!url) {
      return (
        <div className="h-32 w-full bg-gray-100 rounded-lg animate-pulse" />
      );
    }

    const extra =
      items.length === 3 && index === 2
        ? "col-span-2"
        : "";

    const content =
      type === "image" ? (
        <img
          src={url}
          className="h-32 w-full object-cover rounded-lg cursor-pointer"
          onClick={() => openPreview(url, "image")}
        />
      ) : (
        <video
          src={url}
          className="h-32 w-full rounded-lg cursor-pointer"
          onClick={() => openPreview(url, "video")}
        />
      );

    return (
      <div
        className={`relative ${extra}`}
      >
        {content}
        {items.length > 1 && (
          <input
            type="checkbox"
            className="absolute top-1 left-1 w-4 h-4"
            checked={selected.has(msg.id)}
            onChange={() => toggle(msg.id)}
          />
        )}
        {index === 3 && items.length > 4 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-semibold rounded-lg">
            +{items.length - 4}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div
        className={`grid gap-1 ${
          items.length <= 2
            ? "grid-cols-2"
            : "grid-cols-2 grid-rows-2"
        }`}
      >
        {items.slice(0, 4).map((m, idx) => (
          <AlbumMediaItem key={m.id} msg={m} index={idx} />
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex justify-end space-x-2 text-xs">
          <button
            onClick={toggleAll}
            className="text-emerald-600 hover:text-emerald-700"
          >
            {selected.size === items.length ? "Limpar" : "Selecionar todos"}
          </button>
          <button
            onClick={downloadSelected}
            className="flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <Download className="w-4 h-4 mr-1" /> Baixar
          </button>
        </div>
      )}
    </div>
  );
};

  useEffect(() => {
    const container = scrollAreaRef.current;
    if (!container) return;

    if (prevScrollHeightRef.current !== null) {
      const diff = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = diff;
      prevScrollHeightRef.current = null;
    } else {
      scrollToBottom(false);
    }
  }, [messages]);

const initialLoadRef = useRef(false);
const lastChatIdRef = useRef<string | null>(null);

useEffect(() => {
  const id = selectedChat?.id;
  if (!id || lastChatIdRef.current === id) return;
  lastChatIdRef.current = id;
  cancelDeferredTasks();
  setNonEssentialReady(false);
  setPage(1);
  setMessages([]);
  setHasMore(true);
  setReplyToMessage(null);
  ignoreScrollRef.current = true;
  initialLoadRef.current = false;
  firstPageLoadedRef.current = false;
  setIsSessionActive(true);
  noMorePagesRef.current = false;
  inactiveDispatchedRef.current = false;
  inFlightPagesRef.current.clear();
  setSessionInfo(null);
  setSessionInfoLoaded(false);
  setInterventionInfo(null);
  setPermanentInterventionInfo(null);
  setContactTags([]);
  setContactData(null);
  setContactForm({ nome: '', email: '', telefone: '' });
  setHasMarkedAsRead(false);
  setUnreadMarkerIndex(null);
  setUnreadCount(0);
}, [selectedChat?.id, cancelDeferredTasks]);

useEffect(() => {
  if (initialLoadRef.current || !selectedChat?.id) return;
  initialLoadRef.current = true;
  fetchMessages(1, false);
}, [selectedChat?.id, fetchMessages]);

useEffect(() => {
  if (!selectedChat?.id || nonEssentialReady) return;

  if (typeof window === 'undefined') {
    setNonEssentialReady(true);
    return;
  }

  const fallbackId = window.setTimeout(() => {
    setNonEssentialReady(true);
  }, 1200);

  return () => {
    window.clearTimeout(fallbackId);
  };
}, [selectedChat?.id, nonEssentialReady]);

useMessageEvents(handleNewMessage);

const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
  const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
  
  if (scrollHeight - (scrollTop + clientHeight) < 100 && unreadCount > 0 && !hasMarkedAsRead) {
    markAsRead();
  }

  if (ignoreScrollRef.current) {
    ignoreScrollRef.current = false;
    return;
  }

  const activeJids = Array.from(activeChatJidsRef.current);
  const isFetchingCurrent = activeJids.some(
    (jid) => (inFlightPagesRef.current.get(jid)?.size ?? 0) > 0
  );

  if (
    scrollTop === 0 &&
    hasMore &&
    !loadingMore &&
    !isFetchingCurrent &&
    !noMorePagesRef.current &&
    firstPageLoadedRef.current
  ) {
    const container = scrollAreaRef.current;
    if (container) {
      prevScrollHeightRef.current = container.scrollHeight;
    }
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage, true);
  }
};

  function formatWhatsAppText(text: string): JSX.Element[] {
    const tokens = text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~|```[^`]+```)/g);
    return tokens.map((token, i) => {
      if (/^\*[^*]+\*$/.test(token)) {
        return <strong key={i}>{token.slice(1, -1)}</strong>;
      }
      if (/^_[^_]+_$/.test(token)) {
        return <em key={i}>{token.slice(1, -1)}</em>;
      }
      if (/^~[^~]+~$/.test(token)) {
        return <del key={i}>{token.slice(1, -1)}</del>;
      }
      if (/^```[^`]+```$/.test(token)) {
        return (
          <code
            key={i}
            className="bg-muted text-muted-foreground text-xs px-1 py-0.5 rounded"
          >
            {token.slice(3, -3)}
          </code>
        );
      }
      return <span key={i}>{token}</span>;
    });
  }

  const getDisplayName = (chat: Chat) => {
    return (
      contactData?.nome ||
      sanitizePushName(chat.pushName, chat.remoteJid) ||
      chat.remoteJid.split("@")[0] ||
      "Contato desconhecido"
    );
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const dealsButtonRef = useRef<HTMLButtonElement>(null);

  function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const isTemplateMessage = (text: string): boolean => {
  return /^▶️.*◀️$/.test(text);
};

// Função para extrair nome do template
const extractTemplateName = (text: string): string => {
  const match = text.match(/^▶️(.*)◀️$/);
  return match ? match[1] : text;
};

// Função para renderizar template
const renderTemplate = (templateName: string): JSX.Element => {
  return (
    <div className="space-y-2">
      {/* Indicador de que é um template */}
      <div className="flex items-center space-x-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="font-medium">Template WhatsApp</span>
      </div>
      
      {/* Container do template com design especial */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center space-x-3">
          {/* Ícone do template */}
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z" />
            </svg>
          </div>
          
          {/* Informações do template */}
          <div className="flex-1">
            <div className="font-semibold text-gray-800 text-sm">
              {templateName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Template enviado via WhatsApp Business
            </div>
          </div>
          
          {/* Badge indicativo */}
          <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            Template
          </div>
        </div>
      </div>
    </div>
  );
};


const renderMessageContent = (message: Message) => {
  // Não renderiza mensagens de reação
  if (message.messageType === "reactionMessage") {
    return null;
  }

  const quotedId = message.resposta?.idMensagem;
  const quotedText = message.resposta?.mensagem;
  const isAudioQuoted = message.resposta?.audioMessage;

  const quotedElement = quotedId ? (
    <button
      onClick={() => {
        const el = document.getElementById(`msg-${quotedId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className="text-xs border-l-4 border-emerald-400 bg-emerald-50 text-emerald-700 px-3 py-1 rounded mb-2 cursor-pointer hover:bg-emerald-100"
    >
      {isAudioQuoted
        ? "Resposta a um áudio"
        : quotedText
        ? `${quotedText.slice(0, 40)}...`
        : "Mensagem respondida"}
    </button>
  ) : null;

  const { messageType, message: msgContent } = message;
  const isEdited = message.wasEdited;

  let content: JSX.Element;

  switch (messageType) {
case "conversation":
  if (msgContent.conversation) {
    // Verificar se é um template
    if (isTemplateMessage(msgContent.conversation)) {
      const templateName = extractTemplateName(msgContent.conversation);
      content = renderTemplate(templateName);
    } else {
      // Renderização normal para mensagens de texto
      content = (
        <div className="whitespace-pre-wrap break-words space-y-1">
          {formatWhatsAppText(msgContent.conversation)}
          {isEdited && (
            <div className="text-[10px] text-emerald-600 italic">(editado)</div>
          )}
        </div>
      );
    }
  }
  break;
case "templateButtonReplyMessage":
  if (msgContent.templateButtonReplyMessage) {
    const reply = msgContent.templateButtonReplyMessage;
    content = (
      <div className="space-y-2">
        {/* Indicador de que é uma resposta a template */}
        <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="font-medium">Resposta a Template</span>
        </div>
        
        {/* Container da resposta */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{reply.selectedIndex + 1}</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Opção selecionada:</span>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-indigo-100">
            <div className="text-sm font-semibold text-gray-800">
              "{reply.selectedDisplayText}"
            </div>
            {reply.selectedId !== reply.selectedDisplayText && (
              <div className="text-xs text-gray-500 mt-1">
                ID: {reply.selectedId}
              </div>
            )}
          </div>
        </div>
        
        {isEdited && (
          <div className="text-[10px] text-emerald-600 italic">(editado)</div>
        )}
      </div>
    );
  }
  break;

case "templateMessage":
  if (msgContent.templateMessage) {
    const templateData = msgContent.templateMessage;
    
    // Verificar se é hydratedTemplate ou interactiveMessageTemplate
    const isHydrated = !!templateData.hydratedTemplate;
    const isInteractive = !!templateData.interactiveMessageTemplate;
    
    if (isHydrated) {
      const template = templateData.hydratedTemplate;
      content = (
        <div className="space-y-2">
          {/* Indicador de que é um template */}
          <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Template WhatsApp</span>
            <span className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full">
              ID: {templateData.templateId}
            </span>
          </div>
          
          {/* Container do template */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-sm">
            {/* Header do template */}
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-3 py-2">
              Template do WhatsApp Business
            </div>
            
            {/* Título do template (se houver) */}
            {template.hydratedTitleText && template.hydratedTitleText.trim() !== "" && (
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="font-semibold text-gray-800 text-sm">
                  {template.hydratedTitleText}
                </div>
              </div>
            )}
            
            {/* Conteúdo do template */}
            {template.hydratedContentText && (
              <div className="px-3 py-3">
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {template.hydratedContentText}
                </div>
              </div>
            )}
            
            {/* Botões do template */}
            {template.hydratedButtons && template.hydratedButtons.length > 0 && (
              <div className="border-t border-gray-100">
                {template.hydratedButtons.map((btn, idx) => (
                  <div
                    key={idx}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    {btn.quickReplyButton && (
                      <div className="text-center py-3 px-3 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                        {btn.quickReplyButton.displayText}
                      </div>
                    )}
                    {btn.urlButton && (
                      <div className="text-center py-3 px-3 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors cursor-pointer">
                        🔗 {btn.urlButton.displayText}
                      </div>
                    )}
                    {btn.callButton && (
                      <div className="text-center py-3 px-3 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                        📞 {btn.callButton.displayText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    } else if (isInteractive) {
      const template = templateData.interactiveMessageTemplate;
      
      // Parse dos botões do nativeFlowMessage
      const buttons = template.nativeFlowMessage?.buttons || [];
      
      content = (
        <div className="space-y-2">
          {/* Indicador de que é um template interativo */}
          <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">Template Interativo</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
              ID: {templateData.templateId}
            </span>
          </div>
          
          {/* Container do template */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-sm">
            {/* Header do template */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs px-3 py-2">
              Template Interativo WhatsApp
            </div>
            
            {/* Título do header (se houver) */}
            {template.header?.title && template.header.title.trim() !== "" && (
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="font-semibold text-gray-800 text-sm">
                  {template.header.title}
                </div>
              </div>
            )}
            
            {/* Conteúdo do body */}
            {template.body?.text && (
              <div className="px-3 py-3">
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {template.body.text}
                </div>
              </div>
            )}
            
            {/* Botões interativos */}
            {buttons.length > 0 && (
              <div className="border-t border-gray-100">
                {buttons.map((btn, idx) => {
                  let buttonParams = {};
                  try {
                    buttonParams = JSON.parse(btn.buttonParamsJson || '{}');
                  } catch (e) {
                    console.error('Erro ao fazer parse dos parâmetros do botão:', e);
                  }
                  
                  return (
                    <div
                      key={idx}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      {btn.name === 'quick_reply' && (
                        <div className="text-center py-3 px-3 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                          {buttonParams.display_text || 'Resposta Rápida'}
                        </div>
                      )}
                      {btn.name === 'cta_url' && (
                        <div className="text-center py-3 px-3 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors cursor-pointer">
                          🔗 {buttonParams.display_text || 'Link'}
                        </div>
                      )}
                      {btn.name === 'cta_call' && (
                        <div className="text-center py-3 px-3 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                          📞 {buttonParams.display_text || 'Ligar'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Fallback para templates sem estrutura reconhecida
      content = (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <span className="text-sm font-medium text-gray-700">Template WhatsApp</span>
            <div className="text-xs text-gray-500">ID: {templateData.templateId}</div>
          </div>
        </div>
      );
    }
  } else {
    // Se não tem templateMessage, mostrar fallback
    content = (
      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Template Message</span>
      </div>
    );
  }
  break;
// IMAGE
// IMAGE
case "imageMessage": {
  const part = msgContent?.imageMessage;
  const directUrl = msgContent?.mediaUrl || part?.url;

  if (isBusiness && part?.id && part?.sha256 && part?.mime_type) {
    content = <OfficialBinaryMedia part={part} kind="image" isEdited={isEdited} />;
    break;
  }

  // NÃO-OFICIAL (EVO)
  if (!isBusiness && directUrl) {
    const isWhatsappCdn = /whatsapp\.net/.test(directUrl);
    if (isWhatsappCdn && part?.mediaKey && part?.mimetype) {
      content = (
        <EvoBinaryMedia
          part={{
            url: directUrl,
            mediaKey: part.mediaKey,
            mimetype: part.mimetype,
            id: part.id,
            fileEncSha256: part.fileEncSha256,
            fileSha256: part.fileSha256,
            width: part.width,
            height: part.height,
          }}
          kind="image"
          isEdited={isEdited}
        />
      );
      break;
    }
    // fallback: URL direta (já descriptografada/no proxy)
    content = (
      <div className="space-y-1">
        <img
          src={directUrl}
          alt="Imagem"
          className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => openPreview(directUrl, "image")}
        />
        {isEdited && <div className="text-[10px] text-emerald-600">Mensagem editada</div>}
      </div>
    );
  }
  break;
}


// VIDEO
// VIDEO
case "videoMessage": {
  const part = msgContent?.videoMessage;
  const directUrl = msgContent?.mediaUrl || part?.url;

  if (isBusiness && part?.id && part?.sha256 && part?.mime_type) {
    content = <OfficialBinaryMedia part={part} kind="video" isEdited={isEdited} />;
    break;
  }

  if (!isBusiness && directUrl) {
    const isWhatsappCdn = /whatsapp\.net/.test(directUrl);
    if (isWhatsappCdn && part?.mediaKey && part?.mimetype) {
      content = (
        <EvoBinaryMedia
          part={{
            url: directUrl,
            mediaKey: part.mediaKey,
            mimetype: part.mimetype,
            id: part.id,
            fileEncSha256: part.fileEncSha256,
            fileSha256: part.fileSha256,
          }}
          kind="video"
          isEdited={isEdited}
        />
      );
      break;
    }
    content = (
      <div className="space-y-1">
        <video
          src={directUrl}
          className="max-w-xs rounded-lg cursor-pointer"
          onClick={() => openPreview(directUrl, "video")}
        />
        {isEdited && <div className="text-[10px] text-emerald-600">Mensagem editada</div>}
      </div>
    );
  }
  break;
}


// AUDIO
// AUDIO
case "audioMessage": {
  const part = msgContent?.audioMessage;
  const directUrl = msgContent?.mediaUrl || part?.url;

  if (isBusiness && part?.id && part?.sha256 && part?.mime_type) {
    content = <OfficialBinaryMedia part={part} kind="audio" isEdited={isEdited} />;
    break;
  }

  if (!isBusiness && directUrl) {
    const isWhatsappCdn = /whatsapp\.net/.test(directUrl);
    if (isWhatsappCdn && part?.mediaKey && part?.mimetype) {
      content = (
        <EvoBinaryMedia
          part={{
            url: directUrl,
            mediaKey: part.mediaKey,
            mimetype: part.mimetype,
            id: part.id,
            fileEncSha256: part.fileEncSha256,
            fileSha256: part.fileSha256,
          }}
          kind="audio"
          isEdited={isEdited}
        />
      );
      break;
    }
    content = <AudioPlayer url={directUrl} />;
  }
  break;
}


// DOCUMENT
// DOCUMENT
case "documentMessage": {
  const part = msgContent?.documentMessage;
  const directUrl = msgContent?.mediaUrl || part?.url;

  if (isBusiness && part?.id && part?.sha256 && part?.mime_type) {
    content = <OfficialBinaryMedia part={part} kind="document" isEdited={isEdited} />;
    break;
  }

  if (!isBusiness && directUrl) {
    const isWhatsappCdn = /whatsapp\.net/.test(directUrl);
    if (isWhatsappCdn && part?.mediaKey && part?.mimetype) {
      content = (
        <EvoBinaryMedia
          part={{
            url: directUrl,
            mediaKey: part.mediaKey,
            mimetype: part.mimetype,
            id: part.id,
            fileEncSha256: part.fileEncSha256,
            fileSha256: part.fileSha256,
          }}
          kind="document"
          isEdited={isEdited}
        />
      );
      break;
    }
    // fallback: URL direta
    content = (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium">Documento</span>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <button
          onClick={() => window.open(directUrl, "_blank", "noopener,noreferrer")}
          className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm text-center"
        >
          Baixar arquivo
        </button>
      </div>
    );
  }
  break;
}

// (OPCIONAL) STICKER
case "stickerMessage": {
  const part = msgContent?.stickerMessage;
  if (isBusiness && part?.id && part?.sha256 && part?.mime_type) {
    content = <OfficialBinaryMedia part={part} kind="sticker" isEdited={isEdited} />;
    break;
  }
  content = (
    <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
      <FileText className="w-4 h-4" />
      <span className="text-sm">Sticker</span>
    </div>
  );
  break;
}

    case "buttonMessage":
  if (msgContent.conversation) {
    content = (
      <div className="space-y-2">
        {/* Indicador de que é uma resposta a botão */}
        <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
          </svg>
          <span className="font-medium">Resposta de botão</span>
        </div>
        
        {/* Conteúdo da mensagem */}
        <div className="whitespace-pre-wrap break-words space-y-1">
          {formatWhatsAppText(msgContent.conversation)}
          {isEdited && (
            <div className="text-[10px] text-emerald-600 italic">(editado)</div>
          )}
        </div>
      </div>
    );
  } else {
    // Fallback caso não tenha conversation
    content = (
      <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
        </svg>
        <span className="text-sm font-medium text-blue-700">Resposta de botão</span>
      </div>
    );
  }
  break;

    case "protocolMessage":
      // Não renderiza mensagens de protocolo (edições)
      return null;

    default:
      content = <div className="text-sm text-gray-500">Tipo de mensagem não suportado</div>;
  }

  return (
    <div className="space-y-1">
      {quotedElement}
      {content}
    </div>
  );
};

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-emerald-50 to-gray-50">
        <div className="flex items-center p-6 bg-white/80 backdrop-blur-sm border-b border-emerald-100">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-emerald-100 transition mr-3 md:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-600" />
          </button>
          <div className="h-12 w-12 bg-emerald-200 rounded-2xl mr-4 animate-pulse" />
          <div className="h-6 bg-emerald-200 rounded-lg flex-1 animate-pulse" />
        </div>

        <div className="flex-1 p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex ${
                i % 2 === 0 ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`h-16 bg-emerald-200 rounded-2xl animate-pulse ${
                  i % 2 === 0 ? "w-2/3" : "w-1/2"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(selectedChat);
  const normalizedSelectedJid = normalizedSelectedChatJid;
  const digitsSelected = selectedChatDigits;
  const transferLookup = digitsSelected ? `${digitsSelected}@s.whatsapp.net` : null;
  const isTransferChat =
    transferSet.has(normalizedSelectedJid) ||
    (transferLookup ? transferSet.has(transferLookup) : false);

return (
  <div
    className="h-full flex flex-col min-h-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 relative"
    onDragOver={(e) => {
      e.preventDefault();
      setDragActive(true);
    }}
    onDragLeave={(e) => {
      if (
        e.relatedTarget === null ||
        !e.currentTarget.contains(e.relatedTarget)
      ) {
        setDragActive(false);
      }
    }}
    onDrop={(e) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file && fileDropRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileDropRef.current.files = dt.files;
        fileDropRef.current.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      }
    }}
  >
{/* Header Premium */}
<div className="relative flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
  <div className="flex items-center space-x-4">
    <button
      onClick={onBack}
      className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 md:hidden group"
    >
      <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
    </button>

    {/* Avatar com Status */}
    <div className="relative">
      {selectedChat.profilePicUrl ? (
        <img
          src={selectedChat.profilePicUrl}
          alt={displayName}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-lg"
        />
      ) : (
        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm shadow-lg ring-2 ring-white">
          {getInitials(displayName)}
        </div>
      )}
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></div>
    </div>

    <div className="flex-1">
      <h3 className="font-semibold text-lg text-gray-900 leading-tight flex items-center">
        {displayName}
        <button
          onClick={handleReloadMessages}
          className="ml-2 p-1 rounded-full hover:bg-gray-100"
          title="Recarregar mensagens"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </h3>

          <div className="flex items-center gap-2">
      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
      <span className="text-xs text-slate-500 truncate">
        {formatPhoneNumber(selectedChat.remoteJid)}
      </span>
    </div>
    </div>
  </div>

  {/* Actions Bar - Tudo em uma linha */}
  <div className="flex items-center space-x-3">
    {/* Status Indicators - Tags e IA */}
    <div className="flex items-center space-x-2">
      {permanentInterventionInfo && (
        <div className={`group inline-flex items-center bg-red-700 rounded-full px-3 py-1 shadow-sm ${deletingPermanentIntervention ? 'animate-pulse' : ''}`}>
          <div className="w-2 h-2 bg-red-700 rounded-full mr-2"></div>
          <span className="text-xs font-semibold text-white">Exclusão permanente</span>
          <button
            onClick={handleDeletePermanentIntervention}
            className="ml-2 p-1 rounded-full hover:bg-orange-200 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            {deletingPermanentIntervention ? (
              <Loader2 className="w-3 h-3 text-orange-600 animate-spin" />
            ) : (
              <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      )}

      {isTransferChat && (
        <div
          className={`group inline-flex items-center border border-yellow-300 bg-yellow-100 rounded-full px-3 py-1 shadow-sm ${
            removingTransfer ? 'animate-pulse' : ''
          }`}
        >
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
          <span className="text-xs font-semibold text-yellow-800">Transferência</span>
          <button
            onClick={handleRemoveTransfer}
            disabled={removingTransfer}
            className="ml-2 p-1 rounded-full hover:bg-yellow-200 transition-all duration-200 disabled:opacity-50"
            title="Remover transferência"
          >
            {removingTransfer ? (
              <Loader2 className="w-3 h-3 text-yellow-700 animate-spin" />
            ) : (
              <X className="w-3 h-3 text-yellow-700" />
            )}
          </button>
        </div>
      )}

      {contactTags.length > 0 && (
        <div
          className={`flex flex-wrap items-center gap-1 max-w-full ${
            denseContactTagLayout ? 'max-h-16 overflow-y-auto pr-1' : ''
          }`}
        >
          {contactTags.map(tag => {
            const sizeClass = ultraDenseContactTagLayout
              ? 'px-1 py-px text-[8px]'
              : denseContactTagLayout
                ? 'px-1.5 py-[2px] text-[9px]'
                : 'px-2 py-1 text-[10px]';

            return (
              <span
                key={tag.Id}
                className={`inline-flex items-center rounded-full font-medium shadow-sm backdrop-blur-sm ${sizeClass}`}
                style={{
                  backgroundColor: tag.cor,
                  color: tag.cor_texto,
                  border: `1px solid ${tag.cor}30`
                }}
                title={`#${tag.nome}`}
              >
                #{tag.nome}
              </span>
            );
          })}
        </div>
      )}
    </div>

    {/* Deals Button */}
    <button
      ref={dealsButtonRef}
      data-deals-button
      onClick={fetchDeals}
      className="px-4 py-2 bg-gradient-to-r from-gray-50 to-indigo-50 text-blue-700 rounded-xl text-sm font-medium hover:from-gray-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200/50 shadow-sm"
    >
      {loadingDeals ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Carregando...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Negociações</span>
        </div>
      )}
    </button>

    {/* More Actions */}
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
          <MoreVertical className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          className="z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-56 p-2 animate-in slide-in-from-top-2"
        >
          {contactData && (
            <Popover.Close asChild>
              <button
                onClick={() => setContactModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="font-medium">Ver contato</span>
              </button>
            </Popover.Close>
          )}
          <button
            onClick={handleCreateIntervention}
            disabled={creatingIntervention || !!interventionInfo || !!permanentInterventionInfo}
            title="Essa função cria uma intervenção temporária na conversa. Ou seja, a conversa será interrompida pelo tempo estabelecido em Agente de IA -> Configurações do Agente -> Parâmetros do Agente -> Tempo de Intervenção"
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-gray-50 hover:text-yellow-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              {creatingIntervention ? (
                <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
              ) : (
                <PauseCircle className="w-4 h-4 text-yellow-600" />
              )}
            </div>
            <span className="font-medium">Pausar Agente de IA</span>
          </button>
          <button
            onClick={handleCreatePermanentExclusion}
            disabled={creatingPermanentExclusion || !!permanentInterventionInfo}
            title="Essa função cria uma exclusão desse usuário do agente de IA de forma permanente, ou seja, o Agente de IA não será mais ativado para este usuário"
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-gray-50 hover:text-red-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              {creatingPermanentExclusion ? (
                <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
              ) : (
                <Ban className="w-4 h-4 text-red-600" />
              )}
            </div>
            <span className="font-medium">Desativar Agente de IA</span>
          </button>
          <button
            onClick={handleStartAgent}
            disabled={startingAgent || !!permanentInterventionInfo}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-gray-50 hover:text-emerald-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              {startingAgent ? (
                <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
              ) : (
                <Play className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <span className="font-medium">
              {startingAgent ? 'Iniciando Agente...' : 'Ativar agente de IA'}
            </span>
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  </div>
</div>

    {/* Messages Area */}
    <div
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto px-6 py-6 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      onScroll={handleScroll}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 font-medium">Carregando mensagens...</span>
            </div>
          </div>
        )}

        {!hasMore && !loadingMore && messages.length > 0 && (
          <div className="flex justify-center py-4">
            <span className="text-xs text-gray-500">Não existem mais mensagens anteriores.</span>
          </div>
        )}

        {(() => {
          const skip = new Set<number>();
          return messages.map((message, index) => {
            if (skip.has(index)) return null;

            let album: Message[] | null = null;
            const type = getMediaType(message);
            if (type && (type === "image" || type === "video")) {
              let j = index + 1;
              while (j < messages.length) {
                const next = messages[j];
                const nextType = getMediaType(next);
                if (
                  nextType === type &&
                  next.key.fromMe === message.key.fromMe
                ) {
                  album = album || [message];
                  album.push(next);
                  skip.add(j);
                  j++;
                } else {
                  break;
                }
              }
              if (album && album.length <= 1) album = null;
            }

            const messageDateLabel = getDateLabel(message.messageTimestamp);
            const prevMessage = messages[index - 1];
            const prevDateLabel = prevMessage ? getDateLabel(prevMessage.messageTimestamp) : null;
            const showDateSeparator = index === 0 || messageDateLabel !== prevDateLabel;
            const isFromMe = message.key.fromMe;
            const showUnreadMarker =
              unreadMarkerIndex !== null &&
              index <= unreadMarkerIndex &&
              (album ? index + album.length - 1 >= unreadMarkerIndex : index === unreadMarkerIndex);

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-8">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-white/70 backdrop-blur-sm rounded-full shadow-sm border border-gray-200/50">
                      {messageDateLabel}
                    </div>
                  </div>
                )}

                {showUnreadMarker && (
                  <div id="unread-marker" className="flex items-center justify-center my-4">
                    <div className="bg-gray-500 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>Mensagens não visualizadas</span>
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  id={`msg-${message.id}`}
                  className={`relative flex ${isFromMe ? "justify-end" : "justify-start"}`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, message });
                  }}
                  onDoubleClick={() => {
                    setReplyToMessage(message);
                  }}
                >
                {/* Avatar for incoming messages */}
                {!isFromMe && (
                  <div className="mr-3 mt-1">
                    {selectedChat.profilePicUrl ? (
                      <img
                        src={selectedChat.profilePicUrl}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-semibold">
                        {getInitials(displayName).slice(0, 1)}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`
                    max-w-[75%] rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md group
                    ${
                      isFromMe
                        ? "bg-gradient-to-br from-gray-500 to-gray-600 text-white ml-12 rounded-br-md"
                        : "bg-white text-gray-800 mr-12 border border-gray-200/50 rounded-bl-md"
                    }
                  `}
                >
                  {/* Header with sender name and time */}
                  <div
                    className={`
                      flex items-center justify-between px-4 pt-3 pb-1
                      ${isFromMe ? "text-blue-100" : "text-gray-500"}
                    `}
                  >
                    {!isFromMe && (
                      <span className="text-xs font-semibold text-blue-600">
                        {sanitizePushName(message.pushName, message.key.remoteJid) || "Usuário"}
                      </span>
                    )}
                    <span className={`text-xs ${isFromMe ? "text-blue-100" : "text-gray-400"}`}>
                      {formatMessageTime(message.messageTimestamp)}
                    </span>
                  </div>

                  <div className="px-4 pb-4">
                    {message.isEncaminhada && (
                      <div className={`text-xs mb-2 flex items-center space-x-1 ${isFromMe ? "text-blue-200" : "text-gray-500"}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Encaminhada</span>
                      </div>
                    )}

                    <div className="text-sm leading-relaxed">
                      {album ? (
                        <AlbumCarousel items={album} type={type!} />
                      ) : (
                        renderMessageContent(message)
                      )}
                    </div>

                    {message.wasEdited && (
                      <div className={`text-xs mt-2 italic ${isFromMe ? "text-blue-200" : "text-gray-500"}`}>
                        (editado)
                      </div>
                    )}
                  </div>

                  {/* Message status indicators for non-official API */}
                  {isFromMe && whatsappType !== 'WHATSAPP-BUSINESS' && (
                    <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                      {message.status === 'pending' && (
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      )}
                      {message.status === 'error' && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      {(!message.status || message.status === 'sent') && (
                        <CheckCheck className="w-3 h-3 text-white" />
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isFromMe &&
                whatsappType === 'WHATSAPP-BUSINESS' &&
                message.status && (
                  <div className="flex justify-end mt-1">
                    {message.status.toUpperCase() === 'FAILED' ? (
                      <div className="flex items-center text-red-500 space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span className="text-[10px]">Erro</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500 space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-[10px]">Enviada</span>
                      </div>
                    )}
                  </div>
                )}
            </div>
            );
          });
        })()}

        <div ref={messagesEndRef} />
      </div>
    </div>

{/* Deals Popup */}
{showDeals && (
  <div
    id="deals-popup"
    className="fixed bg-white border border-gray-200 shadow-2xl rounded-2xl w-96 max-h-[500px] overflow-hidden z-[9999] animate-in slide-in-from-top-2"
    style={{ 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      top: dealsButtonRef.current ? 
        Math.min(
          dealsButtonRef.current.getBoundingClientRect().bottom + 12,
          window.innerHeight - 520 // 500px height + 20px margin
        ) + 'px' : '80px',
      left: dealsButtonRef.current ? 
        Math.min(
          dealsButtonRef.current.getBoundingClientRect().left,
          window.innerWidth - 400 // 384px width + 16px margin
        ) + 'px' : '50%',
      transform: dealsButtonRef.current ? 'none' : 'translateX(-50%)',
      right: 'auto' // Garante que não vai além da borda direita
    }}
  >
    {/* Header */}
    <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-6 py-4 border-b border-gray-200/50">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-800">Negociações</h4>
        </div>
        <button
          onClick={() => setShowDeals(false)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    {/* Content */}
    <div className="p-6">
      {deals.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h5 className="font-semibold text-gray-800 mb-2">Nenhuma negociação encontrada</h5>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Este contato ainda não possui negociações ativas. Crie a primeira negociação para começar o acompanhamento.
          </p>
          
          <button
            onClick={createNewDeal}
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-indigo-600 text-white rounded-xl hover:from-gray-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Criar Primeira Negociação</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="max-h-80 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {deals.map((deal) => {
              const funil = funis.find((f) => f.id === deal.id_funil);
              const estagio = funil?.estagios?.find((e) => e.Id == deal.id_estagio);
              return (
                <div
                  key={deal.Id}
                  onClick={() => {
                    setShowDeals(false);
                    setSelectedDealId(deal.Id);
                  }}
                  className="cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h6 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                        {deal.titulo}
                      </h6>
                      <div className="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                        <span>{funil?.nome}</span>
                        <span>→</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{estagio?.nome}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        R$ {deal.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={createNewDeal}
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-indigo-600 text-white rounded-xl hover:from-gray-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Criar Nova Negociação</span>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}

<DealDetailsPanel
  isOpen={selectedDealId !== null}
  dealId={selectedDealId as number}
  onClose={() => setSelectedDealId(null)}
/>

    {/* Drag & Drop Overlay */}
    {dragActive && (
      <div className="absolute inset-0 bg-gray-500/10 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-lg border-2 border-dashed border-blue-400 rounded-3xl p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Paperclip className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Solte o arquivo aqui
          </h3>
          <p className="text-gray-600">Para enviar na conversa</p>
        </div>
      </div>
    )}

    {/* Context Menu */}
    {contextMenu && (
      <div
        className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden animate-in slide-in-from-top-1"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={() => setContextMenu(null)}
      >
        <button
          className="w-full px-4 py-3 hover:bg-gray-50 text-gray-700 hover:text-blue-700 flex items-center space-x-3 transition-colors"
          onClick={() => {
            setContextMenu(null);
            setReplyToMessage(contextMenu.message);
          }}
        >
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">Responder</span>
        </button>

        {isMediaMessage(contextMenu.message) && (
          <button
            className="w-full px-4 py-3 hover:bg-blue-50 text-gray-700 hover:text-blue-700 flex items-center space-x-3 transition-colors"
            onClick={() => handleDownloadMedia(contextMenu.message)}
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium">Baixar</span>
          </button>
        )}

        {contextMenu.message.key.fromMe && (
          <>
            <button
              className="w-full px-4 py-3 hover:bg-amber-50 text-gray-700 hover:text-amber-700 flex items-center space-x-3 transition-colors"
              onClick={() => handleEditModal(contextMenu.message)}
            >
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="font-medium">Editar</span>
            </button>
            <button
              className="w-full px-4 py-3 hover:bg-red-50 text-gray-700 hover:text-red-700 flex items-center space-x-3 transition-colors"
              onClick={() => handleDeleteMessage(contextMenu.message)}
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <span className="font-medium">Excluir</span>
            </button>
          </>
        )}
      </div>
    )}

    {/* Edit Modal */}
    {editModal.open && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span>Editar mensagem</span>
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <textarea
              className="w-full border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Digite sua mensagem..."
            />
            <div className="flex justify-end space-x-3">
              <button
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                onClick={() => setEditModal({ open: false, message: null })}
              >
                Cancelar
              </button>
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-gray-500 to-indigo-600 text-white rounded-xl hover:from-gray-600 hover:to-indigo-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={handleEditConfirm}
              >
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Contact Modal */}
    {contactModalOpen && contactData && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span>Contato</span>
            </h2>
            <button
              onClick={() => setContactModalOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={contactForm.nome}
                onChange={(e) =>
                  setContactForm({ ...contactForm, nome: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-xl p-2 bg-gray-100"
                value={contactForm.telefone}
                disabled
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 border-t border-gray-200">
            <button
              onClick={() => setContactModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveContact}
              disabled={savingContact}
              className="px-4 py-2 rounded-xl text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingContact ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Message Input / Templates */}
    <div className="p-4 border-t">
      {(!isBusiness || isSessionActive) ? (
        <MessageInput
          remoteJid={selectedChat.remoteJid}
          onMessageSent={() => { setReplyToMessage(null); }}
          onTempMessage={addTempMessage}
          onReplaceTempMessage={replaceTempMessage}
          onMessageError={markTempError}
          fileInputRef={fileDropRef}
          replyTo={replyToMessage}
          onClearReply={() => setReplyToMessage(null)}
          isBusiness={isBusiness}
          onTemplateClick={() => setTemplateModalOpen(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-gray-600">
            Sessão inativa. Selecione um template para enviar ao usuário.
          </p>
          <button
            onClick={() => setTemplateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            Selecionar template
          </button>
        </div>
      )}

      {templateModalOpen && (
        <Suspense fallback={null}>
          <TemplateModal
            isOpen={true}
            onClose={() => setTemplateModalOpen(false)}
            token={token}
            remoteJid={selectedChat.remoteJid}
          />
        </Suspense>
      )}
    </div>
    {preview && (
      <Modal
        isOpen={true}
        onClose={() => setPreview(null)}
        title="Pré-visualização"
        maxWidth="3xl"
      >
        <div className="flex flex-col items-center space-y-4">
          {preview.type === "image" ? (
            <img
              src={preview.url}
              alt="Pré-visualização"
              className="max-h-[70vh] w-auto"
            />
          ) : (
            <video
              src={preview.url}
              controls
              className="max-h-[70vh] w-auto"
            />
          )}
          <a
            href={preview.url}
            download
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Download className="w-4 h-4 mr-2" /> Baixar
          </a>
        </div>
      </Modal>
    )}
  </div>
);
}

// Main App Component
export default function ModernChatSystem() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  if (isMobile) {
    return (
      <div className="h-screen bg-gradient-to-br from-emerald-50 to-gray-50">
        {selectedChat ? (
          <MessageView selectedChat={selectedChat} onBack={handleBack} />
        ) : (
          <ChatList
            onChatSelect={handleChatSelect}
            selectedChatId={selectedChat?.id}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-emerald-50 to-gray-50">
      <div className="w-1/3 border-r border-emerald-200">
        <ChatList
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChat?.id}
        />
      </div>
      <div className="flex-1">
        {selectedChat ? (
          <MessageView selectedChat={selectedChat} onBack={handleBack} />
        ) : (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-emerald-400 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <MessageCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bem-vindo ao Chat
              </h2>
              <p className="text-emerald-600">
                Selecione uma conversa para começar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}