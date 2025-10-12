import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Loader2, AlertCircle, ChevronDown, Plus, RefreshCw, Search, Calendar, Tags, X } from 'lucide-react';
import type { Funil } from '../types/funil';
import type { Fonte } from '../types/fonte';
import type { Contato } from '../types/contato';
import type { Deal } from '../types/deal';
import type { Anuncio } from '../types/anuncio';
import { useNavigate } from 'react-router-dom';
import EmptyFunnelState from '../components/crm/EmptyFunnelState';
import CreateDealPanel from '../components/crm/CreateDealPanel';
import KanbanBoard from '../components/crm/KanbanBoard';
import ListView from '../components/crm/ListView';
import ViewToggle from '../components/crm/ViewToggle';
import TagFilter from '../components/crm/TagFilter';
import SearchableSelect from '../components/crm/SearchableSelect';
import AnuncioCard from '../components/crm/AnuncioCard';
import Modal from '../components/Modal';
import FilterDropdown from '../components/FilterDropdown';
import { hasPermission } from '../utils/permissions';

type ViewMode = 'kanban' | 'list';
export default function CRM() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [fontes, setFontes] = useState<Fonte[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedFunil, setSelectedFunil] = useState<Funil | null>(null);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const canEditCRM = hasPermission('can_edit_crm');
  const [users, setUsers] = useState<{ id: number; nome: string }[]>([]);
  const [tags, setTags] = useState<import('../types/tag').Tag[]>([]);
  const [tagsMap, setTagsMap] = useState<Record<number, import('../types/tag').Tag[]>>({});
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedFonteId, setSelectedFonteId] = useState<number | null>(null);
  const [selectedAnuncioId, setSelectedAnuncioId] = useState<number | null>(null);
  const [showAnuncioModal, setShowAnuncioModal] = useState(false);

  // Refs para os botões de filtro
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);
  const tagFilterButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', {
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  fetchUsers();
}, []);

  const fetchTagsData = async () => {
  try {
    const [tagsRes, assocRes] = await Promise.all([
      fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', {
        headers: { token }
      }),
      fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/list', {
        headers: { token }
      })
    ]);
    
    const tagsData = tagsRes.ok ? await tagsRes.json() : [];
    const assocData = assocRes.ok ? await assocRes.json() : [];

    const tagsList = Array.isArray(tagsData) ? tagsData : [];
    setTags(tagsList);

    const map: Record<number, import('../types/tag').Tag[]> = {};
    const associations = Array.isArray(assocData) ? assocData : [];
    
    associations.forEach((rel: { id_negociacao: number | number[]; id_tag: number }) => {
      
      // O retorno da API mostra que id_negociacao é um array
      const negociacaoIds = Array.isArray(rel.id_negociacao) ? rel.id_negociacao : [rel.id_negociacao];
      const tagId = rel.id_tag;
      
      const tag = tagsList.find(t => t.Id === tagId);
      
      if (tag) {
        negociacaoIds.forEach(negId => {
          if (!map[negId]) map[negId] = [];
          if (!map[negId].some(t => t.Id === tag.Id)) {
            map[negId].push(tag);
          }
        });
      }
    });

    setTagsMap(map);
  } catch (err) {
    console.error('Erro ao carregar tags:', err);
  }
};

