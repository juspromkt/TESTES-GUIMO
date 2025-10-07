import React, { useState, useEffect } from "react";
import {
  Users,
  Brain,
  GitBranch,
  BarChart3,
  RefreshCw,
  MessageSquare,
  Coins,
  Send,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  Search,
  PieChart,
  TrendingUp,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
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


import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
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

interface DashboardMetrics {
  isWhatsAppAtivo: boolean;
  tokens: number;
  disparoEmAndamento: boolean;
  qtdDisparosJaRealizados?: number;
  numeroLeads: number;
  numeroProspeccoes: number;
  numeroDisparos: number;
}

interface MonthlyData {
  mes: string;
  quantidade: number;
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

interface FunnelStage {
  id: number;
  nome: string;
  quantidade: number;
  valor_total: number;
}

interface FunnelData {
  id_funil: number;
  nome_funil: string;
  total_negociacoes: number;
  total_abertas: number;
  total_ganhas: number;
  total_perdidas: number;
  valor_total: number;
  estagios: FunnelStage[];
}

const CACHE_KEY = "dashboard_data";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  timestamp: number;
  metrics: DashboardMetrics;
  monthlyDispatches: MonthlyData[];
  monthlyProspections: MonthlyData[];
  dealMetrics: DealMetrics;
  dailyDeals: DailyDeals[];
  stageDeals: StageDeals[];
  funnelData: FunnelData[];
  startDate: string;
  endDate: string;
}

export default function Dashboard() {
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

  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [activeFunnelIndex, setActiveFunnelIndex] = useState<number>(0);
  const [expandedFunnels, setExpandedFunnels] = useState<number[]>([]);

  const canViewCRMDashboard = hasPermission("can_view_dashboard_crm");
  const canViewProspectDashboard = hasPermission(
    "can_view_dashboard_prospeccao"
  );
  const [monthlyDispatches, setMonthlyDispatches] = useState<MonthlyData[]>([]);
  const [monthlyProspections, setMonthlyProspections] = useState<MonthlyData[]>(
    []
  );
  const [dailyDeals, setDailyDeals] = useState<DailyDeals[]>([]);
  const [stageDeals, setStageDeals] = useState<StageDeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const defaultEndDate = new Date().toISOString().slice(0, 10);
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  const defaultStartDate = defaultStart.toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  const loadCachedData = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data: CachedData = JSON.parse(cached);
      const now = Date.now();
      if (
        now - data.timestamp < CACHE_EXPIRY &&
        data.startDate === startDate &&
        data.endDate === endDate
      ) {
        setMetrics(data.metrics);
        setMonthlyDispatches(data.monthlyDispatches);
        setMonthlyProspections(data.monthlyProspections);
        setDealMetrics(data.dealMetrics);
        setDailyDeals(data.dailyDeals);
        setStageDeals(data.stageDeals);
        if (data.funnelData) {
          setFunnelData(data.funnelData);
        }
        setLoading(false);
        return true;
      }
    }
    return false;
  };

  const cacheData = (data: Partial<CachedData>) => {
    const payload: CachedData = {
      timestamp: Date.now(),
      startDate,
      endDate,
      metrics: data.metrics ?? metrics,
      monthlyDispatches: data.monthlyDispatches ?? [],
      monthlyProspections: data.monthlyProspections ?? [],
      dealMetrics: data.dealMetrics ?? dealMetrics,
      dailyDeals: data.dailyDeals ?? [],
      stageDeals: data.stageDeals ?? [],
      funnelData: data.funnelData ?? [],
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  };

  const fetchData = async (isRefreshing = false) => {
    if (!isRefreshing && loadCachedData()) {
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const crmResponse = await fetch(
        "https://n8n.lumendigital.com.br/webhook/relatorio/crm/jus",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { token } : {}),
          },
          body: JSON.stringify({ dataInicio: startDate, dataFinal: endDate }),
        }
      );

      const crmData = await crmResponse.json();

      const crmMetrics = Array.isArray(crmData)
        ? crmData.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {})
        : crmData ?? {};

      const newMetrics: DashboardMetrics = {
        isWhatsAppAtivo: Boolean(crmMetrics.isWhatsAppAtivo),
        tokens: Number(crmMetrics.tokens) || 0,
        disparoEmAndamento: Boolean(crmMetrics.disparoEmAndamento),
        qtdDisparosJaRealizados:
          Number(crmMetrics.qtdDisparosJaRealizados) || 0,
        numeroLeads: Number(crmMetrics.qtdContatos) || 0,
        // Se removeu prospecção, deixe 0 (ou mapeie se existir no CRM)
        numeroProspeccoes: 0,
        numeroDisparos: Number(crmMetrics.qtdDisparosJaRealizados) || 0,
      };

      const newDealMetrics: DealMetrics = {
        quantidade: Number(crmMetrics.qtdNegociacoes) || 0,
        qtdContatos: Number(crmMetrics.qtdContatos) || 0,
        tokensGerais: Number(crmMetrics.tokens) || 0,
        valorMedio: Number(crmMetrics.valorMedioNegociacoes) || 0,
        quantidadeMedia: Number(crmMetrics.qtdMediaNegociacoesDia) || 0,
        receitaGanha: Number(crmMetrics.receita_ganha) || 0,
        receitaPerdida: Number(crmMetrics.receita_perdida) || 0,
      };

      const dailyDealsData: DailyDeals[] = Array.isArray(
        crmMetrics.negociacoesUltimos7Dias
      )
        ? crmMetrics.negociacoesUltimos7Dias
        : [];

      const stageDealsData: StageDeals[] = Array.isArray(
        crmMetrics.negociacoesAbertasPorEstagio
      )
        ? crmMetrics.negociacoesAbertasPorEstagio
        : [];
      setMetrics(newMetrics);
      setDealMetrics(newDealMetrics);
      setDailyDeals(Array.isArray(dailyDealsData) ? dailyDealsData : []);
      setStageDeals(Array.isArray(stageDealsData) ? stageDealsData : []);

      // Cache the new data
      cacheData({
        metrics: newMetrics,
        dealMetrics: newDealMetrics,
        dailyDeals: dailyDealsData,
        stageDeals: stageDealsData,
        funnelData: [], // se não usa mais
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Erro ao carregar informações do dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });;
  };

  // 1) Construa o range de datas com base no filtro e force o gráfico a usar exatamente esse range
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

