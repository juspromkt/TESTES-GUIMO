import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import brasilGeo from "../../assets/brasil-states.json";

interface StateData {
  uf: string;
  nome: string;
  leads: number;
}

interface BrazilMapSectionProps {
  stateData?: StateData[];
}

export default function BrazilMapSection({ stateData = [] }: BrazilMapSectionProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [hasError, setHasError] = useState(false);

  // Verifica se o GeoJSON é válido
  useEffect(() => {
    try {
      if (!brasilGeo || !brasilGeo.features || !Array.isArray(brasilGeo.features)) {
        console.error("GeoJSON do Brasil está inválido ou corrompido");
        setHasError(true);
      }
    } catch (error) {
      console.error("Erro ao validar GeoJSON:", error);
      setHasError(true);
    }
  }, []);

  // Dados padrão: todos os estados com 0 leads quando não houver dados
  const defaultData: StateData[] = [
    { uf: "AC", nome: "Acre", leads: 0 },
    { uf: "AL", nome: "Alagoas", leads: 0 },
    { uf: "AP", nome: "Amapá", leads: 0 },
    { uf: "AM", nome: "Amazonas", leads: 0 },
    { uf: "BA", nome: "Bahia", leads: 0 },
    { uf: "CE", nome: "Ceará", leads: 0 },
    { uf: "DF", nome: "Distrito Federal", leads: 0 },
    { uf: "ES", nome: "Espírito Santo", leads: 0 },
    { uf: "GO", nome: "Goiás", leads: 0 },
    { uf: "MA", nome: "Maranhão", leads: 0 },
    { uf: "MT", nome: "Mato Grosso", leads: 0 },
    { uf: "MS", nome: "Mato Grosso do Sul", leads: 0 },
    { uf: "MG", nome: "Minas Gerais", leads: 0 },
    { uf: "PA", nome: "Pará", leads: 0 },
    { uf: "PB", nome: "Paraíba", leads: 0 },
    { uf: "PR", nome: "Paraná", leads: 0 },
    { uf: "PE", nome: "Pernambuco", leads: 0 },
    { uf: "PI", nome: "Piauí", leads: 0 },
    { uf: "RJ", nome: "Rio de Janeiro", leads: 0 },
    { uf: "RN", nome: "Rio Grande do Norte", leads: 0 },
    { uf: "RS", nome: "Rio Grande do Sul", leads: 0 },
    { uf: "RO", nome: "Rondônia", leads: 0 },
    { uf: "RR", nome: "Roraima", leads: 0 },
    { uf: "SC", nome: "Santa Catarina", leads: 0 },
    { uf: "SP", nome: "São Paulo", leads: 0 },
    { uf: "SE", nome: "Sergipe", leads: 0 },
    { uf: "TO", nome: "Tocantins", leads: 0 },
  ];

  const data = stateData.length > 0 ? stateData : defaultData;

  // Cria um mapa de UF -> quantidade de leads
  const dataMap = new Map(data.map(d => [d.uf, d.leads]));

  // Encontra o máximo para normalizar as cores
  const maxLeads = Math.max(...data.map(d => d.leads), 1);

  // Retorna a cor baseada na quantidade de leads (em formato hex para o SVG)
  const getStateColor = (uf: string) => {
    const leads = dataMap.get(uf) || 0;
    if (leads === 0) {
      return "#e5e7eb"; // gray-200
    }
    const intensity = Math.min((leads / maxLeads) * 100, 100);

    if (intensity >= 75) return "#1d4ed8"; // blue-700
    if (intensity >= 50) return "#2563eb"; // blue-600
    if (intensity >= 25) return "#3b82f6"; // blue-500
    return "#60a5fa"; // blue-400
  };

  const handleMouseEnter = (uf: string, event: React.MouseEvent) => {
    setHoveredState(uf);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredState(null);
  };

  const getStateData = (uf: string) => {
    return data.find(d => d.uf === uf);
  };

  // Ordena os estados por quantidade de leads e filtra apenas os que têm leads > 0
  const sortedStates = [...data]
    .filter(state => state.leads > 0)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  // Calcula o total de conversas
  const totalConversas = data.reduce((sum, state) => sum + state.leads, 0);

  // Verifica se há dados reais (stateData foi fornecido e tem conteúdo)
  const hasRealData = stateData.length > 0;

  // Se houver erro, mostra mensagem
  if (hasError) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 transition-theme overflow-hidden flex flex-col h-full">
        <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100">Total de conversas por estado</h3>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">Total:</span>
            <span className="text-sm font-bold text-green-800 dark:text-green-200">{totalConversas.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-gray-500 dark:text-neutral-400 text-center">
            Erro ao carregar o mapa do Brasil. Por favor, tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 transition-theme overflow-hidden flex flex-col h-full">
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100">Total de conversas por estado</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
          <span className="text-xs font-semibold text-green-700 dark:text-green-300">Total:</span>
          <span className="text-sm font-bold text-green-800 dark:text-green-200">{totalConversas.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {/* Mapa do Brasil usando react-simple-maps - MAIOR */}
        <div className="relative w-full flex-1 flex items-center justify-center -mx-4">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 850,
              center: [-52, -14]
            }}
            width={800}
            height={600}
            style={{ width: '110%', height: '100%', maxHeight: '450px' }}
          >
            <Geographies geography={brasilGeo}>
              {({ geographies }) => {
                try {
                  if (!geographies || !Array.isArray(geographies)) {
                    console.error("Geographies não é um array válido");
                    return null;
                  }

                  return geographies.map((geo) => {
                    const uf = geo.properties?.sigla || '';
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={(e) => handleMouseEnter(uf, e as any)}
                        onMouseMove={(e) => handleMouseMove(e as any)}
                        onMouseLeave={handleMouseLeave}
                        style={{
                          default: {
                            fill: getStateColor(uf),
                            stroke: "#fff",
                            strokeWidth: 0.75,
                            outline: "none",
                          },
                          hover: {
                            fill: getStateColor(uf),
                            stroke: "#fff",
                            strokeWidth: 1.5,
                            outline: "none",
                            opacity: 0.8,
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: getStateColor(uf),
                            stroke: "#fff",
                            strokeWidth: 1.5,
                            outline: "none",
                          },
                        }}
                      />
                    );
                  });
                } catch (error) {
                  console.error("Erro ao renderizar geografias:", error);
                  setHasError(true);
                  return null;
                }
              }}
            </Geographies>
          </ComposableMap>

          {/* Tooltip */}
          {hoveredState && (
            <div
              className="fixed z-50 bg-gray-900 dark:bg-neutral-800 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
              style={{
                left: `${tooltipPosition.x + 10}px`,
                top: `${tooltipPosition.y + 10}px`,
              }}
            >
              <div className="text-sm font-bold">
                {getStateData(hoveredState)?.nome || hoveredState}
              </div>
              <div className="text-xs text-gray-300 dark:text-neutral-400">
                {getStateData(hoveredState)?.leads || 0} leads
              </div>
            </div>
          )}
        </div>

        {/* Legenda - Top 5 Estados em GRID 3 colunas - PREMIUM */}
        <div className="w-full px-3 pb-3 space-y-2">
          {!hasRealData || sortedStates.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <p className="text-sm text-gray-500 dark:text-neutral-400 text-center">
                Nenhuma conversa por estado registrada no período selecionado
              </p>
            </div>
          ) : (
            <>
          {/* Primeira linha: 3 estados */}
          <div className="grid grid-cols-3 gap-2">
          {sortedStates.slice(0, 3).map((state, index) => {
            const color = {
              gradient: "from-blue-500 to-blue-600",
              bg: "bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-950/40 dark:to-blue-900/40",
              border: "border-blue-200/60 dark:border-blue-800/60",
              text: "text-blue-900 dark:text-blue-100",
              shadow: "shadow-blue-500/20"
            };

            return (
              <div
                key={state.uf}
                className={`group relative flex items-center gap-2 ${color.bg} backdrop-blur-sm border ${color.border} rounded-xl px-3 py-2 hover:shadow-lg ${color.shadow} hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden`}
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${color.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                <div className="relative flex items-center gap-2 w-full">
                  <span className={`${color.text} text-[10px] font-bold opacity-50 flex-shrink-0`}>
                    {index + 1}º
                  </span>
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${color.gradient} flex-shrink-0 shadow-lg ring-2 ring-white/50 dark:ring-neutral-800/50`} />
                  <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
                    <span className={`${color.text} text-xs font-semibold truncate`}>
                      {state.nome}
                    </span>
                    <span className={`${color.text} text-xs font-bold opacity-60`}>
                      {state.leads}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Segunda linha: 2 estados centralizados */}
          {sortedStates.length > 3 && (
            <div className="flex justify-center gap-2">
              {sortedStates.slice(3, 5).map((state, idx) => {
                const index = idx + 3;
                const color = {
                  gradient: "from-blue-500 to-blue-600",
                  bg: "bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-950/40 dark:to-blue-900/40",
                  border: "border-blue-200/60 dark:border-blue-800/60",
                  text: "text-blue-900 dark:text-blue-100",
                  shadow: "shadow-blue-500/20"
                };

                return (
                  <div
                    key={state.uf}
                    className={`group relative flex items-center gap-2 ${color.bg} backdrop-blur-sm border ${color.border} rounded-xl px-3 py-2 hover:shadow-lg ${color.shadow} hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden flex-1 max-w-[calc(33.333%-0.333rem)]`}
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${color.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                    <div className="relative flex items-center gap-2 w-full">
                      <span className={`${color.text} text-[10px] font-bold opacity-50 flex-shrink-0`}>
                        {index + 1}º
                      </span>
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${color.gradient} flex-shrink-0 shadow-lg ring-2 ring-white/50 dark:ring-neutral-800/50`} />
                      <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
                        <span className={`${color.text} text-xs font-semibold truncate`}>
                          {state.nome}
                        </span>
                        <span className={`${color.text} text-xs font-bold opacity-60`}>
                          {state.leads}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
