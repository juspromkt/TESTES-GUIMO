import React from 'react';
import type { Deal } from '../../types/deal';
import type { Funil } from '../../types/funil';
import StageColumn from './StageColumn';

interface KanbanBoardProps {
  funil: Funil;
  deals: Deal[];
  formatDate: (date: string) => string;
  onDealClick: (deal: Deal) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void
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
  return (
<div className="flex-1 overflow-hidden flex flex-col min-w-0">
      <div className="flex items-center justify-end mb-4 px-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Itens por página:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 p-2"
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
      <div className="flex-1 w-full max-w-full overflow-x-auto pb-20">
        <div className="inline-flex gap-4 px-4 pb-16 h-[calc(150vh-80px)]"> {/* altura ajustável conforme necessário */}
     {funil.estagios?.map((estagio) => (
            <StageColumn
              key={estagio.Id}
              estagio={estagio}
              deals={deals.filter(deal => deal.id_estagio === parseInt(estagio.Id))}
              formatDate={formatDate}
              onDealClick={onDealClick}
              hasMore={hasMore}
              onLoadMore={onLoadMore}
              canEdit={canEdit}
              users={users}
              tagsMap={tagsMap}
            />
          ))}
        </div>
      </div>
    </div>
  );
}