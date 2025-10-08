import React, { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Calendar,
  AlertCircle,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { hasPermission } from "../utils/permissions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// ==================== Types ====================
interface DashboardMetrics {
  isWhatsAppAtivo: boolean;
  tokens: number;
  disparoEmAndamento: boolean;
  qtdDisparosJaRealizados?: number;
  numeroLeads: number;
  numeroProspeccoes: number;
  numeroDisparos: number;
}

interface DealMetrics {
  quantidade: number;
  valorMedio: number;
  quantidadeMedia: number;
  receitaGanha: number;
  receitaPerdida: number;
  qtdContatos: number;
  tokensGerais: number;
}

interface DailyDeals {
  dia: string;
  qtdLeads: number;
}

interface StageDeals {
  estagio: string;
  quantidade: number;
}

type LabeledValue = { label: string; value: number };

// ==================== Constants ====================
const CACHE_KEY = "dashboard_simple_v2";
const CACHE_EXPIRY = 3 * 60 * 1000;

// ==================== Utils ====================
const buildDateRange = (start: string, end: string) => {
  const out: string[] = [];
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const formatBR = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

// ==================== Component ====================
export default function Dashboard() {
  const canViewCRMDashboard = hasPermission("can_view_dashboard_crm");

  // datas padrão: últimos 30 dias
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);

  const [startDate, setStartDate] = useState<string | null>(
    defaultStart.toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string | null>(
    defaultEnd.toISOString().slice(0, 10)
  );

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    isWhatsAppAtivo: false,
    tokens: 0,
    disparoEmAndamento: false,
    numeroLeads: 0,
    numeroProspeccoes: 0,
    numeroDisparos: 0,
  });
  const [dealMetrics, setDealMetrics] = useState<DealMetrics>({
    quantidade: 0,
    valorMedio: 0,
    quantidadeMedia: 0,
    receitaGanha: 0,
    receitaPerdida: 0,
    qtdContatos: 0,
    tokensGerais: 0,
  });
  const [dailyDeals, setDailyDeals] = useState<DailyDeals[]>([]);
  const [stageDeals, setStageDeals] = useState<StageDeals[]>([]);
  const [etiquetas, setEtiquetas] = useState<LabeledValue[]>([]);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  // cache
  const tryLoadCache = () => {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    try {
      const c = JSON.parse(raw);
      const fresh = Date.now() - c.timestamp < CACHE_EXPIRY;
      if (fresh) {
        setMetrics(c.metrics);
        setDealMetrics(c.dealMetrics);
        setDailyDeals(c.dailyDeals);
        setStageDeals(c.stageDeals);
        setEtiquetas(c.etiquetas);
        return true;
      }
    } catch {}
    return false;
  };

  const saveCache = (data: any) => {
    const payload = {
      timestamp: Date.now(),
      startDate,
      endDate,
      ...data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  };

  useEffect(() => {
    const hadCache = tryLoadCache();
    fetchData(true, hadCache);
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [startDate, endDate]);

  // fetch principal
  const fetchData = async (light = true, ignoreLoading = false) => {
    try {
      if (light && !ignoreLoading) setIsRefreshing(true);
      setError("");

      const body: any = {};
      if (startDate) body.dataInicio = startDate;
      if (endDate) body.dataFinal = endDate;

      const res = await fetch(
        "https://n8n.lumendigital.com.br/webhook/relatorio/crm/jus",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { token } : {}),
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      const crm = Array.isArray(data)
        ? data.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {})
        : data ?? {};

      const newMetrics: DashboardMetrics = {
        isWhatsAppAtivo: !!crm.isWhatsAppAtivo,
        tokens: Number(crm.tokens) || 0,
        disparoEmAndamento: !!crm.disparoEmAndamento,
        qtdDisparosJaRealizados: Number(crm.qtdDisparosJaRealizados) || 0,
        numeroLeads: Number(crm.qtdContatos) || 0,
        numeroProspeccoes: 0,
        numeroDisparos: Number(crm.qtdDisparosJaRealizados) || 0,
      };

      const newDeal: DealMetrics = {
        quantidade: Number(crm.qtdNegociacoes) || 0,
        qtdContatos: Number(crm.qtdContatos) || 0,
        tokensGerais: Number(crm.tokens) || 0,
        valorMedio: Number(crm.valorMedioNegociacoes) || 0,
        quantidadeMedia: Number(crm.qtdMediaNegociacoesDia) || 0,
        receitaGanha: Number(crm.receita_ganha) || 0,
        receitaPerdida: Number(crm.receita_perdida) || 0,
      };

      const newDaily: DailyDeals[] = Array.isArray(crm.negociacoesUltimos7Dias)
        ? crm.negociacoesUltimos7Dias
        : [];
      const newStages: StageDeals[] = Array.isArray(
        crm.negociacoesAbertasPorEstagio
      )
        ? crm.negociacoesAbertasPorEstagio
        : [];
      const newEtiquetas: LabeledValue[] = Array.isArray(crm.etiquetas)
        ? crm.etiquetas
        : [];

      setMetrics(newMetrics);
      setDealMetrics(newDeal);
      setDailyDeals(newDaily);
      setStageDeals(newStages);
      setEtiquetas(newEtiquetas);

      saveCache({
        metrics: newMetrics,
        dealMetrics: newDeal,
        dailyDeals: newDaily,
        stageDeals: newStages,
        etiquetas: newEtiquetas,
      });
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar informações do dashboard");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ===== Volume de conversas =====
  const dateRange = useMemo(() => {
    if (!startDate || !endDate) return dailyDeals.map((d) => d.dia);
    return buildDateRange(startDate, endDate);
  }, [startDate, endDate, dailyDeals]);

  const dealsByDay = new Map(dailyDeals.map((d) => [d.dia, d.qtdLeads]));
  const dailyValues = dateRange.map((d) => dealsByDay.get(d) ?? 0);

  const lineData = {
    labels: dateRange.map(formatBR),
    datasets: [
      {
        label: "Volume de conversas",
        data: dailyValues,
        borderColor: "#1d4ed8",
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        backgroundColor: (ctx: any) => {
          const { chart } = ctx;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(29,78,216,0.25)";
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(29,78,216,0.25)");
          g.addColorStop(1, "rgba(29,78,216,0.02)");
          return g;
        },
      },
    ],
  };

  const lineOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.7)",
        titleFont: { size: 12 },
        bodyFont: { size: 13 },
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `${ctx.parsed.y.toLocaleString()} conversas`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: "#94a3b8", font: { size: 11 } },
        grid: { color: "rgba(148,163,184,0.15)" },
      },
      x: {
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  // Status
  const statusLabels = stageDeals.map((s) => s.estagio);
  const statusValues = stageDeals.map((s) => s.quantidade || 0);
  const statusData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: "#0ea5e9",
        borderRadius: 999,
        borderSkipped: false,
        barThickness: 18,
      },
    ],
  };
  const statusOptions: any = {
    indexAxis: "y",
    plugins: { legend: { display: false }, tooltip: { intersect: false } },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { precision: 0 } },
      y: { grid: { display: false } },
    },
  };

  // Etiquetas
  const etiquetasData = {
    labels: etiquetas.map((e) => e.label),
    datasets: [
      {
        data: etiquetas.map((e) => e.value),
        backgroundColor: [
          "#8b5cf6",
          "#f43f5e",
          "#22c55e",
          "#60a5fa",
          "#f59e0b",
          "#06b6d4",
          "#d946ef",
        ],
        borderColor: "#fff",
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };
  const etiquetasOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "right" } },
    cutout: "60%",
  };

  // atalhos de período
  const setToday = () => {
    const d = new Date();
    const v = d.toISOString().slice(0, 10);
    setStartDate(v);
    setEndDate(v);
  };
  const setLast7 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };
  const setLast30 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };
  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };
  const setLastMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  if (!canViewCRMDashboard) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)] px-6">
        <div className="text-center text-gray-700 bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <p className="font-medium">
            Você não tem permissão para visualizar o Dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)] px-6">
        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl p-6">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p className="font-medium">{error}</p>
          <p className="text-sm text-red-500 mt-1">
            Tente novamente em alguns instantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 -mt-0.5">
                Visão geral das conversas e contatos
              </p>
            </div>
            {isRefreshing && (
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Atualizando…
              </span>
            )}
          </div>

          {/* Filtro de período */}
          <button
            onClick={() => setShowDateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50 shadow-sm"
          >
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Período</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                  Média Diária
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dealMetrics.quantidadeMedia.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 text-blue-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Contatos/dia</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Total de Contatos
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dealMetrics.quantidade.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="px-6 pb-10">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
          {/* Left */}
          <div className="space-y-6">
            {/* Conversas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <BarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Volume de conversas
                </h3>
              </div>
              <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="h-80">
                  {lineData.labels.length ? (
                    <Line data={lineData} options={lineOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      Sem dados para o período selecionado.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Etiquetas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <PieIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Etiquetas</h3>
              </div>
              <div className="px-6 pb-6">
                {etiquetasData.datasets[0].data.some((v) => v > 0) ? (
                  <div className="mx-auto" style={{ width: 240, height: 240 }}>
                    <Doughnut data={etiquetasData} options={etiquetasOptions} />
                  </div>
                ) : (
                  <div className="h-44 flex items-center justify-center text-sm text-gray-500">
                    Nenhum dado de etiquetas no período.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Status */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Status</h3>
              </div>
              <div className="p-6">
                <div className="h-[360px]">
                  {statusData.datasets[0].data.some((v) => v > 0) ? (
                    <Bar data={statusData} options={statusOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      Nenhum dado de status no período.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal de período */}
      {showDateModal && (
        <div className="fixed inset-0 z-[9999]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDateModal(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-700" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Selecionar Período
                  </h3>
                </div>
                <button
                  className="p-2 rounded hover:bg-gray-100"
                  onClick={() => setShowDateModal(false)}
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-6">
                {/* Atalhos */}
                <div className="md:col-span-1">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Filtro rápido
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    <button
                      onClick={setToday}
                      className="px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={setLast7}
                      className="px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Últimos 7 dias
                    </button>
                    <button
                      onClick={setLast30}
                      className="px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Últimos 30 dias
                    </button>
                    <button
                      onClick={setThisMonth}
                      className="px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Este mês
                    </button>
                    <button
                      onClick={setLastMonth}
                      className="px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Mês passado
                    </button>
                  </div>
                </div>

                {/* Seleção manual */}
                <div className="md:col-span-2 bg-gray-50 rounded-xl p-4 border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600">Início</label>
                      <input
                        type="date"
                        value={startDate ?? ""}
                        onChange={(e) => setStartDate(e.target.value || null)}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Fim</label>
                      <input
                        type="date"
                        value={endDate ?? ""}
                        onChange={(e) => setEndDate(e.target.value || null)}
                        className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      className="text-sm px-4 py-2 rounded-lg border hover:bg-white"
                      onClick={() => setShowDateModal(false)}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
