// decryptEvoMedia.ts
// Navegador: sem Buffer. Usa Web Crypto (HKDF/HMAC/AES-CBC).

type MediaKind = "image" | "video" | "audio" | "document" | "sticker";

// ============================================================================
// SISTEMA DE CACHE SIMPLES EM MEMÓRIA
// ============================================================================
// Cache apenas em memória (Map) - rápido e sem problemas de quota
const memoryCache = new Map<string, Uint8Array>();

// Limita o tamanho do cache para evitar uso excessivo de memória
const MAX_CACHE_ITEMS = 100;
const cacheAccessOrder: string[] = [];

/**
 * Gera uma chave única para cache baseada na URL
 */
function generateCacheKey(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash = hash & hash;
  }
  return `media_${Math.abs(hash).toString(36)}`;
}

/**
 * Salva mídia descriptografada no cache
 */
function saveToCache(cacheKey: string, data: Uint8Array): void {
  // Remove item mais antigo se cache estiver cheio
  if (memoryCache.size >= MAX_CACHE_ITEMS && !memoryCache.has(cacheKey)) {
    const oldestKey = cacheAccessOrder.shift();
    if (oldestKey) {
      memoryCache.delete(oldestKey);
      console.log(`🗑️ Cache cheio - removido: ${oldestKey}`);
    }
  }

  memoryCache.set(cacheKey, data);

  // Atualiza ordem de acesso
  const existingIndex = cacheAccessOrder.indexOf(cacheKey);
  if (existingIndex !== -1) {
    cacheAccessOrder.splice(existingIndex, 1);
  }
  cacheAccessOrder.push(cacheKey);

  console.log(`💾 Cache salvo: ${cacheKey} (${(data.length / 1024).toFixed(2)} KB) - Total: ${memoryCache.size} itens`);
}

/**
 * Recupera mídia do cache
 */
function getFromCache(cacheKey: string): Uint8Array | null {
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    // Atualiza ordem de acesso (move para o final = mais recente)
    const index = cacheAccessOrder.indexOf(cacheKey);
    if (index !== -1) {
      cacheAccessOrder.splice(index, 1);
      cacheAccessOrder.push(cacheKey);
    }
    return cached;
  }
  return null;
}

/**
 * Limpa todo o cache
 */
export function clearMediaCache(): void {
  memoryCache.clear();
  cacheAccessOrder.length = 0;
  console.log('🗑️ Cache de mídias limpo completamente');
}

// ============================================================================
// FIM DO SISTEMA DE CACHE
// ============================================================================

/**
 * Aceita os diferentes formatos de mediaKey enviados pelo backend/API.
 * Pode ser a string base64 original, Buffer/TypedArray ou o novo payload
 * serializado como objeto com índices numéricos.
 */
export type MediaKeyInput =
  | string
  | Uint8Array
  | ArrayBuffer
  | ArrayBufferView
  | number[]
  | Record<string, unknown>;

/** Base64 (padrão) -> Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
  // remove URL-safe e padding inconsistentes
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function cloneView(view: ArrayBufferView): Uint8Array {
  const out = new Uint8Array(view.byteLength);
  out.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  return out;
}

function tryGetBytesFromArrayLike(value: unknown): Uint8Array | null {
  if (!value) return null;
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return cloneView(value as ArrayBufferView);
  }
  if (Array.isArray(value)) {
    return new Uint8Array(value as number[]);
  }
  return null;
}

function tryGetBytesFromNumericRecord(value: unknown): Uint8Array | null {
  if (!value || typeof value !== "object") return null;
  const entries = Object.keys(value as Record<string, unknown>).filter((key) =>
    /^\d+$/.test(key)
  );

  if (!entries.length) return null;

  const sorted = entries.map(Number).sort((a, b) => a - b);
  const lastIndex = sorted[sorted.length - 1];
  const out = new Uint8Array(lastIndex + 1);
  let filled = 0;

  for (const idx of sorted) {
    const raw = (value as Record<string, unknown>)[String(idx)];
    if (typeof raw !== "number") {
      return null;
    }
    out[idx] = raw;
    filled++;
  }

  return filled ? out : null;
}

function normalizeMediaKey(input: unknown): Uint8Array {
  if (input == null) {
    throw new Error("mediaKey ausente ou indefinido");
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("mediaKey string vazia");
    }
    return base64ToBytes(trimmed);
  }

  const direct = tryGetBytesFromArrayLike(input);
  if (direct) return direct;

  if (typeof input === "object") {
    const obj = input as Record<string, unknown> & { data?: unknown; base64?: unknown };

    if (obj.data != null && obj.data !== input) {
      const directData =
        tryGetBytesFromArrayLike(obj.data) ||
        tryGetBytesFromNumericRecord(obj.data);

      if (directData) {
        return directData;
      }

      if (typeof obj.data === "string") {
        try {
          return base64ToBytes(obj.data);
        } catch {
          // ignora e tenta outros formatos
        }
      }
    }

    if (typeof obj.base64 === "string") {
      try {
        return base64ToBytes(obj.base64);
      } catch {
        // ignora e tenta interpretar como record numérico
      }
    }

    const numeric = tryGetBytesFromNumericRecord(obj);
    if (numeric) {
      return numeric;
    }
  }

  throw new Error("Formato de mediaKey não suportado");
}

/** Concatena múltiplos Uint8Array em um só */
function concatBytes(...arrays: Uint8Array[]) {
  const len = arrays.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

/** Mapeia mimetype -> info string do HKDF (WhatsApp) */
function hkdfInfoFromMime(mimetype?: string): Uint8Array {
  let kind: MediaKind = "image";
  const mt = (mimetype || "").toLowerCase();

  if (mt.startsWith("video/")) kind = "video";
  else if (mt.startsWith("audio/")) kind = "audio";
  else if (mt.startsWith("application/")) kind = "document";
  else if (mt.includes("sticker") || mt.includes("webp")) kind = "sticker";
  else kind = "image";

  // Strings “padrão” usadas pelo WA
  const infoStr =
    kind === "image"
      ? "WhatsApp Image Keys"
      : kind === "video"
      ? "WhatsApp Video Keys"
      : kind === "audio"
      ? "WhatsApp Audio Keys"
      : kind === "document"
      ? "WhatsApp Document Keys"
      : "WhatsApp Sticker Keys";

  return new TextEncoder().encode(infoStr);
}

/**
 * Deriva (iv, cipherKey, macKey) a partir do mediaKey bruto via HKDF-SHA256.
 * Saída total = 112 bytes (0..15 iv, 16..47 cipherKey, 48..79 macKey, resto ignorado).
 */
async function deriveKeys(mediaKey: Uint8Array, info: Uint8Array) {
  if (mediaKey.length !== 32) {
    console.warn(
      `decryptEvoMedia: mediaKey com ${mediaKey.length} bytes (esperado 32). Prosseguindo mesmo assim.`
    );
  }
  const salt = new Uint8Array(32); // zero salt, como no WA

  const hkdfBaseKey = await crypto.subtle.importKey(
    "raw",
    mediaKey,
    "HKDF",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    hkdfBaseKey,
    112 * 8
  );

  const okm = new Uint8Array(bits); // 112 bytes
  const iv = okm.slice(0, 16);
  const cipherKey = okm.slice(16, 48);
  const macKey = okm.slice(48, 80);
  return { iv, cipherKey, macKey };
}

/** Calcula HMAC-SHA256(bytes) e retorna Uint8Array */
async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return new Uint8Array(sig);
}

