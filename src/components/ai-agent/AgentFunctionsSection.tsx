import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Loader2,
  X,
  Settings,
  Check,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Bell,
  UserCheck,
  UserX,
  FileText,
  FileCheck,
  Calendar,
  Building2,
  ChevronDown,
  ChevronRight
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
  isAtivo: boolean;
}

interface AgentFunctionsSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
}

// ==================== CONSTANTES ====================

const MESSAGE_TAGS = [
  { label: 'Nome do lead', value: '{{nome}}' },
  { label: 'Telefone', value: '{{telefone}}' },
  { label: 'Resumo da conversa', value: '{{resumo}}' }
];

// ==================== TEMPLATES PRONTOS ====================

interface NotificationTemplate {
  key: string;
  nome: string;
  descricao_curta: string;
  mensagem: string;
  descricao_ia: string;
  icon: any;
  colorClass: string;
  bgClass: string;
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    key: 'novo_lead',
    nome: 'Novo Lead Recebido',
    descricao_curta: 'Notifica quando um novo lead entra no sistema',
    mensagem: `> Guimoo
\`🔵 NOVO LEAD RECEBIDO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}`,
    descricao_ia: '',
    icon: Bell,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30'
  },
  {
    key: 'lead_qualificado',
    nome: 'Lead Qualificado',
    descricao_curta: 'Notifica quando um lead é qualificado pelo agente',
    mensagem: `> Guimoo
\`🟢 LEAD QUALIFICADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
📋 *Resumo*: {{resumo}}`,
    descricao_ia: '',
    icon: UserCheck,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  {
    key: 'lead_desqualificado',
    nome: 'Lead Desqualificado',
    descricao_curta: 'Notifica quando um lead é desqualificado',
    mensagem: `> Guimoo
\`🔴 LEAD DESQUALIFICADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
❌ *Motivo*: {{resumo}}`,
    descricao_ia: '',
    icon: UserX,
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30'
  },
  {
    key: 'contrato_enviado',
    nome: 'Contrato Enviado',
    descricao_curta: 'Notifica quando um contrato é enviado ao cliente',
    mensagem: `> Guimoo
\`🟣 CONTRATO ENVIADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
⏳ *Status*: Aguardando assinatura`,
    descricao_ia: '',
    icon: FileText,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30'
  },
  {
    key: 'contrato_assinado',
    nome: 'Contrato Assinado',
    descricao_curta: 'Notifica quando um contrato é assinado',
    mensagem: `> Guimoo
\`🟢 CONTRATO ASSINADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
🎉 *Status*: Cliente confirmado!`,
    descricao_ia: '',
    icon: FileCheck,
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30'
  },
  {
    key: 'reuniao_agendada',
    nome: 'Reunião Agendada',
    descricao_curta: 'Notifica quando uma reunião é agendada',
    mensagem: `> Guimoo
\`🟠 REUNIÃO AGENDADA\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
📅 *Detalhes*: {{resumo}}`,
    descricao_ia: '',
    icon: Calendar,
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30'
  },
  {
    key: 'lead_cliente_escritorio',
    nome: 'Lead é Cliente do Escritório',
    descricao_curta: 'Notifica quando identificar que é um cliente existente',
    mensagem: `> Guimoo
\`🟣 CLIENTE DO ESCRITÓRIO IDENTIFICADO\`

👤 *Cliente*: {{nome}}
📞 *WhatsApp*: {{telefone}}
⚠️ *Atenção*: Necessário atendimento prioritário`,
    descricao_ia: '',
    icon: Building2,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-100 dark:bg-indigo-900/30'
  }
];

// ==================== COMPONENTE PRINCIPAL ====================

