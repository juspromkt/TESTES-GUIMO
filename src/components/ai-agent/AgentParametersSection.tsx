import React, { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Clock, AlertCircle, Sparkles, Key } from 'lucide-react';

const maskKey = (key: string) => {
  if (!key) return '';

  const visibleCharacters = Math.min(6, key.length);
  const visiblePart = key.slice(0, visibleCharacters);
  const maskedPart = '•'.repeat(Math.max(0, key.length - visibleCharacters));

  return `${visiblePart}${maskedPart}`;
};

interface AgentParameters {
  debounce_time: number | '';
  tempo_inatividade: number | '';
  criar_deal_por_sessao: boolean;
  versao_agente: 'v1' | 'v2';
  key_openai: string;
}

interface AgentParametersSectionProps {
  token: string;
  idAgente: number;
  canEdit: boolean;
}

export default function AgentParametersSection({ token, idAgente, canEdit }: AgentParametersSectionProps) {
  const [parameters, setParameters] = useState<AgentParameters>({
    debounce_time: 10,
    tempo_inatividade: 30,
    criar_deal_por_sessao: false,
    versao_agente: 'v1',
    key_openai: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [displayKey, setDisplayKey] = useState('');

  useEffect(() => {
    const fetchParameters = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/parametros/get?id_agente=${idAgente}`, {
          headers: { token }
        });

        if (!response.ok) {
          throw new Error('Erro ao carregar parâmetros');
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const apiParameters = data[0];

          const debounceValue = Number(apiParameters.debounce_time ?? 5);
          const inactivityValue = Number(apiParameters.tempo_inatividade ?? 30);
          const agentVersion = (apiParameters.versao_agente ?? 'v1').toString().toLowerCase();
          const keyValue = apiParameters.key_openai ?? '';

          setParameters({
            debounce_time: Number.isNaN(debounceValue) ? 5 : debounceValue,
            tempo_inatividade: Number.isNaN(inactivityValue) ? 30 : inactivityValue,
            criar_deal_por_sessao: Boolean(apiParameters.criar_deal_por_sessao ?? false),
            versao_agente: agentVersion === 'v2' ? 'v2' : 'v1',
            key_openai: keyValue
          });

          setDisplayKey(maskKey(keyValue));
        } else {
          // Resetar para valores padrão se não houver dados
          setParameters({
            debounce_time: 10,
            tempo_inatividade: 30,
            criar_deal_por_sessao: false,
            versao_agente: 'v1',
            key_openai: ''
          });
          setDisplayKey('');
        }

      } catch (err) {
        console.error('Erro ao carregar parâmetros:', err);
        setError('Erro ao carregar parâmetros do agente');
      } finally {
        setLoading(false);
      }
    };

    fetchParameters();
  }, [token, idAgente]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/parametros/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          ...parameters,
          debounce_time: parameters.debounce_time === '' ? null : Number(parameters.debounce_time),
          tempo_inatividade: parameters.tempo_inatividade === '' ? null : Number(parameters.tempo_inatividade),
          id_agente: idAgente,
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar parâmetros');
      }

      setDisplayKey(maskKey(parameters.key_openai));
      setSuccess('Parâmetros salvos com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar parâmetros:', err);
      setError('Erro ao salvar parâmetros do agente');
    } finally {
      setSaving(false);
    }
  };

  const handleNumericInputChange = (field: 'debounce_time' | 'tempo_inatividade', value: string) => {
    const numericValue = parseInt(value.replace(/\D/g, ''), 10);

    if (!Number.isNaN(numericValue)) {
      setParameters(prev => ({
        ...prev,
        [field]: numericValue
      }));
    } else if (value === '') {
      setParameters(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleVersionChange = (value: 'v1' | 'v2') => {
    setParameters(prev => ({
      ...prev,
      versao_agente: value
    }));
  };

  const handleKeyChange = (value: string) => {
    setParameters(prev => ({
      ...prev,
      key_openai: value
    }));
    setDisplayKey(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
          <Settings className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Parâmetros do Agente</h2>
          <p className="text-sm text-gray-500 mt-1">Configure os parâmetros de comportamento do agente</p>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">O que são os Parâmetros do Agente?</h3>
        <p className="text-blue-700 text-sm mb-2">
          Estes parâmetros controlam aspectos técnicos do comportamento do agente durante as conversas,
          otimizando a experiência do usuário e evitando problemas comuns.
        </p>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>
            <span className="font-medium">Versão do agente:</span> escolha entre a versão atual (v1) e a versão beta (v2).
            A v2 oferece respostas mais precisas, mas pode levar um pouco mais de tempo para responder.
          </li>
          <li>
            <span className="font-medium">Chave OpenAI:</span> opcional, utilize apenas se quiser personalizar o agente com um modelo próprio.
            O sistema já possui uma chave padrão configurada.
          </li>
        </ul>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <label className="block text-sm font-medium text-gray-700">
              Tempo de Debounce (segundos)
            </label>
          </div>
          <input
            type="text"
            value={parameters.debounce_time}
            onChange={(e) => handleNumericInputChange('debounce_time', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

          <p className="mt-2 text-sm text-gray-500">
            Tempo que o agente aguarda antes de processar mensagens consecutivas. Isso evita que múltiplas
            mensagens enviadas rapidamente criem várias filas de resposta simultâneas. Recomendado: 5-15 segundos.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <label className="block text-sm font-medium text-gray-700">
              Tempo de Inatividade após Intervenção (minutos)
            </label>
          </div>
          <input
            type="text"
            value={parameters.tempo_inatividade}
            onChange={(e) => handleNumericInputChange('tempo_inatividade', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />

          <p className="mt-2 text-sm text-gray-500">
            Quando um humano intervém na conversa, o agente ficará inativo por este período.
            Isso evita que o agente e o atendente humano respondam simultaneamente. Recomendado: 15-60 minutos.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-gray-500" />
            <label className="block text-sm font-medium text-gray-700">Versão do agente</label>
          </div>
          <select
            value={parameters.versao_agente}
            onChange={(e) => handleVersionChange(e.target.value as 'v1' | 'v2')}
            disabled={!canEdit}
            className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="v1">v1 • Versão atual do agente</option>
            <option value="v2">v2 • Versão beta com respostas mais precisas</option>
          </select>
          <p className="mt-2 text-sm text-gray-500">
            A versão v1 é a configuração padrão utilizada atualmente. A v2 está em beta, produz respostas mais precisas,
            porém pode levar um pouco mais de tempo para responder.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-gray-500" />
            <label className="block text-sm font-medium text-gray-700">Chave OpenAI (opcional)</label>
          </div>
          <input
            type="text"
            value={displayKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            disabled={!canEdit}
            placeholder="Informe sua chave personalizada da OpenAI"
            className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Utilize apenas se desejar personalizar o agente com modelos específicos ou ajustes avançados.
            Caso contrário, a chave padrão do sistema continuará sendo utilizada.
          </p>
        </div>

        <div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={parameters.criar_deal_por_sessao}
              onChange={(e) =>
                setParameters(prev => ({
                  ...prev,
                  criar_deal_por_sessao: e.target.checked,
                }))
              }
              disabled={!canEdit}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Criar negócio por sessão
            </span>
          </label>
          <p className="mt-2 text-sm text-gray-500">
            Ative para gerar uma nova negociação a cada nova sessão do usuário. Se desativado, o
            sistema reutilizará a negociação existente da sessão anterior.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end pt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Parâmetros</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

