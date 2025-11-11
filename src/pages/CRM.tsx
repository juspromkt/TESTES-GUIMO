import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { Loader2, AlertCircle, ChevronDown, Plus, RefreshCw, Search, Calendar, Tags, X, Play, UserCircle2 } from 'lucide-react';
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
import AnuncioModal from '../components/crm/AnuncioModal';
import Modal from '../components/Modal';
import FilterDropdown from '../components/FilterDropdown';
import DealDetailsPanel from '../components/crm/DealDetailsPanel';
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
  const [selectedAnuncioForModal, setSelectedAnuncioForModal] = useState<Anuncio | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [isDealPanelOpen, setIsDealPanelOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [showFunilFilter, setShowFunilFilter] = useState(false);
  const [showFonteFilter, setShowFonteFilter] = useState(false);

  // Departamentos (apenas para exibição, sem filtro)
  const [departamentosMap, setDepartamentosMap] = useState<Record<number, import('../types/departamento').Departamento[]>>({});

  // Refs para os botões de filtro
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null);
  const tagFilterButtonRef = useRef<HTMLButtonElement>(null);
  const userFilterButtonRef = useRef<HTMLButtonElement>(null);
  const funilFilterButtonRef = useRef<HTMLButtonElement>(null);
  const fonteFilterButtonRef = useRef<HTMLButtonElement>(null);

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

  // Carrega departamentos apenas para exibição (sem filtro)
  const fetchDepartamentosData = async () => {
    try {
      const { isDepartamento } = await import('../types/departamento');
      const [deptsRes, assocRes] = await Promise.all([
        fetch('https://n8n.lumendigital.com.br/webhook/produtos/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/produtos/lead/get', {
          headers: { token }
        })
      ]);

      const deptsData = deptsRes.ok ? await deptsRes.json() : [];
      const assocData = assocRes.ok ? await assocRes.json() : [];

      const deptsList = Array.isArray(deptsData) ? deptsData.filter(isDepartamento) : [];
      const map: Record<number, import('../types/departamento').Departamento[]> = {};
      const associations = Array.isArray(assocData) ? assocData : [];

      associations.forEach((rel: { id_negociacao: number; id_produto: number }) => {
        const negociacaoId = rel.id_negociacao;
        const produtoId = rel.id_produto;
        const dept = deptsList.find(d => d.Id === produtoId);

        if (dept) {
          if (!map[negociacaoId]) map[negociacaoId] = [];
          if (!map[negociacaoId].some(d => d.Id === dept.Id)) {
            map[negociacaoId].push(dept);
          }
        }
      });

      setDepartamentosMap(map);
    } catch (err) {
      console.error('Erro ao carregar departamentos:', err);
    }
  };

  useEffect(() => {
    fetchDepartamentosData();
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
  }, [selectedFunil]);

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

      // Corrigir/gerar thumbnailUrl para cada anúncio
      const anunciosCorrigidos = validAnuncios.map((anuncio: any) => {
        let thumbnailUrl = anuncio.thumbnailUrl;

        // Se não existir thumbnail, tenta gerar a partir do mediaUrl
        if (!thumbnailUrl && anuncio.mediaUrl) {
          const idRegex = /(\d{10,})/;
          const match = anuncio.mediaUrl.match(idRegex);

          if (match) {
            // Gera uma URL pública e estável do Facebook Ads
            thumbnailUrl = `https://www.facebook.com/ads/image/?d=AQ${match[1]}`;
            console.log(`Thumbnail gerada para anúncio "${anuncio.title}":`, thumbnailUrl);
          }
        }

        return { ...anuncio, thumbnailUrl };
      });

      setFunis(validFunis);
      setFontes(validFontes);
      setContatos(validContatos);
      setAnuncios(anunciosCorrigidos);

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

    // Sempre busca todos os deals disponíveis
    // O itemsPerPage será aplicado por estágio no KanbanBoard
    const offset = 999;

    // Busca negociações do funil selecionado
    const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/negociacao/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token
      },
      body: JSON.stringify({
        page,
        offset: offset,
        id_funil: selectedFunil.id
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar negociações');
    }

    const data = await response.json();
    const allDeals = Array.isArray(data) ? data : [];

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
          body: JSON.stringify({
            ...contactData,
            createdAt: new Date().toISOString(),
          })
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
      const matchesUser =
        selectedUserIds.length === 0 || (deal.id_usuario !== null && selectedUserIds.includes(deal.id_usuario));

      return matchesSearch && matchesDate && matchesTags && matchesFonte && matchesAnuncio && matchesUser;
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
    <>
      <style>{`
        /* Estilos para o dropdown do select no dark mode */
        .dark select {
          background-color: #111827 !important;
          color: #f5f5f5 !important;
        }

        .dark select option {
          background-color: #111827 !important;
          color: #f5f5f5 !important;
          padding: 8px !important;
        }

        .dark select option:checked,
        .dark select option:hover {
          background-color: #3b82f6 !important;
          color: white !important;
        }
      `}</style>

      <div className="w-full overflow-x-hidden bg-gray-50 dark:bg-gray-900 h-full flex flex-col transition-theme">
        {/* Header Ultra-Compacto - Tudo numa linha */}
        <div className="flex-none bg-white dark:bg-gray-900 px-3 py-1.5">
          <div className="flex items-center justify-center gap-2">
            {/* Controles principais */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro de Funil - Compacto */}
              <button
                ref={funilFilterButtonRef}
                type="button"
                onClick={() => setShowFunilFilter(!showFunilFilter)}
                className={`flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-900 border rounded text-sm focus:ring-1 focus:ring-blue-500 transition-colors ${
                  selectedFunil ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <span className={`text-xs font-medium ${selectedFunil ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {selectedFunil ? selectedFunil.nome : 'Funil'}
                </span>
                {selectedFunil && (
                  <X
                    className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFunil(null);
                    }}
                  />
                )}
              </button>

              {/* View Toggle - Compacto */}
              <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-900 p-0.5 rounded">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-2 py-0.5 rounded transition-colors text-xs font-medium ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-0.5 rounded transition-colors text-xs font-medium ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Lista
                </button>
              </div>

              <div className="h-3 w-px bg-gray-300 dark:bg-gray-700"></div>

              {/* Filtros compactos */}
              <div className="flex items-center gap-1.5 flex-1">
              {/* Busca - Expandida */}
              <div className="relative" style={{ minWidth: '400px' }}>
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Buscar por título ou contato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500 text-sm text-gray-900 dark:text-white"
                />
              </div>

              {/* Filtro de Data */}
              <button
                ref={dateFilterButtonRef}
                type="button"
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`inline-flex h-8 items-center gap-1.5 px-2.5 rounded-lg border transition-colors ${
                  startDate || endDate
                    ? 'border-blue-300 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Filtrar por data"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Período</span>
              </button>

              {/* Filtro de Etiquetas */}
              <button
                ref={tagFilterButtonRef}
                type="button"
                onClick={() => setShowTagFilter(!showTagFilter)}
                className={`inline-flex h-8 items-center gap-1.5 px-2.5 rounded-lg border transition-colors relative ${
                  selectedTagIds.length > 0
                    ? 'border-purple-300 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Filtrar por etiquetas"
              >
                <Tags className="w-4 h-4" />
                <span className="text-xs font-medium">Etiquetas</span>
                {selectedTagIds.length > 0 && (
                  <span className="ml-0.5 px-1.5 min-w-[18px] h-[18px] bg-purple-600 dark:bg-purple-500 text-white rounded-full text-[10px] font-semibold flex items-center justify-center">
                    {selectedTagIds.length}
                  </span>
                )}
              </button>

              {/* Filtro de Usuário */}
              <button
                ref={userFilterButtonRef}
                type="button"
                onClick={() => setShowUserFilter(!showUserFilter)}
                className={`inline-flex h-8 items-center gap-1.5 px-2.5 rounded-lg border transition-colors relative ${
                  selectedUserIds.length > 0
                    ? 'border-blue-300 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Filtrar por responsável"
              >
                <UserCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Responsável</span>
                {selectedUserIds.length > 0 && (
                  <span className="ml-0.5 px-1.5 min-w-[18px] h-[18px] bg-blue-600 dark:bg-blue-500 text-white rounded-full text-[10px] font-semibold flex items-center justify-center">
                    {selectedUserIds.length}
                  </span>
                )}
              </button>

              {/* Filtro de Fontes */}
              <button
                ref={fonteFilterButtonRef}
                type="button"
                onClick={() => setShowFonteFilter(!showFonteFilter)}
                className={`inline-flex h-8 items-center gap-1.5 px-2.5 rounded-lg border transition-colors ${
                  selectedFonteId !== null
                    ? 'border-emerald-300 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title="Filtrar por fonte"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-xs font-medium">Fontes</span>
              </button>

              {/* Botão Anúncios - Compacto */}
              <button
                onClick={() => setShowAnuncioModal(true)}
                className="px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-1"
                title="Ver anúncios"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Anúncios</span>
              </button>
              </div>
            </div>

            {/* Botões da Direita */}
            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Botão Nova Negociação */}
              {canEditCRM && (
                <button
                  onClick={() => setIsCreatePanelOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Área de Conteúdo - Ocupa altura restante */}
        <div className="flex-1 overflow-hidden p-3">
          {selectedFunil?.estagios && selectedFunil.estagios.length > 0 ? (
            viewMode === 'kanban' ? (
              <div className="h-full overflow-hidden">
                <DragDropContext onDragEnd={handleDragEnd}>
                  <KanbanBoard
                    funil={selectedFunil}
                    deals={filteredDeals}
                    formatDate={formatDate}
                    onDealClick={(deal) => {
                      setSelectedDealId(deal.Id);
                      setIsDealPanelOpen(true);
                    }}
                    hasMore={hasMore}
                    onLoadMore={handleLoadMore}
                    canEdit={canEditCRM}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    users={users}
                    tagsMap={tagsMap}
                    departamentosMap={departamentosMap}
                  />
                </DragDropContext>
              </div>
            ) : (
              <div className="h-full overflow-hidden">
                <ListView
                  deals={filteredDeals}
                  funil={selectedFunil}
                  formatDate={formatDate}
                  onDealClick={(deal) => {
                    setSelectedDealId(deal.Id);
                    setIsDealPanelOpen(true);
                  }}
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
            <div className="h-full flex items-center justify-center">
              <EmptyFunnelState />
            </div>
          )}
        </div>

        {/* Modals e Panels */}
        {/* Modal de Lista de Anúncios */}
        <Modal
          isOpen={showAnuncioModal}
          onClose={() => setShowAnuncioModal(false)}
          title="Anúncios"
          maxWidth="4xl"
        >
          <div className="p-6">
            {anuncios.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Nenhum anúncio cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {anuncios
                  .map(anuncio => ({
                    anuncio,
                    dealsCount: deals.filter(deal => deal.id_anuncio === anuncio.Id).length
                  }))
                  .sort((a, b) => b.dealsCount - a.dealsCount)
                  .map(({ anuncio, dealsCount }, index) => {
                    const isTop3 = index < 3;
                    const rankColors = [
                      'from-amber-500 to-yellow-600',
                      'from-slate-400 to-gray-500',
                      'from-orange-500 to-amber-600'
                    ];
                    const medals = ['🥇', '🥈', '🥉'];

                    return (
                      <div
                        key={anuncio.Id}
                        onClick={() => {
                          setSelectedAnuncioForModal(anuncio);
                          setShowAnuncioModal(false);
                        }}
                        className="group relative flex items-center gap-4 p-5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        {/* Gradient Border Left para Top 3 */}
                        {isTop3 && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${rankColors[index]}`} />
                        )}

                        {/* Rank Number */}
                        <div className="flex-shrink-0 w-8 text-center">
                          {isTop3 ? (
                            <span className="text-2xl">{medals[index]}</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                              #{index + 1}
                            </span>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="flex-shrink-0 w-20 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden shadow-sm">
                          {anuncio.thumbnailUrl || anuncio.mediaUrl ? (
                            <img
                              src={anuncio.thumbnailUrl || anuncio.mediaUrl}
                              alt={anuncio.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                              {anuncio.title}
                            </h3>
                            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                              anuncio.mediaType === 'VIDEO'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>
                              {anuncio.mediaType === 'VIDEO' ? 'Video' : 'Img'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {anuncio.body || 'Sem descrição'}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                            {dealsCount}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Leads
                          </p>
                        </div>

                        {/* Hover Arrow */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 -rotate-90" />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </Modal>

        {/* Modal de Detalhes do Anúncio */}
        {selectedAnuncioForModal && (() => {
          // Ordena anúncios por número de deals (ordem decrescente)
          const sortedAnuncios = [...anuncios]
            .map(anuncio => ({
              anuncio,
              dealsCount: deals.filter(deal => deal.id_anuncio === anuncio.Id).length
            }))
            .sort((a, b) => b.dealsCount - a.dealsCount)
            .map(({ anuncio }) => anuncio);

          return (
            <AnuncioModal
              anuncio={selectedAnuncioForModal}
              deals={deals}
              funil={selectedFunil}
              onClose={() => setSelectedAnuncioForModal(null)}
              onSelectAnuncio={(anuncioId) => setSelectedAnuncioId(anuncioId)}
              allAnuncios={sortedAnuncios}
              onNavigate={(anuncio) => setSelectedAnuncioForModal(anuncio)}
            />
          );
        })()}

        {/* FilterDropdowns - Renderizados como portals */}
        <FilterDropdown
          isOpen={showDateFilter}
          onClose={() => setShowDateFilter(false)}
          triggerRef={dateFilterButtonRef}
        >
          <div className="p-4 w-64">
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Data Final
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setShowDateFilter(false);
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDateFilter(false)}
                  className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </FilterDropdown>

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

        <FilterDropdown
          isOpen={showUserFilter}
          onClose={() => setShowUserFilter(false)}
          triggerRef={userFilterButtonRef}
        >
          <div className="p-3 w-64">
            {console.log('🔵 User Filter Modal Opened', {
              showUserFilter,
              selectedUserIds,
              usersCount: users.length,
              dealsCount: deals.length
            })}
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Filtrar por Responsável
                </span>
                <div className="flex gap-1.5">
                  {selectedUserIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedUserIds([])}
                      className="text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds(users.map(u => (u as any).Id || (u as any).id))}
                    className="text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Lista de usuários */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
                    Nenhum usuário disponível
                  </p>
                ) : (
                  users.map(user => {
                    // O user pode ter 'Id' ou 'id'
                    const userId = (user as any).Id || (user as any).id;
                    const isSelected = selectedUserIds.includes(userId);
                    const userDeals = deals.filter(d => d.id_usuario === userId);

                    // Debug: verificar estrutura do user
                    console.log('User object:', { user, userId, userDeals: userDeals.length });

                    return (
                      <button
                        key={userId}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          console.log('🟢 User clicked:', {
                            userId: userId,
                            userName: user.nome,
                            wasSelected: isSelected,
                            currentSelection: selectedUserIds
                          });

                          if (isSelected) {
                            const newIds = selectedUserIds.filter(id => id !== userId);
                            console.log('🔴 Removing user, new selection:', newIds);
                            setSelectedUserIds(newIds);
                          } else {
                            const newIds = [...selectedUserIds, userId];
                            console.log('🟢 Adding user, new selection:', newIds);
                            setSelectedUserIds(newIds);
                          }
                        }}
                        className={`
                          w-full flex items-center justify-between p-2 rounded-lg
                          border transition-all duration-150
                          ${isSelected
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-400'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs truncate ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                            {user.nome}
                          </span>
                        </div>
                        <span className={`
                          text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0
                          ${isSelected
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }
                        `}>
                          {userDeals.length}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </FilterDropdown>

        <FilterDropdown
          isOpen={showFunilFilter}
          onClose={() => setShowFunilFilter(false)}
          triggerRef={funilFilterButtonRef}
        >
          <div className="p-3 w-64">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Selecionar Funil
                </span>
                {selectedFunil && (
                  <button
                    type="button"
                    onClick={() => setSelectedFunil(null)}
                    className="text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Lista de funis */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {funis.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
                    Nenhum funil disponível
                  </p>
                ) : (
                  funis.map(funil => {
                    const isSelected = selectedFunil?.id === funil.id;

                    return (
                      <button
                        key={funil.id}
                        type="button"
                        onClick={() => {
                          setSelectedFunil(isSelected ? null : funil);
                          setShowFunilFilter(false);
                        }}
                        className={`
                          w-full flex items-center justify-between p-2 rounded-lg
                          border transition-all duration-150
                          ${isSelected
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <span className={`text-xs truncate ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {funil.nome}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </FilterDropdown>

        <FilterDropdown
          isOpen={showFonteFilter}
          onClose={() => setShowFonteFilter(false)}
          triggerRef={fonteFilterButtonRef}
        >
          <div className="p-3 w-64">
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Selecionar Fonte
                </span>
                {selectedFonteId !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedFonteId(null)}
                    className="text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Lista de fontes */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {fontes.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
                    Nenhuma fonte disponível
                  </p>
                ) : (
                  fontes.map(fonte => {
                    const isSelected = selectedFonteId === fonte.Id;
                    const fonteDeals = deals.filter(d => d.id_fonte === fonte.Id);

                    return (
                      <button
                        key={fonte.Id}
                        type="button"
                        onClick={() => {
                          setSelectedFonteId(isSelected ? null : fonte.Id);
                          setShowFonteFilter(false);
                        }}
                        className={`
                          w-full flex items-center justify-between p-2 rounded-lg
                          border transition-all duration-150
                          ${isSelected
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <span className={`text-xs truncate ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                          {fonte.source ? `${fonte.nome} (${fonte.source})` : fonte.nome}
                        </span>
                        <span className={`
                          text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0
                          ${isSelected
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }
                        `}>
                          {fonteDeals.length}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </FilterDropdown>

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

        {selectedDealId && (
          <DealDetailsPanel
            dealId={selectedDealId}
            isOpen={isDealPanelOpen}
            onClose={() => {
              setIsDealPanelOpen(false);
              setSelectedDealId(null);
            }}
          />
        )}
      </div>
    </>
  );
}