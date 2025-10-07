// components/OfficialMedia.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, FileText, DownloadCloud, Play, Image as ImageIcon, Music2 } from "lucide-react";

// Tipos mínimos esperados
type WAMessage = {
  id: string;
  messageType: string;
  message: any;
  // campos úteis que já vêm no seu findMessages:
  instanceId?: string;
};

type UseOfficialMediaOpts = {
  token: string | null;
  message: WAMessage;
  // Opcional: force no-cache quando precisar refazer download
  bustCacheKey?: string | number;
  // como chamar seu backend
  fetchMedia: (args: {
    token: string;
    instanceId?: string;
    mediaId: string;
  }) => Promise<ArrayBuffer>;
};

type MediaDescriptor =
  | {
      kind: "image" | "video" | "audio" | "document" | "sticker";
      id?: string;             // id do WA Cloud
      sha256?: string;
      mime?: string;
      size?: number;
      url?: string;            // às vezes o WhatsApp já traz uma URL lookaside com tempo
      fileName?: string;       // documents
    }
  | null;

// --- cache (in-memory) de blobURLs por mediaId/sha256
const blobCache = new Map<string, { url: string; ts: number }>();
const BLOB_TTL_MS = 15 * 60 * 1000; // 15 min

function pickDescriptor(msg: WAMessage): MediaDescriptor {
  const m = msg.message || {};
  // image
  if (m.imageMessage?.url || m.imageMessage?.id) {
    const im = m.imageMessage;
    return {
      kind: "image",
      id: im.id,
      url: im.url,
      sha256: im.sha256,
      mime: im.mime_type,
      size: im.file_size,
    };
  }
  // video
  if (m.videoMessage?.url || m.videoMessage?.id) {
    const vm = m.videoMessage;
    return {
      kind: "video",
      id: vm.id,
      url: vm.url,
      sha256: vm.sha256,
      mime: vm.mime_type,
      size: vm.file_size,
    };
  }
  // audio
  if (m.audioMessage?.url || m.audioMessage?.id) {
    const am = m.audioMessage;
    return {
      kind: "audio",
      id: am.id,
      url: am.url,
      sha256: am.sha256,
      mime: am.mime_type,
      size: am.file_size,
    };
  }
  // sticker (normalmente webp)
  if (m.stickerMessage?.url || m.stickerMessage?.id) {
    const sm = m.stickerMessage;
    return {
      kind: "sticker",
      id: sm.id,
      url: sm.url,
      sha256: sm.sha256,
      mime: sm.mime_type || "image/webp",
      size: sm.file_size,
    };
  }
  // document
  if (m.documentMessage?.url || m.documentMessage?.id) {
    const dm = m.documentMessage;
    return {
      kind: "document",
      id: dm.id,
      url: dm.url,
      sha256: dm.sha256,
      mime: dm.mime_type,
      size: dm.file_size,
      fileName: dm.fileName || dm.file_name,
    };
  }

  return null;
}

function cacheKeyFor(desc: MediaDescriptor): string | null {
  if (!desc) return null;
  return desc.sha256 || desc.id || null;
}

function purgeOld() {
  const now = Date.now();
  for (const [k, v] of blobCache.entries()) {
    if (now - v.ts > BLOB_TTL_MS) {
      URL.revokeObjectURL(v.url);
      blobCache.delete(k);
    }
  }
}

