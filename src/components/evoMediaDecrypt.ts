// src/utils/evoMediaDecrypt.ts
// Descriptografia de mídias do WhatsApp (API não-oficial/EVO)
// Requer: URL do arquivo .enc, mediaKey (base64), mimetype (para mapear tipo)
// Saída: Blob/ArrayBuffer com o conteúdo descriptografado, pronto para criar um ObjectURL/Data URL.
//
// IMPORTANTE (CORS):
// - O download direto de https://mmg.whatsapp.net provavelmente falhará em browser por CORS.
// - Em produção, faça o download via seu backend/proxy (ex.: n8n) e passe o ArrayBuffer para esta função.
// - Este módulo inclui duas rotas: (A) descriptografar a partir de um ArrayBuffer já baixado; (B) tentar baixar e descriptografar (pode falhar por CORS).

type EvoImagePart = {
  url: string;            // ... .enc
  mediaKey: string;       // base64 (32 bytes)
  mimetype?: string;      // ex: "image/jpeg", "video/mp4", "audio/ogg; codecs=opus", "application/pdf", etc.
  fileEncSha256?: string; // base64 (opcional); só usado para conferência
};

export type DecryptedMedia = {
  bytes: Uint8Array;
  blob: Blob;
  dataUrl: string; // "data:<mime>;base64,...."
  mimeType: string;
  verifiedMac: boolean; // true se HMAC de 10 bytes conferiu
};

// -------------------- Utils básicos --------------------

function b64ToBytes(b64: string): Uint8Array {
  // Compatível com base64 padrão do WhatsApp (pode vir com '=' padding)
  const binStr = atob(b64);
  const out = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) out[i] = binStr.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function utf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// -------------------- Mapeamento do tipo (HKDF "info") --------------------
//
// WhatsApp usa "info" diferente por tipo de mídia na derivação das chaves.
// Padrões conhecidos:
const INFO_BY_KIND: Record<string, string> = {
  image: "WhatsApp Image Keys",
  video: "WhatsApp Video Keys",
  audio: "WhatsApp Audio Keys",
  document: "WhatsApp Document Keys",
  sticker: "WhatsApp Image Keys", // stickers seguem "Image"
};

// Deduz "kind" a partir do mimetype
function kindFromMime(mime?: string): keyof typeof INFO_BY_KIND {
  if (!mime) return "image";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  // stickers normalmente não trazem mimetype "image/webp" (pode cair em "image"), ajuste se souber o caso
  return "document";
}

// -------------------- HKDF: gera 112 bytes (IV 16 | cipherKey 32 | macKey 32 | refKey 32) --------------------

async function hkdfExpand(mediaKeyRaw: Uint8Array, infoStr: string): Promise<Uint8Array> {
  // salt: 32 bytes zero (padrão WA)
  const salt = new Uint8Array(32);
  // Derivação usando Web Crypto API (HKDF + SHA-256)
  const baseKey = await crypto.subtle.importKey(
    "raw",
    mediaKeyRaw,
    "HKDF",
    false,
    ["deriveBits", "deriveKey"]
  );

  const info = utf8(infoStr);
  // Precisamos de 112 bytes (896 bits)
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt,
      info,
    },
    baseKey,
    112 * 8
  );
  return new Uint8Array(bits);
}

function splitKeys(expanded: Uint8Array) {
  // 112 bytes: 0..15 = IV; 16..47 = cipherKey(32); 48..79 = macKey(32); 80..111 = refKey(32)
  const iv = expanded.slice(0, 16);
  const cipherKey = expanded.slice(16, 48);
  const macKey = expanded.slice(48, 80);
  const refKey = expanded.slice(80, 112);
  return { iv, cipherKey, macKey, refKey };
}

// -------------------- HMAC (SHA-256) e AES-CBC --------------------

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return new Uint8Array(sig);
}

async function aesCbcDecrypt(cipherKey: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", cipherKey, { name: "AES-CBC" }, false, ["decrypt"]);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, ciphertext);
  return new Uint8Array(plainBuf);
}

// -------------------- Core: descriptografar buffer --------------------

