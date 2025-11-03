import { Article } from './types';

export const artigo11: Article = {
  id: 'artigo-11',
  title: 'Configuração de Follow-up Automático da IA',
  description: 'Configure mensagens automáticas de acompanhamento para recuperar leads inativos e aumentar suas taxas de resposta.',
  category: 'artigos',
  readTime: '5 min',
  tags: ['IA', 'Follow-up', 'Automação', 'Recuperação de Leads'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Follow-up da IA</h2>
          <p class="mb-3">
            A função de <strong>Follow-up Automático</strong> da Guimoo permite que a Inteligência Artificial <strong>retome o contato com leads que pararam de responder</strong>, enviando mensagens automáticas de acompanhamento em intervalos definidos.
          </p>
          <p class="mb-3">
            Essa função é essencial para <strong>manter a comunicação ativa</strong>, aumentar as taxas de resposta e <strong>recuperar leads que ficaram inativos</strong> — tudo sem precisar de intervenção manual da equipe.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Onde encontrar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até <strong>Agente de IA → Follow-up</strong>.</li>
            <li>Você verá duas abas principais:</li>
          </ol>
          <ul class="list-disc list-inside space-y-2 ml-8 mt-2">
            <li>🧩 <strong>Configuração</strong></li>
            <li>📜 <strong>Histórico</strong></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como configurar o Follow-up</h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">1️⃣ Aplicar o texto padrão</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Clique no botão <strong>"Aplicar texto padrão"</strong>.</li>
                <li>O sistema preencherá automaticamente uma mensagem modelo recomendada pela Guimoo — pronta para uso imediato.</li>
                <li>Se preferir, você pode <strong>editar o texto</strong> para deixá-lo com o tom do seu escritório.</li>
              </ul>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
                <p class="text-sm">💡 <em>Dica:</em> mantenha a mensagem curta, amigável e focada no próximo passo (ex: confirmar interesse, enviar documentos, etc.).</p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">2️⃣ Ativar e salvar</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Marque a opção <strong>"Ativado"</strong> para que o sistema envie os follow-ups automaticamente.</li>
                <li>Clique em <strong>Salvar</strong> antes de sair da tela.</li>
              </ul>
              <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-yellow-500 mt-3">
                <p class="text-sm">⚠️ <em>Se você esquecer de salvar, a IA não enviará as mensagens configuradas.</em></p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">3️⃣ Definir a quantidade de mensagens</h3>
              <p class="mb-2">
                No campo <strong>Quantidade de Follow-ups</strong>, indique <strong>quantas mensagens</strong> a IA deve enviar até o lead responder.
              </p>
              <p class="mb-2">Exemplos:</p>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">1 mensagem</code> → apenas um lembrete após o silêncio.</li>
                <li><code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">2 mensagens</code> → envia uma e repete caso o lead não responda.</li>
                <li><code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">5 mensagens</code> → a IA insistirá até 5 vezes, respeitando o intervalo definido.</li>
              </ul>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">4️⃣ Definir o intervalo de tempo</h3>
              <p class="mb-2">
                O campo <strong>Intervalo</strong> define <strong>de quanto em quanto tempo</strong> a IA deve enviar os follow-ups após a última interação do lead.
              </p>
              <p class="mb-2">Exemplos práticos:</p>
              <div class="space-y-3 ml-4">
                <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p class="font-semibold mb-1">⏱️ <strong>1 hora + 2 mensagens:</strong></p>
                  <ul class="list-disc list-inside ml-4 text-sm space-y-1">
                    <li>→ 1ª mensagem após 1 hora sem resposta;</li>
                    <li>→ 2ª mensagem após mais 1 hora, se o lead continuar em silêncio.</li>
                  </ul>
                </div>
                <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p class="font-semibold mb-1">🕒 <strong>24 horas + 5 mensagens:</strong></p>
                  <ul class="list-disc list-inside ml-4 text-sm space-y-1">
                    <li>→ 1ª mensagem no dia seguinte;</li>
                    <li>→ As demais uma por dia, durante 5 dias consecutivos.</li>
                  </ul>
                </div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
                <p class="text-sm">💡 <em>Quanto maior o intervalo, mais espaçado e natural será o contato.</em></p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Como funciona na prática</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>A IA monitora a <strong>última interação do lead</strong> (última mensagem recebida).</li>
            <li>Se o lead não responder dentro do tempo definido, inicia-se o ciclo de follow-ups.</li>
            <li>Assim que o lead responde, o ciclo é <strong>interrompido automaticamente</strong> — evitando mensagens desnecessárias.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💬 Exemplo de uso</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              O lead parou de responder hoje às 15h.<br/>
              A configuração está com <strong>5 mensagens</strong> a cada <strong>24h</strong>.
            </blockquote>
            <p class="font-semibold">Resultado:</p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li>Amanhã às 15h → envia o 1º follow-up.</li>
              <li>Depois de 24h → envia o 2º.</li>
              <li>E assim por diante, até o 5º dia — ou até o lead responder antes disso.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Dicas de boas práticas</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>✍️ Personalize o texto com o <strong>nome do cliente</strong> e <strong>tom consultivo</strong>.</li>
            <li>💬 Evite mensagens repetitivas — varie o conteúdo a cada follow-up.</li>
            <li>🔕 Não configure intervalos muito curtos (ex: 5 minutos), para não parecer spam.</li>
            <li>🧩 Combine com o histórico de follow-up para acompanhar resultados (quem recebeu e quando).</li>
            <li>💾 Sempre <strong>salve as alterações</strong> após editar.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧾 Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Campo</th>
                  <th class="text-left py-2 font-bold">O que faz</th>
                  <th class="text-left py-2 font-bold">Exemplo</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">✉️ Texto</td>
                  <td class="py-2">Mensagem que a IA envia</td>
                  <td class="py-2">"Olá {nome}, tudo bem? Vi que não tivemos retorno…"</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🔢 Quantidade</td>
                  <td class="py-2">Quantas mensagens serão enviadas</td>
                  <td class="py-2">5 mensagens</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">⏱️ Intervalo</td>
                  <td class="py-2">Tempo entre uma mensagem e outra</td>
                  <td class="py-2">24 horas</td>
                </tr>
                <tr>
                  <td class="py-2">✅ Ativado</td>
                  <td class="py-2">Liga/desliga o envio automático</td>
                  <td class="py-2">Deve estar marcado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              Você ativa o follow-up com 3 mensagens e intervalo de 12 horas.<br/>
              O lead não responde à proposta.
            </blockquote>
            <p class="mt-2">A IA enviará automaticamente:</p>
            <ul class="list-disc list-inside ml-4 space-y-1">
              <li><strong>Mensagem 1:</strong> após 12 horas</li>
              <li><strong>Mensagem 2:</strong> após 24 horas</li>
              <li><strong>Mensagem 3:</strong> após 36 horas</li>
            </ul>
            <p class="mt-2 font-semibold">
              Se o lead responder, o ciclo é encerrado automaticamente.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Conclusão</h2>
          <p class="mb-3">
            O <strong>Follow-up Automático da IA</strong> é uma das funções mais poderosas da Guimoo para <strong>recuperar leads e aumentar conversões</strong>.
            Com poucos cliques, você cria uma sequência de mensagens que <strong>mantém o relacionamento ativo</strong> e mostra ao cliente que seu escritório está atento e disponível.
          </p>
        </section>
      </div>
    `
};
