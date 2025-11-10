import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatList } from '../components/chat/ChatList';
import { MessageView } from '../components/chat/MessageView';
import { useConversation } from '../context/ConversationContext';
import { useChat } from '../context/ChatContext';
import { MultiSelectDropdown } from '../components/chat/MultiSelectDropdown';
import { NewChatModal } from '../components/chat/NewChatModal';
import { Chat as ChatType } from '../components/chat/utils/api';
import { MessageCircle, Search, Plus, Users, Tag as TagIcon, Calendar, X, Menu } from 'lucide-react';
import { setChatListLoaded } from '../utils/chatCache';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ptBR from 'date-fns/locale/pt-BR';
import { fetchWithCache, CacheTTL, CacheKeys } from '../utils/cacheManager';
import { useDebounce } from 'use-debounce';

registerLocale('pt-BR', ptBR);

const ConversasMobile = () => {
  const location = useLocation();
  const { setIsInConversation } = useConversation();
  const { selectedChat, setSelectedChat, availableTags, users, funnels } = useChat();
  const preselect = location.state as { remoteJid?: string; name?: string } | null;
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [whatsappType, setWhatsappType] = useState<string | null>(null);

  // Estados para a barra superior
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Multiple selection states
  const [selectedResponsibleIds, setSelectedResponsibleIds] = useState<number[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);

  // Data
  const usuariosPorContato = users;
  const availableFunnels = funnels;
  const [availableStages, setAvailableStages] = useState<{ id: string; nome: string; cor?: string }[]>([]);

  // Date range
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Estados de filtros
  const [iaStatusFilter, setIaStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [chatListActiveTab, setChatListActiveTab] = useState<'all' | 'ia' | 'transfers' | 'unread' | 'unanswered'>('all');
  const [filteredChatCount, setFilteredChatCount] = useState(0);

  // Contadores separados para cada filtro
  const [iaCount, setIaCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [transfersCount, setTransfersCount] = useState(0);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  // Estados para pull-to-refresh
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Força reload sempre que entrar na página - executado no mount
  useEffect(() => {
    console.log('[ConversasMobile] Montado - pathname:', location.pathname);

    // Limpa o cache e força reload
    setChatListLoaded(false);

    // Limpa chat selecionado ao entrar
    setSelectedChat(null);
    setShowMobileChat(false);
    setIsInConversation(false);

    // Dispara evento para forçar reload do ChatList
    const timer = setTimeout(() => {
      console.log('[ConversasMobile] Disparando chat_list_force_reload');
      window.dispatchEvent(new Event('chat_list_force_reload'));
    }, 150);

    return () => {
      clearTimeout(timer);
      console.log('[ConversasMobile] Desmontado');
    };
  }, []); // Dependências vazias - executa só no mount/unmount

  // Monitora mudanças de rota para recarregar quando voltar
  useEffect(() => {
    if (location.pathname === '/app/conversas') {
      console.log('[ConversasMobile] Rota /app/conversas detectada - recarregando');
      setChatListLoaded(false);
      setTimeout(() => {
        window.dispatchEvent(new Event('chat_list_force_reload'));
      }, 100);
    }
  }, [location.pathname]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = user ? JSON.parse(user).token : null;
    if (!token) return;

    fetchWithCache(
      CacheKeys.WHATSAPP_TYPE,
      async () => {
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get/tipo', {
          headers: { token }
        });
        const data = await response.json();
        const info = Array.isArray(data) ? data[0] : data;
        return info?.tipo || null;
      },
      CacheTTL.VERY_LONG
    )
      .then(tipo => setWhatsappType(tipo))
      .catch(err => {
        console.error('Erro ao buscar tipo do WhatsApp:', err);
      });
  }, []);

  useEffect(() => {
    if (preselect?.remoteJid) {
      setSelectedChat({
        id: preselect.remoteJid,
        remoteJid: preselect.remoteJid,
        pushName: preselect.name || '',
        lastMessage: {
          messageType: 'conversation',
          fromMe: false,
          conversation: '',
          messageTimestamp: Date.now(),
        },
      });
      setShowMobileChat(true);
      setIsInConversation(true);
    }
  }, [preselect, setIsInConversation]);

  // Selecionar funil padrão
  useEffect(() => {
    if (availableFunnels.length > 0 && !selectedFunnelId) {
      const funilPadrao = availableFunnels.find((f: any) => f.isFunilPadrao);
      if (funilPadrao) {
        setSelectedFunnelId(funilPadrao.id);
      }
    }
  }, [availableFunnels, selectedFunnelId]);

  // Atualizar etapas quando o funil selecionado mudar
  useEffect(() => {
    if (!selectedFunnelId || availableFunnels.length === 0) {
      setAvailableStages([]);
      setSelectedStageIds([]);
      return;
    }

    const selectedFunnel = availableFunnels.find((f: any) => f.id === selectedFunnelId);
    if (selectedFunnel && selectedFunnel.estagios) {
      const stages = selectedFunnel.estagios.map((e: any) => ({
        id: String(e.Id),
        nome: e.nome,
        cor: e.cor,
      }));
      setAvailableStages(stages);
    } else {
      setAvailableStages([]);
    }

    setSelectedStageIds([]);
  }, [selectedFunnelId, availableFunnels]);

  const handleChatSelect = (chat: ChatType) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
    setIsInConversation(true);

    // ✅ REMOVIDO force_reload - MessageView agora mantém mensagens em cache
    // Troca de chat é instantânea, sem reload desnecessário
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedChat(null);
    setIsInConversation(false);
  };

  const handleTabChange = useCallback((tab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered') => {
    setChatListActiveTab(tab);
    switch (tab) {
      case 'ia':
        setIaStatusFilter('active');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
        break;
      case 'transfers':
        setIaStatusFilter('all');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
        break;
      case 'unread':
        setIaStatusFilter('all');
        setShowOnlyUnread(true);
        setShowUnanswered(false);
        break;
      case 'unanswered':
        setIaStatusFilter('all');
        setShowOnlyUnread(false);
        setShowUnanswered(true);
        break;
      default:
        setIaStatusFilter('all');
        setShowOnlyUnread(false);
        setShowUnanswered(false);
    }
  }, []);

  const handleCategoryCountsChange = useCallback((counts: { ia: number; unread: number; unanswered: number; transfers: number }) => {
    setIaCount(counts.ia);
    setUnreadCount(counts.unread);
    setUnansweredCount(counts.unanswered);
    setTransfersCount(counts.transfers);
  }, []);

  // Funções para pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStartY;

    if (distance > 0) {
      setPullDistance(Math.min(distance, 120));
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;

    if (pullDistance > 80 && !isRefreshing) {
      setIsRefreshing(true);

      // Força reload do ChatList
      setChatListLoaded(false);
      window.dispatchEvent(new Event('chat_list_force_reload'));

      // Simula tempo de carregamento
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }

    setIsPulling(false);
  };

  const handleNewChatSuccess = async (remoteJid: string, name: string) => {
    const user = localStorage.getItem('user');
    const token = user ? JSON.parse(user).token : null;

    if (!token) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    try {
      const telefone = remoteJid.replace(/\D/g, '');

      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/contato/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', token },
          body: JSON.stringify({
            nome: name,
            telefone,
            createdAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error('Erro ao criar contato');

      const data = await response.json();
      const contactId = data?.Id || data?.id || data?.contactId || data?.[0]?.Id || null;

      const newContact = {
        id: remoteJid,
        remoteJid,
        contactId,
        pushName: name,
        telefone,
        profilePicUrl: null,
      };

      const existingCache = localStorage.getItem('contacts_cache');
      const parsedCache = existingCache ? JSON.parse(existingCache) : {};
      parsedCache[remoteJid] = newContact;
      localStorage.setItem('contacts_cache', JSON.stringify(parsedCache));

      window.dispatchEvent(new Event('contacts_updated'));

      const newChat: ChatType = {
        id: remoteJid,
        remoteJid,
        contactId,
        pushName: name,
        lastMessage: {
          messageType: 'conversation',
          fromMe: false,
          conversation: '',
          messageTimestamp: Math.floor(Date.now() / 1000),
        },
      };

      setSelectedChat(newChat);
      setShowMobileChat(true);
      setIsInConversation(true);

      console.log('✅ Contato criado e sincronizado com ChatList:', newContact);
    } catch (err) {
      console.error('❌ Erro ao criar nova conversa:', err);
      alert('Erro ao criar contato. Verifique o número e tente novamente.');
    }
  };

  // Filtros rápidos de data
  const setToday = () => {
    const t = new Date();
    setStartDate(t);
    setEndDate(t);
  };
  const setLast7 = () => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - 7);
    setStartDate(s);
    setEndDate(e);
  };
  const setLast30 = () => {
    const e = new Date();
    const s = new Date();
    s.setDate(s.getDate() - 30);
    setStartDate(s);
    setEndDate(e);
  };
  const setThisMonth = () => {
    const n = new Date();
    const s = new Date(n.getFullYear(), n.getMonth(), 1);
    const e = new Date(n.getFullYear(), n.getMonth() + 1, 0);
    setStartDate(s);
    setEndDate(e);
  };
  const setLastMonth = () => {
    const n = new Date();
    const s = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    const e = new Date(n.getFullYear(), n.getMonth(), 0);
    setStartDate(s);
    setEndDate(e);
  };

  const hasActiveFilters =
    selectedResponsibleIds.length > 0 ||
    selectedTagIds.length > 0 ||
    startDate !== null ||
    endDate !== null;

  const activeFiltersCount =
    selectedResponsibleIds.length +
    selectedTagIds.length +
    (startDate !== null ? 1 : 0);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      {!showMobileChat && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversas</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFiltersModal(true)}
                className={`p-2.5 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all ${
                  hasActiveFilters
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={() => setNewChatModalOpen(true)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barra de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Chat List ou Message View */}
      <div className="flex-1 overflow-hidden relative">
        {/* Indicador de pull-to-refresh */}
        {!showMobileChat && (isPulling || isRefreshing) && (
              <div
                className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
                style={{
                  top: `${Math.max(0, pullDistance * 0.5 - 50)}px`,
                  opacity: Math.min(pullDistance / 80, 1)
                }}
              >
                <div className="flex flex-col items-center gap-1 bg-white dark:bg-gray-900 rounded-full px-4 py-2 shadow-lg">
                  <div className={`${isRefreshing ? 'animate-spin' : ''}`}>
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {isRefreshing ? 'Atualizando...' : 'Solte para atualizar'}
                  </span>
                </div>
              </div>
        )}

        {!showMobileChat ? (
          <div
            className="h-full overflow-y-auto bg-white dark:bg-gray-900"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: `translateY(${pullDistance * 0.5}px)`,
              transition: isPulling ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <ChatList
              onChatSelect={handleChatSelect}
              selectedChatId={selectedChat?.id}
              whatsappType={whatsappType || undefined}
              externalSearchTerm={debouncedSearchTerm}
              externalUsuarioFiltroIds={selectedResponsibleIds}
              externalTagFiltroIds={selectedTagIds}
              externalFunilId={selectedFunnelId}
              externalStageFiltroIds={selectedStageIds}
              externalStartDate={startDate}
              externalEndDate={endDate}
              externalIaStatusFilter={iaStatusFilter}
              externalShowOnlyUnread={showOnlyUnread}
              externalShowUnanswered={showUnanswered}
              externalActiveTab={chatListActiveTab}
              externalHandleTabChange={handleTabChange}
              onFilteredCountChange={setFilteredChatCount}
              onCategoryCountsChange={handleCategoryCountsChange}
            />
          </div>
        ) : (
          selectedChat && (
            <MessageView
              selectedChat={selectedChat}
              onBack={handleBackToList}
              whatsappType={whatsappType || undefined}
            />
          )
        )}
      </div>

      {/* Modal de Filtros */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0">
          <div className="w-full h-[60vh] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUp">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Filtros</h3>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowFiltersModal(false)}
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Responsáveis */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Responsável
                </label>
                <MultiSelectDropdown
                  options={usuariosPorContato.map(u => ({ id: u.Id, label: u.nome }))}
                  selectedIds={selectedResponsibleIds}
                  onChange={setSelectedResponsibleIds}
                  placeholder="Selecionar responsáveis"
                  icon={<Users className="w-4 h-4" />}
                />
              </div>

              {/* Etiquetas */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Etiquetas
                </label>
                <MultiSelectDropdown
                  options={availableTags.map(t => ({ id: t.Id, label: t.nome, color: t.cor }))}
                  selectedIds={selectedTagIds}
                  onChange={setSelectedTagIds}
                  placeholder="Selecionar etiquetas"
                  icon={<TagIcon className="w-4 h-4" />}
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedResponsibleIds([]);
                    setSelectedTagIds([]);
                    setShowFiltersModal(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Período */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0">
          <div className="w-full max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slideUp">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Selecionar Período</h3>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowDateModal(false)}
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Filtros rápidos */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtro rápido</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setToday();
                      setShowDateModal(false);
                    }}
                    className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      setLast7();
                      setShowDateModal(false);
                    }}
                    className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    Últimos 7 dias
                  </button>
                  <button
                    onClick={() => {
                      setLast30();
                      setShowDateModal(false);
                    }}
                    className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    Últimos 30 dias
                  </button>
                  <button
                    onClick={() => {
                      setThisMonth();
                      setShowDateModal(false);
                    }}
                    className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    Este mês
                  </button>
                  <button
                    onClick={() => {
                      setLastMonth();
                      setShowDateModal(false);
                    }}
                    className="col-span-2 px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    Mês passado
                  </button>
                </div>
              </div>

              {/* Seleção manual */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5 block">
                    Data inicial
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Selecione a data inicial"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5 block">
                    Data final
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholderText="Selecione a data final"
                  />
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStartDate(null);
                    setEndDate(null);
                    setShowDateModal(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                >
                  Limpar
                </button>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Conversa */}
      <NewChatModal
        isOpen={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        onSuccess={handleNewChatSuccess}
      />

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ConversasMobile;
