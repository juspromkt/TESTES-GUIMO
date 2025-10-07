import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, ChevronUp, ChevronDown, Search, GitBranch, Download } from 'lucide-react';
import type { Deal } from '../../types/deal';
import type { Funil } from '../../types/funil';
import Modal from '../Modal';
import InfiniteScroll from 'react-infinite-scroll-component';
import Papa from 'papaparse';

interface ListViewProps {
  deals: Deal[];
  funil: Funil;
  formatDate: (date: string) => string;
  onDealClick: (deal: Deal) => void;
  onDeleteDeal: (deal: Deal) => Promise<void>;
  onBulkDelete: (deals: Deal[]) => Promise<void>;
  onUpdateDeals: (deals: Deal[]) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  canEdit: boolean;
}

type SortField =
  | 'titulo'
  | 'contato'
  | 'estagio'
  | 'CreatedAt'
  | 'UpdatedAt';
type SortDirection = 'asc' | 'desc';

export default function ListView({
  deals,
  funil,
  formatDate,
  onDealClick,
  onDeleteDeal,
  onBulkDelete,
  onUpdateDeals,
  hasMore,
  onLoadMore,
  itemsPerPage,
  onItemsPerPageChange,
  canEdit
}: ListViewProps) {
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('UpdatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [movingDeals, setMovingDeals] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunnelId, setFilterFunnelId] = useState<number | null>(null);
  const [filterStageId, setFilterStageId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(10);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  const handleExportCSV = () => {
    const exportData = filteredDeals.map(deal => {
      const stage = funil.estagios?.find(s => parseInt(s.Id) === deal.id_estagio);
      return {
        id: deal.Id,
        data: formatDate(deal.UpdatedAt ?? deal.CreatedAt),
        funil: funil.nome,
        estagio: stage?.nome || 'N/A',
        titulo: deal.titulo,
        contato_nome: deal.contato?.nome || 'N/A',
        contato_telefone: deal.contato?.telefone || 'N/A',
        contato_email: deal.contato?.Email || 'N/A'
      };
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `negociacoes-${formatDate(new Date().toISOString())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta negociação?')) {
      try {
        await onDeleteDeal(deal);
        setSelectedDeals(prev => prev.filter(id => id !== deal.Id));
      } catch (err) {
        console.error('Error deleting deal:', err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedDeals.length} negociações?`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      const dealsToDelete = deals.filter(deal => selectedDeals.includes(deal.Id));
      await onBulkDelete(dealsToDelete);
      setSelectedDeals([]);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkMove = async () => {
    if (!selectedStageId) return;

    setMovingDeals(true);
    setError('');
    
    try {
      const promises = selectedDeals.map(dealId => 
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/update/stage', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            Id: dealId,
            id_estagio: parseInt(selectedStageId)
          })
        })
      );

      await Promise.all(promises);
      
      const updatedDeals = deals.map(deal => {
        if (selectedDeals.includes(deal.Id)) {
          return {
            ...deal,
            id_estagio: parseInt(selectedStageId)
          };
        }
        return deal;
      });

      onUpdateDeals(updatedDeals);
      
      setSuccess('Negociações movidas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      setSelectedDeals([]);
      setIsBulkMoveModalOpen(false);
    } catch (err) {
      console.error('Erro ao mover negociações:', err);
      setError('Erro ao mover negociações');
    } finally {
      setMovingDeals(false);
    }
  };

  const handleSelectCurrentPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentPageDeals = paginatedDeals.map(deal => deal.Id);
    if (e.target.checked) {
      setSelectedDeals(Array.from(new Set([...selectedDeals, ...currentPageDeals])));
    } else {
      setSelectedDeals(prev => prev.filter(id => !currentPageDeals.includes(id)));
    }
  };

  const handleSelectDeal = (dealId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals.filter(id => id !== dealId));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filterDeals = (deals: Deal[]) => {
    return deals.filter(deal => {
      const matchesSearch = 
        searchTerm === '' ||
        deal.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.contato?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFunnel = !filterFunnelId || deal.id_funil === filterFunnelId;
      const matchesStage = !filterStageId || deal.id_estagio === parseInt(filterStageId);

      return matchesSearch && matchesFunnel && matchesStage;
    });
  };

  const sortDeals = (dealsToSort: Deal[]) => {
    return [...dealsToSort].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'titulo':
          comparison = a.titulo.localeCompare(b.titulo);
          break;
        case 'contato':
          comparison = (a.contato?.nome || '').localeCompare(b.contato?.nome || '');
          break;
        case 'estagio': {
          const stageA = funil.estagios?.find(s => parseInt(s.Id) === a.id_estagio)?.nome || '';
          const stageB = funil.estagios?.find(s => parseInt(s.Id) === b.id_estagio)?.nome || '';
          comparison = stageA.localeCompare(stageB);
          break;
        }
        case 'CreatedAt':
          comparison = new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime();
          break;
        case 'UpdatedAt': {
          const dateA = a.UpdatedAt ? new Date(a.UpdatedAt) : new Date(a.CreatedAt);
          const dateB = b.UpdatedAt ? new Date(b.UpdatedAt) : new Date(b.CreatedAt);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <ChevronUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
      );
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  const filteredDeals = filterDeals(deals);
  const sortedDeals = sortDeals(filteredDeals);

  const startIndex = (currentPage - 1) * localItemsPerPage;
  const endIndex = startIndex + localItemsPerPage;
  const paginatedDeals = sortedDeals.slice(startIndex, endIndex);
  const totalPages = Math.ceil(sortedDeals.length / localItemsPerPage);

  const areAllCurrentPageDealsSelected = paginatedDeals.length > 0 && 
    paginatedDeals.every(deal => selectedDeals.includes(deal.Id));

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden w-full">
      {selectedDeals.length > 0 && canEdit && (
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedDeals.length} negociação(ões) selecionada(s)
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              <Download className="w-4 h-4" />
              Exportar Selecionados
            </button>
            <button
              onClick={() => setIsBulkMoveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              <GitBranch className="w-4 h-4" />
              Mover Selecionados
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {bulkDeleting ? (
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
      )}

      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Visualizar itens:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={150}>150</option>
              <option value={999}>+150</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Itens por página:</span>
            <select
              value={localItemsPerPage}
              onChange={(e) => {
                setLocalItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Página:</span>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <option key={page} value={page}>
                  {page} de {totalPages}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Funil:</span>
            <select
              value={filterFunnelId || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                setFilterFunnelId(value);
                setFilterStageId('');
              }}
              className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              <option value="">Todos</option>
              {funil && <option value={funil.id}>{funil.nome}</option>}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Estágio:</span>
            <select
              value={filterStageId}
              onChange={(e) => setFilterStageId(e.target.value)}
              className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2"
              disabled={!filterFunnelId}
            >
              <option value="">Todos</option>
              {funil?.estagios?.map((stage) => (
                <option key={stage.Id} value={stage.Id}>
                  {stage.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título ou contato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full" id="deals-table-container">
        <InfiniteScroll
          dataLength={deals.length}
          next={onLoadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          }
          scrollableTarget="deals-table-container"
        >
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-[48px] p-4">
                {canEdit && (
                  <input
                    type="checkbox"
                    checked={areAllCurrentPageDealsSelected}
                    onChange={handleSelectCurrentPage}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  )}
                </th>
                <th 
                  scope="col"
                  className="w-[300px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleSort('titulo')}
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1">Título</span>
                    <SortIcon field="titulo" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleSort('contato')}
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1">Contato</span>
                    <SortIcon field="contato" />
                  </div>
                </th>
                <th 
                  scope="col"
                  className="w-[180px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleSort('estagio')}
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1">Estágio</span>
                    <SortIcon field="estagio" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="w-[140px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
                  onClick={() => handleSort('UpdatedAt')}
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1">Atualizado</span>
                    <SortIcon field="UpdatedAt" />
                  </div>
                </th>
                <th scope="col" className="w-[100px] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDeals.map((deal) => {
                const stage = funil.estagios?.find(s => parseInt(s.Id) === deal.id_estagio);
                return (
                  <tr
                    key={deal.Id}
                    onClick={() => onDealClick(deal)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="w-[48px] p-4" onClick={e => e.stopPropagation()}>
                                      {canEdit && (
                      <input
                        type="checkbox"
                        checked={selectedDeals.includes(deal.Id)}
                        onChange={(e) => handleSelectDeal(deal.Id, e)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                                                                )}
                    </td>
                    <td className="w-[300px] px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[280px] truncate" title={deal.titulo}>
                        {deal.titulo}
                      </div>
                    </td>
                    <td className="w-[200px] px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[180px] truncate" title={deal.contato?.nome}>
                        {deal.contato?.nome}
                      </div>
                    </td>
                    <td className="w-[180px] px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-[160px] truncate" title={stage?.nome}>
                        {stage?.nome}
                      </div>
                    </td>
                    <td className="w-[140px] px-4 py-3">
                      <div className="text-sm text-gray-500 truncate">
                        {formatDate(deal.UpdatedAt ?? deal.CreatedAt)}
                      </div>
                    </td>
                    <td className="w-[100px] px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDealClick(deal);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                                        {canEdit && (
                        <button
                          onClick={(e) => handleDelete(deal, e)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </InfiniteScroll>
      </div>
      {canEdit && (

      <Modal
        isOpen={isBulkMoveModalOpen}
        onClose={() => {
          setIsBulkMoveModalOpen(false);
          setSelectedStageId('');
          setError('');
        }}
        title="Mover Negociações"
      >
        <div className="p-6">
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o novo estágio
            </label>
            <select
              id="stage"
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione um estágio...</option>
              {funil.estagios?.map((stage) => (
                <option key={stage.Id} value={stage.Id}>
                  {stage.nome}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsBulkMoveModalOpen(false);
                setSelectedStageId('');
                setError('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleBulkMove}
              disabled={!selectedStageId || movingDeals}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {movingDeals ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Movendo...</span>
                </>
              ) : (
                <>
                  <GitBranch className="w-5 h-5" />
                  <span>Mover Negociações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
            )}
    </div>
  );
}