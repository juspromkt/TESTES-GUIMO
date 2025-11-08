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
        setAgents(Array.isArray(data) ? data.filter(a => a.Id !== currentAgentId) : []);
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
        const res = await fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/funcao/get?id_agente=${currentAgentId}`, {
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
    const base = 'display:inline-flex;align-items:center;gap:4px;border-radius:9999px;padding:2px 10px;margin:2px 2px;font-size:12px;font-weight:600;white-space:nowrap;line-height:1.5;user-select:none;';
    const build = (
      bg: string,
      border: string,
      color: string,
      icon: string,
      text: string,
      attrs: string
    ) =>
      `<span class="smart-decision-token" ${attrs} contenteditable="false" style="${base}background:${bg};border:1px solid ${border};color:${color};">`+
      `<span style="display:inline-flex;align-items:center;line-height:1">${icon}</span>`+
      `<span style="display:inline-flex;align-items:center;line-height:1">${text}</span>`+
      `</span>`;

    if (decisionType === 'add_tag' && selectedTagId !== null) {
      const item = tags.find(t => t.Id === selectedTagId);
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>';
      const text = `Adicionar Tag: ${item?.nome || 'Tag'}`;
      html = build('#FFF7ED','#FED7AA','#9A3412',icon,text,`data-type="add_tag" data-id="${selectedTagId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'transfer_agent' && selectedAgentId !== null) {
      const item = agents.find(a => a.Id === selectedAgentId);
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
      const text = `Transferir para: ${item?.nome || 'Agente'}`;
      html = build('#EFF6FF','#BFDBFE','#1E40AF',icon,text,`data-type="transfer_agent" data-id="${selectedAgentId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'transfer_user' && selectedUserId !== null) {
      const item = users.find(u => u.Id === selectedUserId);
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="8.5" cy="7" r="4"></circle></svg>';
      const text = `Transferir para: ${item?.nome || 'Usuário'}`;
      html = build('#ECFDF5','#BBF7D0','#065F46',icon,text,`data-type="transfer_user" data-id="${selectedUserId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'assign_source' && selectedSourceId !== null) {
      const item = sources.find(s => s.Id === selectedSourceId);
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
      const text = `Atribuir Fonte: ${item?.nome || 'Fonte'}`;
      html = build('#F5F3FF','#DDD6FE','#5B21B6',icon,text,`data-type="assign_source" data-id="${selectedSourceId}" data-label="${item?.nome || ''}"`);
    } else if (decisionType === 'transfer_stage' && selectedStageId !== null) {
      const funnel = funnels.find(f => f.id === selectedFunnelId || f.estagios?.some(s => s.Id === selectedStageId));
      const stage = funnel?.estagios?.find(s => s.Id === selectedStageId);
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';
      const label = `${stage?.nome || ''}`;
      const text = `Mover para: ${label}`;
      html = build('#E0F2FE','#BAE6FD','#075985',icon,text,`data-type="transfer_stage" data-id="${selectedStageId}" data-label="${label}"`);
    } else if (decisionType === 'notify' && selectedFunctionId !== null) {
      const func = functions.find(f => f.id === selectedFunctionId);
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
      const text = `Notificar: ${func?.nome || 'Função'}`;
      html = build('#FEF9C3','#FDE68A','#92400E',icon,text,`data-type="notify" data-id="${selectedFunctionId}" data-label="${func?.nome || ''}"`);
    } else if (decisionType === 'assign_product' && selectedProductId !== null) {
      const prod = products.find(p => p.Id === selectedProductId);
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>';
      const text = `Produto: ${prod?.nome || 'Produto'}`;
      html = build('#FCE7F3','#FBCFE8','#9D174D',icon,text,`data-type="assign_product" data-id="${selectedProductId}" data-label="${prod?.nome || ''}"`);
    } else if (decisionType === 'stop_agent') {
      const icon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
      const text = 'Interromper Agente';
      html = build('#FEF2F2','#FECACA','#991B1B',icon,text,`data-type="stop_agent"`);
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
    { type: 'add_tag', icon: Tag, label: 'Adicionar Tag', desc: 'Adiciona uma etiqueta ao lead', color: 'text-orange-600' },
    { type: 'transfer_agent', icon: Bot, label: 'Transferir para Agente', desc: 'Transfere para outro agente', color: 'text-blue-600' },
    { type: 'transfer_user', icon: UserCircle, label: 'Transferir para Usuário', desc: 'Atribui lead a um usuário', color: 'text-green-600' },
    { type: 'assign_source', icon: Folder, label: 'Atribuir Fonte', desc: 'Define a fonte do lead', color: 'text-purple-600' },
    { type: 'transfer_stage', icon: KanbanSquare, label: 'Transferir para Estágio', desc: 'Move lead entre estágios', color: 'text-cyan-600' },
    { type: 'notify', icon: Bell, label: 'Fazer Notificação', desc: 'Dispara notificações', color: 'text-amber-600' },
    { type: 'assign_product', icon: Package, label: 'Atribuir Produto', desc: 'Vincula produto ao lead', color: 'text-emerald-600' },
    { type: 'stop_agent', icon: StopCircle, label: 'Interromper Agente', desc: 'Para o atendimento', color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50 flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Adicionar Decisão Inteligente</h2>
            <p className="text-xs text-gray-500 mt-0.5">Configure ações automáticas baseadas em condições</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Decision Types */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Tipo de Decisão
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2">
                {decisionOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = decisionType === option.type;
                  return (
                    <button
                      key={option.type}
                      onClick={() => setDecisionType(option.type as DecisionType)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isActive
                          ? 'border-gray-900 bg-gradient-to-r from-gray-50 to-slate-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${isActive ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center transition-colors`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : option.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{option.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Configuração
              </label>

              {decisionType === 'stop_agent' ? (
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <StopCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-red-900 mb-2">Interromper Agente</h3>
                  <p className="text-sm text-red-700">
                    Esta ação irá parar o atendimento automático do agente para este lead.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600 mb-3" />
                  <p className="text-sm text-gray-600">Carregando opções...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Simple selects for single choice decisions */}
                  {['add_tag', 'transfer_agent', 'transfer_user', 'assign_source', 'notify', 'assign_product'].includes(decisionType) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        {decisionType === 'add_tag' && 'Selecione a Tag'}
                        {decisionType === 'transfer_agent' && 'Selecione o Agente'}
                        {decisionType === 'transfer_user' && 'Selecione o Usuário'}
                        {decisionType === 'assign_source' && 'Selecione a Fonte'}
                        {decisionType === 'notify' && 'Selecione a Notificação'}
                        {decisionType === 'assign_product' && 'Selecione o Produto'}
                      </label>
                      <select
                        className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all"
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
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Selecione o Funil
                        </label>
                        <select
                          className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all"
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
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Selecione o Estágio
                        </label>
                        <select
                          className="w-full px-4 py-3 text-sm border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={selectedStageId ?? ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            setSelectedStageId(value);
                          }}
                          disabled={!selectedFunnelId}
                        >
                          <option value="">Selecione um estágio...</option>
                          {funnels.find(f => f.id === selectedFunnelId)?.estagios?.map((s) => (
                            <option key={s.Id} value={s.Id}>{s.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Info box */}
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-900 font-medium mb-1">
                      💡 Como funciona?
                    </p>
                    <p className="text-xs text-blue-700">
                      {decisionType === 'add_tag' && 'A tag será adicionada automaticamente ao lead quando a condição for atendida.'}
                      {decisionType === 'transfer_agent' && 'O lead será transferido para o agente selecionado automaticamente.'}
                      {decisionType === 'transfer_user' && 'O lead será atribuído ao usuário selecionado.'}
                      {decisionType === 'assign_source' && 'A fonte do lead será atualizada para a opção selecionada.'}
                      {decisionType === 'transfer_stage' && 'O lead será movido para o estágio selecionado no funil.'}
                      {decisionType === 'notify' && 'Uma notificação será disparada usando a função selecionada.'}
                      {decisionType === 'assign_product' && 'O produto será vinculado ao lead automaticamente.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between sticky bottom-0 rounded-b-2xl">
          <p className="text-xs text-gray-500">
            {canInsert() ? '✓ Pronto para inserir' : 'Selecione todas as opções necessárias'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleInsertBetter}
              disabled={!canInsert()}
              className="px-5 py-2.5 text-sm bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg disabled:shadow-none"
            >
              Inserir Decisão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
