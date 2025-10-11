import React, { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  BarChart as BarIcon,
  Calendar,
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
  PointElement,
  LineElement,
  Filler, // 👈 IMPORTANTE: adiciona o módulo responsável pelo gradiente/fill
} from "chart.js";
import { Line } from "react-chartjs-2";
import { hasPermission } from "../utils/permissions";
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
  LineElement
);

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

  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);

  const [startDate, setStartDate] = useState(defaultStart.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [dealMetrics, setDealMetrics] = useState<DealMetrics>({
    quantidade: 0,
    quantidadeMedia: 0,
  });
  const [dailyDeals, setDailyDeals] = useState<DailyDeals[]>([]);
  const [stageDeals, setStageDeals] = useState<StageDeals[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  // ==================== Fetch ====================
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

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

  // ==================== Funções de Filtro Rápido ====================
  const setToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  };

  const setLast7 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const setLast30 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
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

  // ==================== Gráficos ====================
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

          // 🔵 Azul intenso no topo, desaparecendo suavemente até o fim
          g.addColorStop(0, "rgba(37,99,235,0.65)");  // topo mais sólido
          g.addColorStop(0.8, "rgba(59,130,246,0.25)");
          g.addColorStop(1, "rgba(59,130,246,0)");    // base transparente
          return g;
        },
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(148,163,184,0.15)" } },
      x: { grid: { display: false } },
    },
  };

  // ==================== Render ====================
  if (!canViewCRMDashboard) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 -mt-0.5">
              Visão geral das conversas e contatos
            </p>
          </div>
          {isRefreshing && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Atualizando…
            </span>
          )}
        </div>

        <button
          onClick={() => setShowDateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50 shadow-sm"
        >
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm">Período</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
          <p className="text-sm font-medium text-blue-600 uppercase">Média Diária</p>
          <p className="text-3xl font-bold text-gray-900">
            {dealMetrics.quantidadeMedia.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 mt-1">Contatos/dia</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total de Contatos</p>
          <p className="text-3xl font-bold text-gray-900">
            {dealMetrics.quantidade.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="px-6 pb-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        {/* Conversas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-white px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Volume de conversas</h3>
          </div>
          <div className="p-6 bg-transparent">
            <div className="h-80">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-white px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Status</h3>
          </div>

          <div className="p-6 max-h-[450px] overflow-y-auto bg-gray-50/50">
            <div className="flex flex-col gap-2">
              {stageDeals.length > 0 ? (
                stageDeals.map((stage, i) => {
                  const total = stageDeals.reduce((acc, s) => acc + (s.quantidade || 0), 0);
                  const percent = total > 0 ? ((stage.quantidade / total) * 100).toFixed(0) : 0;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-all"
                    >
                      <div className="text-sm font-medium text-gray-800">
                        {stage.estagio}
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900">
                          {stage.quantidade}
                        </p>
                        <p className="text-xs text-gray-500">{percent}%</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum dado disponível.
                </p>
              )}
            </div>
          </div>
        </div>
      </div> {/* 👈 Fechamento da área dos gráficos */}

      {/* Modal de Período */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Selecionar Período
                </h3>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowDateModal(false)}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Corpo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-6 bg-gray-50">
              {/* Filtros rápidos */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Filtro rápido</p>
                <button onClick={setToday} className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all">
                  Hoje
                </button>
                <button onClick={setLast7} className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all">
                  Últimos 7 dias
                </button>
                <button onClick={setLast30} className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all">
                  Últimos 30 dias
                </button>
                <button onClick={setThisMonth} className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all">
                  Este mês
                </button>
                <button onClick={setLastMonth} className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all">
                  Mês passado
                </button>
              </div>

              {/* Seleção manual */}
              <div className="md:col-span-2 bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Data inicial
                    </label>
                    <DatePicker
                      selected={startDate ? new Date(startDate) : null}
                      onChange={(date: Date | null) =>
                        setStartDate(date ? date.toISOString().slice(0, 10) : startDate)
                      }
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholderText="Selecione a data inicial"
                      dropdownMode="select"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Data final
                    </label>
                    <DatePicker
                      selected={endDate ? new Date(endDate) : null}
                      onChange={(date: Date | null) =>
                        setEndDate(date ? date.toISOString().slice(0, 10) : endDate)
                      }
                      dateFormat="dd/MM/yyyy"
                      locale="pt-BR"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholderText="Selecione a data final"
                      dropdownMode="select"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setShowDateModal(false)}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
