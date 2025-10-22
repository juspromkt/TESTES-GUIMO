import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  Bot,
  Pause,
  BanIcon,
  Users,
  Filter,
  Tag as TagIcon,
  ExternalLink,
  Loader2,
  X,
  PlayCircle,
  Check,
  Image as ImageIcon,
  Video,
  FileText,
  Cloud,
  Info,
  Download,
} from "lucide-react";
import type { Chat } from "./utils/api";
import { apiClient, clearApiCache, getCacheKey } from "./utils/api";
import type { Tag } from "../../types/tag";
import DealSummaryWidget from "../crm/DealSummaryWidget";
import { useChat } from "../../context/ChatContext";
import { toast } from "sonner";
import { decryptEvoMedia, type MediaKeyInput } from "../decryptEvoMedia";

interface ContactSidebarV2Props {
  isOpen: boolean;
  onToggle: () => void;
  selectedChat: Chat | null;
  onOpenContactModal?: () => void;
  whatsappType?: string;
}

interface ContactData {
  Id: number;
  nome: string;
  telefone: string;
  Email: string | null;
}

interface DealData {
  Id: number;
  id_contato: number;
  id_funil: number;
  id_estagio: number;
  id_usuario: number | null;
  nome_etapa?: string;
}

interface User {
  Id: number;
  nome: string;
  email: string;
}

interface Funil {
  id: number;
  nome: string;
  estagios?: Array<{
    Id: string;
    nome: string;
    ordem: number;
  }>;
}

// 🔧 Helpers reutilizáveis
const normalize = (data: any) => {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    // Retorna null se objeto vazio ou só tem propriedades vazias
    if (keys.length === 0) return null;
    // Verifica se tem alguma propriedade com valor
    const hasValue = keys.some(key => data[key] != null && data[key] !== '');
    return hasValue ? data : null;
  }
  return null;
};

const triggerGlobalRefresh = () => {
  window.dispatchEvent(new Event("sessions_updated"));
  window.dispatchEvent(new Event("contactUpdated"));
};

