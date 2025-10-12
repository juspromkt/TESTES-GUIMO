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
    <div className="space-y-3">
      {/* Header com ações */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-700">
          Filtrar por Tags
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded transition-all"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded transition-all"
          >
            Selecionar Todas
          </button>
        </div>
      </div>

      {/* Lista de Tags */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
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
                  w-full flex items-center justify-between p-3 rounded-xl
                  border-2 transition-all duration-200
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox customizado */}
                  <div className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center
                    transition-all duration-200
                    ${isSelected
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-white'
                    }
                  `}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Tag com cor */}
                  <span
                    className="px-3 py-1 rounded-lg text-xs font-bold shadow-sm"
                    style={{
                      backgroundColor: tag.cor,
                      color: tag.cor_texto
                    }}
                  >
                    {tag.nome}
                  </span>
                </div>

                {/* Contador */}
                <span className={`
                  text-xs font-bold px-2.5 py-1 rounded-full
                  ${isSelected
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
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