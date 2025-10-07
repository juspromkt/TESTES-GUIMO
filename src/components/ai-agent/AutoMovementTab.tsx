import React, { useState, useEffect } from 'react';
import { ListOrdered, Loader2, Save, RotateCcw, AlertCircle, Info, Sparkles, Pencil, X } from 'lucide-react';
import type { Tag } from '../../types/tag';
import Modal from '../Modal';

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

  useEffect(() => {
    fetchData();
  }, []);

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

      // Set service steps
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

      // Set active status
      setIsActive(statusData.isAtivo);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
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
      setSuccess('Status atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
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
        setSuccess('Configurações resetadas com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Erro ao resetar configurações:', err);
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
      await fetchData();
      setSelectedTagId(null);
      setEditingTagsId(null);
    } catch (err) {
      console.error('Erro ao adicionar etiqueta:', err);
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
      await fetchData();
    } catch (err) {
      console.error('Erro ao remover etiqueta:', err);
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
        setSuccess('Movimentações salvas com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao salvar movimentações:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDescriptions = async () => {
    setIsGeneratingDescriptions(true);
    setGenerationError('');
    
    try {
      // Check if we have service steps
      if (!serviceSteps || serviceSteps.length === 0) {
        throw new Error('Não há etapas de atendimento configuradas. Configure as etapas primeiro.');
      }
      
      // Format service steps for the API
      const formattedSteps = serviceSteps.map(step => ({
        ordem: step.ordem,
        nome: step.nome,
        descricao: step.descricao
      }));
      
      // Call the API to generate descriptions
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
    // Apply generated descriptions to movements
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
    setSuccess('Descrições aplicadas com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <ListOrdered className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Movimentação Automática</h2>
              <p className="text-sm text-gray-500 mt-1">Configure a movimentação automática entre etapas e estágios</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
              title="Informações sobre Movimentação Automática"
            >
              <Info className="w-5 h-5" />
            </button>
{canViewAgent && (
  <button
    onClick={() => setIsResetModalOpen(true)}
    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
    title="Resetar configurações"
  >
    <RotateCcw className="w-5 h-5" />
  </button>
)}

{canViewAgent && (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      className="sr-only peer"
      checked={isActive}
      onChange={handleToggleStatus}
      disabled={togglingStatus}
    />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {togglingStatus ? 'Alternando...' : isActive ? 'Ativado' : 'Desativado'}
              </span>
            </label>
          )}
          </div>
        </div>

        {/* Explanation Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">O que é Movimentação Automática?</h3>
          <p className="text-blue-700 text-sm mb-2">
            A Movimentação Automática permite que o Agente de IA mova leads automaticamente entre os estágios do seu funil de vendas com base nas etapas de atendimento.
          </p>
          <p className="text-blue-700 text-sm">
            Por exemplo: quando um lead chega à etapa "Agendamento" no atendimento do agente, ele pode ser movido automaticamente para o estágio "Reunião Agendada" no seu CRM.
          </p>
        </div>

        {funnels.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">
              Nenhum funil cadastrado. Cadastre um funil nas configurações de CRM para utilizar a movimentação automática.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {movements.map((movement) => (
            <div key={movement.ordem} className="bg-orange-50/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                  {movement.ordem}
                </div>
                <h3 className="text-lg font-medium text-gray-900">Movimentação #{movement.ordem}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Etapa de Atendimento
                    <span className="ml-1 text-xs text-gray-500">(Quando o agente chegar nesta etapa...)</span>
                  </label>
                  <select
                    value={movement.id_etapa || ''}
                    disabled={!canViewAgent}
                    onChange={(e) => handleUpdateMovement(movement.ordem, 'id_etapa', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Selecione uma etapa</option>
                    {serviceSteps.map((step) => (
                      <option key={step.Id} value={step.Id}>
                        {step.nome}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Selecione a etapa do agente que, quando atingida, acionará a movimentação automática.
                  </p>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funil
                    </label>
                    <select
                      value={movement.id_funil || ''}
                      disabled={!canViewAgent}
                      onChange={(e) => handleUpdateMovement(movement.ordem, 'id_funil', e.target.value ? parseInt(e.target.value) : null)}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estágio do Funil
                      <span className="ml-1 text-xs text-gray-500">(O lead será movido para este estágio)</span>
                    </label>
                    <select
                      disabled={!canViewAgent || !movement.id_funil}
                      value={movement.id_estagio || ''}
                      onChange={(e) => handleUpdateMovement(movement.ordem, 'id_estagio', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Selecione um estágio</option>
                      {funnels.find(f => f.id === movement.id_funil)?.estagios?.map((stage) => (
                        <option key={stage.Id} value={stage.Id}>
                          {stage.nome}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Selecione o estágio do funil para onde o lead será movido automaticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                  <span className="ml-1 text-xs text-gray-500">(Opcional)</span>
                </label>
                <textarea
                disabled={!canViewAgent}
                  value={movement.descricao || ''}
                  onChange={(e) => handleUpdateMovement(movement.ordem, 'descricao', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="Descreva a situação para o lead ser movido para essa etapa..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Adicione uma descrição de quando a movimentação deve ocorrer. Exemplo: "O lead está nessa etapa quando ele ainda não respondeu nenhuma mensagem desde que entrou no sistema. Nenhuma interação foi iniciada."
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas</label>
                {editingTagsId === movement.Id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={selectedTagId || ''}
                        onChange={e => setSelectedTagId(e.target.value ? parseInt(e.target.value) : null)}
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Selecione</option>
                        {availableTags.map(tag => (
                          <option key={tag.Id} value={tag.Id}>{tag.nome}</option>
                        ))}
                      </select>
                      <button onClick={() => handleAddTag(movement.Id)} disabled={savingTag} className="px-3 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">Adicionar</button>
                      <button type="button" onClick={() => { setEditingTagsId(null); setSelectedTagId(null); }} className="px-3 py-2 bg-gray-200 rounded-lg">Concluir</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {movement.tags && movement.tags.map(tag => (
                        <span key={tag.Id} className="px-2 py-0.5 rounded text-xs flex items-center" style={{ backgroundColor: tag.cor, color: tag.cor_texto }}>
                          {tag.nome}
                          <button type="button" className="ml-1" onClick={() => handleRemoveTag(movement.Id, tag.Id)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1 items-center">
                    {(!movement.tags || movement.tags.length === 0) && <span className="text-sm text-gray-500">Sem etiquetas</span>}
                    {movement.tags && movement.tags.map(tag => (
                      <span key={tag.Id} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: tag.cor, color: tag.cor_texto }}>{tag.nome}</span>
                    ))}
                    {canViewAgent && (
                      <button type="button" onClick={() => { setEditingTagsId(movement.Id); setSelectedTagId(null); }} className="ml-2 text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI Description Generator */}
        {canViewAgent && (
          <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gerar Descrições com IA</h3>
                <p className="text-sm text-gray-500">Use IA para criar descrições claras para cada movimentação</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">
              A IA analisará suas etapas de atendimento e gerará descrições apropriadas para cada movimentação automática, 
              explicando claramente quando um lead deve ser movido para cada estágio.
            </p>
            
            {generationError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{generationError}</span>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleGenerateDescriptions}
                disabled={isGeneratingDescriptions || serviceSteps.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {isGeneratingDescriptions ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Gerando Descrições...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Gerar Descrições com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
{canViewAgent && (
        <div className="flex justify-end pt-6">
          <button
            onClick={handleSave}
            disabled={saving || funnels.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Salvar Movimentações</span>
              </>
            )}
          </button>
        </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirmar Reset"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Você tem certeza?
              </h3>
              <p className="text-gray-500 mt-1">
                Isso vai excluir todas as suas configurações de movimentação atuais.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
  disabled={resetting || !canViewAgent}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
            >
              {resetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetando...</span>
                </>
              ) : (
                'Sim, Resetar'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Como Funciona a Movimentação Automática"
        maxWidth="lg"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Visão Geral</h3>
            <p className="text-gray-700">
              A Movimentação Automática conecta seu Agente de IA com o CRM, permitindo que leads sejam movidos automaticamente entre os estágios do funil de vendas com base nas etapas de atendimento do agente.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">Exemplo prático:</p>
              <p className="text-blue-700 mt-1">
                Quando um lead agenda uma reunião com o agente (Etapa "Agendamento"), ele é automaticamente movido para o estágio "Reunião Agendada" no seu funil de CRM.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Como Configurar</h3>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">1. Etapa de Atendimento</h4>
              <p className="text-gray-700">
                Selecione a etapa do agente que, quando atingida pelo lead durante a conversa, acionará a movimentação automática. Estas etapas são as mesmas que você configurou na seção "Etapas de Atendimento".
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">2. Estágio do Funil</h4>
              <p className="text-gray-700">
                Selecione o estágio do funil para onde o lead será movido automaticamente quando atingir a etapa selecionada. Estes estágios vêm do funil padrão configurado no CRM.
              </p>
              <p className="text-gray-500 text-sm">
                Nota: É necessário ter um funil marcado como "Funil padrão" nas configurações de CRM.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">3. Descrição</h4>
              <p className="text-gray-700">
                Campo opcional para documentar quando e por que esta movimentação deve ocorrer. Útil para referência futura e para outros membros da equipe entenderem a lógica da automação.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Dicas Importantes</h3>
            
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Configure movimentações apenas para etapas significativas do processo (ex: qualificação, agendamento, fechamento).</li>
              <li>Certifique-se de que as etapas do agente estão alinhadas com os estágios do seu funil de vendas.</li>
              <li>Ative a funcionalidade usando o toggle no topo da página após configurar as movimentações.</li>
              <li>Você pode resetar todas as configurações clicando no botão de reset (ícone circular com seta).</li>
              <li>Lembre-se de salvar suas configurações após fazer alterações.</li>
            </ul>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => setShowInfoModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </Modal>

      {/* Generated Descriptions Modal */}
      <Modal
        isOpen={isDescriptionsModalOpen}
        onClose={() => setIsDescriptionsModalOpen(false)}
        title="Descrições Geradas com IA"
        maxWidth="lg"
      >
        <div className="p-6 space-y-6">
          <p className="text-gray-700 mb-4">
            A IA analisou suas etapas de atendimento e gerou as seguintes descrições para cada movimentação:
          </p>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {generatedDescriptions.map((desc) => (
              <div key={desc.ordem} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                    {desc.ordem}
                  </div>
                  <h4 className="font-medium text-gray-900">Movimentação #{desc.ordem}</h4>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{desc.descricao}</p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsDescriptionsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Aplicar Descrições
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Aplicação das Descrições"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tem certeza que deseja aplicar estas descrições?
              </h3>
              <p className="text-gray-500 mt-1">
                Esta ação substituirá todas as descrições atuais das suas movimentações. A alteração é irreversível.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyGeneratedDescriptions}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Sim, Aplicar Descrições
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}