const dateRange = buildDateRange(startDate, endDate);
const dealsByDay = new Map(dailyDeals.map(d => [d.dia, d.qtdLeads]));
const dailyLabels = dateRange; // garante início e fim iguais ao filtro
const dailyValues = dailyLabels.map(d => dealsByDay.get(d) ?? 0);

const dailyDealsChartData = {
  labels: dailyLabels,
  datasets: [
    {
      label: "Contatos",
      data: dailyValues,
      backgroundColor: "rgba(59, 130, 246, 0.7)",
      borderColor: "rgb(59, 130, 246)",
      borderWidth: 1,
    },
  ],
};

  const stageDealsChartData = {
    labels: stageDeals.map((s) => s.estagio),
    datasets: [
      {
        label: "Quantidade",
        data: stageDeals.map((s) => s.quantidade),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
      },
    ],
  };

  const generateFunnelPieData = (funnel: FunnelData) => {
    return {
      labels: ["Em aberto", "Ganhos", "Perdidos"],
      datasets: [
        {
          data: [
            funnel.total_abertas,
            funnel.total_ganhas,
            funnel.total_perdidas,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)", // Azul para abertos
            "rgba(16, 185, 129, 0.7)", // Verde para ganhos
            "rgba(239, 68, 68, 0.7)", // Vermelho para perdidos
          ],
          borderColor: [
            "rgb(59, 130, 246)",
            "rgb(16, 185, 129)",
            "rgb(239, 68, 68)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const generateFunnelStagesData = (funnel: FunnelData) => {
    return {
      labels: funnel.estagios.map((s) => s.nome),
      datasets: [
        {
          label: "Quantidade",
          data: funnel.estagios.map((s) => s.quantidade),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  };

  const generateFunnelValuesData = (funnel: FunnelData) => {
    return {
      labels: funnel.estagios.map((s) => s.nome),
      datasets: [
        {
          label: "Valor (R$)",
          data: funnel.estagios.map((s) => s.valor_total),
          backgroundColor: "rgba(16, 185, 129, 0.7)",
          borderColor: "rgb(16, 185, 129)",
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
    },
  };

  const funnelChartOptions = {
    ...chartOptions,
    indexAxis: "y" as const,
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Leads por Estágio",
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="mt-4 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="px-6 py-8 space-y-12">
        {/* Dados de Negociações */}
        {canViewCRMDashboard && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Contatos</h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600" htmlFor="start-date">
                  Início:
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                />
                <label className="text-sm text-gray-600" htmlFor="end-date">
                  Fim:
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                />
                <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="group flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 border border-white/40 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md"
            title="Atualizar dados"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline text-gray-600 group-hover:text-blue-600 font-medium">
              {refreshing ? "Atualizando..." : "Atualizar"}
            </span>
          </button>
              </div>
            </div>

            {/* KPIs Principais + Métricas Secundárias */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card - Média Diária */}
              <div className="group bg-white rounded-2xl p-6 shadow-sm border border-purple-100 hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">
                      Média Diária
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dealMetrics.quantidadeMedia.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-1 text-purple-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">Contatos/dia</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Card - Total de Negociações */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Total de Contatos
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dealMetrics.quantidade.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de Vendas */}
<div className="grid grid-cols-1 gap-6">              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-white px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <BarChart className="w-6 h-6 text-gray-900" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Contatos
                        </h3>
<p className="text-xs text-gray-500 mt-0.5">
  {`${new Date(startDate).toLocaleDateString('pt-BR')} — ${new Date(endDate).toLocaleDateString('pt-BR')} (${Math.max(1, Math.floor((new Date(endDate).getTime()-new Date(startDate).getTime())/86400000)+1)} dias)`}
</p>

                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
                  <div className="h-80">
                    {dailyDeals.length > 0 ? (
                      <Line
options={{
  ...chartOptions,
  scales: {
    x: {
      ticks: {
        callback: function (val) {
          const date = new Date(this.getLabelForValue(val as number));
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        },
      },
    },
  },
  elements: {
    line: { tension: 0.4, borderWidth: 3 },
    point: { radius: 5, hoverRadius: 7, backgroundColor: "#fff", borderWidth: 3 },
  },
}}


                        data={{
                          ...dailyDealsChartData,
                          datasets: dailyDealsChartData.datasets.map(
                            (dataset) => ({
                              ...dataset,
                              fill: true,
                              backgroundColor: "rgba(99, 102, 241, 0.1)",
                              borderColor: "rgb(99, 102, 241)",
                            })
                          ),
                        }}
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <BarChart className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          Nenhum dado disponível
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Os dados aparecerão aqui
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="bg-white px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                        <PieChart className="w-6 h-6 text-gray-900" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Distribuição
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Por estágio do funil
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
  <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
    {/* Gráfico */}
    <div className="h-80 w-80 flex items-center justify-center">
      <Doughnut
        options={{
          ...funnelChartOptions,
          cutout: "65%",
          plugins: {
            ...funnelChartOptions.plugins,
            legend: { display: false }, // escondemos a legenda nativa
          },
        }}
        data={{
          ...stageDealsChartData,
          datasets: stageDealsChartData.datasets.map((dataset) => ({
            ...dataset,
            backgroundColor: [
              "rgba(147, 51, 234, 0.8)",
              "rgba(236, 72, 153, 0.8)",
              "rgba(59, 130, 246, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(251, 146, 60, 0.8)",
            ],
            borderColor: "#fff",
            borderWidth: 3,
            hoverOffset: 8,
          })),
        }}
      />
    </div>

    {/* Lista de distribuição */}
    <div className="flex-1 space-y-3">
      {stageDealsChartData.labels.map((label, i) => {
        const total = stageDealsChartData.datasets[0].data.reduce(
          (acc, val) => acc + val,
          0
        );
        const value = stageDealsChartData.datasets[0].data[i];
        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

        return (
          <div
            key={label}
            className="flex items-center justify-between bg-white border rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    stageDealsChartData.datasets[0].backgroundColor[i],
                }}
              />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="text-sm text-gray-600">
              {value} ({percent}%)
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>

              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}