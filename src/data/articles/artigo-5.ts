import { Article } from './types';

export const artigo5: Article = {
  id: 'artigo-5',
  title: 'Configuração de Horário de Funcionamento da IA',
  description: 'Entenda como definir em quais dias e horários sua IA estará ativa para atender automaticamente.',
  category: 'artigos',
  readTime: '3 min',
  tags: ['IA', 'Configuração', 'Horários'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Horário de Funcionamento da IA</h2>
          <p class="mb-3">
            A configuração de <strong>Horário de Funcionamento</strong> define <strong>em quais dias e horários sua Inteligência Artificial estará ativa</strong> para responder automaticamente aos clientes.
          </p>
          <p class="mb-3">
            Essa função é útil quando o escritório quer limitar os atendimentos automáticos — por exemplo, apenas em horário comercial — ou quando deseja pausar a IA fora do expediente.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
            <p class="text-sm">
              No entanto, a Guimoo recomenda manter a IA <strong>ativa 24 horas por dia, 7 dias por semana</strong>, garantindo que nenhum lead fique sem resposta imediata.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Onde encontrar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até <strong>Agente de IA</strong>.</li>
            <li>Localize a seção <strong>Horário de Funcionamento</strong>.</li>
          </ol>
          <p class="mt-3 text-sm">Lá você encontrará os campos de configuração de horário e a opção para ativar/desativar o limite.</p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como configurar o horário de funcionamento</h2>

          <div class="space-y-4">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">1. Ative o controle de horário:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Clique para <strong>ativar</strong> o limite de funcionamento.</li>
                <li>Isso permite definir um horário inicial e final de atendimento.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">2. Defina o horário de início e término:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>No campo <strong>"Horário de início"</strong>, insira a hora em que a IA deve começar a atender.</li>
                <li>No campo <strong>"Horário de final"</strong>, insira a hora em que ela deve parar.</li>
                <li>Exemplo: das <strong>08:00 às 18:00</strong>.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">3. Salve as alterações:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Após definir, clique em <strong>Salvar</strong> para aplicar o novo horário.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">4. Testar a configuração:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Envie uma mensagem para o seu número fora do horário configurado.</li>
                <li>A IA não deverá responder até o horário de início definido.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Recomendação da Guimoo</h2>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-green-600 pl-4">
              "No meu ponto de vista, não faz o menor sentido limitar o horário da IA, porque ela foi feita para trabalhar 24h por dia, 7 dias por semana."
            </blockquote>
            <p>
              A <strong>IA foi projetada para atender automaticamente a qualquer hora</strong>, inclusive fora do expediente — captando leads e mantendo o contato ativo com clientes que mandam mensagens à noite ou no fim de semana.
            </p>
            <p>
              Por isso, recomendamos <strong>não ativar o horário de funcionamento</strong>, a menos que seu fluxo de atendimento exija pausas automáticas.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <p>🏢 O escritório <strong>Santos & Lima Advocacia</strong> quer que a IA funcione apenas no horário comercial.</p>
            <p>✅ Eles configuram:</p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>Horário de início → <strong>08:00</strong></li>
              <li>Horário de final → <strong>18:00</strong></li>
              <li>Ativam o controle de horário.</li>
            </ul>
            <p>📌 Assim, qualquer mensagem recebida após as 18h só será respondida no dia seguinte, às 8h.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚠️ Atenção</h2>
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500 space-y-3">
            <p>⚠️ Se a IA estiver <strong>desativada fora do horário</strong>, leads que entrarem nesse período <strong>não serão atendidos automaticamente</strong>.</p>
            <p>💡 Para garantir agilidade e não perder oportunidades, considere manter o atendimento ativo 24h, com a IA filtrando e qualificando os leads enquanto a equipe humana está offline.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo Rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Função</th>
                  <th class="text-left py-2 font-bold">O que faz</th>
                  <th class="text-left py-2 font-bold">Recomendação</th>
                </tr>
              </thead>
              <tbody class="space-y-2">
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">Horário de Funcionamento</td>
                  <td class="py-2">Define horário em que a IA estará ativa</td>
                  <td class="py-2">Use apenas se quiser limitar o atendimento</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">Horário de Início</td>
                  <td class="py-2">Hora em que a IA começa a responder</td>
                  <td class="py-2">Ex: 08:00</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">Horário de Final</td>
                  <td class="py-2">Hora em que a IA para de responder</td>
                  <td class="py-2">Ex: 18:00</td>
                </tr>
                <tr>
                  <td class="py-2">Ativação</td>
                  <td class="py-2">Liga ou desliga o controle de horário</td>
                  <td class="py-2">Recomenda-se manter <strong>desativado</strong> para 24h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `
};
