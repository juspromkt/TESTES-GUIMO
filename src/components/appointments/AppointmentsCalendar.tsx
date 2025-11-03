import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Handshake,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { addMinutes, format, parseISO } from 'date-fns';

import Modal from '../Modal';
import SidePanel from '../SidePanel';
import DealDetails from '../../pages/DealDetails';
import type { Deal } from '../../types/deal';

interface Appointment {
  Id: number;
  id_negociacao: number;
  dataInicio: string;
  dataFinal: string;
  nomeCliente: string;
  nome?: string;
  descricao?: string;
  titulo?: string;
  deal?: { titulo: string };
}



interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  extendedProps: { appointment: Appointment };
}

export default function AppointmentsCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [clientName, setClientName] = useState('');
  const [appointmentName, setAppointmentName] = useState('');
  const [appointmentDesc, setAppointmentDesc] = useState('');
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [dealsSearchTerm, setDealsSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryAppointment, setSummaryAppointment] = useState<Appointment | null>(null);
  const [isDealPanelOpen, setIsDealPanelOpen] = useState(false);
  const [selectedDealForPanel, setSelectedDealForPanel] = useState<number | null>(null);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const parsed = appointments.map((a) => {
      const start = new Date(a.dataInicio);
      const end = new Date(a.dataFinal);
      return {
        title: a.nome || a.nomeCliente,
        start,
        end,
        extendedProps: { appointment: a },
      } as CalendarEvent;
    });
    setEvents(parsed);
  }, [appointments]);

  const fetchAppointments = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/get',
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar agendamentos');
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDealId(appointment.id_negociacao);
    setSelectedStart(formatDateTimeForInput(appointment.dataInicio));
    setSelectedEnd(formatDateTimeForInput(appointment.dataFinal));
    setClientName(appointment.nomeCliente);
    setAppointmentName(appointment.nome || '');
    setAppointmentDesc(appointment.descricao || '');
    fetchDeals();
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  const fetchDeals = async () => {
    if (!token) return;
    try {
      setLoadingDeals(true);
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/get',
        {
          method: 'POST',
          headers: { token, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        },
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar negociações');
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar negociações:', err);
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStart || !selectedEnd || !clientName) return;

    const startDate = new Date(selectedStart);
    const endDate = new Date(selectedEnd);
    if (startDate.toDateString() !== endDate.toDateString()) {
      setErrorMessage('A data final deve ocorrer no mesmo dia da data inicial');
      return;
    }
    if (endDate <= startDate) {
      setErrorMessage('A data final deve ser posterior à data inicial');
      return;
    }

    setErrorMessage('');
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
          body: JSON.stringify({
            id_negociacao: selectedDealId,
            dataInicio: formatDateTimeWithTZ(selectedStart),
            dataFinal: formatDateTimeWithTZ(selectedEnd),
            nomeCliente: clientName,
            nome: appointmentName,
            descricao: appointmentDesc,
          }),
        },
      );

      if (!response.ok) throw new Error('Erro ao criar agendamento');

      await fetchAppointments();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
      setErrorMessage('Erro ao criar agendamento');
    }
  };

  const handleEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !selectedStart || !selectedEnd || !clientName)
      return;

    const startDate = new Date(selectedStart);
    const endDate = new Date(selectedEnd);
    if (startDate.toDateString() !== endDate.toDateString()) {
      setErrorMessage('A data final deve ocorrer no mesmo dia da data inicial');
      return;
    }
    if (endDate <= startDate) {
      setErrorMessage('A data final deve ser posterior à data inicial');
      return;
    }

    setErrorMessage('');
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/update',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            token,
          },
          body: JSON.stringify({
            id: selectedAppointment.Id,
            id_negociacao: selectedDealId,
            dataInicio: formatDateTimeWithTZ(selectedStart),
            dataFinal: formatDateTimeWithTZ(selectedEnd),
            nomeCliente: clientName,
            nome: appointmentName,
            descricao: appointmentDesc,
          }),
        },
      );

      if (!response.ok) throw new Error('Erro ao atualizar agendamento');

      await fetchAppointments();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err);
      setErrorMessage('Erro ao atualizar agendamento');
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    setErrorMessage('');
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/delete?id=${selectedAppointment.Id}`,
        {
          method: 'DELETE',
          headers: { token },
        },
      );

      if (!response.ok) throw new Error('Erro ao excluir agendamento');

      await fetchAppointments();
      setIsDeleteModalOpen(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      setErrorMessage('Erro ao excluir agendamento');
    }
  };

  const resetForm = () => {
    setSelectedDealId(null);
    setSelectedStart('');
    setSelectedEnd('');
    setClientName('');
    setAppointmentName('');
    setAppointmentDesc('');
    setDealsSearchTerm('');
    setSelectedAppointment(null);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CalendarIcon className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400" role="alert">
        {error}
      </div>
    );
  }

return (
  <>
    <style>{`
      /* Dark mode styles for datetime-local inputs */
      .dark input[type="datetime-local"] {
        color-scheme: dark;
      }

      .dark input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
      }

      /* Dark mode styles for FullCalendar */
      .dark .fc {
        --fc-border-color: #404040;
        --fc-button-text-color: #fff;
        --fc-button-bg-color: #3b82f6;
        --fc-button-border-color: #3b82f6;
        --fc-button-hover-bg-color: #2563eb;
        --fc-button-hover-border-color: #2563eb;
        --fc-button-active-bg-color: #1d4ed8;
        --fc-button-active-border-color: #1d4ed8;
        --fc-event-bg-color: #3b82f6;
        --fc-event-border-color: #3b82f6;
        --fc-page-bg-color: transparent;
        --fc-neutral-bg-color: #262626;
        --fc-neutral-text-color: #d4d4d4;
        --fc-today-bg-color: rgba(59, 130, 246, 0.1);
      }

      .dark .fc-theme-standard td,
      .dark .fc-theme-standard th {
        border-color: #404040;
      }

      .dark .fc-col-header-cell {
        background-color: #262626;
        color: #d4d4d4;
      }

      .dark .fc-daygrid-day-number {
        color: #d4d4d4;
      }

      .dark .fc-day-today .fc-daygrid-day-number {
        background-color: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
      }

      .dark .fc .fc-button {
        background-color: #3b82f6;
        border-color: #3b82f6;
        color: white;
      }

      .dark .fc .fc-button:hover {
        background-color: #2563eb;
        border-color: #2563eb;
      }

      .dark .fc .fc-button-primary:disabled {
        background-color: #404040;
        border-color: #404040;
        color: #737373;
      }

      .dark .fc-toolbar-title {
        color: #f5f5f5;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .dark .fc-list-event:hover td {
        background-color: #404040;
      }

      .dark .fc-list-day-cushion {
        background-color: #262626;
        color: #d4d4d4;
      }

      .dark .fc-popover {
        background-color: #262626;
        border-color: #404040;
      }

      .dark .fc-popover-header {
        background-color: #171717;
        color: #d4d4d4;
      }

      .dark .fc-popover-body {
        color: #d4d4d4;
      }

      .dark .fc-daygrid-day {
        background-color: transparent;
      }

      .dark .fc-daygrid-day-bg {
        background-color: #171717;
      }

      .dark .fc-timegrid-slot {
        border-color: #404040;
      }

      .dark .fc-timegrid-axis {
        color: #d4d4d4;
      }

      .dark .fc-list-event {
        color: #d4d4d4;
      }

      .dark .fc-list-day-text,
      .dark .fc-list-day-side-text {
        color: #d4d4d4;
      }

      /* Light mode title */
      .fc-toolbar-title {
        font-size: 1.5rem;
        font-weight: 600;
      }

      /* Better event styling */
      .fc-event {
        border-radius: 6px;
        padding: 2px 4px;
        font-size: 0.875rem;
      }
    `}</style>
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        locale={ptBrLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        selectable
        events={events}
        dateClick={(info) => {
          const end = addMinutes(info.date, 60);
          setSelectedStart(formatDateTimeForInput(info.date.toISOString()));
          setSelectedEnd(formatDateTimeForInput(end.toISOString()));
          setSelectedDealId(null);
          setClientName('');
          setAppointmentName('');
          setAppointmentDesc('');
          fetchDeals();
          setIsCreateModalOpen(true);
        }}
        eventClick={(info) => {
          const calEvent = info.event.extendedProps as { appointment: Appointment };
          setSummaryAppointment(calEvent.appointment);
          setIsSummaryModalOpen(true);
        }}
        height="auto"
        contentHeight="auto"
        aspectRatio={1.8}
        eventClassNames="!bg-blue-600 dark:!bg-blue-500 !border-blue-500 dark:!border-blue-400 !text-white !rounded-md hover:!bg-blue-700 dark:hover:!bg-blue-600 !transition-colors !cursor-pointer"
      />

    </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Novo Agendamento"
        maxWidth="lg"
        maxHeight="90vh"
      >
        <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <form onSubmit={handleCreateAppointment} className="space-y-4 p-5 overflow-y-auto max-h-[70vh]">
            {/* Deal Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <Handshake className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Negociação (Opcional)
              </label>
              {loadingDeals ? (
                <div className="flex items-center justify-center h-12 text-gray-500 dark:text-neutral-400 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-sm">
                  <CalendarIcon className="w-4 h-4 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou título..."
                    value={dealsSearchTerm}
                    onChange={(e) => setDealsSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 text-sm transition-colors"
                  />
                  <select
                    value={selectedDealId || ''}
                    onChange={(e) => setSelectedDealId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                    size={8}
                  >
                    <option value="">Nenhuma negociação</option>
                    {deals
                      .filter((deal) => {
                        const searchLower = dealsSearchTerm.toLowerCase();
                        const matchesTitle = deal.titulo.toLowerCase().includes(searchLower);
                        const matchesName = deal.contato?.nome?.toLowerCase().includes(searchLower) || false;
                        const matchesPhone = deal.contato?.telefone?.includes(dealsSearchTerm) || false;
                        return matchesTitle || matchesName || matchesPhone;
                      })
                      .map((deal) => (
                        <option key={deal.Id} value={deal.Id}>
                          {deal.titulo} {deal.contato ? `- ${deal.contato.nome} (${deal.contato.telefone})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Você pode vincular este agendamento a uma negociação existente ou deixar sem vínculo
              </p>
            </div>

            {/* Date/Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                  <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  Data e Hora de Início
                </label>
                <input
                  type="datetime-local"
                  value={selectedStart}
                  onChange={(e) => setSelectedStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                  <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  Data e Hora de Término
                </label>
                <input
                  type="datetime-local"
                  value={selectedEnd}
                  onChange={(e) => setSelectedEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                  min={selectedStart}
                  max={selectedStart ? `${selectedStart.slice(0, 10)}T23:59` : undefined}
                  required
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 text-sm transition-colors"
                placeholder="Digite o nome do cliente"
                required
              />
            </div>

            {/* Appointment Name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Nome do Agendamento
              </label>
              <input
                type="text"
                value={appointmentName}
                onChange={(e) => setAppointmentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
              />
            </div>

            {/* Appointment Description */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Descrição
              </label>
              <textarea
                value={appointmentDesc}
                onChange={(e) => setAppointmentDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                rows={3}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 dark:text-red-300 text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <CalendarIcon className="w-4 h-4" />
                Criar Agendamento
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Summary Modal */}
      <Modal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        title="Detalhes do Agendamento"
      >
        {summaryAppointment && (
          <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Handshake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">
                      {summaryAppointment.nome || summaryAppointment.nomeCliente}
                    </h3>
                    {summaryAppointment.descricao && (
                      <p className="text-sm text-gray-600 dark:text-neutral-400 mb-1">
                        {summaryAppointment.descricao}
                      </p>
                    )}
                    <span className="text-xs text-gray-500 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
                      ID: {summaryAppointment.Id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsSummaryModalOpen(false);
                    openEditModal(summaryAppointment);
                  }}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Editar agendamento"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Details */}
              <div className="flex gap-2.5">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">CLIENTE</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-neutral-100">{summaryAppointment.nomeCliente}</p>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex-1">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs font-medium text-green-600 dark:text-green-400">DATA</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-neutral-100">
                        {format(parseISO(summaryAppointment.dataInicio), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400">HORÁRIO</p>
                      <p className="text-xs font-medium text-gray-900 dark:text-neutral-100">
                        {format(parseISO(summaryAppointment.dataInicio), 'HH:mm')} - {format(parseISO(summaryAppointment.dataFinal), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {summaryAppointment.id_negociacao && (
                <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-neutral-700">
                  <button
                    onClick={() => {
                      setSelectedDealForPanel(summaryAppointment.id_negociacao);
                      setIsDealPanelOpen(true);
                      setIsSummaryModalOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir no CRM</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Agendamento"
        maxWidth="lg"
        maxHeight="90vh"
      >
        <div className="rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <form onSubmit={handleEditAppointment} className="space-y-4 p-5 overflow-y-auto max-h-[70vh]">
            {/* Deal Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <Handshake className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Negociação (Opcional)
              </label>
              {loadingDeals ? (
                <div className="flex items-center justify-center h-12 text-gray-500 dark:text-neutral-400 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700">
                  <CalendarIcon className="w-4 h-4 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou título..."
                    value={dealsSearchTerm}
                    onChange={(e) => setDealsSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 text-sm transition-colors"
                  />
                  <select
                    value={selectedDealId || ''}
                    onChange={(e) => setSelectedDealId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                    size={8}
                  >
                    <option value="">Nenhuma negociação</option>
                    {deals
                      .filter((deal) => {
                        const searchLower = dealsSearchTerm.toLowerCase();
                        const matchesTitle = deal.titulo.toLowerCase().includes(searchLower);
                        const matchesName = deal.contato?.nome?.toLowerCase().includes(searchLower) || false;
                        const matchesPhone = deal.contato?.telefone?.includes(dealsSearchTerm) || false;
                        return matchesTitle || matchesName || matchesPhone;
                      })
                      .map((deal) => (
                        <option key={deal.Id} value={deal.Id}>
                          {deal.titulo} {deal.contato ? `- ${deal.contato.nome} (${deal.contato.telefone})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-neutral-500">
                Você pode vincular este agendamento a uma negociação existente ou deixar sem vínculo
              </p>
            </div>

            {/* Date/Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                  <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  Data e Hora de Início
                </label>
                <input
                  type="datetime-local"
                  value={selectedStart}
                  onChange={(e) => setSelectedStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                  <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  Data e Hora de Término
                </label>
                <input
                  type="datetime-local"
                  value={selectedEnd}
                  onChange={(e) => setSelectedEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                  min={selectedStart}
                  max={selectedStart ? `${selectedStart.slice(0, 10)}T23:59` : undefined}
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                placeholder="Digite o nome do cliente"
              />
            </div>

            {/* Appointment Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Nome do Agendamento
              </label>
              <input
                type="text"
                value={appointmentName}
                onChange={(e) => setAppointmentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
              />
            </div>

            {/* Appointment Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Descrição
              </label>
              <textarea
                value={appointmentDesc}
                onChange={(e) => setAppointmentDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm transition-colors"
                rows={3}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 dark:text-red-400 font-medium text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setErrorMessage('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    openDeleteModal(selectedAppointment!);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Excluir
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-200 dark:border-red-800/50 p-6">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Excluir Agendamento
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-red-200/50 dark:border-red-800/50">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 rounded-xl border border-gray-300 dark:border-neutral-600 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAppointment}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CalendarIcon className="w-4 h-4" />
                Excluir Agendamento
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Deal Detail Panel */}
      <SidePanel
        isOpen={isDealPanelOpen}
        onClose={() => {
          setIsDealPanelOpen(false);
          setSelectedDealForPanel(null);
        }}
        title="Detalhes da Negociação"
        width="40%"
      >
        {selectedDealForPanel && (
          <DealDetails
            dealId={selectedDealForPanel}
            hideConversations
            onClose={() => {
              setIsDealPanelOpen(false);
              setSelectedDealForPanel(null);
            }}
          />
        )}
      </SidePanel>
  </>
);
}

function formatDateTimeForInput(dateStr: string): string {
  return dateStr.slice(0, 16);
}

function formatDateTimeWithTZ(input: string): string {
  return input ? `${input}:00-03:00` : '';
}