useEffect(() => {
  fetchTagsData();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'tags_updated') {
      fetchTagsData();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}, []);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const tagCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    deals.forEach(deal => {
      (tagsMap[deal.Id] || []).forEach(tag => {
        counts[tag.Id] = (counts[tag.Id] || 0) + 1;
      });
    });
    return counts;
  }, [deals, tagsMap]);

  const fonteOptions = useMemo(
    () => [
      { id: 0, label: 'Todas as fontes' },
      ...fontes.map(f => ({ id: f.Id, label: f.source ? `${f.nome} (${f.source})` : f.nome }))
    ],
    [fontes]
  );

  const anuncioOptions = useMemo(
    () => [{ id: 0, label: 'Todos os anúncios' }, ...anuncios.map(a => ({ id: a.Id, label: a.title }))],
    [anuncios]
  );

  const selectedAnuncio = useMemo(
    () => anuncios.find(a => a.Id === selectedAnuncioId) || null,
    [anuncios, selectedAnuncioId]
  );

  useEffect(() => {
    if (selectedFunil) {
      setCurrentPage(1);
      setDeals([]);
      fetchDeals(1);
    }
  }, [selectedFunil, itemsPerPage]);

  const fetchInitialData = async () => {
    try {
      const [funisResponse, fontesResponse, contatosResponse, anunciosResponse] = await Promise.all([
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/fonte/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/contato/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/anuncio/get', {
          headers: { token }
        })
      ]);

      const [funisData, fontesData, contatosData, anunciosData] = await Promise.all([
        funisResponse.json(),
        fontesResponse.json(),
        contatosResponse.json(),
        anunciosResponse.json()
      ]);

      const validFunis = Array.isArray(funisData) ? funisData : [];
      const validFontes = Array.isArray(fontesData) ? fontesData : [];
      const validContatos = Array.isArray(contatosData) ? contatosData : [];
      const validAnuncios = Array.isArray(anunciosData) ? anunciosData : [];

      setFunis(validFunis);
      setFontes(validFontes);
      setContatos(validContatos);
      setAnuncios(validAnuncios);

      if (validFunis.length > 0 && !selectedFunil) {
        setSelectedFunil(validFunis[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

const fetchDeals = async (page: number) => {
  if (!selectedFunil) return;

  try {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    // 🔹 Busca negociações do funil selecionado
    const responseFunil = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify({
        page,
        offset: itemsPerPage,
        id_funil: selectedFunil.id
      })
    });

    // 🔹 Busca negociações sem funil (para "Sem status")
    const responseSemFunil = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify({
        page,
        offset: itemsPerPage,
        id_funil: null
      })
    });

    if (!responseFunil.ok || !responseSemFunil.ok) {
      throw new Error('Erro ao carregar negociações');
    }

    const dataFunil = await responseFunil.json();
    const dataSemFunil = await responseSemFunil.json();

// 🔹 Junta os dois resultados, mas remove duplicados pelo ID
const allDealsRaw = [
  ...(Array.isArray(dataFunil) ? dataFunil : []),
  ...(Array.isArray(dataSemFunil) ? dataSemFunil : []),
];

// 🔹 Cria um mapa para remover duplicados com base no ID da negociação
const uniqueDealsMap = new Map<number, any>();
for (const d of allDealsRaw) {
  if (!uniqueDealsMap.has(d.Id)) {
    uniqueDealsMap.set(d.Id, d);
  }
}
const allDeals = Array.from(uniqueDealsMap.values());

console.log("📊 Negociações únicas (sem duplicatas):", allDeals);


    console.log("📊 Todas as negociações (com e sem funil):", allDeals);

    // Mapeia contatos com base nos contatos já carregados
    const dealsWithContacts = allDeals.map(deal => {
      const contact = contatos.find(c => c.Id === deal.id_contato);
      return {
        ...deal,
        contato: contact || null
      };
    });

    // Atualiza o estado de deals
    setDeals(page === 1 ? dealsWithContacts : [...deals, ...dealsWithContacts]);
    setHasMore(page * itemsPerPage < allDeals.length);

  } catch (err) {
    console.error('Erro ao carregar negociações:', err);
    setError('Erro ao carregar negociações');
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
};


  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchDeals(nextPage);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInitialData();
      if (selectedFunil) {
        setCurrentPage(1);
        await fetchDeals(1);
      }
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
      setError('Erro ao atualizar dados');
      setTimeout(() => setError(null), 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const deal = deals.find(d => d.Id.toString() === draggableId);
    if (!deal || !selectedFunil) return;

    // Optimistically update the UI
    setDeals(prevDeals => prevDeals.map(d => 
      d.Id === deal.Id 
        ? { ...d, id_estagio: parseInt(destination.droppableId) }
        : d
    ));

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/update/stage', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({
          Id: deal.Id,
          id_estagio: parseInt(destination.droppableId)
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar negociação');
      }

    } catch (err) {
      console.error('Erro ao mover negociação:', err);
      setError('Erro ao mover negociação');
      setTimeout(() => setError(null), 3000);
      
      // Revert the UI if the API call fails
      setDeals(prevDeals => prevDeals.map(d => 
        d.Id === deal.Id 
          ? { ...d, id_estagio: parseInt(source.droppableId) }
          : d
      ));
    }
  };

