import { Article } from './types';

export const artigo2: Article = {
  id: 'artigo-2',
  title: 'Configurações de Áudio da Inteligência Artificial (IA)',
  description: 'Aprenda a ativar e personalizar respostas por voz da sua IA para tornar o atendimento mais humano e natural.',
  category: 'artigos',
  readTime: '4 min',
  tags: ['IA', 'Áudio', 'Personalização'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é a Função de Áudio da IA</h2>
          <p class="mb-3">
            A <strong>Configuração de Áudio</strong> permite que sua <strong>IA também envie respostas por voz</strong>, tornando o atendimento mais humano e natural.
          </p>
          <p class="mb-3">
            Essa função é ideal para escritórios e atendimentos que desejam um contato mais próximo, fluido e personalizado com o lead.
          </p>
          <p class="italic bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            Com o áudio ativado, a IA pode <strong>responder automaticamente com voz</strong> de acordo com o tipo de mensagem recebida ou com a configuração escolhida.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até <strong>Agente de IA</strong>.</li>
            <li>Dentro das configurações do agente, abra a aba <strong>Áudio</strong>.</li>
            <li>Você verá as opções de ativação e personalização de voz.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como configurar</h2>

          <div class="space-y-4">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">1. Ativar o modo de áudio:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Ative o botão de <strong>resposta por áudio</strong> para permitir que a IA envie mensagens de voz automáticas.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">2. Escolher o modo de resposta:</h3>
              <div class="ml-4 space-y-3">
                <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p class="font-semibold mb-2">📢 Responder áudio com áudio:</p>
                  <ul class="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li>A IA responde com voz <strong>somente quando o lead enviar um áudio</strong>.</li>
                    <li>Exemplo: o lead envia um áudio → a IA responde em áudio; se enviar texto → a IA responde com texto.</li>
                  </ul>
                </div>
                <div class="bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg">
                  <p class="font-semibold mb-2">🔊 Sempre responder com áudio:</p>
                  <ul class="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li>A IA responde <strong>todas as mensagens por voz</strong>, independentemente de como o lead se comunica.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">3. Selecionar a voz:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>A plataforma oferece <strong>6 vozes diferentes</strong> para personalizar o estilo da sua IA (masculinas e femininas).</li>
                <li>Use o <strong>botão de preview</strong> para ouvir antes de definir.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">4. Ajustar a velocidade da fala:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Você pode <strong>aumentar ou reduzir a velocidade da voz</strong>, tornando a fala mais natural e agradável para o cliente.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Recomendações da Guimoo</h2>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 space-y-3">
            <p>✅ A função de áudio é <strong>opcional</strong> — use se fizer sentido para o seu público.</p>
            <p>✅ Hoje, a IA <strong>já consegue enviar links corretamente mesmo com áudio ativo</strong>, o que garante funcionamento mais estável.</p>
            <p>⚠️ No entanto, se o seu atendimento envolve <strong>muitos links, CPF ou CNPJ</strong>, pode ser mais prático manter a IA respondendo em texto.</p>
            <p>💡 Faça testes antes de ativar definitivamente — o ideal é equilibrar <strong>naturalidade e clareza</strong> no atendimento.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <p>👩‍💼 <strong>Ana</strong> quer que seu escritório tenha um toque mais humano nas respostas.</p>
            <p>✅ Ela ativa o modo <strong>"Responder áudio com áudio"</strong>, escolhe uma voz feminina e ajusta a velocidade para 0.9x (mais natural).</p>
            <p>💬 Assim, quando o lead envia um áudio com dúvidas, a IA responde com voz, mantendo o ritmo da conversa como se fosse uma troca real.</p>
          </div>
        </section>
      </div>
    `
};
