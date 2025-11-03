import { Article } from './types';

export const artigo22: Article = {
  id: 'artigo-22',
  title: 'Função "#sair" (Reiniciar Conversa da IA)',
  description: 'Entenda como usar o comando #sair para reiniciar completamente o atendimento da IA, zerar o histórico da conversa e criar uma nova negociação no CRM.',
  category: 'artigos',
  readTime: '5 min',
  tags: ['Comando', 'IA', 'Testes', 'Contexto', 'Reiniciar', 'WhatsApp'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ O que é o comando <code>#sair</code></h2>
          <p class="mb-3">
            O comando <strong><code>#sair</code></strong> é uma função essencial para <strong>reiniciar completamente o atendimento da IA</strong> dentro da Guimoo.
            Ele serve para <strong>zerar o histórico da conversa e reiniciar a negociação do lead</strong> — começando tudo do zero, como se fosse um novo cliente.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Por que essa função existe</h2>
          <p class="mb-3">
            Durante testes ou ajustes da IA (como alterações de personalidade, etapas ou prompts), o sistema mantém o <strong>histórico de contexto</strong> da conversa.
            Isso faz com que, ao reenviar mensagens do mesmo número, a IA:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4 mb-3">
            <li>Continue a conversa antiga,</li>
            <li>Mantenha informações anteriores,</li>
            <li>Ou interprete o lead de forma incorreta.</li>
          </ul>
          <p class="mb-3">
            ➡️ Para evitar isso, usamos o comando <code>#sair</code>.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧾 Quando usar o <code>#sair</code></h2>
          <p class="mb-3">Use sempre que:</p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Situação</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧩 Você alterou algo na IA (regras, etapas, prompts)</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">A IA precisa atualizar o contexto</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧪 Está fazendo <strong>testes manuais</strong> pelo WhatsApp</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Para iniciar um teste limpo</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔁 Quer <strong>reiniciar uma negociação</strong> do mesmo número</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Para evitar mistura de conversas antigas</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⚠️ A IA <strong>parece confusa ou fora de contexto</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Isso limpa o histórico da conversa</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💬 Como usar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Pegue o <strong>celular que você usa para testar a IA</strong> (seu WhatsApp pessoal, por exemplo).</li>
            <li>Envie para o número conectado ao sistema a seguinte mensagem:</li>
          </ol>

          <div class="mt-3 mb-3 p-4 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700">
            <pre class="text-sm"><code>#sair</code></pre>
          </div>

          <ol start={3} class="list-decimal list-inside space-y-2 ml-4">
            <li>Aguarde alguns segundos.</li>
            <li>Em seguida, envie uma nova mensagem comum (ex: "Oi" ou "Quero saber mais").</li>
            <li>A IA iniciará o atendimento <strong>do zero</strong>, criando uma <strong>nova negociação</strong> dentro do CRM.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔁 O que acontece ao enviar <code>#sair</code></h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Ação do sistema</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🗑️ Zera o histórico da conversa</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Remove todo o contexto anterior</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧾 Cria uma nova negociação</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Um novo registro é criado no CRM</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🤖 Reinicia o fluxo da IA</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">O atendimento começa do início</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💬 Mantém o contato salvo</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">O número do cliente permanece no sistema</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚠️ Atenção</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Se você não usar <code>#sair</code> antes de testar novamente, a IA <strong>continua a conversa antiga</strong>, o que pode causar respostas erradas ou confusas.</li>
            <li>Sempre que fizer <strong>mudanças em qualquer parte da IA</strong>, use <code>#sair</code> para testar o novo comportamento corretamente.</li>
            <li>O comando só funciona quando digitado <strong>exatamente assim</strong>, com a hashtag (<code>#sair</code>) — sem espaços ou variações.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Exemplo prático</h2>

          <div class="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded">
            <p class="text-sm text-gray-700 dark:text-neutral-300 mb-2">
              <strong>Cenário:</strong><br/>
              Você ajustou a etapa de "Oferta de Contrato" e quer testar novamente.
            </p>
          </div>

          <p class="mb-2"><strong>Passos:</strong></p>
          <ol class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>No seu WhatsApp, envie:</li>
          </ol>

          <div class="mt-2 mb-3 ml-8 p-4 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700">
            <pre class="text-sm"><code>#sair</code></pre>
          </div>

          <ol start={2} class="list-decimal list-inside space-y-2 ml-4 mb-3">
            <li>Depois de alguns segundos, envie:</li>
          </ol>

          <div class="mt-2 mb-3 ml-8 p-4 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-700">
            <pre class="text-sm"><code>Oi, tudo bem?</code></pre>
          </div>

          <ol start={3} class="list-decimal list-inside space-y-2 ml-4">
            <li>A IA vai responder <strong>como se fosse um novo lead</strong>, seguindo o novo script atualizado.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Comando</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2"><code>#sair</code></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Reinicia conversa</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Zera negociação e recomeça o atendimento</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Quando usar</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Após editar IA ou testar novamente</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Garante que o teste seja "limpo"</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Onde usar</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">No WhatsApp conectado à IA</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">A mensagem deve ser enviada pelo lead/testador</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Efeito</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Nova negociação criada no CRM</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atendimento do zero</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Conclusão</h2>
          <p class="mb-3">
            O comando <strong><code>#sair</code></strong> é a ferramenta que garante que sua IA <strong>sempre inicie atendimentos limpos e atualizados</strong>.
            Usá-lo corretamente evita erros de contexto e permite testar alterações com precisão.
          </p>

          <div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded">
            <p class="text-sm text-gray-700 dark:text-neutral-300">
              💬 Sempre que fizer qualquer ajuste na IA ou quiser recomeçar um teste, <strong>envie <code>#sair</code> antes</strong>.
            </p>
          </div>
        </section>
      </div>
    `
};
