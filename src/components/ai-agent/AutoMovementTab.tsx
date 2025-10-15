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
        <span className="ml-2 text-gray-600">Carregando movimentações...</span>
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

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <ListOrdered className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Movimentação Automática</h2>
                <p className="text-sm text-gray-500 mt-1">Configure a movimentação automática entre etapas e status do lead</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInfoModal(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Informações"
              >
                <Info className="w-5 h-5" />
              </button>
              {canViewAgent && (
                <>
                  <button
                    onClick={() => setIsResetModalOpen(true)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Resetar configurações"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isActive}
                      onChange={handleToggleStatus}
                      disabled={togglingStatus}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {togglingStatus ? 'Alternando...' : isActive ? 'Ativado' : 'Desativado'}
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {funnels.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
              Nenhum funil cadastrado. Cadastre um funil nas configurações de CRM para utilizar a movimentação automática.
            </div>
          )}

          {/* Lista de Movimentações */}
          <div className="space-y-3">
            {movements.map((movement, index) => (
              <div
                key={movement.ordem}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                    {movement.ordem}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">Movimentação #{movement.ordem}</p>
                      {movement.tags && movement.tags.length > 0 && (
                        <div className="flex gap-1">
                          {movement.tags.map(tag => (
                            <span
                              key={tag.Id}
                              className="px-2 py-0.5 rounded text-xs"
                              style={{ backgroundColor: tag.cor, color: tag.cor_texto }}
                            >
                              {tag.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      <strong>Etapa:</strong> {getStepName(movement.id_etapa)} → <strong>Status:</strong> {getStageName(movement.id_funil, movement.id_estagio)}
                    </p>
                    {movement.descricao && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{movement.descricao}</p>
                    )}
                  </div>
                </div>
                {canViewAgent && (
                  <button
                    onClick={() => handleOpenConfig(movement)}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Configurar movimentação"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* AI Generator */}
          {canViewAgent && (
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Gerar Descrições com IA</h3>
                    <p className="text-sm text-gray-600">Crie descrições claras automaticamente</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateDescriptions}
                  disabled={isGeneratingDescriptions || serviceSteps.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {isGeneratingDescriptions ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar
                    </>
                  )}
                </button>
              </div>
              {generationError && (
                <div className="mt-3 text-sm text-red-600">{generationError}</div>
              )}
            </div>
          )}

          {/* Salvar */}
          {canViewAgent && (
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSave}
                disabled={saving || funnels.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Movimentações
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Configurar Movimentação */}
      {showConfigModal && selectedMovement && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}
             onClick={() => setShowConfigModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}
               onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Configurar Movimentação #{selectedMovement.ordem}</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Etapa de Atendimento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etapa de Atendimento
                  <span className="ml-1 text-xs text-gray-500">(Quando o agente chegar nesta etapa...)</span>
                </label>
                <select
                  value={selectedMovement.id_etapa || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'id_etapa', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funil
                </label>
                <select
                  value={selectedMovement.id_funil || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'id_funil', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Selecione um funil</option>
                  {funnels.map((funnel) => (
                    <option key={funnel.id} value={funnel.id}>
                      {funnel.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status do Lead */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Lead
                  <span className="ml-1 text-xs text-gray-500">(O lead será movido para este status)</span>
                </label>
                <select
                  disabled={!selectedMovement.id_funil}
                  value={selectedMovement.id_estagio || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'id_estagio', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
                >
                  <option value="">Selecione um status</option>
                  {funnels.find(f => f.id === selectedMovement.id_funil)?.estagios?.map((stage) => (
                    <option key={stage.Id} value={stage.Id}>
                      {stage.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                  <span className="ml-1 text-xs text-gray-500">(Opcional)</span>
                </label>
                <textarea
                  value={selectedMovement.descricao || ''}
                  onChange={(e) => handleUpdateMovement(selectedMovement.ordem, 'descricao', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical"
                  rows={4}
                  placeholder="Descreva a situação para o lead ser movido para essa etapa..."
                />
              </div>

              {/* Etiquetas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                {editingTagsId === selectedMovement.Id ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={selectedTagId || ''}
                        onChange={e => setSelectedTagId(e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                        <span className="text-sm text-gray-500">Nenhuma etiqueta adicionada</span>
                      )}
                    </div>
                    <button
                      onClick={() => { setEditingTagsId(null); setSelectedTagId(null); }}
                      className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
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
                      <span className="text-sm text-gray-500">Sem etiquetas</span>
                    )}
                    <button
                      onClick={() => { setEditingTagsId(selectedMovement.Id); setSelectedTagId(null); }}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Editar etiquetas"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}
             onClick={() => setIsResetModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Resetar Configurações</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja resetar todas as configurações? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}
             onClick={() => setShowInfoModal(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl" style={{ maxHeight: '90vh', overflow: 'auto' }}
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Como Funciona a Movimentação Automática</h2>
                <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Visão Geral</h3>
                <p className="text-gray-700">
                  A Movimentação Automática conecta seu Agente de IA com o CRM, permitindo que leads sejam movidos automaticamente entre os status do funil de vendas com base nas etapas de atendimento do agente.
                </p>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 font-medium mb-2">Exemplo prático:</p>
                  <p className="text-blue-700">
                    Quando um lead agenda uma reunião com o agente (Etapa "Agendamento"), ele é automaticamente movido para o status "Reunião Agendada" no seu funil de CRM.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Como Configurar</h3>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">1. Etapa de Atendimento</h4>
                    <p className="text-gray-700 text-sm">
                      Selecione a etapa do agente que acionará a movimentação automática quando o lead atingi-la durante a conversa.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">2. Funil e Status do Lead</h4>
                    <p className="text-gray-700 text-sm">
                      Escolha o funil e o status para onde o lead será movido automaticamente.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">3. Descrição (Opcional)</h4>
                    <p className="text-gray-700 text-sm">
                      Documente quando e por que esta movimentação deve ocorrer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Dicas Importantes</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                  <li>Configure movimentações apenas para etapas significativas do processo</li>
                  <li>Certifique-se de que as etapas estão alinhadas com os status do funil</li>
                  <li>Ative a funcionalidade usando o toggle após configurar</li>
                  <li>Lembre-se de salvar suas configurações</li>
                </ul>
              </div>

              <div className="flex justify-end pt-4 border-t">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}
             onClick={() => setIsDescriptionsModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl" style={{ maxHeight: '90vh', overflow: 'auto' }}
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-bold text-gray-900">Descrições Geradas com IA</h2>
                <button onClick={() => setIsDescriptionsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-700">
                A IA analisou suas etapas de atendimento e gerou as seguintes descrições:
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {generatedDescriptions.map((desc) => (
                  <div key={desc.ordem} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                        {desc.ordem}
                      </div>
                      <h4 className="font-medium text-gray-900">Movimentação #{desc.ordem}</h4>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{desc.descricao}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsDescriptionsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}
             onClick={() => setIsConfirmModalOpen(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Aplicação</h3>
              <p className="text-gray-600 mb-6">
                As descrições geradas substituirão as descrições atuais. Esta ação é irreversível.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