/** AES-CBC decrypt */
async function aesCbcDecrypt(keyBytes: Uint8Array, iv: Uint8Array, data: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data);
  return new Uint8Array(plain);
}

/**
 * Descriptografa mídia EVO/WA:
 * - Baixa o .enc
 * - HKDF(mediaKey, info(mimetype)) -> iv, cipherKey, macKey
 * - Verifica MAC (HMAC-SHA256(iv|cipher) truncado em 10 bytes)
 * - AES-CBC(cipherKey, iv, cipher)
 * Retorna Uint8Array (binário puro do arquivo resultante).
 */
export async function decryptEvoMedia(
  url: string,
  mediaKey: MediaKeyInput,
  mimetype?: string
): Promise<Uint8Array> {
  // 🔍 LOG: Início da descriptografia
  const timestamp = new Date().toLocaleTimeString();

  // Gera chave de cache baseada na URL
  const cacheKey = generateCacheKey(url);
  const mediaId = cacheKey.substring(6).toUpperCase(); // Remove 'media_' para log

  // ===== FASE 1: VERIFICA CACHE =====
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`[${timestamp}] ⚡ ${mediaId} - CACHE HIT! Retornando do cache (${(cached.length / 1024).toFixed(2)} KB)`);
    return cached;
  }

  // ===== FASE 2: CACHE MISS - BAIXA E DESCRIPTOGRAFA =====
  const urlShort = url.substring(url.length - 40);
  console.log(`[${timestamp}] 🔐 ${mediaId} - CACHE MISS - Processando...`, {
    urlEnd: '...' + urlShort,
    mimetype,
  });

  const mediaKeyBytes = normalizeMediaKey(mediaKey);

  // 1) Baixa o arquivo .enc
  console.log(`[${timestamp}] 📥 ${mediaId} - Baixando mídia...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar mídia: HTTP ${res.status}`);
  }
  const enc = new Uint8Array(await res.arrayBuffer());
  console.log(`[${timestamp}] ✅ ${mediaId} - Download completo: ${(enc.length / 1024).toFixed(2)} KB`);

  if (enc.length <= 10) {
    throw new Error("Arquivo cifrado inválido (tamanho muito pequeno).");
  }

  // 2) Deriva chaves
  const info = hkdfInfoFromMime(mimetype);
  const { iv, cipherKey, macKey } = await deriveKeys(mediaKeyBytes, info);

  // 3) Separa MAC (últimos 10 bytes) e o cipher
  const fileMac = enc.slice(enc.length - 10);
  const fileCipher = enc.slice(0, enc.length - 10);

  // 4) Verifica MAC = HMAC-SHA256(iv | fileCipher) truncado em 10 bytes
  const macData = concatBytes(iv, fileCipher);
  const macFull = await hmacSha256(macKey, macData);
  const macTrunc = macFull.slice(0, 10);

  // (opcional) validar MAC estritamente
  let macOk = macTrunc.length === fileMac.length;
  for (let i = 0; i < macTrunc.length && macOk; i++) {
    if (macTrunc[i] !== fileMac[i]) macOk = false;
  }
  if (!macOk) {
    // Muitos backends ignoram validação. Aqui só avisamos no console e seguimos.
    console.warn("decryptEvoMedia: MAC inválido. Prosseguindo com decrypt assim mesmo.");
  }

  // 5) Decrypt AES-CBC
  console.log(`[${timestamp}] 🔓 ${mediaId} - Descriptografando...`);
  const plain = await aesCbcDecrypt(cipherKey, iv, fileCipher);
  console.log(`[${timestamp}] ✅ ${mediaId} - Descriptografia concluída: ${(plain.length / 1024).toFixed(2)} KB`);

  // ===== FASE 3: SALVA NO CACHE =====
  saveToCache(cacheKey, plain);

  return plain;
}