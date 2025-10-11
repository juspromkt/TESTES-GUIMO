// src/components/crm/StageColumn.tsx
import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Deal } from '../../types/deal';
import type { Estagio } from '../../types/funil';
import DealCard from './DealCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ChevronDown, MoreHorizontal } from 'lucide-react';

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
  tagsMap
}: StageColumnProps) {
  const isSemStatus =
    estagio.Id === 'sem-status' || estagio.nome?.toLowerCase?.() === 'sem status';

  return (
    <div
      className="w-80 flex-shrink-0 h-full flex flex-col rounded-2xl shadow-sm border border-gray-200 overflow-visible relative transition-all duration-300"
      style={{
        backgroundColor: estagio.cor || '#f9fafb',
      }}
    >
      <Droppable droppableId={String(estagio.Id)}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col h-full transition-all duration-200 ${
              snapshot.isDraggingOver
                ? 'ring-2 ring-blue-400 shadow-lg scale-[1.01]'
                : ''
            }`}
          >
            {/* Cabeçalho da Coluna */}
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-t-2xl border-b shadow-sm ${
                isSemStatus ? 'bg-green-500/90' : 'bg-white/70 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSemStatus ? 'bg-white' : 'bg-blue-500'
                  }`}
                ></span>
                <h3
                  className={`text-sm font-semibold ${
                    isSemStatus ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {estagio.nome}
                </h3>
              </div>

              {/* Badge de contagem */}
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isSemStatus
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
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
                    <div className="text-center py-6 text-sm text-gray-500">
                      Nenhuma negociação nessa etapa
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
                                zIndex: snapshot.isDragging ? 9999 : 'auto',
                                position: snapshot.isDragging
                                  ? 'relative'
                                  : 'static',
                              }}
                              className={`transform transition-all duration-200 ${
                                snapshot.isDragging
                                  ? 'scale-105 rotate-1'
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
              </InfiniteScroll>
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}
