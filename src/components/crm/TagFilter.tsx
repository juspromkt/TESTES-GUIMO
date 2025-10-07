import React from 'react';
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

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <button
          key={tag.Id}
          type="button"
          onClick={() => toggle(tag.Id)}
          className={`px-2 py-1 rounded border text-xs font-medium flex items-center gap-1 ${selected.includes(tag.Id) ? 'ring-2 ring-blue-500' : ''}`}
          style={{ backgroundColor: tag.cor, color: tag.cor_texto }}
        >
          <span>{tag.nome}</span>
          <span>({counts[tag.Id] || 0})</span>
        </button>
      ))}
    </div>
  );
}