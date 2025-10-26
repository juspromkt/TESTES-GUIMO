import React, { useEffect, useState } from 'react';
import { Clock, Loader2, Sun, Moon } from 'lucide-react';

interface OperatingHoursSectionProps {
  token: string;
  canEdit: boolean;
}

export default function OperatingHoursSection({ token, canEdit }: OperatingHoursSectionProps) {
  const [enabled, setEnabled] = useState(false);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(18);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Gera array de horas (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/funcionamento', {
          headers: { token }
        });
        if (!response.ok) {
          throw new Error('Erro ao carregar horário de funcionamento');
        }
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const settings = data[0];
          setEnabled(!!settings.ativar_horario_funcionamento);
          setStartHour(settings.horario_inicio ?? 8);
          setEndHour(settings.horario_final ?? 18);
        }
      } catch (err) {
        console.error('Erro ao carregar horário de funcionamento:', err);
        setError('Erro ao carregar horário de funcionamento');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

  // Auto-save quando houver mudanças (exceto carregamento inicial)
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (!canEdit) return;

    autoSave();
  }, [enabled, startHour, endHour]);

  const autoSave = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/funcionamento/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          ativar_horario_funcionamento: enabled,
          horario_inicio: startHour,
          horario_final: endHour
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar horário de funcionamento');
      }
    } catch (err) {
      console.error('Erro ao salvar horário de funcionamento:', err);
      setError('Erro ao salvar horário de funcionamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-neutral-700/60 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-neutral-900 border-b border-gray-200/60 dark:border-neutral-700/60 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Ícone */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-md"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Horário de Funcionamento</h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                  Configure o horário de atendimento da IA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Indicador de salvamento */}
              {saving && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Salvando...</span>
                </div>
              )}

              {/* Toggle Principal */}
              {canEdit && (
                <div className="flex items-center gap-3 bg-white/80 dark:bg-neutral-800/80 px-4 py-2 rounded-xl border border-gray-200/60 dark:border-neutral-700/60 shadow-sm">
                  <span className="text-xs font-medium text-gray-600 dark:text-neutral-400">
                    Horário de Funcionamento
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      disabled={!canEdit}
                    />
                    <div className="w-11 h-6 bg-gray-300 dark:bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-gradient-to-r peer-checked:from-emerald-600 peer-checked:to-teal-500"></div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Horários em 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Horário de Início */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-950/10 rounded-2xl border border-gray-200/60 dark:border-neutral-700/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
                  <Sun className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Horário de Início</h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">Quando a IA começa a atender</p>
                </div>
              </div>
              <select
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value))}
                disabled={!canEdit}
                className="w-full px-4 py-3 text-xl font-bold text-center text-gray-900 dark:text-white bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-all cursor-pointer hover:border-amber-400 dark:hover:border-amber-400"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            {/* Horário Final */}
            <div className="p-5 bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-neutral-800 dark:to-emerald-950/10 rounded-2xl border border-gray-200/60 dark:border-neutral-700/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
                  <Moon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Horário Final</h3>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">Quando a IA para de atender</p>
                </div>
              </div>
              <select
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value))}
                disabled={!canEdit}
                className="w-full px-4 py-3 text-xl font-bold text-center text-gray-900 dark:text-white bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-all cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-400"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumo do horário */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                {enabled ? (
                  <>A IA atenderá das <span className="font-bold">{startHour}:00</span> às <span className="font-bold">{endHour}:00</span></>
                ) : (
                  <>Horário de funcionamento desativado - A IA atenderá 24 horas</>
                )}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 px-4 py-3 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}