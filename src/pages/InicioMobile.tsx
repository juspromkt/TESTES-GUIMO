import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Users,
  Target,
  Filter,
  X,
  Tag as TagIcon
} from 'lucide-react';
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
import BrazilMapSection from "../components/dashboard/BrazilMapSection";

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
  cor?: string;
}

interface StateData {
  uf: string;
  nome: string;
  leads: number;
}

// ==================== Utils ====================
const buildDateRange = (start: string, end: string) => {
  const out: string[] = [];
  const d = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (d <= last) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push(`${year}-${month}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

const formatBR = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export default function InicioMobile() {
  const [loading, setLoading] = useState(true);
  const [showDateModal, setShowDateModal] = useState(false);

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // Data states
  const [dealMetrics, setDealMetrics] = useState<DealMetrics>({ quantidade: 0, quantidadeMedia: 0 });
  const [previousMetrics, setPreviousMetrics] = useState<DealMetrics>({ quantidade: 0, quantidadeMedia: 0 });
  const [dailyDeals, setDailyDeals] = useState<DailyDeals[]>([]);
  const [stageDeals, setStageDeals] = useState<StageDeals[]>([]);
  const [tagCounts, setTagCounts] = useState<TagCount[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  // Format dates for API
  const formatDateForAPI = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dataInicio = formatDateForAPI(startDate);
  const dataFinal = formatDateForAPI(endDate);

  // Calculate growth metrics
  const growthRate = useMemo(() => {
    if (!previousMetrics.quantidade) return 0;
    return ((dealMetrics.quantidade - previousMetrics.quantidade) / previousMetrics.quantidade) * 100;
  }, [dealMetrics, previousMetrics]);

  const peakDay = useMemo(() => {
    if (!dailyDeals.length) return { day: '-', count: 0 };
    const peak = dailyDeals.reduce((max, curr) => curr.qtdLeads > max.qtdLeads ? curr : max, dailyDeals[0]);
    return {
      day: formatBR(peak.dia),
      count: peak.qtdLeads
    };
  }, [dailyDeals]);

  // Fetch main dashboard data
  useEffect(() => {
    if (!token || !dataInicio || !dataFinal) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch current period data
        const response = await fetch('https://n8n.lumendigital.com.br/webhook/relatorio/crm/jus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({ dataInicio, dataFinal })
        });

        if (response.ok) {
          const rawData = await response.json();
          const data = Array.isArray(rawData)
            ? rawData.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {})
            : rawData ?? {};

          setDealMetrics({
            quantidade: Number(data.qtdNegociacoes) || 0,
            quantidadeMedia: Number(data.qtdMediaNegociacoesDia) || 0
          });
          setDailyDeals(Array.isArray(data.negociacoesUltimos7Dias) ? data.negociacoesUltimos7Dias : []);
          setStageDeals(Array.isArray(data.negociacoesAbertasPorEstagio) ? data.negociacoesAbertasPorEstagio : []);
        }

        // Fetch previous period for comparison
        const daysDiff = Math.ceil((new Date(dataFinal).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24));
        const prevEnd = new Date(dataInicio);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - daysDiff);

        const prevResponse = await fetch('https://n8n.lumendigital.com.br/webhook/relatorio/crm/jus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            token
          },
          body: JSON.stringify({
            dataInicio: formatDateForAPI(prevStart),
            dataFinal: formatDateForAPI(prevEnd)
          })
        });

        if (prevResponse.ok) {
          const prevRawData = await prevResponse.json();
          const prevData = Array.isArray(prevRawData)
            ? prevRawData.reduce((acc: any, cur: any) => ({ ...acc, ...cur }), {})
            : prevRawData ?? {};

          setPreviousMetrics({
            quantidade: Number(prevData.qtdNegociacoes) || 0,
            quantidadeMedia: Number(prevData.qtdMediaNegociacoesDia) || 0
          });
        }

        // Fetch tags data
        fetchTagsData();

        // Fetch state data
        fetchStateData();
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, dataInicio, dataFinal]);

  const fetchTagsData = async () => {
    if (!token) return;

    try {
      // Fetch all tags
      const tagsResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', {
        headers: { token }
      });

      if (!tagsResponse.ok) return;

      const tagsData = await tagsResponse.json();
      const tags = Array.isArray(tagsData) ? tagsData : [];

      // Fetch tag-negotiation associations
      const assocResponse = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/negociacao/list', {
        headers: { token }
      });

      if (!assocResponse.ok) return;

      const assocData = await assocResponse.json();
      const associations = Array.isArray(assocData) ? assocData : [];

      // Count tags
      const counts: { [key: number]: number } = {};
      associations.forEach((assoc: any) => {
        if (assoc.id_tag) {
          counts[assoc.id_tag] = (counts[assoc.id_tag] || 0) + 1;
        }
      });

      const tagCountsData: TagCount[] = tags
        .map((tag: any) => ({
          id_tag: tag.Id,
          nome: tag.nome,
          quantidade: counts[tag.Id] || 0,
          cor: tag.cor
        }))
        .filter((t: TagCount) => t.quantidade > 0)
        .sort((a: TagCount, b: TagCount) => b.quantidade - a.quantidade);

      setTagCounts(tagCountsData);
    } catch (error) {
      console.error('Erro ao buscar tags:', error);
      setTagCounts([]);
    }
  };

  const fetchStateData = async () => {
    if (!token) return;

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/contato/get', {
        headers: { token }
      });

      if (!response.ok) return;

      const contactsData = await response.json();
      const contacts = Array.isArray(contactsData) ? contactsData : [];

      // Filtra contatos por data de criação
      const filteredContacts = contacts.filter((contact: any) => {
        // Se não tem createdAt, considera como criado em 31/10/2025 (contatos antigos)
        const contactDate = contact.createdAt
          ? new Date(contact.createdAt)
          : new Date('2025-10-31');

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (!start || !end) return true; // Se não há filtro de data, inclui todos

        // Ajusta as horas para comparação apenas de data
        contactDate.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return contactDate >= start && contactDate <= end;
      });

      // Group by state (using DDD from phone)
      const stateMap: { [key: string]: number } = {};
      filteredContacts.forEach((contact: any) => {
        if (contact.telefone) {
          const cleanPhone = String(contact.telefone).replace(/\D/g, '');
          if (cleanPhone.length >= 4) {
            const ddd = cleanPhone.substring(2, 4);
            const uf = getUFFromDDD(ddd);
            if (uf) {
              stateMap[uf] = (stateMap[uf] || 0) + 1;
            }
          }
        }
      });

      const statesData: StateData[] = Object.entries(stateMap).map(([uf, leads]) => ({
        uf,
        nome: getStateName(uf),
        leads
      }));

      setStateData(statesData);
    } catch (error) {
      console.error('Erro ao buscar dados de estados:', error);
      setStateData([]);
    }
  };

  // Helper functions
  const getUFFromDDD = (ddd: string): string | null => {
    const dddMap: { [key: string]: string } = {
      '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
      '21': 'RJ', '22': 'RJ', '24': 'RJ',
      '27': 'ES', '28': 'ES',
      '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
      '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
      '47': 'SC', '48': 'SC', '49': 'SC',
      '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
      '61': 'DF',
      '62': 'GO', '64': 'GO',
      '63': 'TO',
      '65': 'MT', '66': 'MT',
      '67': 'MS',
      '68': 'AC',
      '69': 'RO',
      '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
      '79': 'SE',
      '81': 'PE', '87': 'PE',
      '82': 'AL',
      '83': 'PB',
      '84': 'RN',
      '85': 'CE', '88': 'CE',
      '86': 'PI', '89': 'PI',
      '91': 'PA', '93': 'PA', '94': 'PA',
      '92': 'AM', '97': 'AM',
      '95': 'RR',
      '96': 'AP',
      '98': 'MA', '99': 'MA'
    };
    return dddMap[ddd] || null;
  };

  const getStateName = (uf: string): string => {
    const names: { [key: string]: string } = {
      'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
      'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
      'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
      'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
      'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
      'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
      'SE': 'Sergipe', 'TO': 'Tocantins'
    };
    return names[uf] || uf;
  };

  // Quick date filters
  const applyQuickFilter = (days: number | 'month' | 'lastMonth') => {
    const end = new Date();
    let start = new Date();

    if (days === 'month') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (days === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); // Last day of previous month
    } else {
      start.setDate(end.getDate() - days);
    }

    setStartDate(start);
    setEndDate(end);
    setShowDateModal(false);
  };

  // Prepare chart data
  const volumeChartData = useMemo(() => {
    const dateRange = buildDateRange(dataInicio, dataFinal);
    const dataMap = new Map(dailyDeals.map(d => [d.dia, d.qtdLeads]));
    const values = dateRange.map(d => dataMap.get(d) || 0);

    return {
      labels: dateRange.map(formatBR),
      datasets: [{
        label: 'Conversas',
        data: values,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [dailyDeals, dataInicio, dataFinal]);

  const tagsChartData = useMemo(() => {
    const top6 = tagCounts.slice(0, 6);
    const othersCount = tagCounts.slice(6).reduce((sum, t) => sum + t.quantidade, 0);

    const labels = [...top6.map(t => t.nome)];
    const data = [...top6.map(t => t.quantidade)];
    const colors = [...top6.map(t => t.cor || '#3b82f6')];

    if (othersCount > 0) {
      labels.push('Outros');
      data.push(othersCount);
      colors.push('#6b7280');
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    };
  }, [tagCounts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Início</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Date Filter Button */}
        <button
          onClick={() => setShowDateModal(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-medium">
              {startDate && endDate
                ? `${formatBR(formatDateForAPI(startDate))} - ${formatBR(formatDateForAPI(endDate))}`
                : 'Selecionar período'
              }
            </span>
          </div>
          <Filter className="w-5 h-5 text-gray-400" />
        </button>

        {/* KPI Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {/* Total Deals */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-neutral-400">Total de Negociações</span>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {dealMetrics.quantidade}
                </div>
                <div className="flex items-center gap-2">
                  {growthRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growthRate.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-neutral-400">vs período anterior</span>
                </div>
              </div>

              {/* Daily Average */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-neutral-400">Média Diária</span>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {dealMetrics.quantidadeMedia.toFixed(2)}
                </div>
                <span className="text-sm text-gray-500 dark:text-neutral-400">Contatos/dia</span>
              </div>

              {/* Peak Activity */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-neutral-400">Pico de Atividade</span>
                  <Target className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {peakDay.count}
                </div>
                <span className="text-sm text-gray-500 dark:text-neutral-400">em {peakDay.day}</span>
              </div>
            </div>

            {/* Volume Chart */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Volume de Conversas</h3>
              <div className="h-64">
                <Line
                  data={volumeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: '#6b7280' }
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280' }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Funnel Stages */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Funil de Conversão</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">De {dealMetrics.quantidade} leads totais</p>
              <div className="space-y-3">
                {stageDeals.map((stage, index) => {
                  const totalLeads = dealMetrics.quantidade || 1;
                  const percent = ((stage.quantidade / totalLeads) * 100).toFixed(1);
                  const colors = [
                    { from: 'from-blue-500', to: 'to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
                    { from: 'from-purple-500', to: 'to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300' },
                    { from: 'from-pink-500', to: 'to-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300' },
                    { from: 'from-orange-500', to: 'to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300' },
                    { from: 'from-green-500', to: 'to-green-600', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300' },
                    { from: 'from-teal-500', to: 'to-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300' },
                    { from: 'from-indigo-500', to: 'to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300' },
                    { from: 'from-red-500', to: 'to-red-600', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300' }
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <div key={stage.estagio} className={`${color.bg} rounded-lg p-3`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${color.text}`}>{stage.estagio}</h4>
                          <span className="text-xs text-gray-500 dark:text-neutral-400">{percent}% de conversão</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{stage.quantidade}</div>
                          <div className="text-xs text-gray-500 dark:text-neutral-400">contatos</div>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${color.from} ${color.to} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags Chart */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Etiquetas</h3>
              <div className="h-64 flex items-center justify-center">
                {tagCounts.length > 0 ? (
                  <Doughnut
                    data={tagsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: '70%',
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-neutral-400">Nenhuma etiqueta encontrada</p>
                  </div>
                )}
              </div>
              {tagCounts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {tagsChartData.labels.map((label, index) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tagsChartData.datasets[0].backgroundColor[index] }}
                        />
                        <span className="text-sm text-gray-700 dark:text-neutral-300">{label}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tagsChartData.datasets[0].data[index]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Brazil Map */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Distribuição por Estado</h3>
              <BrazilMapSection stateData={stateData} />
            </div>
          </>
        )}
      </div>

      {/* Date Selection Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Selecionar Período</h2>
              <button
                onClick={() => setShowDateModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Quick Filters */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Filtros rápidos</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => applyQuickFilter(0)}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => applyQuickFilter(7)}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                  >
                    Últimos 7 dias
                  </button>
                  <button
                    onClick={() => applyQuickFilter(30)}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                  >
                    Últimos 30 dias
                  </button>
                  <button
                    onClick={() => applyQuickFilter('month')}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                  >
                    Este mês
                  </button>
                </div>
              </div>

              {/* Custom Date Pickers */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Data inicial
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Data final
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowDateModal(false)}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
