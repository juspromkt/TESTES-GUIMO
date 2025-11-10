import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from "react";
import {
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
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
  Building2,
  StickyNote,
  Plus,
  Pencil,
  Trash2,
  Save,
  Briefcase,
} from "lucide-react";
import GuimooIcon from "../GuimooIcon";
// Lazy import do ReactQuill para code splitting
const ReactQuill = lazy(() => import('react-quill'));
import type { Chat } from "./utils/api";
import { apiClient, clearApiCache, getCacheKey } from "./utils/api";
import type { Tag } from "../../types/tag";
import type { Departamento } from "../../types/departamento";
import { isDepartamento } from "../../types/departamento";
import { Contato } from '../../types/contato';
import DealSummaryWidget from "../crm/DealSummaryWidget";
import { useChat } from "../../context/ChatContext";
import { toast } from "sonner";
import { decryptEvoMedia, type MediaKeyInput } from "../decryptEvoMedia";
// 🔒 Imports de segurança e otimização
import { ErrorBoundary, LoadingFallback, ErrorFallback } from "../ErrorBoundary";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import { requestCache, CacheTTL } from "../../utils/requestCache";

interface ContactSidebarV2Props {
  isOpen: boolean;
  onToggle: () => void;
  selectedChat: Chat | null;
  onOpenContactModal?: () => void;
  whatsappType?: string;
}

type ContactData = Contato & {
  Email: string | null; // Override para aceitar null explicitamente
};

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

interface Note {
  Id: number;
  id_negociacao: number;
  id_usuario: number;
  descricao: string;
  CreatedAt: string;
  UpdatedAt: string | null;
}

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
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

