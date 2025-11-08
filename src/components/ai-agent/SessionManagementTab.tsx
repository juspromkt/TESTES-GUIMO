import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Loader2, Trash2, RefreshCw, AlertCircle, Search, Check, Upload } from 'lucide-react';
import Pagination from '../Pagination';
import Modal from '../Modal';
import { parseSaoPauloDate } from '../../utils/timezone';

interface Session {
  Id: number;
  criacao: string;
  ultima_interacao: string | null;
  telefone: string;
}

type TabType = 'sessions' | 'interventions' | 'permanent';

interface TabMetadata {
  label: string;
  singular: string;
  singularLower: string;
  description: string;
}

const TAB_METADATA: Record<TabType, TabMetadata> = {
  sessions: {
    label: 'Sessões',
    singular: 'Sessão',
    singularLower: 'sessão',
    description:
      'Sessões se referem às conversas ativas entre usuários e o Agente de IA. Cada sessão representa uma conversa em andamento com um número de telefone específico. Você pode gerenciar essas sessões, visualizando detalhes ou removendo-as quando necessário.'
  },
  interventions: {
    label: 'Intervenções',
    singular: 'Intervenção',
    singularLower: 'intervenção',
    description:
      'Intervenções ocorrem quando um atendente humano envia uma mensagem pelo mesmo número que o Agente de IA está utilizando. Quando isso acontece, a sessão do Agente é automaticamente pausada e registrada como uma intervenção.'
  },
  permanent: {
    label: 'Exclusões Permanentes',
    singular: 'Registro de exclusão permanente',
    singularLower: 'registro de exclusão permanente',
    description:
      'A lista de exclusões permanentes impede que determinados números recebam atendimento do Agente de IA. Utilize esta aba para consultar, remover ou cadastrar números que devem permanecer bloqueados.'
  }
};

interface SessionManagementTabProps {
  token: string;
  canDelete: boolean;
}

