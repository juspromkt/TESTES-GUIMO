import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'kanban' | 'list';
  onViewChange: (view: 'kanban' | 'list') => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-700 p-1 rounded-lg">
      <button
        onClick={() => onViewChange('kanban')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'kanban'
            ? 'bg-white dark:bg-neutral-600 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="text-sm font-medium">Kanban</span>
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          view === 'list'
            ? 'bg-white dark:bg-neutral-600 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-100'
        }`}
      >
        <List className="w-4 h-4" />
        <span className="text-sm font-medium">Lista</span>
      </button>
    </div>
  );
}