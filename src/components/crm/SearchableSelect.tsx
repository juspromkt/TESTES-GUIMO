import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface SearchableOption {
  id: number;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: number | null;
  onChange: (id: number) => void;
  placeholder: string;
  footerLabel?: string;
  onFooterClick?: () => void;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  footerLabel,
  onFooterClick
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Ensure options is always an array and filter out options with undefined labels
  const validOptions = (options || []).filter(opt => opt && typeof opt.label === 'string');
  
  const filteredOptions = validOptions.filter(opt => 
    opt.label.toLowerCase().includes((search || '').toLowerCase())
  );

  const selectedOption = validOptions.find(opt => opt.id === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 bg-white border rounded-lg cursor-pointer
          flex items-center justify-between
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Pesquisar..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`
                    px-4 py-2 cursor-pointer text-sm hover:bg-gray-50
                    ${value === option.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                {validOptions.length === 0 ? 'Nenhum item cadastrado' : 'Nenhum resultado encontrado'}
              </div>
            )}
          </div>
          {footerLabel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onFooterClick?.();
              }}
              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:underline"
            >
              {footerLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}