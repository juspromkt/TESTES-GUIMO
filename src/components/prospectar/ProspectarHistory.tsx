import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import Pagination from '../Pagination';
import { parseSaoPauloDate } from '../../utils/timezone';

interface Prospeccao {
  Id: number;
  segmento: string;
  cidade: string;
  filtros: string;
  data: string;
  leads_encontrados: string;
  status: 'pending' | 'SUCESS' | 'ERROR';
}

interface FilterState {
  segmento: string;
  cidade: string;
  status: string;
}

interface ProspectarHistoryProps {
  refreshTrigger?: number;
}

export default function ProspectarHistory({ refreshTrigger = 0 }: ProspectarHistoryProps) {
  const [historico, setHistorico] = useState<Prospeccao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filterValues, setFilterValues] = useState<FilterState>({
    segmento: '',
    cidade: '',
    status: ''
  });

  const [uniqueSegmentos, setUniqueSegmentos] = useState<string[]>([]);
  const [uniqueCidades, setUniqueCidades] = useState<string[]>([]);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchHistorico();
  }, [refreshTrigger]);

  useEffect(() => {
    const segmentos = [...new Set(historico.map(item => item.segmento))];
    const cidades = [...new Set(historico.map(item => item.cidade))];
    
    setUniqueSegmentos(segmentos);
    setUniqueCidades(cidades);
  }, [historico]);

  const fetchHistorico = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/prospeccao/get', {
        headers: {
          token: token
        }
      });
      const data = await response.json();
      setHistorico(data);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Erro ao carregar histórico de prospecções');
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = parseSaoPauloDate(dateString);
    return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  };

  const filteredHistorico = historico.filter(item => {
    const matchesSegmento = !filterValues.segmento || item.segmento === filterValues.segmento;
    const matchesCidade = !filterValues.cidade || item.cidade === filterValues.cidade;
    const matchesStatus = !filterValues.status || item.status === filterValues.status;
    return matchesSegmento && matchesCidade && matchesStatus;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistorico = filteredHistorico.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-neutral-100"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-neutral-700">
      <div className="p-6 border-b border-gray-300 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">Histórico de Prospecções</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
            <span className="text-sm text-gray-500 dark:text-neutral-400">Filtros</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Segmento
            </label>
            <select
              value={filterValues.segmento}
              onChange={(e) => setFilterValues({ ...filterValues, segmento: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-900 dark:focus:border-neutral-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
            >
              <option value="">Todos</option>
              {uniqueSegmentos.map((segmento) => (
                <option key={segmento} value={segmento}>{segmento}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Cidade
            </label>
            <select
              value={filterValues.cidade}
              onChange={(e) => setFilterValues({ ...filterValues, cidade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-900 dark:focus:border-neutral-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
            >
              <option value="">Todas</option>
              {uniqueCidades.map((cidade) => (
                <option key={cidade} value={cidade}>{cidade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Status
            </label>
            <select
              value={filterValues.status}
              onChange={(e) => setFilterValues({ ...filterValues, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-900 dark:focus:border-neutral-400 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="SUCESS">Concluído</option>
              <option value="ERROR">Erro</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                Segmento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                Cidade
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                Filtros
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                Leads
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
  {paginatedHistorico.length > 0 && Object.keys(paginatedHistorico[0]).length > 0 ? (
    paginatedHistorico.map((item) => (
      <tr key={item.Id} className="hover:bg-gray-50 dark:hover:bg-neutral-700">
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
          {item.segmento}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
          {item.cidade}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
          {item.filtros || '-'}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
          {formatDate(item.data)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-neutral-100">
          {item.leads_encontrados}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(item.status)}`}>
            {item.status === 'pending' ? 'Pendente' :
             item.status === 'SUCESS' ? 'Concluído' :
             item.status === 'ERROR' ? 'Erro' : item.status}
          </span>
        </td>
        <td className="px-4 py-3 text-sm">
          <button
            onClick={() => navigate(`/prospectar/${item.Id}`)}
            className="text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 font-medium"
          >
            Consultar
          </button>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={7} className="px-4 py-3 text-sm text-gray-500 dark:text-neutral-400 text-center">
        Nenhum histórico encontrado
      </td>
    </tr>
  )}
</tbody>

        </table>

        <Pagination
          totalItems={filteredHistorico.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
}