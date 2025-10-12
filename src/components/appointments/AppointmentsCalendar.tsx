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
        <CalendarIcon className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600" role="alert">
        {error}
      </div>
    );
  }

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Calendar Container */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
        <div className="p-6">
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
            height="70vh"
            eventClassNames="!bg-gradient-to-r !from-blue-500 !to-indigo-600 !border-blue-400 !text-white !rounded-lg !shadow-md hover:!shadow-lg !transition-all !duration-200"
          />
        </div>
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
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-300/50">
          <form onSubmit={handleCreateAppointment} className="space-y-6 p-6 overflow-y-auto max-h-[70vh]">
            {/* Deal Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Handshake className="w-4 h-4 text-blue-600" />
                Negociação
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar negociação..."
                    value={dealsSearchTerm}
                    onChange={(e) => setDealsSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm">
                  {loadingDeals ? (
                    <div className="flex items-center justify-center h-20 text-gray-500">
                      <CalendarIcon className="w-5 h-5 animate-spin mr-2" />
                      Carregando negociações...
                    </div>
                  ) : (
                    deals
                      .filter((deal) => (deal.titulo || '').toLowerCase().includes(dealsSearchTerm.toLowerCase()))
                      .map((deal) => (
                        <div
                          key={deal.Id}
                          onClick={() => setSelectedDealId(deal.Id)}
                          className={`p-4 cursor-pointer hover:bg-blue-50 transition-all duration-200 border-b border-gray-300 last:border-b-0 ${
                            selectedDealId === deal.Id 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-l-blue-500' 
                              : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{deal.titulo}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Date/Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-green-600" />
                  Data e Hora de Início
                </label>
                <input
                  type="datetime-local"
                  value={selectedStart}
                  onChange={(e) => setSelectedStart(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-red-600" />
                  Data e Hora de Término
                </label>
                <input
                  type="datetime-local"
                  value={selectedEnd}
                  onChange={(e) => setSelectedEnd(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  min={selectedStart}
                  max={selectedStart ? `${selectedStart.slice(0, 10)}T23:59` : undefined}
                  required
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-purple-600" />
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                placeholder="Digite o nome do cliente"
                required
              />
            </div>

            {/* Appointment Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                Nome do Agendamento
              </label>
              <input
                type="text"
                value={appointmentName}
                onChange={(e) => setAppointmentName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Appointment Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                Descrição
              </label>
              <textarea
                value={appointmentDesc}
                onChange={(e) => setAppointmentDesc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                rows={3}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-300/50">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-300/50">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                    <Handshake className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {summaryAppointment.nome || summaryAppointment.nomeCliente}
                    </h3>
                    {summaryAppointment.descricao && (
                      <p className="text-sm text-gray-600 mb-1">
                        {summaryAppointment.descricao}
                      </p>
                    )}
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      ID: {summaryAppointment.Id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsSummaryModalOpen(false);
                    openEditModal(summaryAppointment);
                  }}
                  className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                  title="Editar agendamento"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Cliente</p>
                        <p className="text-sm font-semibold text-gray-900">{summaryAppointment.nomeCliente}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Data</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(parseISO(summaryAppointment.dataInicio), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Horário</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(parseISO(summaryAppointment.dataInicio), 'HH:mm')} - {format(parseISO(summaryAppointment.dataFinal), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {summaryAppointment.id_negociacao && (
                <div className="flex justify-end pt-6 border-t border-gray-300/50">
                  <button
                    onClick={() => navigate(`/crm/${summaryAppointment.id_negociacao}`)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ir para Negociação</span>
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
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-300/50">
          <form onSubmit={handleEditAppointment} className="space-y-6 p-6 overflow-y-auto max-h-[70vh]">
            {/* Deal Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Handshake className="w-4 h-4 text-blue-600" />
                Negociação
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar negociação..."
                    value={dealsSearchTerm}
                    onChange={(e) => setDealsSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm">
                  {loadingDeals ? (
                    <div className="flex items-center justify-center h-20 text-gray-500">
                      <CalendarIcon className="w-5 h-5 animate-spin mr-2" />
                      Carregando negociações...
                    </div>
                  ) : (
                    deals
                      .filter((deal) =>
                        (deal.titulo || '').toLowerCase().includes(dealsSearchTerm.toLowerCase()),
                      )
                      .map((deal) => (
                        <div
                          key={deal.Id}
                          onClick={() => setSelectedDealId(deal.Id)}
                          className={`p-4 cursor-pointer hover:bg-blue-50 transition-all duration-200 border-b border-gray-300 last:border-b-0 ${
                            selectedDealId === deal.Id 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-l-blue-500' 
                              : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{deal.titulo}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Date/Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-green-600" />
                  Data e Hora de Início
                </label>
                <input
                  type="datetime-local"
                  value={selectedStart}
                  onChange={(e) => setSelectedStart(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 text-red-600" />
                  Data e Hora de Término
                </label>
                <input
                  type="datetime-local"
                  value={selectedEnd}
                  onChange={(e) => setSelectedEnd(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  min={selectedStart}
                  max={selectedStart ? `${selectedStart.slice(0, 10)}T23:59` : undefined}
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-purple-600" />
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                placeholder="Digite o nome do cliente"
              />
            </div>

            {/* Appointment Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                Nome do Agendamento
              </label>
              <input
                type="text"
                value={appointmentName}
                onChange={(e) => setAppointmentName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Appointment Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                Descrição
              </label>
              <textarea
                value={appointmentDesc}
                onChange={(e) => setAppointmentDesc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                rows={3}
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-300/50">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setErrorMessage('');
                }}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    openDeleteModal(selectedAppointment!);
                  }}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Excluir
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200/50 p-6">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-red-600" />
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
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium text-sm">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-red-200/50">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-300 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAppointment}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <CalendarIcon className="w-4 h-4" />
                Excluir Agendamento
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
);
}

function formatDateTimeForInput(dateStr: string): string {
  return dateStr.slice(0, 16);
}

function formatDateTimeWithTZ(input: string): string {
  return input ? `${input}:00-03:00` : '';
}