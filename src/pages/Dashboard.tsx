import React, { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  BarChart as BarIcon,
  Calendar,
  Filter,
  X,
  Sparkles,
  Tags,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import ptBR from "date-fns/locale/pt-BR";

registerLocale("pt-BR", ptBR);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  PointElement,
  LineElement,
  ArcElement
);

// ==================== Sortable Funnel Card Component ====================
interface SortableFunnelCardProps {
  stage: StageDeals;
  index: number;
  percentFromFirst: string;
  color: {
    from: string;
    to: string;
    bg: string;
    border: string;
    text: string;
  };
}

function SortableFunnelCard({ stage, index, percentFromFirst, color }: SortableFunnelCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.estagio });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="group relative">
        <div className={`relative ${color.bg} border ${color.border} rounded-lg p-2.5 xl:p-3 2xl:p-3.5 hover:shadow-md transition-all ${isDragging ? 'shadow-2xl ring-2 ring-purple-400' : ''}`}>
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center gap-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4 xl:w-5 xl:h-5 text-gray-400 dark:text-neutral-500" />
              <div className={`w-7 h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 rounded-lg bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center`}>
                <span className="text-white font-bold text-xs xl:text-sm">{index + 1}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-xs xl:text-sm 2xl:text-base ${color.text} truncate`}>
                {stage.estagio}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] xl:text-xs text-gray-500 dark:text-neutral-400">Taxa de conversão:</span>
                <span className={`text-[10px] xl:text-xs font-bold ${color.text}`}>{percentFromFirst}%</span>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="text-base xl:text-lg 2xl:text-xl font-bold text-gray-900 dark:text-neutral-100">{stage.quantidade}</div>
              <div className="text-[9px] xl:text-[10px] text-gray-500 dark:text-neutral-400">contatos</div>
            </div>
          </div>

          <div className="mt-2">
            <div className="relative h-1.5 xl:h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color.from} ${color.to} rounded-full transition-all duration-500`}
                style={{ width: `${percentFromFirst}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Types ====================
interface DealMetrics {
  quantidade: number;
  quantidadeMedia: number;
}

interface DailyDeals {
  dia: string;
  qtdLeads: number;
}

interface StageDeals {
  estagio: string;
  quantidade: number;
}

interface TagCount {
  id_tag: number;
  nome: string;
  quantidade: number;
}

// ==================== Utils ====================
const buildDateRange = (start: string, end: string) => {
  const out: string[] = [];
  // Adiciona T00:00:00 para forçar horário local
  const d = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (d <= last) {
    // Formata data no horário local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push(`${year}-${month}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const formatBR = (d: string) => {
  // Adiciona T00:00:00 para forçar horário local
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

// 🔹 Clareia cor e converte rgba ou hex
function lightenColor(color: string, percent: number) {
  try {
    if (color.startsWith("rgba")) {
      const parts = color.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 1];
      const [r, g, b, a] = parts;
      const amt = percent * 255;
      return `rgba(${Math.min(r + amt, 255)}, ${Math.min(
        g + amt,
        255
      )}, ${Math.min(b + amt, 255)}, ${a})`;
    }
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * (percent * 100));
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  } catch {
    return color;
  }
}

// ==================== Component ====================
export default function Dashboard() {
  // Função auxiliar para formatar data no horário local (sem conversão UTC)
  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);

  const [startDate, setStartDate] = useState(toLocalDateString(defaultStart));
  const [endDate, setEndDate] = useState(toLocalDateString(defaultEnd));
  const [dealMetrics, setDealMetrics] = useState<DealMetrics>({
    quantidade: 0,
    quantidadeMedia: 0,
  });
  const [dailyDeals, setDailyDeals] = useState<DailyDeals[]>([]);
  const [stageDeals, setStageDeals] = useState<StageDeals[]>([]);
  const [orderedFunnelStages, setOrderedFunnelStages] = useState<StageDeals[]>([]);
  const [tagCounts, setTagCounts] = useState<TagCount[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // Novos estados para métricas avançadas
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState<DealMetrics>({
    quantidade: 0,
    quantidadeMedia: 0,
  });

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchData();
    fetchPreviousPeriodData();
    fetchTagCounts();
  }, [startDate, endDate]);

  // Buscar funis e etapas para obter a ordem correta
  const fetchFunnelStages = async () => {
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
        headers: { token }
      });

      if (!response.ok) return;

      const funis = await response.json();

      // Pega o funil padrão
      const defaultFunnel = funis.find((f: any) => f.isFunilPadrao);

      if (defaultFunnel && defaultFunnel.estagios) {
        // Ordena etapas pela ordem configurada
        const sortedStages = [...defaultFunnel.estagios].sort((a: any, b: any) => a.ordem - b.ordem);

        // Retorna a ordem dos nomes das etapas
        return sortedStages.map((e: any) => e.nome);
      }
    } catch (error) {
      console.error('Erro ao buscar ordem das etapas:', error);
    }
    return null;
  };

  // Sincroniza orderedFunnelStages com stageDeals quando dados são carregados
  useEffect(() => {
    const orderStages = async () => {
      if (stageDeals.length > 0) {
        // Busca ordem do funil configurado
        const funnelOrder = await fetchFunnelStages();

        if (funnelOrder) {
          // Reorganiza stageDeals de acordo com a ordem do funil
          const reordered = funnelOrder
            .map(estagioNome => stageDeals.find(stage => stage.estagio === estagioNome))
            .filter((stage): stage is StageDeals => stage !== undefined);

          // Adiciona stages que não estão no funil (novos ou sem correspondência)
          const newStages = stageDeals.filter(
            stage => !funnelOrder.includes(stage.estagio)
          );

          setOrderedFunnelStages([...reordered, ...newStages]);
        } else {
          setOrderedFunnelStages(stageDeals);
        }
      }
    };

    orderStages();
  }, [stageDeals]);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const body = { dataInicio: startDate, dataFinal: endDate };
      const res = await fetch("https://n8n.lumendigital.com.br/webhook/relatorio/crm/jus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { token } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const crm = Array.isArray(data)
        ? data.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {})
        : data ?? {};

      setDealMetrics({
        quantidade: Number(crm.qtdNegociacoes) || 0,
        quantidadeMedia: Number(crm.qtdMediaNegociacoesDia) || 0,
      });
      setDailyDeals(Array.isArray(crm.negociacoesUltimos7Dias) ? crm.negociacoesUltimos7Dias : []);
      setStageDeals(Array.isArray(crm.negociacoesAbertasPorEstagio) ? crm.negociacoesAbertasPorEstagio : []);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPreviousPeriodData = async () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = end.getTime() - start.getTime();
      const previousEnd = new Date(start.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - diff);

      const body = {
        dataInicio: previousStart.toISOString().slice(0, 10),
        dataFinal: previousEnd.toISOString().slice(0, 10),
      };

      const res = await fetch("https://n8n.lumendigital.com.br/webhook/relatorio/crm/jus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { token } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const crm = Array.isArray(data)
        ? data.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {})
        : data ?? {};

      setPreviousPeriodMetrics({
        quantidade: Number(crm.qtdNegociacoes) || 0,
        quantidadeMedia: Number(crm.qtdMediaNegociacoesDia) || 0,
      });
    } catch (err) {
      console.error("Erro ao buscar período anterior:", err);
    }
  };

  const fetchTagCounts = async () => {
    try {
      const [tagsRes, assocRes] = await Promise.all([
        fetch("https://n8n.lumendigital.com.br/webhook/prospecta/tag/list", { headers: { token } }),
        fetch("https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/list", { headers: { token } }),
      ]);

      const tagsData = tagsRes.ok ? await tagsRes.json() : [];
      const assocData = assocRes.ok ? await assocRes.json() : [];
      const counts: Record<number, number> = {};
      assocData.forEach((rel: { id_negociacao: number | number[]; id_tag: number }) => {
        const qtd = Array.isArray(rel.id_negociacao) ? rel.id_negociacao.length : 1;
        counts[rel.id_tag] = (counts[rel.id_tag] || 0) + qtd;
      });
      const tagsList: TagCount[] = (Array.isArray(tagsData) ? tagsData : []).map((t: any) => ({
        id_tag: t.Id,
        nome: t.nome,
        quantidade: counts[t.Id] || 0,
      }));
      const topTags = tagsList.sort((a, b) => b.quantidade - a.quantidade).slice(0, 8);
      setTagCounts(topTags);
    } catch (err) {
      console.error("Erro ao buscar etiquetas:", err);
      setTagCounts([]);
    }
  };

  // filtros rápidos
  const setToday = () => {
    const t = toLocalDateString(new Date());
    setStartDate(t);
    setEndDate(t);
  };
  const setLast7 = () => {
    const e = new Date(), s = new Date(); s.setDate(s.getDate() - 7);
    setStartDate(toLocalDateString(s)); setEndDate(toLocalDateString(e));
  };
  const setLast30 = () => {
    const e = new Date(), s = new Date(); s.setDate(s.getDate() - 30);
    setStartDate(toLocalDateString(s)); setEndDate(toLocalDateString(e));
  };
  const setThisMonth = () => {
    const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth(), 1);
    const e = new Date(n.getFullYear(), n.getMonth() + 1, 0);
    setStartDate(toLocalDateString(s)); setEndDate(toLocalDateString(e));
  };
  const setLastMonth = () => {
    const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    const e = new Date(n.getFullYear(), n.getMonth(), 0);
    setStartDate(toLocalDateString(s)); setEndDate(toLocalDateString(e));
  };
  const clearFilters = () => {
    const e = new Date(), s = new Date(); s.setDate(s.getDate() - 30);
    setStartDate(toLocalDateString(s)); setEndDate(toLocalDateString(e));
  };

  // ==================== Drag and Drop Handler ====================
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setOrderedFunnelStages((items) => {
        const oldIndex = items.findIndex((item) => item.estagio === active.id);
        const newIndex = items.findIndex((item) => item.estagio === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // ==================== Métricas Avançadas ====================
  const growthRate = useMemo(() => {
    if (previousPeriodMetrics.quantidade === 0) return 0;
    return ((dealMetrics.quantidade - previousPeriodMetrics.quantidade) / previousPeriodMetrics.quantidade) * 100;
  }, [dealMetrics, previousPeriodMetrics]);

  const peakDay = useMemo(() => {
    if (dailyDeals.length === 0) return null;
    return dailyDeals.reduce((max, day) => day.qtdLeads > max.qtdLeads ? day : max, dailyDeals[0]);
  }, [dailyDeals]);

  const totalActiveStages = stageDeals.filter(s => s.quantidade > 0).length;

  const conversionRate = useMemo(() => {
    if (stageDeals.length < 2) return 0;
    const firstStage = stageDeals[0]?.quantidade || 0;
    const lastStage = stageDeals[stageDeals.length - 1]?.quantidade || 0;
    if (firstStage === 0) return 0;
    return (lastStage / firstStage) * 100;
  }, [stageDeals]);


  // ==================== Gráficos ====================
  const dateRange = useMemo(
    () =>
      !startDate || !endDate
        ? dailyDeals.map((d) => d.dia)
        : buildDateRange(startDate, endDate),
    [startDate, endDate, dailyDeals]
  );

  const dealsByDay = new Map(dailyDeals.map((d) => [d.dia, d.qtdLeads]));
  const dailyValues = dateRange.map((d) => dealsByDay.get(d) ?? 0);

  const lineData = {
    labels: dateRange.map(formatBR),
    datasets: [
      {
        label: "Volume de conversas",
        data: dailyValues,
        borderColor: "#2563eb",
        borderWidth: 2.5,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#2563eb",
        fill: true,
        backgroundColor: (ctx: any) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(37,99,235,0.3)";
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(37,99,235,0.65)");
          g.addColorStop(0.8, "rgba(59,130,246,0.25)");
          g.addColorStop(1, "rgba(59,130,246,0)");
          return g;
        },
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(148,163,184,0.15)" } },
      x: { grid: { display: false } },
    },
  };

  // ==================== ETIQUETAS ====================
  const sortedTags = [...tagCounts].sort((a, b) => b.quantidade - a.quantidade);
  const MAX_TAGS = 6;
  const mainTags = sortedTags.slice(0, MAX_TAGS);
  const othersTotal = sortedTags.slice(MAX_TAGS).reduce((a, t) => a + t.quantidade, 0);
  const finalTags =
    othersTotal > 0
      ? [...mainTags, { id_tag: 0, nome: "Outros", quantidade: othersTotal }]
      : mainTags;

  const tagLabels = finalTags.map((t) => t.nome);
  const tagValues = finalTags.map((t) => t.quantidade);
  const totalTags = tagValues.reduce((a, b) => a + b, 0);

  // 🌈 Cores harmônicas
  const tagColors = [
    "rgba(59,130,246,0.9)",
    "rgba(99,102,241,0.9)",
    "rgba(56,189,248,0.9)",
    "rgba(34,197,94,0.9)",
    "rgba(250,204,21,0.9)",
    "rgba(244,114,182,0.9)",
    "rgba(239,68,68,0.9)",
  ];

  const tagsData = {
    labels: tagLabels,
    datasets: [
      {
        data: tagValues,
        backgroundColor: tagColors.slice(0, finalTags.length),
        borderColor: "rgba(255,255,255,0.9)",
        borderWidth: 2,
        hoverBackgroundColor: tagColors
          .slice(0, finalTags.length)
          .map((c) => lightenColor(c, 0.25)),
        hoverBorderColor: "#fff",
        hoverBorderWidth: 4,
        hoverOffset: 12,
      },
    ],
  };

  const tagsOptions = {
    responsive: true,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(17,24,39,0.9)",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        cornerRadius: 10,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => {
            const v = ctx.raw;
            const p = ((v / totalTags) * 100).toFixed(1);
            return `${ctx.label}: ${v.toLocaleString()} (${p}%)`;
          },
        },
      },
    },
    animation: { animateRotate: true, animateScale: true, duration: 1200, easing: "easeOutQuart" as const },
    hover: {
      mode: "nearest" as const,
      animationDuration: 400,
      onHover: (e: any, els: any[]) => {
        const canvas = e?.native?.target || e.target;
        canvas.style.cursor = els.length ? "pointer" : "default";
        if (els.length) {
          const i = els[0].index;
          const color = tagColors[i % tagColors.length];
          canvas.style.filter = `drop-shadow(0 0 15px ${lightenColor(color, 0.4)})`;
          canvas.style.transform = "scale(1.03)";
        } else {
          canvas.style.filter = "none";
          canvas.style.transform = "scale(1)";
        }
      },
    },
  };


  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pt-14 md:pt-0 pb-4 transition-theme">
      {/* Header Compacto */}
      <div className="px-3 md:px-4 pt-3 md:pt-4 pb-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 transition-theme">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-neutral-100">Dashboard</h1>
            <p className="text-xs text-gray-500 dark:text-neutral-400 -mt-0.5">Visão geral das conversas e contatos</p>
          </div>
          {isRefreshing && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 whitespace-nowrap">
              Atualizando…
            </span>
          )}
        </div>

        <button
          onClick={() => setShowDateModal(true)}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-neutral-600 px-3 py-2 bg-white dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-600 transition-theme text-sm font-medium text-gray-700 dark:text-neutral-200"
        >
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Selecionar Data</span>
        </button>
      </div>

      {/* Layout Principal: KPIs + Alertas + Volume || Etiquetas || Funil */}
      <div className="px-3 md:pl-4 md:pr-0 py-3 grid grid-cols-1 lg:grid-cols-[1fr_340px_450px] xl:grid-cols-[1fr_380px_500px] 2xl:grid-cols-[1fr_420px_550px] gap-3">

        {/* Coluna Esquerda: KPIs + Alertas + Volume */}
        <div className="flex flex-col gap-3">

          {/* KPIs Compactos (3 colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Total de Contatos com comparação */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-theme">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide">Total</p>
                {growthRate !== 0 && (
                  <div className={`flex items-center gap-0.5 ${growthRate > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {growthRate > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span className="text-xs font-bold">{Math.abs(growthRate).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <p className="text-2xl md:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-neutral-100">{dealMetrics.quantidade.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                {growthRate > 0 ? '+' : ''}{(dealMetrics.quantidade - previousPeriodMetrics.quantidade).toLocaleString()} vs anterior
              </p>
            </div>

            {/* Média Diária */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-theme">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Média Diária</p>
              <p className="text-2xl md:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-neutral-100">{dealMetrics.quantidadeMedia.toFixed(2)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Contatos/dia</p>
            </div>

            {/* Pico de Atividade */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-3 border border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-600 transition-theme">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Pico</p>
              </div>
              <p className="text-2xl md:text-3xl xl:text-4xl font-bold text-gray-900 dark:text-neutral-100">
                {peakDay ? peakDay.qtdLeads : 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                {peakDay ? `${formatBR(peakDay.dia)}` : 'Sem dados'}
              </p>
            </div>
          </div>

          {/* ==================== ALERTAS INTELIGENTES ==================== */}
          {(growthRate < -10 || growthRate > 20 || (peakDay && peakDay.qtdLeads > dealMetrics.quantidadeMedia * 1.5)) && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 transition-theme">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2">Insights</h4>
                  <div className="space-y-2">
                    {growthRate < -10 && (
                      <div className="flex items-start gap-2">
                        <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-neutral-300">
                          <span className="font-semibold">Queda de {Math.abs(growthRate).toFixed(1)}%</span> vs período anterior
                        </p>
                      </div>
                    )}
                    {growthRate > 20 && (
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-neutral-300">
                          <span className="font-semibold">Crescimento de {growthRate.toFixed(1)}%!</span> Excelente performance
                        </p>
                      </div>
                    )}
                    {peakDay && peakDay.qtdLeads > dealMetrics.quantidadeMedia * 1.5 && (
                      <div className="flex items-start gap-2">
                        <Activity className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 dark:text-neutral-300">
                          Pico de <span className="font-semibold">{peakDay.qtdLeads} contatos</span> em {formatBR(peakDay.dia)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de Volume */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 transition-theme overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
              <div className="w-7 h-7 bg-blue-50 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-neutral-100">Volume de conversas</h3>
            </div>
            <div className="p-3 sm:p-4">
              <div className="h-48 sm:h-56 md:h-64 xl:h-72 2xl:h-80">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>
          </div>

        </div>

        {/* Etiquetas Centro (Meio) */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 transition-theme overflow-hidden flex flex-col">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
            <div className="w-7 h-7 bg-gradient-to-tr from-pink-100 to-blue-50 dark:from-pink-950 dark:to-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
              <Tags className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-neutral-100">Etiquetas</h3>
          </div>

          <div className="p-3 sm:p-4 flex-1 flex flex-col items-center justify-center">
            {tagCounts.length > 0 ? (
              <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
                {/* Donut Chart */}
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 xl:w-52 xl:h-52 2xl:w-60 2xl:h-60">
                  <Doughnut data={tagsData} options={tagsOptions} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-neutral-400 font-semibold uppercase">Total</p>
                    <p className="text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-800 dark:text-neutral-100">{totalTags.toLocaleString()}</p>
                  </div>
                </div>
                {/* Legenda */}
                <div className="flex flex-col gap-1.5 w-full">
                  {finalTags.slice(0, 4).map((tag, i) => {
                    const percent = totalTags > 0 ? ((tag.quantidade / totalTags) * 100).toFixed(1) : 0;
                    return (
                      <div
                        key={tag.id_tag}
                        className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-600 transition-theme"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: tagColors[i % tagColors.length] }}
                          />
                          <span className="text-gray-800 dark:text-neutral-200 text-sm font-medium truncate">{tag.nome}</span>
                        </div>
                        <div className="text-gray-700 dark:text-neutral-300 text-sm font-bold whitespace-nowrap ml-2">
                          {tag.quantidade} <span className="text-gray-400 dark:text-neutral-500 text-xs">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                  {finalTags.length > 4 && (
                    <p className="text-xs text-gray-500 dark:text-neutral-400 text-center mt-1">
                      +{finalTags.length - 4} etiquetas
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-neutral-400 text-center py-6">Nenhuma etiqueta disponível.</p>
            )}
          </div>
        </div>

        {/* Funil de Conversão (Direita) */}
        {orderedFunnelStages.length > 0 && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 transition-theme overflow-hidden">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-neutral-100">Funil de Conversão</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">De {dealMetrics.quantidade} leads totais</p>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div
                className="p-3 sm:p-4 overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 250px)', WebkitOverflowScrolling: 'touch' }}
              >
                <SortableContext
                  items={orderedFunnelStages.map(stage => stage.estagio)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {orderedFunnelStages.map((stage, i) => {
                      const totalLeads = dealMetrics.quantidade || 1;
                      const percentFromFirst = ((stage.quantidade / totalLeads) * 100).toFixed(1);

                      const colors = [
                        { from: 'from-blue-500', to: 'to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
                        { from: 'from-cyan-500', to: 'to-teal-500', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300' },
                        { from: 'from-teal-500', to: 'to-emerald-500', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-300' },
                        { from: 'from-emerald-500', to: 'to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
                        { from: 'from-green-500', to: 'to-lime-500', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' },
                        { from: 'from-lime-500', to: 'to-yellow-500', bg: 'bg-lime-50 dark:bg-lime-950/30', border: 'border-lime-200 dark:border-lime-800', text: 'text-lime-700 dark:text-lime-300' },
                        { from: 'from-yellow-500', to: 'to-amber-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-300' },
                        { from: 'from-amber-500', to: 'to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
                      ];
                      const color = colors[i % colors.length];

                      return (
                        <SortableFunnelCard
                          key={stage.estagio}
                          stage={stage}
                          index={i}
                          percentFromFirst={percentFromFirst}
                          color={color}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </div>
            </DndContext>
          </div>
        )}

      </div>

      {/* ==================== MODAL DE PERÍODO ==================== */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 transition-theme p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-neutral-800 rounded-2xl transition-theme shadow-2xl border border-gray-300 dark:border-neutral-600 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-900 border-b border-gray-300 dark:border-neutral-700 transition-theme flex-shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700 dark:text-blue-400 flex-shrink-0" />
                <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-neutral-100 truncate">
                  Selecionar Período
                </h3>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 active:bg-gray-200 dark:active:bg-neutral-600 transition-theme transition-colors touch-manipulation flex-shrink-0"
                onClick={() => setShowDateModal(false)}
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-neutral-300" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-6 bg-gray-50 dark:bg-neutral-900 transition-theme overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Coluna de filtros rápidos */}
              <div className="flex flex-col gap-2">
                <p className="text-xs md:text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Filtro rápido</p>
                <button
                  onClick={() => {
                    setToday();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm text-gray-700 dark:text-neutral-200 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-600 transition-theme active:bg-blue-100 dark:active:bg-neutral-500 hover:border-blue-200 active:scale-[0.98] transition-all touch-manipulation text-left"
                >
                  Hoje
                </button>
                <button
                  onClick={() => {
                    setLast7();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm text-gray-700 dark:text-neutral-200 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-600 transition-theme active:bg-blue-100 dark:active:bg-neutral-500 hover:border-blue-200 active:scale-[0.98] transition-all touch-manipulation text-left"
                >
                  Últimos 7 dias
                </button>
                <button
                  onClick={() => {
                    setLast30();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm text-gray-700 dark:text-neutral-200 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-600 transition-theme active:bg-blue-100 dark:active:bg-neutral-500 hover:border-blue-200 active:scale-[0.98] transition-all touch-manipulation text-left"
                >
                  Últimos 30 dias
                </button>
                <button
                  onClick={() => {
                    setThisMonth();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm text-gray-700 dark:text-neutral-200 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-600 transition-theme active:bg-blue-100 dark:active:bg-neutral-500 hover:border-blue-200 active:scale-[0.98] transition-all touch-manipulation text-left"
                >
                  Este mês
                </button>
                <button
                  onClick={() => {
                    setLastMonth();
                    setShowDateModal(false);
                  }}
                  className="px-3 py-2.5 text-sm text-gray-700 dark:text-neutral-200 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 hover:bg-blue-50 dark:hover:bg-neutral-600 transition-theme active:bg-blue-100 dark:active:bg-neutral-500 hover:border-blue-200 active:scale-[0.98] transition-all touch-manipulation text-left"
                >
                  Mês passado
                </button>

                {/* Separador */}
                <div className="border-t border-gray-300 dark:border-neutral-600 my-1"></div>

                {/* Botão Limpar Filtros */}
                <button
                  onClick={clearFilters}
                  className="px-3 py-2.5 text-sm rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 active:bg-red-200 dark:active:bg-red-800 hover:border-red-400 active:scale-[0.98] transition-all touch-manipulation text-left font-semibold"
                >
                  Limpar Filtros
                </button>
              </div>

              {/* Coluna de seleção manual */}
              <div className="md:col-span-2 bg-white dark:bg-neutral-800 rounded-xl p-4 md:p-5 border border-gray-300 dark:border-neutral-600 transition-theme shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-neutral-300 mb-1.5 block">
                      Data inicial
                    </label>
                    <DatePicker
                      selected={startDate ? new Date(startDate + 'T00:00:00') : null}
                      onChange={(date: Date | null) =>
                        setStartDate(
                          date ? toLocalDateString(date) : startDate
                        )
                      }
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2.5 text-sm md:text-base text-gray-900 dark:text-neutral-100 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                      placeholderText="Selecione a data inicial"
                      dropdownMode="select"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-neutral-300 mb-1.5 block">
                      Data final
                    </label>
                    <DatePicker
                      selected={endDate ? new Date(endDate + 'T00:00:00') : null}
                      onChange={(date: Date | null) =>
                        setEndDate(
                          date ? toLocalDateString(date) : endDate
                        )
                      }
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2.5 text-sm md:text-base text-gray-900 dark:text-neutral-100 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                      placeholderText="Selecione a data final"
                      dropdownMode="select"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setShowDateModal(false)}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all shadow-sm touch-manipulation"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ Efeito de brilho suave no hover do gráfico */}
      <style>{`
        canvas {
          transition: filter 0.4s ease, transform 0.4s ease;
        }
        canvas:hover {
          filter: drop-shadow(0 0 10px rgba(59,130,246,0.3))
                  drop-shadow(0 0 15px rgba(99,102,241,0.2))
                  drop-shadow(0 0 20px rgba(244,114,182,0.2));
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}
