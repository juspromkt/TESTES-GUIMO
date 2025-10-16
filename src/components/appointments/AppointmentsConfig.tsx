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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-neutral-700/50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
              Configurações de Lembretes
            </h2>
            <p className="text-gray-500 dark:text-neutral-400 text-sm">Configure lembretes automáticos para seus agendamentos</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-neutral-700/50 shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Status Toggle */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 dark:from-blue-600/10 dark:via-indigo-600/10 dark:to-purple-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100">Sistema de Lembretes</h3>
                    <p className="text-gray-600 dark:text-neutral-400 text-sm">Ative ou desative o envio automático de lembretes</p>
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
                  <div className="relative w-14 h-7 bg-gray-200 dark:bg-neutral-700 rounded-full peer transition-all duration-300 peer-focus:ring-4 peer-focus:ring-blue-300/30 dark:peer-focus:ring-blue-800/30 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 shadow-inner">
                    <div className="absolute top-0.5 left-0.5 bg-white border border-gray-300 dark:border-neutral-600 rounded-full h-6 w-6 transition-all duration-300 peer-checked:translate-x-7 shadow-md">
                      {config.isAtivo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Timing Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-neutral-100">Horários de Envio</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-neutral-700 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Morning Reminder */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl border border-yellow-200/50 dark:border-yellow-800/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 dark:from-yellow-500/10 dark:to-orange-500/10"></div>
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enviarCedo}
                          onChange={(e) => setConfig({ ...config, enviarCedo: e.target.checked })}
                          className="mt-1 w-5 h-5 text-yellow-600 border-yellow-300 dark:border-yellow-700 rounded focus:ring-yellow-500 transition-all duration-200"
                          disabled={!canEdit}
                        />
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-neutral-100 block">Lembrete Matinal</span>
                          <span className="text-xs text-gray-600 dark:text-neutral-400">Enviado às 8h da manhã</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2 Hours Before */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10"></div>
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enviar2hAntes}
                          onChange={(e) => setConfig({ ...config, enviar2hAntes: e.target.checked })}
                          className="mt-1 w-5 h-5 text-blue-600 border-blue-300 dark:border-blue-700 rounded focus:ring-blue-500 transition-all duration-200"
                          disabled={!canEdit}
                        />
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-neutral-100 block">2 Horas Antes</span>
                          <span className="text-xs text-gray-600 dark:text-neutral-400">Lembrete com antecedência</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1 Hour Before */}
              <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10"></div>
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.enviar1hAntes}
                          onChange={(e) => setConfig({ ...config, enviar1hAntes: e.target.checked })}
                          className="mt-1 w-5 h-5 text-purple-600 border-purple-300 dark:border-purple-700 rounded focus:ring-purple-500 transition-all duration-200"
                          disabled={!canEdit}
                        />
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-neutral-100 block">1 Hora Antes</span>
                          <span className="text-xs text-gray-600 dark:text-neutral-400">Lembrete de última hora</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-neutral-100">Personalização da Mensagem</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-300 dark:from-neutral-700 to-transparent"></div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-neutral-900/50 dark:to-blue-900/10 rounded-2xl border border-gray-300/50 dark:border-neutral-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-neutral-200">
                  Prompt de Lembrete
                </label>
                {canEdit && (
                  <button
                    type="button"
                    onClick={applyDefaultText}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Usar Texto Padrão
                  </button>
                )}
              </div>
              <textarea
                value={config.prompt}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 text-gray-900 dark:text-neutral-100 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 dark:bg-neutral-700/80 backdrop-blur-sm transition-all duration-200 resize-none"
                placeholder="Digite o prompt para os lembretes automáticos..."
                readOnly={!canEdit}
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
                Use variáveis como [Nome], [data] e [hora] para personalizar automaticamente as mensagens.
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Erro ao processar</p>
                  <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-700 dark:text-green-400 font-medium text-sm">{success}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {canEdit && (
            <div className="flex justify-end pt-6 border-t border-gray-300/50 dark:border-neutral-700">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Salvando Configurações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  </div>
);
}