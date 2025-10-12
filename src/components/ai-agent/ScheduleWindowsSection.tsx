import React, { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';

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
    <div className="flex items-center gap-2" key="editing-row">
      <select
        value={editing?.window.horarioInicio}
        onChange={(e) =>
          setEditing((prev) =>
            prev ? { ...prev, window: { ...prev.window, horarioInicio: e.target.value } } : null
          )
        }
        className="border rounded-md px-2 py-1"
      >
        {timeOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <span>-</span>
      <select
        value={editing?.window.horarioFinal}
        onChange={(e) =>
          setEditing((prev) =>
            prev ? { ...prev, window: { ...prev.window, horarioFinal: e.target.value } } : null
          )
        }
        className="border rounded-md px-2 py-1"
      >
        {timeOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        className="p-1 text-emerald-600 hover:text-emerald-800"
      >
        <Save className="w-4 h-4" />
      </button>
      <button onClick={cancelEditing} className="p-1 text-red-600 hover:text-red-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 mt-6 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-300 p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Horários Disponíveis (Funciona na agenda interna e Google Agenda)</h2>
      {days.map((day) => (
        <div key={day} className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">{dayLabels[day]}</span>
            {canEdit && (!editing || editing.day !== day) && (
              <button
                onClick={() => startEditing(day)}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            )}
          </div>
          <div className="space-y-2">
            {windows[day].map((w) => (
                editing && editing.day === day && editing.window.Id === w.Id ? (
                  <React.Fragment key={w.Id}>{renderEditRow()}</React.Fragment>
                ) : (
                <div key={w.Id} className="flex items-center gap-2 text-gray-700">
                  <span>
                    {w.horarioInicio} - {w.horarioFinal}
                  </span>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => startEditing(day, w)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(w.Id!)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )
            ))}
              {editing && editing.day === day && !editing.window.Id && renderEditRow()}
            {windows[day].length === 0 && (!editing || editing.day !== day) && (
              <p className="text-sm text-gray-500">Nenhuma janela cadastrada</p>
            )}
            {editing && editing.day === day && error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
