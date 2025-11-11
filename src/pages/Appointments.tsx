import React, { useState, useEffect } from 'react';
import { Calendar, CalendarDays, Settings, Cog, Clock, Loader2 } from 'lucide-react';
import AppointmentsList from '../components/appointments/AppointmentsList';
import AppointmentsConfig from '../components/appointments/AppointmentsConfig';
import AppointmentsCalendar from '../components/appointments/AppointmentsCalendar';
import SchedulingSection from '../components/ai-agent/SchedulingSection';
import ScheduleWindowsSection from '../components/ai-agent/ScheduleWindowsSection';
import { hasPermission } from '../utils/permissions';

type TabType = 'appointments' | 'calendar' | 'reminders' | 'config' | 'scheduleWindows';

export default function Appointments() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [canEdit, setCanEdit] = useState(false);
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // Check if user has permission to edit schedules
    setCanEdit(hasPermission('can_edit_schedule'));
    fetchSchedulingStatus();
  }, []);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : '';

  const [scheduling, setScheduling] = useState({
    isAtivo: false,
    id_agenda: '',
    nome: '',
    descricao: '',
    prompt_consulta_horarios: '',
    prompt_marcar_horario: '',
    duracao_horario: null,
    limite_agendamento_horario: null,
    agenda_padrao: 'GOOGLE_MEET' as 'GOOGLE_MEET' | 'AGENDA_INTERNA' | 'SISTEMA_EXTERNO',
    url_consulta_externa: null,
    url_marcacao_externa: null,
  });

  const fetchSchedulingStatus = async () => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/get',
        { headers: { token } }
      );
      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      if (Array.isArray(data) && data.length > 0) {
        setIsSchedulingEnabled(!!data[0].isAtivo);
        setScheduling(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar status do agendamento:', err);
    }
  };

  const handleToggleScheduling = async () => {
    if (!canEdit) return;

    const previous = isSchedulingEnabled;
    setToggling(true);

    try {
      // Atualiza o status localmente primeiro
      const newStatus = !previous;
      setIsSchedulingEnabled(newStatus);

      // Envia para o servidor
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
          body: JSON.stringify({
            ...scheduling,
            isAtivo: newStatus,
          }),
        }
      );

      if (!response.ok) throw new Error('Erro ao alternar agendamento');

      // Recarrega o status para confirmar
      await fetchSchedulingStatus();
    } catch (err) {
      console.error(err);
      setIsSchedulingEnabled(previous);
    } finally {
      setToggling(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'appointments', label: 'Lista', icon: CalendarDays },
    { id: 'config', label: 'Configurações', icon: Cog },
    { id: 'scheduleWindows', label: 'Horários Disponíveis', icon: Clock },
    { id: 'reminders', label: 'Lembretes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 transition-theme">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700 p-6 transition-theme">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Agendamentos
          </h2>

          {/* Toggle de Ativação */}
          <div className="mb-4">
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {toggling
                    ? isSchedulingEnabled
                      ? 'Desativando...'
                      : 'Ativando...'
                    : isSchedulingEnabled
                    ? 'Agendamento Ativado'
                    : 'Agendamento Desativado'}
                </span>
                {toggling && (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-gray-500" />
                )}
              </div>

              <button
                onClick={handleToggleScheduling}
                disabled={toggling || !canEdit}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  isSchedulingEnabled ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-red-500 dark:bg-red-600'
                } ${toggling || !canEdit ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    isSchedulingEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 mt-1">
              {toggling
                ? 'Aguarde... aplicando alteração'
                : isSchedulingEnabled
                ? 'Seu agendamento está ativo.'
                : 'Seu agendamento está desativado.'}
            </p>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl text-[15px] font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-500'
                    }`}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700 transition-theme overflow-y-auto">
          <div className="p-6 sm:p-8">
            {activeTab === 'calendar' && <AppointmentsCalendar />}
            {activeTab === 'appointments' && <AppointmentsList canEdit={canEdit} />}
            {activeTab === 'reminders' && <AppointmentsConfig canEdit={canEdit} />}
            {activeTab === 'config' && (
              <SchedulingSection
                scheduling={scheduling}
                setScheduling={setScheduling}
                token={token}
                canEdit={canEdit}
              />
            )}
            {activeTab === 'scheduleWindows' && (
              <ScheduleWindowsSection token={token} canEdit={canEdit} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
