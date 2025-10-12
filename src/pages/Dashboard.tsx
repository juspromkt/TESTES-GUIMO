import React, { useEffect, useMemo, useState } from "react";
import {
  GitBranch,
  BarChart as BarIcon,
  Calendar,
  Filter,
  X,
  Sparkles,
  Tags,
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
  const [tagCounts, setTagCounts] = useState<TagCount[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  const user = localStorage.getItem("user");
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchData();
    fetchTagCounts();
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
    const t = new Date().toISOString().slice(0, 10);
    setStartDate(t);
    setEndDate(t);
  };
  const setLast7 = () => {
    const e = new Date(), s = new Date(); s.setDate(s.getDate() - 7);
    setStartDate(s.toISOString().slice(0, 10)); setEndDate(e.toISOString().slice(0, 10));
  };
  const setLast30 = () => {
    const e = new Date(), s = new Date(); s.setDate(s.getDate() - 30);
    setStartDate(s.toISOString().slice(0, 10)); setEndDate(e.toISOString().slice(0, 10));
  };
  const setThisMonth = () => {
    const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth(), 1);
    const e = new Date(n.getFullYear(), n.getMonth() + 1, 0);
    setStartDate(s.toISOString().slice(0, 10)); setEndDate(e.toISOString().slice(0, 10));
  };
  const setLastMonth = () => {
    const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth() - 1, 1);
    const e = new Date(n.getFullYear(), n.getMonth(), 0);
    setStartDate(s.toISOString().slice(0, 10)); setEndDate(e.toISOString().slice(0, 10));
  };

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
    interaction: { mode: "index", intersect: false },
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
    animation: { animateRotate: true, animateScale: true, duration: 1200, easing: "easeOutQuart" },
    hover: {
      mode: "nearest",
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
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 -mt-0.5">Visão geral das conversas e contatos</p>
          </div>
          {isRefreshing && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Atualizando…
            </span>
          )}
        </div>

        <button
          onClick={() => setShowDateModal(true)}
          className="
    inline-flex items-center gap-2 
    rounded-xl border border-gray-300 
    px-5 py-2.5 
    bg-white hover:bg-blue-50 
    shadow-sm hover:shadow-md 
    transition-all duration-200
  "
        >
          <Filter className="w-5 h-5 text-blue-600" />
          <span className="text-base font-medium text-gray-800">Selecionar Data</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-300">
          <p className="text-sm font-medium text-blue-600 uppercase">Média Diária</p>
          <p className="text-3xl font-bold text-gray-900">{dealMetrics.quantidadeMedia.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-1">Contatos/dia</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-300">
          <p className="text-sm font-medium text-gray-500">Total de Contatos</p>
          <p className="text-3xl font-bold text-gray-900">{dealMetrics.quantidade.toLocaleString()}</p>
        </div>
      </div>

      {/* ==================== GRÁFICOS ==================== */}
      <div className="px-6 pb-10 flex flex-col gap-6">
        {/* 🔹 Gráfico principal: Volume de Conversas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
          <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Volume de conversas</h3>
          </div>
          <div className="p-6">
            <div className="h-80">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>

        {/* 🔹 Segunda linha: Status + Etiquetas lado a lado */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ===== STATUS ===== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Status</h3>
            </div>

            <div className="p-6 max-h-[450px] overflow-y-auto bg-gray-50/50">
              <div className="flex flex-col gap-2">
                {stageDeals.length > 0 ? (
                  stageDeals.map((stage, i) => {
                    const total = stageDeals.reduce((a, s) => a + (s.quantidade || 0), 0);
                    const percent = total > 0 ? ((stage.quantidade / total) * 100).toFixed(0) : 0;
                    return (
                      <div
                        key={i}
                        className="group status-card flex flex-col gap-1 bg-white border border-gray-300 rounded-xl px-4 py-3 hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-base font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                            {stage.estagio}
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">
                              {stage.quantidade}
                            </p>
                            <p className="text-xs text-gray-500">{percent}%</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1 mt-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 transition-all duration-300 group-hover:opacity-90"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">  Nenhum status disponível.</p>
                )}
              </div>
            </div>
          </div>  
                      


          {/* ===== ETIQUETAS ===== */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 overflow-hidden">
            <div className="bg-white px-6 py-5 flex items-center gap-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-gradient-to-tr from-pink-100 to-blue-50 rounded-xl flex items-center justify-center">
                <Tags className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Etiquetas</h3>
            </div>

            <div className="p-8 flex flex-col items-center">
              {tagCounts.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center justify-center gap-10 w-full">
                  {/* Donut Chart */}
                  <div className="relative w-60 h-60 transition-transform duration-300">
                    <Doughnut data={tagsData} options={tagsOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Total
                      </p>
                      <p className="text-3xl font-bold text-gray-800">
                        {totalTags.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {/* Legenda */}
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {finalTags.map((tag, i) => {
                      const percent =
                        totalTags > 0
                          ? ((tag.quantidade / totalTags) * 100).toFixed(1)
                          : 0;
                      return (
                        <div
                          key={tag.id_tag}
                          className="flex items-center justify-between bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 hover:bg-gray-100 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full ring-1 ring-gray-300"
                              style={{
                                backgroundColor: tagColors[i % tagColors.length],
                              }}
                            />
                            <span className="text-gray-800 text-sm font-medium">
                              {tag.nome}
                            </span>
                          </div>
                          <div className="text-gray-700 text-sm font-semibold">
                            {tag.quantidade.toLocaleString()}{" "}
                            <span className="text-gray-400 text-xs ml-1">
                              ({percent}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nenhuma etiqueta disponível.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODAL DE PERÍODO ==================== */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-300">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-6 bg-gray-50">
              {/* Coluna de filtros rápidos */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Filtro rápido</p>
                <button
                  onClick={setToday}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  Hoje
                </button>
                <button
                  onClick={setLast7}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  Últimos 7 dias
                </button>
                <button
                  onClick={setLast30}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  Últimos 30 dias
                </button>
                <button
                  onClick={setThisMonth}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  Este mês
                </button>
                <button
                  onClick={setLastMonth}
                  className="px-3 py-2 text-sm rounded-xl border border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-200 transition-all"
                >
                  Mês passado
                </button>
              </div>

              {/* Coluna de seleção manual */}
              <div className="md:col-span-2 bg-white rounded-xl p-5 border border-gray-300 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Data inicial
                    </label>
                    <DatePicker
                      selected={startDate ? new Date(startDate) : null}
                      onChange={(date: Date | null) =>
                        setStartDate(
                          date ? date.toISOString().slice(0, 10) : startDate
                        )
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
                        setEndDate(
                          date ? date.toISOString().slice(0, 10) : endDate
                        )
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