export function useOfficialMedia({
  token,
  message,
  bustCacheKey,
  fetchMedia,
}: UseOfficialMediaOpts) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | undefined>(undefined);
  const [mime, setMime] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const desc = useMemo(() => pickDescriptor(message), [message]);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    purgeOld();
  }, []);

  useEffect(() => {
    // limpeza do objectURL anterior
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [message?.id]);

  useEffect(() => {
    let cancelled = false;

    async function resolveMedia() {
      setErr(null);
      setLoading(true);
      setBlobUrl(null);
      setFilename(undefined);
      setMime(undefined);

      try {
        if (!desc) {
          setLoading(false);
          return;
        }
        const key = cacheKeyFor(desc);
        if (key && blobCache.has(key) && !bustCacheKey) {
          const cached = blobCache.get(key)!;
          setBlobUrl(cached.url);
          setMime(desc.mime);
          setLoading(false);
          return;
        }

        // 1) Se a URL lookaside está presente, tentamos baixar e converter para Blob (CORS permissivo na maioria dos casos).
        if (desc.url) {
          const r = await fetch(desc.url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const buff = await r.arrayBuffer();
          const blob = new Blob([buff], { type: desc.mime || "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          if (cancelled) return;
          objectUrlRef.current = url;
          if (key) blobCache.set(key, { url, ts: Date.now() });
          setBlobUrl(url);
          setMime(desc.mime);
          setLoading(false);
          return;
        }

        // 2) Se só temos o mediaId, pedimos ao BACKEND (proxy) baixar no Meta e nos devolver binário
        if (!token) throw new Error("Token ausente");
        if (!desc.id) throw new Error("Media sem id/url");

        const arr = await fetchMedia({
          token,
          instanceId: (message as any).instanceId,
          mediaId: desc.id,
        });

        const blob = new Blob([arr], { type: desc.mime || "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        if (cancelled) return;
        objectUrlRef.current = url;
        if (key) blobCache.set(key, { url, ts: Date.now() });
        setBlobUrl(url);
        setMime(desc.mime);
        if ((message.message?.documentMessage?.fileName || message.message?.documentMessage?.file_name)) {
          setFilename(message.message.documentMessage.fileName || message.message.documentMessage.file_name);
        }
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || "Falha ao carregar mídia");
        setLoading(false);
      }
    }

    resolveMedia();
    return () => {
      cancelled = true;
    };
  }, [token, desc, bustCacheKey, fetchMedia, message?.id]);

  return {
    descriptor: desc,
    url: blobUrl,
    mime,
    filename,
    loading,
    error: err,
  };
}

// =======================
// UI de alto nível
// =======================

type MediaRendererProps = {
  token: string | null;
  message: WAMessage;
  fetchMedia: UseOfficialMediaOpts["fetchMedia"];
  compact?: boolean;
};

export function OfficialMediaRenderer({ token, message, fetchMedia, compact }: MediaRendererProps) {
  const { descriptor, url, mime, filename, loading, error } = useOfficialMedia({
    token,
    message,
    fetchMedia,
  });

  if (!descriptor) return null;

  // Loading / erro
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Carregando mídia…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-xs text-red-600 flex items-center gap-2">
        <DownloadCloud className="w-4 h-4" />
        <span>Falha ao carregar mídia</span>
      </div>
    );
  }
  if (!url) return null;

  // Render por tipo
  switch (descriptor.kind) {
    case "image":
    case "sticker":
      return (
        <div className="space-y-1">
          <img
            src={url}
            alt="Imagem"
            className={`${compact ? "max-w-[220px]" : "max-w-xs"} rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          />
          {mime && <div className="text-[10px] text-gray-400">{mime}</div>}
        </div>
      );

    case "video":
      return (
        <div className="space-y-1">
          <video
            src={url}
            controls
            className={`${compact ? "max-w-[220px]" : "max-w-xs"} rounded-lg`}
          />
          {mime && <div className="text-[10px] text-gray-400">{mime}</div>}
        </div>
      );

    case "audio":
      return (
        <div className="space-y-2">
          {/* player nativo — se quiser, mantenha seu AudioPlayer e passe `url` */}
          <audio controls src={url} className="w-64" />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Music2 className="w-4 h-4" />
            <span>{mime || "audio"}</span>
          </div>
        </div>
      );

    case "document":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">
              {filename || "Documento"}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>

          <a
            href={url}
            download={filename || "arquivo"}
            className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            Baixar arquivo
          </a>

          {mime && <div className="text-[10px] text-gray-400">{mime}</div>}
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ImageIcon className="w-4 h-4" />
          <span>Mídia não suportada</span>
        </div>
      );
  }
}
