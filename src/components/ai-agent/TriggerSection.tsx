import React, { useState, useEffect } from 'react';
import { Loader2, Save, Zap } from 'lucide-react';

interface TriggerSectionProps {
  token: string;
  canEdit: boolean; // ✅ nova prop
}

interface TriggerConfig {
  isAtivo: boolean;
  gatilho: string;
}

export default function TriggerSection({ token, canEdit }: TriggerSectionProps) {
  const [isActive, setIsActive] = useState(false);
  const [trigger, setTrigger] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTriggerConfig();
  }, []);

  const fetchTriggerConfig = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/gatilho/get', {
        headers: { token }
      });
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setIsActive(data[0].isAtivo);
        setTrigger(data[0].gatilho || '');
      } else {
        setIsActive(false);
        setTrigger('');
      }
    } catch (err) {
      console.error('Erro ao carregar configuração do gatilho:', err);
      setError('Erro ao carregar configuração do gatilho');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    setError('');
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/gatilho/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        }
      });
      const data = await response.json();
      setIsActive(data.isAtivo);
      setSuccess('Status do gatilho atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao alternar status do gatilho:', err);
      setError('Erro ao alternar status do gatilho');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSave = async () => {
    if (isActive && trigger.trim() === '') {
      setError('O texto do gatilho não pode ficar vazio quando o gatilho está ativo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/gatilho/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({ isAtivo: isActive, gatilho: trigger })
      });
      if (!response.ok) throw new Error('Erro ao salvar gatilho');
      setSuccess('Gatilho salvo com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar gatilho:', err);
      setError('Erro ao salvar gatilho');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
          <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Gatilho de Acionamento</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Configure o gatilho que ativará a IA (é recomendado deixar o gatilho desativado para que a IA ative em todos os leads que entrarem em contato)</p>
        </div>
              {canEdit && (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isActive}
            onChange={handleToggleStatus}
            disabled={!canEdit || togglingStatus} // ✅ só permite toggle se pode editar
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-neutral-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-700"></div>
          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-neutral-300">
            {togglingStatus ? 'Alternando...' : isActive ? 'Ativado' : 'Desativado'}
          </span>
        </label>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            Texto do Gatilho
          </label>
          <textarea
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            disabled={!canEdit} // ✅ input desabilitado se não pode editar
            className="w-full px-4 py-3 text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            rows={3}
            placeholder="Ex: Tenho interesse"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving || (isActive && trigger.trim() === '')}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Salvar Gatilho</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}