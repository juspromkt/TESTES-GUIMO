// src/components/crm/DealCard.tsx
import React from 'react';
import { Calendar, ShieldCheck, Phone, UserCircle2 } from 'lucide-react';
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
      className={`group bg-white dark:bg-neutral-800 rounded-lg p-3 border transition-all duration-200 overflow-hidden ${
        isDragging
          ? 'shadow-lg ring-2 ring-blue-400 border-blue-400'
          : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:shadow-sm'
      } cursor-grab active:cursor-grabbing`}
    >
      {/* Header com Avatar e Nome */}
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {leadName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-neutral-100 text-sm mb-0.5 truncate">
            {leadName}
          </h4>
          {telefone && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-neutral-400 text-xs">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{telefone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informações Principais */}
      <div className="space-y-1.5 mb-2">
        {/* DATA DO PRIMEIRO CONTATO */}
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-neutral-400 text-xs">
          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
          <span>{formatDate(deal.CreatedAt)}</span>
        </div>

        {/* RESPONSÁVEL */}
        <div className="flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-neutral-300 truncate">
            {responsavel}
          </span>
        </div>

        {/* NOME COMPLETO (se diferente do primeiro nome) */}
        {rawName && rawName !== leadName && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-neutral-400 text-xs">
            <UserCircle2 className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
            <span className="truncate">{rawName}</span>
          </div>
        )}
      </div>

      {/* TAGS */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100 dark:border-neutral-700">
          {tags.map((tag) => (
            <span
              key={tag.Id}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: tag.cor,
                color: tag.cor_texto
              }}
            >
              {tag.nome}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
