import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  X,
  Settings,
  Edit3,
  Check,
  ChevronDown
} from 'lucide-react';

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
}

interface CRMUser {
  Id: number;
  nome: string;
}

interface AgentFunctionsSectionProps {
  token: string;
  canEdit: boolean;
}

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
  const [configTab, setConfigTab] = useState<'message' | 'guide' | 'recipients'>('message');

  // Campos de edição
  const [newFunctionName, setNewFunctionName] = useState('');
  const [editingMessage, setEditingMessage] = useState('');
  const [editingGuide, setEditingGuide] = useState('');
  const [editingName, setEditingName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Destinatários
  const [recipientType, setRecipientType] = useState<'' | 'numero' | 'usuario' | 'responsavel'>('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Brasil por padrão
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);

  // Mensagens
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
                : `Usuário ${user.Id}`
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
    return usuario ? usuario.nome : `Usuário #${id}`;
  };

  const showMessage = (message: string, type: 'error' | 'success') => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  const handleCreateFunction = async () => {
    if (!newFunctionName.trim()) {
      showMessage('Nome da notificação é obrigatório', 'error');
      return;
    }

    if (functions.length >= 5) {
      showMessage('Limite máximo de 5 notificações atingido', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          nome: newFunctionName.trim(),
          url: '',
          descricao: 'Configurar descrição',
          isAtivo: true,
          tipo: 'NOTIFICACAO',
          mensagem: ''
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      await fetchFunctions();
      setNewFunctionName('');
      setShowCreateModal(false);
      showMessage('Notificação criada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao criar função:', err);
      showMessage('Erro ao criar notificação. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFunction = async (func: AgentFunction) => {
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

  const handleOpenConfig = (func: AgentFunction) => {
    setSelectedFunction(func);
    setEditingMessage(func.mensagem || '');
    setEditingGuide(func.descricao || '');
    setEditingName(func.nome);
    setConfigTab('message');
    setShowConfigModal(true);
    setIsEditingName(false);
  };

  const handleSaveName = async () => {
    if (!selectedFunction) return;

    if (!editingName.trim()) {
      showMessage('O nome não pode estar vazio', 'error');
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
          nome: editingName.trim(),
          url: selectedFunction.url,
          descricao: selectedFunction.descricao,
          isAtivo: selectedFunction.isAtivo,
          tipo: selectedFunction.tipo,
          mensagem: selectedFunction.mensagem || ''
        })
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      // Atualizar imediatamente
      const novoNome = editingName.trim();
      setSelectedFunction(prev => prev ? { ...prev, nome: novoNome } : null);
      setFunctions(prev => prev.map(f =>
        f.id === selectedFunction.id ? { ...f, nome: novoNome } : f
      ));

      setIsEditingName(false);
      showMessage('Nome atualizado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao atualizar nome:', err);
      showMessage('Erro ao atualizar nome. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
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

      // Atualizar imediatamente
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

      // Atualizar imediatamente
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
      // Concatena o código do país (sem +) com o número
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

      const response = await res.json();
      console.log('Resposta da API ao adicionar destinatário:', response);

      // A API retorna apenas {status: 'success'}, então precisamos fazer refresh
      // Recarregar todas as funções para pegar os dados atualizados
      await fetchFunctions();

      // Atualizar o selectedFunction com os dados mais recentes
      const updatedFunctionsRes = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/get', {
        headers: { token }
      });
      const updatedFunctions = await updatedFunctionsRes.json();

      const updatedFunction = Array.isArray(updatedFunctions)
        ? updatedFunctions.find((f: AgentFunction) => f.id === selectedFunction.id)
        : null;

      if (updatedFunction) {
        setSelectedFunction(updatedFunction);
        console.log('selectedFunction atualizado com dados do servidor:', updatedFunction);
      }

      // Limpar apenas os campos de dados, mantendo o tipo selecionado
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

      // Atualizar imediatamente o selectedFunction removendo o destinatário
      if (selectedFunction && selectedFunction.id === funcId) {
        setSelectedFunction(prev => prev ? {
          ...prev,
          atributos: prev.atributos.filter(a => a.id !== attrId)
        } : null);
      }

      // Atualizar a lista de funções
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
      `}</style>

      <div className="space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
                  Notificações no WhatsApp
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs font-medium rounded-full">
                    BETA
                  </span>
                </h2>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                  Configure e visualize as notificações automáticas enviadas pela IA
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{functions.length}/5</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Notificações</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Lista de Notificações */}
          <div className="space-y-3">
            {functions.map((func, index) => (
              <div
                key={func.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700/50 border border-gray-200 dark:border-neutral-600 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={func.isAtivo}
                      onChange={() => handleToggleFunction(func)}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-700 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-neutral-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                  </label>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-neutral-100">{func.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">{func.mensagem || 'Mensagem não configurada'}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFunctionToDelete(func.id);
                        setShowDeleteModal(true);
                      }}
                      disabled={saving}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Deletar notificação"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenConfig(func)}
                      className="p-2 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                      title="Configurar notificação"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {functions.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-neutral-400">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-neutral-600" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">Nenhuma notificação cadastrada</h4>
                <p className="text-gray-500 dark:text-neutral-400 mb-4">
                  Crie sua primeira notificação para começar a receber alertas automáticos.
                </p>
              </div>
            )}
          </div>

          {/* Botão Criar Nova */}
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={functions.length >= 5}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Criar Nova Notificação
              {functions.length >= 5 && <span className="text-xs">(Limite atingido)</span>}
            </button>
          )}
        </div>
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
                  Nome da Notificação
                </label>
                <input
                  type="text"
                  value={newFunctionName}
                  onChange={(e) => setNewFunctionName(e.target.value)}
                  placeholder="Ex: Contrato Enviado"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
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
              <div className="flex items-center gap-3 flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-emerald-500 dark:focus:border-emerald-400"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditingName(selectedFunction.nome);
                      }}
                      className="p-2 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Configurar Notificação – {selectedFunction.nome}</h3>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        title="Renomear"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-400 ml-4">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-neutral-700 px-6">
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

                          // Se não tiver label, não renderiza (evita cards vazios)
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
