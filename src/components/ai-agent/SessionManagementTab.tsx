import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, RefreshCw, AlertCircle, Search, Check } from 'lucide-react';
import Pagination from '../Pagination';
import Modal from '../Modal';
import { parseSaoPauloDate } from '../../utils/timezone';

interface Session {
  Id: number;
  criacao: string;
  ultima_interacao: string | null;
  telefone: string;
}

type TabType = 'sessions' | 'interventions';

interface SessionManagementTabProps {
  token: string;
  canDelete: boolean;
}

export default function SessionManagementTab({ token, canDelete }: SessionManagementTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interventions, setInterventions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'sessions', label: 'Sessões' },
    { id: 'interventions', label: 'Intervenções' }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    // Reset pagination when changing tabs or search term
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sessions_updated') {
        fetchData();
      }
    };
    const customHandler = () => {
      fetchData();
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('sessions_updated', customHandler as EventListener);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('sessions_updated', customHandler as EventListener);
    };
  });

  const fetchData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const endpoint = activeTab === 'sessions'
        ? 'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sesssoes/get'
        : 'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/get';

      const response = await fetch(endpoint, {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar ${activeTab === 'sessions' ? 'sessões' : 'intervenções'}`);
      }

      // Handle empty response or no data
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : [];
      } catch (e) {
        console.warn('Erro ao processar resposta:', e);
        data = [];
      }
      
      // Ensure data is an array and filter out empty objects
      const validData = Array.isArray(data) 
        ? data.filter(item => item && typeof item === 'object' && Object.keys(item).length > 0)
        : [];
      
      if (activeTab === 'sessions') {
        setSessions(validData);
      } else {
        setInterventions(validData);
      }

      // Clear selection when refreshing data
      setSelectedItems([]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(`Erro ao carregar ${activeTab === 'sessions' ? 'sessões' : 'intervenções'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSession) return;
    
    setDeleting(true);
    setError('');
    
    try {
      const endpoint = activeTab === 'sessions'
        ? `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sesssoes/delete?id=${selectedSession.Id}`
        : `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/delete?id=${selectedSession.Id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir ${activeTab === 'sessions' ? 'sessão' : 'intervenção'}`);
      }

      await fetchData();
      setIsDeleteModalOpen(false);
      setSelectedSession(null);
      setSuccess(`${activeTab === 'sessions' ? 'Sessão' : 'Intervenção'} excluída com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError(`Erro ao excluir ${activeTab === 'sessions' ? 'sessão' : 'intervenção'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    setDeleting(true);
    setError('');
    
    try {
      const deletePromises = selectedItems.map(id => {
        const endpoint = activeTab === 'sessions'
          ? `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sesssoes/delete?id=${id}`
          : `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/delete?id=${id}`;

        return fetch(endpoint, {
          method: 'DELETE',
          headers: { token }
        });
      });

      await Promise.all(deletePromises);
      await fetchData();
      setIsBulkDeleteModalOpen(false);
      setSelectedItems([]);
      setSuccess(`${selectedItems.length} ${activeTab === 'sessions' ? 'sessões' : 'intervenções'} excluídas com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir em massa:', err);
      setError(`Erro ao excluir ${activeTab === 'sessions' ? 'sessões' : 'intervenções'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setError('');
    
    try {
      const items = activeTab === 'sessions' ? sessions : interventions;
      const deletePromises = items.map(item => {
        const endpoint = activeTab === 'sessions'
          ? `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sesssoes/delete?id=${item.Id}`
          : `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/delete?id=${item.Id}`;

        return fetch(endpoint, {
          method: 'DELETE',
          headers: { token }
        });
      });

      await Promise.all(deletePromises);
      await fetchData();
      setIsDeleteAllModalOpen(false);
      setSuccess(`Todas as ${activeTab === 'sessions' ? 'sessões' : 'intervenções'} foram excluídas com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir todos os itens:', err);
      setError(`Erro ao excluir todas as ${activeTab === 'sessions' ? 'sessões' : 'intervenções'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentItems = activeTab === 'sessions' ? sessions : interventions;
      const filteredItems = currentItems.filter(item => 
        item.telefone.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectedItems(filteredItems.map(item => item.Id));
    } else {
      setSelectedItems([]);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    
    try {
      const cleaned = phone.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
      if (match) {
        return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
      }
      return phone;
    } catch (error) {
      console.warn('Erro ao formatar número de telefone:', phone);
      return phone || 'N/A';
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '';

    try {
      const date = parseSaoPauloDate(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return '';

      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (error) {
      console.warn('Erro ao formatar data:', dateString);
      return '';
    }
  };

  // Filter data based on search term
  const filteredData = (activeTab === 'sessions' ? sessions : interventions).filter(item => 
    item.telefone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Check if all visible items are selected
  const areAllSelected = paginatedData.length > 0 && 
    paginatedData.every(item => selectedItems.includes(item.Id));

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-300">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
        <h3 className="font-medium text-blue-800 mb-2">
          {activeTab === 'sessions' ? 'Sobre Sessões' : 'Sobre Intervenções'}
        </h3>
        {activeTab === 'sessions' ? (
          <p className="text-blue-700 text-sm">
            Sessões se referem às conversas ativas entre usuários e o Agente de IA. Cada sessão representa uma conversa em andamento com um número de telefone específico. Você pode gerenciar essas sessões, visualizando detalhes ou excluindo-as quando necessário.
          </p>
        ) : (
          <p className="text-blue-700 text-sm">
            Intervenções ocorrem quando um atendente humano envia uma mensagem pelo mesmo número que o Agente de IA está utilizando. Quando isso acontece, a sessão do Agente é automaticamente pausada e registrada como uma intervenção. Isso permite que humanos assumam conversas quando necessário sem conflito com o Agente.
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {activeTab === 'sessions' ? 'Sessões' : 'Intervenções'}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
{selectedItems.length > 0 && canDelete && (
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Excluir Selecionados ({selectedItems.length})
                </button>
              )}
            {canDelete && (

              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                disabled={filteredData.length === 0}
              >
                <Trash2 className="w-5 h-5" />
                Excluir Todos
              </button>
                )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nenhum registro encontrado.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-[40px] px-6 py-3">
                      <input
                        type="checkbox"
                        checked={areAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Interação
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((item) => (
                    <tr key={item.Id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.Id)}
                          onChange={() => handleSelectItem(item.Id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        #{item.Id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPhoneNumber(item.telefone)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.criacao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(item.ultima_interacao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canDelete && (

                        <button
                          onClick={() => {
                            setSelectedSession(item);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={filteredData.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSession(null);
        }}
        title="Confirmar Exclusão"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Exclusão
              </h3>
              <p className="text-gray-500 mt-1">
                Tem certeza que deseja excluir esta {activeTab === 'sessions' ? 'sessão' : 'intervenção'} do telefone {selectedSession ? formatPhoneNumber(selectedSession.telefone) : ''}?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedSession(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Confirmar Exclusão em Massa"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Exclusão em Massa
              </h3>
              <p className="text-gray-500 mt-1">
                Tem certeza que deseja excluir {selectedItems.length} {activeTab === 'sessions' ? 'sessões' : 'intervenções'} selecionadas?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Selecionados</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete All Confirmation Modal */}
      <Modal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        title="Confirmar Exclusão de Todos os Itens"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Atenção! Esta é uma ação destrutiva
              </h3>
              <p className="text-gray-500 mt-1">
                Tem certeza que deseja excluir TODAS as {activeTab === 'sessions' ? 'sessões' : 'intervenções'}? Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsDeleteAllModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Todos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}