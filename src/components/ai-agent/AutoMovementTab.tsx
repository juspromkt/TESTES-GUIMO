import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ListOrdered, Loader2, Save, Trash2, AlertCircle, Info, Sparkles, Pencil, X, Settings } from 'lucide-react';
import type { Tag } from '../../types/tag';

interface AutoMovement {
  Id: number;
  ordem: number;
  descricao: string | null;
  id_etapa: number | null;
  id_funil: number | null;
  id_estagio: number | null;
  tags?: Tag[];
  isCustom?: boolean;
}

interface ServiceStep {
  Id: number;
  nome: string;
  ordem: string;
}

interface Funil {
  id: number;
  nome: string;
  isFunilPadrao: boolean;
  estagios?: {
    Id: number;
    nome: string;
    ordem: string;
  }[];
}

interface AutoMovementTabProps {
  token: string;
  canViewAgent: boolean;
}

export default function AutoMovementTab({ token, canViewAgent }: AutoMovementTabProps) {
  const [movements, setMovements] = useState<AutoMovement[]>([]);
  const [serviceSteps, setServiceSteps] = useState<ServiceStep[]>([]);
  const [defaultFunnel, setDefaultFunnel] = useState<Funil | null>(null);
  const [funnels, setFunnels] = useState<Funil[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'custom'>('standard');
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [editingTagsId, setEditingTagsId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  // AI Generator states
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [generatedDescriptions, setGeneratedDescriptions] = useState<{ordem: number, descricao: string}[]>([]);
  const [isDescriptionsModalOpen, setIsDescriptionsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [generationError, setGenerationError] = useState('');

  // Config modal
  const [selectedMovement, setSelectedMovement] = useState<AutoMovement | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const showMessage = (message: string, type: 'error' | 'success') => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
  };

  const fetchData = async () => {
    try {
      const [movementsResponse, stepsResponse, funnelsResponse, statusResponse] = await Promise.all([
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/movimentacao/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/movimentacao/toggle/get', {
          headers: { token }
        })
      ]);

      const [movementsData, stepsData, funnelsData, statusData] = await Promise.all([
        movementsResponse.json(),
        stepsResponse.json(),
        funnelsResponse.json(),
        statusResponse.json()
      ]);

      const tagsRes = await fetch(
        'https://n8n.lumendigital.com.br/webhook/prospecta/tag/list',
        { headers: { token } }
      );
      let tagsList: Tag[] = [];
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        tagsList = Array.isArray(data) ? data : [];
      }

      const tagMap = new Map(tagsList.map(t => [t.Id, t]));

      const processedMovements = Array.isArray(movementsData)
        ? movementsData.map((m: any) => ({
            ...m,
            tags: Array.isArray(m.tags)
              ? m.tags.map((id: number) => tagMap.get(Number(id))).filter(Boolean)
              : []
          }))
        : [];

      setAvailableTags(tagsList);
      setMovements(processedMovements);

      setServiceSteps(Array.isArray(stepsData) ? stepsData.map(step => ({
        ...step,
        Id: parseInt(step.Id)
      })) : []);

      const validFunnels = Array.isArray(funnelsData)
        ? funnelsData.map((f: Funil) => ({
            ...f,
            estagios: f.estagios?.map(estagio => ({
              ...estagio,
              Id: parseInt(estagio.Id)
            }))
          }))
        : [];

      setFunnels(validFunnels);

      const defaultFunnel = validFunnels.find(funnel => funnel.isFunilPadrao) || null;
      setDefaultFunnel(defaultFunnel);

      setIsActive(statusData.isAtivo);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      showMessage('Erro ao carregar dados. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/movimentacao/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        }
      });

      const data = await response.json();
      setIsActive(data.isAtivo);
      showMessage('Status atualizado com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      showMessage('Erro ao alterar status. Tente novamente.', 'error');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/movimentacao/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        }
      });

      if (response.ok) {
        await fetchData();
        showMessage('Configurações resetadas com sucesso!', 'success');
      }
    } catch (err) {
      console.error('Erro ao resetar configurações:', err);
      showMessage('Erro ao resetar. Tente novamente.', 'error');
    } finally {
      setResetting(false);
      setIsResetModalOpen(false);
    }
  };

  const handleUpdateMovement = (
    ordem: number,
    field: 'id_etapa' | 'id_estagio' | 'descricao' | 'id_funil',
    value: any
  ) => {
    setMovements(movements.map(movement => {
      if (movement.ordem === ordem) {
        const updates: Partial<AutoMovement> = { [field]: value };

        if (field === 'id_funil') {
          updates.id_estagio = null;
        }

        return { ...movement, ...updates };
      }
      return movement;
    }));

    if (selectedMovement && selectedMovement.ordem === ordem) {
      const updates: Partial<AutoMovement> = { [field]: value };
      if (field === 'id_funil') {
        updates.id_estagio = null;
      }
      setSelectedMovement({ ...selectedMovement, ...updates });
    }
  };

  const handleAddTag = async (movementId: number) => {
    if (!selectedTagId) return;
    setSavingTag(true);
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/movimentacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ id_movimentacao: movementId, id_tag: selectedTagId })
      });

      // Buscar a tag adicionada
      const addedTag = availableTags.find(t => t.Id === selectedTagId);

      if (addedTag) {
        // Atualizar imediatamente o selectedMovement
        setSelectedMovement(prev => prev ? {
          ...prev,
          tags: [...(prev.tags || []), addedTag]
        } : null);

        // Atualizar a lista de movimentos
        setMovements(prev => prev.map(m =>
          m.Id === movementId ? { ...m, tags: [...(m.tags || []), addedTag] } : m
        ));
      }

      setSelectedTagId(null);
      showMessage('Etiqueta adicionada com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao adicionar etiqueta:', err);
      showMessage('Erro ao adicionar etiqueta.', 'error');
    } finally {
      setSavingTag(false);
    }
  };

  const handleRemoveTag = async (movementId: number, tagId: number) => {
    setSavingTag(true);
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/tag/movimentacao', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ id_movimentacao: movementId, id_tag: tagId })
      });

      // Atualizar imediatamente o selectedMovement removendo a tag
      setSelectedMovement(prev => prev ? {
        ...prev,
        tags: (prev.tags || []).filter(t => t.Id !== tagId)
      } : null);

      // Atualizar a lista de movimentos
      setMovements(prev => prev.map(m =>
        m.Id === movementId ? { ...m, tags: (m.tags || []).filter(t => t.Id !== tagId) } : m
      ));

      showMessage('Etiqueta removida com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao remover etiqueta:', err);
      showMessage('Erro ao remover etiqueta.', 'error');
    } finally {
      setSavingTag(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');

    try {
      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/movimentacao/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(movements)
      });

      if (response.ok) {
        showMessage('Movimentações salvas com sucesso!', 'success');
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao salvar movimentações:', err);
      showMessage('Erro ao salvar movimentações.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDescriptions = async () => {
    setIsGeneratingDescriptions(true);
    setGenerationError('');

    try {
      if (!serviceSteps || serviceSteps.length === 0) {
        throw new Error('Não há etapas de atendimento configuradas. Configure as etapas primeiro.');
      }

      const formattedSteps = serviceSteps.map(step => ({
        ordem: step.ordem,
        nome: step.nome,
        descricao: (step as any).descricao
      }));

      const response = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/prompt/movimentacao/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(formattedSteps)
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar descrições de movimentação');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setGeneratedDescriptions(data);
        setIsDescriptionsModalOpen(true);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err) {
      console.error('Erro ao gerar descrições:', err);
      setGenerationError(err instanceof Error ? err.message : 'Erro ao gerar descrições');
    } finally {
      setIsGeneratingDescriptions(false);
    }
  };

  const handleApplyGeneratedDescriptions = () => {
    const updatedMovements = movements.map(movement => {
      const generatedDesc = generatedDescriptions.find(desc => desc.ordem === movement.ordem);
      if (generatedDesc) {
        return {
          ...movement,
          descricao: generatedDesc.descricao
        };
      }
      return movement;
    });

    setMovements(updatedMovements);
    setIsDescriptionsModalOpen(false);
    setIsConfirmModalOpen(false);
    showMessage('Descrições aplicadas com sucesso!', 'success');
  };

  const handleOpenConfig = (movement: AutoMovement) => {
    setSelectedMovement(movement);
    setShowConfigModal(true);
  };

  const handleCreateNewMovement = () => {
    // Encontrar o maior Id e ordem existente
    const maxId = movements.length > 0 ? Math.max(...movements.map(m => m.Id)) : 0;
    const maxOrdem = movements.length > 0 ? Math.max(...movements.map(m => m.ordem)) : 0;

    // Criar nova movimentação personalizada
    const newMovement: AutoMovement = {
      Id: maxId + 1,
      ordem: maxOrdem + 1,
      descricao: null,
      id_etapa: null,
      id_funil: defaultFunnel?.id || null,
      id_estagio: null,
      tags: [],
      isCustom: true
    };

    // Adicionar à lista
    setMovements([...movements, newMovement]);

    // Abrir modal de configuração
    setSelectedMovement(newMovement);
    setShowConfigModal(true);
  };

  const handleDeleteMovement = (movementId: number) => {
    setMovements(movements.filter(m => m.Id !== movementId));
    setShowConfigModal(false);
    showMessage('Movimentação deletada com sucesso!', 'success');
  };

  const getStepName = (id: number | null) => {
    if (!id) return 'Não configurado';
    const step = serviceSteps.find(s => s.Id === id);
    return step ? step.nome : 'Não encontrado';
  };

  const getStageName = (funnelId: number | null, stageId: number | null) => {
    if (!funnelId || !stageId) return 'Não configurado';
    const funnel = funnels.find(f => f.id === funnelId);
    if (!funnel) return 'Não encontrado';
    const stage = funnel.estagios?.find(s => s.Id === stageId);
    return stage ? stage.nome : 'Não encontrado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600 dark:text-neutral-300">Carregando movimentações...</span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="space-y-4">
        {/* Header Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-4 transition-theme">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Movimentação Automática</h2>
              <span className="text-xs text-gray-500 dark:text-neutral-500">
                {movements.length} {movements.length === 1 ? 'regra' : 'regras'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-1.5 text-gray-500 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                title="Informações"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {canViewAgent && (
                <>
                  <button
                    onClick={() => setIsResetModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all border border-gray-300 dark:border-neutral-600"
                    title="Resetar configurações"
                  >
                    Resetar
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={togglingStatus}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ${
                      isActive ? 'bg-orange-600 dark:bg-orange-500' : 'bg-gray-300 dark:bg-neutral-600'
                    } ${togglingStatus ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                    title={isActive ? 'Desativar movimentação' : 'Ativar movimentação'}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform bg-white rounded-full shadow-sm transition-transform duration-300 ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {funnels.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-xl text-sm">
            Nenhum funil cadastrado. Cadastre um funil nas configurações de CRM para utilizar a movimentação automática.
          </div>
        )}

        {/* Layout de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">

          {/* Coluna Esquerda - Movimentações */}
          <div className="space-y-3 min-w-0">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('standard')}
                  className={`pb-3 text-sm font-medium transition-all relative ${
                    activeTab === 'standard'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                  }`}
                >
                  Padrão
                  {activeTab === 'standard' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`pb-3 text-sm font-medium transition-all relative ${
                    activeTab === 'custom'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300'
                  }`}
                >
                  Personalizada
                  {activeTab === 'custom' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600 dark:bg-orange-400"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de Movimentações */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-600 divide-y divide-gray-100 dark:divide-neutral-600">
              {movements
                .filter(m => activeTab === 'standard' ? !m.isCustom : m.isCustom)
                .map((movement, index) => (
                <div
                  key={movement.ordem}
                  className="group relative hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-all cursor-pointer"
                  onClick={() => canViewAgent && handleOpenConfig(movement)}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="w-6 h-6 rounded bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-neutral-200 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all flex-shrink-0 mt-0.5">
                      {movement.ordem}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-neutral-50 truncate">
                          {getStepName(movement.id_etapa)}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-neutral-300 truncate">
                          {getStageName(movement.id_funil, movement.id_estagio)}
                        </span>
                      </div>

                      {movement.descricao && (
                        <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {movement.descricao}
                        </p>
                      )}

                      {movement.tags && movement.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {movement.tags.slice(0, 3).map(tag => (
                            <div
                              key={tag.Id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: tag.cor }}
                              title={tag.nome}
                            />
                          ))}
                          {movement.tags.length > 3 && (
                            <span className="text-xs text-gray-400 dark:text-neutral-500">+{movement.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {canViewAgent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenConfig(movement);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 dark:text-neutral-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded transition-all flex-shrink-0"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-1 bg-orange-500 dark:bg-orange-400 transition-all rounded-l"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Coluna Direita - Ações */}
          <div className="space-y-4 flex-shrink-0">
            {/* Nova Movimentação */}
            {canViewAgent && activeTab === 'custom' && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ListOrdered className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Nova Movimentação</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4 leading-relaxed">
                  Crie uma movimentação personalizada para o seu fluxo
                </p>
                <button
                  onClick={handleCreateNewMovement}
                  className="w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg transition-all"
                >
                  + Nova Movimentação
                </button>
              </div>
            )}

            {/* Gerar Descrições */}
            {canViewAgent && activeTab === 'standard' && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">IA Generator</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4 leading-relaxed">
                  Gere descrições automaticamente para todas as movimentações
                </p>
                <button
                  onClick={handleGenerateDescriptions}
                  disabled={isGeneratingDescriptions || serviceSteps.length === 0}
                  className="w-full px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                >
                  {isGeneratingDescriptions ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando...
                    </span>
                  ) : (
                    'Gerar Descrições'
                  )}
                </button>
              </div>
            )}

            {/* Salvar */}
            {canViewAgent && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Save className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Salvar</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4 leading-relaxed">
                  Salve todas as alterações realizadas nas movimentações
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving || funnels.length === 0}
                  className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Configurar Movimentação */}
      {showConfigModal && selectedMovement && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center p-4 transition-theme" style={{ zIndex: 9999 }}
             onClick={() => setShowConfigModal(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-2xl w-full shadow-2xl flex flex-col transition-theme" style={{ maxHeight: '90vh' }}
               onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Configurar Movimentação #{selectedMovement.ordem}</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Etapa de Atendimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">
                  Etapa de Atendimento
                  <span className="ml-1 text-xs text-gray-500 dark:text-neutral-400">(Quando o agente chegar nesta etapa...)</span>
                </label>
                <select
                  value={selectedMovement.id_etapa || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'id_etapa', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                >
                  <option value="">Selecione uma etapa</option>
                  {serviceSteps.map((step) => (
                    <option key={step.Id} value={step.Id}>
                      {step.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Funil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">
                  Funil
                </label>
                <select
                  value={selectedMovement.id_funil || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'id_funil', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                >
                  <option value="">Selecione um funil</option>
                  {funnels.map((funnel) => (
                    <option key={funnel.id} value={funnel.id}>
                      {funnel.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Etapa do Funil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">
                  Etapa do Funil
                  <span className="ml-1 text-xs text-gray-500 dark:text-neutral-400">(O lead será movido para esta etapa)</span>
                </label>
                <select
                  disabled={!selectedMovement.id_funil}
                  value={selectedMovement.id_estagio || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'id_estagio', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                >
                  <option value="">Selecione uma etapa</option>
                  {funnels.find(f => f.id === selectedMovement.id_funil)?.estagios?.map((stage) => (
                    <option key={stage.Id} value={stage.Id}>
                      {stage.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">
                  Descrição
                  <span className="ml-1 text-xs text-gray-500 dark:text-neutral-400">(Opcional)</span>
                </label>
                <textarea
                  value={selectedMovement.descricao || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'descricao', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                  rows={4}
                  placeholder="Descreva a situação para o lead ser movido para essa etapa..."
                />
              </div>

              {/* Etiquetas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">Etiquetas</label>
                {editingTagsId === selectedMovement.Id ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={selectedTagId || ''}
                        onChange={e => setSelectedTagId(e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100"
                      >
                        <option value="">Selecione uma etiqueta</option>
                        {availableTags.map(tag => (
                          <option key={tag.Id} value={tag.Id}>{tag.nome}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAddTag(selectedMovement.Id)}
                        disabled={savingTag || !selectedTagId}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors font-medium"
                      >
                        {savingTag ? 'Adicionando...' : 'Adicionar'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedMovement.tags && selectedMovement.tags.map(tag => (
                        <span
                          key={tag.Id}
                          className="px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          style={{ backgroundColor: tag.cor, color: tag.cor_texto }}
                        >
                          {tag.nome}
                          <button
                            onClick={() => handleRemoveTag(selectedMovement.Id, tag.Id)}
                            className="hover:opacity-70"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      {(!selectedMovement.tags || selectedMovement.tags.length === 0) && (
                        <span className="text-sm text-gray-500 dark:text-neutral-400">Nenhuma etiqueta adicionada</span>
                      )}
                    </div>
                    <button
                      onClick={() => { setEditingTagsId(null); setSelectedTagId(null); }}
                      className="mt-2 text-sm text-gray-600 dark:text-neutral-300 hover:text-gray-800 dark:hover:text-neutral-100 underline"
                    >
                      Concluir edição de etiquetas
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 items-center">
                    {selectedMovement.tags && selectedMovement.tags.map(tag => (
                      <span
                        key={tag.Id}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: tag.cor, color: tag.cor_texto }}
                      >
                        {tag.nome}
                      </span>
                    ))}
                    {(!selectedMovement.tags || selectedMovement.tags.length === 0) && (
                      <span className="text-sm text-gray-500 dark:text-neutral-400">Sem etiquetas</span>
                    )}
                    <button
                      onClick={() => { setEditingTagsId(selectedMovement.Id); setSelectedTagId(null); }}
                      className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 rounded-lg transition-colors"
                      title="Editar etiquetas"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center gap-2 p-6 border-t border-gray-200 dark:border-neutral-700">
              {selectedMovement.isCustom ? (
                <button
                  onClick={() => handleDeleteMovement(selectedMovement.Id)}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Reset Confirmation */}
      {isResetModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center p-4 transition-theme" style={{ zIndex: 10000 }}
             onClick={() => setIsResetModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl transition-theme" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Resetar Configurações</h3>
              <p className="text-gray-600 dark:text-neutral-300 mb-6">
                Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetando...
                    </>
                  ) : (
                    'Sim, Resetar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Info */}
      {showInfoModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center p-4 transition-theme" style={{ zIndex: 9999 }}
             onClick={() => setShowInfoModal(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-3xl w-full shadow-2xl transition-theme" style={{ maxHeight: '90vh', overflow: 'auto' }}
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Como Funciona a Movimentação Automática</h2>
                <button onClick={() => setShowInfoModal(false)} className="text-gray-400 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Visão Geral</h3>
                <p className="text-gray-700 dark:text-neutral-300">
                  A Movimentação Automática conecta seu Agente de IA com o CRM, permitindo que leads sejam movidos automaticamente entre os status do funil de vendas com base nas etapas de atendimento do agente.
                </p>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-blue-800 dark:text-blue-300 font-medium mb-2">Exemplo prático:</p>
                  <p className="text-blue-700 dark:text-blue-400">
                    Quando um lead agenda uma reunião com o agente (Etapa "Agendamento"), ele é automaticamente movido para o status "Reunião Agendada" no seu funil de CRM.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Como Configurar</h3>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-neutral-200 mb-1">1. Etapa de Atendimento</h4>
                    <p className="text-gray-700 dark:text-neutral-300 text-sm">
                      Selecione a etapa do agente que acionará a movimentação automática quando o lead atingi-la durante a conversa.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-neutral-200 mb-1">2. Funil e Etapa do Funil</h4>
                    <p className="text-gray-700 dark:text-neutral-300 text-sm">
                      Escolha o funil e a etapa para onde o lead será movido automaticamente.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-neutral-200 mb-1">3. Descrição (Opcional)</h4>
                    <p className="text-gray-700 dark:text-neutral-300 text-sm">
                      Documente quando e por que esta movimentação deve ocorrer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Dicas Importantes</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-neutral-300 text-sm">
                  <li>Configure movimentações apenas para etapas significativas do processo</li>
                  <li>Certifique-se de que as etapas estão alinhadas com os status do funil</li>
                  <li>Ative a funcionalidade usando o toggle após configurar</li>
                  <li>Lembre-se de salvar suas configurações</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-neutral-700">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Generated Descriptions */}
      {isDescriptionsModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center p-4 transition-theme" style={{ zIndex: 9999 }}
             onClick={() => setIsDescriptionsModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-3xl w-full shadow-2xl transition-theme" style={{ maxHeight: '90vh', overflow: 'auto' }}
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-700 pb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Descrições Geradas com IA</h2>
                <button onClick={() => setIsDescriptionsModalOpen(false)} className="text-gray-400 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-200">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-700 dark:text-neutral-300">
                A IA analisou suas etapas de atendimento e gerou as seguintes descrições:
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {generatedDescriptions.map((desc) => (
                  <div key={desc.ordem} className="bg-gray-50 dark:bg-neutral-700 p-4 rounded-lg border border-gray-200 dark:border-neutral-600">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
                        {desc.ordem}
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-neutral-100">Movimentação #{desc.ordem}</h4>
                    </div>
                    <p className="text-gray-700 dark:text-neutral-300 text-sm whitespace-pre-wrap">{desc.descricao}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
                <button
                  onClick={() => setIsDescriptionsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Aplicar Descrições
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Confirm Apply */}
      {isConfirmModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 flex items-center justify-center p-4 transition-theme" style={{ zIndex: 10000 }}
             onClick={() => setIsConfirmModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl transition-theme" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Confirmar Aplicação</h3>
              <p className="text-gray-600 dark:text-neutral-300 mb-6">
                As descrições geradas substituirão as descrições atuais. Esta ação é irreversível.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-200 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApplyGeneratedDescriptions}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Sim, Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
