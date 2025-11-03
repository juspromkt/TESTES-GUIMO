import { Article } from './types';

export const artigo20: Article = {
  id: 'artigo-20',
  title: 'Configuração de Agendamentos Automáticos na Guimoo',
  description: 'Configure reuniões automáticas com clientes através da IA, integre com Google Agenda e envie lembretes automaticamente.',
  category: 'artigos',
  readTime: '7 min',
  tags: ['Agendamentos', 'Google Agenda', 'IA', 'Lembretes', 'Calendário'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Sistema de Agendamentos</h2>
          <p class="mb-3">
            A função <strong>Agendamentos</strong> da Guimoo permite que você <strong>configure reuniões automáticas com clientes</strong> diretamente pela Inteligência Artificial, totalmente integrada ao <strong>Google Agenda</strong> ou à <strong>agenda interna</strong> do sistema.
          </p>
          <p class="mb-3">
            Com ela, a IA pode:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🗓️ Agendar reuniões automaticamente durante o atendimento,</li>
            <li>🔄 Sincronizar com o seu Google Calendar,</li>
            <li>🔔 Enviar lembretes automáticos para o cliente,</li>
            <li>🧩 Manter todo o histórico de agendamentos em um único painel.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Acesso e Visão Geral</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>No menu lateral, clique em <strong>Agendamentos</strong>.</li>
            <li>Você verá três modos de visualização:
              <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>Calendário</strong> → Exibe os compromissos em formato mensal, semanal ou diário.</li>
                <li><strong>Lista</strong> → Mostra os agendamentos em formato de tabela.</li>
                <li><strong>Configurações</strong> → Onde você ajusta o funcionamento da IA.</li>
              </ul>
            </li>
          </ol>

          <p class="mb-3">
            Na parte superior, há um <strong>indicador de status (Ativado / Desativado)</strong>.
          </p>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <p class="text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Importante:</strong> mantenha o sistema <strong>Ativado</strong> para que a IA possa criar agendamentos automáticos.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Etapa 1 – Configurar o Agendamento Automático</h2>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">🔧 Escolha o tipo de agenda</h3>
            <p class="mb-2">Você pode optar entre dois modos:</p>
            <ol class="list-decimal list-inside space-y-1 ml-4">
              <li><strong>Agenda Interna</strong> – usada apenas dentro do sistema Guimoo.</li>
              <li><strong>Google Agenda</strong> – sincroniza automaticamente com o Google Calendar.</li>
            </ol>
            <p class="text-sm text-gray-600 dark:text-neutral-400 mt-2">
              💡 Se escolher o Google Agenda, configure antes o ID da agenda (há um tutorial específico na Central Guimoo chamado "Configuração do Google Agenda").
            </p>
          </div>

          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">⏱️ Defina os parâmetros principais</h3>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Campo</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Exemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⏳ <strong>Duração do horário</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Tempo padrão de cada reunião</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">30 min, 60 min ou 90 min</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔢 <strong>Limite por horário</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Quantos agendamentos podem ser feitos no mesmo horário</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">1 (recomendado)</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧠 <strong>Prompt para consulta e instruções</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Textos usados pela IA para confirmar horários</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Clique em <strong>Aplicar texto padrão</strong></td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💾 <strong>Salvar</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Confirma as configurações</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Sempre clique em <strong>Salvar</strong> após editar</td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 Se apenas uma pessoa atende por vez, mantenha o limite por horário em 1.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🕐 Etapa 2 – Definir Horários Disponíveis</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>Vá até a aba <strong>"Horários Disponíveis"</strong>.</li>
            <li>Selecione o <strong>dia da semana</strong> (ex: Segunda-feira).</li>
            <li>Defina o período de atendimento — por exemplo:
              <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>09:30 às 11:30</li>
                <li>13:30 às 16:30</li>
              </ul>
            </li>
            <li>Clique em <strong>"Replicar para todos os dias"</strong> se quiser aplicar o mesmo horário de segunda a sexta.</li>
            <li>Adicione sábados, domingos ou horários personalizados, se desejar.</li>
          </ol>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 O sistema permite criar <strong>vários blocos de horários</strong> por dia, separando manhã, almoço e tarde.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔔 Etapa 3 – Configurar Lembretes Automáticos</h2>
          <p class="mb-3">
            A IA pode <strong>lembrar o cliente automaticamente</strong> sobre a reunião agendada.
          </p>
          <p class="mb-3">
            Na aba <strong>Lembretes</strong>, clique em <strong>"Usar texto padrão"</strong> e ative os horários de lembrete:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-3">
            <li>⏰ <strong>8h da manhã no dia da reunião</strong></li>
            <li>⏰ <strong>2 horas antes</strong></li>
            <li>⏰ <strong>1 hora antes</strong></li>
          </ul>
          <p class="mb-3">
            Essas mensagens são enviadas automaticamente para o WhatsApp do cliente, garantindo presença e engajamento.
          </p>

          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <p class="text-green-800 dark:text-green-200">
              ✅ <strong>Dica:</strong> mantenha os lembretes <strong>ativados e salvos</strong> para todos os agendamentos.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📅 Etapa 4 – Gerenciando o Calendário</h2>
          <p class="mb-3">
            Na aba <strong>Calendário</strong>, você tem visão completa de todos os compromissos marcados.
            É possível visualizar em quatro modos:
          </p>
          <ul class="list-disc list-inside space-y-1 ml-4 mb-3">
            <li><strong>Mês</strong></li>
            <li><strong>Semana</strong></li>
            <li><strong>Dia</strong></li>
            <li><strong>Lista</strong></li>
          </ul>

          <p class="mb-3">
            👉 Clique sobre qualquer reunião para abrir o resumo, editar informações ou vincular ao CRM do lead.
          </p>

          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">📘 Funções disponíveis no calendário:</h3>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">➕ <strong>Novo Agendamento</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Clique em qualquer data para criar uma nova reunião manualmente</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧩 <strong>Vincular ao CRM</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Relacione a reunião ao lead ou negociação correspondente</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✏️ <strong>Editar Agendamento</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Altere data, horário ou observações</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🗑️ <strong>Excluir Agendamento</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Remova reuniões antigas ou canceladas</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📋 Etapa 5 – Visualizando em Lista</h2>
          <p class="mb-3">
            A visualização em lista é ideal para controle de rotina diária.
            Você pode filtrar rapidamente por:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-3">
            <li>📆 <strong>Hoje</strong></li>
            <li>📅 <strong>Amanhã</strong></li>
            <li>🗓️ <strong>Próximos 7 dias</strong></li>
            <li>🔍 <strong>Todas as reuniões</strong></li>
          </ul>
          <p>
            Assim, você sabe exatamente o que está agendado e quando a IA fará novos compromissos.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Exemplo prático</h2>
          <blockquote class="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
            <strong>⚖️ Escritório Trabalhista – Configuração recomendada:</strong>
            <br><br>
            <ul class="list-disc list-inside space-y-2">
              <li>Tipo de Agenda: Google Agenda</li>
              <li>Duração: 1 hora</li>
              <li>Limite por horário: 1</li>
              <li>Horários disponíveis:
                <ul class="list-disc list-inside ml-6 mt-1">
                  <li>09:30 às 11:30</li>
                  <li>13:30 às 16:30</li>
                </ul>
              </li>
              <li>Lembretes:
                <ul class="list-disc list-inside ml-6 mt-1">
                  <li>8h, 2h antes e 1h antes da reunião</li>
                </ul>
              </li>
            </ul>
            <br>
            <strong>Resultado:</strong><br>
            A IA agenda automaticamente as reuniões, bloqueia os horários ocupados no Google Calendar e envia lembretes para os clientes sem intervenção manual.
          </blockquote>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">O que fazer</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Ação recomendada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">1️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Escolher tipo de agenda</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Google Agenda ou Interna</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">2️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Configurar duração e limite</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">30–60 min / 1 por horário</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">3️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Definir horários disponíveis</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Segunda a sexta, com blocos personalizados</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">4️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ativar lembretes</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">8h, 2h antes e 1h antes</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">5️⃣</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Ver no calendário ou lista</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Filtrar por período para melhor gestão</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Boas práticas</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>✅ Mantenha sempre <strong>ativado</strong> o agendamento automático.</li>
            <li>🧭 Revise o <strong>ID da agenda</strong> na integração com Google Calendar.</li>
            <li>🕓 Ajuste os horários conforme a disponibilidade real do time.</li>
            <li>🔕 Use lembretes automáticos para reduzir faltas.</li>
            <li>🔄 Verifique o calendário diariamente para garantir organização.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Conclusão</h2>
          <p class="mb-3">
            O módulo <strong>Agendamentos da Guimoo</strong> une automação e praticidade:
            a IA agenda, lembra e organiza suas reuniões — enquanto você foca no atendimento.
          </p>
          <p>
            Com a integração ao <strong>Google Agenda</strong> e os <strong>lembretes automáticos</strong>, seu escritório mantém um fluxo profissional, sem perder nenhum compromisso.
          </p>
        </section>
      </div>
    `
};
