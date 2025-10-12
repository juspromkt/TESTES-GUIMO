import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, Check, X } from 'lucide-react';

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
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Ensure options is always an array and filter out options with undefined labels
  const validOptions = (options || []).filter(opt => opt && typeof opt.label === 'string');

  const filteredOptions = validOptions.filter(opt =>
    opt.label.toLowerCase().includes((search || '').toLowerCase())
  );

  const selectedOption = validOptions.find(opt => opt.id === value);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const hasValue = value !== null && value !== 0;

  return (
    <div>
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-2.5 bg-white border-2 rounded-xl cursor-pointer
          flex items-center justify-between transition-all font-medium text-sm
          focus:ring-2 focus:ring-blue-500/20
          ${hasValue ? 'border-blue-500' : 'border-gray-200'}
          ${isOpen ? 'border-blue-500' : 'hover:border-gray-300'}
        `}
      >
        <span className={`flex items-center gap-2 flex-1 min-w-0 ${selectedOption ? 'text-gray-900' : 'text-gray-600'}`}>
          {selectedOption ? selectedOption.label : placeholder}
          {hasValue && selectedOption && (
            <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              ✓
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {hasValue && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(0);
              }}
              className="p-0.5 hover:bg-gray-100 rounded flex-shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
          />
          {/* Dropdown */}
          <div
            className="fixed z-[9999] bg-white border-2 border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              maxWidth: '400px'
            }}
          >
            {/* Campo de Busca Premium */}
            <div className="p-3 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white font-medium"
                  placeholder="Pesquisar..."
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de Opções */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                <div className="p-2 space-y-1">
                  {filteredOptions.map((option) => {
                    const isSelected = value === option.id;
                    return (
                      <div
                        key={option.id}
                        onClick={() => {
                          onChange(option.id);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        className={`
                          px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium
                          flex items-center justify-between transition-all
                          ${isSelected
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-2 border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
                          }
                        `}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {validOptions.length === 0 ? 'Nenhum item cadastrado' : 'Nenhum resultado encontrado'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Button */}
            {footerLabel && (
              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onFooterClick?.();
                  }}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                  {footerLabel}
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}