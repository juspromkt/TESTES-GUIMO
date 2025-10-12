import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Loader2, AlertCircle, ChevronDown, Plus, RefreshCw, Search, Calendar, Tags } from 'lucide-react';
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
    <div className="w-full overflow-x-hidden">
      <div className="px-4">
        <div className="flex-none pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={selectedFunil?.id || ''}
                  onChange={(e) => {
                    const funil = funis.find(f => f.id === Number(e.target.value));
                    setSelectedFunil(funil || null);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                >
                  <option value="">Selecione um funil</option>
                  {funis.map((funil) => (
                    <option key={funil.id} value={funil.id}>
                      {funil.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <ViewToggle view={viewMode} onViewChange={setViewMode} />
{canEditCRM && (

              <button
                onClick={() => setIsCreatePanelOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nova Negociação
              </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por título ou contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="w-full flex items-center justify-between pl-3 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  {startDate || endDate ? (
                    <span>{`${startDate || '...'} - ${endDate || '...'}`}</span>
                  ) : (
                    <span>Filtrar datas</span>
                  )}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showDateFilter && (
                <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg p-4 w-64">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm">
                      Início
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 w-full border rounded px-2 py-1"
                      />
                    </label>
                    <label className="text-sm">
                      Fim
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 w-full border rounded px-2 py-1"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setShowDateFilter(false);
                        }}
                        className="text-sm text-gray-600"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDateFilter(false)}
                        className="bg-blue-500 text-white text-sm px-2 py-1 rounded"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagFilter(!showTagFilter)}
                className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <span className="flex items-center gap-2">
                  <Tags className="w-5 h-5 text-gray-400" />
                  <span>Tags</span>
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              {showTagFilter && (
                <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg p-2 w-64 max-h-64 overflow-y-auto">
                  <TagFilter
                    tags={tags}
                    counts={tagCounts}
                    selected={selectedTagIds}
                    onChange={setSelectedTagIds}
                  />
                </div>
              )}
            </div>

            <SearchableSelect
              options={fonteOptions}
              value={selectedFonteId}
              onChange={(id) => setSelectedFonteId(id === 0 ? null : id)}
              placeholder="Fontes"
            />

            <SearchableSelect
              options={anuncioOptions}
              value={selectedAnuncioId}
              onChange={(id) => setSelectedAnuncioId(id === 0 ? null : id)}
              placeholder="Anúncios"
              footerLabel="Ver anúncios"
              onFooterClick={() => setShowAnuncioModal(true)}
            />

            {selectedAnuncio && (
              <div className="mt-4 w-full max-w-md">
                <AnuncioCard anuncio={selectedAnuncio} />
              </div>
            )}

            <Modal
              isOpen={showAnuncioModal}
              onClose={() => setShowAnuncioModal(false)}
              title="Anúncios"
              maxWidth="3xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {anuncios.map(anuncio => (
                  <AnuncioCard key={anuncio.Id} anuncio={anuncio} />
                ))}
              </div>
            </Modal>
          </div>
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