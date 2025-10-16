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
      className="w-[340px] flex-shrink-0 h-full flex flex-col rounded-2xl shadow-lg border-2 overflow-visible relative transition-all duration-300 hover:shadow-xl dark:shadow-neutral-900/50"
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
                ? 'ring-4 ring-blue-400/50 shadow-2xl scale-[1.02]'
                : ''
            }`}
          >
            {/* Cabeçalho Premium */}
            <div className="flex items-center justify-between px-5 py-4 rounded-t-2xl border-b-2 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md border-gray-200/50 dark:border-neutral-600/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full blur-sm bg-blue-500/50"></div>
                  <span className="relative w-3 h-3 rounded-full block shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600"></span>
                </div>
                <h3 className="text-sm font-bold tracking-wide text-gray-900 dark:text-neutral-100">
                  {estagio.nome}
                </h3>
              </div>

              <span className="text-xs font-bold px-3 py-1.5 rounded-full shadow-sm bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-300">
                {deals.length}
              </span>
            </div>

            {/* Lista de cards */}
            <div
              className="flex-1 px-3 py-4 overflow-y-auto stage-scroll"
              id={`stage-${estagio.Id}`}
            >
              <InfiniteScroll
                dataLength={deals.length}
                next={onLoadMore}
                hasMore={hasMore}
                loader={
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-pulse flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                }
                scrollableTarget={`stage-${estagio.Id}`}
              >
                <div className="space-y-3">
                  {deals.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">Nenhum negócio</p>
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
                              className={`rounded-xl bg-white dark:bg-neutral-800 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging
                                  ? 'scale-105 rotate-[1deg] shadow-2xl ring-2 ring-blue-400 ring-offset-2 dark:ring-blue-500 dark:ring-offset-neutral-900'
                                  : 'hover:scale-[1.01]'
                              }`}
                            >
                              <DealCard
                                deal={deal}
                                formatDate={formatDate}
                                onClick={() => onDealClick(deal)}
                                isDragging={snapshot.isDragging}
                                users={users}
                                tags={tagsMap[deal.Id] || []}
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
