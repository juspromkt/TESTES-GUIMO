import React, { useEffect, useRef, useState } from 'react';
import { Tag, UserCircle, Folder, KanbanSquare, Bell, Package, StopCircle, Search, ArrowLeft, Loader2 } from 'lucide-react';
import GuimooIcon from '../GuimooIcon';

interface QuickCommandMenuProps {
  isOpen: boolean;
  position: { top: number; left: number };
  onInsert: (html: string) => void;
  onClose: () => void;
  token: string;
  currentAgentId: number;
  initialCommand?: DecisionType | null;
}

type DecisionType = 'add_tag' | 'transfer_agent' | 'transfer_user' | 'assign_source' | 'transfer_stage' | 'notify' | 'assign_product' | 'stop_agent';

const commands = [
  { type: 'add_tag' as DecisionType, icon: Tag, label: 'Adicionar Etiqueta', color: 'text-orange-600 dark:text-orange-400', bgColor: '#FFF7ED', borderColor: '#FED7AA', textColor: '#9A3412' },
  { type: 'transfer_agent' as DecisionType, icon: GuimooIcon, label: 'Transferir para Agente', color: 'text-blue-600 dark:text-blue-400', bgColor: '#EFF6FF', borderColor: '#BFDBFE', textColor: '#1E40AF' },
  { type: 'transfer_user' as DecisionType, icon: UserCircle, label: 'Transferir para Usuário', color: 'text-green-600 dark:text-green-400', bgColor: '#ECFDF5', borderColor: '#BBF7D0', textColor: '#065F46' },
  { type: 'assign_source' as DecisionType, icon: Folder, label: 'Atribuir Origem', color: 'text-purple-600 dark:text-purple-400', bgColor: '#F5F3FF', borderColor: '#DDD6FE', textColor: '#5B21B6' },
  { type: 'transfer_stage' as DecisionType, icon: KanbanSquare, label: 'Mudar Estágio no CRM', color: 'text-cyan-600 dark:text-cyan-400', bgColor: '#E0F2FE', borderColor: '#BAE6FD', textColor: '#075985' },
  { type: 'notify' as DecisionType, icon: Bell, label: 'Notificar Equipe', color: 'text-amber-600 dark:text-amber-400', bgColor: '#FEF9C3', borderColor: '#FDE68A', textColor: '#92400E' },
  { type: 'assign_product' as DecisionType, icon: Package, label: 'Atribuir Departamento', color: 'text-pink-600 dark:text-pink-400', bgColor: '#FCE7F3', borderColor: '#FBCFE8', textColor: '#9D174D' },
  { type: 'stop_agent' as DecisionType, icon: StopCircle, label: 'Desativar Agente', color: 'text-red-600 dark:text-red-400', bgColor: '#FEF2F2', borderColor: '#FECACA', textColor: '#991B1B' },
];

