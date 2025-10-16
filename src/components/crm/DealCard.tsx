// src/components/crm/DealCard.tsx
import React from 'react';
import { Calendar, User, ShieldCheck, Phone, UserCircle2 } from 'lucide-react';
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
      className={`group bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-md hover:shadow-xl dark:hover:shadow-neutral-900/50 transition-all duration-200 overflow-hidden border border-gray-100 dark:border-neutral-700 ${
        isDragging ? 'shadow-2xl ring-2 ring-blue-500 dark:ring-blue-400 scale-105' : ''
      } cursor-grab active:cursor-grabbing transform hover:-translate-y-1 active:scale-95`}
    >
      {/* Header com Avatar e Nome */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-sm opacity-50"></div>
          <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">
              {leadName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 dark:text-neutral-100 text-base mb-0.5 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            {leadName}
          </h4>
          {telefone && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-neutral-400 text-xs">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate font-medium">{telefone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informações Principais */}
      <div className="space-y-2 mb-3">
        {/* DATA DO PRIMEIRO CONTATO */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-neutral-400 text-xs bg-gray-50 dark:bg-neutral-700/50 px-2.5 py-2 rounded-lg">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
          <span className="font-medium">{formatDate(deal.CreatedAt)}</span>
        </div>

        {/* RESPONSÁVEL */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-2.5 py-2 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 truncate">
              {responsavel}
            </span>
          </div>
        </div>

        {/* NOME COMPLETO (se diferente do primeiro nome) */}
        {rawName && rawName !== leadName && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-neutral-400 text-xs bg-gray-50 dark:bg-neutral-700/50 px-2.5 py-2 rounded-lg">
            <UserCircle2 className="w-4 h-4 text-gray-400 dark:text-neutral-500 flex-shrink-0" />
            <span className="truncate font-medium">{rawName}</span>
          </div>
        )}
      </div>

      {/* TAGS */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-neutral-700">
          {tags.map((tag) => (
            <span
              key={tag.Id}
              className="px-2 py-1 rounded-md text-[10px] font-semibold shadow-sm"
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
