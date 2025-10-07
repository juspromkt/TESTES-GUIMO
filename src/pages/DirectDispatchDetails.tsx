import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Loader2, 
  X, 
  Users, 
  Send, 
  Play, 
  Square, 
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  Download,
  Search,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import Papa from 'papaparse';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { hasPermission } from '../utils/permissions';
import { parseSaoPauloDate } from '../utils/timezone';

interface DirectDispatch {
  Id: number;
  nome: string;
  publico: string;
  cidade: string;
  qtdLeads: string;
  qtdDisparosRealizados: string;
  status: 'pending' | 'SUCESS' | 'ERROR';
}

interface Lead {
  Id: number;
  nome: string;
  telefone: string;
}

interface Disparo {
  nome_lead: string;
  data: string;
}

interface OrdemDisparo {
  Id: number;
  id_disparo: number;
  id_modelo: number;
  data: string;
  status: 'open' | 'close';
}

interface Modelo {
  id: number;
  nome: string;
  texto: string;
}

interface WhatsAppStatus {
  isWhatsAppAtivo: boolean;
}

type SortField = 'nome' | 'telefone';
type SortDirection = 'asc' | 'desc';

export default function DirectDispatchDetails() {
  const [hasActiveDisparos, setHasActiveDisparos] = useState<boolean>(false);
  const [success, setSuccess] = useState('');
  const [dispatch, setDispatch] = useState<DirectDispatch | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [disparos, setDisparos] = useState<Disparo[]>([]);
  const [ordemDisparo, setOrdemDisparo] = useState<OrdemDisparo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDisparo, setLoadingDisparo] = useState(false);
  const [error, setError] = useState('');
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [selectedModeloId, setSelectedModeloId] = useState<number | null>(null);
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
const canEditProspect = hasPermission('can_edit_prospect');


  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'nome',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const { id } = useParams();
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');

    try {
      const result = await new Promise<any>((resolve, reject) => {
        Papa.parse(file, {
          delimiter: ',',
          header: true,
          complete: (results) => {
            if (!results.data || !results.data.length) {
              reject(new Error('Arquivo vazio ou formato inválido'));
              return;
            }

            const headers = Object.keys(results.data[0]);
            const requiredColumns = ['nome', 'telefone'];
            
            if (!requiredColumns.every(col => headers.includes(col))) {
              reject(new Error('O arquivo deve conter as colunas: nome e telefone'));
              return;
            }

            resolve(results);
          },
          error: reject,
          skipEmptyLines: true
        });
      });

      const contacts = result.data
        .filter((row: any) => row.nome && row.telefone)
        .map((row: any) => ({
          nome: row.nome.trim(),
          telefone: row.telefone.trim()
        }));

      if (contacts.length === 0) {
        throw new Error('Nenhum contato válido encontrado no arquivo');
      }

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/dd/lead/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_disparo: parseInt(id!),
          contatos: contacts
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar leads');
      }

      await fetchData();
      setIsUploadModalOpen(false);
      setSuccess('Leads importados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setUploadError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const fetchOrdemDisparo = async () => {
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/dd/ordem/get?id=${id}`,
        { headers: { token } }
      );
      const data = await response.json();
      setOrdemDisparo(Array.isArray(data) && data.length > 0 && Object.keys(data[0]).length > 0 ? data[0] : null);
    } catch (err) {
      console.error('Erro ao carregar ordem de disparo:', err);
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/relatorio/isWhatsAppAtivo',
        { headers: { token } }
      );
      const data = await response.json();
      setWhatsAppStatus(data);
    } catch (err) {
      console.error('Erro ao verificar status do WhatsApp:', err);
      setError('Erro ao verificar status do WhatsApp');
    }
  };

  const checkActiveDisparos = async (): Promise<boolean> => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/dd/ordem/getAll',
        { headers: { token } }
      );
      
      if (!response.ok) {
        throw new Error('Erro ao verificar disparos ativos');
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        setHasActiveDisparos(false);
        return false;
      }

      const active = data.some(ordem => 
        ordem.status === 'open' && ordem.id_disparo !== Number(id)
      );
      
      setHasActiveDisparos(active);
      return active;
    } catch (err) {
      console.error('Erro ao verificar disparos ativos:', err);
      setError('Erro ao verificar disparos ativos. Tente novamente.');
      setHasActiveDisparos(true);
      return true;
    }
  };

  const fetchModelos = async () => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/modelo/get',
        { headers: { token } }
      );
      const data = await response.json();
      setModelos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const dispatchResponse = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/dd/getById?id=${id}`,
        { headers: { token } }
      );
      const dispatchData = await dispatchResponse.json();
      setDispatch(Array.isArray(dispatchData) && dispatchData.length > 0 ? dispatchData[0] : null);

      const leadsResponse = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/dd/leads/get?id=${id}`,
        { headers: { token } }
      );
      const leadsData = await leadsResponse.json();
      setLeads(Array.isArray(leadsData) ? leadsData : []);

      const disparosResponse = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/dd/disparos/get?id=${id}`,
        { headers: { token } }
      );
      const disparosData = await disparosResponse.json();
      setDisparos(Array.isArray(disparosData) ? disparosData : []);

      await Promise.all([
        fetchOrdemDisparo(),
        fetchModelos(),
        checkWhatsAppStatus(),
        checkActiveDisparos()
      ]);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar informações do disparo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, token]);

  const handleDisparo = async () => {
    if (!whatsAppStatus?.isWhatsAppAtivo) {
      setError('É necessário conectar o WhatsApp antes de iniciar os disparos');
      return;
    }

    if (hasActiveDisparos) {
      setError('Já existe um disparo em andamento. Aguarde a conclusão para iniciar um novo.');
      return;
    }

    if (!ordemDisparo && !selectedModeloId) {
      setIsModeloModalOpen(true);
      return;
    }

    setLoadingDisparo(true);
    setError('');
    
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/dd/ordem/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_disparo: Number(id),
          id_modelo: selectedModeloId
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar ordem de disparo');
      }
      
      await fetchOrdemDisparo();
      setSelectedModeloId(null);
      setIsModeloModalOpen(false);
      await checkActiveDisparos();
    } catch (err) {
      console.error('Erro ao gerenciar disparo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerenciar disparo');
    } finally {
      setLoadingDisparo(false);
    }
  };

  const handleModeloSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModeloId) return;

    const hasActiveDisparos = await checkActiveDisparos();
    if (hasActiveDisparos) {
      setError('Já existe um disparo em andamento. Aguarde a conclusão para iniciar um novo.');
      return;
    }

    await handleDisparo();
  };

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUpDown className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowUpDown className="w-4 h-4 text-blue-600 transform rotate-180" />
    );
  };

