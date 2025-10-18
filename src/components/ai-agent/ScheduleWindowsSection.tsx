import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Check } from 'lucide-react';

interface ScheduleWindowsSectionProps {
  token: string;
  canEdit: boolean;
}

type Day =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

interface TimeWindow {
  Id?: number;
  dia_semana: Day;
  horarioInicio: string;
  horarioFinal: string;
}

interface TimeWindowResponse {
  Id: number;
  dia_semana: Day;
  horarioInicio: string;
  horarioFinal: string;
}

const dayLabels: Record<Day, string> = {
  sunday: 'Domingo',
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
};

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, '0');
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

const createEmptyState = (): Record<Day, TimeWindow[]> => ({
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
});

export default function ScheduleWindowsSection({ token, canEdit }: ScheduleWindowsSectionProps) {
  const [windows, setWindows] = useState<Record<Day, TimeWindow[]>>(createEmptyState());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ day: Day; window: TimeWindow } | null>(null);
  const [error, setError] = useState('');
  const fetched = useRef(false);

  const fetchWindows = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/horario/get', {
        headers: { token },
      });
      if (!res.ok) throw new Error();
      let data: unknown = [];
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }
      const grouped: Record<Day, TimeWindow[]> = createEmptyState();
      if (Array.isArray(data)) {
        (data as TimeWindowResponse[]).forEach((item) => {
          const day = item.dia_semana as Day;
          if (grouped[day]) {
            grouped[day].push({
              Id: item.Id,
              dia_semana: day,
              horarioInicio: item.horarioInicio,
              horarioFinal: item.horarioFinal,
            });
          }
        });
      }
      setWindows(grouped);
    } catch (err) {
      console.error('Erro ao carregar janelas:', err);
      setWindows(createEmptyState());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchWindows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const hasConflict = (day: Day, start: string, end: string, ignoreId?: number) => {
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return windows[day].some((w) => {
      if (w.Id === ignoreId) return false;
      const ws = timeToMinutes(w.horarioInicio);
      const we = timeToMinutes(w.horarioFinal);
      return (
        (s < we && e > ws) ||
        s === we ||
        e === ws
      );
    });
  };

  const startEditing = (day: Day, w?: TimeWindow) => {
    setError('');
    if (w) {
      setEditing({ day, window: { ...w } });
    } else {
      setEditing({
        day,
        window: {
          dia_semana: day,
          horarioInicio: '08:00',
          horarioFinal: '09:00',
        },
      });
    }
  };

  const cancelEditing = () => {
    setEditing(null);
    setError('');
  };

  const handleSave = async () => {
    if (!editing) return;
    const { day, window } = editing;
    const { horarioInicio, horarioFinal, Id } = window;

    if (timeToMinutes(horarioInicio) >= timeToMinutes(horarioFinal)) {
      setError('Horário inicial deve ser menor que o final');
      return;
    }
    if (hasConflict(day, horarioInicio, horarioFinal, Id)) {
      setError('Horários conflitantes');
      return;
    }

    try {
      const url = Id
        ? 'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/horario/update'
        : 'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/horario/create';
      const method = Id ? 'PUT' : 'POST';
      const body = Id
        ? { Id, dia_semana: day, horarioInicio, horarioFinal }
        : { dia_semana: day, horarioInicio, horarioFinal };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      await fetchWindows();
      setEditing(null);
    } catch (err) {
      console.error('Erro ao salvar janela:', err);
      setError('Erro ao salvar janela');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Deseja excluir esta janela?')) return;
    try {
      const res = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/horario/delete?id=${id}`,
        {
          method: 'DELETE',
          headers: { token },
        }
      );
      if (!res.ok) throw new Error();
      await fetchWindows();
    } catch (err) {
      console.error('Erro ao excluir janela:', err);
      alert('Erro ao excluir janela');
    }
  };

  const days: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const renderEditRow = () => (
    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded border border-blue-300 dark:border-blue-700" key="editing-row">
      <div className="flex items-center gap-2">
        <select
          value={editing?.window.horarioInicio}
          onChange={(e) =>
            setEditing((prev) =>
              prev ? { ...prev, window: { ...prev.window, horarioInicio: e.target.value } } : null
            )
          }
          className="border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded px-2 py-1 text-sm"
        >
          {timeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="text-gray-700 dark:text-neutral-300 text-sm">-</span>
        <select
          value={editing?.window.horarioFinal}
          onChange={(e) =>
            setEditing((prev) =>
              prev ? { ...prev, window: { ...prev.window, horarioFinal: e.target.value } } : null
            )
          }
          className="border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 rounded px-2 py-1 text-sm"
        >
          {timeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleSave}
          className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
          title="Salvar"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={cancelEditing}
          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const handleReplicateDay = async (sourceDay: Day) => {
    if (windows[sourceDay].length === 0) {
      alert('Não há horários neste dia para replicar');
      return;
    }

    if (!window.confirm('Isso irá substituir os horários existentes de terça a sexta-feira pelos horários deste dia. Deseja continuar?')) {
      return;
    }

    try {
      const otherDays: Day[] = ['tuesday', 'wednesday', 'thursday', 'friday'];

      // Para cada dia, excluir todos os horários existentes
      for (const day of otherDays) {
        const dayWindows = windows[day];
        for (const window of dayWindows) {
          if (window.Id) {
            await fetch(
              `https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/horario/delete?id=${window.Id}`,
              {
                method: 'DELETE',
                headers: { token },
              }
            );
          }
        }
      }

      // Criar os mesmos horários do dia de origem para os outros dias
      for (const day of otherDays) {
        for (const sourceDayWindow of windows[sourceDay]) {
          const body = {
            dia_semana: day,
            horarioInicio: sourceDayWindow.horarioInicio,
            horarioFinal: sourceDayWindow.horarioFinal,
          };

          await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/horario/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              token,
            },
            body: JSON.stringify(body),
          });
        }
      }

      await fetchWindows();
      alert('Horários replicados com sucesso para terça a sexta-feira!');
    } catch (err) {
      console.error('Erro ao replicar horários:', err);
      alert('Erro ao replicar horários');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-2">Horários Disponíveis</h2>
        <p className="text-sm text-gray-500 dark:text-neutral-400">Funciona na agenda interna e Google Agenda</p>
      </div>

      <div className="space-y-4">
        {days.map((day) => (
          <div key={day} className="bg-gray-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-neutral-100">{dayLabels[day]}</span>
                {canEdit && windows[day].length > 0 && (
                  <button
                    onClick={() => handleReplicateDay(day)}
                    className="text-xs px-2 py-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors border border-blue-200 dark:border-blue-800"
                    title="Replicar horários deste dia para terça a sexta-feira"
                  >
                    Replicar para todos os dias
                  </button>
                )}
              </div>
              {canEdit && (!editing || editing.day !== day) && (
                <button
                  onClick={() => startEditing(day)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              )}
            </div>
            <div className="space-y-2">
              {windows[day].map((w) => (
                  editing && editing.day === day && editing.window.Id === w.Id ? (
                    <React.Fragment key={w.Id}>{renderEditRow()}</React.Fragment>
                  ) : (
                  <div key={w.Id} className="flex items-center justify-between bg-white dark:bg-neutral-800 px-3 py-2 rounded border border-gray-200 dark:border-neutral-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                      {w.horarioInicio} - {w.horarioFinal}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(day, w)}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(w.Id!)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              ))}
                {editing && editing.day === day && !editing.window.Id && renderEditRow()}
              {windows[day].length === 0 && (!editing || editing.day !== day) && (
                <p className="text-xs text-gray-500 dark:text-neutral-400 text-center py-2">Nenhum horário cadastrado</p>
              )}
              {editing && editing.day === day && error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">{error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
