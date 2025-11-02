import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Loader2, Pencil, Trash2, AlertCircle, ChevronUp, ChevronDown, Search, X, Check, Download, Mail, Phone, UserPlus, FileDown, FileUp, Filter, Globe, Calendar } from 'lucide-react';
import Papa from 'papaparse';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { hasPermission } from '../utils/permissions';
import { Contato } from '../types/contato';

type SortField = 'nome' | 'Email' | 'telefone' | 'createdAt';
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
  const [countryCode, setCountryCode] = useState('+55');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
const canEditContacts = hasPermission('can_edit_contacts');

  // Estados para seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'nome',
    direction: 'asc'
  });
  const [filters, setFilters] = useState({
    nome: '',
    Email: '',
    telefone: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchContatos();
  }, []);

  // 🔁 Atualiza lista de contatos quando o contato é alterado pela sidebar
useEffect(() => {
  const handleContactUpdated = () => {
    console.log("[Contatos] Atualizando lista após edição na sidebar...");
    fetchContatos();
  };

  window.addEventListener("contactUpdated", handleContactUpdated);
  return () => {
    window.removeEventListener("contactUpdated", handleContactUpdated);
  };
}, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lista de países com bandeiras SVG
  const countries = [
    { code: '+55', country: 'BR', name: 'Brasil', flag: '🇧🇷' },
    { code: '+1', country: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
    { code: '+44', country: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
    { code: '+351', country: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: '+34', country: 'ES', name: 'Espanha', flag: '🇪🇸' },
    { code: '+33', country: 'FR', name: 'França', flag: '🇫🇷' },
    { code: '+49', country: 'DE', name: 'Alemanha', flag: '🇩🇪' },
    { code: '+39', country: 'IT', name: 'Itália', flag: '🇮🇹' },
    { code: '+52', country: 'MX', name: 'México', flag: '🇲🇽' },
    { code: '+54', country: 'AR', name: 'Argentina', flag: '🇦🇷' },
  ];

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];


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
          telefone: (row.telefone || '').trim(),
          createdAt: new Date().toISOString()
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
        : { ...formData, createdAt: new Date().toISOString() };

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
    setCountryCode('+55');
    setPhoneNumber('');
    setSelectedContato(null);
    setIsConfirmingDelete(false);
  };

  // Funções de seleção múltipla
  const handleSelectContact = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    setSelectAllPages(false);
  };

  const handleSelectAllCurrentPage = () => {
    if (selectedIds.size === paginatedContatos.length && !selectAllPages) {
      setSelectedIds(new Set());
      setSelectAllPages(false);
    } else {
      setSelectedIds(new Set(paginatedContatos.map(c => c.Id)));
      setSelectAllPages(false);
    }
  };

  const handleSelectAllPages = () => {
    setSelectedIds(new Set(filteredAndSortedContacts.map(c => c.Id)));
    setSelectAllPages(true);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
    setSelectAllPages(false);
  };

  // Abre modal de confirmação de exclusão
  const handleDeleteMultiple = () => {
    if (!token || selectedIds.size === 0) return;
    setShowDeleteConfirmModal(true);
  };

  // Confirma e executa a exclusão múltipla
  const confirmDeleteMultiple = async () => {
    setShowDeleteConfirmModal(false);
    setIsDeletingMultiple(true);
    setError('');

    try {
      const idsToDelete = selectAllPages
        ? filteredAndSortedContacts.map(c => c.Id)
        : Array.from(selectedIds);

      console.log('[DeleteMultiple] Iniciando exclusão de', idsToDelete.length, 'contatos');

      // Excluir em paralelo
      const deletePromises = idsToDelete.map(async id => {
        const url = `https://n8n.lumendigital.com.br/webhook/crm/contato/delete?id=${id}`;

        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'token': token || ''
          }
        });

        if (!response.ok) {
          throw new Error(`Erro ao excluir contato ${id}`);
        }

        return response;
      });

      await Promise.all(deletePromises);

      console.log('[DeleteMultiple] Exclusão concluída com sucesso!');
      setSuccess(`${idsToDelete.length} contato(s) excluído(s) com sucesso!`);
      setSelectedIds(new Set());
      setSelectAllPages(false);
      await fetchContatos();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('[DeleteMultiple] Erro geral:', err);
      setError(`Erro ao excluir contatos: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  // Função para detectar e extrair o código do país do telefone
  const extractCountryCode = (phone: string) => {
    if (!phone) return { code: '+55', number: '' };

    const countryCodes = [
      { code: '+55', digits: '55', length: 2 },
      { code: '+351', digits: '351', length: 3 },
      { code: '+1', digits: '1', length: 1 },
      { code: '+44', digits: '44', length: 2 },
      { code: '+34', digits: '34', length: 2 },
      { code: '+33', digits: '33', length: 2 },
      { code: '+49', digits: '49', length: 2 },
      { code: '+39', digits: '39', length: 2 },
      { code: '+52', digits: '52', length: 2 },
      { code: '+54', digits: '54', length: 2 }
    ];

    for (const country of countryCodes) {
      if (phone.startsWith(country.digits)) {
        return {
          code: country.code,
          number: phone.substring(country.length)
        };
      }
    }

    return { code: '+55', number: phone };
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const filteredAndSortedContacts = [...contatos]
    .filter(contato => {
      // Mobile: busca unificada
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesNome = (contato.nome || '').toLowerCase().includes(query);
        const matchesEmail = (contato.Email || '').toLowerCase().includes(query);
        const matchesTelefone = (contato.telefone || '').includes(searchQuery);
        return matchesNome || matchesEmail || matchesTelefone;
      }

      // Desktop: filtros separados
      const matchesNome = (contato.nome || '').toLowerCase().includes((filters.nome || '').toLowerCase());
      const matchesEmail = !filters.Email || ((contato.Email || '').toLowerCase().includes((filters.Email || '').toLowerCase()));
      const matchesTelefone = !filters.telefone || ((contato.telefone || '').includes(filters.telefone));
      return matchesNome && matchesEmail && matchesTelefone;
    })
    .sort((a, b) => {
      const field = sortConfig.field;
      const direction = sortConfig.direction === 'asc' ? 1 : -1;

      // Ordenação especial para datas
      if (field === 'createdAt') {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aDate > bDate ? direction : -direction;
      }

      const aValue = (a[field] || '').toLowerCase();
      const bValue = (b[field] || '').toLowerCase();
      return aValue > bValue ? direction : -direction;
    });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContatos = filteredAndSortedContacts.slice(startIndex, endIndex);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-600 dark:text-neutral-400">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 transition-theme">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Header Minimalista */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 dark:bg-blue-500 p-2.5 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-neutral-100">
                Contatos
              </h1>
              <p className="text-sm text-gray-600 dark:text-neutral-400">
                Gerencie sua base de contatos
              </p>
            </div>
          </div>

          {canEditContacts && (
            <div className="hidden lg:flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDeleteMultiple}
                disabled={selectedIds.size === 0 || isDeletingMultiple}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-red-600 dark:text-red-400 rounded-lg hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingMultiple ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>
                  {isDeletingMultiple
                    ? 'Excluindo...'
                    : selectedIds.size > 0
                      ? `Excluir (${selectedIds.size})`
                      : 'Excluir'
                  }
                </span>
              </button>

              <button
                onClick={handleExportContacts}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 rounded-lg hover:border-gray-400 dark:hover:border-neutral-500 transition-colors text-sm font-medium"
              >
                <FileDown className="w-4 h-4" />
                <span>Exportar</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 rounded-lg hover:border-gray-400 dark:hover:border-neutral-500 transition-colors text-sm font-medium"
              >
                <FileUp className="w-4 h-4" />
                <span>Importar</span>
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Contato</span>
              </button>
            </div>
          )}
        </div>

        {/* Mensagens de Sucesso e Erro */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center gap-2.5">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Estado Vazio ou Lista de Contatos */}
        {contatos.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-12 text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-5 rounded-full inline-flex mb-4">
              <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-2">
              Nenhum contato cadastrado
            </h2>
            <p className="text-sm text-gray-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
              Comece adicionando seu primeiro contato para gerenciar sua base de relacionamentos
            </p>

            {canEditContacts && (
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                <span>Criar Primeiro Contato</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
            {/* Filtro Mobile - Campo único de busca */}
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 lg:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar contato..."
                  className="pl-9 pr-3 py-2.5 w-full bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Filtro Desktop - Campo único unificado */}
            <div className="hidden lg:block p-4 border-b border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-600 dark:text-neutral-400" />
                <h3 className="text-xs font-semibold text-gray-700 dark:text-neutral-200 uppercase tracking-wide">Filtro</h3>
              </div>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome, email ou telefone..."
                  className="pl-9 pr-3 py-2 w-full bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Banner de seleção de todos os contatos */}
            {selectedIds.size === paginatedContatos.length && paginatedContatos.length > 0 && filteredAndSortedContacts.length > paginatedContatos.length && !selectAllPages && (
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    Todos os <strong>{paginatedContatos.length}</strong> contatos desta página estão selecionados.
                  </p>
                  <button
                    onClick={handleSelectAllPages}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                  >
                    Selecionar todos os {filteredAndSortedContacts.length} contatos
                  </button>
                </div>
              </div>
            )}

            {/* Banner quando todos os contatos estão selecionados */}
            {selectAllPages && (
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    Todos os <strong>{filteredAndSortedContacts.length}</strong> contatos estão selecionados.
                  </p>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                  >
                    Desmarcar todos
                  </button>
                </div>
              </div>
            )}

            {/* Tabela Minimalista */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-700/50">
                    {canEditContacts && (
                      <th className="hidden lg:table-cell px-3 py-2.5 text-left w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === paginatedContatos.length && paginatedContatos.length > 0}
                          onChange={handleSelectAllCurrentPage}
                          className="w-4 h-4 text-blue-600 bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      </th>
                    )}
                    <th
                      className="px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => handleSort('nome')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200 uppercase tracking-wide">Nome</span>
                        <SortIcon field="nome" />
                      </div>
                    </th>
                    <th
                      className="hidden lg:table-cell px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => handleSort('Email')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200 uppercase tracking-wide">Email</span>
                        <SortIcon field="Email" />
                      </div>
                    </th>
                    <th
                      className="hidden lg:table-cell px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => handleSort('telefone')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200 uppercase tracking-wide">Telefone</span>
                        <SortIcon field="telefone" />
                      </div>
                    </th>
                    <th
                      className="hidden lg:table-cell px-3 py-2.5 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200 uppercase tracking-wide">Data de Criação</span>
                        <SortIcon field="createdAt" />
                      </div>
                    </th>
                    {canEditContacts && (
                      <th className="hidden lg:table-cell px-3 py-2.5 text-right">
                        <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200 uppercase tracking-wide">Ações</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                  {paginatedContatos.map((contato) => (
                    <tr
                      key={contato.Id}
                      className={`hover:bg-gray-50 dark:hover:bg-neutral-700/30 transition-colors ${selectedIds.has(contato.Id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      {canEditContacts && (
                        <td className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(contato.Id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectContact(contato.Id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-blue-600 bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                          />
                        </td>
                      )}
                      <td
                        className="px-3 py-2.5 whitespace-nowrap cursor-pointer"
                        onClick={() => {
                          setSelectedContato(contato);
                          const { code, number } = extractCountryCode(contato.telefone || '');
                          setCountryCode(code);
                          setPhoneNumber(number);
                          setFormData({
                            nome: contato.nome || '',
                            Email: contato.Email || '',
                            telefone: contato.telefone || ''
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {contato.nome?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                            {contato.nome || '-'}
                          </div>
                        </div>
                      </td>
                      <td
                        className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap cursor-pointer"
                        onClick={() => {
                          setSelectedContato(contato);
                          const { code, number } = extractCountryCode(contato.telefone || '');
                          setCountryCode(code);
                          setPhoneNumber(number);
                          setFormData({
                            nome: contato.nome || '',
                            Email: contato.Email || '',
                            telefone: contato.telefone || ''
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{contato.Email || '-'}</span>
                        </div>
                      </td>
                      <td
                        className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap cursor-pointer"
                        onClick={() => {
                          setSelectedContato(contato);
                          const { code, number } = extractCountryCode(contato.telefone || '');
                          setCountryCode(code);
                          setPhoneNumber(number);
                          setFormData({
                            nome: contato.nome || '',
                            Email: contato.Email || '',
                            telefone: contato.telefone || ''
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{formatPhoneNumber(contato.telefone)}</span>
                        </div>
                      </td>
                      <td
                        className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap cursor-pointer"
                        onClick={() => {
                          setSelectedContato(contato);
                          const { code, number } = extractCountryCode(contato.telefone || '');
                          setCountryCode(code);
                          setPhoneNumber(number);
                          setFormData({
                            nome: contato.nome || '',
                            Email: contato.Email || '',
                            telefone: contato.telefone || ''
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(contato.createdAt)}</span>
                        </div>
                      </td>
                      {canEditContacts && (
                        <td className="hidden lg:table-cell px-3 py-2.5 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContato(contato);
                              const { code, number } = extractCountryCode(contato.telefone || '');
                              setCountryCode(code);
                              setPhoneNumber(number);
                              setFormData({
                                nome: contato.nome || '',
                                Email: contato.Email || '',
                                telefone: contato.telefone || ''
                              });
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 text-gray-400 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/50 px-4 py-3">
              <Pagination
                totalItems={filteredAndSortedContacts.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </div>
        )}

        {/* Modal Minimalista */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 w-full max-w-lg overflow-hidden">
              {/* Cabeçalho Minimalista */}
              <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {selectedContato ? (
                      <Pencil className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
                    ) : (
                      <UserPlus className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
                    )}
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                      {selectedContato ? 'Editar Contato' : 'Novo Contato'}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              {isConfirmingDelete ? (
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-1">
                        Confirmar Exclusão
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        Tem certeza que deseja excluir o contato <span className="font-medium text-gray-900 dark:text-neutral-100">"{selectedContato?.nome}"</span>? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5">
                    <button
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Sim, Excluir
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* Nome */}
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-1.5">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4" />
                      <input
                        type="text"
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                        placeholder="Digite o nome completo..."
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4" />
                      <input
                        type="email"
                        id="email"
                        value={formData.Email}
                        onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                        placeholder="exemplo@email.com"
                      />
                    </div>
                  </div>

                  {/* Telefone com Seletor de País */}
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-1.5">
                      Telefone WhatsApp
                    </label>
                    <div className="flex gap-2">
                      {/* Seletor de País */}
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className="h-[42px] w-[110px] px-2.5 flex items-center gap-1.5 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-neutral-100 bg-white dark:bg-neutral-700 cursor-pointer hover:border-gray-400 dark:hover:border-neutral-500 text-sm font-medium"
                        >
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm">{selectedCountry.code}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 dark:text-neutral-400 ml-auto transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCountryDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-[220px] bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-lg z-50 max-h-[280px] overflow-y-auto">
                            {countries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setCountryCode(country.code);
                                  const cleanPhone = phoneNumber.replace(/^\+?\d{1,3}/, '');
                                  const fullNumber = country.code.replace('+', '') + cleanPhone;
                                  setFormData({ ...formData, telefone: fullNumber });
                                  setIsCountryDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors text-left ${
                                  countryCode === country.code ? 'bg-gray-100 dark:bg-neutral-600' : ''
                                }`}
                              >
                                <span className="text-lg">{country.flag}</span>
                                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-neutral-100">{country.name}</span>
                                <span className="text-sm text-gray-600 dark:text-neutral-400">{country.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Campo de Número */}
                      <div className="flex-1 relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4" />
                        <input
                          type="tel"
                          id="telefone"
                          value={phoneNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            const maxLength = countryCode === '+55' ? 11 : 15;
                            if (raw.length <= maxLength) {
                              setPhoneNumber(raw);
                              const fullNumber = countryCode.replace('+', '') + raw;
                              setFormData({ ...formData, telefone: fullNumber });
                            }
                          }}
                          onFocus={() => {
                            const currentPhone = formData.telefone || '';
                            const codeDigits = countryCode.replace('+', '');
                            if (currentPhone.startsWith(codeDigits)) {
                              const phoneOnly = currentPhone.substring(codeDigits.length);
                              setPhoneNumber(phoneOnly);
                            }
                          }}
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 text-sm"
                          placeholder={countryCode === '+55' ? '11999999999' : 'Número do telefone'}
                        />
                      </div>
                    </div>

                    {/* Dica Visual */}
                    <div className="mt-2 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-2.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-0.5">
                          Sempre inclua o código do país
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          {countryCode === '+55'
                            ? 'Ex: +55 11 99999-9999 → Digite: 11999999999'
                            : `Ex: ${countryCode} + número local completo`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-between items-center gap-2.5 pt-3 border-t border-gray-200 dark:border-neutral-700">
                    {selectedContato && (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          resetForm();
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-200 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}


        {/* Modal de Importação */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Importar Contatos"
        >
          <div className="p-5">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mb-5">
              <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-2 flex items-center gap-2 text-sm">
                <FileUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Formato do Arquivo CSV
              </h4>
              <p className="text-sm text-gray-700 dark:text-neutral-300 mb-2.5">
                Prepare um arquivo CSV com as seguintes colunas:
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-neutral-100">nome</span>
                  <span className="text-gray-600 dark:text-neutral-400 text-xs">(obrigatório)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-neutral-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-neutral-100">email</span>
                  <span className="text-gray-600 dark:text-neutral-400 text-xs">(opcional)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-neutral-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-neutral-100">telefone</span>
                  <span className="text-gray-600 dark:text-neutral-400 text-xs">(opcional)</span>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg p-8 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
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
                disabled={uploading}
              />
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-3">
                  <FileUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-neutral-100 mb-1">
                  Selecione um arquivo CSV
                </span>
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  ou arraste e solte aqui
                </span>
                <span className="text-xs text-gray-400 dark:text-neutral-500 mt-1.5">
                  Usar vírgula (,) como separador
                </span>
              </label>
            </div>

            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{uploadError}</span>
              </div>
            )}

            {uploading && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-700 dark:text-neutral-200">Processando arquivo...</span>
              </div>
            )}
          </div>
        </Modal>

        {/* Modal de Confirmação de Exclusão em Lote */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-neutral-700">
              {/* Ícone e Header */}
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-2">
                  Confirmar Exclusão
                </h3>
                <p className="text-gray-600 dark:text-neutral-400 text-sm mb-1">
                  {selectAllPages ? (
                    <>
                      Você está prestes a excluir <span className="font-bold text-red-600 dark:text-red-400">{filteredAndSortedContacts.length} contatos</span>
                    </>
                  ) : (
                    <>
                      Você está prestes a excluir <span className="font-bold text-red-600 dark:text-red-400">{selectedIds.size} {selectedIds.size === 1 ? 'contato' : 'contatos'}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Aviso de Ação Irreversível */}
              <div className="px-6 pb-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                        ⚠️ Esta ação não pode ser desfeita!
                      </p>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        Todos os dados dos contatos selecionados serão permanentemente removidos do sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirmModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-neutral-200 bg-white dark:bg-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-600 border border-gray-300 dark:border-neutral-600 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteMultiple}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                  >
                    Sim, Excluir {selectAllPages ? 'Todos' : selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