const filteredAndSortedLeads = [...leads]
  .filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const nome = lead.nome?.toLowerCase?.() || '';
    const telefone = lead.telefone?.toLowerCase?.() || '';
    return nome.includes(searchLower) || telefone.includes(searchLower);
  })
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      const field = sortConfig.field;
      return a[field].localeCompare(b[field]) * direction;
    });

  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
  const paginatedLeads = filteredAndSortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getDisparoButton = () => {
    if (hasActiveDisparos) {
      return {
        text: 'Já existe um disparo em andamento no sistema',
        color: 'bg-gray-400 cursor-not-allowed',
        icon: <AlertCircle className="w-5 h-5" />,
        disabled: true
      };
    }

    if (!whatsAppStatus?.isWhatsAppAtivo) {
      return {
        text: 'Conecte o WhatsApp para iniciar os disparos',
        color: 'bg-gray-400 cursor-not-allowed',
        icon: null,
        disabled: true
      };
    }

    if (dispatch && parseInt(dispatch.qtdLeads) <= 1) {
      return {
        text: `Adicione mais leads. Quantidade atual: ${dispatch.qtdLeads}`,
        color: 'bg-gray-400 cursor-not-allowed',
        icon: null,
        disabled: true
      };
    }

    if (loadingDisparo) {
      return {
        text: 'Processando...',
        color: 'bg-gray-500',
        icon: null,
        disabled: true
      };
    }

    if (!ordemDisparo) {
      return {
        text: 'Iniciar disparo',
        color: 'bg-green-600 hover:bg-green-700',
        icon: <Play className="w-5 h-5" />,
        disabled: false
      };
    }

    if (ordemDisparo.status === 'open') {
      return {
        text: 'Parar disparo',
        color: 'bg-red-600 hover:bg-red-700',
        icon: <Square className="w-5 h-5" />,
        disabled: false
      };
    }

    return {
      text: 'Reiniciar disparo',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: <Play className="w-5 h-5" />,
      disabled: false
    };
  };

  const formatDate = (dateString: string) => {
    const date = parseSaoPauloDate(dateString);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (error || !dispatch) {
    return <div className="text-center text-red-600 p-4">
      <p>{error || 'Disparo não encontrado'}</p>
    </div>;
  }

  const disparoButton = getDisparoButton();
  const remainingDispatches = parseInt(dispatch.qtdLeads) - parseInt(dispatch.qtdDisparosRealizados);
  const allDispatchesCompleted = 
    parseInt(dispatch.qtdLeads) > 1 && 
    parseInt(dispatch.qtdLeads) === parseInt(dispatch.qtdDisparosRealizados);

  return (
    <div className="space-y-8">
      {allDispatchesCompleted && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <p className="text-green-700 font-medium">
            TODOS OS DISPAROS FORAM EXECUTADOS COM SUCESSO
          </p>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/prospectar')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dispatch.nome}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {dispatch.publico} • {dispatch.cidade}
            </p>
          </div>
        </div>

        {success && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div className="px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Leads</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{dispatch.qtdLeads}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Disparos Realizados</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{dispatch.qtdDisparosRealizados}</p>
              </div>
              <Send className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-8">
        {leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum lead importado
            </h2>
            <p className="text-gray-500 mb-6">
              Importe seus leads através de um arquivo CSV com as colunas: nome e telefone
            </p>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Importar Leads
              </button>
              <a
                href="https://drive.google.com/uc?export=download&id=1yeH1QitK8laPUoNgjh2Y6tPQnAveM7qg"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Baixar planilha modelo
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Leads Importados</h2>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Importar Mais Leads
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Itens por página:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={999}>Todos</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left cursor-pointer group"
                      onClick={() => handleSort('nome')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </span>
                        <SortIcon field="nome" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left cursor-pointer group"
                      onClick={() => handleSort('telefone')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Telefone
                        </span>
                        <SortIcon field="telefone" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.Id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.telefone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              totalItems={filteredAndSortedLeads.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />

{canEditProspect && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Controle de Disparo</h2>
                  {ordemDisparo && (
                    <p className="text-sm text-gray-500 mt-1">
                      Último disparo: {formatDate(ordemDisparo.data)}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisparo}
                  disabled={disparoButton.disabled}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${disparoButton.color}`}
                >
                  {disparoButton.text}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Importar Leads"
      >
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Instruções:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>O arquivo deve estar no formato CSV separado por vírgula</li>
              <li>As colunas necessárias são: nome e telefone</li>
              <li>Certifique-se que os números de telefone estão no formato correto</li>
            </ul>
            <div className="mt-4">
              <a
                href="https://drive.google.com/uc?export=download&id=1yeH1QitK8laPUoNgjh2Y6tPQnAveM7qg"
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Baixar planilha modelo
              </a>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <span className="text-sm text-gray-500">
                Clique para selecionar ou arraste um arquivo CSV
              </span>
            </label>
          </div>

          {uploadError && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {uploadError}
            </div>
          )}

          {uploading && (
            <div className="mt-4 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Processando arquivo...</span>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isModeloModalOpen}
        onClose={() => {
          setIsModeloModalOpen(false);
          setSelectedModeloId(null);
          setError('');
        }}
        title="Selecionar Modelo de Mensagem"
      >
        <form onSubmit={handleModeloSubmit} className="space-y-4">
          <div>
            <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
              Escolha um modelo de mensagem
            </label>
            <select
              id="modelo"
              value={selectedModeloId || ''}
              onChange={(e) => setSelectedModeloId(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              required
            >
              <option value="">Selecione um modelo...</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.nome}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModeloModalOpen(false);
                setSelectedModeloId(null);
                setError('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedModeloId}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
            >
              Iniciar Disparo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}