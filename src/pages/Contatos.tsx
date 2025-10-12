import React, { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Pencil, Trash2, AlertCircle, ChevronUp, ChevronDown, Search, X, Check, Download, Upload } from 'lucide-react';
import Papa from 'papaparse';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { hasPermission } from '../utils/permissions';

interface Contato {
  Id: number;
  nome: string;
  Email: string;
  telefone: string;
}

type SortField = 'nome' | 'Email' | 'telefone';
type SortDirection = 'asc' | 'desc';

export default function Contatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedContato, setSelectedContato] = useState<Contato | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    Email: '',
    telefone: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
const canEditContacts = hasPermission('can_edit_contacts');

  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'nome',
    direction: 'asc'
  });
  const [filters, setFilters] = useState({
    nome: '',
    Email: '',
    telefone: ''
  });

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchContatos();
  }, []);

  const fetchContatos = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/contato/get', {
        headers: { token }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar contatos');
      }

      const data = await response.json();
      setContatos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar contatos:', err);
      setError('Erro ao carregar contatos');
      setContatos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportContacts = () => {
    const csvData = contatos.map(contato => ({
      nome: contato.nome,
      email: contato.Email,
      telefone: contato.telefone
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'contatos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportContacts = async (file: File) => {
    setUploading(true);
    setUploadError('');

    try {
      const result = await new Promise<any>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: resolve,
          error: reject,
          skipEmptyLines: true
        });
      });

      const contacts = result.data
        .filter((row: any) => row.nome && (row.email || row.telefone))
        .map((row: any) => ({
          nome: row.nome.trim(),
          Email: (row.email || '').trim(),
          telefone: (row.telefone || '').trim()
        }));

      if (contacts.length === 0) {
        throw new Error('Nenhum contato válido encontrado no arquivo');
      }

      for (const contact of contacts) {
        await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/contato/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify(contact)
        });
      }

      await fetchContatos();
      setIsImportModalOpen(false);
      setSuccess('Contatos importados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setUploadError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = selectedContato
        ? 'https://n8n.lumendigital.com.br/webhook/prospecta/contato/update'
        : 'https://n8n.lumendigital.com.br/webhook/prospecta/contato/create';

      const method = selectedContato ? 'PUT' : 'POST';
      const body = selectedContato
        ? { ...formData, id: selectedContato.Id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(selectedContato ? 'Erro ao atualizar contato' : 'Erro ao criar contato');
      }

      setSuccess(selectedContato ? 'Contato atualizado com sucesso!' : 'Contato criado com sucesso!');
      await fetchContatos();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(selectedContato ? 'Erro ao atualizar contato' : 'Erro ao criar contato');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedContato) return;

    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/crm/contato/delete?id=${selectedContato.Id}`, {
        method: 'DELETE',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir contato');
      }

      await fetchContatos();
      setIsModalOpen(false);
      setSelectedContato(null);
      setIsConfirmingDelete(false);
      setSuccess('Contato excluído com sucesso!');
    } catch (err) {
      setError('Erro ao excluir contato');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      Email: '',
      telefone: ''
    });
    setSelectedContato(null);
    setIsConfirmingDelete(false);
  };

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return 'N/A';
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const filteredAndSortedContacts = [...contatos]
    .filter(contato => {
      const matchesNome = (contato.nome || '').toLowerCase().includes((filters.nome || '').toLowerCase());
      const matchesEmail = !filters.Email || ((contato.Email || '').toLowerCase().includes((filters.Email || '').toLowerCase()));
      const matchesTelefone = !filters.telefone || ((contato.telefone || '').includes(filters.telefone));
      return matchesNome && matchesEmail && matchesTelefone;
    })
    .sort((a, b) => {
      const field = sortConfig.field;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      const aValue = (a[field] || '').toLowerCase();
      const bValue = (b[field] || '').toLowerCase();
      return aValue > bValue ? direction : -direction;
    });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContatos = filteredAndSortedContacts.slice(startIndex, endIndex);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
<div className="space-y-8 px-12 md:px-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
        </div>

        {canEditContacts && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportContacts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
          
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Importar
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Contato
          </button>
        </div>
                  )}

      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {contatos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ainda não existem contatos cadastrados no sistema
          </h2>
          <p className="text-gray-500 mb-6">
            Comece adicionando seu primeiro contato clicando no botão "Novo Contato"
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-300 bg-gray-50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.nome}
                    onChange={(e) => setFilters({ ...filters, nome: e.target.value })}
                    placeholder="Filtrar por nome..."
                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.Email}
                    onChange={(e) => setFilters({ ...filters, Email: e.target.value })}
                    placeholder="Filtrar por email..."
                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.telefone}
                    onChange={(e) => setFilters({ ...filters, telefone: e.target.value })}
                    placeholder="Filtrar por telefone..."
                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left cursor-pointer group"
                  onClick={() => handleSort('nome')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</span>
                    <SortIcon field="nome" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer group"
                  onClick={() => handleSort('Email')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</span>
                    <SortIcon field="Email" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left cursor-pointer group"
                  onClick={() => handleSort('telefone')}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</span>
                    <SortIcon field="telefone" />
                  </div>
                </th>
                                          {canEditContacts && (
                <th className="px-6 py-3 text-right">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</span>
                </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedContatos.map((contato) => (
                <tr
                  key={contato.Id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedContato(contato);
                    setFormData({
                      nome: contato.nome || '',
                      Email: contato.Email || '',
                      telefone: contato.telefone || ''
                    });
                    setIsModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{contato.nome || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{contato.Email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatPhoneNumber(contato.telefone)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {canEditContacts && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContato(contato);
                        setFormData({
                          nome: contato.nome || '',
                          Email: contato.Email || '',
                          telefone: contato.telefone || ''
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            totalItems={filteredAndSortedContacts.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

     {isModalOpen && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedContato ? 'Editar Contato' : 'Novo Contato'}
        </h2>
        <button
          onClick={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Conteúdo */}
      {isConfirmingDelete ? (
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Exclusão
              </h3>
              <p className="text-gray-500 mt-1">
                Tem certeza que deseja excluir o contato "{selectedContato?.nome}"?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsConfirmingDelete(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all"
            >
              Sim, Excluir
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
              placeholder="Digite o nome do contato..."
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.Email}
              onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
              placeholder="Digite o email do contato..."
            />
          </div>

          {/* Telefone */}
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              id="telefone"
              value={formData.telefone}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                if (raw.length <= 13) {
                  setFormData({ ...formData, telefone: raw });
                }
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
              placeholder="55 XX XXXXXXXXX"
            />
            <p className="text-xs text-gray-400 mt-1">
              O número deve estar no formato (ex: 5511999999999). Apenas números.
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
)}


      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar Contatos"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Para importar contatos, prepare um arquivo CSV com as seguintes colunas:
          </p>
          <ul className="list-disc list-inside mb-6 text-gray-600">
            <li>nome (obrigatório)</li>
            <li>email</li>
            <li>telefone</li>
          </ul>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImportContacts(file);
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
              <span className="text-xs text-gray-400 mt-1">
                O arquivo deve usar vírgula (,) como separador
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
    </div>
  );
}