export default function SessionManagementTab({ token, canDelete }: SessionManagementTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interventions, setInterventions] = useState<Session[]>([]);
  const [permanentExclusions, setPermanentExclusions] = useState<Session[]>([]);
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingNumbers, setUploadingNumbers] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSummary, setUploadSummary] = useState<{ processed: number; success: number; failed: number } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'sessions', label: TAB_METADATA.sessions.label },
    { id: 'interventions', label: TAB_METADATA.interventions.label },
    { id: 'permanent', label: TAB_METADATA.permanent.label }
  ];

  const fetchedRef = React.useRef(false);
  const lastActiveTabRef = React.useRef(activeTab);

  useEffect(() => {
    // Evita duplicação no mount inicial (React Strict Mode)
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchData();
      lastActiveTabRef.current = activeTab;
      return;
    }

    // Permite fetch quando a tab muda
    if (activeTab !== lastActiveTabRef.current) {
      fetchData();
      lastActiveTabRef.current = activeTab;
    }
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
        : activeTab === 'interventions'
          ? 'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/get'
          : 'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/get';

      const response = await fetch(endpoint, {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar ${TAB_METADATA[activeTab].label.toLowerCase()}`);
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
      } else if (activeTab === 'interventions') {
        setInterventions(validData);
      } else {
        setPermanentExclusions(validData);
      }

      // Clear selection when refreshing data
      setSelectedItems([]);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(`Erro ao carregar ${TAB_METADATA[activeTab].label.toLowerCase()}`);
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
        : activeTab === 'interventions'
          ? `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/delete?id=${selectedSession.Id}`
          : `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/delete?id=${selectedSession.Id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error(`Erro ao remover ${TAB_METADATA[activeTab].singularLower}`);
      }

      await fetchData();
      setIsDeleteModalOpen(false);
      setSelectedSession(null);
      setSuccess('Registro removido com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setError(`Erro ao remover ${TAB_METADATA[activeTab].singularLower}`);
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
          : activeTab === 'interventions'
            ? `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/delete?id=${id}`
            : `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/delete?id=${id}`;

        return fetch(endpoint, {
          method: 'DELETE',
          headers: { token }
        });
      });

      await Promise.all(deletePromises);
      await fetchData();
      setIsBulkDeleteModalOpen(false);
      setSelectedItems([]);
      setSuccess(`${selectedItems.length} registros removidos com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir em massa:', err);
      setError('Erro ao remover registros selecionados');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setError('');
    
    try {
      const items = activeTab === 'sessions'
        ? sessions
        : activeTab === 'interventions'
          ? interventions
          : permanentExclusions;
      const deletePromises = items.map(item => {
        const endpoint = activeTab === 'sessions'
          ? `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/sesssoes/delete?id=${item.Id}`
          : activeTab === 'interventions'
            ? `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/delete?id=${item.Id}`
            : `https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/delete?id=${item.Id}`;

        return fetch(endpoint, {
          method: 'DELETE',
          headers: { token }
        });
      });

      await Promise.all(deletePromises);
      await fetchData();
      setIsDeleteAllModalOpen(false);
      setSuccess('Todos os registros foram removidos com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir todos os itens:', err);
      setError('Erro ao remover todos os registros');
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
      const currentItems = activeTab === 'sessions'
        ? sessions
        : activeTab === 'interventions'
          ? interventions
          : permanentExclusions;
      const filteredItems = currentItems.filter(item =>
        item.telefone.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectedItems(filteredItems.map(item => item.Id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleCsvUpload = (file: File) => {
    setUploadError('');
    setUploadSummary(null);
    setUploadingNumbers(true);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      transformHeader: header => header.trim(),
      complete: (results) => {
        (async () => {
          const fatalErrors = results.errors.filter(error => error.fatal);

          if (fatalErrors.length) {
            console.error('Erros ao processar CSV:', fatalErrors);
            const attempted = Array.isArray(results.data) ? results.data.length : 0;
            setUploadError('Não foi possível processar o arquivo CSV. Verifique o formato e tente novamente.');
            setUploadSummary({ processed: attempted, success: 0, failed: attempted });
            setUploadingNumbers(false);
            return;
          }

          if (results.errors.length) {
            console.warn('Avisos ao processar CSV:', results.errors);
          }

          const rows = (results.data ?? []).filter(Boolean) as CsvRow[];
          const extractedNumbers = rows.map(row => getNumeroFromRow(row));
          const totalEntries = extractedNumbers.length;
          const validNumbers = extractedNumbers
            .map(value => sanitizePhoneNumber(value))
            .filter(value => value.length > 0);
          const invalidCount = totalEntries - validNumbers.length;

          if (validNumbers.length === 0) {
            setUploadError('Nenhum número válido foi encontrado. Certifique-se de que a coluna "numero" está presente e preenchida.');
            setUploadSummary({ processed: totalEntries, success: 0, failed: totalEntries });
            setUploadingNumbers(false);
            return;
          }

          try {
            const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/exclusao/permanente/create/planilha', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                token
              },
              body: JSON.stringify({ numeros: validNumbers })
            });

            const responseText = await response.text();
            let responseData: unknown = null;
            if (responseText) {
              try {
                responseData = JSON.parse(responseText);
              } catch (parseError) {
                console.warn('Resposta inesperada ao importar planilha de exclusões permanentes:', parseError);
              }
            }

            if (!response.ok) {
              const errorMessage =
                (responseData && typeof responseData === 'object' && 'message' in responseData && typeof responseData.message === 'string')
                  ? responseData.message
                  : 'Erro na solicitação de importação.';
              throw new Error(errorMessage);
            }

            const successCount = validNumbers.length;
            const failedTotal = invalidCount;
            setUploadSummary({ processed: totalEntries, success: successCount, failed: failedTotal });

            if (successCount > 0) {
              setSuccess(`${successCount} números processados para exclusão permanente com sucesso!`);
              setTimeout(() => setSuccess(''), 3000);
              if (activeTab === 'permanent') {
                try {
                  await fetchData();
                } catch (fetchError) {
                  console.error('Erro ao atualizar a lista de exclusões permanentes:', fetchError);
                }
              }
            }

            if (failedTotal > 0) {
              setUploadError(`${failedTotal} registros foram ignorados por estarem inválidos. Verifique os dados e tente novamente.`);
            } else {
              setUploadError('');
            }
          } catch (error) {
            console.error('Erro ao processar importação em massa:', error);
            setUploadSummary({ processed: totalEntries, success: 0, failed: totalEntries });
            setUploadError(error instanceof Error ? error.message : 'Erro desconhecido ao importar números.');
          } finally {
            setUploadingNumbers(false);
          }
        })();
      },
      error: (err) => {
        console.error('Erro ao ler arquivo CSV:', err);
        setUploadError('Não foi possível ler o arquivo CSV. Tente novamente.');
        setUploadingNumbers(false);
      }
    });
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
  const dataMap: Record<TabType, Session[]> = {
    sessions,
    interventions,
    permanent: permanentExclusions
  };

  const filteredData = dataMap[activeTab].filter(item =>
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
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900 mb-0.5">Gerenciar Sessões</h2>
        <p className="text-xs text-neutral-500">Configuração global - funciona para todos os agentes</p>
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Box */}
      <div className="bg-neutral-50 border-l-2 border-neutral-400 p-3 rounded-r">
        <h3 className="text-xs font-medium text-neutral-900 mb-1">
          Sobre {TAB_METADATA[activeTab].label}
        </h3>
        <p className="text-neutral-600 text-xs">
          {TAB_METADATA[activeTab].description}
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-neutral-900">
              {TAB_METADATA[activeTab].label}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded transition-colors disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-neutral-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Buscar por telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeTab === 'permanent' && (
                <button
                  onClick={() => {
                    setIsUploadModalOpen(true);
                    setUploadError('');
                    setUploadSummary(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-xs font-medium"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importar
                </button>
              )}
              {selectedItems.length > 0 && canDelete && (
                <button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir ({selectedItems.length})
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors text-xs font-medium"
                  disabled={filteredData.length === 0}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Todos
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2.5 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-4 mt-3 p-2.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-6 text-center text-neutral-500 text-xs">
            <p>Nenhum registro encontrado.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="w-[35px] px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={areAllSelected}
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500"
                      />
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-600 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-600 uppercase">
                      Telefone
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-600 uppercase">
                      Criação
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-neutral-600 uppercase">
                      Última Interação
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-neutral-600 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {paginatedData.map((item) => (
                    <tr key={item.Id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.Id)}
                          onChange={() => handleSelectItem(item.Id)}
                          className="w-3.5 h-3.5 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500">
                        #{item.Id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-900">
                        {formatPhoneNumber(item.telefone)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500">
                        {formatDateTime(item.criacao)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500">
                        {formatDateTime(item.ultima_interacao)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                      {canDelete && (
                        <button
                          onClick={() => {
                            setSelectedSession(item);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
                Tem certeza que deseja remover este {TAB_METADATA[activeTab].singularLower} do telefone {selectedSession ? formatPhoneNumber(selectedSession.telefone) : ''}?
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
                Tem certeza que deseja remover {selectedItems.length} registros selecionados?
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
                Tem certeza que deseja remover TODOS os registros? Esta ação não pode ser desfeita.
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
      {/* Upload CSV Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          if (!uploadingNumbers) {
            setIsUploadModalOpen(false);
            setUploadError('');
            setUploadSummary(null);
          }
        }}
        title="Importar números para exclusão permanente"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Envie um arquivo CSV contendo uma coluna chamada <strong>numero</strong> com os números que devem ser bloqueados definitivamente. Apenas dígitos serão considerados durante o processamento.
          </p>

          {uploadError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSummary && (
            <div className="p-4 rounded-lg bg-green-50 text-green-700 text-sm space-y-1">
              <p><strong>Total processado:</strong> {uploadSummary.processed}</p>
              <p><strong>Sucesso:</strong> {uploadSummary.success}</p>
              <p><strong>Falhas:</strong> {uploadSummary.failed}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="csv-upload-input">
              Arquivo CSV
            </label>
            <input
              id="csv-upload-input"
              type="file"
              accept=".csv"
              disabled={uploadingNumbers}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file) {
                  handleCsvUpload(file);
                }
                event.target.value = '';
              }}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {uploadingNumbers && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando arquivo...
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                if (!uploadingNumbers) {
                  setIsUploadModalOpen(false);
                  setUploadError('');
                  setUploadSummary(null);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
              disabled={uploadingNumbers}
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

type CsvRow = Record<string, unknown>;

function getNumeroFromRow(row: CsvRow): string {
  const numeroKey = Object.keys(row).find(key => key.toLowerCase().trim() === 'numero');
  if (!numeroKey) return '';
  const value = row[numeroKey];
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function sanitizePhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}