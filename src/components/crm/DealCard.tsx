// src/components/crm/DealCard.tsx
import React from 'react';
import { Calendar, ShieldCheck, Phone, UserCircle2, Building2 } from 'lucide-react';
import type { Deal } from '../../types/deal';
import type { Tag } from '../../types/tag';
import type { Departamento } from '../../types/departamento';

interface DealCardProps {
  deal: Deal;
  formatDate: (date: string) => string;
  onClick: () => void;
  isDragging?: boolean;
  // Aceita usuários com 'Id' ou 'id' para evitar inconsistência de tipos
  users: Array<{ Id?: number; id?: number; nome: string }>;
  tags?: Tag[];
  departamentos?: Departamento[];
}

export default function DealCard({
  deal,
  formatDate,
  onClick,
  isDragging,
  users,
  tags,
  departamentos
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
      className={`group bg-white dark:bg-gray-900 rounded-lg p-2 border transition-all duration-200 overflow-hidden ${
        isDragging
          ? 'shadow-lg ring-2 ring-blue-400 border-blue-400'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      } cursor-grab active:cursor-grabbing`}
    >
      {/* Header com Avatar e Nome do Lead */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {leadName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-0.5 truncate">
            {leadName}
          </h4>
          {telefone && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 text-xs">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{telefone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informações - Data e Responsável na mesma linha */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xs">
          {/* DATA */}
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="truncate">{formatDate(deal.CreatedAt)}</span>
          </div>

          {/* RESPONSÁVEL */}
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 truncate">
              {responsavel}
            </span>
          </div>
        </div>
      </div>

      {/* TAGS E DEPARTAMENTOS */}
      {((tags && tags.length > 0) || (departamentos && departamentos.length > 0)) && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
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

          {/* Departamentos */}
          {departamentos && departamentos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {departamentos.map((dept) => (
                <span
                  key={dept.Id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center gap-0.5"
                >
                  <Building2 className="w-2.5 h-2.5" />
                  {dept.nome}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
