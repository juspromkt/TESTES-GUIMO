import { X, Calendar, Tag as TagIcon, MessageSquare, Filter, Users as UsersIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import type { Tag } from '../../types/tag';

// Registra o locale português
registerLocale('pt-BR', ptBR);

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTags: Tag[];

  // Date range
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;

  // Attendance status filters
  iaStatusFilter: 'all' | 'active' | 'inactive';
  setIaStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
  showOnlyUnread: boolean;
  setShowOnlyUnread: (show: boolean) => void;
  showUnanswered: boolean;
  setShowUnanswered: (show: boolean) => void;
  activeTab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered';
  handleTabChange: (tab: 'all' | 'ia' | 'transfers' | 'unread' | 'unanswered') => void;

  // Tags (now managed internally in this modal)
  selectedTagIds: number[];
  setSelectedTagIds: (ids: number[]) => void;

  // Filtered count
  filteredCount?: number;
}

export function AdvancedFilterModal({
  isOpen,
  onClose,
  availableTags,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  iaStatusFilter,
  setIaStatusFilter,
  showOnlyUnread,
  setShowOnlyUnread,
  showUnanswered,
  setShowUnanswered,
  activeTab,
  handleTabChange,
  selectedTagIds,
  setSelectedTagIds,
  filteredCount = 0,
}: AdvancedFilterModalProps) {
  // Quick date filters
  const setQuickDateFilter = (filter: 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'last7days':
        setStartDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
        setEndDate(today);
        break;
      case 'last30days':
        setStartDate(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000));
        setEndDate(today);
        break;
      case 'thisMonth':
        setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
        setEndDate(today);
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(lastMonthStart);
        setEndDate(lastMonthEnd);
        break;
    }
  };

  if (!isOpen) return null;

  const clearAllFilters = () => {
    setSelectedTagIds([]);
    setStartDate(null);
    setEndDate(null);
    setIaStatusFilter('all');
    setShowOnlyUnread(false);
    setShowUnanswered(false);
    handleTabChange('all');
  };

  const hasActiveFilters =
    startDate !== null ||
    endDate !== null ||
    iaStatusFilter !== 'all' ||
    showOnlyUnread ||
    showUnanswered ||
    activeTab !== 'all';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Mais Filtros</h2>
              <p className="text-sm text-gray-600">Refine sua busca com filtros avançados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Date Range Filter */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-gray-800">Filtro de Data</h3>
            </div>

            {/* Quick date filters */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setQuickDateFilter('last7days')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                  startDate && endDate &&
                  Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) <= 7
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                }`}
              >
                Últimos 7 dias
              </button>
              <button
                onClick={() => setQuickDateFilter('last30days')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                  startDate && endDate &&
                  Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) <= 30 &&
                  Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) > 7
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                }`}
              >
                Últimos 30 dias
              </button>
              <button
                onClick={() => setQuickDateFilter('thisMonth')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                  startDate && endDate &&
                  startDate.getDate() === 1 &&
                  endDate.getMonth() === new Date().getMonth()
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                }`}
              >
                Este mês
              </button>
              <button
                onClick={() => setQuickDateFilter('lastMonth')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                  startDate && endDate &&
                  startDate.getMonth() === new Date().getMonth() - 1 &&
                  startDate.getDate() === 1
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                }`}
              >
                Último mês
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Data Inicial</label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="dd/MM/yyyy"
                  locale="pt-BR"
                  placeholderText="Selecione a data"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Data Final</label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="dd/MM/yyyy"
                  locale="pt-BR"
                  placeholderText="Selecione a data"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Status de Atendimento */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-gray-800">Status de Atendimento</h3>
            </div>

            {/* Status da IA */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-3">Status da IA</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIaStatusFilter('all')}
                  className={`relative px-4 py-3 rounded-lg text-sm font-bold transition-all border-2 ${
                    iaStatusFilter === 'all'
                      ? 'bg-gray-700 text-white border-gray-700 shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md'
                  }`}
                >
                  {iaStatusFilter === 'all' && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
                  )}
                  Todas
                </button>
                <button
                  onClick={() => setIaStatusFilter('active')}
                  className={`relative px-4 py-3 rounded-lg text-sm font-bold transition-all border-2 ${
                    iaStatusFilter === 'active'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105'
                      : 'bg-white text-emerald-700 border-emerald-300 hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  {iaStatusFilter === 'active' && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
                  )}
                  IA Ativa
                </button>
                <button
                  onClick={() => setIaStatusFilter('inactive')}
                  className={`relative px-4 py-3 rounded-lg text-sm font-bold transition-all border-2 ${
                    iaStatusFilter === 'inactive'
                      ? 'bg-red-600 text-white border-red-600 shadow-lg scale-105'
                      : 'bg-white text-red-700 border-red-300 hover:border-red-400 hover:shadow-md'
                  }`}
                >
                  {iaStatusFilter === 'inactive' && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
                  )}
                  Intervenção
                </button>
              </div>
            </div>

            {/* Filtros Adicionais */}
            <div className="space-y-2">
              <button
                onClick={() => handleTabChange(activeTab === 'transfers' ? 'all' : 'transfers')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  activeTab === 'transfers'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-lg'
                    : 'bg-white text-amber-700 border-amber-300 hover:border-amber-400'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  activeTab === 'transfers'
                    ? 'bg-white border-white'
                    : 'border-amber-400'
                }`}>
                  {activeTab === 'transfers' && (
                    <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="flex-1 text-left text-sm font-bold">Transferidas</span>
              </button>

              <button
                onClick={() => {
                  setShowOnlyUnread(!showOnlyUnread);
                  if (!showOnlyUnread) handleTabChange('all');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  showOnlyUnread
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                    : 'bg-white text-blue-700 border-blue-300 hover:border-blue-400'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  showOnlyUnread
                    ? 'bg-white border-white'
                    : 'border-blue-400'
                }`}>
                  {showOnlyUnread && (
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="flex-1 text-left text-sm font-bold">Não Lidas</span>
              </button>

              <button
                onClick={() => {
                  setShowUnanswered(!showUnanswered);
                  if (!showUnanswered) handleTabChange('all');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all hover:shadow-md ${
                  showUnanswered
                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg'
                    : 'bg-white text-purple-700 border-purple-300 hover:border-purple-400'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  showUnanswered
                    ? 'bg-white border-white'
                    : 'border-purple-400'
                }`}>
                  {showUnanswered && (
                    <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="flex-1 text-left text-sm font-bold">Não Respondidas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors shadow-sm"
              >
                Limpar Tudo
              </button>
            )}
          </div>

          {/* Lead Counter */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <span className="font-bold text-blue-900">{filteredCount}</span>
              <span className="text-blue-700 ml-1">
                {filteredCount === 1 ? 'lead encontrado' : 'leads encontrados'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
