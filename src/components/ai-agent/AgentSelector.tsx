import { Plus, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
  isAgentePrincipal?: boolean;
  isGatilho?: boolean;
  gatilho?: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => void;
  onCreateAgent: () => void;
  onUpdateAgent: () => void;
  canEdit: boolean;
}

export default function AgentSelector({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateAgent,
  onUpdateAgent,
  canEdit
}: AgentSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [agents]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 300;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative">
      {/* Scroll Controls */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      )}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Agent Cards Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-8"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {agents.map((agent) => {
          const isSelected = selectedAgentId === agent.Id;
          return (
            <button
              key={agent.Id}
              onClick={() => onSelectAgent(agent.Id)}
              className={`flex-shrink-0 group relative px-4 py-3 rounded-xl border-2 transition-all min-w-[200px] ${
                isSelected
                  ? 'border-gray-800 bg-gray-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              {/* Status Indicator */}
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                agent.isAtivo ? 'bg-emerald-500' : 'bg-gray-300'
              }`} />

              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className={`text-sm font-semibold truncate ${
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {agent.nome}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {agent.isAgentePrincipal && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      Principal
                    </span>
                  )}
                  {agent.isGatilho && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Gatilho
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex-shrink-0 flex gap-2">
            <button
              onClick={onCreateAgent}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 transition-all min-w-[140px] group"
            >
              <Plus className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                Novo
              </span>
            </button>

            {selectedAgentId && (
              <button
                onClick={onUpdateAgent}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 transition-all min-w-[140px] group"
              >
                <Edit2 className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                  Editar
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
