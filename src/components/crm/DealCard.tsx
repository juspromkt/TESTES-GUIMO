// src/components/crm/DealCard.tsx
import React from 'react';
import { Calendar, User, ShieldCheck, Phone } from 'lucide-react';
import type { Deal } from '../../types/deal';
import type { Tag } from '../../types/tag';

interface DealCardProps {
  deal: Deal;
  formatDate: (date: string) => string;
  onClick: () => void;
  isDragging?: boolean;
  // Aceita usuários com 'Id' ou 'id' para evitar inconsistência de tipos
  users: Array<{ Id?: number; id?: number; nome: string }>;
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
  // Responsável (compatível com objetos que tenham Id OU id)
  const responsavel =
    users?.find(
      (u) => (u as any).Id === deal.id_usuario || (u as any).id === deal.id_usuario
    )?.nome || 'Sem responsável';

  // Nome do lead: primeiro nome; se não houver, usa telefone; se nada, fallback
  const rawName = deal.contato?.nome?.trim() || '';
  const leadName =
    (rawName ? rawName.split(' ')[0] : '') ||
    deal.contato?.telefone ||
    'Lead sem nome';

  const telefone = deal.contato?.telefone;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-sm hover:shadow transition-all overflow-hidden ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      } cursor-grab active:cursor-grabbing transform hover:scale-[1.02] active:scale-[0.98]`}
    >
      {/* Nome do lead em destaque */}
      <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
        {leadName}
      </h4>

      <div className="space-y-1.5">
        {/* TELEFONE (se existir) */}
        {telefone && (
          <div
            className="flex items-center gap-1.5 text-gray-600 text-xs"
            title={`Telefone do contato: ${telefone}`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{telefone}</span>
          </div>
        )}

        {/* DATA DO PRIMEIRO CONTATO (CreatedAt) */}
        <div
          className="flex items-center gap-1.5 text-gray-500 text-xs"
          title={`Data do primeiro contato: ${formatDate(deal.CreatedAt)}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Data do primeiro contato: {formatDate(deal.CreatedAt)}</span>
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

        {/* CONTATO (nome completo, se quiser manter como info secundária) */}
        {rawName && (
          <div
            className="flex items-center gap-1.5 text-gray-500 text-xs"
            title={`Nome completo: ${rawName}`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{rawName}</span>
          </div>
        )}
      </div>

      {/* TAGS */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 mt-3 pt-1">
          {tags.map((tag) => (
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
