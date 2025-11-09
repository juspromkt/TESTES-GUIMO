import { useState, useEffect } from 'react';
import { Settings, Info, Loader2, Save, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
}

interface BasicSettingsSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
  onNameChange?: (name: string) => void;
  onAtivoChange?: (isAtivo: boolean) => void;
  onPrincipalChange?: (isPrincipal: boolean) => void;
}

export default function BasicSettingsSection({
  token,
  idAgente,
  canEdit,
  onNameChange,
  onAtivoChange,
  onPrincipalChange
}: BasicSettingsSectionProps) {
  const [nome, setNome] = useState('');
  const [originalNome, setOriginalNome] = useState(''); // Para comparar se mudou
  const [delay, setDelay] = useState('20');
  const [isAtivo, setIsAtivo] = useState(false);
  const [isAgentePrincipal, setIsAgentePrincipal] = useState(false);
  const [isGatilho, setIsGatilho] = useState(false);
  const [gatilho, setGatilho] = useState('');
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchBasicSettings();
  }, [idAgente]);

  // Auto-save quando houver mudanças (exceto nome)
  useEffect(() => {
    if (loading) return; // Não salva durante o carregamento inicial

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleSave();
    }, 1000); // Salva 1 segundo após a última alteração

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, isAtivo, isAgentePrincipal]); // Nome removido do auto-save

  // NOTA: Callbacks para o componente pai NÃO devem ser chamados em useEffect
  // Isso causaria loop infinito pois atualizam o estado do pai
  // Eles são chamados apenas no handleSave após salvar com sucesso

  const fetchBasicSettings = async () => {
    try {
      setLoading(true);

      // Busca TODOS os agentes (para validar agente principal)
      const allAgentsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
        headers: { token }
      });
      const allAgentsData = await allAgentsResponse.json();
      if (Array.isArray(allAgentsData)) {
        setAllAgents(allAgentsData);

        // Busca o agente atual dentro da lista
        const currentAgent = allAgentsData.find(a => a.Id === idAgente);
        if (currentAgent) {
          const agentName = currentAgent.nome || '';
          setNome(agentName);
          setOriginalNome(agentName);
          setIsAtivo(Boolean(currentAgent.isAtivo));
          setIsAgentePrincipal(Boolean(currentAgent.isAgentePrincipal));
          setIsGatilho(Boolean(currentAgent.isGatilho));
          setGatilho(currentAgent.gatilho || '');
        }
      }

      // Busca dados dos parâmetros (delay/debounce_time)
      const paramsResponse = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/parametros/get?id_agente=${idAgente}`, {
        headers: { token }
      });
      const paramsData = await paramsResponse.json();

      if (Array.isArray(paramsData) && paramsData.length > 0) {
        const params = paramsData[0];
        const debounceValue = Number(params.debounce_time ?? 20);
        setDelay(debounceValue.toString());
      } else {
        // Se não houver parâmetros, usa valor padrão
        setDelay('20');
      }
    } catch (err) {
      console.error('[BasicSettings] Erro ao carregar configurações básicas:', err);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validação: nome obrigatório
    if (!nome.trim()) {
      toast.error('Nome do agente é obrigatório');
      return;
    }

    // Validação: gatilho obrigatório se isGatilho = true
    if (isGatilho && !gatilho.trim()) {
      toast.error('Gatilho é obrigatório quando "Gatilho de Acionamento" está ativo');
      return;
    }

    setSaving(true);

    try {
      // Busca o agente principal anterior (se houver)
      const oldPrincipalAgent = allAgents.find(
        a => a.isAgentePrincipal && a.Id !== idAgente
      );

      // Se estamos ativando como principal e existe outro agente principal, desativa o anterior
      if (isAgentePrincipal === true && oldPrincipalAgent) {
        console.log(`[BasicSettings] Desativando agente principal anterior: ${oldPrincipalAgent.nome}`);
        await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            ...oldPrincipalAgent,
            isAgentePrincipal: false
          })
        });
      }

      // Salva todas as configurações do agente em uma única chamada
      const agentPayload = {
        Id: idAgente,
        nome,
        isAtivo,
        isAgentePrincipal,
        isGatilho,
        gatilho
      };

      const agentResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(agentPayload)
      });

      if (!agentResponse.ok) throw new Error('Erro ao salvar configurações do agente');

      // Salva delay (debounce_time) separadamente
      const paramsPayload = {
        id_agente: idAgente,
        debounce_time: parseInt(delay) || 20
      };

      const paramsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/parametros/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(paramsPayload)
      });

      if (!paramsResponse.ok) throw new Error('Erro ao salvar parâmetros');

      // Atualiza o nome original após salvar com sucesso
      setOriginalNome(nome);

      // Propaga todas as mudanças para o componente pai
      if (onNameChange) {
        onNameChange(nome);
      }
      if (onAtivoChange) {
        onAtivoChange(isAtivo);
      }
      if (onPrincipalChange) {
        onPrincipalChange(isAgentePrincipal);
      }

      toast.success('Configurações salvas!');
    } catch (err) {
      console.error('[BasicSettings] Erro ao salvar:', err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  const handleTogglePrincipal = () => {
    if (!canEdit) return;

    // Se está tentando ativar e já existe outro agente principal, mostrar modal de confirmação
    if (!isAgentePrincipal) {
      const otherPrincipal = allAgents.find(
        a => a.isAgentePrincipal && a.Id !== idAgente
      );
      if (otherPrincipal) {
        // Mostra modal de confirmação antes de ativar
        setShowConfirmModal(true);
        return;
      }
    }

    // Se está desativando, não precisa confirmação
    setIsAgentePrincipal(!isAgentePrincipal);
  };

  const handleConfirmPrincipalChange = () => {
    setShowConfirmModal(false);
    setIsAgentePrincipal(true);
  };

  const handleCancelPrincipalChange = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Nome do Agente e Delay na mesma linha */}
      <div className="flex gap-3">
        {/* Nome do Agente (70%) */}
        <div className="flex-[7]">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <Settings className="h-3.5 w-3.5" />
            Nome do Agente
            <div className="group relative">
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                Nome identificador do agente no sistema
              </div>
            </div>
          </label>
          <div>
            <div className="relative">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 pr-12 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Ex: Atendimento Comercial"
              />
              {canEdit && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !nome.trim() || nome === originalNome}
                    className={`p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                      nome !== originalNome && nome.trim()
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-green-500 hover:text-white dark:hover:bg-green-600 transition-colors'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                    }`}
                    title={nome !== originalNome && nome.trim() ? 'Clique para salvar' : 'Nenhuma alteração'}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
            {nome !== originalNome && nome.trim() && !saving && canEdit && (
              <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium mt-1 ml-1">
                Não salvo
              </p>
            )}
          </div>
        </div>

        {/* Delay (30%) */}
        <div className="flex-[3]">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Delay (segundos)
            <div className="group relative">
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 whitespace-normal">
                Tempo de espera antes de responder
              </div>
            </div>
          </label>
          <select
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="3">3s</option>
            <option value="5">5s</option>
            <option value="10">10s</option>
            <option value="15">15s</option>
            <option value="20">20s (recomendado)</option>
            <option value="30">30s</option>
          </select>
        </div>
      </div>

      {/* Toggles lado a lado */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {/* Agente Ativo */}
        <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
          isAtivo
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
        } ${!canEdit ? 'opacity-50' : ''}`}>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Agente Ativo</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Responder mensagens
            </p>
          </div>
          <button
            type="button"
            onClick={() => canEdit && setIsAtivo(!isAtivo)}
            disabled={!canEdit}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
              isAtivo ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAtivo ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Agente Principal */}
        <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
          isAgentePrincipal
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
        } ${!canEdit ? 'opacity-50' : ''}`}>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Agente Principal</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Apenas um principal
            </p>
          </div>
          <button
            type="button"
            onClick={handleTogglePrincipal}
            disabled={!canEdit}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
              isAgentePrincipal ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isAgentePrincipal ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Mudança de Agente Principal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancelPrincipalChange}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            {/* Ícone de Alerta */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            {/* Título */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Mudar Agente Principal?
            </h3>

            {/* Descrição */}
            <div className="text-sm text-gray-600 dark:text-neutral-400 text-center mb-6">
              <p>
                {allAgents.find(a => a.isAgentePrincipal && a.Id !== idAgente)?.nome} deixará de ser o agente principal.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelPrincipalChange}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPrincipalChange}
                className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium transition-colors"
              >
                Sim, mudar
              </button>
            </div>
          </div>

          <style>{`
            @keyframes scaleIn {
              from {
                transform: scale(0.9);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            .animate-scale-in {
              animation: scaleIn 0.2s ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
