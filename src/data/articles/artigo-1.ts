import { Article } from './types';

export const artigo1: Article = {
  id: 'artigo-1',
  title: 'Gatilho de Acionamento da Inteligência Artificial (IA)',
  description: 'Entenda como funciona e como configurar o gatilho que ativa sua IA automaticamente nas conversas do WhatsApp.',
  category: 'artigos',
  readTime: '3 min',
  tags: ['IA', 'Configuração', 'Automação'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Gatilho de Acionamento</h2>
          <p class="mb-3">
            O <strong>Gatilho de Acionamento</strong> é uma funcionalidade que define <strong>em que momento a sua IA deve ser ativada automaticamente</strong> dentro das conversas no WhatsApp.
          </p>
          <p class="mb-3">
            Em outras palavras, é o <strong>comando ou frase</strong> que o sistema usa como "sinal" para começar a responder o cliente com base nas configurações do agente.
          </p>
          <p class="mb-3">Por exemplo:</p>
          <p class="italic bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            Se você definir o gatilho como <strong>"tenho interesse"</strong>, sempre que alguém enviar essa frase, a IA será ativada e passará a responder automaticamente.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até a aba <strong>Agente de IA</strong>.</li>
            <li>Dentro das configurações do agente, localize a seção <strong>Gatilho de Acionamento</strong>.</li>
            <li>Lá, você verá um campo de texto para inserir o gatilho e a opção de ativar/desativar.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como configurar o Gatilho</h2>

          <div class="space-y-4">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">1. Ative ou desative o gatilho:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Se quiser que a IA só atue quando uma frase específica for enviada, mantenha a opção <strong>ativada</strong> e insira a frase no campo.</li>
                <li>Exemplo: "Quero saber mais", "Tenho interesse", "Quero atendimento".</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">2. Para uso geral (sem gatilho):</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Deixe o campo <strong>em branco</strong> e a função <strong>desativada</strong>.</li>
                <li>Assim, a IA será acionada automaticamente <strong>para qualquer nova conversa</strong>, sem depender de uma palavra-chave.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">3. Controle manual:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Caso queira <strong>pausar ou impedir a IA em uma conversa específica</strong>, você pode <strong>desativá-la diretamente na tela da conversa</strong> com aquele contato.</li>
                <li>Isso é útil para clientes recorrentes ou situações em que o atendimento humano é preferível.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Recomendação da Guimoo</h2>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
            <p class="mb-3">
              A melhor prática é <strong>não definir um gatilho fixo</strong>.
            </p>
            <p class="mb-3">
              Deixando o campo <strong>vazio e a função desativada</strong>, sua IA responderá automaticamente a todos os novos leads, o que <strong>mantém o fluxo de atendimento mais natural</strong> e evita falhas de acionamento.
            </p>
            <p>
              Você ainda mantém controle total — podendo <strong>desligar a IA manualmente</strong> em conversas onde ela não deve atuar.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <p>✅ <strong>João</strong> configura o gatilho como "Quero ajuda".</p>
            <p>✅ Quando alguém manda essa frase no WhatsApp, a IA começa o atendimento automaticamente.</p>
            <p>⚠️ Porém, João percebe que muitas pessoas entram em contato com dúvidas gerais e prefere que a IA atenda todos.</p>
            <p>✅ Então ele remove o texto do campo e desativa o gatilho — a partir daí, toda nova conversa é atendida pela IA, e ele só desativa manualmente quando quiser intervir pessoalmente.</p>
          </div>
        </section>
      </div>
    `
};
