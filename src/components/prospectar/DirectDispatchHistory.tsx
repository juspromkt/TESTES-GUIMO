import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, ArrowUpDown, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Pagination from '../Pagination';
import Modal from '../Modal';
import { hasPermission } from '../../utils/permissions';

interface DirectDispatch {
  Id: number;
  nome: string;
  publico: string;
  cidade: string;
}

interface SortConfig {
  key: keyof DirectDispatch;
  direction: 'asc' | 'desc';
}

export default function DirectDispatchHistory() {
  const [dispatches, setDispatches] = useState<DirectDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<DirectDispatch | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    publico: '',
    cidade: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'nome', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  const canEditProspect = hasPermission('can_edit_prospect');
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchDispatches();
  }, []);

  const fetchDispatches = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/dd/get', {
        headers: { token }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar disparos');
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : [];
setDispatches(
  Array.isArray(data)
    ? data.filter((item) => item && Object.keys(item).length > 0 && item.nome)
    : []
);
      setError('');
    } catch (err) {
      console.error('Erro ao carregar disparos:', err);
      setError('Erro ao carregar disparos diretos');
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/dd/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erro ao criar disparo');
      }

      const data = await response.json();
      
      if (data.length > 0 && data[0].id) {
        setIsCreateModalOpen(false);
        setFormData({ nome: '', publico: '', cidade: '' });
        navigate(`/prospectar/dd/${data[0].id}`);
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      console.error('Erro ao criar disparo:', err);
      setError('Erro ao criar disparo direto');
    }
  };

  const handleDelete = async () => {
    if (!selectedDispatch) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(
        `https://n8n.lumendigital.com.br/webhook/prospecta/dd/delete?id=${selectedDispatch.Id}`,
        {
          method: 'DELETE',
          headers: { token }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir disparo');
      }

      await fetchDispatches();
      setIsDeleteModalOpen(false);
      setSelectedDispatch(null);
      setSuccess('Disparo excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao excluir disparo:', err);
      setError('Erro ao excluir disparo');
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (key: keyof DirectDispatch) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedDispatches = [...dispatches].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return (a[sortConfig.key] || '').toString().localeCompare((b[sortConfig.key] || '').toString());
    }
    return (b[sortConfig.key] || '').toString().localeCompare((a[sortConfig.key] || '').toString());
  });

  const filteredDispatches = sortedDispatches.filter(dispatch => {
    const searchLower = searchTerm.toLowerCase();
    const nome = (dispatch.nome || '').toLowerCase();
    const publico = (dispatch.publico || '').toLowerCase();
    const cidade = (dispatch.cidade || '').toLowerCase();
    
    return nome.includes(searchLower) ||
           publico.includes(searchLower) ||
           cidade.includes(searchLower);
  });

  const paginatedDispatches = filteredDispatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ column }: { column: keyof DirectDispatch }) => (
    <ArrowUpDown
      className={`w-4 h-4 inline-block ml-1 ${
        sortConfig.key === column ? 'text-blue-600' : 'text-gray-400'
      }`}
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Envio de mensagens em massa</h2>
        {canEditProspect && (

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Disparo
        </button>
      )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Pesquisar por nome, público ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredDispatches.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Nenhum disparo direto encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nome')}
                >
                  Nome <SortIcon column="nome" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('publico')}
                >
                  Público <SortIcon column="publico" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cidade')}
                >
                  Cidade <SortIcon column="cidade" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
{paginatedDispatches.length > 0 && (
  <tbody className="bg-white divide-y divide-gray-200">
    {paginatedDispatches.map((dispatch) => (
      <tr key={dispatch.Id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispatch.nome || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispatch.publico || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispatch.cidade || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/prospectar/dd/${dispatch.Id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Consultar
                      </button>
                            {canEditProspect && (

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDispatch(dispatch);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
  )}
          </table>
        )}

        <Pagination
          totalItems={filteredDispatches.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Novo Disparo Direto
              </h3>
              <form onSubmit={handleCreateDispatch} className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Disparo
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="publico" className="block text-sm font-medium text-gray-700 mb-1">
                    Público
                  </label>
                  <input
                    type="text"
                    id="publico"
                    value={formData.publico}
                    onChange={(e) => setFormData({ ...formData, publico: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setFormData({ nome: '', publico: '', cidade: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  >
                    Criar Disparo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDispatch(null);
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
                Tem certeza que deseja excluir?
              </h3>
              <p className="text-gray-500 mt-1">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedDispatch(null);
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
    </div>
  );
}