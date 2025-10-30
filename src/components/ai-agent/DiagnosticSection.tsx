import React, { useEffect, useState } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Activity,
  Bot,
  Zap,
  RefreshCw,
  Users,
  Clock,
  GitBranch,
  Wifi,
  AlertTriangle,
} from 'lucide-react';

interface DiagnosticSectionProps {
  token: string;
}

interface WhatsAppConnection {
  connectionStatus: string;
}

interface AgentStatus {
  isAgenteAtivo: boolean;
}

interface TriggerConfig {
  isAtivo: boolean;
}

interface FollowUpConfig {
  isAtivo: boolean;
  quantidade: number;
  tempo_entre_mensagens: string;
}

interface AutoMovement {
  Id: number;
}

interface OperatingHours {
  isAtivo: boolean;
}

interface User {
  Id: number;
  isAtivo: boolean;
}

interface Funil {
  id: number;
  isFunilPadrao: boolean;
  estagios?: any[];
}

interface DiagnosticData {
  whatsapp: {
    status: 'connected' | 'disconnected' | 'connecting' | 'loading';
    message: string;
  };
  agent: {
    status: 'active' | 'inactive' | 'loading';
    message: string;
  };
  trigger: {
    status: 'active' | 'inactive' | 'loading';
    message: string;
  };
  followUp: {
    status: 'active' | 'inactive' | 'loading';
    message: string;
  };
  autoMovement: {
    status: 'active' | 'inactive' | 'loading';
    message: string;
  };
  hours: {
    status: 'active' | 'inactive' | 'loading';
    message: string;
  };
  users: {
    status: 'ok' | 'warning' | 'loading';
    message: string;
  };
  funnels: {
    status: 'ok' | 'warning' | 'error' | 'loading';
    message: string;
  };
}

