import { X } from 'lucide-react';
import type { Tag } from '../../types/tag';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Filtros disponíveis
  availableTags: Tag[];
  usuariosPorContato: any[];

  // Estados dos filtros
  tagFiltroId: number | null;
  setTagFiltroId: (id: number | null) => void;
  iaStatusFilter: 'all' | 'active' | 'inactive';
  setIaStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
  showOnlyUnread: boolean;
  setShowOnlyUnread: (show: boolean) => void;
  showUnanswered: boolean;
  setShowUnanswered: (show: boolean) => void;
  activeTab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered';
  handleTabChange: (tab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered') => void;
}

export function FilterModal({
  isOpen,
  onClose,
  availableTags,
  usuariosPorContato,
  tagFiltroId,
  setTagFiltroId,
  iaStatusFilter,
  setIaStatusFilter,
  showOnlyUnread,
  setShowOnlyUnread,
  showUnanswered,
  setShowUnanswered,
  activeTab,
  handleTabChange,
}: FilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Filtros Avançados</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Tipo de Conversas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipo de Conversas</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'ia', label: 'IA Ativa' },
                { key: 'transfers', label: 'Transferências' },
                { key: 'unread', label: 'Não lidas' },
                { key: 'unanswered', label: 'Não respondidas' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as typeof activeTab)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status da IA */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status da IA</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'Todas as conversas', color: 'gray' },
                { value: 'active', label: 'IA Ativa', color: 'emerald' },
                { value: 'inactive', label: 'Intervenção', color: 'red' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setIaStatusFilter(option.value as typeof iaStatusFilter)}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                    iaStatusFilter === option.value
                      ? option.color === 'emerald'
                        ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                        : option.color === 'red'
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Etiquetas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtrar por Etiqueta</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <button
                onClick={() => setTagFiltroId(null)}
                className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  tagFiltroId === null
                    ? 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                Todas as etiquetas
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag.Id}
                  onClick={() => setTagFiltroId(tag.Id)}
                  className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                    tagFiltroId === tag.Id ? 'border-2 shadow-md' : 'border-2 border-transparent'
                  }`}
                  style={{
                    backgroundColor: tag.cor,
                    color: tag.cor_texto,
                    borderColor: tagFiltroId === tag.Id ? tag.cor : 'transparent',
                  }}
                >
                  {tag.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Filtros rápidos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtros Rápidos</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => setShowOnlyUnread(e.target.checked)}
                  className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-200"
                />
                <span className="text-sm font-medium text-gray-700">
                  Apenas conversas não lidas
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={showUnanswered}
                  onChange={(e) => setShowUnanswered(e.target.checked)}
                  className="w-5 h-5 text-emerald-500 rounded focus:ring-2 focus:ring-emerald-200"
                />
                <span className="text-sm font-medium text-gray-700">
                  Apenas conversas não respondidas
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              setTagFiltroId(null);
              setIaStatusFilter('all');
              setShowOnlyUnread(false);
              setShowUnanswered(false);
              handleTabChange('all');
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Limpar Filtros
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
