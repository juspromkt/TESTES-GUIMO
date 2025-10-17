import { useState, useEffect } from "react";
import {
  ChevronRight,
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
  Trash2,
} from "lucide-react";
import type { Chat } from "./utils/api";
import { apiClient, clearApiCache, getCacheKey } from "./utils/api";
import type { Tag } from "../../types/tag";
import DealSummaryWidget from "../crm/DealSummaryWidget";
import { useChat } from "../../context/ChatContext";
import { toast } from "sonner";

interface ContactSidebarV2Props {
  isOpen: boolean;
  onToggle: () => void;
  selectedChat: Chat | null;
  onOpenContactModal?: () => void;
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
  if (typeof data === 'object' && Object.keys(data).length > 0) return data;
  return null;
};

const triggerGlobalRefresh = () => {
  window.dispatchEvent(new Event("sessions_updated"));
  window.dispatchEvent(new Event("contactUpdated"));
};

export default function ContactSidebarV2({
  isOpen,
  onToggle,
  selectedChat,
  onOpenContactModal,
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
  const [deletingSession, setDeletingSession] = useState(false);

  // Estados para cooldown de ativação da IA
  const [activationCooldown, setActivationCooldown] = useState(false);
  const [showActivationMessage, setShowActivationMessage] = useState(false);

  // Estados para informações de sessão
  const [sessionInfo, setSessionInfo] = useState<any | null>(null);
  const [interventionInfo, setInterventionInfo] = useState<any | null>(null);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;
  const selectedChatDigits = selectedChat?.remoteJid.replace(/\D/g, "");

  // Load contact data
  const loadContactData = async () => {
    if (!selectedChat || !token) return;

    if (initialLoad) {
      setLoading(true);
    }

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
                setDealData(fullDeal);
              } else {
                setDealData(basicDeal);
              }
            } catch (error) {
              console.error("[ContactSidebarV2] Erro ao buscar deal completo:", error);
              setDealData(basicDeal);
            }
          }
        }
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

  useEffect(() => {
    if (isOpen) {
      loadContactData();
      loadSessionInfo();
    }
  }, [selectedChat, token, isOpen]);

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

  // 🗑️ Excluir sessão
  const handleDeleteSession = async () => {
    if (!token || !sessionInfo || !selectedChatDigits) return;
    setDeletingSession(true);
    try {
      await apiClient.deleteSession(token, selectedChatDigits);
      toast.success('Sessão excluída');
      await loadSessionInfo();
    } catch (err) {
      console.error('Erro ao excluir sessão:', err);
      toast.error('Erro ao excluir sessão');
    } finally {
      setDeletingSession(false);
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

  if (!selectedChat) return null;

  const currentFunnel = funnels.find((f) => f.id === dealData?.id_funil);

  return (
    <div
      className={`
        fixed md:absolute right-0 top-[135px] md:top-0 bottom-0 md:h-full
        bg-white dark:bg-gray-800 border-l border-gray-300 dark:border-gray-700 shadow-lg
        transition-all duration-300 ease-in-out
        flex flex-col z-50
        ${isOpen ? "w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden"}
      `}
    >
      {/* Header da sidebar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-tight transition-colors duration-200">
          Informações do Contato
        </h2>

        <div className="flex items-center gap-2">
          {/* Botão Excluir Sessão */}
          {sessionInfo && (
            <button
              onClick={handleDeleteSession}
              disabled={deletingSession}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              title="Excluir sessão"
            >
              {deletingSession ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              <span>Excluir Sessão</span>
            </button>
          )}

          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && initialLoad ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin transition-colors duration-200" />
          </div>
        ) : (
          <>
            {/* Foto, Nome e Telefone */}
            <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4 bg-white dark:bg-gray-800 space-y-3 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                {selectedChat.profilePicUrl ? (
                  <img
                    src={selectedChat.profilePicUrl}
                    alt={contactData?.nome || selectedChat.pushName}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600 transition-colors duration-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-lg">
                    <User className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors duration-200"
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={savingName}
                        className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors duration-200"
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
                        className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3
                      className="font-semibold text-gray-900 dark:text-white transition-colors duration-200 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                      onClick={() => setEditingName(true)}
                    >
                      {contactData?.nome || selectedChat.pushName}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">
                    <Phone className="w-3 h-3" />
                    <span>
                      {contactData?.telefone ||
                        selectedChat.remoteJid.replace(/\D/g, "")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão Ver Contato Completo */}
              {contactData && onOpenContactModal && (
                <button
                  onClick={onOpenContactModal}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver contato completo</span>
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
        )}
      </div>
    </div>
  );
}
