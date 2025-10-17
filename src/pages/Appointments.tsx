import React, { useState, useEffect } from 'react';
import { Calendar, CalendarDays, Settings, Cog } from 'lucide-react';
import AppointmentsList from '../components/appointments/AppointmentsList';
import AppointmentsConfig from '../components/appointments/AppointmentsConfig';
import AppointmentsCalendar from '../components/appointments/AppointmentsCalendar';
import SchedulingSection from '../components/ai-agent/SchedulingSection';
import { hasPermission } from '../utils/permissions';

type TabType = 'appointments' | 'calendar' | 'reminders' | 'config';

export default function Appointments() {
const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    // Check if user has permission to edit schedules
    setCanEdit(hasPermission('can_edit_schedule'));
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

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'appointments', label: 'Lista', icon: CalendarDays },
    { id: 'reminders', label: 'Lembretes', icon: Settings },
    { id: 'config', label: 'Configurações', icon: Cog },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title and Tabs */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-6">Agendamentos</h1>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
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
    </div>
  );
}