const handleCreateDeal = async (dealData: Record<string, unknown>) => {
  try {
    // Cria o payload com os dados recebidos do formulário
    const payload = { ...dealData };

    // 🧩 Garante que novos leads sem funil/estágio caiam em "Sem status"
    if (!payload.id_funil) {
      payload.id_funil = null;
    }
    if (!payload.id_estagio) {
      payload.id_estagio = null;
    }

    // Remove campos opcionais vazios
    if (!payload.id_fonte) delete payload.id_fonte;
    if (!payload.id_usuario) delete payload.id_usuario;

    // Envia a requisição para criar o lead/negociação
    const response = await fetch(
      'https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao criar negociação');
    }

    // Atualiza o CRM após criar o lead
    setCurrentPage(1);
    await fetchDeals(1);
  } catch (err) {
    console.error('Erro ao criar negociação:', err);
    throw new Error('Erro ao criar negociação');
  }
};


  const handleCreateContact = async (
    contactData: { nome: string; Email: string; telefone: string }
  ): Promise<number | null> => {
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/contato/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify(contactData)
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao criar contato');
      }

      let newId: number | null = null;
      try {
        const created = await response.json();
        if (created) {
          newId = created.Id ?? created.id ?? null;
        }
      } catch (err) {
        console.error('Erro ao ler resposta de contato:', err);
      }

      const contatosResponse = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/contato/get',
        {
          headers: { token }
        }
      );

      if (contatosResponse.ok) {
        const data = await contatosResponse.json();
        const contacts = Array.isArray(data) ? data : [];
        setContatos(contacts);
        if (!newId) {
          const found = contacts.find(
            (c: Contato) =>
              c.nome === contactData.nome &&
              c.Email === contactData.Email &&
              c.telefone === contactData.telefone
          );
          if (found) newId = found.Id;
        }
      }

      return newId;
    } catch (err) {
      console.error('Erro ao criar contato:', err);
      throw new Error('Erro ao criar contato');
    }
  };

  const handleDeleteDeal = async (deal: Deal) => {
    try {
      const response = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/delete?id=${deal.Id}`, {
        method: 'DELETE',
        headers: { token }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir negociação');
      }

      setDeals(prevDeals => prevDeals.filter(d => d.Id !== deal.Id));
    } catch (err) {
      console.error('Erro ao excluir negociação:', err);
      setError('Erro ao excluir negociação');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleBulkDelete = async (dealsToDelete: Deal[]) => {
    try {
      await Promise.all(
        dealsToDelete.map(deal =>
          fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/delete?id=${deal.Id}`, {
            method: 'DELETE',
            headers: { token }
          })
        )
      );

      setDeals(prevDeals => 
        prevDeals.filter(deal => !dealsToDelete.some(d => d.Id === deal.Id))
      );
    } catch (err) {
      console.error('Erro ao excluir negociações:', err);
      setError('Erro ao excluir negociações');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filterDeals = (deals: Deal[]) => {
    const filtered = deals.filter(deal => {
      const matchesSearch =
        searchTerm === '' ||
        deal.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (deal.contato?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDate = true;
      const dealDate = new Date(deal.CreatedAt);
      if (startDate) {
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const start = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        matchesDate = dealDate >= start;
      }
      if (matchesDate && endDate) {
        const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
        const end = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
        matchesDate = dealDate <= end;
      }

      const matchesTags =
        selectedTagIds.length === 0 ||
        (tagsMap[deal.Id] || []).some(tag => selectedTagIds.includes(tag.Id));

      const matchesFonte =
        selectedFonteId === null || deal.id_fonte === selectedFonteId;
      const matchesAnuncio =
        selectedAnuncioId === null || deal.id_anuncio === selectedAnuncioId;

      return matchesSearch && matchesDate && matchesTags && matchesFonte && matchesAnuncio;
    });

    return filtered.sort((a, b) => {
      const dateA = a.UpdatedAt ? new Date(a.UpdatedAt) : new Date(a.CreatedAt);
      const dateB = b.UpdatedAt ? new Date(b.UpdatedAt) : new Date(b.CreatedAt);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const filteredDeals = filterDeals(deals);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-600">
        <AlertCircle className="w-8 h-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 min-h-screen">
      <div className="px-6 py-6">
        {/* Header Premium */}
        <div className="flex-none pb-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  CRM
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Gerencie suas negociações</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="ml-2 p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50 border border-gray-200"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={selectedFunil?.id || ''}
                  onChange={(e) => {
                    const funil = funis.find(f => f.id === Number(e.target.value));
                    setSelectedFunil(funil || null);
                  }}
                  className="appearance-none bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl px-5 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-w-[220px] font-semibold text-gray-900 cursor-pointer hover:border-gray-300 transition-all"
                >
                  <option value="">Selecione um funil</option>
                  {funis.map((funil) => (
                    <option key={funil.id} value={funil.id}>
                      {funil.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none w-5 h-5" />
              </div>

              <ViewToggle view={viewMode} onViewChange={setViewMode} />

              {canEditCRM && (
                <button
                  onClick={() => setIsCreatePanelOpen(true)}
                  className="group relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Plus className="relative w-5 h-5" />
                  <span className="relative">Nova Negociação</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros Premium */}
          <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Busca */}
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por título ou contato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400 text-sm font-medium"
                />
              </div>

              {/* Filtro de Data */}
              <div>
                <button
                  ref={dateFilterButtonRef}
                  type="button"
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={`w-full flex items-center justify-between pl-3.5 pr-4 py-2.5 bg-white border-2 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 transition-all ${
                    startDate || endDate ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2 flex-1 min-w-0">
                    <Calendar className={`w-5 h-5 flex-shrink-0 ${startDate || endDate ? 'text-blue-600' : 'text-gray-500'}`} />
                    {startDate || endDate ? (
                      <span className="text-gray-900 text-xs truncate">
                        {startDate ? new Date(startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '...'}
                        {' - '}
                        {endDate ? new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '...'}
                      </span>
                    ) : (
                      <span className="text-gray-600">Filtrar datas</span>
                    )}
                  </span>
                  {(startDate || endDate) ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>

                <FilterDropdown
                  isOpen={showDateFilter}
                  onClose={() => setShowDateFilter(false)}
                  triggerRef={dateFilterButtonRef}
                >
                  <div className="p-5 w-72">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Data Final
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setShowDateFilter(false);
                          }}
                          className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          Limpar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDateFilter(false)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:shadow-lg transition-all"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                </FilterDropdown>
              </div>

              {/* Filtro de Tags */}
              <div>
                <button
                  ref={tagFilterButtonRef}
                  type="button"
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 transition-all ${
                    selectedTagIds.length > 0 ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Tags className={`w-5 h-5 ${selectedTagIds.length > 0 ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-gray-600">Tags</span>
                    {selectedTagIds.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {selectedTagIds.length}
                      </span>
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                <FilterDropdown
                  isOpen={showTagFilter}
                  onClose={() => setShowTagFilter(false)}
                  triggerRef={tagFilterButtonRef}
                >
                  <div className="p-3 w-72 max-h-80 overflow-y-auto">
                    <TagFilter
                      tags={tags}
                      counts={tagCounts}
                      selected={selectedTagIds}
                      onChange={setSelectedTagIds}
                    />
                  </div>
                </FilterDropdown>
              </div>

              {/* Fontes */}
              <SearchableSelect
                options={fonteOptions}
                value={selectedFonteId}
                onChange={(id) => setSelectedFonteId(id === 0 ? null : id)}
                placeholder="Fontes"
              />

              {/* Anúncios */}
              <SearchableSelect
                options={anuncioOptions}
                value={selectedAnuncioId}
                onChange={(id) => setSelectedAnuncioId(id === 0 ? null : id)}
                placeholder="Anúncios"
                footerLabel="Ver anúncios"
                onFooterClick={() => setShowAnuncioModal(true)}
              />
            </div>

            {/* Card do Anúncio Selecionado */}
            {selectedAnuncio && (
              <div className="mt-4">
                <AnuncioCard anuncio={selectedAnuncio} />
              </div>
            )}
          </div>

          {/* Modal de Anúncios */}
          <Modal
            isOpen={showAnuncioModal}
            onClose={() => setShowAnuncioModal(false)}
            title="Anúncios"
            maxWidth="3xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {anuncios.map(anuncio => (
                <AnuncioCard key={anuncio.Id} anuncio={anuncio} />
              ))}
            </div>
          </Modal>
        </div>

        <div className="flex-1">
          {selectedFunil?.estagios && selectedFunil.estagios.length > 0 ? (
            viewMode === 'kanban' ? (
<div className="w-[75vw] h-full border border-dashed border-dark rounded-xl p-4 shadow-sm">
  <DragDropContext onDragEnd={handleDragEnd}>
                  <KanbanBoard
                    funil={selectedFunil}
                    deals={filteredDeals}
                    formatDate={formatDate}
                    onDealClick={(deal) => navigate(`/crm/${deal.Id}`)}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    canEdit={canEditCRM}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    users={users}
                    tagsMap={tagsMap}
                  />
                </DragDropContext>
              </div>
            ) : (
              <div className="h-full">
                <ListView
                  deals={filteredDeals}
                  funil={selectedFunil}
                  formatDate={formatDate}
                  onDealClick={(deal) => navigate(`/crm/${deal.Id}`)}
                  onDeleteDeal={handleDeleteDeal}
                  onBulkDelete={handleBulkDelete}
                  onUpdateDeals={setDeals}
                  canEdit={canEditCRM}
                  hasMore={hasMore}
                  onLoadMore={handleLoadMore}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )
          ) : (
            <EmptyFunnelState />
          )}
        </div>

        <CreateDealPanel
          isOpen={isCreatePanelOpen}
          onClose={() => setIsCreatePanelOpen(false)}
          funis={funis}
          fontes={fontes}
          contatos={contatos}
          users={users}
          onCreateDeal={handleCreateDeal}
          onCreateContact={handleCreateContact}
        />
      </div>
    </div>
  );
}