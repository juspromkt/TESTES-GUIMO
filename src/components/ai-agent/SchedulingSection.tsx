import React, { useEffect } from "react";
import { Save } from "lucide-react";
import Modal from "../Modal";
import { Loader2 } from "lucide-react";

interface Scheduling {
  isAtivo: boolean;
  id_agenda: string;
  nome: string;
  descricao: string;
  prompt_consulta_horarios: string;
  prompt_marcar_horario: string;
  duracao_horario: string | null;
  limite_agendamento_horario: number | null;
  agenda_padrao: 'GOOGLE_MEET' | 'AGENDA_INTERNA' | 'SISTEMA_EXTERNO';
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
  const [loading, setLoading] = React.useState(true);

  // 🔹 Carregar dados da API quando o componente é montado
  useEffect(() => {
    const fetchScheduling = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://n8n.lumendigital.com.br/webhook/prospecta/agente/agendamento/get',
          { headers: { token } }
        );
        const text = await response.text();
        const data = text ? JSON.parse(text) : [];
        if (Array.isArray(data) && data.length > 0) {
          setScheduling(data[0]);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de agendamento:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScheduling();
  }, [token, setScheduling]);

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
        "Sempre que o usuário mencionar uma data ou pedir para agendar uma reunião, você deve:\n\n1. Consultar os próximos 3 dias disponíveis para agendamento.\n2. Selecionar 3 horários disponíveis para cada dia.\n3. Apresentar a lista de forma clara e organizada, no seguinte formato:\n\nAqui estão os próximos horários disponíveis:\n\n📅 [Data 1]\n- 09h00\n- 14h00\n- 16h30\n\n📅 [Data 2]\n- 10h00\n- 13h30\n- 17h00\n\n📅 [Data 3]\n- 09h30\n- 15h00\n- 18h00\n\nNunca agende mais de uma reunião no mesmo horário.\nNão agende em horários que não estão disponíveis.\nNão agende em horários que já tenham outros compromissos.\n\nHorários que podem ser agendados:\nSegunda à sexta-feira, das 9:30 às 16:30 (com intervalo das 12h às 13h).\n❌ NUNCA agendar em outros horários além desses disponíveis.",
      prompt_marcar_horario:
        "Use essa tool para criar um agendamento no Google Calendar quando você tiver os dados de agendamento do cliente, como dia, horário e e-mail do cliente para reunião.\n\nSempre que o usuário confirmar uma data e horário para reunião, você deve:\n\n1. Criar o evento no Google Calendar com:\n   - Nome do cliente\n   - Data e horário definidos\n   - E-mail do cliente (para convite)\n   - Descrição breve da reunião\n\n2. Confirmar o agendamento enviando uma resposta clara:\n\"✅ Reunião agendada com sucesso para [data] às [horário]. Um convite foi enviado para o e-mail do cliente.\"\n\n⚠️ Importante:\n- Nunca criar agendamento sem confirmação do horário.\n- Sempre verificar se o horário está dentro do intervalo permitido (segunda a sexta, das 9:30 às 16:30, com pausa entre 12h e 13h).\n- Caso o horário esteja fora do intervalo, solicite ao cliente que escolha outro horário disponível.",
      nome:
        "Reunião de Peticionamento (nome do cliente)",
      descricao:
        "Sempre leia toda a conversa e produza a descrição seguindo exatamente este formato, sem alterar títulos ou a ordem:\n\nResumo da conversa com [NOME DO CLIENTE] sobre atendimento jurídico [ÁREA JURÍDICA]:\n\nResumo objetivo e insights para fechamento:\n\n• [Listar em tópicos os principais fatos relatados pelo cliente: situação de trabalho/etc.]\n• [Incluir pontos de interesse na ação: valores, expectativas, intenção de fechar, etc.]\n• [Registrar dores e motivações para processar ou prosseguir.]\n\nDados extraídos de documentos:\n\n• [Nome completo extraído, se houver.]\n• [Contrato ou documentos assinados.]\n• [Plataforma utilizada para assinatura/envio de documentos.]\n• [Links para consulta, quando existirem.]\n\nRiscos potenciais envolvidos:\n\n• [Listar em tópicos os riscos ou pontos de atenção que podem atrapalhar o caso ou a relação com o cliente.]\n\nObjeções e dúvidas expressas pelo cliente:\n\n• [Listar em tópicos os medos, inseguranças, questionamentos ou resistências do cliente.]\n\nConclusão:\n\n[Parágrafo consolidando: status atual do atendimento, decisão do cliente até o momento, próximos passos esperados.]\n\nObservação de uso:\n\nEste resumo é útil para o time jurídico que irá conduzir o processo, garantindo entendimento consolidado do caso e do estágio atual do atendimento.\n\n⚡ Importante:\n\nSempre use frases claras e objetivas.\n\nResuma sem inventar informações que não existam no histórico.\n\nSe algum item não existir na conversa, apenas omita.",
    });
  };

  const durationOptions = [
    { value: "30", label: "30 minutos" },
    { value: "60", label: "1 hora" },
    { value: "90", label: "1 hora e 30 minutos" },
    { value: "120", label: "2 horas" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 dark:text-neutral-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Configurações de Agendamento */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
          Configurações de Agendamento
        </h2>
        {canEdit && (
          <button
            onClick={applyDefaultTexts}
            className="text-sm px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
          >
            Aplicar textos padrão
          </button>
        )}
      </div>

      <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Agenda Padrão
              </label>
              <select
                value={scheduling.agenda_padrao}
                disabled={!canEdit}
                onChange={(e) =>
                  setScheduling({ ...scheduling, agenda_padrao: e.target.value as Scheduling['agenda_padrao'] })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="GOOGLE_MEET">Google Agenda</option>
                <option value="AGENDA_INTERNA">Agenda Interna</option>
              </select>
            </div>

            {scheduling.agenda_padrao === 'GOOGLE_MEET' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  ID da Agenda
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={scheduling.id_agenda}
                  onChange={(e) =>
                    setScheduling({ ...scheduling, id_agenda: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                  placeholder="Digite o ID da agenda"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Duração do Horário
              </label>
              <select
                value={scheduling.duracao_horario || ""}
                disabled={!canEdit}
                onChange={(e) =>
                  setScheduling({ ...scheduling, duracao_horario: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione</option>
                {durationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                Limite por horário
              </label>
              <select
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Selecione</option>
                <option value="1">1 agendamento</option>
                <option value="2">2 agendamentos</option>
                <option value="3">3 agendamentos</option>
                <option value="4">4 agendamentos</option>
                <option value="5">5 agendamentos</option>
              </select>
            </div>
          </div>

      {scheduling.agenda_padrao === 'SISTEMA_EXTERNO' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
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
              className="w-full rounded-md border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 shadow-sm focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500 dark:focus:ring-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="Informe a URL de consulta"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
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
              className="w-full rounded-md border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 shadow-sm focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500 dark:focus:ring-emerald-400 placeholder:text-gray-400 dark:placeholder:text-neutral-500"
              placeholder="Informe a URL de marcação"
            />
          </div>
        </>
      )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-neutral-500 resize-none"
              placeholder="Digite o prompt para consulta de horários"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-neutral-500 resize-none"
              placeholder="Digite o prompt para marcar horário"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-neutral-500 resize-none"
              placeholder="Explique para a IA como definir o nome"
            />
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5">
              Descreva para a IA as regras para gerar o nome do agendamento.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-neutral-500 resize-none"
              placeholder="Explique para a IA como definir a descrição"
            />
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1.5">
              A IA usará estas instruções para preencher a descrição.
            </p>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveWithModal}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar configurações
                  </>
                )}
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
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500 dark:text-emerald-400" />
                <p className="text-sm text-gray-600 dark:text-neutral-400">
                  Processando agendamento...
                </p>
              </div>
            ) : (
              <p className="text-gray-700 dark:text-neutral-300">
                Configurações de agendamento salvas com sucesso!
              </p>
            )}
          </Modal>
      </div>
    </div>
  );
};

export default SchedulingSection;