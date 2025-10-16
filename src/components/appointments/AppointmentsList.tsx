import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, User, Loader2, AlertCircle, Search, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Pagination from '../Pagination';
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
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'month';

interface AppointmentsListProps {
  canEdit: boolean;
}

export default function AppointmentsList({ canEdit }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Create appointment states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [clientName, setClientName] = useState('');
  const [appointmentName, setAppointmentName] = useState('');
  const [appointmentDesc, setAppointmentDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsSearchTerm, setDealsSearchTerm] = useState('');

  // Edit appointment states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState(false);

  // Delete appointment states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

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
        throw new Error('O erro ocorreu ao buscar o histórico de agendamentos!');
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

  const fetchDeals = async () => {
    if (!token) return;
    try {
      setDealsLoading(true);
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/get',
        {
          method: 'POST',
          headers: { token, 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar negociações');
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar negociações:', err);
      setError('Erro ao carregar negociações');
    } finally {
      setDealsLoading(false);
    }
  };

  const formatDateTimeForInput = (dateStr: string) => dateStr.slice(0, 16);

  const formatDateTimeWithTZ = (input: string) =>
    input ? `${input}:00-03:00` : '';

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStart || !selectedEnd || !clientName) return;

    const startDate = new Date(selectedStart);
    const endDate = new Date(selectedEnd);
    if (startDate.toDateString() !== endDate.toDateString()) {
      setError('A data final deve ocorrer no mesmo dia da data inicial');
      return;
    }
    if (endDate <= startDate) {
      setError('A data final deve ser posterior à data inicial');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            id_negociacao: selectedDealId,
            dataInicio: formatDateTimeWithTZ(selectedStart),
            dataFinal: formatDateTimeWithTZ(selectedEnd),
            nomeCliente: clientName,
            nome: appointmentName,
            descricao: appointmentDesc
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao criar agendamento');
      }

      await fetchAppointments();
      setSuccess('Agendamento criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
      setError('Erro ao criar agendamento');
    } finally {
      setCreating(false);
    }
  };

  const handleEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !selectedStart || !selectedEnd || !clientName) return;

    const startDate = new Date(selectedStart);
    const endDate = new Date(selectedEnd);
    if (startDate.toDateString() !== endDate.toDateString()) {
      setError('A data final deve ocorrer no mesmo dia da data inicial');
      return;
    }
    if (endDate <= startDate) {
      setError('A data final deve ser posterior à data inicial');
      return;
    }

    setEditing(true);
    setError('');

    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/update',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            id: selectedAppointment.Id,
            id_negociacao: selectedDealId,
            dataInicio: formatDateTimeWithTZ(selectedStart),
            dataFinal: formatDateTimeWithTZ(selectedEnd),
            nomeCliente: clientName,
            nome: appointmentName,
            descricao: appointmentDesc
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar agendamento');
      }

      await fetchAppointments();
      setSuccess('Agendamento atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setIsEditModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err);
      setError('Erro ao atualizar agendamento');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/delete?id=${selectedAppointment.Id}`,
        {
          method: 'DELETE',
          headers: { token }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir agendamento');
      }

      await fetchAppointments();
      setSuccess('Agendamento excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setIsDeleteModalOpen(false);
      setSelectedAppointment(null);
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      setError('Erro ao excluir agendamento');
    } finally {
      setDeleting(false);
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

  const openEditModal = (appointment: Appointment) => {
    if (!canEdit) return;

    setSelectedAppointment(appointment);
    setSelectedDealId(appointment.id_negociacao || null);
    setSelectedStart(formatDateTimeForInput(appointment.dataInicio));
    setSelectedEnd(formatDateTimeForInput(appointment.dataFinal));
    setClientName(appointment.nomeCliente);
    setAppointmentName(appointment.nome || '');
    setAppointmentDesc(appointment.descricao || '');
    setIsEditModalOpen(true);
    fetchDeals();
  };

  const openDeleteModal = (appointment: Appointment) => {
    if (!canEdit) return;
    
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const filterAppointments = (appointments: Appointment[]) => {
    return appointments.filter(appointment => {
      const matchesSearch =
        searchTerm === '' ||
        ((appointment.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (appointment.nomeCliente || '').toLowerCase().includes(searchTerm.toLowerCase()))

      let matchesDate = true;
      const appointmentDate = parseISO(appointment.dataInicio);
      const today = startOfDay(new Date());

      switch (dateFilter) {
        case 'today':
          matchesDate = isWithinInterval(appointmentDate, {
            start: startOfDay(today),
            end: endOfDay(today)
          });
          break;
        case 'tomorrow': {
          const tomorrow = startOfDay(new Date());
          tomorrow.setDate(tomorrow.getDate() + 1);
          matchesDate = isWithinInterval(appointmentDate, {
            start: startOfDay(tomorrow),
            end: endOfDay(tomorrow)
          });
          break;
        }
        case 'week':
          matchesDate = isWithinInterval(appointmentDate, {
            start: startOfDay(today),
            end: endOfDay(subDays(today, -7))
          });
          break;
        case 'month':
          matchesDate = isWithinInterval(appointmentDate, {
            start: startOfDay(today),
            end: endOfDay(subDays(today, -30))
          });
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesDate;
    });
  };

  const filteredAppointments = useMemo(
    () => filterAppointments(appointments),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appointments, searchTerm, dateFilter]
  );

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, currentPage, itemsPerPage]);

  const filteredDeals = useMemo(
    () =>
      deals.filter((deal) => {
        const searchLower = dealsSearchTerm.toLowerCase();
        const matchesTitle = (deal.titulo || '').toLowerCase().includes(searchLower);
        const matchesName = deal.contato?.nome?.toLowerCase().includes(searchLower) || false;
        const matchesPhone = deal.contato?.telefone?.includes(dealsSearchTerm) || false;
        return matchesTitle || matchesName || matchesPhone;
      }),
    [deals, dealsSearchTerm]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-8 h-8 mr-2" />
        <span>{error}</span>
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
    `}</style>
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-md bg-blue-600 text-white">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
                Lista de Agendamentos
              </h2>
              <p className="text-gray-500 dark:text-neutral-400 text-sm">Visualize e gerencie todos os seus compromissos</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                fetchDeals();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:w-auto"
            >
                            <Plus className="w-5 h-5" />
              <span>Novo Agendamento</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por título ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 transition-all duration-200"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-5 h-5" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full pl-12 pr-10 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200"
            >
              <option value="all">Todas as datas</option>
              <option value="today">Hoje</option>
              <option value="tomorrow">Amanhã</option>
              <option value="week">Próximos 7 dias</option>
              <option value="month">Próximos 30 dias</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-5 h-5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm overflow-hidden">
        {paginatedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-neutral-200 mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-gray-500 dark:text-neutral-400 text-center max-w-md text-sm">
              {searchTerm || dateFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca para encontrar agendamentos.' 
                : 'Comece criando seu primeiro agendamento.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-neutral-700">
            {paginatedAppointments.map((appointment) => (
              <div
                key={appointment.Id}
                className="p-6 hover:bg-blue-50/50 dark:hover:bg-neutral-700/50 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    {/* Time Badge */}
                    <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-sm">
                      <span className="text-xs font-medium opacity-90">
                        {format(parseISO(appointment.dataInicio), 'dd/MM')}
                      </span>
                      <span className="text-lg font-bold">
                        {format(parseISO(appointment.dataInicio), 'HH:mm')}
                      </span>
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        if (appointment.id_negociacao) navigate(`/crm/${appointment.id_negociacao}`);
                      }}
                    >
                      <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-1">
                        {appointment.nome || appointment.nomeCliente}
                      </h3>
                      {appointment.descricao && (
                        <p className="text-gray-600 dark:text-neutral-400 text-sm mb-2">
                          {appointment.descricao}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700/50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Data</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                              {formatDate(appointment.dataInicio)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700/50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-green-600 text-white">
                            <Clock className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Horário</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                              {format(parseISO(appointment.dataInicio), 'HH:mm')} - {format(parseISO(appointment.dataFinal), 'HH:mm')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700/50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-600 text-white">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Cliente</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate">
                              {appointment.nomeCliente}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEditModal(appointment)}
                        className="p-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Editar agendamento"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(appointment)}
                        className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Excluir agendamento"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredAppointments.length > itemsPerPage && (
          <div className="p-6 border-t border-gray-300 dark:border-neutral-700">
            <Pagination
              totalItems={filteredAppointments.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
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
        <div className="rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <form onSubmit={handleCreateAppointment} className="space-y-6 p-6 overflow-y-auto max-h-[70vh]">
            {/* Deal Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                <Calendar className="w-4 h-4 text-blue-600" />
                Negociação
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou título..."
                    value={dealsSearchTerm}
                    onChange={(e) => setDealsSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 transition-all duration-200"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700">
                  {dealsLoading ? (
                    <div className="flex items-center justify-center h-20 text-gray-500 dark:text-neutral-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Carregando negociações...
                    </div>
                  ) : filteredDeals.length > 0 ? (
                    filteredDeals.map((deal) => (
                      <div
                        key={deal.Id}
                        onClick={() => setSelectedDealId(deal.Id)}
                        className={`p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border-b border-gray-300 dark:border-neutral-600 last:border-b-0 ${
                          selectedDealId === deal.Id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-l-blue-500'
                            : 'text-gray-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="font-medium">{deal.titulo}</div>
                        {deal.contato && (
                          <div className="text-xs mt-1 opacity-75">
                            {deal.contato.nome} • {deal.contato.telefone}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 dark:text-neutral-400 text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Nenhuma negociação encontrada
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date/Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                  <Clock className="w-4 h-4 text-green-600" />
                  Data e Hora de Início
                </label>
                <input
                  type="datetime-local"
                  value={selectedStart}
                  onChange={(e) => setSelectedStart(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                  <Clock className="w-4 h-4 text-red-600" />
                  Data e Hora de Término
                </label>
                <input
                  type="datetime-local"
                  value={selectedEnd}
                  onChange={(e) => setSelectedEnd(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200"
                  min={selectedStart}
                  max={selectedStart ? `${selectedStart.slice(0, 10)}T23:59` : undefined}
                  required
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                <User className="w-4 h-4 text-purple-600" />
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 transition-all duration-200"
                placeholder="Digite o nome do cliente"
                required
              />
            </div>

            {/* Appointment Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                <Calendar className="w-4 h-4 text-blue-600" />
                Nome do Agendamento
              </label>
              <input
                type="text"
                value={appointmentName}
                onChange={(e) => setAppointmentName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200"
              />
            </div>

            {/* Appointment Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                <Calendar className="w-4 h-4 text-blue-600" />
                Descrição
              </label>
              <textarea
                value={appointmentDesc}
                onChange={(e) => setAppointmentDesc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200"
                rows={3}
              />
            </div>


            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 font-medium text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-300/50 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating || !selectedStart || !selectedEnd || !clientName}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Criando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Criar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="Editar Agendamento"
        maxWidth="lg"
        maxHeight="90vh"
      >
        <div className="rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800">
          <form onSubmit={handleEditAppointment} className="space-y-6 p-6 overflow-y-auto max-h-[70vh]">
            {/* Deal Selection */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                <Calendar className="w-4 h-4 text-blue-600" />
                Negociação
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, telefone ou título..."
                    value={dealsSearchTerm}
                    onChange={(e) => setDealsSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 transition-all duration-200"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700">
                  {dealsLoading ? (
                    <div className="flex items-center justify-center h-20 text-gray-500 dark:text-neutral-400">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Carregando negociações...
                    </div>
                  ) : filteredDeals.length > 0 ? (
                    filteredDeals.map((deal) => (
                      <div
                        key={deal.Id}
                        onClick={() => setSelectedDealId(deal.Id)}
                        className={`p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border-b border-gray-300 dark:border-neutral-600 last:border-b-0 ${
                          selectedDealId === deal.Id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-l-blue-500'
                            : 'text-gray-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="font-medium">{deal.titulo}</div>
                        {deal.contato && (
                          <div className="text-xs mt-1 opacity-75">
                            {deal.contato.nome} • {deal.contato.telefone}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 dark:text-neutral-400 text-center">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Nenhuma negociação encontrada
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Date/Time Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                  <Clock className="w-4 h-4 text-green-600" />
                  Data e Hora de Início
                </label>
                <input
                  type="datetime-local"
                  value={selectedStart}
                  onChange={(e) => setSelectedStart(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                  <Clock className="w-4 h-4 text-red-600" />
                  Data e Hora de Término
                </label>
                <input
                  type="datetime-local"
                  value={selectedEnd}
                  onChange={(e) => setSelectedEnd(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 transition-all duration-200"
                  min={selectedStart}
                  max={selectedStart ? `${selectedStart.slice(0, 10)}T23:59` : undefined}
                  required
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-neutral-200">
                <User className="w-4 h-4 text-purple-600" />
                Nome do Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 transition-all duration-200"
                placeholder="Digite o nome do cliente"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 font-medium text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-300/50 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetForm();
                }}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editing || !selectedStart || !selectedEnd || !clientName}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {editing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-5 h-5" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedAppointment(null);
        }}
        title="Confirmar Exclusão"
      >
        <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100 mb-2">
                  Excluir Agendamento
                </h3>
                <p className="text-gray-600 dark:text-neutral-300 leading-relaxed">
                  Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-red-200/50 dark:border-red-800/50">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedAppointment(null);
                }}
                className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 rounded-xl border border-gray-300 dark:border-neutral-600 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAppointment}
                disabled={deleting}
                className="flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    <span>Excluir Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  </div>
  </>
);
}