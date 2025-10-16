import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Loader2, Pencil, Trash2, AlertCircle, ChevronUp, ChevronDown, Search, X, Check, Download, Mail, Phone, UserPlus, FileDown, FileUp, Filter, Globe } from 'lucide-react';
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
    setCountryCode('+55');
    setPhoneNumber('');
    setSelectedContato(null);
    setIsConfirmingDelete(false);
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
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Loader2 className="relative w-12 h-12 animate-spin text-blue-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900 transition-theme">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Premium */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
                  Contatos
                </h1>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mt-0.5">
                  Gerencie sua base de contatos
                </p>
              </div>
            </div>
          </div>

          {canEditContacts && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportContacts}
                className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 font-medium"
              >
                <FileDown className="w-5 h-5 text-gray-500 dark:text-neutral-400 group-hover:text-blue-600 transition-colors" />
                <span>Exportar</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 font-medium"
              >
                <FileUp className="w-5 h-5 text-gray-500 dark:text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                <span>Importar</span>
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="group relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <UserPlus className="relative w-5 h-5" />
                <span className="relative">Novo Contato</span>
              </button>
            </div>
          )}
        </div>

        {/* Mensagens de Sucesso e Erro */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 text-green-700 px-5 py-4 rounded-xl shadow-sm backdrop-blur-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 text-red-700 px-5 py-4 rounded-xl shadow-sm backdrop-blur-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Estado Vazio ou Lista de Contatos */}
        {contatos.length === 0 ? (
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-700 p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-30 -z-10"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl opacity-30 -z-10"></div>

            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-2xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-full">
                <Users className="w-16 h-16 text-blue-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-3">
              Nenhum contato cadastrado
            </h2>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Comece adicionando seu primeiro contato para gerenciar sua base de relacionamentos
            </p>

            {canEditContacts && (
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium"
              >
                <UserPlus className="w-5 h-5" />
                <span>Criar Primeiro Contato</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-700 overflow-hidden">
            {/* Filtros Premium */}
            <div className="p-6 border-b border-gray-100 dark:border-neutral-700 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-neutral-800 dark:to-neutral-800">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600 dark:text-neutral-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-200 uppercase tracking-wide">Filtros</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">
                    Nome
                  </label>
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      value={filters.nome}
                      onChange={(e) => setFilters({ ...filters, nome: e.target.value })}
                      placeholder="Buscar por nome..."
                      className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      value={filters.Email}
                      onChange={(e) => setFilters({ ...filters, Email: e.target.value })}
                      placeholder="Buscar por email..."
                      className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">
                    Telefone
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500 w-4 h-4 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      value={filters.telefone}
                      onChange={(e) => setFilters({ ...filters, telefone: e.target.value })}
                      placeholder="Buscar por telefone..."
                      className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela Premium */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-neutral-700">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50/20 dark:from-neutral-700 dark:to-neutral-700">
                    <th
                      className="px-6 py-4 text-left cursor-pointer group transition-colors hover:bg-blue-50 dark:hover:bg-neutral-600"
                      onClick={() => handleSort('nome')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-neutral-200 uppercase tracking-wider">Nome</span>
                        <SortIcon field="nome" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left cursor-pointer group transition-colors hover:bg-blue-50 dark:hover:bg-neutral-600"
                      onClick={() => handleSort('Email')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-neutral-200 uppercase tracking-wider">Email</span>
                        <SortIcon field="Email" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-left cursor-pointer group transition-colors hover:bg-blue-50 dark:hover:bg-neutral-600"
                      onClick={() => handleSort('telefone')}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700 dark:text-neutral-200 uppercase tracking-wider">Telefone</span>
                        <SortIcon field="telefone" />
                      </div>
                    </th>
                    {canEditContacts && (
                      <th className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-gray-700 dark:text-neutral-200 uppercase tracking-wider">Ações</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-50 dark:divide-neutral-700">
                  {paginatedContatos.map((contato) => (
                    <tr
                      key={contato.Id}
                      className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 dark:hover:from-neutral-700/50 dark:hover:to-neutral-700/50 cursor-pointer transition-all duration-200"
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                            {contato.nome?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100 group-hover:text-blue-700 transition-colors">
                            {contato.nome || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                          <Mail className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                          <span>{contato.Email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                          <Phone className="w-4 h-4 text-gray-400 dark:text-neutral-500" />
                          <span>{formatPhoneNumber(contato.telefone)}</span>
                        </div>
                      </td>
                      {canEditContacts && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                            className="inline-flex items-center justify-center w-9 h-9 text-gray-400 dark:text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="border-t border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-700/50 px-6 py-4">
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

        {/* Modal Premium */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
              {/* Cabeçalho com Gradiente */}
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      {selectedContato ? (
                        <Pencil className="w-5 h-5 text-white" />
                      ) : (
                        <UserPlus className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedContato ? 'Editar Contato' : 'Novo Contato'}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              {isConfirmingDelete ? (
                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-600 rounded-2xl blur-xl opacity-20"></div>
                      <div className="relative w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <AlertCircle className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-2">
                        Confirmar Exclusão
                      </h3>
                      <p className="text-gray-600 dark:text-neutral-400">
                        Tem certeza que deseja excluir o contato <span className="font-semibold text-gray-900 dark:text-neutral-100">"{selectedContato?.nome}"</span>? Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-500/30 rounded-xl transition-all"
                    >
                      Sim, Excluir
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  {/* Nome */}
                  <div>
                    <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">
                      Nome Completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500">
                        <Users className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
                        placeholder="Digite o nome completo..."
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={formData.Email}
                        onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
                        placeholder="exemplo@email.com"
                      />
                    </div>
                  </div>

                  {/* Telefone com Seletor de País Premium */}
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">
                      Telefone WhatsApp
                    </label>
                    <div className="flex gap-2">
                      {/* Seletor de País Customizado */}
                      <div className="relative" ref={countryDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          className="h-[52px] w-[120px] pl-3 pr-10 py-3 flex items-center gap-2 border border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-neutral-100 font-semibold bg-gradient-to-br from-gray-50 to-white dark:from-neutral-700 dark:to-neutral-700 cursor-pointer hover:border-gray-300 dark:hover:border-neutral-500"
                        >
                          <span className="text-2xl">{selectedCountry.flag}</span>
                          <span className="text-sm">{selectedCountry.code}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-neutral-400 absolute right-3 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCountryDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-[240px] bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl shadow-lg z-50 max-h-[300px] overflow-y-auto">
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
                                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-neutral-600 transition-colors text-left ${
                                  countryCode === country.code ? 'bg-blue-50 dark:bg-neutral-600' : ''
                                }`}
                              >
                                <span className="text-2xl">{country.flag}</span>
                                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-neutral-100">{country.name}</span>
                                <span className="text-sm text-gray-600 dark:text-neutral-400">{country.code}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Campo de Número */}
                      <div className="flex-1 relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-neutral-500">
                          <Phone className="w-5 h-5" />
                        </div>
                        <input
                          type="tel"
                          id="telefone"
                          value={phoneNumber}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            // Limita o comprimento baseado no país
                            const maxLength = countryCode === '+55' ? 11 : 15;
                            if (raw.length <= maxLength) {
                              setPhoneNumber(raw);
                              // Combina código do país (sem +) com o número
                              const fullNumber = countryCode.replace('+', '') + raw;
                              setFormData({ ...formData, telefone: fullNumber });
                            }
                          }}
                          onFocus={() => {
                            // Quando focar, extrair apenas o número sem o código do país
                            const currentPhone = formData.telefone || '';
                            const codeDigits = countryCode.replace('+', '');
                            if (currentPhone.startsWith(codeDigits)) {
                              const phoneOnly = currentPhone.substring(codeDigits.length);
                              setPhoneNumber(phoneOnly);
                            }
                          }}
                          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 font-medium"
                          placeholder={countryCode === '+55' ? '11999999999' : 'Número do telefone'}
                        />
                      </div>
                    </div>

                    {/* Dica Visual Melhorada */}
                    <div className="mt-2 flex items-start gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-3">
                      <div className="mt-0.5">
                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                          Importante: Sempre inclua o código do país!
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          {countryCode === '+55'
                            ? 'Exemplo: +55 11 99999-9999 → Digite apenas: 11999999999'
                            : `Exemplo: ${countryCode} + seu número local completo`
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100 dark:border-neutral-700">
                    {selectedContato && (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir</span>
                      </button>
                    )}
                    <div className="flex gap-3 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          resetForm();
                        }}
                        className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-neutral-200 border border-gray-200 dark:border-neutral-600 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 dark:bg-neutral-700 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Salvar Contato</span>
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


        {/* Modal de Importação Premium */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Importar Contatos"
        >
          <div className="p-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-5 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Formato do Arquivo CSV
              </h4>
              <p className="text-sm text-gray-700 dark:text-neutral-300 mb-3">
                Prepare um arquivo CSV com as seguintes colunas:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-neutral-100">nome</span>
                  <span className="text-gray-600 dark:text-neutral-400">(obrigatório)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-neutral-100">email</span>
                  <span className="text-gray-600 dark:text-neutral-400">(opcional)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full"></div>
                  <span className="font-medium text-gray-900 dark:text-neutral-100">telefone</span>
                  <span className="text-gray-600 dark:text-neutral-400">(opcional)</span>
                </div>
              </div>
            </div>

            <div className="relative border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-2xl p-8 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group">
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
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-blue-600 dark:bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <span className="text-base font-medium text-gray-900 dark:text-neutral-100 mb-1">
                  Selecione um arquivo CSV
                </span>
                <span className="text-sm text-gray-500 dark:text-neutral-400">
                  ou arraste e solte aqui
                </span>
                <span className="text-xs text-gray-400 dark:text-neutral-500 mt-2">
                  Usar vírgula (,) como separador
                </span>
              </label>
            </div>

            {uploadError && (
              <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 text-red-700 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{uploadError}</span>
              </div>
            )}

            {uploading && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="font-medium text-gray-700 dark:text-neutral-200">Processando arquivo...</span>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
