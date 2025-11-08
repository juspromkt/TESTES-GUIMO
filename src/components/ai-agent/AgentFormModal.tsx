import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../Modal';

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

    // Validação: apenas um agente principal
    if (formData.isAgentePrincipal) {
      const otherPrincipal = agents.find(
        a => a.isAgentePrincipal && a.Id !== existingAgent?.Id
      );
      if (otherPrincipal) {
        setError(`Já existe um agente principal: "${otherPrincipal.nome}". Apenas um agente pode ser principal por vez.`);
        return;
      }
    }

    // Validação: gatilho obrigatório se isGatilho = true
    if (formData.isGatilho && !formData.gatilho.trim()) {
      setError('Gatilho é obrigatório quando "Ativar por gatilho" está marcado');
      return;
    }

    setLoading(true);

    try {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Novo Agente' : 'Editar Agente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Agente <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
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
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Agente Ativo</span>
              <p className="text-xs text-gray-500">O agente estará disponível para uso</p>
            </div>
          </label>

          {/* Principal */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isAgentePrincipal}
              onChange={(e) => setFormData({ ...formData, isAgentePrincipal: e.target.checked })}
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Agente Principal</span>
              <p className="text-xs text-gray-500">Apenas um agente pode ser principal</p>
            </div>
          </label>

          {/* Gatilho */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isGatilho}
              onChange={(e) => setFormData({ ...formData, isGatilho: e.target.checked })}
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              disabled={loading}
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Ativar por Gatilho</span>
              <p className="text-xs text-gray-500">Agente ativa quando receber mensagem específica</p>
            </div>
          </label>
        </div>

        {/* Campo de Gatilho (condicional) */}
        {formData.isGatilho && (
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem Gatilho <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.gatilho}
              onChange={(e) => setFormData({ ...formData, gatilho: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              placeholder="Ex: Olá! Gostaria de falar sobre vendas"
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Este agente será ativado quando o usuário enviar esta mensagem
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
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
      </form>
    </Modal>
  );
}
