// src/components/crm/KanbanBoard.tsx
import React from 'react';
import type { Deal } from '../../types/deal';
import type { Funil } from '../../types/funil';
import StageColumn from './StageColumn';
import { Layers } from 'lucide-react';

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
  // Leads sem estágio (sem status)
  const dealsSemStatus = deals.filter(
    (deal) => !deal.id_estagio || deal.id_estagio === 0
  );

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
    <div className="flex-1 overflow-hidden flex flex-col min-w-0 relative">
      {/* Controles superiores */}
      <div className="flex items-center justify-between mb-4 px-6">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-800">Quadro de Leads</h2>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Itens por página:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2 bg-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={150}>150</option>
            <option value={999}>+150</option>
          </select>
        </div>
      </div>

      {/* Barra de rolagem superior */}
      <div
        id="kanban-scroll-top"
        className="overflow-x-auto h-4 cursor-ew-resize bg-gradient-to-r from-slate-100 via-blue-100 to-indigo-100 rounded-t-lg shadow-inner"
        onScroll={handleTopScroll}
      >
        <div className="h-4" style={{ width: '400%' }}></div>
      </div>

      {/* Área principal do Kanban */}
      <div
        id="kanban-scroll-main"
        className="flex-1 w-full max-w-full overflow-x-auto pb-10 pt-2"
        onScroll={handleScrollSync}
      >
        <div
          className="
            inline-flex gap-5 px-6 pb-10
            min-h-[calc(100vh-200px)]
            bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
            rounded-2xl border border-gray-200 shadow-inner
            relative overflow-visible z-0
          "
          style={{ transform: 'none' }}
        >
          {/* Coluna SEM STATUS */}
          <StageColumn
            estagio={{
              Id: 'sem-status',
              nome: 'Sem status',
              ordem: '0',
              cor: '#dcfce7' // verde claro suave
            }}
            deals={dealsSemStatus}
            formatDate={formatDate}
            onDealClick={onDealClick}
            hasMore={false}
            onLoadMore={() => {}}
            canEdit={canEdit}
            users={users}
            tagsMap={tagsMap}
          />

          {/* Colunas normais */}
          {funil.estagios?.map((estagio, index) => {
            const pastelColors = [
              '#dbeafe', // azul suave
              '#fef9c3', // amarelo
              '#fde68a', // dourado
              '#e9d5ff', // roxo
              '#bae6fd', // azul-claro
              '#fbcfe8'  // rosa
            ];
            const colColor = pastelColors[index % pastelColors.length];

            return (
              <StageColumn
                key={estagio.Id}
                estagio={{ ...estagio, cor: colColor }}
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
