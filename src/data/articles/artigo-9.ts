import { Article } from './types';

export const artigo9: Article = {
  id: 'artigo-9',
  title: 'Parâmetros do Agente de IA (Delay e Tempo de Inatividade)',
  description: 'Configure o comportamento técnico e o ritmo de resposta da sua IA, ajustando delay entre mensagens e tempo de inatividade.',
  category: 'artigos',
  readTime: '5 min',
  tags: ['IA', 'Parâmetros', 'Configuração', 'Delay', 'Inatividade'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que são os Parâmetros do Agente</h2>
          <p class="mb-3">
            A aba <strong>Parâmetros do Agente</strong> controla o <strong>comportamento técnico e o ritmo de resposta da sua Inteligência Artificial (IA)</strong> dentro da Guimoo.
            Aqui você ajusta <strong>duas funções principais</strong> que afetam diretamente a experiência do atendimento:
          </p>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li><strong>Tempo de Delay (atraso entre mensagens)</strong></li>
            <li><strong>Tempo de Inatividade (pausa e reativação automática da IA)</strong></li>
          </ol>
          <p class="mt-3">
            Esses parâmetros são essenciais para manter a IA com <strong>respostas naturais e humanizadas</strong>, sem parecer um robô que responde instantaneamente.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>No painel da <strong>Guimoo</strong>, acesse <strong>Agente de IA</strong>.</li>
            <li>Vá até a aba <strong>Parâmetros do Agente</strong>.</li>
            <li>Você verá dois campos principais:</li>
          </ol>
          <ul class="list-disc list-inside space-y-2 ml-8 mt-2">
            <li><strong>Tempo de Delay (segundos)</strong></li>
            <li><strong>Tempo de Inatividade (minutos)</strong></li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 1. Configurando o Tempo de Delay</h2>
          <p class="mb-3">
            O <strong>tempo de delay</strong> é o intervalo que a IA aguarda entre a mensagem recebida do lead e a resposta que ela envia.
          </p>

          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 mb-3">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">🔹 Recomendação:</h3>
            <p>Deixe configurado em <strong>20 segundos</strong>.</p>
          </div>

          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-4">📖 Como funciona:</h3>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Assim que o lead envia uma mensagem, a IA <strong>inicia uma contagem regressiva</strong> de 20 segundos antes de responder.</li>
            <li>Se o lead enviar <strong>outra mensagem dentro desse tempo</strong>, a contagem <strong>recomeça do zero</strong>.</li>
            <li>Isso permite que a IA <strong>junte todas as mensagens enviadas</strong> e formule <strong>uma resposta completa e natural</strong>.</li>
          </ul>

          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg mt-3 space-y-3">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">💬 Exemplo prático:</h3>
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              O cliente envia: "Oi, tudo bem?"<br/>
              Em seguida, envia: "Quero saber sobre o contrato."
            </blockquote>
            <p class="mt-2">
              A IA espera 20 segundos, junta as duas mensagens e responde tudo de uma vez — de forma contextual e fluida.
            </p>
            <p class="text-sm">
              Se o delay fosse muito curto (ex: 5 segundos), a IA responderia cada mensagem separadamente, parecendo um <strong>chatbot mecânico</strong>, e não uma assistente inteligente.
            </p>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500 mt-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">⚠️ Por que 20 segundos é o ideal</h3>
            <ul class="list-disc list-inside space-y-2 ml-4">
              <li>🧠 Garante que a IA entenda o contexto completo antes de responder.</li>
              <li>💬 Evita respostas quebradas ou repetidas.</li>
              <li>🤝 Deixa o atendimento mais <strong>humanizado</strong> — como se fosse uma pessoa real respondendo.</li>
            </ul>
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-yellow-600 pl-4 mt-3">
              "Quem atende não responde instantaneamente. O atendente lê, processa e depois responde. A IA deve se comportar da mesma forma."
            </blockquote>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 2. Configurando o Tempo de Inatividade</h2>
          <p class="mb-3">
            O <strong>tempo de inatividade</strong> define quanto tempo a IA deve permanecer <strong>pausada</strong> antes de ser <strong>reativada automaticamente</strong>.
          </p>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500 mb-3">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">🔹 Função:</h3>
            <p>Usada quando você <strong>pausa manualmente</strong> a IA (por exemplo, para um atendimento humano assumir a conversa).</p>
          </div>

          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-4">📘 Opções disponíveis:</h3>
          <div class="space-y-3 ml-4">
            <div>
              <p class="font-semibold">• <strong>Nunca reativar (padrão):</strong></p>
              <p class="ml-4">A IA ficará pausada até que alguém a reative manualmente.</p>
              <div class="bg-gray-100 dark:bg-neutral-700 p-2 rounded ml-4 mt-2 italic text-sm">
                Ideal quando você quer controle total sobre quando a IA volta a responder.
              </div>
            </div>

            <div>
              <p class="font-semibold">• <strong>Reativar automaticamente após X minutos:</strong></p>
              <p class="ml-4">Define um tempo para a IA retomar o atendimento sozinha.</p>
              <p class="ml-4 mt-2">Exemplo:</p>
              <div class="bg-gray-100 dark:bg-neutral-700 p-2 rounded ml-4 mt-2 italic text-sm">
                Se configurar <strong>10 minutos</strong>, e você pausar agora, a IA voltará automaticamente após esse período.
              </div>
            </div>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 mt-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">💡 Recomendação da Guimoo:</h3>
            <blockquote class="italic text-gray-800 dark:text-neutral-200">
              Deixe configurado como <strong>"Nunca reativar"</strong>, pois quando você pausa, normalmente é porque quer que a IA <strong>fique parada até nova decisão</strong>.
            </blockquote>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧾 Passo a passo para configurar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse <strong>Agente de IA → Parâmetros</strong>.</li>
            <li>No campo <strong>Tempo de Delay</strong>, digite <code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">20</code>.</li>
            <li>No campo <strong>Tempo de Inatividade</strong>, escolha:
              <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">Nunca reativar</code> (recomendado), ou</li>
                <li>Um tempo específico, como <code class="bg-gray-100 dark:bg-neutral-700 px-1 rounded">10 minutos</code>.</li>
              </ul>
            </li>
            <li>Clique em <strong>Salvar alterações</strong>.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Dicas importantes</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>⚙️ Se a IA estiver respondendo rápido demais, aumente o delay para <strong>20 ou 25 segundos</strong>.</li>
            <li>📉 Se ela parecer "travada", verifique se o delay não está muito alto.</li>
            <li>🧩 Use o tempo de inatividade apenas se quiser que a IA retome o atendimento sem precisar de ação manual.</li>
            <li>💾 Sempre <strong>clique em Salvar</strong> antes de sair da página — caso contrário, as alterações serão perdidas.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático de uso combinado</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              Você define <strong>delay de 20 segundos</strong> e <strong>inatividade como "nunca reativar"</strong>.<br/>
              Assim, a IA sempre responde de forma natural e humana, e só volta a responder quando você decidir.
            </blockquote>
            <p class="font-semibold mt-2">
              <strong>Resultado:</strong> atendimentos mais fluidos, sem respostas duplicadas e com total controle sobre quando a IA atua.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Parâmetro</th>
                  <th class="text-left py-2 font-bold">Função</th>
                  <th class="text-left py-2 font-bold">Recomendação</th>
                  <th class="text-left py-2 font-bold">Efeito prático</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">⏱️ Tempo de Delay</td>
                  <td class="py-2">Intervalo antes de cada resposta</td>
                  <td class="py-2">20 segundos</td>
                  <td class="py-2">Garante respostas humanizadas e evita duplicidade</td>
                </tr>
                <tr>
                  <td class="py-2">⏸️ Tempo de Inatividade</td>
                  <td class="py-2">Tempo para reativação automática da IA</td>
                  <td class="py-2">Nunca reativar</td>
                  <td class="py-2">Dá controle manual sobre o momento de reativação</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Conclusão</h2>
          <p class="mb-3">
            A configuração dos <strong>Parâmetros do Agente</strong> é o que diferencia uma IA realmente inteligente de um chatbot comum.
            Com o <strong>delay certo (20s)</strong> e a <strong>pausa controlada manualmente</strong>, o atendimento fica <strong>natural, fluido e com ritmo humano</strong>, mantendo a experiência do cliente no mais alto padrão de profissionalismo.
          </p>
        </section>
      </div>
    `
};
