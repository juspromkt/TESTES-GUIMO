import React, { useState, useEffect } from 'react';
import { ListOrdered, Loader2, Save, Pencil, X } from 'lucide-react';
import type { Tag } from '../types/tag';

interface AutoMovement {
  Id: number;
  ordem: number;
  descricao: string | null;
  id_etapa: number;
  id_funil: number | null;
  id_estagio: number | null;
  tags?: Tag[];
}

interface ServiceStep {
  Id: string;
  nome: string;
  ordem: string;
}

interface Funil {
  id: number;
  nome: string;
  isFunilPadrao: boolean;
  estagios?: {
    Id: string;
    nome: string;
    ordem: string;
  }[];
}

export default function AutoMovement() {
  const [movements, setMovements] = useState<AutoMovement[]>([]);
  const [serviceSteps, setServiceSteps] = useState<ServiceStep[]>([]);
  const [defaultFunnel, setDefaultFunnel] = useState<Funil | null>(null);
  const [funnels, setFunnels] = useState<Funil[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [editingTagsId, setEditingTagsId] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  const user = localStorage.getItem('user');
  const token = user ? JSON.parse(user).token : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [movementsResponse, stepsResponse, funnelsResponse] = await Promise.all([
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/movimentacao/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/agente/etapas/get', {
          headers: { token }
        }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', {
          headers: { token }
        })
      ]);

      const [movementsData, stepsData, funnelsData] = await Promise.all([
        movementsResponse.json(),
        stepsResponse.json(),
        funnelsResponse.json()
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
      setServiceSteps(Array.isArray(stepsData) ? stepsData : []);

      const validFunnels = Array.isArray(funnelsData)
        ? funnelsData.map((f: Funil) => ({
            ...f,
            estagios: f.estagios?.map(s => ({
              ...s,
              Id: parseInt(s.Id)
            }))
          }))
        : [];

      setFunnels(validFunnels);

      const defaultFunnel = validFunnels.find(funnel => funnel.isFunilPadrao) || null;
      setDefaultFunnel(defaultFunnel);

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <ListOrdered className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimentação Automática</h1>
          <p className="text-sm text-gray-500 mt-1">Configure a movimentação automática entre etapas dos agentes e etapas dos funis</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
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
                  </label>
                  <select
                    value={movement.id_etapa || ''}
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
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funil
                    </label>
                    <select
                      value={movement.id_funil || ''}
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
                      Etapa do Funil
                    </label>
                    <select
                      value={movement.id_estagio || ''}
                      onChange={(e) => handleUpdateMovement(movement.ordem, 'id_estagio', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      disabled={!movement.id_funil}
                    >
                      <option value="">Selecione uma etapa</option>
                      {funnels.find(f => f.id === movement.id_funil)?.estagios?.map((stage) => (
                        <option key={stage.Id} value={stage.Id}>
                          {stage.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={movement.descricao || ''}
                  onChange={(e) => handleUpdateMovement(movement.ordem, 'descricao', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  placeholder="Descreva a situação para o lead ser movido para essa etapa..."
                />
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
                    <button type="button" onClick={() => { setEditingTagsId(movement.Id); setSelectedTagId(null); }} className="ml-2 text-blue-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {success && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

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
      </div>
    </div>
  );
}