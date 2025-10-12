import React, { useEffect, useState } from 'react';
import { Clock, Save, Loader2, AlertCircle } from 'lucide-react';

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
  const [success, setSuccess] = useState('');

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

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

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

      setSuccess('Horário de funcionamento salvo com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-6 h-6 text-emerald-600" />
        Horário de Funcionamento
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={!canEdit}
            />
            <div
              className={`w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-emerald-300 peer-checked:bg-emerald-500 transition-all relative ${!canEdit ? 'opacity-50' : ''}`}
            >
              <span className="absolute top-[2px] left-[2px] h-5 w-5 bg-white border border-gray-300 rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
            <span className="ml-3 text-gray-700">Ativar horário de funcionamento</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Início</label>
          <input
            type="number"
            min="0"
            max="23"
            value={startHour}
            onChange={(e) => setStartHour(parseInt(e.target.value))}
            disabled={!canEdit}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário Final</label>
          <input
            type="number"
            min="0"
            max="23"
            value={endHour}
            onChange={(e) => setEndHour(parseInt(e.target.value))}
            disabled={!canEdit}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}