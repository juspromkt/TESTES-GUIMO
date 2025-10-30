import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  X,
  Settings,
  Check,
  ChevronDown,
  Bell,
  UserCheck,
  UserX,
  FileText,
  FileCheck,
  Calendar,
  Building2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// ==================== INTERFACES ====================

interface AgentFunctionAttribute {
  id: number;
  id_funcao: number;
  nome?: string | null;
  descricao?: string | null;
  isAtivo: boolean;
  numero?: string | null;
  id_usuario?: number | null;
  notificar_usuario_responsavel?: boolean | null;
}

interface AgentFunction {
  id: number;
  nome: string;
  url: string;
  descricao: string;
  isAtivo: boolean;
  tipo: 'NOTIFICACAO';
  mensagem?: string;
  atributos: AgentFunctionAttribute[];
  isTemplate?: boolean; // Flag para identificar templates prontos
}

interface CRMUser {
  Id: number;
  nome: string;
  telefone?: string;
}

interface AgentFunctionsSectionProps {
  token: string;
  canEdit: boolean;
}

// ==================== CONSTANTES ====================

const MESSAGE_TAGS = [
  { label: 'Nome do lead', value: '{{nome}}' },
  { label: 'Telefone', value: '{{telefone}}' },
  { label: 'Resumo da conversa', value: '{{resumo}}' }
];

const COUNTRIES = [
  { code: '+55', country: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'CO', name: 'Colômbia', flag: '🇨🇴' },
  { code: '+51', country: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: '+52', country: 'MX', name: 'México', flag: '🇲🇽' },
  { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: '+34', country: 'ES', name: 'Espanha', flag: '🇪🇸' },
];

// ==================== TEMPLATES PRONTOS ====================

interface NotificationTemplate {
  key: string;
  nome: string;
  descricao_curta: string;
  mensagem: string;
  descricao_ia: string;
  icon: typeof Bell;
  colorClass: string;
  bgClass: string;
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    key: 'novo_lead',
    nome: 'Novo Lead Recebido',
    descricao_curta: 'Notifica quando um novo lead entra no sistema',
    mensagem: `\`🔵 NOVO LEAD RECEBIDO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}`,
    descricao_ia: 'Envie esta notificação IMEDIATAMENTE quando detectar que é o PRIMEIRO contato do lead. Situações que exigem esta notificação: primeira mensagem recebida no WhatsApp, novo número que nunca interagiu antes, qualquer lead iniciando conversa pela primeira vez. Envie mesmo que ele ainda não tenha informado o nome completo. Nunca deixe de enviar na primeira interação.',
    icon: Bell,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30'
  },
  {
    key: 'lead_qualificado',
    nome: 'Lead Qualificado',
    descricao_curta: 'Notifica quando um lead é qualificado pelo agente',
    mensagem: `\`🟢 LEAD QUALIFICADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
📋 *Resumo*: {{resumo}}`,
    descricao_ia: 'Envie esta notificação IMEDIATAMENTE após concluir a análise de viabilidade e identificar que o lead TEM CONDIÇÕES de processo.',
    icon: UserCheck,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  {
    key: 'lead_desqualificado',
    nome: 'Lead Desqualificado',
    descricao_curta: 'Notifica quando um lead é desqualificado',
    mensagem: `\`🔴 LEAD DESQUALIFICADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
❌ *Motivo*: {{resumo}}`,
    descricao_ia: 'Envie esta notificação IMEDIATAMENTE após concluir a análise de viabilidade e identificar que o lead NÃO TEM CONDIÇÕES de processo. Critérios de desqualificação: não quer processo judicial (quer só consultoria/dúvidas), saiu da empresa há mais de 2 anos, nunca trabalhou com carteira e nunca teve pagamento comprovável, caso sem viabilidade jurídica.',
    icon: UserX,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30'
  },
  {
    key: 'contrato_enviado',
    nome: 'Contrato Enviado',
    descricao_curta: 'Notifica quando um contrato é enviado ao cliente',
    mensagem: `\`🟣 CONTRATO ENVIADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
⏳ *Status*: Aguardando assinatura`,
    descricao_ia: 'Envie esta notificação IMEDIATAMENTE após enviar o link do contrato para o cliente. Situações que exigem esta notificação: você enviou o link de assinatura do contrato, compartilhou proposta comercial, enviou documento para análise/assinatura. Frases que indicam envio: "vou te enviar o link", "segue o link do contrato", "acabei de enviar", "clique no link para assinar". Nunca envie antes de compartilhar o link.',
    icon: FileText,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30'
  },
  {
    key: 'contrato_assinado',
    nome: 'Contrato Assinado',
    descricao_curta: 'Notifica quando um contrato é assinado',
    mensagem: `\`🟢 CONTRATO ASSINADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
🎉 *Status*: Cliente confirmado!`,
    descricao_ia: 'Envie esta notificação IMEDIATAMENTE quando o cliente CONFIRMAR que assinou o contrato. Situações que exigem esta notificação: cliente disse "já assinei", "acabei de assinar", "assinatura concluída", "já enviei assinado", ou qualquer confirmação explícita de que assinou. Esta notificação marca o fechamento do negócio. Nunca envie baseado apenas em promessa de assinar depois, apenas quando ele confirmar que JÁ ASSINOU.',
    icon: FileCheck,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30'
  },
  {
    key: 'reuniao_agendada',
    nome: 'Reunião Agendada',
    descricao_curta: 'Notifica quando uma reunião é agendada',
    mensagem: `\`🟠 REUNIÃO AGENDADA\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
📅 *Detalhes*: {{resumo}}`,
    descricao_ia: 'Envie esta notificação IMEDIATAMENTE quando o cliente ESCOLHER e CONFIRMAR um horário específico para a reunião. Situações que exigem esta notificação: cliente escolheu data e horário da lista que você ofereceu, confirmou disponibilidade para reunião agendada. Nunca envie apenas por oferecer horários, envie só após a confirmação do cliente.',
    icon: Calendar,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30'
  },
  {
    key: 'lead_cliente_escritorio',
    nome: 'Lead é Cliente do Escritório',
    descricao_curta: 'Notifica quando identificar que é um cliente existente',
    mensagem: `\`🟣 CLIENTE DO ESCRITÓRIO IDENTIFICADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
⚠️ *Atenção*: Necessário atendimento prioritário`,
    descricao_ia: 'Envie esta notificação IMEDIATAMENTE quando identificar que o lead JÁ É CLIENTE do escritório. Situações que exigem esta notificação: lead menciona processo anterior com o escritório, cita advogado do escritório que já o atendeu, diz "já sou cliente de vocês", menciona caso em andamento, reconhece relacionamento prévio. Esta notificação é CRÍTICA para atendimento prioritário e evitar constrangimentos. Envie mesmo que seja ex-cliente.',
    icon: Building2,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30'
  }
];

