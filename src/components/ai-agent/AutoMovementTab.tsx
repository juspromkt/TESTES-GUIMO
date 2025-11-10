import { useEffect, useState } from 'react';
import { ListOrdered, Loader2, Save, RotateCcw, Info } from 'lucide-react';
import Modal from '../Modal';

interface AutoMovement {
  Id: number;
  ordem: number;
  id_etapa: number | null;
  id_funil: number | null;
  id_estagio: number | null;
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
  estagios?: { Id: number; nome: string; ordem: string }[];
}

interface AutoMovementTabProps {
  token: string;
  canViewAgent: boolean;
  idAgente: number;
}

export default function AutoMovementTab({ token, canViewAgent, idAgente }: AutoMovementTabProps) {
  const [movements, setMovements] = useState<AutoMovement[]>([]);
  const [serviceSteps, setServiceSteps] = useState<ServiceStep[]>([]);
  const [funnels, setFunnels] = useState<Funil[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const [infoOpen, setInfoOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idAgente]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [movementsRes, stepsRes, funnelsRes] = await Promise.all([
        fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/movimentacao/get?id_agente=${idAgente}`, { headers: { token } }),
        fetch(`https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/etapas/get?id_agente=${idAgente}`, { headers: { token } }),
        fetch('https://n8n.lumendigital.com.br/webhook/prospecta/funil/get', { headers: { token } })
      ]);

      const [movementsData, stepsData, funnelsData] = await Promise.all([
        movementsRes.json(), stepsRes.json(), funnelsRes.json()
      ]);

      setMovements(Array.isArray(movementsData) ? movementsData : []);
      setServiceSteps(Array.isArray(stepsData) ? stepsData.map((s: any) => ({ ...s, Id: parseInt(s.Id) })) : []);
      setFunnels(Array.isArray(funnelsData) ? funnelsData : []);
    } catch (err) {
      console.error('Erro ao carregar dados de movimentação:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleUpdateMovement(ordem: number, field: 'id_etapa' | 'id_funil' | 'id_estagio', value: number | null) {
    setMovements(prev => prev.map(m => {
      if (m.ordem !== ordem) return m;
      const updates: Partial<AutoMovement> = { [field]: value } as any;
      if (field === 'id_funil') updates.id_estagio = null;
      return { ...m, ...updates };
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSuccess('');
    try {
      const res = await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/movimentacao/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify(movements.map(m => ({ ...m, id_agente: idAgente })))
      });
      if (res.ok) {
        setSuccess('Movimentações salvas com sucesso!');
        setTimeout(() => setSuccess(''), 2500);
        await fetchAll();
      }
    } catch (err) {
      console.error('Erro ao salvar movimentações:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await fetch('https://n8n.lumendigital.com.br/webhook/prospecta/multiagente/movimentacao/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token },
        body: JSON.stringify({ id_agente: idAgente })
      });
      await fetchAll();
      setResetOpen(false);
    } catch (err) {
      console.error('Erro ao resetar movimentações:', err);
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-neutral-100 rounded-lg flex items-center justify-center">
            <ListOrdered className="w-4 h-4 text-neutral-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Movimentação Automática</h2>
            <p className="text-xs text-neutral-500">Configuração por agente</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setInfoOpen(true)}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
            title="Informações"
          >
            <Info className="w-4 h-4" />
          </button>
          {canViewAgent && (
            <button
              onClick={() => setResetOpen(true)}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
              title="Resetar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="mb-4 px-3 py-2.5 bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-lg text-xs">{success}</div>
      )}

      <div className="space-y-3">
        {movements.map((movement) => (
          <div key={movement.ordem} className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-neutral-200 rounded flex items-center justify-center text-neutral-900 font-semibold text-xs">
                {movement.ordem}
              </div>
              <h3 className="text-xs font-medium text-neutral-900">Movimentação #{movement.ordem}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Etapa de Atendimento
                </label>
                <select
                  value={movement.id_etapa || ''}
                  disabled={!canViewAgent}
                  onChange={(e) => handleUpdateMovement(movement.ordem, 'id_etapa', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
                >
                  <option value="">Selecione uma etapa</option>
                  {serviceSteps.map(step => (
                    <option key={step.Id} value={step.Id}>{step.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Funil de Destino
                </label>
                <select
                  value={movement.id_funil || ''}
                  disabled={!canViewAgent}
                  onChange={(e) => handleUpdateMovement(movement.ordem, 'id_funil', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
                >
                  <option value="">Selecione um funil</option>
                  {funnels.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                  Estágio do Funil
                </label>
                <select
                  disabled={!canViewAgent || !movement.id_funil}
                  value={movement.id_estagio || ''}
                  onChange={(e) => handleUpdateMovement(movement.ordem, 'id_estagio', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
                >
                  <option value="">Selecione um estágio</option>
                  {funnels.find(f => f.id === movement.id_funil)?.estagios?.map(stage => (
                    <option key={stage.Id} value={stage.Id}>{stage.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {canViewAgent && (
        <div className="flex justify-end pt-3">
          <button
            onClick={handleSave}
            disabled={saving || funnels.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      )}

      <Modal isOpen={infoOpen} onClose={() => setInfoOpen(false)} title="Como funciona?">
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            A movimentação automática permite que os leads sejam movidos automaticamente entre funis e estágios
            quando o agente completar determinadas etapas de atendimento.
          </p>
          <p>
            Configure qual etapa do agente dispara a movimentação e para qual funil/estágio o lead deve ser movido.
          </p>
        </div>
      </Modal>

      <Modal isOpen={resetOpen} onClose={() => setResetOpen(false)} title="Resetar Movimentações">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Tem certeza que deseja resetar todas as configurações de movimentação automática?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setResetOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {resetting ? 'Resetando...' : 'Confirmar Reset'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
