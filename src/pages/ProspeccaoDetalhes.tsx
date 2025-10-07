import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { Play, Square, CheckCircle, Download } from 'lucide-react';
import Modal from '../components/Modal';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { hasPermission } from '../utils/permissions';
import { parseSaoPauloDate } from '../utils/timezone';

interface Prospeccao {
  Id: number;
  segmento: string;
  cidade: string;
  filtros: string;
  data: string;
  leads_encontrados: string;
  qtdDisparos: string;
  status: 'pending' | 'SUCESS' | 'ERROR';
}

interface Lead {
  nome: string;
  telefone: string;
  email: string | null;
  endereco: string;
  tipo: string;
  Id?: number;
  id_cliente?: number;
  id_prospeccao?: number;
}

interface Disparo {
  nome_lead: string;
  data: string;
  status: boolean;
}

interface OrdemDisparo {
  Id: number;
  id_prospeccao: number;
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

const ProspeccaoDetalhes = () => {
  const [prospeccao, setProspeccao] = useState<Prospeccao | null>(null);
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
  const navigate = useNavigate();
const canEditProspect = hasPermission('can_edit_prospect');

  // Pagination state for leads
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(10);
  
  // Pagination state for disparos
  const [disparosPage, setDisparosPage] = useState(1);
  const [disparosPerPage, setDisparosPerPage] = useState(10);

  const { id } = useParams();
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  const handleExportContacts = () => {
    // Filter out internal columns and prepare data for export
    const exportData = leads.map(lead => {
      const { Id, id_cliente, id_prospeccao, ...exportLead } = lead;
      return exportLead;
    });

    // Convert to CSV
    const csv = Papa.unparse(exportData);
    
    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos-prospeccao-${id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchOrdemDisparo = async () => {
    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/ordem/get?id=${id}`,
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
        'https://n8n.lumendigital.com.br/webhook/prospecta/ordem/getAll',
        { headers: { token } }
      );
      const data = await response.json();
      return Array.isArray(data) && data.some(ordem => ordem.status === 'open');
    } catch (err) {
      console.error('Erro ao verificar disparos ativos:', err);
      return false;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch prospection details
        const prospeccaoResponse = await fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/prospeccao/get/id?id=${id}`,
          { headers: { token } }
        );
        const prospeccaoData = await prospeccaoResponse.json();
        setProspeccao(prospeccaoData[0]);

        // Fetch leads with prospection ID
        const leadsResponse = await fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/historico/get?id=${id}`,
          { headers: { token } }
        );
        const leadsData = await leadsResponse.json();
        setLeads(leadsData);

        // Fetch disparos
        const disparosResponse = await fetch(
          `https://n8n.lumendigital.com.br/webhook/prospecta/disparos/get?id=${id}`,
          { headers: { token } }
        );
        const disparosData = await disparosResponse.json();
        setDisparos(Array.isArray(disparosData) ? disparosData : []);

        // Fetch ordem de disparo
        await fetchOrdemDisparo();
        
        // Fetch modelos
        await fetchModelos();

        // Check WhatsApp status
        await checkWhatsAppStatus();
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar informações da prospecção');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  const handleDisparo = async () => {
    // Check WhatsApp status first
    if (!whatsAppStatus?.isWhatsAppAtivo) {
      setError('É necessário conectar o WhatsApp antes de iniciar os disparos');
      return;
    }

    if (!ordemDisparo && !selectedModeloId) {
      setIsModeloModalOpen(true);
      return;
    }

    // If trying to start/restart a dispatch, check for active dispatches
    if (!ordemDisparo || (ordemDisparo && ordemDisparo.status === 'close')) {
      const hasActiveDisparos = await checkActiveDisparos();
      if (hasActiveDisparos) {
        setError('Já existe um disparo em andamento. Aguarde a conclusão para iniciar um novo.');
        return;
      }
    }

    setLoadingDisparo(true);
    setError('');
    
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/ordem/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          id_prospeccao: Number(id),
          id_modelo: selectedModeloId
        })
      });
      
      await fetchOrdemDisparo();
      setSelectedModeloId(null);
      setIsModeloModalOpen(false);
    } catch (err) {
      console.error('Erro ao gerenciar disparo:', err);
      setError('Erro ao gerenciar disparo');
    } finally {
      setLoadingDisparo(false);
    }
  };

const handleModeloSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Fechar imediatamente o modal e resetar estados visuais
  setIsModeloModalOpen(false);
  setError('');

  if (selectedModeloId) {
    const hasActiveDisparos = await checkActiveDisparos();
    if (hasActiveDisparos) {
      setError('Já existe um disparo em andamento. Aguarde a conclusão para iniciar um novo.');
      return;
    }
    handleDisparo();
  }
};


  const getDisparoButton = () => {
    // Check if WhatsApp is not connected
    if (!whatsAppStatus?.isWhatsAppAtivo) {
      return {
        text: 'Conecte o WhatsApp para iniciar os disparos',
        color: 'bg-gray-400 cursor-not-allowed',
        icon: null,
        disabled: true
      };
    }

    // Check if prospection is not successful
    if (prospeccao && prospeccao.status !== 'SUCESS') {
      return {
        text: 'Aguarde a finalização da prospecção para iniciar os disparos',
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
        color: 'bg-gray-600 hover:bg-gray-700',
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUCESS':
        return 'bg-gray-100 text-gray-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination calculations for leads
  const leadsStartIndex = (leadsPage - 1) * leadsPerPage;
  const leadsEndIndex = leadsStartIndex + leadsPerPage;
  const paginatedLeads = leads.slice(leadsStartIndex, leadsEndIndex);

  // Pagination calculations for disparos
  const disparosStartIndex = (disparosPage - 1) * disparosPerPage;
  const disparosEndIndex = disparosStartIndex + disparosPerPage;
  const paginatedDisparos = disparos.slice(disparosStartIndex, disparosEndIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !prospeccao) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error || 'Prospecção não encontrada'}</p>
      </div>
    );
  }

  const disparoButton = getDisparoButton();
  const remainingDispatches = parseInt(prospeccao.leads_encontrados) - parseInt(prospeccao.qtdDisparos);
  const allDispatchesCompleted = 
    parseInt(prospeccao.leads_encontrados) > 1 && 
    parseInt(prospeccao.leads_encontrados) === parseInt(prospeccao.qtdDisparos);

  return (
    <div className="space-y-8">
      {/* Success Banner */}
      {allDispatchesCompleted && (
        <div className="bg-gray-50 border-l-4 border-gray-500 p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-gray-500" />
          <p className="text-gray-700 font-medium">
            TODOS OS DISPAROS FORAM EXECUTADOS COM SUCESSO
          </p>
        </div>
      )}

<div className="bg-white border-b border-gray-200 px-6 py-4">
  <button
    onClick={() => navigate('/prospectar')}
    className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
  >
    <ArrowLeft className="w-5 h-5" />
    <span className="text-sm font-medium">Voltar</span>
  </button>
</div>

      {/* Detalhes da Prospecção */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-6">Detalhes da Prospecção</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Segmento</p>
            <p className="font-medium">{prospeccao.segmento}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cidade</p>
            <p className="font-medium">{prospeccao.cidade}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Filtros</p>
            <p className="font-medium">{prospeccao.filtros || 'Nenhum'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data</p>
            <p className="font-medium">{formatDate(prospeccao.data)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Leads Encontrados</p>
            <p className="font-medium">{prospeccao.leads_encontrados}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Disparos Realizados</p>
            <p className="font-medium">{prospeccao.qtdDisparos}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Disparos Restantes</p>
            <p className="font-medium">{remainingDispatches}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(prospeccao.status)}`}>
              {prospeccao.status === 'pending' ? 'Pendente' :
               prospeccao.status === 'SUCESS' ? 'Concluído' :
               prospeccao.status === 'ERROR' ? 'Erro' : prospeccao.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Leads Encontrados</h2>
            {leads.length > 0 && (
              <button
                onClick={handleExportContacts}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Exportar Contatos
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
{paginatedLeads.length > 0 && Object.keys(paginatedLeads[0]).length > 0 ? (
                paginatedLeads.map((lead, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.telefone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.endereco}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.tipo}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 text-center">
                    Nenhum lead encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {leads.length > 0 && (
            <Pagination
              totalItems={leads.length}
              itemsPerPage={leadsPerPage}
              currentPage={leadsPage}
              onPageChange={setLeadsPage}
              onItemsPerPageChange={setLeadsPerPage}
            />
          )}
        </div>
      </div>

      {/* Controle de Disparo */}
      {canEditProspect && (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Controle de Disparo</h2>
            {ordemDisparo && (
              <p className="text-sm text-gray-500 mt-1">
                Último disparo: {formatDate(ordemDisparo.data)}
              </p>
            )}
          </div>
          <button
            onClick={handleDisparo}
            disabled={disparoButton.disabled || loadingDisparo}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${disparoButton.color}`}
          >
            {disparoButton.icon}
            <span>{disparoButton.text}</span>
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
      )}

      {/* Histórico de Disparos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Histórico de Disparos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome do Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data do Disparo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
{paginatedDisparos.length > 0 && Object.keys(paginatedDisparos[0]).length > 0 ? (
                paginatedDisparos.map((disparo, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {disparo.nome_lead}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(disparo.data)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${disparo.status ? 'text-gray-600' : 'text-red-600'}`}>
                      {disparo.status ? 'Enviado' : 'WhatsApp inexistente'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-500 text-center">
                    Nenhum disparo registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {disparos.length > 0 && (
            <Pagination
              totalItems={disparos.length}
              itemsPerPage={disparosPerPage}
              currentPage={disparosPage}
              onPageChange={setDisparosPage}
              onItemsPerPageChange={setDisparosPerPage}
            />
          )}
        </div>
      </div>

      {/* Modal de Seleção de Modelo */}
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
              className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md disabled:opacity-50"
            >
              Iniciar Disparo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProspeccaoDetalhes;