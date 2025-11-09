import { useState, useEffect } from 'react';
import { Loader2, X, Info } from 'lucide-react';
import AgentWizard from './wizard/AgentWizard';
import ConfirmModal from './wizard/ConfirmModal';

interface AgentFormData {
  nome: string;
  isAtivo: boolean;
  isAgentePrincipal: boolean;
  isGatilho: boolean;
  gatilho: string;
}

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
  isGatilho?: boolean;
  gatilho?: string;
}

interface AgentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
  mode: 'create' | 'edit';
  existingAgent?: Agent;
  agents: Agent[];
}

export default function AgentFormModal({
  isOpen,
  onClose,
  onSuccess,
  token,
  mode,
  existingAgent,
  agents
}: AgentFormModalProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    nome: '',
    isAtivo: true,
    isAgentePrincipal: false,
    isGatilho: false,
    gatilho: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Bloquear scroll do body quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup: restaurar scroll quando desmontar
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'edit' && existingAgent) {
      setFormData({
        nome: existingAgent.nome || '',
        isAtivo: existingAgent.isAtivo ?? true,
        isAgentePrincipal: existingAgent.isAgentePrincipal ?? false,
        isGatilho: existingAgent.isGatilho ?? false,
        gatilho: existingAgent.gatilho || ''
      });
    } else {
      setFormData({
        nome: '',
        isAtivo: true,
        isAgentePrincipal: false,
        isGatilho: false,
        gatilho: ''
      });
    }
    setError('');
  }, [mode, existingAgent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação: nome obrigatório
    if (!formData.nome.trim()) {
      setError('Nome do agente é obrigatório');
      return;
    }

    // Validação: gatilho obrigatório se isGatilho = true
    if (formData.isGatilho && !formData.gatilho.trim()) {
      setError('Gatilho é obrigatório quando "Ativar por gatilho" está marcado');
      return;
    }

    setLoading(true);

    try {
      // Se está marcando como principal e já existe outro principal, remover o antigo
      if (formData.isAgentePrincipal) {
        const otherPrincipal = agents.find(
          a => a.isAgentePrincipal && a.Id !== existingAgent?.Id
        );
        if (otherPrincipal) {
          await fetch(
            'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/update',
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                token
              },
              body: JSON.stringify({
                Id: otherPrincipal.Id,
                nome: otherPrincipal.nome,
                isAtivo: otherPrincipal.isAtivo,
                isAgentePrincipal: false, // Remove como principal
                isGatilho: otherPrincipal.isGatilho,
                gatilho: otherPrincipal.gatilho || ''
              })
            }
          );
        }
      }
      const url =
        mode === 'create'
          ? 'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/create'
          : 'https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/update';

      const method = mode === 'create' ? 'POST' : 'PUT';

      const body =
        mode === 'create'
          ? {
              nome: formData.nome,
              isAtivo: formData.isAtivo,
              isAgentePrincipal: formData.isAgentePrincipal,
              isGatilho: formData.isGatilho,
              gatilho: formData.gatilho
            }
          : {
              Id: existingAgent?.Id,
              nome: formData.nome,
              isAtivo: formData.isAtivo,
              isAgentePrincipal: formData.isAgentePrincipal,
              isGatilho: formData.isGatilho,
              gatilho: formData.gatilho
            };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar agente');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar agente:', err);
      setError('Erro ao salvar agente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCloseWizard = () => {
    setShowConfirmClose(true);
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const cancelClose = () => {
    setShowConfirmClose(false);
  };

  // Se for modo de criação, usar o wizard
  if (mode === 'create') {
    return (
      <>
        {/* Overlay escurecido - sem onClick para não fechar ao clicar fora */}
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50" />

        {/* Painel lateral direito - 40% */}
        <div className="fixed right-0 top-0 bottom-0 w-[40%] bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Criar Novo Agente
            </h2>
            <button
              onClick={handleCloseWizard}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Wizard Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AgentWizard
              isOpen={isOpen}
              onClose={onClose}
              onSuccess={onSuccess}
              token={token}
            />
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmClose}
          title="Tem certeza que deseja fechar?"
          message="Você perderá todas as alterações não salvas."
          confirmText="Sim, fechar"
          cancelText="Cancelar"
          onConfirm={confirmClose}
          onCancel={cancelClose}
        />
      </>
    );
  }

  // Modo de edição - formulário antigo
  return (
    <>
      {/* Overlay escurecido */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Painel lateral direito - 40% */}
      <div className="fixed right-0 top-0 bottom-0 w-[40%] bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Novo Agente' : 'Editar Agente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Agente <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Ex: Atendimento Comercial"
                disabled={loading}
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              {/* Ativo */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAtivo}
                  onChange={(e) => setFormData({ ...formData, isAtivo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
                  disabled={loading}
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Agente Ativo</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">O agente estará disponível para uso</p>
                </div>
              </label>

              {/* Principal */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAgentePrincipal}
                    onChange={(e) => setFormData({ ...formData, isAgentePrincipal: e.target.checked })}
                    className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
                    disabled={loading}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Agente Principal</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Apenas um agente pode ser principal</p>
                  </div>
                </label>

                {/* Aviso de troca de agente principal */}
                {formData.isAgentePrincipal && agents.find(a => a.isAgentePrincipal && a.Id !== existingAgent?.Id) && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-800 dark:text-amber-300">
                        <p className="font-medium mb-1">Atenção: Troca de Agente Principal</p>
                        <p>
                          O agente atual "<strong>{agents.find(a => a.isAgentePrincipal && a.Id !== existingAgent?.Id)?.nome}</strong>" será automaticamente
                          desmarcado como principal e este agente assumirá essa função.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Gatilho */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isGatilho}
                  onChange={(e) => setFormData({ ...formData, isGatilho: e.target.checked })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800"
                  disabled={loading}
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Ativar por Gatilho</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Agente ativa quando receber mensagem específica</p>
                </div>
              </label>
            </div>

            {/* Campo de Gatilho (condicional) */}
            {formData.isGatilho && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mensagem Gatilho <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <textarea
                  value={formData.gatilho}
                  onChange={(e) => setFormData({ ...formData, gatilho: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder="Ex: Olá! Gostaria de falar sobre vendas"
                  rows={3}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Este agente será ativado quando o usuário enviar esta mensagem
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer fixo com botões */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : mode === 'create' ? (
                'Criar Agente'
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
