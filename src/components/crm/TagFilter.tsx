import React from 'react';
import { Check } from 'lucide-react';
import type { Tag } from '../../types/tag';

interface TagFilterProps {
  tags: Tag[];
  counts: Record<number, number>;
  selected: number[];
  onChange: (selected: number[]) => void;
}

export default function TagFilter({ tags, counts, selected, onChange }: TagFilterProps) {
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      onChange(selected.filter(t => t !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = () => {
    onChange(tags.map(t => t.Id));
  };

  return (
    <div className="space-y-2">
      {/* Header compacto com ações */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Filtrar por Tags
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-1.5 py-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all"
          >
            Todas
          </button>
        </div>
      </div>

      {/* Lista de Tags compacta */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
            Nenhuma tag disponível
          </p>
        ) : (
          tags.map(tag => {
            const isSelected = selected.includes(tag.Id);
            const count = counts[tag.Id] || 0;

            return (
              <button
                key={tag.Id}
                type="button"
                onClick={() => toggle(tag.Id)}
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg
                  border transition-all duration-150
                  ${isSelected
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {/* Checkbox compacto */}
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                    transition-all duration-150
                    ${isSelected
                      ? 'border-blue-600 dark:border-blue-400 bg-blue-600 dark:bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Tag com cor */}
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: tag.cor,
                      color: tag.cor_texto
                    }}
                  >
                    {tag.nome}
                  </span>
                </div>

                {/* Contador compacto */}
                <span className={`
                  text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0
                  ${isSelected
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {count}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}