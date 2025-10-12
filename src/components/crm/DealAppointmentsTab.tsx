import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Loader2, AlertCircle, Search, ChevronDown, Pencil, Trash2, Plus } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Pagination from '../Pagination';
import Modal from '../Modal';

interface Appointment {
  Id: number;
  id_negociacao: number;
  dataInicio: string;
  dataFinal: string;
  nomeCliente: string;
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'month';

interface DealAppointmentsTabProps {
  dealId: number;
}

export default function DealAppointmentsTab({ dealId }: DealAppointmentsTabProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Edit appointment states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [clientName, setClientName] = useState('');
  const [editing, setEditing] = useState(false);

  // Create appointment states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Delete appointment states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchAppointments();
  }, [dealId]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/historico/get/lead?id_negociacao=${dealId}`,
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar agendamentos');
      }

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err);
      setError('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
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
            id_negociacao: dealId,
            dataInicio: formatDateTimeWithTZ(selectedStart),
            dataFinal: formatDateTimeWithTZ(selectedEnd),
            nomeCliente: clientName
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
            id_negociacao: dealId,
            dataInicio: formatDateTimeWithTZ(selectedStart),
            dataFinal: formatDateTimeWithTZ(selectedEnd),
            nomeCliente: clientName
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
    setSelectedStart('');
    setSelectedEnd('');
    setClientName('');
    setSelectedAppointment(null);
  };

  const openEditModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedStart(formatDateTimeForInput(appointment.dataInicio));
    setSelectedEnd(formatDateTimeForInput(appointment.dataFinal));
    setClientName(appointment.nomeCliente);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (err) {
      return dateStr;
    }
  };

  const filterAppointments = (appointments: Appointment[]) => {
    return appointments.filter(appointment => {
      const matchesSearch = 
        searchTerm === '' ||
        appointment.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase());

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
        case 'tomorrow':
          const tomorrow = startOfDay(new Date());
          tomorrow.setDate(tomorrow.getDate() + 1);
          matchesDate = isWithinInterval(appointmentDate, {
            start: startOfDay(tomorrow),
            end: endOfDay(tomorrow)
          });
          break;
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

  const filteredAppointments = filterAppointments(appointments);
  
  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Agendamentos</h2>
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
            }}
            className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <Plus className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Novo Agendamento</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">Todas as datas</option>
              <option value="today">Hoje</option>
              <option value="tomorrow">Amanhã</option>
              <option value="week">Próximos 7 dias</option>
              <option value="month">Próximos 30 dias</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>
      </div>

      {success && (
        <div className="mx-6 mt-4 p-4 bg-green-50 text-green-600 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {paginatedAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum agendamento encontrado
            </h2>
            <p className="text-gray-500">
              {searchTerm || dateFilter !== 'all'
                ? 'Tente ajustar os filtros de busca para encontrar agendamentos.'
                : 'Os agendamentos aparecerão aqui quando forem marcados através do agente.'}
            </p>
          </div>
        ) : (
          paginatedAppointments.map((appointment) => (
            <div
              key={appointment.Id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {format(parseISO(appointment.dataInicio), 'HH:mm')}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(appointment.dataInicio)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(parseISO(appointment.dataInicio), 'HH:mm')} -
                          {format(parseISO(appointment.dataFinal), 'HH:mm')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{appointment.nomeCliente}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(appointment)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Editar agendamento"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(appointment)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Excluir agendamento"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredAppointments.length > itemsPerPage && (
        <Pagination
          totalItems={filteredAppointments.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

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
        <form onSubmit={handleCreateAppointment} className="space-y-6 p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Início</label>
              <input
                type="datetime-local"
                value={selectedStart}
                onChange={(e) => setSelectedStart(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fim</label>
              <input
                type="datetime-local"
                value={selectedEnd}
                onChange={(e) => setSelectedEnd(e.target.value)}
                min={selectedStart}
                max={selectedStart ? `${selectedStart.slice(0, 10)}T23:59` : undefined}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !selectedStart || !selectedEnd || !clientName}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
        <form onSubmit={handleEditAppointment} className="space-y-6 p-6 overflow-y-auto max-h-[70vh]">
          {/* Start DateTime */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Início
            </label>
            <input
              type="datetime-local"
              value={selectedStart}
              onChange={(e) => setSelectedStart(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* End DateTime */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fim
            </label>
            <input
              type="datetime-local"
              value={selectedEnd}
              onChange={(e) => setSelectedEnd(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Cliente
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={editing || !selectedStart || !selectedEnd || !clientName}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Agendamento</h3>
              <p className="text-gray-600 leading-relaxed">
                Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-red-200/50">
            <button
              type="button"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedAppointment(null);
              }}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-300 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteAppointment}
              disabled={deleting}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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
      </Modal>
    </div>
  );
}