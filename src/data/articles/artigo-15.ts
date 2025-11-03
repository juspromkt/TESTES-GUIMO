import { Article } from './types';

export const artigo15: Article = {
  id: 'artigo-15',
  title: 'Visão Geral da Plataforma Guimoo',
  description: 'Conheça todas as funcionalidades da Guimoo: Dashboard, Conversas, Agente de IA, CRM, Agendamentos, Envios em Massa e Configurações.',
  category: 'artigos',
  readTime: '8 min',
  tags: ['Visão Geral', 'Dashboard', 'Plataforma', 'Funcionalidades'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🌐 O que é a Guimoo</h2>
          <p class="mb-3">
            A <strong>Guimoo</strong> é uma plataforma completa de <strong>automação de atendimento via WhatsApp</strong>, com inteligência artificial integrada ao CRM, funil de vendas, agendamento automático e envios em massa.
          </p>
          <p class="mb-3">
            A seguir, veja uma <strong>visão geral de todas as funcionalidades</strong> disponíveis no sistema.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📊 Dashboard</h2>
          <p class="mb-3">O <strong>Dashboard</strong> é a tela inicial da plataforma, onde você visualiza:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📈 <strong>Métricas de conversão</strong> (leads atendidos, agendados, contratados)</li>
            <li>📊 <strong>Gráficos de desempenho</strong> das campanhas</li>
            <li>💬 <strong>Status das conversas ativas</strong></li>
            <li>🎯 <strong>Taxa de conversão por etapa do funil</strong></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💬 Conversas</h2>
          <p class="mb-3">Na aba <strong>Conversas</strong>, você gerencia todos os atendimentos:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📂 Histórico completo de mensagens</li>
            <li>🤖 Controle manual da IA (ativar, pausar, desativar)</li>
            <li>👤 Atribuição de responsáveis</li>
            <li>🏷️ Etiquetas e filtros</li>
            <li>📄 Geração de resumo em PDF</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🤖 Agente de IA</h2>
          <p class="mb-3">O <strong>Agente de IA</strong> é o cérebro da automação. Nessa aba, você configura:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🪪 <strong>Personalidade</strong> (nome do agente, escritório, tom de voz)</li>
            <li>⚖️ <strong>Regras Gerais</strong> (diretrizes de atendimento)</li>
            <li>🧾 <strong>Etapas de Atendimento</strong> (roteiro da conversa)</li>
            <li>❓ <strong>Perguntas Frequentes</strong> (FAQ automático)</li>
            <li>🔄 <strong>Movimentação Automática</strong> (integração com CRM)</li>
            <li>🔊 <strong>Áudio</strong> (respostas por voz)</li>
            <li>⚙️ <strong>Gatilhos</strong> (acionamento automático)</li>
            <li>🕐 <strong>Horários de Funcionamento</strong></li>
            <li>📬 <strong>Notificações</strong></li>
            <li>🔁 <strong>Follow-up Automático</strong></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 CRM (Kanban e Contatos)</h2>
          <p class="mb-3">O <strong>CRM</strong> organiza seus leads em um funil visual:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📋 <strong>Kanban</strong>: visualização por etapas (Recepção, Análise, Oferta, Agendamento etc.)</li>
            <li>👥 <strong>Contatos</strong>: lista completa de leads com filtros e histórico</li>
            <li>🔍 <strong>Detalhes do Deal</strong>: informações completas, campos personalizados, histórico de interações</li>
            <li>📤 <strong>Exportação de dados</strong> em CSV</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📅 Agendamentos</h2>
          <p class="mb-3">O módulo de <strong>Agendamentos</strong> permite:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🗓️ <strong>Visualização em calendário</strong> ou lista</li>
            <li>🔗 <strong>Integração com Google Agenda</strong></li>
            <li>⏰ <strong>Lembretes automáticos</strong> via WhatsApp</li>
            <li>🤖 <strong>IA agenda automaticamente</strong> as reuniões</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📢 Envios em Massa</h2>
          <p class="mb-3">Com a funcionalidade de <strong>Envios em Massa</strong>, você pode:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📋 <strong>Criar listas segmentadas</strong> de contatos</li>
            <li>💬 <strong>Enviar campanhas personalizadas</strong> via WhatsApp</li>
            <li>⏱️ <strong>Agendar disparos</strong> para horários específicos</li>
            <li>📊 <strong>Acompanhar métricas</strong> (enviados, entregues, respondidos)</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Configurações</h2>
          <p class="mb-3">Na aba <strong>Configurações</strong>, você gerencia:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📱 <strong>Conexões de WhatsApp</strong></li>
            <li>🎯 <strong>Funil de Vendas</strong> (criar e editar etapas)</li>
            <li>👥 <strong>Gestão de Usuários</strong></li>
            <li>🏷️ <strong>Etiquetas</strong></li>
            <li>📝 <strong>Campos Personalizados</strong></li>
            <li>🔗 <strong>Origem do Lead</strong></li>
            <li>🏢 <strong>Workspaces</strong> (multi-escritório)</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📚 Tutoriais e Suporte</h2>
          <p class="mb-3">Acesse o suporte completo da Guimoo:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🎥 <strong>Tutoriais em Vídeo</strong></li>
            <li>📄 <strong>Artigos e Guias</strong></li>
            <li>📞 <strong>Suporte via WhatsApp</strong></li>
            <li>📅 <strong>Agendamento de reunião com especialista</strong></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo das Funcionalidades</h2>
          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Módulo</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função Principal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📊 Dashboard</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Visualização de métricas e desempenho</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💬 Conversas</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Gerenciamento de atendimentos</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🤖 Agente de IA</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Configuração da automação</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🎯 CRM</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Funil de vendas e gestão de leads</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📅 Agendamentos</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Reuniões automáticas</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📢 Envios em Massa</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Campanhas de WhatsApp</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⚙️ Configurações</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Personalização e gestão</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Conclusão</h2>
          <p class="mb-3">
            A <strong>Guimoo</strong> oferece uma solução completa de automação de atendimento, integrando IA, CRM, agendamentos e envios em massa — tudo em uma única plataforma.
          </p>
          <p>
            Explore cada módulo para aproveitar ao máximo todas as funcionalidades disponíveis!
          </p>
        </section>
      </div>
    `
};
