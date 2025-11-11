import { useState, useEffect } from 'react';
import { Loader2, Tag, Users, UserCircle, Folder, StopCircle, Bot, KanbanSquare, Bell, Package, X } from 'lucide-react';

interface Tag {
  Id: number;
  nome: string;
  cor?: string;
}

interface Agent {
  Id: number;
  nome: string;
  isAtivo?: boolean;
}

interface User {
  Id: number;
  nome: string;
}

interface Source {  Id: number;  nome: string;  source?: string | null;}

interface SmartDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  token: string;
  currentAgentId: number;
}

type DecisionType =
  | 'add_tag'
  | 'transfer_agent'
  | 'transfer_user'
  | 'assign_source'
  | 'transfer_stage'
  | 'notify'
  | 'assign_product'
  | 'stop_agent';

export default function SmartDecisionModal({
  isOpen,
  onClose,
  onInsert,
  token,
  currentAgentId,
}: SmartDecisionModalProps) {
  const [decisionType, setDecisionType] = useState<DecisionType>('add_tag');
  const [loading, setLoading] = useState(false);

  // Lists
  const [tags, setTags] = useState<Tag[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [funnels, setFunnels] = useState<{ id: number; nome: string; estagios?: { Id: number; nome: string }[] }[]>([]);
  const [functions, setFunctions] = useState<{ id: number; nome: string; tipo: string }[]>([]);
  const [products, setProducts] = useState<{ Id: number; nome: string }[]>([]);

  // Selections
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [selectedFunnelId, setSelectedFunnelId] = useState<number | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [selectedFunctionId, setSelectedFunctionId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, decisionType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (decisionType === 'add_tag') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/list', {
          headers: { token },
        });
        const data = await res.json();
        setTags(Array.isArray(data) ? data : []);
      } else if (decisionType === 'transfer_agent') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/get', {
          headers: { token },
        });
        const data = await res.json();
        setAgents(Array.isArray(data) ? data.filter(a => a.Id !== currentAgentId && a.isAtivo === true) : []);
      } else if (decisionType === 'transfer_user') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospectai/usuario/get', {
          headers: { token },
        });
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else if (decisionType === 'assign_source') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/fonte/get', {
          headers: { token },
        });
        const data = await res.json();
        setSources(Array.isArray(data) ? data : []);
      } else if (decisionType === 'transfer_stage') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
          headers: { token },
        });
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data.map((f: any) => ({
              id: f.id,
              nome: f.nome,
              estagios: Array.isArray(f.estagios)
                ? f.estagios.map((s: any) => ({ Id: parseInt(s.Id), nome: s.nome }))
                : [],
            }))
          : [];
        setFunnels(normalized);
      } else if (decisionType === 'notify') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funcao/get', {
          headers: { token },
        });
        const data = await res.json();
        const onlyNotifications = Array.isArray(data)
          ? data
              .filter((f: any) => f && f.tipo === 'NOTIFICACAO')
              .map((f: any) => ({ id: f.id, nome: f.nome, tipo: f.tipo }))
          : [];
        setFunctions(onlyNotifications);
      } else if (decisionType === 'assign_product') {
        const res = await fetch('https://n8n.lumendigital.com.br/webhook/produtos/get', {
          headers: { token },
        });
        const data = await res.json();
        const list = Array.isArray(data) ? data.filter((p: any) => p && p.Id).map((p: any) => ({ Id: p.Id, nome: p.nome })) : [];
        setProducts(list);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertBetter = () => {
    let html = '';
    const base = 'display:inline-flex;align-items:center;gap:4px;border-radius:6px;padding:4px 10px;margin:2px;font-size:13px;font-weight:500;white-space:nowrap;vertical-align:middle;user-select:none;';
    const build = (
      bg: string,
      color: string,
      icon: string,
      text: string,
      attrs: string
    ) =>
      `<span class="smart-decision-token" ${attrs} contenteditable="false" style="${base}background:${bg};color:${color};">`+
      `<span style="display:inline-flex;align-items:center;line-height:1">${icon}</span>`+
      `<span style="line-height:1">${text}</span>`+
      `</span>`;

    if (decisionType === 'add_tag' && selectedTagId !== null) {
      const item = tags.find(t => t.Id === selectedTagId);
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>';
      const text = `Adicionar Etiqueta: ${item?.nome || 'Etiqueta'}`;
      html = build('#FFF7ED','#9A3412',icon,text,`data-type="add_tag" data-id="${selectedTagId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'transfer_agent' && selectedAgentId !== null) {
      const item = agents.find(a => a.Id === selectedAgentId);
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.2"/><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor">G</text></svg>';
      const text = `Transferir para Agente: ${item?.nome || 'Agente'}`;
      html = build('#EFF6FF','#1E40AF',icon,text,`data-type="transfer_agent" data-id="${selectedAgentId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'transfer_user' && selectedUserId !== null) {
      const item = users.find(u => u.Id === selectedUserId);
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="8.5" cy="7" r="4"></circle></svg>';
      const text = `Transferir para Usuário: ${item?.nome || 'Usuário'}`;
      html = build('#ECFDF5','#065F46',icon,text,`data-type="transfer_user" data-id="${selectedUserId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'assign_source' && selectedSourceId !== null) {
      const item = sources.find(s => s.Id === selectedSourceId);
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
      const text = `Atribuir Origem: ${item?.nome || 'Origem'}`;
      html = build('#F5F3FF','#5B21B6',icon,text,`data-type="assign_source" data-id="${selectedSourceId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'transfer_stage' && selectedStageId !== null) {
      const funnel = funnels.find(f => f.id === selectedFunnelId || f.estagios?.some(s => s.Id === selectedStageId));
      const stage = funnel?.estagios?.find(s => s.Id === selectedStageId);
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';
      const label = `${stage?.nome || ''}`;
      const text = `Mudar Etapa no CRM: ${label}`;
      html = build('#E0F2FE','#075985',icon,text,`data-type="transfer_stage" data-id="${selectedStageId}" data-label="${label}"`);
    } else if (decisionType === 'notify' && selectedFunctionId !== null) {
      const func = functions.find(f => f.id === selectedFunctionId);
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
      const text = `Notificar Equipe: ${func?.nome || 'Função'}`;
      html = build('#FEF9C3','#92400E',icon,text,`data-type="notify" data-id="${selectedFunctionId}" data-label="${func?.nome || ''}"`);
    } else if (decisionType === 'assign_product' && selectedProductId !== null) {
      const prod = products.find(p => p.Id === selectedProductId);
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>';
      const text = `Atribuir Departamento: ${prod?.nome || 'Departamento'}`;
      html = build('#FCE7F3','#9D174D',icon,text,`data-type="assign_product" data-id="${selectedProductId}" data-label="${prod?.nome || ''}"`);
    } else if (decisionType === 'stop_agent') {
      const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
      const text = 'Desativar Agente';
      html = build('#FEF2F2','#991B1B',icon,text,`data-type="stop_agent"`);
    }

    if (html) {
      onInsert(html);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedTagId(null);
    setSelectedAgentId(null);
    setSelectedUserId(null);
    setSelectedSourceId(null);
    setSelectedFunnelId(null);
    setSelectedStageId(null);
    setSelectedFunctionId(null);
    setSelectedProductId(null);
    setDecisionType('add_tag');
    onClose();
  };

  const canInsert = () => {
    switch (decisionType) {
      case 'add_tag':
        return selectedTagId !== null;
      case 'transfer_agent':
        return selectedAgentId !== null;
      case 'transfer_user':
        return selectedUserId !== null;
      case 'assign_source':
        return selectedSourceId !== null;
      case 'transfer_stage':
        return selectedStageId !== null;
      case 'notify':
        return selectedFunctionId !== null;
      case 'assign_product':
        return selectedProductId !== null;
      case 'stop_agent':
        return true;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  const decisionOptions = [
    { type: 'add_tag', icon: Tag, label: 'Adicionar Etiqueta', color: 'text-orange-600' },
    { type: 'transfer_agent', icon: Bot, label: 'Transferir para Agente', color: 'text-blue-600' },
    { type: 'transfer_user', icon: UserCircle, label: 'Transferir para Usuário', color: 'text-green-600' },
    { type: 'assign_source', icon: Folder, label: 'Atribuir Origem', color: 'text-purple-600' },
    { type: 'transfer_stage', icon: KanbanSquare, label: 'Mudar Etapa no CRM', color: 'text-cyan-600' },
    { type: 'notify', icon: Bell, label: 'Notificar Equipe', color: 'text-amber-600' },
    { type: 'assign_product', icon: Package, label: 'Atribuir Departamento', color: 'text-pink-600' },
    { type: 'stop_agent', icon: StopCircle, label: 'Desativar Agente', color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Adicionar Decisão Inteligente</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {/* Decision Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Decisão
              </label>
              <div className="grid grid-cols-2 gap-2">
                {decisionOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = decisionType === option.type;
                  return (
                    <button
                      key={option.type}
                      onClick={() => setDecisionType(option.type as DecisionType)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all text-left ${
                        isActive
                          ? 'border-gray-900 dark:border-gray-600 bg-gray-100 dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-gray-900 dark:bg-gray-600' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : option.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-xs ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} truncate`}>
                          {option.label}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuration */}
            <div>
              {decisionType === 'stop_agent' ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-red-500 dark:bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <StopCircle className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                    Esta ação irá desativar o agente para este lead
                  </p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Carregando...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Simple selects for single choice decisions */}
                  {['add_tag', 'transfer_agent', 'transfer_user', 'assign_source', 'notify', 'assign_product'].includes(decisionType) && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {decisionType === 'add_tag' && 'Selecione a Etiqueta'}
                        {decisionType === 'transfer_agent' && 'Selecione o Agente'}
                        {decisionType === 'transfer_user' && 'Selecione o Usuário'}
                        {decisionType === 'assign_source' && 'Selecione a Origem'}
                        {decisionType === 'notify' && 'Selecione a Notificação'}
                        {decisionType === 'assign_product' && 'Selecione o Departamento'}
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                        value={
                          decisionType === 'add_tag' ? (selectedTagId ?? '') :
                          decisionType === 'transfer_agent' ? (selectedAgentId ?? '') :
                          decisionType === 'transfer_user' ? (selectedUserId ?? '') :
                          decisionType === 'assign_source' ? (selectedSourceId ?? '') :
                          decisionType === 'notify' ? (selectedFunctionId ?? '') :
                          (selectedProductId ?? '')
                        }
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : Number(e.target.value);
                          if (decisionType === 'add_tag') setSelectedTagId(value);
                          else if (decisionType === 'transfer_agent') setSelectedAgentId(value);
                          else if (decisionType === 'transfer_user') setSelectedUserId(value);
                          else if (decisionType === 'assign_source') setSelectedSourceId(value);
                          else if (decisionType === 'notify') setSelectedFunctionId(value);
                          else if (decisionType === 'assign_product') setSelectedProductId(value);
                        }}
                      >
                        <option value="">Selecione uma opção...</option>
                        {decisionType === 'add_tag' && tags.map((tag) => (
                          <option key={tag.Id} value={tag.Id}>{tag.nome}</option>
                        ))}
                        {decisionType === 'transfer_agent' && agents.map((agent) => (
                          <option key={agent.Id} value={agent.Id}>{agent.nome} {agent.isAtivo ? '' : '(Inativo)'}</option>
                        ))}
                        {decisionType === 'transfer_user' && users.map((user) => (
                          <option key={user.Id} value={user.Id}>{user.nome}</option>
                        ))}
                        {decisionType === 'assign_source' && sources.map((source) => (
                          <option key={source.Id} value={source.Id}>{source.nome}</option>
                        ))}
                        {decisionType === 'notify' && functions.map((f) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                        {decisionType === 'assign_product' && products.map((p) => (
                          <option key={p.Id} value={p.Id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Special case for transfer_stage - two dropdowns */}
                  {decisionType === 'transfer_stage' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Selecione o Funil
                        </label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                          value={selectedFunnelId ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            setSelectedFunnelId(value);
                            setSelectedStageId(null);
                          }}
                        >
                          <option value="">Selecione um funil...</option>
                          {funnels.map((f) => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Selecione a Etapa
                        </label>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                          value={selectedStageId ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            setSelectedStageId(value);
                          }}
                          disabled={!selectedFunnelId}
                        >
                          <option value="">Selecione uma etapa...</option>
                          {funnels.find(f => f.id === selectedFunnelId)?.estagios?.map((s) => (
                            <option key={s.Id} value={s.Id}>{s.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleInsertBetter}
            disabled={!canInsert()}
            className="px-4 py-2 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Inserir
          </button>
        </div>
      </div>
    </div>
  );
}
