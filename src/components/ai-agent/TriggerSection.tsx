import React, { useState, useEffect } from 'react';
import { Loader2, Save, Zap, Info } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface TriggerSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
}

export default function TriggerSection({ token, idAgente, canEdit }: TriggerSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [originalTrigger, setOriginalTrigger] = useState('');
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
  }, [trigger, isActive]);

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
          setTrigger(triggerText);
          setOriginalTrigger(triggerText);
        } else {
          setIsActive(false);
          setTrigger('');
          setOriginalTrigger('');
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
    // Validação: gatilho obrigatório se isActive = true
    if (isActive && trigger.trim() === '') {
      toast.error('O texto do gatilho não pode ficar vazio quando o gatilho está ativo');
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

      // Atualiza apenas isGatilho e gatilho, mantendo os outros campos
      const payload = {
        Id: idAgente,
        nome: currentAgent.nome,
        isAtivo: currentAgent.isAtivo,
        isAgentePrincipal: currentAgent.isAgentePrincipal,
        isGatilho: isActive,
        gatilho: trigger
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

      setOriginalTrigger(trigger);
      toast.success('Configurações salvas!');
    } catch (err) {
      console.error('[TriggerSection] Erro ao salvar gatilho:', err);
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

  return (
    <div className="space-y-4">
      {/* Toggle Gatilho Ativo */}
      <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
        isActive
          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
      } ${!canEdit ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Gatilho de Acionamento</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Palavra/frase que ativa o agente
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => canEdit && setIsActive(!isActive)}
          disabled={!canEdit}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed ${
            isActive ? 'bg-purple-600 dark:bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Texto do Gatilho */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          <Zap className="h-3.5 w-3.5" />
          Texto do Gatilho
          <div className="group relative">
            <Info className="h-3 w-3 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
              Digite a palavra ou frase que irá ativar este agente quando mencionada
            </div>
          </div>
        </label>
        <div className="relative">
          <textarea
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2 pr-12 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none"
            rows={3}
            placeholder="Ex: Tenho interesse"
          />
          {canEdit && (
            <div className="absolute right-2.5 top-2.5">
              <button
                onClick={handleSave}
                disabled={saving || (isActive && trigger.trim() === '') || trigger === originalTrigger}
                className={`p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  trigger !== originalTrigger && !(isActive && trigger.trim() === '')
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-green-500 hover:text-white dark:hover:bg-green-600 transition-colors'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                }`}
                title={trigger !== originalTrigger ? 'Clique para salvar' : 'Nenhuma alteração'}
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
        {trigger !== originalTrigger && !saving && canEdit && (
          <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium mt-1 ml-1">
            Não salvo
          </p>
        )}
      </div>
    </div>
  );
}


