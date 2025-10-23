// src/components/crm/StageColumn.tsx
import React, { useEffect, useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Deal } from '../../types/deal';
import type { Estagio } from '../../types/funil';
import DealCard from './DealCard';
import InfiniteScroll from 'react-infinite-scroll-component';

interface StageColumnProps {
  estagio: Estagio;
  deals: Deal[];
  formatDate: (date: string) => string;
  onDealClick: (deal: Deal) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  canEdit: boolean;
  users: { id: number; nome: string }[];
  tagsMap: Record<number, import('../../types/tag').Tag[]>;
  departamentosMap: Record<number, import('../../types/departamento').Departamento[]>;
}

export default function StageColumn({
  estagio,
  deals,
  formatDate,
  onDealClick,
  hasMore,
  onLoadMore,
  canEdit,
  users,
  tagsMap,
  departamentosMap,
}: StageColumnProps) {
  // Estado para detectar modo dark
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Verifica se está em dark mode
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    // Verifica inicialmente
    checkDarkMode();

    // Observa mudanças no tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Define cor de fundo baseada no tema
  const bgColor = isDark ? '#262626' : (estagio.cor || '#f9fafb'); // neutral-800
  const borderColor = isDark ? '#404040' : '#e5e7eb'; // neutral-700

  return (
    <div
      className="w-[320px] flex-shrink-0 h-full flex flex-col rounded-lg border overflow-visible relative transition-all duration-200"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor
      }}
    >
      <Droppable droppableId={String(estagio.Id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col h-full transition-all duration-200 ${
              snapshot.isDraggingOver
                ? 'ring-2 ring-blue-400'
                : ''
            }`}
          >
            {/* Cabeçalho Minimalista */}
            <div className="flex items-center justify-between px-4 py-3 rounded-t-lg border-b bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <h3 className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                  {estagio.nome}
                </h3>
              </div>

              <span className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300">
                {deals.length}
              </span>
            </div>

            {/* Lista de cards */}
            <div
              className="flex-1 px-3 py-3 overflow-y-auto stage-scroll"
              id={`stage-${estagio.Id}`}
            >
              <InfiniteScroll
                dataLength={deals.length}
                next={onLoadMore}
                hasMore={hasMore}
                loader={
                  <div className="flex justify-center items-center py-3">
                    <div className="animate-pulse flex space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                }
                scrollableTarget={`stage-${estagio.Id}`}
              >
                <div className="space-y-2">
                  {deals.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">Nenhum negócio</p>
                      <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">Arraste cards para cá</p>
                    </div>
                  ) : (
                    deals.map((deal, index) =>
                      canEdit ? (
                        <Draggable
                          key={deal.Id}
                          draggableId={deal.Id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                // 🔹 mantém a transformação do DnD e adiciona transição suave
                                transform: provided.draggableProps.style
                                  ?.transform,
                                transition: snapshot.isDragging
                                  ? 'transform 0.15s ease'
                                  : 'transform 0.25s ease',
                                zIndex: snapshot.isDragging ? 9999 : 'auto',
                              }}
                              className={`rounded-lg bg-white dark:bg-neutral-800 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging
                                  ? 'shadow-lg ring-2 ring-blue-400'
                                  : 'hover:shadow-sm'
                              }`}
                            >
                              <DealCard
                                deal={deal}
                                formatDate={formatDate}
                                onClick={() => onDealClick(deal)}
                                isDragging={snapshot.isDragging}
                                users={users}
                                tags={tagsMap[deal.Id] || []}
                                departamentos={departamentosMap[deal.Id] || []}
                              />
                            </div>
                          )}
                        </Draggable>
                      ) : (
                        <div key={deal.Id}>
                          <DealCard
                            deal={deal}
                            formatDate={formatDate}
                            onClick={() => onDealClick(deal)}
                            isDragging={false}
                            users={users}
                            tags={tagsMap[deal.Id] || []}
                            departamentos={departamentosMap[deal.Id] || []}
                          />
                        </div>
                      )
                    )
                  )}
                </div>

                {/* 🔹 ESSENCIAL: placeholder para o drag funcionar visualmente */}
                {provided.placeholder}
              </InfiniteScroll>
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}
