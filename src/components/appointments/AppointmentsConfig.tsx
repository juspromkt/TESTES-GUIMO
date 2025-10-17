import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';

interface ReminderConfig {
  isAtivo: boolean;
  prompt: string;
  enviarCedo: boolean;
  enviar2hAntes: boolean;
  enviar1hAntes: boolean;
}

interface AppointmentsConfigProps {
  canEdit: boolean;
}

export default function AppointmentsConfig({ canEdit }: AppointmentsConfigProps) {
  const [config, setConfig] = useState<ReminderConfig>({
    isAtivo: false,
    prompt: '',
    enviarCedo: false,
    enviar2hAntes: false,
    enviar1hAntes: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/lembrete/get',
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setConfig(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/lembrete/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify(config)
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações');
      }

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const applyDefaultText = () => {
    setConfig(prev => ({
      ...prev,
      prompt: `Você é um assistente que envia lembretes de reuniões. Crie uma mensagem curta, clara e educada lembrando a pessoa sobre uma reunião marcada. A mensagem deve conter:

- O nome da pessoa (se disponível),
- A data e hora da reunião,
- Um tom amigável e profissional.

Exemplo de formato esperado:
"Oi [Nome], tudo certo? Só passando para lembrar da nossa reunião marcada para [data] às [hora]. Posso confirmar a sua presença? Qualquer dúvida, estou à disposição!"`
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Horários de Envio Card */}
          <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-5 border border-white/20 dark:border-neutral-700/50 shadow-lg">
            {/* Header com Toggle */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-neutral-100">Horários de Envio</h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">Configure quando os lembretes serão enviados</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.isAtivo}
                  onChange={(e) => setConfig({ ...config, isAtivo: e.target.checked })}
                  disabled={!canEdit}
                />
                <div className="relative w-11 h-6 bg-gray-200 dark:bg-neutral-700 rounded-full peer transition-all duration-300 peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-600">
                  <div className="absolute top-0.5 left-0.5 bg-white border border-gray-300 dark:border-neutral-600 rounded-full h-5 w-5 transition-all duration-300 peer-checked:translate-x-5 shadow-md"></div>
                </div>
              </label>
            </div>

            {/* Timing Options */}
            <div className="space-y-3">
              {/* Morning Reminder */}
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-neutral-700 hover:border-yellow-300 dark:hover:border-yellow-600 cursor-pointer transition-all group hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                <input
                  type="checkbox"
                  checked={config.enviarCedo}
                  onChange={(e) => setConfig({ ...config, enviarCedo: e.target.checked })}
                  className="w-5 h-5 mt-0.5 text-yellow-600 border-gray-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-yellow-500"
                  disabled={!canEdit}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-neutral-100">Lembrete Matinal</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">Enviado às 8h da manhã do dia da reunião</p>
                </div>
              </label>

              {/* 2 Hours Before */}
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all group hover:bg-blue-50 dark:hover:bg-blue-900/10">
                <input
                  type="checkbox"
                  checked={config.enviar2hAntes}
                  onChange={(e) => setConfig({ ...config, enviar2hAntes: e.target.checked })}
                  className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={!canEdit}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-neutral-100">2 Horas Antes</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">Lembrete enviado 2 horas antes do horário agendado</p>
                </div>
              </label>

              {/* 1 Hour Before */}
              <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-gray-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer transition-all group hover:bg-purple-50 dark:hover:bg-purple-900/10">
                <input
                  type="checkbox"
                  checked={config.enviar1hAntes}
                  onChange={(e) => setConfig({ ...config, enviar1hAntes: e.target.checked })}
                  className="w-5 h-5 mt-0.5 text-purple-600 border-gray-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-purple-500"
                  disabled={!canEdit}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-neutral-100">1 Hora Antes</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-neutral-400">Lembrete de última hora, enviado 1 hora antes da reunião</p>
                </div>
              </label>
            </div>
          </div>

          {/* Prompt Configuration */}
          <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-5 border border-white/20 dark:border-neutral-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-neutral-100">Personalização da Mensagem</h3>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={applyDefaultText}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Usar Texto Padrão
                </button>
              )}
            </div>

            <textarea
              value={config.prompt}
              onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 text-gray-900 dark:text-neutral-100 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 transition-all resize-none text-sm"
              placeholder="Digite o prompt para os lembretes automáticos..."
              readOnly={!canEdit}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
              Use variáveis como [Nome], [data] e [hora] para personalizar automaticamente as mensagens.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-700 dark:text-green-400 font-medium text-sm">{success}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {canEdit && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