// ==================== COMPONENTE PRINCIPAL ====================

const AgentFunctionsSection: React.FC<AgentFunctionsSectionProps> = ({ token, canEdit }) => {
  const [functions, setFunctions] = useState<AgentFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuarios, setUsuarios] = useState<CRMUser[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [functionToDelete, setFunctionToDelete] = useState<number | null>(null);

  // Função selecionada para configuração
  const [selectedFunction, setSelectedFunction] = useState<AgentFunction | null>(null);
  const [configTab, setConfigTab] = useState<'message' | 'guide' | 'recipients'>('recipients');

  // Campos de edição
  const [newFunctionName, setNewFunctionName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(''); // '' = personalizado, ou key do template
  const [editingMessage, setEditingMessage] = useState('');
  const [editingGuide, setEditingGuide] = useState('');

  // Destinatários
  const [recipientType, setRecipientType] = useState<'' | 'numero' | 'usuario' | 'responsavel'>('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  // Mensagens - Sistema de Toast
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'error' | 'success' }>>([]);

  useEffect(() => {
    fetchFunctions();
    fetchUsuarios();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/get', {
        headers: { token }
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const data = await res.json();

      if (!data || (Array.isArray(data) && data.length === 0)) {
        setFunctions([]);
      } else if (Array.isArray(data)) {
        const notificationFunctions = data
          .filter(func => func && func.tipo === 'NOTIFICACAO')
          .map(func => ({
            ...func,
            atributos: normalizeAttributes(func)
          }));
        setFunctions(notificationFunctions);
      } else {
        setFunctions([]);
      }
    } catch (err) {
      console.error('Erro ao buscar funções', err);
      showMessage('Erro ao carregar funções. Tente novamente.', 'error');
      setFunctions([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeAttributes = (func: any): AgentFunctionAttribute[] => {
    if (!Array.isArray(func?.atributos)) return [];

    return func.atributos
      .filter((attr: any) => attr && typeof attr.id === 'number')
      .map((attr: any) => {
        let idUsuario: number | null = null;
        if (typeof attr.id_usuario === 'number' && Number.isFinite(attr.id_usuario)) {
          idUsuario = attr.id_usuario;
        } else if (typeof attr.id_usuario === 'string' && attr.id_usuario.trim() !== '') {
          const parsed = Number(attr.id_usuario);
          idUsuario = Number.isFinite(parsed) ? parsed : null;
        }

        const numero = typeof attr.numero === 'string' ? attr.numero.trim() : '';
        const rawNotify = attr.notificar_usuario_responsavel;
        const notifyResponsavel =
          typeof rawNotify === 'boolean'
            ? rawNotify
            : typeof rawNotify === 'number'
            ? rawNotify === 1
            : null;

        return {
          id: attr.id,
          id_funcao: typeof attr.id_funcao === 'number' ? attr.id_funcao : func.id,
          nome: typeof attr.nome === 'string' ? attr.nome : null,
          descricao: typeof attr.descricao === 'string' ? attr.descricao : null,
          isAtivo: attr.isAtivo !== false,
          numero: numero || null,
          id_usuario: idUsuario,
          notificar_usuario_responsavel: notifyResponsavel
        };
      });
  };

  const fetchUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', {
        headers: { token }
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const data = await res.json();

      if (Array.isArray(data)) {
        const validUsers = data
          .filter((user: any) => user && typeof user.Id === 'number')
          .map((user: any) => ({
            Id: user.Id,
            nome:
              typeof user.nome === 'string' && user.nome.trim().length > 0
                ? user.nome.trim()
                : `Usuário ${user.Id}`,
            telefone:
              typeof user.telefone === 'string' && user.telefone.trim().length > 0
                ? user.telefone.trim()
                : undefined
          }));
        setUsuarios(validUsers);
      } else {
        setUsuarios([]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários', err);
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const getUsuarioNome = (id?: number | null) => {
    if (!id) return '';
    const usuario = usuarios.find(user => user.Id === id);
    if (!usuario) return `Usuário #${id}`;

    // Se tem telefone, exibe nome + telefone
    if (usuario.telefone) {
      return `${usuario.telefone} - ${usuario.nome}`;
    }

    return usuario.nome;
  };

  const showMessage = (message: string, type: 'error' | 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleCreateFunction = async () => {
    if (!newFunctionName.trim()) {
      showMessage('Nome da notificação é obrigatório', 'error');
      return;
    }

    // Validar limite de 5 notificações criadas
    if (functions.length >= 5) {
      showMessage('Limite de 5 notificações atingido. Delete uma notificação para criar outra.', 'error');
      return;
    }

    setSaving(true);
    try {
      // Buscar dados do template se selecionado
      let mensagem = '';
      let descricao = 'Configurar descrição';

      if (selectedTemplate) {
        const template = NOTIFICATION_TEMPLATES.find(t => t.key === selectedTemplate);
        if (template) {
          mensagem = template.mensagem;
          descricao = template.descricao_ia;
        }
      }

      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          nome: newFunctionName.trim(),
          url: '',
          descricao: descricao,
          isAtivo: false, // Criar como inativo
          tipo: 'NOTIFICACAO',
          mensagem: mensagem
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      await fetchFunctions();
      setNewFunctionName('');
      setSelectedTemplate('');
      setShowCreateModal(false);
      showMessage('Notificação criada! Configure os destinatários para ativá-la.', 'success');
    } catch (err) {
      console.error('Erro ao criar função:', err);
      showMessage('Erro ao criar notificação. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFunction = async (func: AgentFunction) => {
    // Validar se tem destinatários ao tentar ativar
    if (!func.isAtivo && (!func.atributos || func.atributos.length === 0)) {
      showMessage('Adicione pelo menos um destinatário antes de ativar esta notificação', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id: func.id,
          nome: func.nome,
          url: func.url,
          descricao: func.descricao,
          isAtivo: !func.isAtivo,
          tipo: func.tipo,
          mensagem: func.mensagem || ''
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      await fetchFunctions();
      showMessage(`Notificação ${!func.isAtivo ? 'ativada' : 'desativada'} com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao atualizar função:', err);
      showMessage('Erro ao atualizar notificação. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFunction = async () => {
    if (!functionToDelete) return;

    setSaving(true);
    try {
      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/funcao/delete?id=${functionToDelete}`, {
        method: 'DELETE',
        headers: { token }
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      await fetchFunctions();
      setShowDeleteModal(false);
      setFunctionToDelete(null);
      showMessage('Notificação deletada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao deletar função:', err);
      showMessage('Erro ao deletar notificação. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenConfigModal = (func: AgentFunction, isTemplate: boolean = false) => {
    setSelectedFunction(func);
    setEditingMessage(func.mensagem || '');
    setEditingGuide(func.descricao || '');
    setConfigTab(isTemplate ? 'recipients' : 'message');
    setShowConfigModal(true);
  };

  const handleSaveMessage = async () => {
    if (!selectedFunction) return;

    if (!editingMessage.trim()) {
      showMessage('A mensagem não pode estar vazia', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id: selectedFunction.id,
          nome: selectedFunction.nome,
          url: selectedFunction.url,
          descricao: selectedFunction.descricao,
          isAtivo: selectedFunction.isAtivo,
          tipo: selectedFunction.tipo,
          mensagem: editingMessage.trim()
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const novaMensagem = editingMessage.trim();
      setSelectedFunction(prev => prev ? { ...prev, mensagem: novaMensagem } : null);
      setFunctions(prev => prev.map(f =>
        f.id === selectedFunction.id ? { ...f, mensagem: novaMensagem } : f
      ));

      showMessage('Mensagem salva com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar mensagem:', err);
      showMessage('Erro ao salvar mensagem. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGuide = async () => {
    if (!selectedFunction) return;

    if (!editingGuide.trim()) {
      showMessage('A guia para IA não pode estar vazia', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id: selectedFunction.id,
          nome: selectedFunction.nome,
          url: selectedFunction.url,
          descricao: editingGuide.trim(),
          isAtivo: selectedFunction.isAtivo,
          tipo: selectedFunction.tipo,
          mensagem: selectedFunction.mensagem || ''
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const novaGuia = editingGuide.trim();
      setSelectedFunction(prev => prev ? { ...prev, descricao: novaGuia } : null);
      setFunctions(prev => prev.map(f =>
        f.id === selectedFunction.id ? { ...f, descricao: novaGuia } : f
      ));

      showMessage('Guia para IA salva com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar guia:', err);
      showMessage('Erro ao salvar guia. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecipient = async () => {
    if (!selectedFunction) return;

    if (!recipientType) {
      showMessage('Selecione quem deve ser notificado', 'error');
      return;
    }

    const payload: {
      id_funcao: number;
      isAtivo: boolean;
      numero: string | null;
      id_usuario: number | null;
      notificar_usuario_responsavel: boolean;
    } = {
      id_funcao: selectedFunction.id,
      isAtivo: true,
      numero: null,
      id_usuario: null,
      notificar_usuario_responsavel: false
    };

    if (recipientType === 'numero') {
      const numero = recipientPhone.trim();
      if (!numero) {
        showMessage('Informe o número de telefone', 'error');
        return;
      }
      const countryCode = selectedCountry.code.replace('+', '');
      payload.numero = `${countryCode}${numero}`;
    } else if (recipientType === 'usuario') {
      const idUsuario = Number(recipientUserId);
      if (!idUsuario || !Number.isFinite(idUsuario)) {
        showMessage('Selecione um usuário', 'error');
        return;
      }
      payload.id_usuario = idUsuario;
    } else if (recipientType === 'responsavel') {
      payload.notificar_usuario_responsavel = true;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/atributo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      await fetchFunctions();

      const updatedFunctionsRes = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/get', {
        headers: { token }
      });
      const updatedFunctions = await updatedFunctionsRes.json();

      const updatedFunction = Array.isArray(updatedFunctions)
        ? updatedFunctions.find((f: AgentFunction) => f.id === selectedFunction.id)
        : null;

      if (updatedFunction) {
        setSelectedFunction(updatedFunction);
      }

      setRecipientPhone('');
      setRecipientUserId('');
      showMessage('Destinatário adicionado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao adicionar destinatário:', err);
      showMessage('Erro ao adicionar destinatário. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipient = async (attrId: number, funcId: number) => {
    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/atributo/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_funcao: funcId,
          id_atributo: attrId
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      if (selectedFunction && selectedFunction.id === funcId) {
        setSelectedFunction(prev => prev ? {
          ...prev,
          atributos: prev.atributos.filter(a => a.id !== attrId)
        } : null);
      }

      setFunctions(prev => prev.map(f =>
        f.id === funcId ? { ...f, atributos: f.atributos.filter(a => a.id !== attrId) } : f
      ));

      showMessage('Destinatário removido com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao deletar destinatário:', err);
      showMessage('Erro ao deletar destinatário. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 dark:text-emerald-400" />
        <span className="ml-2 text-gray-600 dark:text-neutral-400">Carregando notificações...</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
        .toast-enter {
          animation: slideInRight 0.3s ease-out forwards;
        }
        .toast-exit {
          animation: slideOutRight 0.3s ease-in forwards;
        }
      `}</style>

      {/* Toast Container - Fixed no canto direito superior */}
      {toasts.length > 0 && createPortal(
        <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-3 max-w-md">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-enter flex items-start gap-3 p-4 rounded-lg shadow-2xl border ${
                toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm font-medium">
                {toast.message}
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}

      <div className="space-y-12 max-w-[1400px] mx-auto">
        {/* Header Premium */}
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-20"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-neutral-100 dark:to-white bg-clip-text text-transparent">
                    Notificações no WhatsApp
                  </h1>
                  <span className="px-2.5 py-1 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-[10px] font-semibold tracking-wider rounded-full uppercase">
                    Beta
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1.5 font-light">
                  Configure notificações automáticas inteligentes enviadas pela IA
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
                {functions.length}
              </span>
              <span className="text-2xl font-light text-gray-400 dark:text-neutral-500">/</span>
              <span className="text-2xl font-light text-gray-400 dark:text-neutral-500">5</span>
            </div>
            <p className="text-xs font-medium text-gray-400 dark:text-neutral-500 tracking-wide uppercase">Notificações criadas</p>
            {functions.filter(f => f.isAtivo).length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {functions.filter(f => f.isAtivo).length} ativa{functions.filter(f => f.isAtivo).length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Botão Criar Nova Notificação */}
        {canEdit && (
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={functions.length >= 5}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500 disabled:hover:to-teal-600 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
              <span>Criar Nova Notificação</span>
            </button>
            <p className="text-xs text-gray-500 dark:text-neutral-400 font-light">
              {functions.length >= 5
                ? 'Limite de 5 notificações atingido'
                : `${5 - functions.length} de 5 disponível${5 - functions.length !== 1 ? 'is' : ''}`
              }
            </p>
          </div>
        )}

        {/* Lista de Notificações */}
        {functions.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {functions.map((func, index) => {
                // Buscar template correspondente para usar ícone e cores
                const matchedTemplate = NOTIFICATION_TEMPLATES.find(t => t.nome === func.nome);
                const IconComponent = matchedTemplate?.icon || Zap;
                const iconColorClass = matchedTemplate?.colorClass || 'text-indigo-600 dark:text-indigo-400';
                const iconBgClass = matchedTemplate?.bgClass || 'bg-indigo-100 dark:bg-indigo-900/30';

                return (
                  <div
                    key={func.id}
                    className="group relative bg-white dark:bg-neutral-900 border-2 border-gray-300 dark:border-neutral-700 rounded-2xl p-5 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Status Indicator */}
                    {func.isAtivo && (
                      <div className="absolute top-4 right-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></div>
                      </div>
                    )}

                    {/* Header: Icon, Nome & Toggle */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 ${iconBgClass} rounded-xl blur opacity-50`}></div>
                          <div className={`relative w-11 h-11 ${iconBgClass} rounded-xl flex items-center justify-center shadow-sm`}>
                            <IconComponent className={`w-5 h-5 ${iconColorClass}`} strokeWidth={2.5} />
                          </div>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {func.nome}
                        </h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={func.isAtivo}
                          onChange={() => handleToggleFunction(func)}
                          disabled={saving}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-600 peer-disabled:opacity-40 peer-disabled:cursor-not-allowed"></div>
                      </label>
                    </div>

                    {/* Mensagem Preview */}
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {func.mensagem || 'Mensagem não configurada'}
                      </p>
                    </div>

                    {/* Recipients Status */}
                    <div className="mb-4">
                      {func.atributos && func.atributos.length > 0 ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                          <Check className="w-3 h-3" strokeWidth={3} />
                          <span>{func.atributos.length} destinatário{func.atributos.length !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800/50">
                          <Bell className="w-3 h-3" strokeWidth={3} />
                          <span>Configure para ativar</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenConfigModal(func, false)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 rounded-xl hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all duration-200 text-sm font-medium group/btn"
                        >
                          <Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                          <span>Configurar</span>
                        </button>
                        <button
                          onClick={() => {
                            setFunctionToDelete(func.id);
                            setShowDeleteModal(true);
                          }}
                          disabled={saving}
                          className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-200 group/btn"
                          title="Deletar notificação"
                        >
                          <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200/60 dark:border-neutral-700/60 p-16 text-center">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-700 dark:to-neutral-800 rounded-full blur-xl opacity-50"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-700 dark:to-neutral-800 rounded-full flex items-center justify-center">
                <Bell className="w-10 h-10 text-gray-400 dark:text-neutral-500" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma notificação criada
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 font-light max-w-sm mx-auto">
              Comece criando sua primeira notificação automática usando um modelo pronto ou personalizado
            </p>
          </div>
        )}
      </div>

      {/* Modal: Criar Notificação */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}
             onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Nova Notificação</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Modelo
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    const templateKey = e.target.value;
                    setSelectedTemplate(templateKey);

                    // Se selecionou um template, preenche o nome automaticamente
                    if (templateKey) {
                      const template = NOTIFICATION_TEMPLATES.find(t => t.key === templateKey);
                      if (template) {
                        setNewFunctionName(template.nome);
                      }
                    } else {
                      setNewFunctionName('');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                >
                  <option value="">Personalizado (criar do zero)</option>
                  <optgroup label="Modelos Prontos">
                    {NOTIFICATION_TEMPLATES.map((template) => (
                      <option key={template.key} value={template.key}>
                        {template.nome}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {selectedTemplate && (
                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2">
                    {NOTIFICATION_TEMPLATES.find(t => t.key === selectedTemplate)?.descricao_curta}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Nome da Notificação
                </label>
                <input
                  type="text"
                  value={newFunctionName}
                  onChange={(e) => setNewFunctionName(e.target.value)}
                  placeholder="Ex: Contrato Enviado"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2">
                  {selectedTemplate ? 'Você pode editar o nome sugerido' : 'Digite um nome para sua notificação personalizada'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTemplate('');
                    setNewFunctionName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFunction}
                  disabled={saving || !newFunctionName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Criar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Configurar Notificação */}
      {showConfigModal && selectedFunction && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}
             onClick={() => setShowConfigModal(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-3xl w-full shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}
               onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Configurar – {selectedFunction.nome}</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-neutral-700 px-6">
              {!selectedFunction.isTemplate && (
                <>
                  <button
                    onClick={() => setConfigTab('message')}
                    className={`px-4 py-3 font-medium transition-colors ${
                      configTab === 'message'
                        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    Mensagem
                  </button>
                  <button
                    onClick={() => setConfigTab('guide')}
                    className={`px-4 py-3 font-medium transition-colors ${
                      configTab === 'guide'
                        ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                    }`}
                  >
                    Guia IA
                  </button>
                </>
              )}
              <button
                onClick={() => setConfigTab('recipients')}
                className={`px-4 py-3 font-medium transition-colors ${
                  configTab === 'recipients'
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                }`}
              >
                Destinatários
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {configTab === 'message' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                      Mensagem da Notificação
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {MESSAGE_TAGS.map(tag => (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => setEditingMessage(prev => prev + tag.value)}
                          className="px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          {tag.value}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={5}
                      value={editingMessage}
                      onChange={e => setEditingMessage(e.target.value)}
                      placeholder="Contrato enviado com sucesso para {{nome}} ({{telefone}})."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 resize-vertical placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 dark:text-neutral-400 mt-2">
                      Utilize as tags acima para personalizar a mensagem com dados do lead.
                    </p>
                  </div>
                </div>
              )}

              {configTab === 'guide' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                      Guia para IA
                    </label>
                    <textarea
                      rows={6}
                      value={editingGuide}
                      onChange={e => setEditingGuide(e.target.value)}
                      placeholder="Use esta notificação quando o cliente receber o contrato via WhatsApp."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 resize-vertical placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                      maxLength={500}
                    />
                  </div>
                </div>
              )}

              {configTab === 'recipients' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-4">Adicionar Novo Destinatário</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                          Quem deve ser notificado?
                        </label>
                        <select
                          value={recipientType}
                          onChange={e => {
                            setRecipientType(e.target.value as any);
                            setRecipientPhone('');
                            setRecipientUserId('');
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                        >
                          <option value="">Selecione uma opção</option>
                          <option value="numero">Número de telefone</option>
                          <option value="usuario">Usuário específico</option>
                          <option value="responsavel">Responsável pela negociação</option>
                        </select>
                      </div>

                      {recipientType === 'numero' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                            Número de telefone
                          </label>
                          <div className="flex gap-2">
                            <div className="relative" ref={countryDropdownRef}>
                              <button
                                type="button"
                                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                className="h-[42px] w-[120px] pl-3 pr-2 py-2 flex items-center gap-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
                              >
                                <span className="text-2xl">{selectedCountry.flag}</span>
                                <span className="text-sm text-gray-900 dark:text-neutral-100">{selectedCountry.code}</span>
                                <ChevronDown className="w-4 h-4 ml-auto text-gray-400 dark:text-neutral-500" />
                              </button>

                              {isCountryDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-[240px] max-h-[300px] overflow-y-auto bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg z-50">
                                  {COUNTRIES.map((country) => (
                                    <button
                                      key={country.country}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCountry(country);
                                        setIsCountryDropdownOpen(false);
                                      }}
                                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-600 text-left transition-colors"
                                    >
                                      <span className="text-2xl">{country.flag}</span>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">{country.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-neutral-400">{country.code}</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            <input
                              type="tel"
                              placeholder="(11) 98888-8888"
                              value={recipientPhone}
                              onChange={e => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                              maxLength={15}
                            />
                          </div>
                        </div>
                      )}

                      {recipientType === 'usuario' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                            Usuário
                          </label>
                          <select
                            value={recipientUserId}
                            onChange={e => setRecipientUserId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                            disabled={loadingUsuarios || usuarios.length === 0}
                          >
                            <option value="">Selecione um usuário</option>
                            {usuarios.map(user => (
                              <option key={user.Id} value={user.Id}>
                                {user.nome}
                              </option>
                            ))}
                          </select>
                          {loadingUsuarios && (
                            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Carregando usuários...</p>
                          )}
                          {!loadingUsuarios && usuarios.length === 0 && (
                            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Nenhum usuário disponível</p>
                          )}
                        </div>
                      )}

                      {recipientType === 'responsavel' && (
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <p className="text-sm text-gray-700 dark:text-neutral-300">
                            O responsável atual da negociação receberá esta notificação automaticamente.
                          </p>
                        </div>
                      )}

                      {recipientType && (
                        <button
                          onClick={handleAddRecipient}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Adicionando...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Adicionar Destinatário
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recipients List */}
                  <div>
                    {selectedFunction.atributos && selectedFunction.atributos.length > 0 ? (
                      <div className="space-y-2">
                        {selectedFunction.atributos.map(attr => {
                          let label = '';
                          let description = '';

                          if (attr.numero) {
                            label = 'Número de Telefone';
                            description = attr.numero;
                          } else if (attr.id_usuario) {
                            label = 'Usuário Específico';
                            description = getUsuarioNome(attr.id_usuario);
                          } else if (attr.notificar_usuario_responsavel) {
                            label = 'Responsável pela Negociação';
                            description = 'O responsável atual da negociação receberá esta notificação automaticamente.';
                          }

                          if (!label) {
                            return null;
                          }

                          return (
                            <div
                              key={attr.id}
                              className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700/50 border border-gray-200 dark:border-neutral-600 rounded-lg p-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">{label}</p>
                                <p className="text-xs text-gray-600 dark:text-neutral-400 break-all">{description}</p>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => handleDeleteRecipient(attr.id, attr.id_funcao)}
                                  disabled={saving}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors ml-2 flex-shrink-0"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                        <p className="text-sm">Nenhum destinatário cadastrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-neutral-700">
              {configTab === 'message' && (
                <button
                  onClick={handleSaveMessage}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Mensagem'
                  )}
                </button>
              )}
              {configTab === 'guide' && (
                <button
                  onClick={handleSaveGuide}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Guia'
                  )}
                </button>
              )}
              {configTab === 'recipients' && (
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors font-medium"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}
             onClick={() => { setShowDeleteModal(false); setFunctionToDelete(null); }}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Deletar Notificação</h3>
              <p className="text-gray-600 dark:text-neutral-400 mb-6">
                Tem certeza que deseja deletar esta notificação? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setFunctionToDelete(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteFunction}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deletando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AgentFunctionsSection;
