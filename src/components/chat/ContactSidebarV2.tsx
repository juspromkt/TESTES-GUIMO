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
} from "lucide-react";
import type { Chat } from "./utils/api";
import { apiClient, clearApiCache, getCacheKey } from "./utils/api";
import type { Tag } from "../../types/tag";
import DealSummaryWidget from "../crm/DealSummaryWidget";

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

export default function ContactSidebarV2({
  isOpen,
  onToggle,
  selectedChat,
  onOpenContactModal,
}: ContactSidebarV2Props) {
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [dealData, setDealData] = useState<DealData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [funnels, setFunnels] = useState<Funil[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
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

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  // Load contact data
  const loadContactData = async () => {
    if (!selectedChat || !token) return;

    // Só mostra loading na primeira carga
    if (initialLoad) {
      setLoading(true);
    }

    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");

      // ⚡ Faz todas as requisições em PARALELO para carregar mais rápido
      const [contactRes, dealRes, usersRes, funnelsRes, tagsRes] = await Promise.all([
        // Contact info
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/contato/getByRemoteJid?remoteJid=${digits}`,
          { headers: { token } }
        ),
        // Deal data
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/chat/findDealsByContact`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", token },
            body: JSON.stringify({ remoteJid: selectedChat.remoteJid }),
          }
        ),
        // Users
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get`,
          { headers: { token } }
        ),
        // Funnels
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/funil/get`,
          { headers: { token } }
        ),
        // Tags
        fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/tag/list`,
          { headers: { token } }
        ),
      ]);

      // Process contact data
      if (contactRes.ok) {
        const contactText = await contactRes.text();
        if (contactText) {
          const contact = JSON.parse(contactText);
          const contactResult = Array.isArray(contact) ? contact[0] : contact;
          setContactData(contactResult);
          setEditedName(contactResult?.nome || "");
        }
      }

      // Process deal data
      if (dealRes.ok) {
        const dealText = await dealRes.text();
        if (dealText) {
          const deals = JSON.parse(dealText);
          if (Array.isArray(deals) && deals.length > 0) {
            const basicDeal = deals[0];
            console.log("[ContactSidebarV2] Deal básico recebido:", basicDeal);

            // Busca dados completos do deal incluindo id_usuario
            try {
              const fullDealRes = await fetch(
                `https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/getById?id=${basicDeal.Id}`,
                { headers: { token } }
              );

              if (fullDealRes.ok) {
                const fullDealData = await fullDealRes.json();
                const fullDeal = Array.isArray(fullDealData) ? fullDealData[0] : fullDealData;
                console.log("[ContactSidebarV2] Deal completo recebido:", fullDeal);
                setDealData(fullDeal);
              } else {
                console.warn("[ContactSidebarV2] Falha ao buscar deal completo, usando dados básicos");
                setDealData(basicDeal);
              }
            } catch (error) {
              console.error("[ContactSidebarV2] Erro ao buscar deal completo:", error);
              setDealData(basicDeal);
            }
          }
        }
      }

      // Process users
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      // Process funnels
      if (funnelsRes.ok) {
        const funnelsData = await funnelsRes.json();
        setFunnels(Array.isArray(funnelsData) ? funnelsData : []);
      }

      // Process tags
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(Array.isArray(tagsData) ? tagsData : []);
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

  // Load AI intervention info (usando apiClient - mesma lógica do MessageView)
  const loadInterventionInfo = async () => {
    if (!selectedChat || !token) return;

    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");
      console.log('[ContactSidebarV2] 🔍 Carregando status da IA para:', digits);

      // Limpa cache antes de buscar (garante dados frescos)
      clearApiCache([
        getCacheKey('findInterventionByRemoteJid', token, { remoteJid: digits }),
        getCacheKey('findPermanentExclusionByRemoteJid', token, { remoteJid: digits }),
      ]);

      // Usa apiClient (mesma lógica do MessageView)
      const [interventionData, permanentData, transferRes] = await Promise.all([
        apiClient.findInterventionByRemoteJid(token, digits).catch(() => null),
        apiClient.findPermanentExclusionByRemoteJid(token, digits).catch(() => null),
        fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/chat/transfer/get`, {
          headers: { token },
        }).catch(() => null),
      ]);

      console.log('[ContactSidebarV2] 📥 Dados recebidos:', {
        intervention: interventionData,
        permanent: permanentData
      });

      // Normaliza dados (aceita objeto ou primeiro item de array)
      const normalizeObj = (data: any) => {
        if (!data) return null;
        if (Array.isArray(data)) return data[0] || null;
        if (typeof data === 'object' && Object.keys(data).length > 0) return data;
        return null;
      };

      const intervention = normalizeObj(interventionData);
      const permanent = normalizeObj(permanentData);

      const hasIntervention = !!intervention && Object.keys(intervention).length > 0;
      const hasPermanent = !!permanent && Object.keys(permanent).length > 0;

      console.log('[ContactSidebarV2] ✅ Status detectado:', { hasIntervention, hasPermanent });

      const finalStatus = {
        intervention: hasIntervention && !hasPermanent, // Se tem permanente, ignora temporária
        permanentExclusion: hasPermanent,
      };

      console.log('[ContactSidebarV2] 🎯 Status final da IA:', finalStatus);
      setAiStatus(finalStatus);

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
      console.error("[ContactSidebarV2] ❌ Erro ao carregar status da IA:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContactData();
      loadInterventionInfo();
    }
  }, [selectedChat, token, isOpen]);

  // 🔄 Listener para recarregar status quando houver mudanças de outros componentes
  useEffect(() => {
    const handleSessionUpdate = () => {
      console.log('[ContactSidebarV2] 🔄 Evento sessions_updated detectado, recarregando...');
      loadInterventionInfo();
    };

    const handleContactUpdate = () => {
      console.log('[ContactSidebarV2] 🔄 Evento contactUpdated detectado, recarregando...');
      loadInterventionInfo();
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

  // Handlers (sincronizados com MessageView)
  const handleActivateAI = async () => {
    if (!selectedChat || !token) return;
    console.log('[ContactSidebarV2] 🟢 Iniciando ativação da IA');
    setUpdatingAI(true);

    // ✨ Atualização otimista - Muda estado imediatamente
    setAiStatus({
      intervention: false,
      permanentExclusion: false,
    });
    console.log('[ContactSidebarV2] ⚡ Estado otimista aplicado: IA ativa');

    try {
      // Ativa o agente (mesma API do MessageView)
      const response = await fetch(
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

      console.log('[ContactSidebarV2] 📡 Resposta ativação:', response.status, response.ok);

      // Aguarda 2 segundos (mesmo comportamento do MessageView)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Recarrega status real da API
      await loadInterventionInfo();
      window.dispatchEvent(new Event("contactUpdated"));

      // 🔔 Dispara evento de atualização em tempo real
      const { updateChatIAStatus } = await import('../../utils/chatUpdateEvents');
      console.log('[ContactSidebarV2] 🔔 Disparando evento de ativação da IA:', selectedChat.remoteJid);
      updateChatIAStatus(selectedChat.remoteJid, true);

      console.log('[ContactSidebarV2] ✅ IA ativada com sucesso');
    } catch (error) {
      console.error("[ContactSidebarV2] ❌ Erro ao ativar IA:", error);
      // Reverte estado otimista em caso de erro
      await loadInterventionInfo();
    } finally {
      setUpdatingAI(false);
    }
  };

  const handlePauseAI = async () => {
    if (!selectedChat || !token) return;
    console.log('[ContactSidebarV2] 🟡 Iniciando pausa da IA');
    setUpdatingAI(true);

    // ✨ Atualização otimista - Muda estado imediatamente
    setAiStatus({
      intervention: true,
      permanentExclusion: false,
    });
    console.log('[ContactSidebarV2] ⚡ Estado otimista aplicado: intervention=true');

    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");

      // Cria intervenção temporária (mesma API do MessageView)
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ remoteJid: digits }),
        }
      );

      console.log('[ContactSidebarV2] 📡 Resposta pausa:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}`);
      }

      // ⏱️ Aguarda 1 segundo para o banco processar antes de recarregar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🔔 Dispara evento de atualização em tempo real ANTES de recarregar
      const { updateChatIAStatus } = await import('../../utils/chatUpdateEvents');
      console.log('[ContactSidebarV2] 🔔 Disparando evento de pausa da IA:', selectedChat.remoteJid);
      updateChatIAStatus(selectedChat.remoteJid, false);

      window.dispatchEvent(new Event("contactUpdated"));

      // Recarrega status real da API (pode corrigir se algo estiver diferente)
      await loadInterventionInfo();

      console.log('[ContactSidebarV2] ✅ IA pausada com sucesso');
    } catch (error) {
      console.error("[ContactSidebarV2] ❌ Erro ao pausar IA:", error);
      // Reverte estado otimista em caso de erro
      await loadInterventionInfo();
    } finally {
      setUpdatingAI(false);
    }
  };

  const handleDisableAI = async () => {
    if (!selectedChat || !token) return;
    console.log('[ContactSidebarV2] 🔴 Iniciando desativação da IA');
    setUpdatingAI(true);

    // ✨ Atualização otimista - Muda estado imediatamente
    setAiStatus({
      intervention: false,
      permanentExclusion: true,
    });
    console.log('[ContactSidebarV2] ⚡ Estado otimista aplicado: permanentExclusion=true');

    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");

      // Cria exclusão permanente (mesma API do MessageView)
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ remoteJid: digits }),
        }
      );

      console.log('[ContactSidebarV2] 📡 Resposta desativação:', response.status, response.ok);

      if (!response.ok) {
        throw new Error(`API retornou status ${response.status}`);
      }

      // ⏱️ Aguarda 1 segundo para o banco processar antes de recarregar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🔔 Dispara evento de atualização em tempo real ANTES de recarregar
      const { updateChatIAStatus } = await import('../../utils/chatUpdateEvents');
      console.log('[ContactSidebarV2] 🔔 Disparando evento de desativação da IA:', selectedChat.remoteJid);
      updateChatIAStatus(selectedChat.remoteJid, false);

      window.dispatchEvent(new Event("contactUpdated"));

      // Recarrega status real da API (pode corrigir se algo estiver diferente)
      await loadInterventionInfo();

      console.log('[ContactSidebarV2] ✅ IA desativada com sucesso');
    } catch (error) {
      console.error("[ContactSidebarV2] ❌ Erro ao desativar IA:", error);
      // Reverte estado otimista em caso de erro
      await loadInterventionInfo();
    } finally {
      setUpdatingAI(false);
    }
  };

  const handleRemovePermanentExclusion = async () => {
    if (!selectedChat || !token) return;
    setUpdatingAI(true);
    try {
      const digits = selectedChat.remoteJid.replace(/\D/g, "");
      await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/delete/id?remoteJid=${digits}`,
        { method: "DELETE", headers: { token } }
      );

      await loadInterventionInfo();
      window.dispatchEvent(new Event("contactUpdated"));
    } catch (error) {
      console.error("Erro ao remover exclusão permanente:", error);
    } finally {
      setUpdatingAI(false);
    }
  };

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

      window.dispatchEvent(new Event("contactUpdated"));
    } catch (error) {
      console.error("Erro ao remover transferência:", error);
    } finally {
      setUpdatingAI(false);
    }
  };

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

    console.log("[ContactSidebarV2] Nome atualizado com sucesso");

    // Busca dados completos atualizados do contato
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
            const fullContactResult = Array.isArray(fullContact) ? fullContact[0] : fullContact;
            console.log("[ContactSidebarV2] Contato completo recarregado:", fullContactResult);
            setContactData(fullContactResult);
            setEditedName(fullContactResult?.nome || "");
          }
        }
      } catch (error) {
        console.error("[ContactSidebarV2] Erro ao recarregar contato completo:", error);
      }
    }

    // Dispara evento global para atualizar aba Contatos e CRM
    window.dispatchEvent(new Event("contactUpdated"));

    // 🔔 Dispara evento de atualização em tempo real
    const { updateChatName } = await import('../../utils/chatUpdateEvents');
    if (selectedChat?.remoteJid) {
      updateChatName(selectedChat.remoteJid, editedName.trim());
    }

    setEditingName(false);
  } catch (error) {
    console.error("Erro ao atualizar nome do contato:", error);
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
      window.dispatchEvent(new Event("contactUpdated"));

      // 🔔 Dispara evento de atualização em tempo real
      const { updateChatResponsible } = await import('../../utils/chatUpdateEvents');
      if (selectedChat?.remoteJid) {
        console.log('🔔 Disparando evento de atualização de responsável:', selectedChat.remoteJid, id_usuario);
        updateChatResponsible(selectedChat.remoteJid, id_usuario);
      }
    } catch (error) {
      console.error("Erro ao atualizar responsável:", error);
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
      window.dispatchEvent(new Event("contactUpdated"));

      // 🔔 Dispara evento de atualização em tempo real
      const { updateChatStage } = await import('../../utils/chatUpdateEvents');
      if (selectedChat?.remoteJid) {
        console.log('🔔 Disparando evento de atualização de estágio:', selectedChat.remoteJid, id_estagio);
        updateChatStage(selectedChat.remoteJid, String(id_estagio));
      }
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
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
      window.dispatchEvent(new Event("contactUpdated"));

      // 🔔 Dispara evento de atualização em tempo real
      const { updateChatTags } = await import('../../utils/chatUpdateEvents');
      if (selectedChat?.remoteJid) {
        const updatedTagIds = [...dealTags.map(t => t.Id), tagId];
        console.log('🔔 Disparando evento de atualização de tags:', selectedChat.remoteJid, updatedTagIds);
        updateChatTags(selectedChat.remoteJid, updatedTagIds);
      }
    } catch (error) {
      console.error("Erro ao adicionar etiqueta:", error);
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
      window.dispatchEvent(new Event("contactUpdated"));

      // 🔔 Dispara evento de atualização em tempo real
      const { updateChatTags } = await import('../../utils/chatUpdateEvents');
      if (selectedChat?.remoteJid) {
        const updatedTagIds = dealTags.map(t => t.Id).filter(id => id !== tagId);
        console.log('🔔 Disparando evento de remoção de tag:', selectedChat.remoteJid, updatedTagIds);
        updateChatTags(selectedChat.remoteJid, updatedTagIds);
      }
    } catch (error) {
      console.error("Erro ao remover etiqueta:", error);
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
        absolute right-0 top-0 h-full
        bg-white border-l border-gray-300 shadow-lg
        transition-all duration-300 ease-in-out
        flex flex-col z-40
        ${isOpen ? "w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden"}
      `}
    >
      {/* Header da sidebar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-300 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700 tracking-tight">
          Informações do Contato
        </h2>

        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && initialLoad ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Foto, Nome e Telefone */}
            <div className="rounded-xl border border-gray-300 p-4 bg-white space-y-3">
              <div className="flex items-center space-x-3">
                {selectedChat.profilePicUrl ? (
                  <img
                    src={selectedChat.profilePicUrl}
                    alt={contactData?.nome || selectedChat.pushName}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200"
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
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={savingName}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
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
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-semibold text-gray-900">
                      {contactData?.nome || selectedChat.pushName}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
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
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver contato completo</span>
                </button>
              )}
            </div>

            {/* Controle da IA */}
            <div className="rounded-xl border border-gray-300 p-4 bg-white space-y-3">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <Bot className="w-4 h-4" />
                <span>Controle da IA</span>
              </div>

              <div className="space-y-2">
                {aiStatus.permanentExclusion ? (
                  <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-xs text-red-700 font-medium">
                      IA desativada permanentemente
                    </span>
                    <button
                      onClick={handleRemovePermanentExclusion}
                      disabled={updatingAI}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
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
                  <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-xs text-yellow-700 font-medium">
                      IA pausada (intervenção)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-xs text-green-700 font-medium">
                      IA ativa
                    </span>
                  </div>
                )}

                {isTransferChat && (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <span className="text-xs text-yellow-800 font-medium">
                      Em transferência
                    </span>
                    <button
                      onClick={handleRemoveTransfer}
                      disabled={updatingAI}
                      className="p-1 text-yellow-700 hover:bg-yellow-100 rounded transition-colors disabled:opacity-50"
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
                    onClick={handleActivateAI}
                    disabled={updatingAI || (!aiStatus.intervention && !aiStatus.permanentExclusion)}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-green-300 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Ativar IA"
                  >
                    <PlayCircle className="w-4 h-4 text-green-600 mb-1" />
                    <span className="text-[10px] text-green-700 font-medium">Ativar</span>
                  </button>

                  <button
                    onClick={handlePauseAI}
                    disabled={updatingAI || aiStatus.intervention || aiStatus.permanentExclusion}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Pausar IA temporariamente"
                  >
                    <Pause className="w-4 h-4 text-yellow-600 mb-1" />
                    <span className="text-[10px] text-yellow-700 font-medium">Pausar</span>
                  </button>

                  <button
                    onClick={handleDisableAI}
                    disabled={updatingAI || aiStatus.permanentExclusion}
                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Desativar IA permanentemente"
                  >
                    <BanIcon className="w-4 h-4 text-red-600 mb-1" />
                    <span className="text-[10px] text-red-700 font-medium">Desativar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Responsável */}
            {dealData && (
              <div className="rounded-xl border border-gray-300 p-4 bg-white space-y-3">
                <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Responsável</span>
                </div>

                <select
                  value={dealData.id_usuario || ""}
                  onChange={(e) => handleUpdateResponsavel(Number(e.target.value))}
                  className={`w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    dealData.id_usuario ? 'text-gray-900 font-medium' : 'text-gray-500'
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
              <div className="rounded-xl border border-gray-300 p-4 bg-white space-y-3">
                <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
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
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="rounded-xl border border-gray-300 p-4 bg-white space-y-3">
                <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                  <TagIcon className="w-4 h-4" />
                  <span>Etiquetas</span>
                </div>

                {/* Tags atuais */}
                <div className="flex flex-wrap gap-2">
                  {dealTags.length > 0 ? (
                    dealTags.map((tag) => (
                      <div
                        key={tag.Id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: tag.cor,
                          color: tag.cor_texto,
                        }}
                      >
                        {tag.nome}
                        <button
                          onClick={() => handleRemoveTag(tag.Id)}
                          className="ml-1 hover:opacity-80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">Nenhuma etiqueta adicionada</p>
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
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md"
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