const AgentFunctionsSection: React.FC<AgentFunctionsSectionProps> = ({ token, idAgente, canEdit }) => {
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
  const [showBulkRecipientsModal, setShowBulkRecipientsModal] = useState(false);

  // Função selecionada para configuração
  const [selectedFunction, setSelectedFunction] = useState<AgentFunction | null>(null);
  const [configTab, setConfigTab] = useState<'message' | 'recipients'>('recipients');

  // Campos de edição
  const [newFunctionName, setNewFunctionName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(''); // '' = personalizado, ou key do template
  const [editingMessage, setEditingMessage] = useState('');

  // Destinatários
  const [recipientType, setRecipientType] = useState<'' | 'numero' | 'usuario' | 'responsavel'>('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');

  // Destinatários em massa
  const [bulkRecipientType, setBulkRecipientType] = useState<'' | 'numero' | 'usuario' | 'responsavel'>('');
  const [bulkRecipientPhone, setBulkRecipientPhone] = useState('');
  const [bulkRecipientUserId, setBulkRecipientUserId] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [bulkModalTab, setBulkModalTab] = useState<'add' | 'remove'>('add');
  const [selectedRecipientsToRemove, setSelectedRecipientsToRemove] = useState<number[]>([]);
  const [expandedRecipientId, setExpandedRecipientId] = useState<number | null>(null);
  const [selectedNotificationsToRemove, setSelectedNotificationsToRemove] = useState<number[]>([]);

  // Mensagens - Sistema de Toast
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'error' | 'success' }>>([]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchUsuarios();
      await migrateMessagesWithHeader();
      await fetchFunctions(); // Recarrega as funções após a migração
    };
    initializeData();
  }, []);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/geral', {
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
                : undefined,
            isAtivo: typeof user.isAtivo === 'boolean' ? user.isAtivo : true
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

  const migrateMessagesWithHeader = async () => {
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/get', {
        headers: { token }
      });

      if (!res.ok) return;

      const data = await res.json();

      if (!Array.isArray(data)) return;

      const notificationFunctions = data.filter(func => func && func.tipo === 'NOTIFICACAO');

      // Identifica notificações que precisam de migração
      const functionsToMigrate = notificationFunctions.filter(func => {
        const mensagem = func.mensagem || '';
        // Verifica se a mensagem já tem o cabeçalho ou está vazia
        return mensagem.length > 0 && !mensagem.startsWith('> Guimoo\n');
      });

      if (functionsToMigrate.length === 0) return;

      // Migra cada notificação
      for (const func of functionsToMigrate) {
        // Remove o cabeçalho antigo com \n\n se existir
        let cleanMessage = func.mensagem.replace(/^> Guimoo\n\n/, '');
        const formattedMessage = `> Guimoo\n${cleanMessage}`;

        await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/update', {
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
            isAtivo: func.isAtivo,
            tipo: func.tipo,
            mensagem: formattedMessage
          })
        });
      }

      console.log(`Migração concluída: ${functionsToMigrate.length} notificações atualizadas com o cabeçalho "Guimoo"`);
    } catch (err) {
      console.error('Erro na migração automática:', err);
    }
  };

  const handleCreateAllDefaultNotifications = async () => {
    setSaving(true);
    try {
      const createdNotifications = [];

      for (const template of NOTIFICATION_TEMPLATES) {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            id_agente: idAgente,
            nome: template.nome,
            url: '',
            descricao: template.descricao_ia,
            isAtivo: true,
            tipo: 'NOTIFICACAO',
            mensagem: template.mensagem
          })
        });

        if (res.ok) {
          const data = await res.json();
          createdNotifications.push(data);
        }
      }

      await fetchFunctions();
      showMessage(`${createdNotifications.length} notificações padrão criadas com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao criar notificações padrão:', err);
      showMessage('Erro ao criar notificações padrão. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFunction = async () => {
    if (!newFunctionName.trim()) {
      showMessage('Nome da notificação é obrigatório', 'error');
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

      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_agente: idAgente,
          nome: newFunctionName.trim(),
          url: '',
          descricao: descricao,
          isAtivo: true,
          tipo: 'NOTIFICACAO',
          mensagem: mensagem
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const newFunction = await res.json();

      // Atualizar lista local sem recarregar
      setFunctions(prev => [...prev, {
        ...newFunction,
        atributos: []
      }]);

      setNewFunctionName('');
      setSelectedTemplate('');
      setShowCreateModal(false);
      showMessage('Notificação criada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao criar função:', err);
      showMessage('Erro ao criar notificação. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };


  const handleDeleteFunction = async () => {
    if (!functionToDelete) return;

    setSaving(true);
    try {
      const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/delete?id=${functionToDelete}`, {
        method: 'DELETE',
        headers: { token }
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      // Atualizar lista local sem recarregar
      setFunctions(prev => prev.filter(f => f.id !== functionToDelete));

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
    // Remove o cabeçalho "> Guimoo\n" se existir, para mostrar apenas a mensagem base
    const mensagemSemCabecalho = func.mensagem?.replace(/^> Guimoo\n/, '') || '';
    setEditingMessage(mensagemSemCabecalho);
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
      // Adiciona automaticamente o cabeçalho "> Guimoo" antes de salvar
      const baseMessage = editingMessage.trim();
      const formattedMessage = `> Guimoo\n${baseMessage}`;

      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/update', {
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
          mensagem: formattedMessage
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      setSelectedFunction(prev => prev ? { ...prev, mensagem: formattedMessage } : null);
      setFunctions(prev => prev.map(f =>
        f.id === selectedFunction.id ? { ...f, mensagem: formattedMessage } : f
      ));

      showMessage('Mensagem salva com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar mensagem:', err);
      showMessage('Erro ao salvar mensagem. Tente novamente.', 'error');
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
      if (numero.length < 12 || numero.length > 13) {
        showMessage('Número inválido. Use o formato: 55 (DD) 99999-9999', 'error');
        return;
      }
      payload.numero = numero;
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
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const newAttribute = await res.json();

      // Atualizar lista local sem recarregar
      if (selectedFunction) {
        // Garantir que o atributo tenha todos os campos necessários
        const completeAttribute = {
          id: newAttribute.id || newAttribute.Id,
          id_funcao: newAttribute.id_funcao || selectedFunction.id,
          numero: newAttribute.numero || payload.numero,
          id_usuario: newAttribute.id_usuario || payload.id_usuario,
          notificar_usuario_responsavel: newAttribute.notificar_usuario_responsavel || payload.notificar_usuario_responsavel,
          isAtivo: newAttribute.isAtivo !== undefined ? newAttribute.isAtivo : true,
          nome: newAttribute.nome || null
        };

        const updatedFunction = {
          ...selectedFunction,
          atributos: [...selectedFunction.atributos, completeAttribute]
        };

        setSelectedFunction(updatedFunction);
        setFunctions(prev => prev.map(f =>
          f.id === selectedFunction.id ? updatedFunction : f
        ));
      }

      setRecipientPhone('');
      setRecipientUserId('');
      setRecipientType('');
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
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/delete', {
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

  const handleBulkAddRecipient = async () => {
    if (selectedNotifications.length === 0) {
      showMessage('Selecione pelo menos uma notificação', 'error');
      return;
    }

    if (!bulkRecipientType) {
      showMessage('Selecione quem deve ser notificado', 'error');
      return;
    }

    const payload: any = {
      isAtivo: true
    };

    if (bulkRecipientType === 'numero') {
      const numero = bulkRecipientPhone.trim();
      if (!numero) {
        showMessage('Informe o número de telefone', 'error');
        return;
      }
      if (numero.length < 12 || numero.length > 13) {
        showMessage('Número inválido. Use o formato: 55 (DD) 99999-9999', 'error');
        return;
      }
      payload.numero = numero;
    } else if (bulkRecipientType === 'usuario') {
      const idUsuario = Number(bulkRecipientUserId);
      if (!idUsuario || !Number.isFinite(idUsuario)) {
        showMessage('Selecione um usuário', 'error');
        return;
      }
      payload.id_usuario = idUsuario;
    } else if (bulkRecipientType === 'responsavel') {
      payload.notificar_usuario_responsavel = true;
    }

    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const funcId of selectedNotifications) {
        try {
          const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              ...payload,
              id_funcao: funcId
            })
          });

          if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

          const newAttribute = await res.json();

          // Atualizar lista local
          const targetFunction = functions.find(f => f.id === funcId);
          if (targetFunction) {
            const completeAttribute = {
              id: newAttribute.id || newAttribute.Id,
              id_funcao: newAttribute.id_funcao || funcId,
              numero: newAttribute.numero || payload.numero,
              id_usuario: newAttribute.id_usuario || payload.id_usuario,
              notificar_usuario_responsavel: newAttribute.notificar_usuario_responsavel || payload.notificar_usuario_responsavel,
              isAtivo: newAttribute.isAtivo !== undefined ? newAttribute.isAtivo : true,
              nome: newAttribute.nome || null
            };

            const updatedFunction = {
              ...targetFunction,
              atributos: [...targetFunction.atributos, completeAttribute]
            };

            setFunctions(prev => prev.map(f =>
              f.id === funcId ? updatedFunction : f
            ));
          }

          successCount++;
        } catch (err) {
          console.error(`Erro ao adicionar destinatário na função ${funcId}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showMessage(`Destinatário adicionado em ${successCount} notificação(ões) com sucesso!`, 'success');
      }
      if (errorCount > 0) {
        showMessage(`Falha ao adicionar em ${errorCount} notificação(ões)`, 'error');
      }

      // Limpar campos
      setBulkRecipientPhone('');
      setBulkRecipientUserId('');
      setBulkRecipientType('');
      setSelectedNotifications([]);
      setShowBulkRecipientsModal(false);
    } catch (err) {
      console.error('Erro ao adicionar destinatários:', err);
      showMessage('Erro ao adicionar destinatários. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromSelectedNotifications = async (recipientId: number) => {
    if (selectedNotificationsToRemove.length === 0) {
      showMessage('Selecione pelo menos uma notificação', 'error');
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Encontrar o atributo de referência
      const firstSelectedAttr = functions
        .flatMap(f => f.atributos)
        .find(a => a.id === recipientId);

      if (!firstSelectedAttr) {
        showMessage('Destinatário não encontrado', 'error');
        return;
      }

      // Para cada notificação selecionada, encontrar e excluir o atributo correspondente
      for (const funcId of selectedNotificationsToRemove) {
        const func = functions.find(f => f.id === funcId);
        if (!func) continue;

        // Encontrar o atributo que corresponde ao destinatário
        const attrToDelete = func.atributos.find(attr => {
          if (firstSelectedAttr.numero && attr.numero === firstSelectedAttr.numero) return true;
          if (firstSelectedAttr.id_usuario && attr.id_usuario === firstSelectedAttr.id_usuario) return true;
          if (firstSelectedAttr.notificar_usuario_responsavel && attr.notificar_usuario_responsavel) return true;
          return false;
        });

        if (!attrToDelete) continue;

        try {
          const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/delete', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              token
            },
            body: JSON.stringify({
              id_funcao: funcId,
              id_atributo: attrToDelete.id
            })
          });

          if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

          // Atualizar lista local
          setFunctions(prev => prev.map(f =>
            f.id === funcId ? { ...f, atributos: f.atributos.filter(a => a.id !== attrToDelete.id) } : f
          ));

          successCount++;
        } catch (err) {
          console.error(`Erro ao excluir destinatário da função ${funcId}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        showMessage(`Destinatário removido de ${successCount} notificação(ões)!`, 'success');
      }
      if (errorCount > 0) {
        showMessage(`Falha ao remover de ${errorCount} notificação(ões)`, 'error');
      }

      setSelectedNotificationsToRemove([]);
      setExpandedRecipientId(null);
    } catch (err) {
      console.error('Erro ao remover destinatário:', err);
      showMessage('Erro ao remover destinatário. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkRemoveRecipients = async () => {
    if (selectedRecipientsToRemove.length === 0) {
      showMessage('Selecione pelo menos um destinatário para excluir', 'error');
      return;
    }

    setSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      // Criar mapa de destinatários selecionados com todos os seus IDs de atributos
      const recipientsToDelete = new Map<string, Array<{ attrId: number; funcId: number }>>();

      for (const selectedKey of selectedRecipientsToRemove) {
        // Encontrar todas as ocorrências deste destinatário em todas as notificações
        functions.forEach(func => {
          func.atributos.forEach(attr => {
            // Verificar se este atributo corresponde ao destinatário selecionado
            // O selectedKey na verdade é um attrId da primeira ocorrência, precisamos encontrar todos os atributos similares
            const firstSelectedAttr = functions
              .flatMap(f => f.atributos)
              .find(a => a.id === selectedKey);

            if (!firstSelectedAttr) return;

            let matches = false;
            if (firstSelectedAttr.numero && attr.numero === firstSelectedAttr.numero) {
              matches = true;
            } else if (firstSelectedAttr.id_usuario && attr.id_usuario === firstSelectedAttr.id_usuario) {
              matches = true;
            } else if (firstSelectedAttr.notificar_usuario_responsavel && attr.notificar_usuario_responsavel) {
              matches = true;
            }

            if (matches) {
              const key = `${selectedKey}`;
              if (!recipientsToDelete.has(key)) {
                recipientsToDelete.set(key, []);
              }
              recipientsToDelete.get(key)!.push({ attrId: attr.id, funcId: func.id });
            }
          });
        });
      }

      // Excluir todos os atributos encontrados
      for (const [key, attrList] of recipientsToDelete) {
        for (const { attrId, funcId } of attrList) {
          try {
            const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/atributo/delete', {
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

            // Atualizar lista local
            setFunctions(prev => prev.map(f =>
              f.id === funcId ? { ...f, atributos: f.atributos.filter(a => a.id !== attrId) } : f
            ));

            successCount++;
          } catch (err) {
            console.error(`Erro ao excluir destinatário ${attrId}:`, err);
            errorCount++;
          }
        }
      }

      if (successCount > 0) {
        showMessage(`${successCount} ocorrência(s) de destinatário(s) excluída(s) com sucesso!`, 'success');
      }
      if (errorCount > 0) {
        showMessage(`Falha ao excluir ${errorCount} ocorrência(s)`, 'error');
      }

      setSelectedRecipientsToRemove([]);
      if (successCount > 0 && errorCount === 0) {
        setShowBulkRecipientsModal(false);
      }
    } catch (err) {
      console.error('Erro ao excluir destinatários:', err);
      showMessage('Erro ao excluir destinatários. Tente novamente.', 'error');
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
                  <Bell className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-neutral-100 dark:to-white bg-clip-text text-transparent">
                  Notificações no WhatsApp
                </h1>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1.5 font-light">
                  Configure notificações automáticas inteligentes enviadas pela IA
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {functions.length > 0 && (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
                    {functions.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Notificação{functions.length !== 1 ? 'ões' : ''}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        {canEdit && functions.length > 0 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
              <span>Criar Nova Notificação</span>
            </button>
            <button
              onClick={() => setShowBulkRecipientsModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 group"
            >
              <UserCheck className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
              <span>Adicionar Destinatários</span>
            </button>
          </div>
        )}

        {/* Lista de Notificações */}
        {functions.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {functions.map((func, index) => {
                // Buscar template correspondente para usar ícone e cores
                const matchedTemplate = NOTIFICATION_TEMPLATES.find(t => t.nome === func.nome);
                const IconComponent = matchedTemplate?.icon || Bell;
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
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Nenhuma notificação criada
            </h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 font-light max-w-md mx-auto mb-8">
              Crie automaticamente todas as notificações padrão ou comece do zero criando uma notificação personalizada
            </p>
            {canEdit && (
              <div className="flex justify-center">
                <button
                  onClick={handleCreateAllDefaultNotifications}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" strokeWidth={2.5} />
                      Criar Notificações Padrão
                    </>
                  )}
                </button>
              </div>
            )}
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

      {/* Side Panel: Configurar Notificação */}
      {showConfigModal && selectedFunction && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-end" style={{ zIndex: 9999 }}
             onClick={() => setShowConfigModal(false)}>
          <div className="bg-white dark:bg-neutral-800 shadow-2xl flex flex-col h-full" style={{ width: '40%' }}
               onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Configurar – {selectedFunction.nome}</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-neutral-700 px-6">
              {!selectedFunction.isTemplate && (
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
                          <input
                            type="tel"
                            placeholder="55 (11) 99999-9999"
                            value={(() => {
                              const numbers = recipientPhone.replace(/\D/g, '');
                              if (numbers.length === 0) return '';
                              if (numbers.length <= 2) return numbers;
                              if (numbers.length <= 4) return `${numbers.slice(0, 2)} (${numbers.slice(2)}`;
                              if (numbers.length <= 9) return `${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`;
                              return `${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
                            })()}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '');
                              setRecipientPhone(value);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                            maxLength={19}
                          />
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                            Formato: 55 (DD) 99999-9999
                          </p>
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
                            {usuarios.filter(user => user.isAtivo).map(user => (
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
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-neutral-700 flex-shrink-0 bg-white dark:bg-neutral-800">
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

      {/* Side Panel: Adicionar Destinatários em Massa */}
      {showBulkRecipientsModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-end" style={{ zIndex: 9999 }}
             onClick={() => setShowBulkRecipientsModal(false)}>
          <div className="bg-white dark:bg-neutral-800 shadow-2xl flex flex-col h-full" style={{ width: '40%' }}
               onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Gerenciar Destinatários</h3>
              <button onClick={() => setShowBulkRecipientsModal(false)} className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-neutral-700 px-6">
              <button
                onClick={() => setBulkModalTab('add')}
                className={`px-4 py-3 font-medium transition-colors ${
                  bulkModalTab === 'add'
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                }`}
              >
                Adicionar
              </button>
              <button
                onClick={() => setBulkModalTab('remove')}
                className={`px-4 py-3 font-medium transition-colors ${
                  bulkModalTab === 'remove'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                }`}
              >
                Excluir
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-6">
              {bulkModalTab === 'add' ? (
                <div className="space-y-6">
                  {/* Seção: Dados do Destinatário */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-4">Dados do Destinatário</h3>

                    <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                        Quem deve ser notificado?
                      </label>
                      <select
                        value={bulkRecipientType}
                        onChange={e => setBulkRecipientType(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                      >
                        <option value="">Selecione...</option>
                        <option value="numero">Número de telefone</option>
                        <option value="usuario">Usuário específico</option>
                        <option value="responsavel">Responsável pelo lead</option>
                      </select>
                    </div>

                    {bulkRecipientType === 'numero' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                          Número de telefone
                        </label>
                        <input
                          type="tel"
                          placeholder="55 (11) 99999-9999"
                          value={(() => {
                            const numbers = bulkRecipientPhone.replace(/\D/g, '');
                            if (numbers.length === 0) return '';
                            if (numbers.length <= 2) return numbers;
                            if (numbers.length <= 4) return `${numbers.slice(0, 2)} (${numbers.slice(2)}`;
                            if (numbers.length <= 9) return `${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`;
                            return `${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
                          })()}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '');
                            setBulkRecipientPhone(value);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                          maxLength={19}
                        />
                        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                          Formato: 55 (DD) 99999-9999
                        </p>
                      </div>
                    )}

                    {bulkRecipientType === 'usuario' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                          Usuário
                        </label>
                        {loadingUsuarios ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                          </div>
                        ) : (
                          <select
                            value={bulkRecipientUserId}
                            onChange={e => setBulkRecipientUserId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                            disabled={loadingUsuarios || usuarios.length === 0}
                          >
                            <option value="">Selecione um usuário</option>
                            {usuarios.filter(user => user.isAtivo).map(user => (
                              <option key={user.Id} value={user.Id}>
                                {user.nome}
                              </option>
                            ))}
                          </select>
                        )}
                        {loadingUsuarios && (
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Carregando usuários...</p>
                        )}
                        {!loadingUsuarios && usuarios.length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Nenhum usuário disponível</p>
                        )}
                      </div>
                    )}

                    {bulkRecipientType === 'responsavel' && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          O responsável pelo lead será notificado automaticamente quando esta notificação for acionada.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seção: Selecionar Notificações */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-4">
                    Selecionar Notificações ({selectedNotifications.length} selecionada{selectedNotifications.length !== 1 ? 's' : ''})
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    {functions.map(func => {
                      const matchedTemplate = NOTIFICATION_TEMPLATES.find(t => t.nome === func.nome);
                      const IconComponent = matchedTemplate?.icon || Bell;
                      const iconColorClass = matchedTemplate?.colorClass || 'text-indigo-600 dark:text-indigo-400';
                      const iconBgClass = matchedTemplate?.bgClass || 'bg-indigo-100 dark:bg-indigo-900/30';
                      const isSelected = selectedNotifications.includes(func.id);

                      return (
                        <div
                          key={func.id}
                          onClick={() => {
                            setSelectedNotifications(prev =>
                              isSelected
                                ? prev.filter(id => id !== func.id)
                                : [...prev, func.id]
                            );
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${iconBgClass} flex items-center justify-center flex-shrink-0`}>
                              <IconComponent className={`w-5 h-5 ${iconColorClass}`} strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-neutral-100 truncate">
                                {func.nome}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                                {func.atributos.length} destinatário{func.atributos.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Aba de Excluir Destinatários */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-4">
                    Selecionar Destinatários para Excluir ({selectedRecipientsToRemove.length} selecionado{selectedRecipientsToRemove.length !== 1 ? 's' : ''})
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">
                    Selecione os destinatários que deseja remover. Eles serão excluídos de todas as notificações onde estão cadastrados.
                  </p>

                  <div className="space-y-2">
                    {(() => {
                      // Criar um mapa de destinatários únicos
                      const recipientsMap = new Map<string, { id: number; label: string; description: string; notificationCount: number }>();

                      functions.forEach(func => {
                        func.atributos.forEach(attr => {
                          let key = '';
                          let label = '';
                          let description = '';

                          if (attr.numero) {
                            key = `numero_${attr.numero}`;
                            const numero = attr.numero;
                            const formatted = numero.length === 13
                              ? `${numero.slice(0, 2)} (${numero.slice(2, 4)}) ${numero.slice(4, 9)}-${numero.slice(9, 13)}`
                              : numero.length === 12
                              ? `${numero.slice(0, 2)} (${numero.slice(2, 4)}) ${numero.slice(4, 8)}-${numero.slice(8, 12)}`
                              : numero;
                            label = formatted;
                            description = 'Número de telefone';
                          } else if (attr.id_usuario) {
                            key = `usuario_${attr.id_usuario}`;
                            const user = usuarios.find(u => u.Id === attr.id_usuario);
                            label = user ? user.nome : `Usuário ID ${attr.id_usuario}`;
                            description = user?.telefone || 'Usuário específico';
                          } else if (attr.notificar_usuario_responsavel) {
                            key = 'responsavel';
                            label = 'Responsável pela Negociação';
                            description = 'Responsável atual da negociação';
                          }

                          if (key && label) {
                            const existing = recipientsMap.get(key);
                            if (existing) {
                              existing.notificationCount++;
                              // Usar o primeiro ID encontrado
                            } else {
                              recipientsMap.set(key, {
                                id: attr.id,
                                label,
                                description,
                                notificationCount: 1
                              });
                            }
                          }
                        });
                      });

                      const uniqueRecipients = Array.from(recipientsMap.values());

                      if (uniqueRecipients.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                            <p className="text-sm">Nenhum destinatário cadastrado nas notificações.</p>
                          </div>
                        );
                      }

                      return uniqueRecipients.map(recipient => {
                        const isExpanded = expandedRecipientId === recipient.id;

                        // Encontrar todas as notificações onde este destinatário está
                        const recipientNotifications: Array<{ funcId: number; funcName: string; attrId: number }> = [];
                        const firstAttr = functions.flatMap(f => f.atributos).find(a => a.id === recipient.id);

                        if (firstAttr) {
                          functions.forEach(func => {
                            const matchingAttr = func.atributos.find(attr => {
                              if (firstAttr.numero && attr.numero === firstAttr.numero) return true;
                              if (firstAttr.id_usuario && attr.id_usuario === firstAttr.id_usuario) return true;
                              if (firstAttr.notificar_usuario_responsavel && attr.notificar_usuario_responsavel) return true;
                              return false;
                            });

                            if (matchingAttr) {
                              recipientNotifications.push({
                                funcId: func.id,
                                funcName: func.nome,
                                attrId: matchingAttr.id
                              });
                            }
                          });
                        }

                        return (
                          <div
                            key={recipient.id}
                            className="border-2 rounded-lg transition-all duration-200 border-gray-200 dark:border-neutral-700"
                          >
                            {/* Header do Card */}
                            <div
                              onClick={() => {
                                setExpandedRecipientId(isExpanded ? null : recipient.id);
                                setSelectedNotificationsToRemove([]);
                              }}
                              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/30 rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-neutral-400 flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-500 dark:text-neutral-400 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 dark:text-neutral-100 truncate">
                                      {recipient.label}
                                    </h4>
                                    <span className="flex-shrink-0 px-2 py-0.5 bg-gray-100 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded text-xs font-medium text-gray-700 dark:text-neutral-300">
                                      {recipient.notificationCount} notificação{recipient.notificationCount !== 1 ? 'ões' : ''}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 truncate">
                                    {recipient.description}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Conteúdo Expandido */}
                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-neutral-700 pt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                                  Notificações ({recipientNotifications.length})
                                </p>

                                {/* Lista de Notificações */}
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {recipientNotifications.map(notif => {
                                    const isNotifSelected = selectedNotificationsToRemove.includes(notif.funcId);
                                    const matchedTemplate = NOTIFICATION_TEMPLATES.find(t => t.nome === notif.funcName);
                                    const IconComponent = matchedTemplate?.icon || Bell;
                                    const iconColorClass = matchedTemplate?.colorClass || 'text-indigo-600 dark:text-indigo-400';
                                    const iconBgClass = matchedTemplate?.bgClass || 'bg-indigo-100 dark:bg-indigo-900/30';

                                    return (
                                      <div
                                        key={notif.funcId}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedNotificationsToRemove(prev =>
                                            isNotifSelected
                                              ? prev.filter(id => id !== notif.funcId)
                                              : [...prev, notif.funcId]
                                          );
                                        }}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                          isNotifSelected
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                            : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={`w-8 h-8 rounded-lg ${iconBgClass} flex items-center justify-center flex-shrink-0`}>
                                            <IconComponent className={`w-4 h-4 ${iconColorClass}`} strokeWidth={2} />
                                          </div>
                                          <span className="text-sm text-gray-900 dark:text-neutral-100 truncate flex-1">
                                            {notif.funcName}
                                          </span>
                                          {isNotifSelected && (
                                            <CheckCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" strokeWidth={2.5} />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Botões de Ação */}
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNotificationsToRemove(recipientNotifications.map(n => n.funcId));
                                    }}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors font-medium"
                                  >
                                    Selecionar Todas
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFromSelectedNotifications(recipient.id);
                                    }}
                                    disabled={saving || selectedNotificationsToRemove.length === 0}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                  >
                                    {saving ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Excluindo...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="w-4 h-4" />
                                        Excluir Selecionadas
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-neutral-700 flex-shrink-0 bg-white dark:bg-neutral-800">
              <button
                onClick={() => setShowBulkRecipientsModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              {bulkModalTab === 'add' ? (
                <button
                  onClick={handleBulkAddRecipient}
                  disabled={saving || selectedNotifications.length === 0 || !bulkRecipientType}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Adicionar Destinatário
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleBulkRemoveRecipients}
                  disabled={saving || selectedRecipientsToRemove.length === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Excluir Destinatário{selectedRecipientsToRemove.length !== 1 ? 's' : ''}
                    </>
                  )}
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