export default function DiagnosticSection({ token }: DiagnosticSectionProps) {
  const [loading, setLoading] = useState(true);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData>({
    whatsapp: { status: 'loading', message: 'Verificando...' },
    agent: { status: 'loading', message: 'Verificando...' },
    trigger: { status: 'loading', message: 'Verificando...' },
    followUp: { status: 'loading', message: 'Verificando...' },
    autoMovement: { status: 'loading', message: 'Verificando...' },
    hours: { status: 'loading', message: 'Verificando...' },
    users: { status: 'loading', message: 'Verificando...' },
    funnels: { status: 'loading', message: 'Verificando...' },
  });

  const runDiagnostics = async () => {
    setLoading(true);

    // Verifica se tem token
    if (!token) {
      console.error('Token não encontrado!');
      setLoading(false);
      return;
    }

    // 1. WhatsApp Status
    try {
      console.log('Verificando WhatsApp...');
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/whatsapp/get',
        { headers: { token } }
      );
      console.log('WhatsApp response status:', response.status);
      const text = await response.text();
      const data: WhatsAppConnection[] = text ? JSON.parse(text) : [];
      console.log('WhatsApp data:', data);

      if (data.length === 0) {
        setDiagnosticData(prev => ({
          ...prev,
          whatsapp: { status: 'disconnected', message: 'Nenhuma conexão configurada' }
        }));
      } else if (data[0].connectionStatus === 'open') {
        setDiagnosticData(prev => ({
          ...prev,
          whatsapp: { status: 'connected', message: 'WhatsApp conectado' }
        }));
      } else if (data[0].connectionStatus === 'connecting') {
        setDiagnosticData(prev => ({
          ...prev,
          whatsapp: { status: 'connecting', message: 'Conectando...' }
        }));
      } else {
        setDiagnosticData(prev => ({
          ...prev,
          whatsapp: { status: 'disconnected', message: 'WhatsApp desconectado' }
        }));
      }
    } catch (err) {
      setDiagnosticData(prev => ({
        ...prev,
        whatsapp: { status: 'disconnected', message: 'Erro ao verificar status' }
      }));
    }

    // 2. Agent Status
    try {
      console.log('Verificando Agente...');
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/isAtivo',
        { headers: { token } }
      );
      console.log('Agente response status:', response.status);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Agente data:', data);

      setDiagnosticData(prev => ({
        ...prev,
        agent: {
          status: data?.isAgenteAtivo ? 'active' : 'inactive',
          message: data?.isAgenteAtivo ? 'Agente de IA ativo' : 'Agente de IA desativado'
        }
      }));
    } catch (err) {
      console.error('Erro ao verificar agente:', err);
      setDiagnosticData(prev => ({
        ...prev,
        agent: { status: 'inactive', message: 'Agente de IA desativado' }
      }));
    }

    // 3. Trigger Status
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/gatilho/get',
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();

      setDiagnosticData(prev => ({
        ...prev,
        trigger: {
          status: data?.isAtivo ? 'active' : 'inactive',
          message: data?.isAtivo ? 'Gatilho ativo' : 'Gatilho inativo'
        }
      }));
    } catch (err) {
      console.error('Erro ao verificar gatilho:', err);
      setDiagnosticData(prev => ({
        ...prev,
        trigger: { status: 'inactive', message: 'Gatilho inativo' }
      }));
    }

    // 4. Follow-up Status
    try {
      console.log('Verificando Follow-up...');
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/follow/get',
        { headers: { token } }
      );
      console.log('Follow-up response status:', response.status);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const text = await response.text();
      const data = text && text.trim() ? JSON.parse(text) : null;
      console.log('Follow-up data:', data); // Debug

      // A API retorna um array, pega o primeiro elemento
      const followUpConfig = Array.isArray(data) && data.length > 0 ? data[0] : null;

      if (followUpConfig?.isAtivo) {
        setDiagnosticData(prev => ({
          ...prev,
          followUp: {
            status: 'active',
            message: `Follow-up ativo: ${followUpConfig.quantidade || 0} mensagens a cada ${followUpConfig.tempo_entre_mensagens || 'N/A'}`
          }
        }));
      } else {
        setDiagnosticData(prev => ({
          ...prev,
          followUp: { status: 'inactive', message: 'Follow-up desativado' }
        }));
      }
    } catch (err) {
      console.error('Erro ao verificar follow-up:', err);
      setDiagnosticData(prev => ({
        ...prev,
        followUp: { status: 'inactive', message: 'Follow-up desativado' }
      }));
    }

    // 5. Auto Movement Status
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/movimentacao/get',
        { headers: { token } }
      );
      const data: AutoMovement[] = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setDiagnosticData(prev => ({
          ...prev,
          autoMovement: {
            status: 'active',
            message: `Movimentação automática ativa: ${data.length} regra${data.length !== 1 ? 's' : ''} configurada${data.length !== 1 ? 's' : ''}`
          }
        }));
      } else {
        setDiagnosticData(prev => ({
          ...prev,
          autoMovement: { status: 'inactive', message: 'Nenhuma regra configurada' }
        }));
      }
    } catch (err) {
      setDiagnosticData(prev => ({
        ...prev,
        autoMovement: { status: 'inactive', message: 'Erro ao verificar regras' }
      }));
    }

    // 6. Operating Hours
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/agente/horario/get',
        { headers: { token } }
      );

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();

      setDiagnosticData(prev => ({
        ...prev,
        hours: {
          status: data?.isAtivo ? 'active' : 'active',
          message: data?.isAtivo ? 'Sistema funciona 24 horas' : 'Horário de funcionamento configurado'
        }
      }));
    } catch (err) {
      console.error('Erro ao verificar horários:', err);
      setDiagnosticData(prev => ({
        ...prev,
        hours: { status: 'active', message: 'Sistema funciona 24 horas' }
      }));
    }

    // 7. Users Status
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get',
        { headers: { token } }
      );
      const data: User[] = await response.json();
      const activeUsers = data.filter(u => u.isAtivo);

      if (activeUsers.length === 0) {
        setDiagnosticData(prev => ({
          ...prev,
          users: { status: 'warning', message: 'Nenhum usuário ativo' }
        }));
      } else {
        setDiagnosticData(prev => ({
          ...prev,
          users: {
            status: 'ok',
            message: `${activeUsers.length} usuário${activeUsers.length !== 1 ? 's' : ''} ativo${activeUsers.length !== 1 ? 's' : ''}`
          }
        }));
      }
    } catch (err) {
      setDiagnosticData(prev => ({
        ...prev,
        users: { status: 'warning', message: 'Erro ao verificar usuários' }
      }));
    }

    // 8. Funnels Status
    try {
      const response = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/funil/get',
        { headers: { token } }
      );
      const data: Funil[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setDiagnosticData(prev => ({
          ...prev,
          funnels: { status: 'error', message: 'Nenhum funil configurado' }
        }));
      } else {
        const defaultFunnel = data.find(f => f.isFunilPadrao);
        if (!defaultFunnel) {
          setDiagnosticData(prev => ({
            ...prev,
            funnels: { status: 'warning', message: `${data.length} funil${data.length !== 1 ? 'is' : ''} (sem padrão definido)` }
          }));
        } else {
          const stageCount = defaultFunnel.estagios?.length || 0;
          setDiagnosticData(prev => ({
            ...prev,
            funnels: {
              status: 'ok',
              message: `Funil padrão configurado: ${stageCount} estágio${stageCount !== 1 ? 's' : ''}`
            }
          }));
        }
      }
    } catch (err) {
      setDiagnosticData(prev => ({
        ...prev,
        funnels: { status: 'error', message: 'Erro ao verificar funis' }
      }));
    }

    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [token]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'connecting':
        return <Loader2 className="w-5 h-5 animate-spin text-yellow-600 dark:text-yellow-400" />;
      case 'disconnected':
      case 'inactive':
      case 'warning':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
      case 'ok':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';
      case 'connecting':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'disconnected':
      case 'inactive':
      case 'warning':
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const diagnosticItems = [
    {
      id: 'whatsapp',
      icon: Wifi,
      title: 'Status do WhatsApp',
      data: diagnosticData.whatsapp,
    },
    {
      id: 'agent',
      icon: Bot,
      title: 'Agente de IA',
      data: diagnosticData.agent,
    },
    {
      id: 'trigger',
      icon: Zap,
      title: 'Status do Gatilho',
      data: diagnosticData.trigger,
    },
    {
      id: 'followUp',
      icon: RefreshCw,
      title: 'Status do Follow-up',
      data: diagnosticData.followUp,
    },
    {
      id: 'autoMovement',
      icon: Activity,
      title: 'Movimentação Automática',
      data: diagnosticData.autoMovement,
    },
    {
      id: 'hours',
      icon: Clock,
      title: 'Horário de Funcionamento',
      data: diagnosticData.hours,
    },
    {
      id: 'users',
      icon: Users,
      title: 'Usuários Online',
      data: diagnosticData.users,
    },
    {
      id: 'funnels',
      icon: GitBranch,
      title: 'Diagnóstico de Funis',
      data: diagnosticData.funnels,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Minimalista */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-neutral-700">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Diagnóstico do Sistema
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            Monitoramento em tempo real
          </p>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Diagnostic Cards Grid - Minimalista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {diagnosticItems.map((item) => {
          const Icon = item.icon;
          const isActive = ['connected', 'active', 'ok'].includes(item.data.status);

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-5 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
            >
              {/* Header: Icon + Badge */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-neutral-700/50'} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-neutral-500'}`} />
                </div>

                {/* Badge no canto superior direito */}
                <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusBadgeClass(item.data.status)}`}>
                  {item.data.status === 'connected' || item.data.status === 'active' || item.data.status === 'ok' ? 'Ativo' :
                   item.data.status === 'connecting' ? 'Conectando' :
                   item.data.status === 'warning' ? 'Atenção' :
                   item.data.status === 'error' ? 'Erro' :
                   item.data.status === 'loading' ? 'Verificando...' : 'Inativo'}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {item.title}
              </h3>

              {/* Message */}
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {item.data.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