/**
 * Descriptografa um ArrayBuffer de mídia .enc do WhatsApp (EVO).
 * @param encryptedBytes Bytes do arquivo .enc (inclui HMAC de 10 bytes no final).
 * @param mediaKeyB64    Chave (base64) vinda do payload (32 bytes).
 * @param mimeType       Mimetype (para mapear HKDF info).
 * @param fileEncSha256B64 Opcional: hash enc (base64) para conferência (não bloqueia).
 */
export async function decryptEvoEncryptedBytes(
  encryptedBytes: ArrayBuffer,
  mediaKeyB64: string,
  mimeType?: string,
  fileEncSha256B64?: string
): Promise<DecryptedMedia> {
  const enc = new Uint8Array(encryptedBytes);

  if (enc.length <= 10) {
    throw new Error("Arquivo .enc muito pequeno");
  }

  // Encrypted payload = data || mac(10 bytes finais)
  const macFromFile = enc.slice(enc.length - 10);
  const data = enc.slice(0, enc.length - 10);

  // (Opcional) conferência do SHA-256 do arquivo enc:
  if (fileEncSha256B64) {
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc));
    const b64 = bytesToB64(digest);
    if (b64 !== fileEncSha256B64) {
      // Apenas loga; há implementações que divergem por padding base64
      console.warn("fileEncSha256 não confere (prosseguindo mesmo assim).");
    }
  }

  // HKDF
  const kind = kindFromMime(mimeType);
  const info = INFO_BY_KIND[kind];
  const mediaKey = b64ToBytes(mediaKeyB64);
  const expanded = await hkdfExpand(mediaKey, info);
  const { iv, cipherKey, macKey } = splitKeys(expanded);

  // Verificação do MAC: HMAC-SHA256(iv || data) → pega 10 primeiros bytes
  const macCalcFull = await hmacSha256(macKey, concatBytes(iv, data));
  const macCalc10 = macCalcFull.slice(0, 10);
  const verifiedMac = macCalc10.every((v, i) => v === macFromFile[i]);

  if (!verifiedMac) {
    console.warn("MAC (10 bytes) NÃO confere — tentativa de decriptação mesmo assim.");
  }

  // AES-CBC decrypt
  const plain = await aesCbcDecrypt(cipherKey, iv, data);

  // Monta retorno
  const mime = mimeType || "application/octet-stream";
  const blob = new Blob([plain], { type: mime });
  const dataUrl = `data:${mime};base64,${bytesToB64(plain)}`;

  return {
    bytes: plain,
    blob,
    dataUrl,
    mimeType: mime,
    verifiedMac,
  };
}

// -------------------- Conveniência: tenta baixar e descriptografar --------------------
//
// ATENÇÃO: pode falhar no browser por CORS. Ideal é baixar no backend e chamar decryptEvoEncryptedBytes.
export async function fetchAndDecryptEvoMedia(part: EvoImagePart): Promise<DecryptedMedia> {
  // Tenta baixar como ArrayBuffer
  const resp = await fetch(part.url, {
    method: "GET",
    // credentials: 'omit',
    // mode: 'cors', // pode ser bloqueado por CORS do mmg.whatsapp.net
  });

  if (!resp.ok) {
    throw new Error(`Falha ao baixar mídia .enc: HTTP ${resp.status}`);
  }

  const buf = await resp.arrayBuffer();
  return decryptEvoEncryptedBytes(buf, part.mediaKey, part.mimetype, part.fileEncSha256);
}

// -------------------- Pequeno helper para mapear a partir do objeto message.* --------------------
//
// Exemplo de uso:
//   const part = message.imageMessage || message.videoMessage || ...
//   const out = await decryptEvoFromMessagePart(part);
//
export async function decryptEvoFromMessagePart(msgPart: any): Promise<DecryptedMedia> {
  if (!msgPart?.url || !msgPart?.mediaKey) {
    throw new Error("Part inválida: url/mediaKey ausentes");
  }
  return fetchAndDecryptEvoMedia({
    url: msgPart.url,
    mediaKey: msgPart.mediaKey,
    mimetype: msgPart.mimetype,
    fileEncSha256: msgPart.fileEncSha256,
  });
}