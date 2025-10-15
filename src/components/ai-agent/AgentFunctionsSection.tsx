import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  Plus,
  Trash2,
  Loader2,
  X,
  Settings,
  Edit3,
  Check
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

  // Mensagens
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFunctions();
    fetchUsuarios();
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
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/atributo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const newAttr = await res.json();

      // Atualizar imediatamente o selectedFunction com o novo destinatário
      setSelectedFunction(prev => prev ? {
        ...prev,
        atributos: [...prev.atributos, newAttr]
      } : null);

      // Atualizar a lista de funções
      setFunctions(prev => prev.map(f =>
        f.id === selectedFunction.id ? { ...f, atributos: [...f.atributos, newAttr] } : f
      ));

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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="ml-2 text-gray-600">Carregando notificações...</span>
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
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Notificações no WhatsApp
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    BETA
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure e visualize as notificações automáticas enviadas pela IA
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{functions.length}/5</p>
              <p className="text-xs text-gray-500">Notificações</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Lista de Notificações */}
          <div className="space-y-3">
            {functions.map((func, index) => (
              <div
                key={func.id}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors animate-fadeIn"
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
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{func.nome}</p>
                    <p className="text-xs text-gray-500">{func.mensagem || 'Mensagem não configurada'}</p>
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
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Deletar notificação"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenConfig(func)}
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Configurar notificação"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {functions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação cadastrada</h4>
                <p className="text-gray-500 mb-4">
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
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Nova Notificação</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Notificação
                </label>
                <input
                  type="text"
                  value={newFunctionName}
                  onChange={(e) => setNewFunctionName(e.target.value)}
                  placeholder="Ex: Contrato Enviado"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateFunction}
                  disabled={saving || !newFunctionName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}
               onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setEditingName(selectedFunction.nome);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-gray-900">Configurar Notificação – {selectedFunction.nome}</h3>
                    {canEdit && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Renomear"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 ml-4">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setConfigTab('message')}
                className={`px-4 py-3 font-medium transition-colors ${
                  configTab === 'message'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mensagem
              </button>
              <button
                onClick={() => setConfigTab('guide')}
                className={`px-4 py-3 font-medium transition-colors ${
                  configTab === 'guide'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Guia IA
              </button>
              <button
                onClick={() => setConfigTab('recipients')}
                className={`px-4 py-3 font-medium transition-colors ${
                  configTab === 'recipients'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem da Notificação
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {MESSAGE_TAGS.map(tag => (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => setEditingMessage(prev => prev + tag.value)}
                          className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical bg-teal-50"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Utilize as tags acima para personalizar a mensagem com dados do lead.
                    </p>
                  </div>
                </div>
              )}

              {configTab === 'guide' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guia para IA
                    </label>
                    <textarea
                      rows={6}
                      value={editingGuide}
                      onChange={e => setEditingGuide(e.target.value)}
                      placeholder="Use esta notificação quando o cliente receber o contrato via WhatsApp."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-vertical"
                      maxLength={500}
                    />
                  </div>
                </div>
              )}

              {configTab === 'recipients' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Adicionar Novo Destinatário</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quem deve ser notificado?
                        </label>
                        <select
                          value={recipientType}
                          onChange={e => {
                            setRecipientType(e.target.value as any);
                            setRecipientPhone('');
                            setRecipientUserId('');
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          <option value="">Selecione uma opção</option>
                          <option value="numero">Número de telefone</option>
                          <option value="usuario">Usuário específico</option>
                          <option value="responsavel">Responsável pela negociação</option>
                        </select>
                      </div>

                      {recipientType === 'numero' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de telefone
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: +55 11 91234-5678"
                            value={recipientPhone}
                            onChange={e => setRecipientPhone(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            maxLength={60}
                          />
                        </div>
                      )}

                      {recipientType === 'usuario' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuário
                          </label>
                          <select
                            value={recipientUserId}
                            onChange={e => setRecipientUserId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                            <p className="text-xs text-gray-500 mt-1">Carregando usuários...</p>
                          )}
                          {!loadingUsuarios && usuarios.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">Nenhum usuário disponível</p>
                          )}
                        </div>
                      )}

                      {recipientType === 'responsavel' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700">
                            O responsável atual da negociação receberá esta notificação automaticamente.
                          </p>
                        </div>
                      )}

                      {recipientType && (
                        <button
                          onClick={handleAddRecipient}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
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

                          return (
                            <div
                              key={attr.id}
                              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{label}</p>
                                <p className="text-xs text-gray-600">{description}</p>
                              </div>
                              {canEdit && (
                                <button
                                  onClick={() => handleDeleteRecipient(attr.id, attr.id_funcao)}
                                  disabled={saving}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">Nenhum destinatário cadastrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              {configTab === 'message' && (
                <button
                  onClick={handleSaveMessage}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
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
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
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
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Deletar Notificação</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja deletar esta notificação? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setFunctionToDelete(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteFunction}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
