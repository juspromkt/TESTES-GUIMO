import React from "react";
import { Save } from "lucide-react";
import Modal from "../Modal";
import { Loader2 } from "lucide-react";
import ScheduleWindowsSection from "./ScheduleWindowsSection";

interface Scheduling {
  isAtivo: boolean;
  id_agenda: string;
  nome: string;
  descricao: string;
  prompt_consulta_horarios: string;
  prompt_marcar_horario: string;
  duracao_horario: string | null;
  limite_agendamento_horario: number | null;
  agenda_padrao: 'GOOGLE_MEET' | 'AGENDA_INTERNA';
  url_consulta_externa: string | null;
  url_marcacao_externa: string | null;
}

interface SchedulingSectionProps {
  scheduling: Scheduling;
  setScheduling: (scheduling: Scheduling) => void;
  token: string;
  canEdit: boolean; // ✅ nova prop
}

const SchedulingSection: React.FC<SchedulingSectionProps> = ({
  scheduling,
  setScheduling,
  token,
  canEdit,
}) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalLoading, setModalLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const handleSaveWithModal = async () => {
    try {
      setSaving(true);
      setModalLoading(true);

      const response = await fetch(
        "https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            token,
          },
          body: JSON.stringify(scheduling),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao salvar configurações de agendamento");
      }

      setTimeout(() => {
        setModalLoading(false);
        setModalOpen(true);
        setSaving(false);
      }, 300);
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      alert("Erro ao salvar configurações de agendamento");
      setModalLoading(false);
      setSaving(false);
    }
  };

  const applyDefaultTexts = () => {
    setScheduling({
      ...scheduling,
      prompt_consulta_horarios:
        "Você deve chamar esse prompt todas as vezes que o usuário informar um dia para realizar uma reunião. Seu papel é consultar um dia inteiro de horários para ver a lista de horários marcados para aquele dia.\n\nEscolha até 6 horários para retornar para o cliente.",
      prompt_marcar_horario:
        "Use essa tool para criar um agendamento no Google Calendar quando você tiver os dados de agendamento do cliente, como dia, horário e email do cliente para reunião.",
    });
  };

  const durationOptions = [
    { value: "30", label: "30 minutos" },
    { value: "60", label: "1 hora" },
    { value: "90", label: "1 hora e 30 minutos" },
    { value: "120", label: "2 horas" },
  ];

  return (
    <>
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Configurações de Agendamento
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
<label className="relative inline-flex items-center cursor-pointer">
  <input
    type="checkbox"
    className="sr-only peer"
    checked={scheduling.isAtivo}
    onChange={(e) =>
      setScheduling({ ...scheduling, isAtivo: e.target.checked })
    }
    disabled={!canEdit}
  />
  <div
    className={`
      w-11 h-6 bg-gray-200 rounded-full relative transition-all
      peer-focus:ring-4 peer-focus:ring-emerald-300
      peer-checked:bg-emerald-500
      after:content-[''] after:absolute after:top-[2px] after:left-[2px]
      after:h-5 after:w-5 after:rounded-full after:bg-white after:border after:border-gray-300
      after:transition-all peer-checked:after:translate-x-5 peer-checked:after:border-white
      ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  />
  <span className="ml-3 text-gray-700">Ativar agendamento automático</span>
</label>

        {canEdit && (
          <button
            onClick={applyDefaultTexts}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Aplicar textos padrão
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Agenda Padrão
        </label>
        <select
          value={scheduling.agenda_padrao}
          disabled={!canEdit}
          onChange={(e) =>
            setScheduling({ ...scheduling, agenda_padrao: e.target.value as Scheduling['agenda_padrao'] })
          }
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
        >
          <option value="GOOGLE_MEET">Google Agenda</option>
          <option value="AGENDA_INTERNA">Agenda Interna</option>
        </select>
      </div>

      {scheduling.agenda_padrao === 'GOOGLE_MEET' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID da Agenda
          </label>
          <input
            type="text"
            disabled={!canEdit}
            value={scheduling.id_agenda}
            onChange={(e) =>
              setScheduling({ ...scheduling, id_agenda: e.target.value })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Digite o ID da agenda"
          />
        </div>
      )}

      {scheduling.agenda_padrao === 'SISTEMA_EXTERNO' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL do Webhook para Consulta Externa
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={scheduling.url_consulta_externa || ''}
              onChange={(e) =>
                setScheduling({
                  ...scheduling,
                  url_consulta_externa: e.target.value,
                })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Informe a URL de consulta"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL do Webhook para Marcação Externa
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={scheduling.url_marcacao_externa || ''}
              onChange={(e) =>
                setScheduling({
                  ...scheduling,
                  url_marcacao_externa: e.target.value,
                })
              }
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Informe a URL de marcação"
            />
          </div>
        </>
      )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prompt para Consulta de Horários
          </label>
          <textarea
            value={scheduling.prompt_consulta_horarios}
            disabled={!canEdit}
            onChange={(e) =>
              setScheduling({
                ...scheduling,
                prompt_consulta_horarios: e.target.value,
              })
            }
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Digite o prompt para consulta de horários"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prompt para Marcar Horário
          </label>
          <textarea
            value={scheduling.prompt_marcar_horario}
            disabled={!canEdit}
            onChange={(e) =>
              setScheduling({
                ...scheduling,
                prompt_marcar_horario: e.target.value,
              })
            }
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Digite o prompt para marcar horário"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duração do Horário
          </label>
          <select
            value={scheduling.duracao_horario || ""}
            disabled={!canEdit}
            onChange={(e) =>
              setScheduling({ ...scheduling, duracao_horario: e.target.value })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Selecione a duração</option>
            {durationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Limite de agendamentos por horário
          </label>
          <input
            type="number"
            min={1}
            disabled={!canEdit}
            value={scheduling.limite_agendamento_horario ?? ''}
            onChange={(e) =>
              setScheduling({
                ...scheduling,
                limite_agendamento_horario: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="Quantos agendamentos podem ocorrer no mesmo horário?"
          />
          <p className="text-xs text-gray-500 mt-1">
            Define a quantidade máxima de reuniões simultâneas para um mesmo horário.
          </p>
        </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instruções para Nome do Agendamento
        </label>
        <textarea
          value={scheduling.nome}
          disabled={!canEdit}
          onChange={(e) =>
            setScheduling({
              ...scheduling,
              nome: e.target.value,
            })
          }
          rows={2}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="Explique para a IA como definir o nome"
        />
        <p className="text-xs text-gray-500 mt-1">
          Descreva para a IA as regras para gerar o nome do agendamento.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Instruções para Descrição do Agendamento
        </label>
        <textarea
          value={scheduling.descricao}
          disabled={!canEdit}
          onChange={(e) =>
            setScheduling({
              ...scheduling,
              descricao: e.target.value,
            })
          }
          rows={3}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="Explique para a IA como definir a descrição"
        />
        <p className="text-xs text-gray-500 mt-1">
          A IA usará estas instruções para preencher a descrição.
        </p>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveWithModal}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar configurações
              </>
            )}{" "}
          </button>
        </div>
      )}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Sucesso"
        >
          {modalLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              <p className="text-sm text-gray-600">
                Processando agendamento...
              </p>
            </div>
          ) : (
            <p className="text-gray-700">
              Configurações de agendamento salvas com sucesso!
            </p>
          )}
        </Modal>
      </div>
    </section>
    <ScheduleWindowsSection token={token} canEdit={canEdit} />
    </>
  );
};

export default SchedulingSection;