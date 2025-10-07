import React from 'react';
import { Calendar, User, ShieldCheck } from 'lucide-react';
import type { Deal } from '../../types/deal';
import type { Tag } from '../../types/tag';

interface DealCardProps {
  deal: Deal;
  formatDate: (date: string) => string;
  onClick: () => void;
  isDragging?: boolean;
  users: { id: number; nome: string }[];
  tags?: Tag[];
}

export default function DealCard({
  deal,
  formatDate,
  onClick,
  isDragging,
  users,
  tags
}: DealCardProps) {
  const responsavel = users?.find(user => user.Id === deal.id_usuario)?.nome || 'Sem responsável';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-sm hover:shadow transition-all overflow-hidden ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      } cursor-grab active:cursor-grabbing transform transition-transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      <h4 className="font-medium text-gray-900 text-sm mb-2 truncate">
        {deal.titulo}
      </h4>

      <div className="space-y-1.5">
        {/* DATA */}
        <div
          className="flex items-center gap-1.5 text-gray-500 text-xs"
          title={`Criado em: ${formatDate(deal.CreatedAt)}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(deal.CreatedAt)}</span>
        </div>

        {/* CONTATO */}
        <div
          className="flex items-center gap-1.5 text-gray-500 text-xs"
          title={`Nome do contato: ${deal.contato?.nome || 'Não definido'}`}
        >
          <User className="w-3.5 h-3.5" />
          <span className="truncate max-w-[150px]">{deal.contato?.nome}</span>
        </div>

        {/* RESPONSÁVEL */}
        <div
          className="flex items-center gap-1.5 text-xs"
          title={`Responsável: ${responsavel}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span className="bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full truncate max-w-[150px]">
            {responsavel}
          </span>
        </div>
      </div>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 mt-3 pt-1">
          {tags.map(tag => (
            <span
              key={tag.Id}
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ backgroundColor: tag.cor, color: tag.cor_texto }}
            >
              {tag.nome}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}