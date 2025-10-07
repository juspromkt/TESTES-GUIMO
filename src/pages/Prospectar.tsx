import React, { useState, useEffect } from 'react';
import ProspectarForm from '../components/prospectar/ProspectarForm';
import ProspectarHistory from '../components/prospectar/ProspectarHistory';
import DirectDispatchHistory from '../components/prospectar/DirectDispatchHistory';
import { hasPermission } from '../utils/permissions';

type TabType = 'prospectar' | 'disparo-direto';

export default function Prospectar() {
  const canViewBusca = hasPermission('can_view_prospeccao_busca');
  const canViewDd = hasPermission('can_view_prospeccao_dd');
  const [activeTab, setActiveTab] = useState<TabType>(canViewBusca ? 'prospectar' : 'disparo-direto');
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleProspeccaoCreated = () => setHistoryRefresh((prev) => prev + 1);

  useEffect(() => {
    if (activeTab === 'prospectar' && (!canViewBusca)) {
      if (canViewDd) setActiveTab('disparo-direto');
    } else if (activeTab === 'disparo-direto' && !canViewDd) {
      if (canViewBusca) setActiveTab('prospectar');
    }
  }, [activeTab, canViewBusca, canViewDd]);

  return (
    <div className="max-w-[1400px] space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {canViewBusca && (
          <button
            onClick={() => setActiveTab('prospectar')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'prospectar'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Prospectar
          </button>
        )}
        {canViewDd && (
        <button
          onClick={() => setActiveTab('disparo-direto')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'disparo-direto'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Disparo Direto
        </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'prospectar' && canViewBusca ? (
        <>
          <ProspectarForm onProspeccaoCreated={handleProspeccaoCreated} />
          <ProspectarHistory refreshTrigger={historyRefresh} />
        </>
      ) : null}
      {activeTab === 'disparo-direto' && canViewDd && (
        <DirectDispatchHistory />
      )}
    </div>
  );
}