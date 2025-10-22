
const BASE_URL = 'https://n8n.lumendigital.com.br/webhook/prospecta/chat';

// Helper para parsear JSON com tratamento de resposta vazia
async function safeJsonParse<T = any>(response: Response, fallback: T = [] as any): Promise<T> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : fallback;
  } catch (err) {
    console.warn('⚠️ Resposta vazia ou inválida:', response.url);
    return fallback;
  }
}

// Cache com persistência opcional em localStorage
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = Infinity; // persist until reload

function storageKey(key: string) {
  return `api_cache_${key}`;
}

export function getCacheKey(name: string, token: string, params?: any): string {
  return `${name}_${token}_${JSON.stringify(params || {})}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp <= CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);

  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(storageKey(key));
      return null;
    }
    cache.set(key, parsed);
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function clearApiCache(keys?: string[]) {
  if (!keys) {
    cache.clear();
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('api_cache_')) localStorage.removeItem(k);
      });
    } catch {}
  } else {
    keys.forEach(key => {
      cache.delete(key);
      try {
        localStorage.removeItem(storageKey(key));
      } catch {}
    });
  }
}

function saveToCache(key: string, data: any, persist: boolean = false) {
  const entry = { data, timestamp: Date.now() };
  cache.set(key, entry);
  if (persist) {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(entry));
    } catch {}
  }
}

type MessagePageMap = Record<string, Message[]>; // "limit:page" -> messages
type MessageCacheRecord = {
  byPage: MessagePageMap;
  expireAt?: number;
  lastUpdated: number;
};

const _msgL1 = new Map<string, MessageCacheRecord>();
const _msgInflight = new Map<string, Promise<Message[]>>();
const FIND_MESSAGES_TTL_MS = 5 * 60 * 1000; // 5 min

function jidDigits(jid: string): string {
  return String(jid || "").replace(/\D/g, "");
}
function ensureDomain(jid: string): string {
  const j = String(jid || "").trim().toLowerCase();
  if (j.includes("@")) return j; // já tem domínio (@s.whatsapp.net, @g.us etc.)
  return `${jidDigits(j)}@s.whatsapp.net`;
}
function messageKey(remoteJid: string): string {
  const key = `message_${jidDigits(remoteJid)}`; // ✅ exigido
  return key;
}
function pageKey(limit: number, page: number) {
  return `${limit}:${page}`;
}

function extractMessagesResponse(data: unknown): Message[] {
  if (Array.isArray(data)) {
    return data as Message[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const obj = data as Record<string, unknown>;
  const directKeys = [
    "messages",
    "mensagens",
    "data",
    "items",
    "result",
    "results",
    "records",
    "payload",
  ] as const;

  for (const key of directKeys) {
    const candidate = (obj as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) {
      return candidate as Message[];
    }
  }

  const nestedValue = obj["data"];
  if (nestedValue && typeof nestedValue === "object") {
    const nestedObj = nestedValue as Record<string, unknown>;
    const nestedKeys = [
      "messages",
      "mensagens",
      "items",
      "records",
      "payload",
    ] as const;
    for (const key of nestedKeys) {
      const candidate = nestedObj[key];
      if (Array.isArray(candidate)) {
        return candidate as Message[];
      }
    }
  }

  return [];
}

function readMsgCacheL2(remoteJid: string): MessageCacheRecord | null {
  const skey = storageKey(messageKey(remoteJid));
  try {
    const raw = localStorage.getItem(skey);
    console.log("[findMessages][L2] read", { skey, found: !!raw });
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MessageCacheRecord;
    if (!parsed || !parsed.byPage) {
      console.log("[findMessages][L2] invalid structure (no byPage)");
      return null;
    }
    if (parsed.expireAt && parsed.expireAt < Date.now()) {
      console.log("[findMessages][L2] expired", {
        expireAt: parsed.expireAt,
        now: Date.now(),
        delta: Date.now() - parsed.expireAt,
      });
      return null;
    }
    return parsed;
  } catch (e) {
    console.log("[findMessages][L2] parse error", e);
    return null;
  }
}
function writeMsgCache(remoteJid: string, record: MessageCacheRecord) {
  const mkey = messageKey(remoteJid);
  const skey = storageKey(mkey);
  _msgL1.set(mkey, record);
  try {
    localStorage.setItem(skey, JSON.stringify(record));
    console.log("[findMessages][WRITE] L1+L2 saved", { mkey, skey, pages: Object.keys(record.byPage) });
  } catch (e) {
    console.log("[findMessages][WRITE] localStorage error", e);
  }
}
function upsertMsgPage(remoteJid: string, lmt: number, pg: number, msgs: Message[]) {
  const mkey = messageKey(remoteJid);
  const pkey = pageKey(lmt, pg);
  const rec = _msgL1.get(mkey) ?? readMsgCacheL2(remoteJid) ?? { byPage: {}, lastUpdated: 0 };
  rec.byPage[pkey] = msgs;
  rec.lastUpdated = Date.now();
  rec.expireAt = Date.now() + FIND_MESSAGES_TTL_MS;
  console.log("[findMessages][UPSERT] page saved", { mkey, pkey, count: msgs.length, expireAt: rec.expireAt });
  writeMsgCache(remoteJid, rec);

  // read-back: confirma que a página está acessível
  const back = readMsgPage(remoteJid, lmt, pg);
  console.log("[findMessages][UPSERT][READBACK]", { ok: !!back, count: back?.length ?? 0 });
}

export function prependMessageToCache(remoteJid: string, message: Message, limit = 50, page = 1) {
  const mkey = messageKey(remoteJid);
  const pkey = pageKey(limit, page);
  const rec = _msgL1.get(mkey) ?? readMsgCacheL2(remoteJid);
  if (!rec) return;
  const existing = rec.byPage[pkey];
  if (!existing) return;

  const updated = [message, ...existing];
  if (updated.length > limit) updated.length = limit;
  rec.byPage[pkey] = updated;
  rec.lastUpdated = Date.now();
  rec.expireAt = Date.now() + FIND_MESSAGES_TTL_MS;
  writeMsgCache(remoteJid, rec);
  console.log("[prependMessageToCache] saved", { mkey, pkey, count: updated.length });
}

function readMsgPage(remoteJid: string, lmt: number, pg: number): Message[] | null {
  const mkey = messageKey(remoteJid);
  const pkey = pageKey(lmt, pg);
  const now = Date.now();

  // L1
  const rec = _msgL1.get(mkey);
  if (rec) {
    const valid = !rec.expireAt || rec.expireAt > now;
    console.log("[findMessages][L1] check", { mkey, valid, pages: rec ? Object.keys(rec.byPage) : [] });
    if (valid) {
      const p = rec.byPage[pkey];
      if (p) {
        console.log("[findMessages][L1] HIT", { mkey, pkey, count: p.length });
        return p;
      } else {
        console.log("[findMessages][L1] MISS page", { mkey, pkey });
      }
    } else {
      console.log("[findMessages][L1] EXPIRED", { mkey, expireAt: rec.expireAt, now });
    }
  } else {
    console.log("[findMessages][L1] MISS record", { mkey });
  }

  // L2
  const rec2 = readMsgCacheL2(remoteJid);
  if (rec2) {
    _msgL1.set(mkey, rec2); // hydrate L1
    const p = rec2.byPage[pkey];
    if (p) {
      console.log("[findMessages][L2] HIT", { mkey, pkey, count: p.length, pages: Object.keys(rec2.byPage) });
      return p;
    }
    console.log("[findMessages][L2] MISS page", { mkey, pkey, pages: Object.keys(rec2.byPage) });
  }

  return null;
}

const STRICT_FORCE = false;

function hasFreshPage(remoteJid: string, limit: number, page: number): boolean {
  const mkey = messageKey(remoteJid);
  const pkey = pageKey(limit, page);
  const now = Date.now();

  const rec = _msgL1.get(mkey);
  if (rec && (!rec.expireAt || rec.expireAt > now) && rec.byPage[pkey]) {
    return true;
  }
  const rec2 = readMsgCacheL2(remoteJid);
  if (rec2 && (!rec2.expireAt || rec2.expireAt > now) && rec2.byPage[pkey]) {
    _msgL1.set(mkey, rec2); // hydrate
    return true;
  }
  return false;
}

export function clearMessageCache(remoteJid: string) {
  const mkey = messageKey(remoteJid);
  _msgL1.delete(mkey);
  try {
    localStorage.removeItem(storageKey(mkey));
  } catch {}
}


export interface Chat {
  id: string;
  remoteJid: string;
  senderLid?: string;
  pushName: string;
  profilePicUrl?: string | null;
  contactId?: number;
  chatFunilId?: number;
  chatStageId?: string;
  lastMessage: {
    messageType: string;
    fromMe: boolean;
    conversation: string | null;
    messageTimestamp: number;
    status?: string;
  };
}

export interface Message {
  id: string;
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };
  pushName?: string;
  messageType: string;
  message: {
    conversation?: string;
    mediaUrl?: string;
  };
  messageTimestamp: number;
  resposta?: {
    idMensagem: string;
    mensagem: string;
  };
  status?: 'pending' | 'sent' | 'error' | 'FAILED' | 'SENT';
}

export interface Contact {
  id: string;
  remoteJid: string;
  pushName: string;
  profilePicUrl: string | null;
  Id?: number;
  estagioId?: string | null;
  funilId?: number | null;
}

export interface SendTextMessage {
  jid: string;
  type: 'text';
  text: string;
  resposta?: {
    idMensagem: string;
    mensagem: string;
  };
}

export interface SendMediaMessage {
  jid: string;
  mediatype: 'image' | 'video' | 'document' | 'audio';
  mimetype: string;
  base64: string;
  fileName?: string;
  resposta?: {
    idMensagem: string;
    mensagem: string;
  };
}

export const apiClient = {
async findChats(
  token: string,
  page: number = 1,
  offset: number = 50,
  forceRefresh: boolean = false
): Promise<Chat[]> {
  const key = getCacheKey('findChats', token, { page, offset });
  const cached = !forceRefresh ? getFromCache<Chat[]>(key) : null;
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/findChats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token,
    },
    body: JSON.stringify({ page, offset }),
  });

  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : `HTTP error! status: ${response.status}`);

  const data = await safeJsonParse(response, []);
  saveToCache(key, data);
  return data;
},

async findMensagensNaoLidas(token: string) {
  const response = await fetch(
    'https://n8n.lumendigital.com.br/webhook/prospecta/chat/findMensagensNaoLidas',
    {
      method: 'GET',
      headers: { token }
    }
  );

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return safeJsonParse(response, []);
},

async visualizarMensagens(token: string, remoteJid: string) {
  const response = await fetch(
    'https://n8n.lumendigital.com.br/webhook/prospecta/chat/visualizarMensagens',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify({ remoteJid })
    }
  );
  
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.ok;
},

async findMessages(
  token: string,
  remoteJid: string,
  limit: number = 50,
  page: number = 1,
  forceRefresh: boolean = false
): Promise<Message[]> {
  const mkey = messageKey(remoteJid);
  const pkey = pageKey(limit, page);

  // NOVO: força só se não existir cache "fresco" OU se STRICT_FORCE = true
  const hasCache = hasFreshPage(remoteJid, limit, page);
  const effectiveForce = STRICT_FORCE ? forceRefresh : (forceRefresh && !hasCache);

  console.log("[findMessages][START]", {
    remoteJid,
    digits: jidDigits(remoteJid),
    mkey,
    pkey,
    forceRefresh,
    hasCache,
    effectiveForce
  });

  // Usa cache se existir (independente de forceRefresh, quando effectiveForce=false)
  if (!effectiveForce) {
    const cached = readMsgPage(remoteJid, limit, page);
    if (cached) {
      console.log("[findMessages][RETURN CACHED]", { mkey, pkey, count: cached.length });
      return cached;
    }
    console.log("[findMessages] cache miss após effectiveForce=false", { mkey, pkey });
  } else {
    console.log("[findMessages] forceRefresh ativado (sem cache fresco ou STRICT_FORCE)", { mkey, pkey });
  }

  // coalescing
  const inflightKey = `${mkey}::${pkey}`;
  const existing = _msgInflight.get(inflightKey);
  if (existing && !effectiveForce) {
    console.log("[findMessages][COALESCE] reuse inflight", { inflightKey });
    return existing;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const body = { remoteJid: ensureDomain(remoteJid), limit, page };
  console.log("[findMessages][FETCH]", { url: `${BASE_URL}/findMessages`, body });

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/findMessages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.log("[findMessages][HTTP !ok]", { status: response.status });
        throw new Error(
          response.status === 401 || response.status === 403
            ? "UNAUTHORIZED"
            : `HTTP error! status: ${response.status}`
        );
      }

      const data: unknown = await safeJsonParse(response, []);
      const messages = extractMessagesResponse(data);
      console.log("[findMessages][FETCH OK]", { count: messages.length });

      upsertMsgPage(remoteJid, limit, page, messages);
      return messages;
    } finally {
      clearTimeout(timeoutId);
      _msgInflight.delete(inflightKey);
      console.log("[findMessages][CLEANUP]", { inflightKey });
    }
  })();

  _msgInflight.set(inflightKey, fetchPromise);
  return fetchPromise;
},


  async findContacts(token: string): Promise<Contact[]> {
    const key = getCacheKey('findContacts', token);
    const cached = getFromCache<Contact[]>(key);
    if (cached) return cached;

    const response = await fetch(`${BASE_URL}/findContacts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
    });

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data, true); // persist contacts
    return data;
  },

  async findContactInterno(token: string) {
    const key = getCacheKey('findContactInterno', token);
    const cached = getFromCache<any[]>(key);
    if (cached) return cached;

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/chat/findContactInterno',
        {
          method: 'GET',
          headers: { token },
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'UNAUTHORIZED'
            : `HTTP error! status: ${response.status}`
        );
      }

      const data = await safeJsonParse(response, []);
      const arr = Array.isArray(data) ? data : [];
      saveToCache(key, arr);
      return arr;
    } catch (err) {
      console.error('Erro ao carregar findContactInterno:', err);
      return [];
    }
  },

  async getContatoByRemoteJid(token: string, remoteJid: string) {
    try {
      const digits = remoteJid.replace(/\D/g, '');
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/contato/getByRemoteJid?remoteJid=${digits}`,
        { headers: { token } }
      );
      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'UNAUTHORIZED'
            : `HTTP error! status: ${response.status}`
        );
      }
      const text = await response.text();
      if (!text) return null;
      const data = JSON.parse(text);
      return Array.isArray(data) ? data[0] || null : data;
    } catch (err) {
      console.error('Erro ao carregar contato:', err);
      return null;
    }
  },

  async updateContato(
    token: string,
    contato: { id: number; nome: string; email: string | null; telefone: string }
  ) {
    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/contato/update',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(contato),
      }
    );

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );
    }
  },

  async findContactsByUsuario(token: string) {
    const key = getCacheKey('findContactsByUsuario', token);
    const cached = getFromCache<any[]>(key);
    if (cached) return cached;

    const response = await fetch(`${BASE_URL}/findContactsByUsuario`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
    });

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data);
    return data;
  },

  async findDealsByContact(token: string, remoteJid: string) {

    const response = await fetch(`${BASE_URL}/findDealsByContact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
      body: JSON.stringify({ remoteJid }),
    });

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const text = await response.text();
    return JSON.parse(text);
  },

  async check(token: string, numero: string) {
    const key = getCacheKey('check', token, { numero });
    const cached = getFromCache<any>(key);
    if (cached) return cached;

    const response = await fetch(`${BASE_URL}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify({ numero }),
    });

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data);
    return data;
  },

  async findTagsByContact(token: string) {
    const key = getCacheKey('findTagsByContact', token);
    const cached = getFromCache<any[]>(key);
    if (cached) return cached;

    const response = await fetch(`${BASE_URL}/findTagsByContact`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', token }
    });

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data);
    return data;
  },

  async findTags(token: string) {
    const key = getCacheKey('findTags', token);
    const cached = getFromCache<any[]>(key);
    if (cached) return cached;

    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', {
      method: 'GET',
      headers: { token }
    });

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data);
    return data;
  },

  async findSessions(token: string) {
    const key = getCacheKey('findSessions', token);
    const cached = getFromCache<any[]>(key);
    if (cached) return cached;

    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sesssoes/get',
      { headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data);
    return data;
  },

  async findInterventions(token: string) {
    const key = getCacheKey('findInterventions', token);
    const cached = getFromCache<any[]>(key);
    if (cached) return cached;

    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/get',
      { headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data);
    return data;
  },

  async findSessionByRemoteJid(token: string, remoteJid: string) {
    const digits = remoteJid.replace(/\D/g, '');
    const key = getCacheKey('findSessionByRemoteJid', token, { remoteJid: digits });
    const cached = getFromCache<any>(key);
    if (cached) return cached;

    const response = await fetch(
      `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sessao/get/id?remoteJid=${digits}`,
      { headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    saveToCache(key, data);
    return data;
  },

  async findInterventionByRemoteJid(token: string, remoteJid: string) {
    const digits = remoteJid.replace(/\D/g, '');
    const key = getCacheKey('findInterventionByRemoteJid', token, { remoteJid: digits });
    const cached = getFromCache<any>(key);
    if (cached) return cached;

    const response = await fetch(
      `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/get/id?remoteJid=${digits}`,
      { headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    saveToCache(key, data);
    return data;
  },

  async findPermanentExclusions(token: string) {
    const key = getCacheKey('findPermanentExclusions', token);
    const cached = getFromCache<any[]>(key);
    if (cached) return cached;

    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/get',
      { headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const data = await safeJsonParse(response, []);
    saveToCache(key, data);
    return data;
  },

  async findPermanentExclusionByRemoteJid(token: string, remoteJid: string) {
    const digits = remoteJid.replace(/\D/g, '');
    const key = getCacheKey('findPermanentExclusionByRemoteJid', token, { remoteJid: digits });
    const cached = getFromCache<any>(key);
    if (cached) return cached;

    const response = await fetch(
      `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/get/id?remoteJid=${digits}`,
      { headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    saveToCache(key, data);
    return data;
  },

  async createIntervention(token: string, remoteJid: string) {
    const digits = remoteJid.replace(/\D/g, '');
    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/create',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ remoteJid: digits }),
      }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );
    clearApiCache([
      getCacheKey('findInterventions', token),
      getCacheKey('findInterventionByRemoteJid', token, { remoteJid: digits }),
    ]);
    try {
      return await safeJsonParse(response, null);
    } catch {
      return null;
    }
  },

  async createPermanentExclusion(token: string, remoteJid: string) {
    const digits = remoteJid.replace(/\D/g, '');
    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/create',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ remoteJid: digits }),
      }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );
    clearApiCache([
      getCacheKey('findPermanentExclusions', token),
      getCacheKey('findPermanentExclusionByRemoteJid', token, { remoteJid: digits }),
    ]);
    try {
      return await safeJsonParse(response, null);
    } catch {
      return null;
    }
  },

  async deleteSession(token: string, remoteJid: string): Promise<void> {
    const digits = remoteJid.replace(/\D/g, '');
    const response = await fetch(
      `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sesssoes/delete/id?remoteJid=${digits}`,
      { method: 'DELETE', headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );
    clearApiCache([
      getCacheKey('findSessions', token),
      getCacheKey('findSessionByRemoteJid', token, { remoteJid: digits }),
    ]);
  },

  async deleteIntervention(token: string, remoteJid: string): Promise<void> {
    const digits = remoteJid.replace(/\D/g, '');
    const response = await fetch(
      `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/delete/id?remoteJid=${digits}`,
      { method: 'DELETE', headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );
    clearApiCache([
      getCacheKey('findInterventions', token),
      getCacheKey('findInterventionByRemoteJid', token, { remoteJid: digits }),
    ]);
  },

  async deletePermanentExclusion(token: string, remoteJid: string): Promise<void> {
    const digits = remoteJid.replace(/\D/g, '');
    const response = await fetch(
      `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/delete/id?remoteJid=${digits}`,
      { method: 'DELETE', headers: { token } }
    );

    if (!response.ok)
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'UNAUTHORIZED'
          : `HTTP error! status: ${response.status}`
      );
    clearApiCache([
      getCacheKey('findPermanentExclusions', token),
      getCacheKey('findPermanentExclusionByRemoteJid', token, { remoteJid: digits }),
    ]);
  },

async sendMessage(token: string, message: SendTextMessage | SendMediaMessage): Promise<Message[]> {
  const response = await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': token,
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : `HTTP error! status: ${response.status}`);

  const data: Message[] = await safeJsonParse(response, []); // retorna array de mensagens
  data.forEach(msg => {
    prependMessageToCache(msg.key.remoteJid, msg);
  });
  return data;
},

  async deleteMessage(token: string, payload: { id: string; remoteJid: string; fromMe: boolean }): Promise<void> {
    const response = await fetch(`${BASE_URL}/deleteMessage`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'token': token,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : `HTTP error! status: ${response.status}`);
  },

  async updateMessage(token: string, payload: {
    number: string;
    key: { remoteJid: string; fromMe: boolean; id: string };
    text: string;
  }): Promise<void> {
    const response = await fetch(`${BASE_URL}/updateMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : `HTTP error! status: ${response.status}`);
  },

  async transcribeAudio(token: string, audioUrl: string): Promise<{ text: string }> {
    const response = await fetch(`${BASE_URL}/transcribeAudio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token,
      },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : `HTTP error! status: ${response.status}`);

    return await safeJsonParse(response, { text: '' });
  },

  async findDeals(token: string, page: number = 1, offset: number = 100): Promise<any[]> {
    const key = getCacheKey('findDeals', token, { page, offset });
    const cached = getFromCache<any[]>(key);
    if (cached) {
      console.log('[findDeals] Retornando do cache:', cached.length, 'negociações');
      return cached;
    }

    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token,
      },
      body: JSON.stringify({ page, offset }),
    });

    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'UNAUTHORIZED' : `HTTP error! status: ${response.status}`);

    const data = await safeJsonParse(response, []);
    console.log('[findDeals] Buscadas', data.length, 'negociações do servidor');
    saveToCache(key, data, true); // persist deals
    return data;
  },
};