export default function QuickCommandMenu({ isOpen, position, onInsert, onClose, token, currentAgentId, initialCommand }: QuickCommandMenuProps) {
  const [page, setPage] = useState<'commands' | 'selection'>('commands');
  const [selectedCommand, setSelectedCommand] = useState<DecisionType | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [items, setItems] = useState<any[]>([]);
  const [funnels, setFunnels] = useState<{ id: number; nome: string; estagios?: { Id: number; nome: string }[] }[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (initialCommand) {
        // Se há um comando inicial, vai direto para a seleção
        setSelectedCommand(initialCommand);
        setPage('selection');
        setSearchTerm('');
        setSelectedIndex(0);
        setSelectedFunnelId(null);
      } else {
        // Comportamento normal
        setPage('commands');
        setSelectedCommand(null);
        setSearchTerm('');
        setSelectedIndex(0);
        setSelectedFunnelId(null);
      }
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialCommand]);

  // Buscar dados quando selecionar comando
  useEffect(() => {
    if (page === 'selection' && selectedCommand) {
      fetchData(selectedCommand);
    }
  }, [page, selectedCommand]);

  const fetchData = async (commandType: DecisionType) => {
    setLoading(true);
    setItems([]);
    try {
      if (commandType === 'add_tag') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', { headers: { token } });
        if (!res.ok) throw new Error('Erro ao buscar tags');
        const data = await res.json();
        setItems(Array.isArray(data) ? data.filter((t: any) => t && t.Id).map((t: any) => ({ id: t.Id, nome: t.nome })) : []);
      } else if (commandType === 'transfer_agent') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', { headers: { token } });
        if (!res.ok) throw new Error('Erro ao buscar agentes');
        const data = await res.json();
        setItems(Array.isArray(data) ? data.filter(a => a && a.Id && a.Id !== currentAgentId && a.isAtivo === true).map((a: any) => ({ id: a.Id, nome: a.nome })) : []);
      } else if (commandType === 'transfer_user') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', { headers: { token } });
        if (!res.ok) throw new Error('Erro ao buscar usuários');
        const data = await res.json();
        setItems(Array.isArray(data) ? data.filter((u: any) => u && u.Id).map((u: any) => ({ id: u.Id, nome: u.nome })) : []);
      } else if (commandType === 'assign_source') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/fonte/get', { headers: { token } });
        if (!res.ok) throw new Error('Erro ao buscar fontes');
        const data = await res.json();
        setItems(Array.isArray(data) ? data.filter((s: any) => s && s.Id).map((s: any) => ({ id: s.Id, nome: s.nome })) : []);
      } else if (commandType === 'transfer_stage') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', { headers: { token } });
        if (!res.ok) throw new Error('Erro ao buscar funis');
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data.filter((f: any) => f && f.id).map((f: any) => ({
              id: f.id,
              nome: f.nome,
              estagios: Array.isArray(f.estagios) ? f.estagios.filter((s: any) => s && s.Id).map((s: any) => ({ Id: parseInt(s.Id), nome: s.nome })) : [],
            }))
          : [];
        setFunnels(normalized);
        setItems([]);
      } else if (commandType === 'notify') {
        const resAgents = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', { headers: { token } });
        if (!resAgents.ok) throw new Error('Erro ao buscar agentes');
        const allAgents = await resAgents.json();
        const principalAgent = Array.isArray(allAgents) ? allAgents.find((a: any) => a && a.isAgentePrincipal) : null;
        if (principalAgent) {
          const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/geral?id_agente=${principalAgent.Id}`, { headers: { token } });
          if (!res.ok) throw new Error('Erro ao buscar notificações');
          const data = await res.json();
          setItems(Array.isArray(data) ? data.filter((f: any) => f && f.tipo === 'NOTIFICACAO' && f.id).map((f: any) => ({ id: f.id, nome: f.nome })) : []);
        } else {
          setItems([]);
        }
      } else if (commandType === 'assign_product') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/produtos/get', { headers: { token } });
        if (!res.ok) throw new Error('Erro ao buscar produtos');
        const data = await res.json();
        setItems(Array.isArray(data) ? data.filter((p: any) => p && p.Id).map((p: any) => ({ id: p.Id, nome: p.nome })) : []);
      } else if (commandType === 'stop_agent') {
        // Não precisa buscar dados, insere diretamente
        handleInsertDecision('stop_agent', null, '');
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommandSelect = (commandType: DecisionType) => {
    setSelectedCommand(commandType);
    if (commandType === 'stop_agent') {
      handleInsertDecision('stop_agent', null, '');
      onClose();
    } else {
      setPage('selection');
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleItemSelect = (item: any) => {
    if (!selectedCommand) return;

    if (selectedCommand === 'transfer_stage') {
      // Se não selecionou funil ainda, seleciona o funil
      if (!selectedFunnelId) {
        setSelectedFunnelId(item.id);
        const funnel = funnels.find(f => f.id === item.id);
        setItems(funnel?.estagios?.map(s => ({ id: s.Id, nome: s.nome })) || []);
        setSearchTerm('');
        setSelectedIndex(0);
        return;
      }
      // Se já selecionou funil, insere o estágio
      handleInsertDecision(selectedCommand, item.id, item.nome);
    } else {
      handleInsertDecision(selectedCommand, item.id, item.nome);
    }

    onClose();
  };

  const handleInsertDecision = (type: DecisionType, id: number | null, label: string) => {
    const cmd = commands.find(c => c.type === type);
    if (!cmd) return;

    const base = 'display:inline-flex;align-items:center;gap:4px;border-radius:6px;padding:4px 10px;margin:2px;font-size:13px;font-weight:500;white-space:nowrap;vertical-align:middle;user-select:none;';
    const iconSvg = getIconSvg(type);

    const prefixMap: Record<DecisionType, string> = {
      add_tag: 'Adicionar Etiqueta',
      transfer_agent: 'Transferir para Agente',
      transfer_user: 'Transferir para Usuário',
      assign_source: 'Atribuir Origem',
      transfer_stage: 'Mudar Estágio no CRM',
      notify: 'Notificar Equipe',
      assign_product: 'Atribuir Departamento',
      stop_agent: 'Desativar Agente',
    };

    const prefix = prefixMap[type];
    const text = type === 'stop_agent' ? prefix : `${prefix}: ${label}`;

    const html = `<span class="smart-decision-token" data-type="${type}" ${id !== null ? `data-id="${id}"` : ''} data-label="${label}" contenteditable="false" style="${base}background:${cmd.bgColor};color:${cmd.textColor};">`+
      `<span style="display:inline-flex;align-items:center;line-height:1">${iconSvg}</span>`+
      `<span style="line-height:1">${text}</span>`+
      `</span>`;

    onInsert(html);
  };

  const getIconSvg = (type: DecisionType): string => {
    const icons: Record<DecisionType, string> = {
      add_tag: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
      transfer_agent: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor">G</text></svg>',
      transfer_user: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="8.5" cy="7" r="4"></circle></svg>',
      assign_source: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      transfer_stage: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
      notify: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
      assign_product: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>',
      stop_agent: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    };
    return icons[type] || '';
  };

  const handleBack = () => {
    if (selectedCommand === 'transfer_stage' && selectedFunnelId) {
      // Volta para seleção de funil
      setSelectedFunnelId(null);
      setItems([]);
      setSearchTerm('');
      setSelectedIndex(0);
      fetchData('transfer_stage');
    } else {
      setPage('commands');
      setSelectedCommand(null);
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  // Navegação por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentList = page === 'commands' ? filteredCommands : filteredItems;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % currentList.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + currentList.length) % currentList.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (page === 'commands') {
            handleCommandSelect(currentList[selectedIndex].type);
          } else {
            handleItemSelect(currentList[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (page === 'selection') {
            handleBack();
          } else {
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, page, selectedIndex, searchTerm]);

  // Filtragem
  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredItems = () => {
    if (selectedCommand === 'transfer_stage' && !selectedFunnelId) {
      // Mostra funis
      return funnels.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    // Mostra itens normais
    return items.filter(item => item.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filteredItems = getFilteredItems();

  // Scroll para item selecionado
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const container = menuRef.current.querySelector('.menu-items-container');
      if (container) {
        const selectedElement = container.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />

      {/* Menu */}
      <div
        className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          height: '350px',
          width: '300px',
        }}
      >
        {/* Header com busca */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5">
            {page === 'selection' && (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                title="Voltar"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder={page === 'commands' ? 'Buscar...' : 'Filtrar...'}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Context indicator */}
        {page === 'selection' && selectedCommand && (
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {selectedCommand === 'transfer_stage' && !selectedFunnelId
                ? 'Selecione o Funil'
                : selectedCommand === 'transfer_stage' && selectedFunnelId
                ? 'Selecione o Estágio'
                : commands.find(c => c.type === selectedCommand)?.label}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto menu-items-container">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-gray-500" />
            </div>
          ) : page === 'commands' ? (
            // Lista de comandos
            <>
              {filteredCommands.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhum comando encontrado
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tente buscar por outro termo
                  </p>
                </div>
              ) : (
                filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={command.type}
                      onClick={() => handleCommandSelect(command.type)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${command.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {command.label}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          ) : (
            // Lista de itens para seleção
            <>
              {filteredItems.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhum item encontrado
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedCommand === 'add_tag' && 'Crie etiquetas nas configurações do CRM'}
                    {selectedCommand === 'transfer_agent' && 'Crie agentes nas configurações'}
                    {selectedCommand === 'transfer_user' && 'Adicione usuários no sistema'}
                    {selectedCommand === 'assign_source' && 'Cadastre fontes nas configurações do CRM'}
                    {selectedCommand === 'transfer_stage' && !selectedFunnelId && 'Crie funis nas configurações do CRM'}
                    {selectedCommand === 'transfer_stage' && selectedFunnelId && 'Adicione estágios ao funil selecionado'}
                    {selectedCommand === 'notify' && 'Configure notificações no agente principal'}
                    {selectedCommand === 'assign_product' && 'Cadastre departamentos nas configurações'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {selectedCommand === 'transfer_agent' && (
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          <GuimooIcon className="w-full h-full" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {item.nome}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
