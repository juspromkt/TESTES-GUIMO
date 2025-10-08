import React, { useState, useEffect } from 'react';
import { Settings, Loader2, Save, Clock, AlertCircle } from 'lucide-react';

interface AgentParameters {
  debounce_time: number;
  tempo_inatividade: number;
  criar_deal_por_sessao: boolean;
  canEdit: boolean;

}

interface AgentParametersSectionProps {
  token: string;
}

export default function AgentParametersSection({ token, canEdit }: AgentParametersSectionProps) {
  const [parameters, setParameters] = useState<AgentParameters>({
    debounce_time: 10,
    tempo_inatividade: 30,
    criar_deal_por_sessao: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/parametros/get', {
        headers: { token }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar parâmetros');
      }

const data = await response.json();
if (Array.isArray(data) && data.length > 0) {
  setParameters({
    debounce_time: data[0].debounce_time ?? 5,
    tempo_inatividade: data[0].tempo_inatividade ?? 30,
    criar_deal_por_sessao: data[0].criar_deal_por_sessao ?? false
  });
}

    } catch (err) {
      console.error('Erro ao carregar parâmetros:', err);
      setError('Erro ao carregar parâmetros do agente');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/parametros/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(parameters)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar parâmetros');
      }

      setSuccess('Parâmetros salvos com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar parâmetros:', err);
      setError('Erro ao salvar parâmetros do agente');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AgentParameters, value: string) => {
    // Ensure only integers are accepted
    const intValue = parseInt(value.replace(/\D/g, ''));
    
    if (!isNaN(intValue)) {
      setParameters(prev => ({
        ...prev,
        [field]: intValue
      }));
    } else if (value === '') {
      // Allow empty field for better UX
      setParameters(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <label className="block text-sm font-medium text-gray-700">
              Tempo de Delay (segundos)
            </label>
          </div>
<input
  type="text"
  value={parameters.debounce_time}
  onChange={(e) => handleInputChange('debounce_time', e.target.value)}
  disabled={!canEdit} // ✅ novo
  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
/>

          <p className="mt-2 text-sm text-gray-500">
            Tempo que a IA aguarda antes de processar mensagens consecutivas. Isso evita que múltiplas 
            mensagens enviadas rapidamente criem várias filas de resposta simultâneas. Recomendado: 15-30 segundos. (quando um lead mandar uma mensagem, ela vai aguardar X segundos antes de responder - Deixe 20)
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
  onChange={(e) => handleInputChange('tempo_inatividade', e.target.value)}
  disabled={!canEdit} // ✅ novo
  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
/>

          <p className="mt-2 text-sm text-gray-500">
            Quando um humano intervém na conversa da IA, o agente ficará inativo por este período.
            Isso evita que a IA e o atendente humano respondam simultaneamente. Recomendado: 9999999999 minutos.
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