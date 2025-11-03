import { Article } from './types';

export const artigo7: Article = {
  id: 'artigo-7',
  title: 'Histórico de Follow-up na Guimoo',
  description: 'Acompanhe todas as ações automáticas de follow-up realizadas pela IA e tenha controle total sobre o fluxo de acompanhamento dos seus leads.',
  category: 'artigos',
  readTime: '4 min',
  tags: ['IA', 'Follow-up', 'Histórico', 'Relatórios'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Histórico de Follow-up</h2>
          <p class="mb-3">
            A aba <strong>Histórico de Follow-up</strong> permite que você acompanhe <strong>todas as ações automáticas de follow-up realizadas pela IA</strong> — ou seja, aquelas mensagens de acompanhamento enviadas após um primeiro contato ou reunião.
          </p>
          <p class="mb-3">
            Com ela, você pode verificar <strong>quem recebeu, quando recebeu e quantas vezes</strong>, garantindo total controle sobre o fluxo de acompanhamento dos seus leads e clientes.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Para que serve</h2>
          <p class="mb-3">O histórico é essencial para:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Saber se um <strong>lead já recebeu follow-up</strong> (e evitar mensagens duplicadas);</li>
            <li>Avaliar a <strong>frequência de contato</strong> da IA com cada lead;</li>
            <li>Acompanhar <strong>resultados por data, funil ou número</strong>;</li>
            <li>Gerenciar a <strong>performance do agente de IA</strong> nas estratégias de follow-up.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até <strong>Agente de IA → Histórico de Follow-up</strong>.</li>
            <li>A tela exibirá uma lista com todos os follow-ups enviados pela IA.</li>
          </ol>
          <p class="mt-3">Cada linha mostrará:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>📞 <strong>Número do lead</strong></li>
            <li>🕓 <strong>Data e hora do envio</strong></li>
            <li>🔁 <strong>Quantidade de follow-ups realizados</strong></li>
            <li>🧩 <strong>Etapa do funil em que o follow-up foi feito</strong></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como usar os filtros</h2>
          <p class="mb-3">O sistema oferece filtros para facilitar sua análise e localização de informações específicas.</p>
          <p class="mb-3">Veja como utilizá-los 👇</p>

          <div class="space-y-4">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">🔍 1. Filtrar por número</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Digite <strong>o número completo ou parte do número</strong> do lead que deseja verificar.</li>
                <li>O sistema exibirá todos os follow-ups feitos para aquele contato.</li>
                <li>Exemplo: digite "9863" e veja todos os leads com esse trecho no número.</li>
              </ul>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-2">
                <p class="text-sm">💡 <em>Ideal para confirmar se um cliente já recebeu um follow-up antes de entrar em contato manualmente.</em></p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">📅 2. Filtrar por data</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Selecione uma <strong>data específica</strong> no calendário.</li>
                <li>O sistema listará apenas os follow-ups enviados naquele dia.</li>
                <li>Exemplo: filtrar por "hoje" para ver todos os envios automáticos do dia corrente.</li>
              </ul>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-2">
                <p class="text-sm">💡 <em>Útil para avaliar o volume diário de mensagens automáticas enviadas pela IA.</em></p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">🧭 3. Filtrar por funil ou etapa</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Escolha um <strong>funil de vendas</strong> (ex: <em>Captação de Leads</em>, <em>Proposta</em>, <em>Contrato</em>).</li>
                <li>É possível também filtrar por <strong>etapa dentro do funil</strong>.</li>
                <li>Exemplo: selecionar "Oferta de Contrato" para ver apenas os follow-ups feitos nessa fase.</li>
              </ul>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-2">
                <p class="text-sm">💡 <em>Excelente para entender em quais etapas do processo os leads estão recebendo mais contatos.</em></p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📈 Leitura dos resultados</h2>
          <p class="mb-3">Após aplicar o filtro, a lista mostrará:</p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>O <strong>horário exato</strong> em que o follow-up foi enviado;</li>
            <li>A <strong>quantidade total de follow-ups</strong> realizados para aquele lead;</li>
            <li>E o <strong>funil ou etapa</strong> onde a ação ocorreu.</li>
          </ul>
          <p class="mt-3">
            Esses dados ajudam a identificar padrões — por exemplo, se a maioria dos leads só responde no segundo follow-up, você pode ajustar a estratégia.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Boas práticas</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Sempre consulte o histórico antes de reenviar uma mensagem de acompanhamento manualmente.</li>
            <li>Use o filtro por data para <strong>avaliar a constância da IA</strong> — se houver períodos sem follow-ups, pode indicar que o agente foi pausado.</li>
            <li>Combine o histórico com os relatórios do CRM para medir <strong>quantos leads retornaram após um follow-up</strong>.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              Você quer saber se o lead "Carlos (62 99999-8888)" recebeu follow-up ontem.
            </blockquote>
            <p>
              Basta acessar <strong>Histórico de Follow-up</strong>, digitar o número "8888" no campo de filtro e escolher a data de ontem.
            </p>
            <p>O sistema mostrará:</p>
            <div class="bg-white dark:bg-neutral-700 p-3 rounded border border-gray-300 dark:border-neutral-600">
              <p class="text-sm">
                "Follow-up enviado em 02/11/2025 às 14:15 – Etapa: Oferta de Contrato – Total: 2 envios."
              </p>
            </div>
            <p class="mt-2">
              Assim, você confirma o envio e evita repetir contatos desnecessários.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Filtro</th>
                  <th class="text-left py-2 font-bold">O que faz</th>
                  <th class="text-left py-2 font-bold">Quando usar</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🔢 Número</td>
                  <td class="py-2">Mostra follow-ups de um contato específico</td>
                  <td class="py-2">Quando quer verificar se o lead já recebeu</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">📅 Data</td>
                  <td class="py-2">Mostra follow-ups enviados em uma data</td>
                  <td class="py-2">Para monitorar o volume diário</td>
                </tr>
                <tr>
                  <td class="py-2">🧭 Funil/Etapa</td>
                  <td class="py-2">Mostra follow-ups de uma etapa específica</td>
                  <td class="py-2">Para medir performance por fase</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Conclusão</h2>
          <p class="mb-3">
            O <strong>Histórico de Follow-up</strong> é uma ferramenta estratégica dentro da Guimoo — ele traz <strong>transparência, controle e eficiência</strong> para o acompanhamento automatizado, garantindo que cada lead receba atenção no momento certo, sem falhas nem repetições.
          </p>
        </section>
      </div>
    `
};
