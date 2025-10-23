// src/components/crm/KanbanBoard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Deal } from '../../types/deal';
import type { Funil } from '../../types/funil';
import StageColumn from './StageColumn';
import { Layers, Settings2, ChevronDown, Check } from 'lucide-react';

interface KanbanBoardProps {
  funil: Funil;
  deals: Deal[];
  formatDate: (date: string) => string;
  onDealClick: (deal: Deal) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  canEdit: boolean;
  users: { id: number; nome: string }[];
  tagsMap: Record<number, import('../../types/tag').Tag[]>;
  departamentosMap: Record<number, import('../../types/departamento').Departamento[]>;
}

export default function KanbanBoard({
  funil,
  deals,
  formatDate,
  onDealClick,
  itemsPerPage,
  onItemsPerPageChange,
  canEdit,
  users,
  tagsMap,
  departamentosMap
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
    <div className="flex-1 overflow-hidden flex flex-col min-w-0 relative bg-gray-50 dark:bg-neutral-900 transition-theme">
      {/* Header Minimalista */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 mb-4 transition-theme">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Título e Info */}
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 dark:bg-blue-500 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
                  Pipeline de Vendas
                </h2>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-600 dark:text-neutral-400">
                  <span className="font-medium text-gray-900 dark:text-neutral-100">{deals.length}</span>
                  <span>negociações ativas</span>
                </div>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-3">
              <button
                ref={itemsButtonRef}
                onClick={() => setShowItemsDropdown(!showItemsDropdown)}
                className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                <Settings2 className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                <span className="text-sm text-gray-700 dark:text-neutral-300">Exibir:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-neutral-100">
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
                    className="fixed z-[9999] bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-lg overflow-hidden"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      minWidth: `${dropdownPosition.width}px`
                    }}
                  >
                    <div className="p-1">
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
                              px-3 py-2 rounded-md cursor-pointer text-sm
                              flex items-center justify-between transition-colors
                              ${isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
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

        {/* Barra de rolagem superior simples */}
        <div
          id="kanban-scroll-top"
          className="overflow-x-auto h-2 cursor-ew-resize bg-gray-200 dark:bg-neutral-700 transition-theme"
          onScroll={handleTopScroll}
        >
          <div className="h-2" style={{ width: '400%' }}></div>
        </div>
      </div>

      {/* Área principal do Kanban */}
      <div
        id="kanban-scroll-main"
        className="flex-1 w-full max-w-full overflow-x-auto pb-6 px-4"
        onScroll={handleScrollSync}
      >
        <div
          className="inline-flex gap-3 px-2 pb-8 min-h-[calc(100vh-240px)]"
          style={{ transform: 'none' }}
        >
          {/* Colunas do funil */}
          {funil.estagios?.map((estagio, index) => {
            const minimalColors = [
              {
                bg: '#F3F4F6',      // Cinza claro
                border: '#E5E7EB',
                accent: '#6B7280'
              },
              {
                bg: '#EFF6FF',      // Azul claro
                border: '#DBEAFE',
                accent: '#3B82F6'
              },
              {
                bg: '#F0FDF4',      // Verde claro
                border: '#DCFCE7',
                accent: '#10B981'
              },
              {
                bg: '#FEF3C7',      // Amarelo claro
                border: '#FDE68A',
                accent: '#F59E0B'
              },
              {
                bg: '#FCE7F3',      // Rosa claro
                border: '#FBCFE8',
                accent: '#EC4899'
              },
              {
                bg: '#F5F3FF',      // Roxo claro
                border: '#EDE9FE',
                accent: '#8B5CF6'
              }
            ];
            const colorScheme = minimalColors[index % minimalColors.length];

            // Filtra deals deste estágio e aplica limite de itemsPerPage
            const stageDeals = deals.filter(
              (deal) => deal.id_estagio === parseInt(estagio.Id)
            );
            const limitedDeals = stageDeals.slice(0, itemsPerPage);

            return (
              <StageColumn
                key={estagio.Id}
                estagio={{
                  ...estagio,
                  cor: colorScheme.bg
                }}
                deals={limitedDeals}
                formatDate={formatDate}
                onDealClick={onDealClick}
                hasMore={false}
                onLoadMore={() => {}}
                canEdit={canEdit}
                users={users}
                tagsMap={tagsMap}
                departamentosMap={departamentosMap}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