// Componente simples para preview de imagens
function MediaPreview({
  mediaData,
  type,
  isBusiness,
  onPreview,
  index
}: {
  mediaData: any;
  type: 'image' | 'video';
  isBusiness: boolean;
  onPreview?: (url: string, type: 'image' | 'video', index: number) => void;
  index: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMedia = async () => {
      try {
        setLoading(true);
        console.log('[MediaPreview] Carregando mídia:', { mediaData, type, isBusiness });

        // Para Evolution API (não business)
        if (!isBusiness && mediaData.data?.url) {
          const mediaUrl = mediaData.data.url;
          console.log('[MediaPreview] URL Evolution encontrada:', mediaUrl);

          // Se for URL do WhatsApp CDN e tiver mediaKey, precisa descriptografar
          if (/whatsapp\.net/.test(mediaUrl) && mediaData.data.mediaKey && mediaData.data.mimetype) {
            console.log('[MediaPreview] Descriptografando mídia Evolution...');
            try {
              const buffer = await decryptEvoMedia(
                mediaUrl,
                mediaData.data.mediaKey,
                mediaData.data.mimetype
              );
              const blob = new Blob([buffer], { type: mediaData.data.mimetype || "application/octet-stream" });
              const dataUrl = URL.createObjectURL(blob);

              if (mounted) {
                setUrl(dataUrl);
                setLoading(false);
              }
            } catch (error) {
              console.error('[MediaPreview] Erro ao descriptografar:', error);
              if (mounted) {
                setLoading(false);
              }
            }
          } else {
            // URL direta (já processada)
            if (mounted) {
              setUrl(mediaUrl);
              setLoading(false);
            }
          }
        }
        // Para WhatsApp Business API
        else if (isBusiness && mediaData.data?.id && mediaData.data?.sha256) {
          console.log('[MediaPreview] Carregando mídia Business:', { id: mediaData.data.id, sha256: mediaData.data.sha256 });
          // Buscar URL da mídia oficial
          const user = localStorage.getItem("user");
          const token = user ? JSON.parse(user).token : null;

          if (token) {
            const response = await fetch(
              `https://n8n.lumendigital.com.br/webhook/prospecta/mensagens/oficial/media?id=${mediaData.data.id}&sha256=${mediaData.data.sha256}`,
              { headers: { token } }
            );

            if (response.ok && mounted) {
              const blob = await response.blob();
              const objUrl = URL.createObjectURL(blob);
              setUrl(objUrl);
              setLoading(false);
            } else if (mounted) {
              setLoading(false);
            }
          }
        } else {
          console.warn('[MediaPreview] Nenhuma condição atendida. Dados:', {
            isBusiness,
            hasUrl: !!mediaData.data?.url,
            hasId: !!mediaData.data?.id,
            hasSha256: !!mediaData.data?.sha256,
            mediaData
          });
          if (mounted) setLoading(false);
        }
      } catch (error) {
        console.error("[MediaPreview] Erro ao carregar mídia:", error);
        if (mounted) setLoading(false);
      }
    };

    loadMedia();

    return () => {
      mounted = false;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [mediaData.id, isBusiness]);

  if (loading) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        {type === 'image' ? (
          <ImageIcon className="w-8 h-8 text-gray-400" />
        ) : (
          <Video className="w-8 h-8 text-gray-400" />
        )}
      </div>
    );
  }

  const handleClick = () => {
    if (onPreview && url) {
      onPreview(url, type, index);
    }
  };

  if (type === 'image') {
    return (
      <div
        className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
        onClick={handleClick}
      >
        <img
          src={url}
          alt="Preview"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
            <ExternalLink className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div
        className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
        onClick={handleClick}
      >
        <video
          src={url}
          className="w-full h-full object-cover"
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 rounded-full p-2">
            <PlayCircle className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-3">
            <ExternalLink className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function ContactSidebarV2({
  isOpen,
  onToggle,
  selectedChat,
  onOpenContactModal,
  whatsappType = 'EVOLUTION',
}: ContactSidebarV2Props) {
  const { updateChatLocal, availableTags, users, funnels } = useChat();
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [dealData, setDealData] = useState<DealData | null>(null);
  const [dealTags, setDealTags] = useState<Tag[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [aiStatus, setAiStatus] = useState<{
    intervention: boolean;
    permanentExclusion: boolean;
  }>({ intervention: false, permanentExclusion: false });
  const [isTransferChat, setIsTransferChat] = useState(false);
  const [updatingAI, setUpdatingAI] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Estados para cooldown de ativação da IA
  const [activationCooldown, setActivationCooldown] = useState(false);
  const [showActivationMessage, setShowActivationMessage] = useState(false);

  // Estados para modal de criar negociação
  const [showCreateDealModal, setShowCreateDealModal] = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);
  const [modalAlreadyShown, setModalAlreadyShown] = useState(false);

  // Estados para informações de sessão
  const [sessionInfo, setSessionInfo] = useState<any | null>(null);
  const [interventionInfo, setInterventionInfo] = useState<any | null>(null);

  // Estados para a aba de mídias
  const [activeView, setActiveView] = useState<'info' | 'media'>('info');
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'videos' | 'docs' | 'cloud'>('images');
  const [mediaFiles, setMediaFiles] = useState<{
    images: any[];
    videos: any[];
    docs: any[];
  }>({ images: [], videos: [], docs: [] });
  const [loadingMedia, setLoadingMedia] = useState(false);


  // Estados para modal de preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');
  const [previewIndex, setPreviewIndex] = useState(0);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;
  const selectedChatDigits = selectedChat?.remoteJid.replace(/\D/g, "");
  const isBusiness = whatsappType === 'WHATSAPP-BUSINESS';


  const openPreview = (url: string, type: 'image' | 'video', index: number) => {
    setPreviewUrl(url);
    setPreviewType(type);
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
  };

  // Listener para teclas de navegação
  useEffect(() => {
    if (!previewOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePreview('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigatePreview('next');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewOpen, previewIndex, previewType, mediaFiles]);

  const handleDownloadCurrent = () => {
    if (!previewUrl) return;
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const extension = previewType === 'image' ? 'jpg' : 'mp4';
    const clientName = contactData?.nome || selectedChat?.pushName || 'Cliente';
    const mediaTypeName = previewType === 'image' ? 'Imagem' : 'Video';
    const filename = `Guimoo ${mediaTypeName} - ${clientName} ${timestamp}.${extension}`;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download iniciado!');
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    const currentMedia = previewType === 'image' ? mediaFiles.images : mediaFiles.videos;
    if (currentMedia.length === 0) return;

    let newIndex = direction === 'next' ? previewIndex + 1 : previewIndex - 1;

    // Não permite ultrapassar os limites
    if (newIndex >= currentMedia.length || newIndex < 0) return;

    setPreviewIndex(newIndex);

    // Load the new media URL
    const newMedia = currentMedia[newIndex];
    loadMediaUrl(newMedia, previewType).then(url => {
      if (url) setPreviewUrl(url);
    });
  };

  const loadMediaUrl = async (mediaData: any, type: 'image' | 'video'): Promise<string | null> => {
    try {
      const mediaUrl = mediaData.data.url || mediaData.data.mediaUrl;

      if (/whatsapp\.net/.test(mediaUrl) && mediaData.data.mediaKey && mediaData.data.mimetype) {
        const buffer = await decryptEvoMedia(mediaUrl, mediaData.data.mediaKey, mediaData.data.mimetype);
        const blob = new Blob([buffer], { type: mediaData.data.mimetype });
        return URL.createObjectURL(blob);
      } else if (isBusiness && mediaData.data.id && mediaData.data.sha256) {
        const cacheKey = `${mediaData.data.id}_${mediaData.data.sha256}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return cached;

        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/media/${mediaData.data.id}/${mediaData.data.sha256}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          localStorage.setItem(cacheKey, dataUrl);
          return dataUrl;
        }
      }
      return null;
    } catch (error) {
      console.error('[loadMediaUrl] Erro:', error);
      return null;
    }
  };


  // Load contact data
  const loadContactData = async () => {
    if (!selectedChat || !token) return;

    if (initialLoad) {
      setLoading(true);
    }

    // Limpa os estados ao trocar de chat
    setDealData(null);
    setDealTags([]);

    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");

      const [contactRes, dealRes] = await Promise.all([
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/contato/getByRemoteJid?remoteJid=${digits}`,
          { headers: { token } }
        ),
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/chat/findDealsByContact`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", token },
            body: JSON.stringify({ remoteJid: selectedChat.remoteJid }),
          }
        ),
      ]);

      if (contactRes.ok) {
        const contactText = await contactRes.text();
        if (contactText) {
          const contact = JSON.parse(contactText);
          const contactResult = normalize(contact);
          setContactData(contactResult);
          setEditedName(contactResult?.nome || "");
        }
      }

      if (dealRes.ok) {
        const dealText = await dealRes.text();
        if (dealText) {
          const deals = JSON.parse(dealText);
          if (Array.isArray(deals) && deals.length > 0) {
            const basicDeal = deals[0];

            try {
              const fullDealRes = await fetch(
                `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/getById?id=${basicDeal.Id}`,
                { headers: { token } }
              );

              if (fullDealRes.ok) {
                const fullDealData = await fullDealRes.json();
                const fullDeal = normalize(fullDealData);
                // Só seta se realmente houver dados válidos
                if (fullDeal && fullDeal.Id) {
                  setDealData(fullDeal);
                } else {
                  setDealData(null);
                }
              } else {
                // Só seta basicDeal se tiver Id
                if (basicDeal && basicDeal.Id) {
                  setDealData(basicDeal);
                } else {
                  setDealData(null);
                }
              }
            } catch (error) {
              console.error("[ContactSidebarV2] Erro ao buscar deal completo:", error);
              // Só seta se basicDeal for válido
              if (basicDeal && basicDeal.Id) {
                setDealData(basicDeal);
              } else {
                setDealData(null);
              }
            }
          } else {
            // Não há deals, limpa o estado
            setDealData(null);
          }
        } else {
          // Resposta vazia, limpa o estado
          setDealData(null);
        }
      } else {
        // Erro na requisição, limpa o estado
        setDealData(null);
      }

    } catch (error) {
      console.error("Erro ao carregar dados do contato:", error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // Load tags for deal
  const loadDealTags = async () => {
    if (!dealData?.Id || !token) return;

    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/list/id?id=${dealData.Id}`,
        { headers: { token } }
      );

      if (response.ok) {
        const data = await response.json();
        const tagIds: number[] = [];
        if (Array.isArray(data)) {
          data.forEach(
            (item: { id_tag: number | number[]; id_negociacao: number | number[] }) => {
              const tagsArr = (Array.isArray(item.id_tag) ? item.id_tag : [item.id_tag]).map(Number);
              const dealsArr = (Array.isArray(item.id_negociacao) ? item.id_negociacao : [item.id_negociacao]).map(Number);
              if (dealsArr.includes(dealData.Id)) {
                tagIds.push(...tagsArr);
              }
            }
          );
        }
        setDealTags(availableTags.filter(t => tagIds.includes(t.Id)));
      }
    } catch (error) {
      console.error("Erro ao carregar etiquetas da negociação:", error);
    }
  };

  // 🔄 Load session info unificado (sessão, intervenção, exclusão permanente, transferência)
  const loadSessionInfo = async () => {
    if (!selectedChat || !token) return;

    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");

      // Limpa cache antes de buscar
      clearApiCache([
        getCacheKey('findSessionByRemoteJid', token, { remoteJid: digits }),
        getCacheKey('findInterventionByRemoteJid', token, { remoteJid: digits }),
        getCacheKey('findPermanentExclusionByRemoteJid', token, { remoteJid: digits }),
      ]);

      // Busca em paralelo
      const [sessionData, interventionData, permanentData, transferRes] = await Promise.all([
        apiClient.findSessionByRemoteJid(token, digits).catch(() => null),
        apiClient.findInterventionByRemoteJid(token, digits).catch(() => null),
        apiClient.findPermanentExclusionByRemoteJid(token, digits).catch(() => null),
        fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/chat/transfer/get`, {
          headers: { token },
        }).catch(() => null),
      ]);

      // Normaliza dados
      const session = normalize(sessionData);
      const intervention = normalize(interventionData);
      const permanent = normalize(permanentData);

      setSessionInfo(session);
      setInterventionInfo(intervention);

      // Atualiza status da IA
      const hasIntervention = !!intervention && Object.keys(intervention).length > 0;
      const hasPermanent = !!permanent && Object.keys(permanent).length > 0;

      setAiStatus({
        intervention: hasIntervention && !hasPermanent,
        permanentExclusion: hasPermanent,
      });

      // Processar transferência
      if (transferRes && transferRes.ok) {
        const transferData = await transferRes.json();
        const hasTransfer = Array.isArray(transferData)
          ? transferData.some(
              (t: any) => t.remoteJid === digits || t.remoteJid === selectedChat.remoteJid
            )
          : false;
        setIsTransferChat(hasTransfer);
      }
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao carregar informações de sessão:", error);
    }
  };

  // Carregar mídias da conversa
  const loadMediaFiles = async () => {
    if (!selectedChat || !token) return;

    setLoadingMedia(true);
    try {
      // Busca todas as mensagens da conversa
      const messages = await apiClient.findMessages(token, selectedChat.remoteJid, 200, 1, false);

      const images: any[] = [];
      const videos: any[] = [];
      const docs: any[] = [];

      // Filtra mensagens por tipo de mídia
      messages.forEach((msg: any) => {
        const msgType = msg.messageType;

        if (msgType === 'imageMessage' && msg.message?.imageMessage) {
          images.push({
            id: msg.id,
            timestamp: msg.messageTimestamp,
            data: msg.message.imageMessage,
            caption: msg.message.imageMessage.caption,
          });
        } else if (msgType === 'videoMessage' && msg.message?.videoMessage) {
          videos.push({
            id: msg.id,
            timestamp: msg.messageTimestamp,
            data: msg.message.videoMessage,
            caption: msg.message.videoMessage.caption,
          });
        } else if (msgType === 'documentMessage' && msg.message?.documentMessage) {
          docs.push({
            id: msg.id,
            timestamp: msg.messageTimestamp,
            data: msg.message.documentMessage,
            fileName: msg.message.documentMessage.fileName,
            mimetype: msg.message.documentMessage.mimetype,
          });
        }
      });

      setMediaFiles({
        images: images.reverse(), // Mais recentes primeiro
        videos: videos.reverse(),
        docs: docs.reverse(),
      });
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao carregar mídias:", error);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContactData();
      loadSessionInfo();
      if (activeView === 'media') {
        loadMediaFiles();
      }
    }
  }, [selectedChat, token, isOpen, activeView]);

  // Listener para recarregar status quando houver mudanças
  useEffect(() => {
    const handleSessionUpdate = () => {
      loadSessionInfo();
    };

    const handleContactUpdate = () => {
      loadSessionInfo();
    };

    window.addEventListener('sessions_updated', handleSessionUpdate);
    window.addEventListener('contactUpdated', handleContactUpdate);

    return () => {
      window.removeEventListener('sessions_updated', handleSessionUpdate);
      window.removeEventListener('contactUpdated', handleContactUpdate);
    };
  }, [selectedChat, token]);

  useEffect(() => {
    if (dealData?.Id && availableTags.length > 0) {
      loadDealTags();
    }
  }, [dealData?.Id, availableTags]);

  // Controlar visibilidade do modal de criar negociação
  useEffect(() => {
    // Fecha o modal se a sidebar for fechada e reseta o controle
    if (!isOpen) {
      setShowCreateDealModal(false);
      setModalAlreadyShown(false);
      return;
    }

    // Só mostra o modal na aba "info", não na aba "media"
    if (activeView !== 'info') {
      setShowCreateDealModal(false);
      return;
    }

    // Não faz nada se ainda está carregando ou é o carregamento inicial
    if (loading || initialLoad) {
      return;
    }

    // Mostra o modal se não houver deal
    // Mas só mostra se ainda não foi mostrado nesta sessão (para evitar reabrir ao trocar de aba)
    if (!dealData && !modalAlreadyShown) {
      setShowCreateDealModal(true);
      setModalAlreadyShown(true);
    } else if (dealData) {
      // Fecha o modal se houver um deal
      setShowCreateDealModal(false);
      // Marca como já mostrado para evitar que apareça ao trocar de aba
      setModalAlreadyShown(true);
    }
  }, [isOpen, contactData, dealData, loading, initialLoad, activeView, modalAlreadyShown]);

  // ▶️ Ativar IA
  const handleStartAgent = async () => {
    if (!selectedChat || !token) return;

    // Bloqueia cliques repetidos
    if (activationCooldown) return;
    setActivationCooldown(true);
    setShowActivationMessage(true);

    // Oculta mensagem após 10 segundos
    setTimeout(() => setShowActivationMessage(false), 10000);

    // Libera o botão novamente após 1 minuto
    setTimeout(() => setActivationCooldown(false), 60000);

    setUpdatingAI(true);

    // Atualização otimista
    setAiStatus({
      intervention: false,
      permanentExclusion: false,
    });

    try {
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/conversa/agente/ativar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({
            pushName: selectedChat.pushName,
            remoteJid: selectedChat.remoteJid
          }),
        }
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadSessionInfo();

      updateChatLocal(selectedChat.remoteJid, { iaActive: true });

      const { updateChatIAStatus } = await import('../../utils/chatUpdateEvents');
      updateChatIAStatus(selectedChat.remoteJid, true);

      triggerGlobalRefresh();

      updateChatLocal(selectedChat.remoteJid, {
        iaActive: true,
        intervention: false,
        permanentExclusion: false,
      } as any);

      toast.success('IA ativada com sucesso');
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao ativar IA:", error);
      toast.error('Erro ao ativar IA');
      await loadSessionInfo();
    } finally {
      setUpdatingAI(false);
    }
  };

  // ⏸️ Pausar IA (criar intervenção temporária)
  const handlePauseAI = async () => {
    if (!selectedChat || !token || !selectedChatDigits) return;
    setUpdatingAI(true);

    // Atualização otimista
    setAiStatus({
      intervention: true,
      permanentExclusion: false,
    });

    try {
      await apiClient.createIntervention(token, selectedChatDigits);

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateChatLocal(selectedChat.remoteJid, { iaActive: false });

      const { updateChatIAStatus } = await import('../../utils/chatUpdateEvents');
      updateChatIAStatus(selectedChat.remoteJid, false);

      triggerGlobalRefresh();

      await loadSessionInfo();

      toast.success('IA pausada temporariamente');
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao pausar IA:", error);
      toast.error('Erro ao pausar IA');
      await loadSessionInfo();
    } finally {
      setUpdatingAI(false);
    }
  };

  // 🚫 Desativar IA permanentemente
  const handleDisableAI = async () => {
    if (!selectedChat || !token || !selectedChatDigits) return;
    setUpdatingAI(true);

    // Atualização otimista
    setAiStatus({
      intervention: false,
      permanentExclusion: true,
    });

    try {
      await apiClient.createPermanentExclusion(token, selectedChatDigits);

      await new Promise(resolve => setTimeout(resolve, 1000));

      updateChatLocal(selectedChat.remoteJid, { iaActive: false });

      const { updateChatIAStatus } = await import('../../utils/chatUpdateEvents');
      updateChatIAStatus(selectedChat.remoteJid, false);

      await loadSessionInfo();

      toast.success('IA desativada permanentemente');
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao desativar IA:", error);
      toast.error('Erro ao desativar IA');
      await loadSessionInfo();
    } finally {
      setUpdatingAI(false);
    }
  };

  // ❌ Reativar IA (remover intervenção temporária)
  const handleDeleteIntervention = async () => {
    if (!token || !interventionInfo || !selectedChatDigits) return;
    setUpdatingAI(true);
    try {
      await apiClient.deleteIntervention(token, selectedChatDigits);
      toast.success('Intervenção removida - IA reativada');
      await loadSessionInfo();
      triggerGlobalRefresh();
    } catch (err) {
      console.error('Erro ao remover intervenção:', err);
      toast.error('Erro ao remover intervenção');
    } finally {
      setUpdatingAI(false);
    }
  };

  // ❌ Remover exclusão permanente
  const handleRemovePermanentExclusion = async () => {
    if (!selectedChat || !token || !selectedChatDigits) return;
    setUpdatingAI(true);
    try {
      await apiClient.deletePermanentExclusion(token, selectedChatDigits);
      toast.success('Exclusão permanente removida');
      await loadSessionInfo();
      triggerGlobalRefresh();
    } catch (error) {
      console.error("Erro ao remover exclusão permanente:", error);
      toast.error('Erro ao remover exclusão permanente');
    } finally {
      setUpdatingAI(false);
    }
  };

  // 🔄 Remover transferência
  const handleRemoveTransfer = async () => {
    if (!selectedChat || !token) return;
    setUpdatingAI(true);
    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/chat/transfer/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ remoteJid: digits }),
        }
      );

      triggerGlobalRefresh();
      toast.success('Transferência cancelada');
    } catch (error) {
      console.error("Erro ao remover transferência:", error);
      toast.error('Erro ao remover transferência');
    } finally {
      setUpdatingAI(false);
    }
  };

  // ✏️ Atualizar nome do contato
  const handleUpdateName = async () => {
    if (!contactData || !token || !editedName.trim()) return;
    setSavingName(true);
    try {
      const body = {
        id: contactData.Id,
        nome: editedName.trim(),
        Email: contactData.Email,
        telefone: contactData.telefone,
      };

      const response = await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/contato/update",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

      if (contactData.Id) {
        try {
          const digits = selectedChat!.remoteJid.replace(/\D/g, "");
          const fullContactRes = await fetch(
            `https://n8n.lumendigital.com.br/webhook/prospecta/contato/getByRemoteJid?remoteJid=${digits}`,
            { headers: { token } }
          );

          if (fullContactRes.ok) {
            const fullContactText = await fullContactRes.text();
            if (fullContactText) {
              const fullContact = JSON.parse(fullContactText);
              const fullContactResult = normalize(fullContact);
              setContactData(fullContactResult);
              setEditedName(fullContactResult?.nome || "");
            }
          }
        } catch (error) {
          console.error("[ContactSidebarV2] Erro ao recarregar contato completo:", error);
        }
      }

      if (selectedChat?.remoteJid) {
        updateChatLocal(selectedChat.remoteJid, { pushName: editedName.trim() });

        const { updateChatName } = await import('../../utils/chatUpdateEvents');
        updateChatName(selectedChat.remoteJid, editedName.trim());
      }

      setEditingName(false);
      toast.success('Nome atualizado');
    } catch (error) {
      console.error("Erro ao atualizar nome do contato:", error);
      toast.error('Erro ao atualizar nome');
      setEditedName(contactData?.nome || "");
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdateResponsavel = async (id_usuario: number) => {
    if (!dealData || !token) return;

    try {
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ Id: dealData.Id, id_usuario }),
        }
      );

      setDealData((prev) => (prev ? { ...prev, id_usuario } : null));

      if (selectedChat?.remoteJid) {
        const selectedUser = users.find(u => u.Id === id_usuario);
        const responsavelNome = selectedUser?.nome || '';

        updateChatLocal(selectedChat.remoteJid, {
          responsibleId: id_usuario,
          responsavelNome: responsavelNome,
        } as any);

        const { updateChatResponsible } = await import('../../utils/chatUpdateEvents');
        updateChatResponsible(selectedChat.remoteJid, id_usuario);

        window.dispatchEvent(new Event("responsavel_updated"));
        triggerGlobalRefresh();
      }

      toast.success('Responsável atualizado');
    } catch (error) {
      console.error("Erro ao atualizar responsável:", error);
      toast.error('Erro ao atualizar responsável');
    }
  };

  const handleUpdateStage = async (id_funil: number, id_estagio: number) => {
    if (!dealData || !token) return;

    try {
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/update/funil`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({
            Id: dealData.Id,
            id_funil,
            id_estagio,
          }),
        }
      );

      setDealData((prev) => (prev ? { ...prev, id_funil, id_estagio } : null));

      if (selectedChat?.remoteJid) {
        updateChatLocal(selectedChat.remoteJid, { chatStageId: String(id_estagio) } as any);

        const { updateChatStage } = await import('../../utils/chatUpdateEvents');
        updateChatStage(selectedChat.remoteJid, String(id_estagio));
      }

      toast.success('Etapa atualizada');
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
      toast.error('Erro ao atualizar etapa');
    }
  };

  const handleAddTag = async (tagId: number) => {
    if (!dealData || !token) return;

    try {
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ id_negociacao: dealData.Id, id_tag: tagId }),
        }
      );

      await loadDealTags();

      if (selectedChat?.remoteJid) {
        const updatedTagIds = [...dealTags.map(t => t.Id), tagId];
        updateChatLocal(selectedChat.remoteJid, { tagIds: updatedTagIds } as any);

        const { updateChatTags } = await import('../../utils/chatUpdateEvents');
        updateChatTags(selectedChat.remoteJid, updatedTagIds);
      }

      toast.success('Etiqueta adicionada');
    } catch (error) {
      console.error("Erro ao adicionar etiqueta:", error);
      toast.error('Erro ao adicionar etiqueta');
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!dealData || !token) return;

    try {
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ id_negociacao: dealData.Id, id_tag: tagId }),
        }
      );

      await loadDealTags();

      if (selectedChat?.remoteJid) {
        const updatedTagIds = dealTags.map(t => t.Id).filter(id => id !== tagId);
        updateChatLocal(selectedChat.remoteJid, { tagIds: updatedTagIds } as any);

        const { updateChatTags } = await import('../../utils/chatUpdateEvents');
        updateChatTags(selectedChat.remoteJid, updatedTagIds);
      }

      toast.success('Etiqueta removida');
    } catch (error) {
      console.error("Erro ao remover etiqueta:", error);
      toast.error('Erro ao remover etiqueta');
    }
  };

  const handleOpenCRM = () => {
    if (dealData) {
      window.location.href = `/crm/${dealData.Id}`;
    }
  };

  // 🆕 Criar nova negociação
  const handleCreateDeal = async () => {
    if (!selectedChat || !token) return;

    setCreatingDeal(true);

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/conversas/deal/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
          body: JSON.stringify({
            pushName: contactData?.nome || selectedChat.pushName,
            remoteJid: selectedChat.remoteJid
          })
        }
      );

      if (response.ok) {
        toast.success('Negociação criada com sucesso!');

        // Recarrega os dados para pegar a nova negociação
        await loadContactData();

        // Fecha o modal
        setShowCreateDealModal(false);
      } else {
        throw new Error('Erro ao criar negociação');
      }
    } catch (error) {
      console.error('Erro ao criar negociação:', error);
      toast.error('Erro ao criar negociação');
    } finally {
      setCreatingDeal(false);
    }
  };

  if (!selectedChat) return null;

  const currentFunnel = funnels.find((f) => f.id === dealData?.id_funil);

  return (
    <div
      className={`
        fixed md:absolute right-0 top-[112px] md:top-0 bottom-0 md:h-full
        bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900
        backdrop-blur-xl border-l border-gray-200/60 dark:border-gray-700/50
        shadow-2xl shadow-gray-900/5 dark:shadow-black/20
        transition-all duration-500 ease-out
        flex flex-col z-20
        ${isOpen ? "w-full md:w-[440px] opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none"}
      `}
    >
      {/* Header Premium com gradiente sutil */}
      <div className="relative border-b border-gray-200/40 dark:border-gray-700/30 bg-gradient-to-r from-white/80 via-gray-50/60 to-white/80 dark:from-gray-900/80 dark:via-gray-800/50 dark:to-gray-900/80 backdrop-blur-md">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/5 dark:to-gray-900/10 pointer-events-none"></div>

        <div className="relative flex items-center justify-end px-6 py-4">
          <button
            onClick={onToggle}
            className="group p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-300 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200" />
          </button>
        </div>

        {/* Tabs Premium com efeito de elevação */}
        <div className="relative flex gap-2 px-6 pb-4">
          <button
            onClick={() => setActiveView('info')}
            className={`group relative flex-1 flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
              activeView === 'info'
                ? 'text-white dark:text-white bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/60 backdrop-blur-sm'
            }`}
          >
            {activeView === 'info' && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl blur-md opacity-50 group-hover:opacity-60 transition-opacity duration-300"></div>
            )}
            <Info className="relative w-4 h-4" />
            <span className="relative">Informações</span>
          </button>

          <button
            onClick={() => setActiveView('media')}
            className={`group relative flex-1 flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
              activeView === 'media'
                ? 'text-white dark:text-white bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/60 backdrop-blur-sm'
            }`}
          >
            {activeView === 'media' && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl blur-md opacity-50 group-hover:opacity-60 transition-opacity duration-300"></div>
            )}
            <ImageIcon className="relative w-4 h-4" />
            <span className="relative">Mídias</span>
          </button>
        </div>
      </div>

      {/* Conteúdo principal com padding generoso */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        {activeView === 'info' ? (
          loading && initialLoad ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 text-indigo-500/70 dark:text-indigo-400/70 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Carregando...</p>
            </div>
          ) : (
            <>
            {/* Card Premium - Foto, Nome e Telefone */}
            <div className="group relative rounded-2xl border border-gray-200/60 dark:border-gray-700/40 p-6 bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-gray-800/80 dark:via-gray-800/50 dark:to-gray-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex items-center space-x-4">
                {selectedChat.profilePicUrl ? (
                  <div className="relative">
                    <img
                      src={selectedChat.profilePicUrl}
                      alt={contactData?.nome || selectedChat.pushName}
                      className="h-20 w-20 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-700 shadow-lg"
                    />
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full ring-3 ring-white dark:ring-gray-800 shadow-sm"></div>
                  </div>
                ) : (
                  <div className="relative h-20 w-20 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg">
                    <User className="w-9 h-9" />
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full ring-3 ring-white dark:ring-gray-800 shadow-sm"></div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 backdrop-blur-sm transition-all duration-200"
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={savingName}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50/80 dark:hover:bg-green-900/30 rounded-xl transition-all duration-200 active:scale-95"
                      >
                        {savingName ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingName(false);
                          setEditedName(contactData?.nome || "");
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3
                        className="font-medium text-lg text-gray-900 dark:text-white transition-colors duration-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                        onClick={() => setEditingName(true)}
                        title="Clique para editar"
                      >
                        {contactData?.nome || selectedChat.pushName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-light">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="tracking-wide">
                          {contactData?.telefone ||
                            selectedChat.remoteJid.replace(/\D/g, "")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Botão Ver Contato Completo - Premium */}
              {contactData && onOpenContactModal && (
                <button
                  onClick={onOpenContactModal}
                  className="relative group w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-300 text-sm shadow-sm hover:shadow active:scale-[0.98] backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/30"
                >
                  <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  <span>Ver detalhes completos</span>
                </button>
              )}
            </div>

            {/* Controle da IA */}
            <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4 bg-white dark:bg-gray-800 space-y-3 transition-colors duration-200">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                <Bot className="w-4 h-4" />
                <span>Controle da IA</span>
              </div>

              <div className="space-y-2">
                {aiStatus.permanentExclusion ? (
                  <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-200">
                    <span className="text-xs text-red-700 dark:text-red-400 font-medium transition-colors duration-200">
                      IA desativada permanentemente
                    </span>
                    <button
                      onClick={handleRemovePermanentExclusion}
                      disabled={updatingAI}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors duration-200 disabled:opacity-50"
                      title="Remover exclusão permanente"
                    >
                      {updatingAI ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : aiStatus.intervention ? (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg transition-colors duration-200">
                    <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium transition-colors duration-200">
                      IA pausada (intervenção)
                    </span>
                    <button
                      onClick={handleDeleteIntervention}
                      disabled={updatingAI}
                      className="p-1 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded transition-colors duration-200 disabled:opacity-50"
                      title="Reativar IA"
                    >
                      {updatingAI ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg transition-colors duration-200">
                    <span className="text-xs text-green-700 dark:text-green-400 font-medium transition-colors duration-200">
                      IA ativa
                    </span>
                  </div>
                )}

                {isTransferChat && (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg transition-colors duration-200">
                    <span className="text-xs text-yellow-800 dark:text-yellow-400 font-medium transition-colors duration-200">
                      Em transferência
                    </span>
                    <button
                      onClick={handleRemoveTransfer}
                      disabled={updatingAI}
                      className="p-1 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded transition-colors duration-200 disabled:opacity-50"
                      title="Cancelar transferência"
                    >
                      {updatingAI ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleStartAgent}
                    disabled={
                      updatingAI ||
                      aiStatus.intervention ||
                      aiStatus.permanentExclusion ||
                      activationCooldown
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border border-green-300 dark:border-green-700
                      bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40
                      transition-colors duration-200 disabled:cursor-not-allowed
                      ${activationCooldown ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'}`}
                    title={activationCooldown ? "Aguarde antes de reativar" : "Ativar IA"}
                  >
                    {updatingAI && (!aiStatus.intervention && !aiStatus.permanentExclusion) ? (
                      <Loader2 className="w-4 h-4 text-green-600 dark:text-green-400 mb-1 animate-spin transition-colors duration-200" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-green-600 dark:text-green-400 mb-1 transition-colors duration-200" />
                    )}
                    <span className="text-[10px] text-green-700 dark:text-green-400 font-medium transition-colors duration-200">Ativar</span>
                  </button>

                  <button
                    onClick={handlePauseAI}
                    disabled={updatingAI || aiStatus.intervention || aiStatus.permanentExclusion}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Pausar IA temporariamente"
                  >
                    {updatingAI && !aiStatus.intervention && !aiStatus.permanentExclusion ? (
                      <Loader2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mb-1 animate-spin transition-colors duration-200" />
                    ) : (
                      <Pause className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mb-1 transition-colors duration-200" />
                    )}
                    <span className="text-[10px] text-yellow-700 dark:text-yellow-400 font-medium transition-colors duration-200">Pausar</span>
                  </button>

                  <button
                    onClick={handleDisableAI}
                    disabled={updatingAI || aiStatus.permanentExclusion}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Desativar IA permanentemente"
                  >
                    {updatingAI && !aiStatus.permanentExclusion ? (
                      <Loader2 className="w-4 h-4 text-red-600 dark:text-red-400 mb-1 animate-spin transition-colors duration-200" />
                    ) : (
                      <BanIcon className="w-4 h-4 text-red-600 dark:text-red-400 mb-1 transition-colors duration-200" />
                    )}
                    <span className="text-[10px] text-red-700 dark:text-red-400 font-medium transition-colors duration-200">Desativar</span>
                  </button>
                </div>

                {/* Mensagem informativa de ativação */}
                {showActivationMessage && (
                  <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400 animate-fadeIn">
                    ✅ Requisição enviada. Aguarde até 1 minuto para a IA iniciar o atendimento com o cliente.
                  </p>
                )}
              </div>
            </div>

            {/* Responsável */}
            {dealData && (
              <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4 bg-white dark:bg-gray-800 space-y-3 transition-colors duration-200">
                <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                  <Users className="w-4 h-4" />
                  <span>Responsável</span>
                </div>

                <select
                  value={dealData.id_usuario || ""}
                  onChange={(e) => handleUpdateResponsavel(Number(e.target.value))}
                  className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200 ${
                    dealData.id_usuario ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <option value="" disabled>Selecione um responsável</option>
                  {users.map((user) => (
                    <option key={user.Id} value={user.Id}>
                      {user.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Etapa do Funil */}
            {dealData && (
              <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4 bg-white dark:bg-gray-800 space-y-3 transition-colors duration-200">
                <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                  <Filter className="w-4 h-4" />
                  <span>Funil e Estágio</span>
                </div>

                <div className="space-y-2">
                  <select
                    value={dealData.id_funil || ""}
                    onChange={(e) => {
                      const funnelId = Number(e.target.value);
                      const firstStage = funnels.find((f) => f.id === funnelId)?.estagios?.[0];
                      if (firstStage) {
                        handleUpdateStage(funnelId, Number(firstStage.Id));
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                  >
                    <option value="">Selecione um funil</option>
                    {funnels.map((funnel) => (
                      <option key={funnel.id} value={funnel.id}>
                        {funnel.nome}
                      </option>
                    ))}
                  </select>

                  {currentFunnel && (
                    <select
                      value={dealData.id_estagio || ""}
                      onChange={(e) =>
                        handleUpdateStage(dealData.id_funil, Number(e.target.value))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                    >
                      <option value="">Selecione um estágio</option>
                      {currentFunnel.estagios?.map((stage) => (
                        <option key={stage.Id} value={stage.Id}>
                          {stage.nome}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* Etiquetas (Tags) */}
            {dealData && (
              <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4 bg-white dark:bg-gray-800 space-y-3 transition-colors duration-200">
                <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-200">
                  <TagIcon className="w-4 h-4" />
                  <span>Etiquetas</span>
                </div>

                {/* Tags atuais */}
                <div className="flex flex-wrap gap-2">
                  {dealTags.length > 0 ? (
                    dealTags.map((tag) => (
                      <div
                        key={tag.Id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors duration-200"
                        style={{
                          backgroundColor: tag.cor,
                          color: tag.cor_texto,
                        }}
                      >
                        {tag.nome}
                        <button
                          onClick={() => handleRemoveTag(tag.Id)}
                          className="ml-1 hover:opacity-80 transition-opacity duration-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Nenhuma etiqueta adicionada</p>
                  )}
                </div>

                {/* Adicionar nova tag */}
                <select
                  onChange={(e) => {
                    const tagId = Number(e.target.value);
                    if (tagId) {
                      handleAddTag(tagId);
                      e.target.value = "";
                    }
                  }}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                >
                  <option value="">+ Adicionar etiqueta</option>
                  {availableTags
                    .filter((tag) => !dealTags.find((dt) => dt.Id === tag.Id))
                    .map((tag) => (
                      <option key={tag.Id} value={tag.Id}>
                        {tag.nome}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Deal Summary Widget */}
            {dealData && (
              <DealSummaryWidget
                dealId={dealData.Id}
                contactName={contactData?.nome}
                contactPhone={contactData?.telefone}
              />
            )}

            {/* Botão Abrir no CRM */}
            {dealData && (
              <button
                onClick={handleOpenCRM}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-800 dark:hover:to-purple-800 transition-all duration-200 shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir no CRM</span>
              </button>
            )}
          </>
        )
        ) : (
          /* View de Mídias */
          <div className="space-y-4">

            {/* Sub-tabs de Mídias */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/30 rounded-xl">
              <button
                onClick={() => setActiveMediaTab('images')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                  activeMediaTab === 'images'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Imagens</span>
              </button>

              <button
                onClick={() => setActiveMediaTab('videos')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                  activeMediaTab === 'videos'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Vídeos</span>
              </button>

              <button
                onClick={() => setActiveMediaTab('docs')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                  activeMediaTab === 'docs'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Docs</span>
              </button>
            </div>

            {/* Conteúdo das mídias */}
            {loadingMedia ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {activeMediaTab === 'images' && (
                  mediaFiles.images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma imagem encontrada</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaFiles.images.map((img, idx) => (
                        <MediaPreview
                          key={img.id}
                          mediaData={img}
                          type="image"
                          isBusiness={isBusiness}
                          onPreview={openPreview}
                          index={idx}
                        />
                      ))}
                    </div>
                  )
                )}

                {activeMediaTab === 'videos' && (
                  mediaFiles.videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                        <Video className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum vídeo encontrado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {mediaFiles.videos.map((vid, idx) => (
                        <MediaPreview
                          key={vid.id}
                          mediaData={vid}
                          type="video"
                          isBusiness={isBusiness}
                          onPreview={openPreview}
                          index={idx}
                        />
                      ))}
                    </div>
                  )
                )}

                {activeMediaTab === 'docs' && (
                  mediaFiles.docs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                        <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum documento encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mediaFiles.docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {doc.fileName || 'Documento'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {doc.mimetype || 'Arquivo'}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const mediaUrl = doc.data.url || doc.data.mediaUrl;
                                let downloadUrl = mediaUrl;

                                if (/whatsapp\.net/.test(mediaUrl) && doc.data.mediaKey && doc.data.mimetype) {
                                  const buffer = await decryptEvoMedia(mediaUrl, doc.data.mediaKey, doc.data.mimetype);
                                  const blob = new Blob([buffer], { type: doc.data.mimetype });
                                  downloadUrl = URL.createObjectURL(blob);
                                } else if (isBusiness && doc.data.id && doc.data.sha256) {
                                  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/media/${doc.data.id}/${doc.data.sha256}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (response.ok) {
                                    const blob = await response.blob();
                                    downloadUrl = URL.createObjectURL(blob);
                                  }
                                }

                                const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
                                const extension = doc.fileName?.split('.').pop() || 'pdf';
                                const clientName = contactData?.nome || selectedChat?.pushName || 'Cliente';
                                const filename = `Guimoo Documento - ${clientName} ${timestamp}.${extension}`;
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success('Download iniciado!');
                              } catch (error) {
                                console.error('Erro ao baixar documento:', error);
                                toast.error('Erro ao baixar documento');
                              }
                            }}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Baixar documento"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                )}

              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Criar Negociação - Aparece quando não há deal */}
      {showCreateDealModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 m-4 max-w-xs w-full">
            {/* Ícone */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-indigo-500 dark:bg-indigo-600 flex items-center justify-center">
                <ExternalLink className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Título */}
            <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-3">
              Criar Negociação
            </h3>

            {/* Descrição */}
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
              Este contato ainda não possui uma negociação no CRM.
            </p>

            {/* Botão Criar */}
            <button
              onClick={handleCreateDeal}
              disabled={creatingDeal}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingDeal ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  <span>Criar Negociação</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Preview de Mídia */}
      {previewOpen && previewUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          {/* Botão Fechar */}
          <button
            onClick={closePreview}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Contador de Mídias */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 rounded-full text-white text-sm z-10">
            {previewIndex + 1} / {previewType === 'image' ? mediaFiles.images.length : mediaFiles.videos.length}
          </div>

          <div
            className="w-full h-full flex items-center justify-center p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-0 relative max-w-[80vw] max-h-[80vh]">
              {/* Seta Anterior */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePreview('prev');
                }}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-20 flex-shrink-0"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-10 h-10 text-white" />
              </button>

              <div className="relative">
                {previewType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="object-contain max-w-full max-h-[80vh]"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    className="object-contain max-w-full max-h-[80vh]"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                )}

                {/* Botão Download sobre a mídia */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadCurrent();
                  }}
                  className="absolute bottom-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  aria-label="Baixar"
                >
                  <Download className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Seta Próxima */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePreview('next');
                }}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-20 flex-shrink-0"
                aria-label="Próxima"
              >
                <ChevronRight className="w-10 h-10 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
