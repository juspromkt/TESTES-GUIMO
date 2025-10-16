import React, { useState, useEffect } from 'react';
import { Calendar, CalendarDays, Settings } from 'lucide-react';
import AppointmentsList from '../components/appointments/AppointmentsList';
import AppointmentsConfig from '../components/appointments/AppointmentsConfig';
import AppointmentsCalendar from '../components/appointments/AppointmentsCalendar';
import { hasPermission } from '../utils/permissions';

type TabType = 'appointments' | 'calendar' | 'settings';

export default function Appointments() {
const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    // Check if user has permission to edit schedules
    setCanEdit(hasPermission('can_edit_schedule'));
  }, []);

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'appointments', label: 'Lista', icon: CalendarDays },
    { id: 'settings', label: 'Lembretes', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Agendamentos</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300 dark:border-neutral-700">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200'
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
      {activeTab === 'settings' && <AppointmentsConfig canEdit={canEdit} />}
    </div>
  );
}