// 🚀 OTIMIZADO: Componente memoizado para preview de imagens (evita re-renders desnecessários)
const MediaPreview = React.memo(({
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
}) => {
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

  if (!url || loading) {
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
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-3">
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
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-3">
            <ExternalLink className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return null;
});

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

  // departamentos
  const [availableDepartamentos, setAvailableDepartamentos] = useState<Departamento[]>([]);
  const [dealDepartamentos, setDealDepartamentos] = useState<Departamento[]>([]);

  const [initialLoad, setInitialLoad] = useState(true);
  const [aiStatus, setAiStatus] = useState<{
    intervention: boolean;
    permanentExclusion: boolean;
  }>({ intervention: false, permanentExclusion: false });
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
  const [activeView, setActiveView] = useState<'info' | 'media' | 'notas'>('info');
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

  // Estados para notas
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const quillRef = useRef<ReactQuill>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);

  // Estados para agentes
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;
  const selectedChatDigits = selectedChat?.remoteJid.replace(/\D/g, "");
  const isBusiness = whatsappType === 'WHATSAPP-BUSINESS';

  // Configuração do ReactQuill
  // Desabilitar toolbar do ReactQuill para deixar apenas o campo de texto
  const modules = {
    toolbar: false,
  };

  const formats = [];

  // Funções para gerenciar notas (atividades)
  const fetchNotes = async () => {
    if (!dealData?.Id) return;

    setLoadingNotes(true);
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/get?id=${dealData.Id}`,
        { headers: { token } }
      );

      if (!response.ok) throw new Error('Erro ao carregar notas');

      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar notas:', err);
      toast.error('Erro ao carregar notas');
    } finally {
      setLoadingNotes(false);
    }
  };

  // Função para buscar agentes disponíveis
  const fetchAgents = async () => {
    if (!token) return;

    setLoadingAgents(true);
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get',
        { headers: { token } }
      );

      if (!response.ok) throw new Error('Erro ao carregar agentes');

      const data = await response.json();
      if (Array.isArray(data)) {
        // Filtrar apenas agentes ativos
        const activeAgents = data.filter((agent: Agent) => agent.isAtivo);
        setAgents(activeAgents);

        // Se houver um agente principal ativo, selecioná-lo por padrão
        const mainAgent = activeAgents.find((agent: Agent) => agent.isAgentePrincipal);
        if (mainAgent && !selectedAgentId) {
          setSelectedAgentId(mainAgent.Id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar agentes:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  // ✅ LAZY LOAD: Buscar departamentos apenas quando necessário
  const fetchDepartamentos = async () => {
    if (!token || availableDepartamentos.length > 0) return; // Evita re-fetch

    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/produtos/get`, {
        headers: { token },
      });

      if (response.ok) {
        const deptData = await response.json();
        const depts = Array.isArray(deptData) ? deptData.filter(isDepartamento) : [];
        setAvailableDepartamentos(depts);
      }
    } catch (err) {
      console.error('Erro ao buscar departamentos:', err);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.trim() || !dealData?.Id) return;

    setSavingNote(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_negociacao: dealData.Id,
          descricao: newNote
        })
      });

      if (!response.ok) throw new Error('Erro ao criar nota');

      await fetchNotes();
      setNewNote('');

      // Disparar evento para atualizar as mensagens no MessageView
      window.dispatchEvent(new CustomEvent('note_created', {
        detail: { dealId: dealData.Id }
      }));

      toast.success('Nota criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar nota:', error);
      toast.error('Erro ao criar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    setSavingNote(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          Id: editingNote.Id,
          descricao: editingNote.descricao
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar nota');

      await fetchNotes();
      setEditingNote(null);
      toast.success('Nota atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      toast.error('Erro ao atualizar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    setSavingNote(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/atividades/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          Id: noteId
        })
      });

      if (!response.ok) throw new Error('Erro ao excluir nota');

      await fetchNotes();
      toast.success('Nota excluída com sucesso!');
      setDeletingNoteId(null);
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      toast.error('Erro ao excluir nota');
    } finally {
      setSavingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // 🚀 OTIMIZADO: Inicializar Quill e carregar CSS apenas quando necessário (lazy loaded)
  useEffect(() => {
    if (activeView === 'notas') {
      // Carrega o CSS do Quill dinamicamente
      if (!document.getElementById('quill-css')) {
        const link = document.createElement('link');
        link.id = 'quill-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
        document.head.appendChild(link);
      }
      setIsQuillReady(true);
    }
  }, [activeView]);

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


  // 🚀 OTIMIZADO: Load ALL data in parallel
  const loadAllInitialData = async () => {
    if (!selectedChat || !token) return;

    // Limpa os estados ao trocar de chat
    setDealData(null);
    setDealTags([]);
    setDealDepartamentos([]);

    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");

      // Limpa cache antes de buscar
      clearApiCache([
        getCacheKey('findSessionByRemoteJid', token, { remoteJid: digits }),
        getCacheKey('findInterventionByRemoteJid', token, { remoteJid: digits }),
        getCacheKey('findPermanentExclusionByRemoteJid', token, { remoteJid: digits }),
      ]);

      // 🔥 PARALELIZAÇÃO MÁXIMA: Buscar deal IDs primeiro para paralelizar getById
      const dealIdsRes = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/chat/findDealsByContact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ remoteJid: selectedChat.remoteJid }),
        }
      );

      let dealId: number | null = null;
      if (dealIdsRes.ok) {
        const dealText = await dealIdsRes.text();
        if (dealText) {
          const deals = JSON.parse(dealText);
          if (Array.isArray(deals) && deals.length > 0) {
            dealId = deals[0].Id;
          }
        }
      }

      // Agora faz todas as requisições em paralelo, incluindo getById se houver dealId
      const [
        contactRes,
        sessionData,
        interventionData,
        permanentData,
        agentsRes,
        fullDealRes
      ] = await Promise.all([
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/contato/getByRemoteJid?remoteJid=${digits}`,
          { headers: { token } }
        ),
        apiClient.findSessionByRemoteJid(token, digits).catch(() => null),
        apiClient.findInterventionByRemoteJid(token, digits).catch(() => null),
        apiClient.findPermanentExclusionByRemoteJid(token, digits).catch(() => null),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
          headers: { token }
        }).catch(() => null),
        dealId ? fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/getById?id=${dealId}`,
          { headers: { token } }
        ).catch(() => null) : Promise.resolve(null)
      ]);

      // Process contact data
      if (contactRes.ok) {
        const contactText = await contactRes.text();
        if (contactText) {
          const contact = JSON.parse(contactText);
          const contactResult = normalize(contact);
          setContactData(contactResult);
          setEditedName(contactResult?.nome || "");
        }
      }

      // Process deal data
      if (fullDealRes && fullDealRes.ok) {
        try {
          const fullDealData = await fullDealRes.json();
          const fullDeal = normalize(fullDealData);
          setDealData(fullDeal && fullDeal.Id ? fullDeal : null);
        } catch (err) {
          console.error('[ContactSidebarV2] Erro ao carregar deal completo:', err);
        }
      }

      // Process session info
      const session = normalize(sessionData);
      const intervention = normalize(interventionData);
      const permanent = normalize(permanentData);

      setSessionInfo(session);
      setInterventionInfo(intervention);

      const hasIntervention = !!intervention && Object.keys(intervention).length > 0;
      const hasPermanent = !!permanent && Object.keys(permanent).length > 0;

      setAiStatus({
        intervention: hasIntervention && !hasPermanent,
        permanentExclusion: hasPermanent,
      });

      // Process agents data
      if (agentsRes && agentsRes.ok) {
        const agentsData = await agentsRes.json();
        if (Array.isArray(agentsData)) {
          const activeAgents = agentsData.filter((agent: Agent) => agent.isAtivo);
          setAgents(activeAgents);
          const mainAgent = activeAgents.find((agent: Agent) => agent.isAgentePrincipal);
          if (mainAgent && !selectedAgentId) {
            setSelectedAgentId(mainAgent.Id);
          }
        }
      }

      // ✅ OTIMIZADO: Departamentos agora são lazy load (não busca na abertura)

      // 🔥 Load tags and deal departamentos in parallel if we have a dealId
      if (dealId) {
        Promise.all([
          loadDealTags(),
          loadDealDepartamentos()
        ]).catch(err => console.error('[ContactSidebarV2] Erro ao carregar tags/departamentos:', err));
      }

    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
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
      const [sessionData, interventionData, permanentData] = await Promise.all([
        apiClient.findSessionByRemoteJid(token, digits).catch(() => null),
        apiClient.findInterventionByRemoteJid(token, digits).catch(() => null),
        apiClient.findPermanentExclusionByRemoteJid(token, digits).catch(() => null),
      ]);

      // Normaliza dados
      const session = normalize(sessionData);
      const intervention = normalize(interventionData);
      const permanent = normalize(permanentData);

      setSessionInfo(session);
      setInterventionInfo(intervention);

      // Se a sessão tem um id_agente, seleciona ele no dropdown
      if (session && session.id_agente) {
        setSelectedAgentId(Number(session.id_agente));
      }

      // Atualiza status da IA
      const hasIntervention = !!intervention && Object.keys(intervention).length > 0;
      const hasPermanent = !!permanent && Object.keys(permanent).length > 0;

      setAiStatus({
        intervention: hasIntervention && !hasPermanent,
        permanentExclusion: hasPermanent,
      });
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao carregar informações de sessão:", error);
    }
  };

  // 🚀 OTIMIZADO: Carregar mídias com paginação (lazy loading)
  const loadMediaFiles = async (limit: number = 50) => {
    if (!selectedChat || !token) return;

    setLoadingMedia(true);
    try {
      // Busca apenas as últimas 50 mensagens inicialmente (muito mais rápido)
      const messages = await apiClient.findMessages(token, selectedChat.remoteJid, limit, 1, false);

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

  // 🚀 OTIMIZADO: useEffect consolidado - carrega todos os dados iniciais em paralelo
  useEffect(() => {
    if (isOpen && selectedChat && token) {
      // Carrega TUDO em paralelo sem setTimeout desnecessário
      loadAllInitialData();
    }
  }, [selectedChat, token, isOpen]);

  // 🚀 OTIMIZADO: Lazy load - só carrega mídias quando a aba for aberta
  useEffect(() => {
    if (isOpen && activeView === 'media' && selectedChat && token) {
      loadMediaFiles();
    }
  }, [activeView, isOpen, selectedChat]);

  // 🚀 OTIMIZADO: Lazy load - só carrega notas quando a aba for aberta
  useEffect(() => {
    if (activeView === 'notas' && dealData?.Id) {
      fetchNotes();
    }
  }, [activeView, dealData?.Id]);

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

    // Não faz nada se é o carregamento inicial
    if (initialLoad) {
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
  }, [isOpen, contactData, dealData, initialLoad, activeView, modalAlreadyShown]);

  // 🔄 Atualizar agente da sessão
  const handleUpdateAgent = async (newAgentId: number | null) => {
    console.log('[handleUpdateAgent] Iniciando atualização de agente', {
      newAgentId,
      selectedChat: selectedChat?.remoteJid,
      pushName: selectedChat?.pushName,
      hasToken: !!token
    });

    if (!selectedChat || !token || !newAgentId) {
      console.log('[handleUpdateAgent] Validação falhou - faltam dados');
      return;
    }

    // 🚀 OPTIMISTIC UPDATE: Atualiza a UI imediatamente
    const previousAgentId = selectedAgentId;
    setSelectedAgentId(newAgentId);

    try {
      console.log('[handleUpdateAgent] Chamando API /conversa/agente/ativar');

      // Usa o endpoint /conversa/agente/ativar com id_agente para atribuir/trocar o agente
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/conversa/agente/ativar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({
            pushName: selectedChat.pushName,
            remoteJid: selectedChat.remoteJid,
            id_agente: newAgentId
          }),
        }
      );

      console.log('[handleUpdateAgent] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[handleUpdateAgent] Erro na resposta da API:', errorText);
        throw new Error(`Erro na API: ${response.status}`);
      }

      console.log('[handleUpdateAgent] API respondeu com sucesso');

      console.log('[handleUpdateAgent] Disparando refresh global...');

      // Dispara refresh global para atualizar o ChatList
      triggerGlobalRefresh();

      console.log('[handleUpdateAgent] Atualização de agente concluída com sucesso');
      toast.success('Agente atualizado com sucesso');
    } catch (error) {
      // Reverte em caso de erro
      setSelectedAgentId(previousAgentId);
      console.error("[ContactSidebarV2] Erro ao atualizar agente:", error);
      toast.error('Erro ao atualizar agente');
    }
  };

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
            remoteJid: selectedChat.remoteJid,
            id_agente: selectedAgentId
          }),
        }
      );

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

      toast.success('IA pausada temporariamente');
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao pausar IA:", error);
      toast.error('Erro ao pausar IA');
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

      updateChatLocal(selectedChat.remoteJid, { iaActive: false });

      const { updateChatIAStatus } = await import('../../utils/chatUpdateEvents');
      updateChatIAStatus(selectedChat.remoteJid, false);

      toast.success('IA desativada permanentemente');
    } catch (error) {
      console.error("[ContactSidebarV2] Erro ao desativar IA:", error);
      toast.error('Erro ao desativar IA');
    } finally {
      setUpdatingAI(false);
    }
  };

  // ❌ Reativar IA (remover intervenção temporária)
  const handleDeleteIntervention = async () => {
    if (!token || !interventionInfo || !selectedChatDigits) return;
    setUpdatingAI(true);

    // 🚀 OPTIMISTIC UPDATE
    setAiStatus({
      intervention: false,
      permanentExclusion: false,
    });

    try {
      await apiClient.deleteIntervention(token, selectedChatDigits);
      toast.success('Intervenção removida - IA reativada');
      triggerGlobalRefresh();
    } catch (err) {
      // Reverte em caso de erro
      setAiStatus({
        intervention: true,
        permanentExclusion: false,
      });
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

    // 🚀 OPTIMISTIC UPDATE
    setAiStatus({
      intervention: false,
      permanentExclusion: false,
    });

    try {
      await apiClient.deletePermanentExclusion(token, selectedChatDigits);
      toast.success('Exclusão permanente removida');
      triggerGlobalRefresh();
    } catch (error) {
      // Reverte em caso de erro
      setAiStatus({
        intervention: false,
        permanentExclusion: true,
      });
      console.error("Erro ao remover exclusão permanente:", error);
      toast.error('Erro ao remover exclusão permanente');
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

    // 🚀 OPTIMISTIC UPDATE: Atualiza a UI imediatamente
    const previousValue = dealData.id_usuario;
    setDealData((prev) => (prev ? { ...prev, id_usuario } : null));

    try {
      // Faz a chamada da API em background
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ Id: dealData.Id, id_usuario }),
        }
      );

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
      // Reverte em caso de erro
      setDealData((prev) => (prev ? { ...prev, id_usuario: previousValue } : null));
      console.error("Erro ao atualizar responsável:", error);
      toast.error('Erro ao atualizar responsável');
    }
  };

  const handleUpdateStage = async (id_funil: number, id_estagio: number) => {
    if (!dealData || !token) return;

    // 🚀 OPTIMISTIC UPDATE: Atualiza a UI imediatamente
    const previousFunil = dealData.id_funil;
    const previousEstagio = dealData.id_estagio;
    setDealData((prev) => (prev ? { ...prev, id_funil, id_estagio } : null));

    try {
      // Faz a chamada da API em background
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

      if (selectedChat?.remoteJid) {
        updateChatLocal(selectedChat.remoteJid, { chatStageId: String(id_estagio) } as any);

        const { updateChatStage } = await import('../../utils/chatUpdateEvents');
        updateChatStage(selectedChat.remoteJid, String(id_estagio));
      }

      toast.success('Etapa atualizada');
    } catch (error) {
      // Reverte em caso de erro
      setDealData((prev) => (prev ? { ...prev, id_funil: previousFunil, id_estagio: previousEstagio } : null));
      console.error("Erro ao atualizar etapa:", error);
      toast.error('Erro ao atualizar etapa');
    }
  };

  const handleAddTag = async (tagId: number) => {
    if (!dealData || !token) return;

    // 🚀 OPTIMISTIC UPDATE: Adiciona tag imediatamente na UI
    const tagToAdd = availableTags.find(t => t.Id === tagId);
    if (!tagToAdd) return;

    const previousTags = [...dealTags];
    setDealTags(prev => [...prev, tagToAdd]);

    try {
      // Faz a chamada da API em background
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ id_negociacao: dealData.Id, id_tag: tagId }),
        }
      );

      if (selectedChat?.remoteJid) {
        const updatedTagIds = [...previousTags.map(t => t.Id), tagId];
        updateChatLocal(selectedChat.remoteJid, { tagIds: updatedTagIds } as any);

        const { updateChatTags } = await import('../../utils/chatUpdateEvents');
        updateChatTags(selectedChat.remoteJid, updatedTagIds);
      }

      toast.success('Etiqueta adicionada');
    } catch (error) {
      // Reverte em caso de erro
      setDealTags(previousTags);
      console.error("Erro ao adicionar etiqueta:", error);
      toast.error('Erro ao adicionar etiqueta');
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!dealData || !token) return;

    // 🚀 OPTIMISTIC UPDATE: Remove tag imediatamente da UI
    const previousTags = [...dealTags];
    setDealTags(prev => prev.filter(t => t.Id !== tagId));

    try {
      // Faz a chamada da API em background
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ id_negociacao: dealData.Id, id_tag: tagId }),
        }
      );

      if (selectedChat?.remoteJid) {
        const updatedTagIds = previousTags.map(t => t.Id).filter(id => id !== tagId);
        updateChatLocal(selectedChat.remoteJid, { tagIds: updatedTagIds } as any);

        const { updateChatTags } = await import('../../utils/chatUpdateEvents');
        updateChatTags(selectedChat.remoteJid, updatedTagIds);
      }

      toast.success('Etiqueta removida');
    } catch (error) {
      // Reverte em caso de erro
      setDealTags(previousTags);
      console.error("Erro ao remover etiqueta:", error);
      toast.error('Erro ao remover etiqueta');
    }
  };

  // Departamentos functions
  const loadAvailableDepartamentos = async () => {
    if (!token) return;
    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/produtos/get`, {
        headers: { token },
      });
      if (response.ok) {
        const data = await response.json();
        const depts = Array.isArray(data) ? data.filter(isDepartamento) : [];
        setAvailableDepartamentos(depts);
      }
    } catch (error) {
      console.error("Erro ao carregar departamentos disponíveis:", error);
    }
  };

  const loadDealDepartamentos = async () => {
    if (!dealData || !token) return;
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/produtos/lead/get?id_negociacao=${dealData.Id}`,
        { headers: { token } }
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const deptIds = data.filter(item => item.id_produto).map(item => item.id_produto);
          setDealDepartamentos(availableDepartamentos.filter(dept => deptIds.includes(dept.Id)));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar departamentos da negociação:", error);
    }
  };

  const handleAddDepartamento = async (departamentoId: number) => {
    if (!dealData || !token) return;

    // 🚀 OPTIMISTIC UPDATE: Adiciona departamento imediatamente na UI
    const deptToAdd = availableDepartamentos.find(d => d.Id === departamentoId);
    if (!deptToAdd) return;

    const previousDepts = [...dealDepartamentos];
    setDealDepartamentos(prev => [...prev, deptToAdd]);

    try {
      // Faz a chamada da API em background
      await fetch(`https://n8n.lumendigital.com.br/webhook/produtos/lead/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({
          id_negociacao: dealData.Id,
          id_produto: departamentoId,
          quantidade: 1,
          valor_unitario: 0
        }),
      });

      toast.success('Departamento adicionado');
    } catch (error) {
      // Reverte em caso de erro
      setDealDepartamentos(previousDepts);
      console.error("Erro ao adicionar departamento:", error);
      toast.error('Erro ao adicionar departamento');
    }
  };

  const handleRemoveDepartamento = async (departamentoId: number) => {
    if (!dealData || !token) return;

    // 🚀 OPTIMISTIC UPDATE: Remove departamento imediatamente da UI
    const previousDepts = [...dealDepartamentos];
    setDealDepartamentos(prev => prev.filter(d => d.Id !== departamentoId));

    try {
      // Faz a chamada da API em background
      await fetch(`https://n8n.lumendigital.com.br/webhook/produtos/lead/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", token },
        body: JSON.stringify({ id_negociacao: dealData.Id, id_produto: departamentoId }),
      });

      toast.success('Departamento removido');
    } catch (error) {
      // Reverte em caso de erro
      setDealDepartamentos(previousDepts);
      console.error("Erro ao remover departamento:", error);
      toast.error('Erro ao remover departamento');
    }
  };

  const handleOpenCRM = () => {
    if (dealData) {
      window.location.href = `/crm/${dealData.Id}`;
    }
  };

  // 🆕 Criar nova negociação
  const handleCreateDeal = async () => {
    if (!selectedChat || !token) {
      console.error('[handleCreateDeal] Falta selectedChat ou token');
      return;
    }

    console.log('[handleCreateDeal] Iniciando criação de negociação', {
      pushName: contactData?.nome || selectedChat.pushName,
      remoteJid: selectedChat.remoteJid
    });

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

      console.log('[handleCreateDeal] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[handleCreateDeal] Negociação criada:', data);

        toast.success('Negociação criada com sucesso!');

        // Recarrega os dados para pegar a nova negociação
        await loadContactData();

        // Fecha o modal
        setShowCreateDealModal(false);
      } else {
        const errorText = await response.text();
        console.error('[handleCreateDeal] Erro na resposta:', errorText);
        throw new Error(`Erro ao criar negociação: ${response.status}`);
      }
    } catch (error) {
      console.error('[handleCreateDeal] Erro ao criar negociação:', error);
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
        fixed md:absolute right-0 top-0 bottom-0 md:h-full
        bg-white dark:bg-gray-900
        border-l border-gray-200 dark:border-gray-700
        shadow-2xl
        transition-all duration-200
        flex flex-col z-20
        ${isOpen ? "w-full md:w-[440px] opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none"}
      `}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 mt-[60px] md:mt-0">
        {/* Tabs */}
        <nav className="flex gap-6 px-8">
          <button
            onClick={() => setActiveView('info')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'info'
                ? 'border-gray-900 dark:border-blue-500 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Info className="w-4 h-4" />
            Informações
          </button>

          <button
            onClick={() => setActiveView('media')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'media'
                ? 'border-gray-900 dark:border-blue-500 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Mídias
          </button>

          <button
            onClick={() => setActiveView('notas')}
            className={`flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'notas'
                ? 'border-gray-900 dark:border-blue-500 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            Notas
          </button>
        </nav>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {activeView === 'info' ? (
            <div className="space-y-6">
            {/* Foto, Nome e Telefone */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              {selectedChat.profilePicUrl ? (
                <img
                  src={selectedChat.profilePicUrl}
                  alt={contactData?.nome || selectedChat.pushName}
                  className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white flex-shrink-0">
                  <User className="w-10 h-10" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white truncate mb-1.5">
                  {contactData?.nome || selectedChat.pushName}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">
                    {contactData?.telefone || selectedChat.remoteJid.replace(/\D/g, "")}
                  </span>
                </div>
                {contactData && onOpenContactModal && (
                  <button
                    onClick={onOpenContactModal}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver detalhes completos
                  </button>
                )}
              </div>
            </div>

            {/* Controle do Agente */}
            <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <GuimooIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />

                {/* Dropdown de Agentes */}
                <select
                  value={selectedAgentId || ""}
                  onChange={(e) => {
                    const newAgentId = Number(e.target.value) || null;
                    handleUpdateAgent(newAgentId);
                  }}
                  disabled={loadingAgents}
                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione um agente</option>
                  {agents.map((agent) => (
                    <option key={agent.Id} value={agent.Id}>
                      {agent.nome}
                      {agent.isAgentePrincipal ? " (Principal)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status da IA inline */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                {aiStatus.permanentExclusion ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Desativada permanentemente
                    </span>
                    <button
                      onClick={handleRemovePermanentExclusion}
                      disabled={updatingAI}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                      title="Remover exclusão permanente"
                    >
                      {updatingAI ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : aiStatus.intervention ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                      Pausada (intervenção)
                    </span>
                    <button
                      onClick={handleDeleteIntervention}
                      disabled={updatingAI}
                      className="p-1 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors disabled:opacity-50"
                      title="Reativar IA"
                    >
                      {updatingAI ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Ativa
                  </span>
                )}

              </div>

              {/* Ações da IA */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartAgent}
                  disabled={
                    updatingAI ||
                    aiStatus.intervention ||
                    aiStatus.permanentExclusion ||
                    activationCooldown
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-600 dark:border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title={activationCooldown ? "Aguarde antes de reativar" : "Ativar IA"}
                >
                  {updatingAI && (!aiStatus.intervention && !aiStatus.permanentExclusion) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4" />
                  )}
                  Ativar
                </button>

                <button
                  onClick={handlePauseAI}
                  disabled={updatingAI || aiStatus.intervention || aiStatus.permanentExclusion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-600 dark:border-yellow-500 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title="Pausar IA temporariamente"
                >
                  {updatingAI && !aiStatus.intervention && !aiStatus.permanentExclusion ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  Pausar
                </button>

                <button
                  onClick={handleDisableAI}
                  disabled={updatingAI || aiStatus.permanentExclusion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-600 dark:border-red-500 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title="Desativar IA permanentemente"
                >
                  {updatingAI && !aiStatus.permanentExclusion ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BanIcon className="w-4 h-4" />
                  )}
                  Desativar
                </button>
              </div>

              {/* Mensagem informativa de ativação */}
              {showActivationMessage && (
                <p className="text-sm text-gray-600 dark:text-gray-400 animate-fadeIn">
                  ✅ Requisição enviada. Aguarde até 1 minuto para a IA iniciar o atendimento.
                </p>
              )}
            </div>

            {/* Informações de CRM */}
            {dealData && (
              <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                {/* Grid 2 colunas: Responsável e Funil */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Responsável */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Users className="w-3.5 h-3.5" />
                      Responsável
                    </label>
                    <select
                      value={dealData.id_usuario || ""}
                      onChange={(e) => handleUpdateResponsavel(Number(e.target.value))}
                      className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                        !dealData.id_usuario ? 'text-gray-500 dark:text-gray-400' : ''
                      }`}
                    >
                      <option value="" disabled>Selecione</option>
                      {users.filter(user => user.isAtivo).map((user) => (
                        <option key={user.Id} value={user.Id}>
                          {user.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Funil */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Filter className="w-3.5 h-3.5" />
                      Funil
                    </label>
                    <select
                      value={dealData.id_funil || ""}
                      onChange={(e) => {
                        const funnelId = Number(e.target.value);
                        const firstStage = funnels.find((f) => f.id === funnelId)?.estagios?.[0];
                        if (firstStage) {
                          handleUpdateStage(funnelId, Number(firstStage.Id));
                        }
                      }}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Selecione</option>
                      {funnels.map((funnel) => (
                        <option key={funnel.id} value={funnel.id}>
                          {funnel.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estágio - full width */}
                {currentFunnel && (
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                      Estágio
                    </label>
                    <select
                      value={dealData.id_estagio || ""}
                      onChange={(e) =>
                        handleUpdateStage(dealData.id_funil, Number(e.target.value))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="">Selecione um estágio</option>
                      {currentFunnel.estagios?.map((stage) => (
                        <option key={stage.Id} value={stage.Id}>
                          {stage.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Etiquetas */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <TagIcon className="w-3.5 h-3.5" />
                    Etiquetas
                  </label>
                  {dealTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {dealTags.map((tag) => (
                        <div
                          key={tag.Id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: tag.cor,
                            color: tag.cor_texto,
                          }}
                        >
                          {tag.nome}
                          <button
                            onClick={() => handleRemoveTag(tag.Id)}
                            className="ml-1.5 hover:opacity-70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <select
                    onChange={(e) => {
                      const tagId = Number(e.target.value);
                      if (tagId) {
                        handleAddTag(tagId);
                        e.target.value = "";
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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

                {/* Departamentos */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Building2 className="w-3.5 h-3.5" />
                    Departamentos
                  </label>
                  {dealDepartamentos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {dealDepartamentos.map((dept) => (
                        <div
                          key={dept.Id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {dept.nome}
                          <button
                            onClick={() => handleRemoveDepartamento(dept.Id)}
                            className="ml-1.5 hover:opacity-70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <select
                    onFocus={fetchDepartamentos}
                    onChange={(e) => {
                      const deptId = Number(e.target.value);
                      if (deptId) {
                        handleAddDepartamento(deptId);
                        e.target.value = "";
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">+ Adicionar departamento</option>
                    {availableDepartamentos
                      .filter((dept) => !dealDepartamentos.find((dd) => dd.Id === dept.Id))
                      .map((dept) => (
                        <option key={dept.Id} value={dept.Id}>
                          {dept.nome}
                        </option>
                      ))}
                  </select>
                </div>
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
          </div>
        ) : activeView === 'media' ? (
          /* View de Mídias */
          <div className="space-y-4">

            {/* Sub-tabs de Mídias */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <button
                onClick={() => setActiveMediaTab('images')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeMediaTab === 'images'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Imagens</span>
              </button>

              <button
                onClick={() => setActiveMediaTab('videos')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeMediaTab === 'videos'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Vídeos</span>
              </button>

              <button
                onClick={() => setActiveMediaTab('docs')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeMediaTab === 'docs'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Docs</span>
              </button>
            </div>

            {/* Conteúdo das mídias */}
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
                          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
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
          </div>
        ) : activeView === 'notas' ? (
          /* View de Notas */
          <div className="space-y-4">
            {/* Formulário para nova nota */}
            <div className="bg-white dark:bg-gray-900/80 rounded-xl border border-gray-200/60 dark:border-gray-700/40 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Nova Nota</h3>

              <div className="relative mb-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escreva uma nova nota..."
                  className="w-full min-h-[100px] p-3 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 resize-y"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCreateNote}
                  disabled={!newNote.trim() || savingNote}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                >
                  {savingNote ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Nota</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de Notas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Histórico de Notas</h3>

              {notes.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200/60 dark:border-gray-700/40">
                  <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma nota registrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => {
                    const noteUser = users.find(u => u.Id === note.id_usuario);

                    return (
                      <div key={note.Id} className="bg-white dark:bg-gray-900/80 rounded-xl border border-gray-200/60 dark:border-gray-700/40 p-4 shadow-sm hover:shadow-md transition-all">
                        {editingNote?.Id === note.Id ? (
                          <div className="space-y-3">
                            <div className="relative">
                              {isQuillReady && (
                                <ReactQuill
                                  theme="snow"
                                  value={editingNote.descricao}
                                  onChange={(value) => setEditingNote({...editingNote, descricao: value})}
                                  modules={modules}
                                  formats={formats}
                                  className="bg-white dark:bg-neutral-800 rounded-lg [&_.ql-toolbar]:dark:bg-neutral-700 [&_.ql-toolbar]:dark:border-neutral-600 [&_.ql-container]:dark:bg-neutral-800 [&_.ql-container]:dark:border-neutral-600 [&_.ql-editor]:dark:text-white [&_.ql-editor.ql-blank::before]:dark:text-neutral-400 [&_.ql-stroke]:dark:stroke-neutral-200 [&_.ql-fill]:dark:fill-neutral-200 [&_.ql-picker-label]:dark:text-neutral-200"
                                />
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingNote(null)}
                                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleUpdateNote}
                                disabled={savingNote}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                              >
                                {savingNote ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Save className="w-3 h-3" />
                                )}
                                <span>Salvar</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">{noteUser?.nome || 'Usuário'}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(note.CreatedAt)} às {formatTime(note.CreatedAt)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingNote(note)}
                                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
                                      handleDeleteNote(note.Id);
                                    }
                                  }}
                                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* 🔒 HTML sanitizado para prevenir XSS */}
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.descricao) }}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal de Criar Negociação - Aparece quando não há deal */}
      {showCreateDealModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 m-4 max-w-xs w-full">
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
