import { useState, useEffect } from 'react';
import { Loader2, Zap, X, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface TriggerSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
  onGatilhoChange?: (isGatilho: boolean) => void;
}

export default function TriggerSection({ token, idAgente, canEdit, onGatilhoChange }: TriggerSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [originalTriggers, setOriginalTriggers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchTriggerConfig();
  }, [idAgente]);

  // Auto-save quando houver mudanças
  useEffect(() => {
    if (loading) return;

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      handleSave();
    }, 1000);

    setAutoSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggers, isActive]);

  const fetchTriggerConfig = async () => {
    try {
      setLoading(true);
      // Busca dados do agente (incluindo gatilho)
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
        headers: { token }
      });
      const data = await response.json();

      if (Array.isArray(data)) {
        const currentAgent = data.find(a => a.Id === idAgente);
        if (currentAgent) {
          setIsActive(Boolean(currentAgent.isGatilho));
          const triggerText = currentAgent.gatilho || '';
          // Converte string separada por vírgulas em array
          const triggerArray = triggerText ? triggerText.split(',').map(t => t.trim()).filter(t => t) : [];
          setTriggers(triggerArray);
          setOriginalTriggers(triggerArray);
        } else {
          setIsActive(false);
          setTriggers([]);
          setOriginalTriggers([]);
        }
      }
    } catch (err) {
      console.error('[TriggerSection] Erro ao carregar configuração do gatilho:', err);
      toast.error('Erro ao carregar configuração do gatilho');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validação: ao menos um gatilho obrigatório se isActive = true
    if (isActive && triggers.length === 0) {
      toast.error('Adicione pelo menos um gatilho quando o gatilho está ativo');
      return;
    }

    setSaving(true);

    try {
      // Busca dados atuais do agente para manter outros campos
      const getResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
        headers: { token }
      });
      const agents = await getResponse.json();
      const currentAgent = Array.isArray(agents) ? agents.find(a => a.Id === idAgente) : null;

      if (!currentAgent) {
        throw new Error('Agente não encontrado');
      }

      // Converte array de gatilhos em string separada por vírgulas
      const triggerString = triggers.join(', ');

      // Atualiza apenas isGatilho e gatilho, mantendo os outros campos
      const payload = {
        Id: idAgente,
        nome: currentAgent.nome,
        isAtivo: currentAgent.isAtivo,
        isAgentePrincipal: currentAgent.isAgentePrincipal,
        isGatilho: isActive,
        gatilho: triggerString
      };

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao salvar gatilho');

      setOriginalTriggers([...triggers]);

      // Propaga mudança para o componente pai
      if (onGatilhoChange) {
        onGatilhoChange(isActive);
      }

      toast.success('Configurações salvas!');
    } catch (err) {
      console.error('[TriggerSection] Erro ao salvar gatilho:', err);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTrigger = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !triggers.includes(trimmedValue)) {
      setTriggers([...triggers, trimmedValue]);
      setInputValue('');
    }
  };

  const handleRemoveTrigger = (triggerToRemove: string) => {
    setTriggers(triggers.filter(t => t !== triggerToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTrigger();
    }
  };

  const hasChanges = JSON.stringify(triggers.sort()) !== JSON.stringify(originalTriggers.sort());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle Gatilho Ativo */}
      <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
      } ${!canEdit ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Gatilho de Acionamento</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Palavras/frases que ativam o agente
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => canEdit && setIsActive(!isActive)}
          disabled={!canEdit}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
            isActive ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Input de Gatilhos */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
          Gatilhos
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canEdit}
            placeholder="Digite um gatilho e pressione Enter..."
            className="w-full px-3 py-2 pr-28 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gray-900 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <button
            onClick={handleAddTrigger}
            disabled={!canEdit || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white text-xs font-semibold rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de Chips */}
      {triggers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {triggers.map((trigger, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-medium"
            >
              <span>{trigger}</span>
              {canEdit && (
                <button
                  onClick={() => handleRemoveTrigger(trigger)}
                  className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Indicador de mudanças não salvas */}
      {hasChanges && !saving && canEdit && (
        <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium mt-1 ml-1">
          {saving ? 'Salvando...' : 'Salvando automaticamente...'}
        </p>
      )}

      {/* Seção Explicativa */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300">Como funciona?</h4>
        </div>
        <div className="space-y-2 text-xs text-blue-800 dark:text-blue-400">
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
            <p>
              <span className="font-semibold">Gatilho Inativo:</span> O Agente atenderá automaticamente <span className="font-bold text-blue-900 dark:text-blue-200">todos os leads</span> que entrarem em contato (recomendado).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
            <p>
              <span className="font-semibold">Gatilho Ativo:</span> O Agente só responderá quando o lead mencionar uma das palavras-chave configuradas.
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
          <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium mb-2">
            Exemplos de gatilhos:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-block px-2 py-1 bg-white dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded text-[10px]">
              "tenho interesse"
            </span>
            <span className="inline-block px-2 py-1 bg-white dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded text-[10px]">
              "quero saber mais"
            </span>
            <span className="inline-block px-2 py-1 bg-white dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded text-[10px]">
              "quanto custa"
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
