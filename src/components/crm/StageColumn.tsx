import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Deal } from '../../types/deal';
import type { Estagio } from '../../types/funil';
import DealCard from './DealCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import { ChevronDown, MoreHorizontal, Circle, Plus } from 'lucide-react';

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
const baseStageStyles = [
  {
    color: 'bg-gray-50',
    border: 'border-gray-200',
    header: '',
    dot: 'text-gray-600',
    hover: 'hover:bg-gray-100',
    progress: 'bg-gray-400',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
    headingWeight: 'font-semibold'
  }
];


  const ganhoStyle = {
    color: 'bg-green-50',
    border: 'border-green-200',
    header: 'bg-green-600',
    dot: 'text-white',
    hover: 'hover:bg-green-500',
    progress: 'bg-green-600',
    text: 'text-white',
    subtext: 'text-white/80',
    headingWeight: 'font-bold'
  };

  const perdidoStyle = {
    color: 'bg-red-50',
    border: 'border-red-200',
    header: 'bg-red-600',
    dot: 'text-dark',
    hover: 'hover:bg-red-500',
    progress: 'bg-red-600',
    text: 'text-white',
    subtext: 'text-white/80',
    headingWeight: 'font-bold'
  };

const styleIndex = parseInt(estagio.ordem) % baseStageStyles.length;

const currentStyle = estagio.isGanho
  ? ganhoStyle
  : estagio.isPerdido
  ? perdidoStyle
  : baseStageStyles[0];

  return (
    <div className="w-80 flex-shrink-0 h-full flex flex-col">
      <Droppable droppableId={estagio.Id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
className={`flex flex-col ${currentStyle.color} rounded-lg shadow-sm h-full overflow-hidden transition-all duration-200 ${
  snapshot.isDraggingOver ? 'ring-2 ring-blue-400 shadow-lg' : 'border'
}`}
style={{
  borderColor: estagio.isGanho
    ? '#059669'
    : estagio.isPerdido
    ? '#dc2626'
    : estagio.cor || '#e5e7eb' // fallback border color
}}
>
<div
  className={`p-4 select-none border-b border-gray-200`}
  style={{
    backgroundColor: estagio.isGanho
      ? '#059669'
      : estagio.isPerdido
      ? '#dc2626'
      : estagio.cor || '#ffffff'
  }}
>

            
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <h3
                    className={`${currentStyle.headingWeight} text-sm`}
                    style={{
                      color:
                        estagio.cor_texto_principal ||
                        (estagio.isGanho || estagio.isPerdido
                          ? '#ffffff'
                          : '#000000')
                    }}
                  >
                    {estagio.nome}
                  </h3>
                </div>
                <div className="flex items-center">
                  <button className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {estagio.isFollowUp && (
                  <span className="bg-yellow-300 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Follow-up
                  </span>
                )}
                {estagio.isReuniaoAgendada && (
                  <span className="bg-cyan-300 text-cyan-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Etapa de Reunião Agendada
                  </span>
                )}
              </div>

              <div
                className="mt-3 flex justify-end items-center text-xs"
                style={{
                  color:
                    estagio.cor_texto_secundario ||
                    (estagio.isGanho || estagio.isPerdido
                      ? 'rgba(255,255,255,0.8)'
                      : '#6b7280')
                }}
              >
                <p>
                  {deals.length === 0
                    ? 'Nenhum negócio'
                    : `${deals.length} ${
                        deals.length === 1 ? 'negociação' : 'negociações'
                      }`}
                </p>
              </div>

              <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${currentStyle.progress}`}
                  style={{ width: `${Math.min(deals.length * 10, 100)}%` }}
                ></div>
              </div>
            </div>

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
                  {deals.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-gray-500">Nenhuma negociação nessa etapa</p>
                    </div>
                  )}
                    {deals.map((deal, index) => (
                      <React.Fragment key={deal.Id}>
                        {canEdit ? (
                          <Draggable draggableId={deal.Id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transform transition-all duration-200 ${snapshot.isDragging ? 'scale-105 rotate-1' : ''}`}
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
                          <div>
                            <DealCard
                              deal={deal}
                              formatDate={formatDate}
                              onClick={() => onDealClick(deal)}
                              isDragging={false}
                              users={users}
                              tags={tagsMap[deal.Id]}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </InfiniteScroll>
              {provided.placeholder}

              {hasMore && deals.length > 0 && (
                <button
                  onClick={onLoadMore}
                  className={`w-full mt-3 py-2 flex items-center justify-center text-sm ${currentStyle.dot} ${currentStyle.hover} hover:text-white transition-colors rounded-md`}
                >
                  <span>Ver mais</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}