// src/components/crm/KanbanBoard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Deal } from '../../types/deal';
import type { Funil } from '../../types/funil';
import StageColumn from './StageColumn';
import { Layers, Settings2, TrendingUp, ChevronDown, Check } from 'lucide-react';

interface KanbanBoardProps {
  funil: Funil;
  deals: Deal[];
  formatDate: (date: string) => string;
  onDealClick: (deal: Deal) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  canEdit: boolean;
  users: { id: number; nome: string }[];
  tagsMap: Record<number, import('../../types/tag').Tag[]>;
}

export default function KanbanBoard({
  funil,
  deals,
  formatDate,
  onDealClick,
  hasMore,
  onLoadMore,
  itemsPerPage,
  onItemsPerPageChange,
  canEdit,
  users,
  tagsMap
}: KanbanBoardProps) {
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const itemsButtonRef = useRef<HTMLButtonElement>(null);

  const itemOptions = [
    { value: 10, label: '10 itens' },
    { value: 25, label: '25 itens' },
    { value: 50, label: '50 itens' },
    { value: 100, label: '100 itens' },
    { value: 150, label: '150 itens' },
    { value: 999, label: 'Todos' }
  ];

  useEffect(() => {
    if (showItemsDropdown && itemsButtonRef.current) {
      const rect = itemsButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showItemsDropdown]);

  // Sincroniza scroll entre barra superior e conteúdo
  const handleScrollSync = (e: React.UIEvent<HTMLDivElement>) => {
    const topScroll = document.getElementById('kanban-scroll-top');
    if (topScroll) topScroll.scrollLeft = (e.target as HTMLElement).scrollLeft;
  };

  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const mainScroll = document.getElementById('kanban-scroll-main');
    if (mainScroll) mainScroll.scrollLeft = (e.target as HTMLElement).scrollLeft;
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-w-0 relative bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800 transition-theme">
      {/* Header Premium com Estatísticas */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-100 dark:border-neutral-700 shadow-sm mb-4 transition-theme">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Título e Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <Layers className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-neutral-100 dark:via-neutral-200 dark:to-neutral-100 bg-clip-text text-transparent">
                  Pipeline de Vendas
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-neutral-400">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-neutral-100">{deals.length}</span>
                    <span>negociações ativas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
              <button
                ref={itemsButtonRef}
                onClick={() => setShowItemsDropdown(!showItemsDropdown)}
                className="flex items-center gap-2 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-700 dark:to-neutral-800 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-neutral-600 hover:border-gray-300 dark:hover:border-neutral-500 transition-all cursor-pointer"
              >
                <Settings2 className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">Exibir:</span>
                <span className="text-sm font-bold text-gray-900 dark:text-neutral-100">
                  {itemOptions.find(opt => opt.value === itemsPerPage)?.label || '50 itens'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-neutral-400 transition-transform ${showItemsDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showItemsDropdown && createPortal(
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowItemsDropdown(false)}
                  />
                  {/* Dropdown */}
                  <div
                    className="fixed z-[9999] bg-white dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-600 rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      minWidth: `${dropdownPosition.width}px`
                    }}
                  >
                    <div className="p-2 space-y-1">
                      {itemOptions.map((option) => {
                        const isSelected = itemsPerPage === option.value;
                        return (
                          <div
                            key={option.value}
                            onClick={() => {
                              onItemsPerPageChange(option.value);
                              setShowItemsDropdown(false);
                            }}
                            className={`
                              px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium
                              flex items-center justify-between transition-all
                              ${isSelected
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700'
                                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-700 border-2 border-transparent hover:border-gray-200 dark:hover:border-neutral-600'
                              }
                            `}
                          >
                            <span>{option.label}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Barra de rolagem superior elegante */}
        <div
          id="kanban-scroll-top"
          className="overflow-x-auto h-3 cursor-ew-resize bg-gradient-to-r from-blue-100/50 via-indigo-100/50 to-purple-100/50 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 shadow-inner relative transition-theme"
          onScroll={handleTopScroll}
        >
          <div className="h-3 relative" style={{ width: '400%' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 dark:from-blue-600/20 dark:via-indigo-600/20 dark:to-purple-600/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Área principal do Kanban com melhor gradiente */}
      <div
        id="kanban-scroll-main"
        className="flex-1 w-full max-w-full overflow-x-auto pb-6 px-4"
        onScroll={handleScrollSync}
      >
        <div
          className="
            inline-flex gap-4 px-2 pb-8
            min-h-[calc(100vh-240px)]
            relative overflow-visible z-0
          "
          style={{ transform: 'none' }}
        >
          {/* Colunas do funil */}
          {funil.estagios?.map((estagio, index) => {
            const premiumColors = [
              {
                bg: '#EFF6FF',      // Azul claro
                border: '#DBEAFE',
                accent: '#3B82F6'
              },
              {
                bg: '#FEF3C7',      // Amarelo suave
                border: '#FDE68A',
                accent: '#F59E0B'
              },
              {
                bg: '#FCE7F3',      // Rosa suave
                border: '#FBCFE8',
                accent: '#EC4899'
              },
              {
                bg: '#F3E8FF',      // Roxo suave
                border: '#E9D5FF',
                accent: '#A855F7'
              },
              {
                bg: '#DBEAFE',      // Azul médio
                border: '#BFDBFE',
                accent: '#2563EB'
              },
              {
                bg: '#D1FAE5',      // Verde suave
                border: '#A7F3D0',
                accent: '#10B981'
              }
            ];
            const colorScheme = premiumColors[index % premiumColors.length];

            return (
              <StageColumn
                key={estagio.Id}
                estagio={{
                  ...estagio,
                  cor: colorScheme.bg
                }}
                deals={deals.filter(
                  (deal) => deal.id_estagio === parseInt(estagio.Id)
                )}
                formatDate={formatDate}
                onDealClick={onDealClick}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
                canEdit={canEdit}
                users={users}
                tagsMap={tagsMap}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
