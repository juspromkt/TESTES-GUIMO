import { Article } from './types';

export const artigo12: Article = {
  id: 'artigo-12',
  title: 'Teste de Agente (Simulação de Conversa na Plataforma)',
  description: 'Simule conversas com sua IA e valide respostas, fluxos e comportamento antes de ativar para clientes reais.',
  category: 'artigos',
  readTime: '4 min',
  tags: ['IA', 'Teste', 'Validação', 'Simulação'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Teste de Agente</h2>
          <p class="mb-3">
            A função <strong>Teste de Agente</strong> da Guimoo permite que você <strong>simule uma conversa com a sua IA diretamente na plataforma</strong>, sem precisar usar o WhatsApp real ou outro número externo.
          </p>
          <p class="mb-3">
            Ela é ideal para <strong>validar respostas, fluxos e comportamento do agente</strong> antes de colocá-lo em produção com leads reais.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Para que serve</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>Testar <strong>como a IA responde</strong> a diferentes mensagens.</li>
            <li>Verificar se <strong>as etapas de atendimento</strong> estão funcionando corretamente.</li>
            <li>Validar se o <strong>tom de voz e o fluxo de conversa</strong> estão de acordo com o que foi configurado.</li>
            <li>Fazer ajustes rápidos nas respostas, sem precisar usar o WhatsApp real.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até <strong>Agente de IA → Teste de Agente</strong>.</li>
            <li>A tela mostrará uma janela de chat simulada.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como usar o Teste de Agente</h2>

          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">1️⃣ Resetar a conversa</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Clique em <strong>"Resetar conversa"</strong> antes de iniciar o teste.</li>
                <li>Isso limpa o histórico e reinicia o diálogo como se fosse um novo lead.</li>
                <li>Essa etapa é importante para garantir que a IA <strong>comece do início do fluxo</strong>, sem interferências de testes anteriores.</li>
              </ul>
              <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
                <p class="text-sm">💡 <em>Dica:</em> sempre resete antes de cada novo teste, especialmente após fazer alterações no agente.</p>
              </div>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">2️⃣ Enviar mensagens</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Digite qualquer mensagem no campo de texto e pressione <strong>Enter</strong>.</li>
                <li>A IA responderá conforme suas configurações de personalidade, etapas e regras.</li>
                <li>Você pode enviar:
                  <ul class="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>💬 <strong>Textos</strong></li>
                    <li>🖼️ <strong>Imagens</strong></li>
                    <li>🎧 <strong>Áudios</strong></li>
                  </ul>
                </li>
              </ul>
              <p class="mt-3 ml-4">
                🧠 O sistema interpretará todos esses formatos de forma semelhante ao que acontece em conversas reais.
              </p>
            </div>

            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3">3️⃣ Entendendo o comportamento da IA</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>As respostas no teste são <strong>mais rápidas do que o tempo de delay configurado</strong> nos parâmetros.</li>
                <li>Isso é proposital para agilizar os testes e facilitar o ajuste do fluxo.</li>
                <li>No ambiente real (WhatsApp), o tempo de delay padrão — geralmente 20 segundos — será respeitado.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚠️ Limitações do modo de teste</h2>
          <p class="mb-3">
            O <strong>Teste de Agente</strong> é apenas uma simulação da conversa — por isso, algumas ações <strong>não são executadas de verdade</strong>.
          </p>
          <p class="mb-3">Confira abaixo o que <strong>não é possível testar</strong> dentro desse ambiente:</p>

          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Função</th>
                  <th class="text-left py-2 font-bold">Disponível no teste?</th>
                  <th class="text-left py-2 font-bold">Observação</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">💬 Mensagens e respostas</td>
                  <td class="py-2">✅ Sim</td>
                  <td class="py-2">Responde normalmente</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🖼️ Envio de imagem</td>
                  <td class="py-2">✅ Sim</td>
                  <td class="py-2">Exibe resposta simulada</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🎧 Envio de áudio</td>
                  <td class="py-2">✅ Sim</td>
                  <td class="py-2">IA entende e responde</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🗓️ Agendamento de reunião</td>
                  <td class="py-2">❌ Não</td>
                  <td class="py-2">O Google Agenda não é acionado</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">📤 Integrações externas (e-mail, API, CRM)</td>
                  <td class="py-2">❌ Não</td>
                  <td class="py-2">Apenas simuladas</td>
                </tr>
                <tr>
                  <td class="py-2">🤖 Delay real</td>
                  <td class="py-2">⚠️ Parcial</td>
                  <td class="py-2">A resposta vem mais rápido para teste</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500 mt-3">
            <p class="text-sm">💡 <em>Se quiser testar o agendamento de reunião real</em>, envie a mensagem <strong>de outro número no WhatsApp</strong> vinculado ao seu agente — o sistema acionará o Google Agenda e fará o processo completo.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <blockquote class="italic text-gray-800 dark:text-neutral-200 border-l-4 border-purple-600 pl-4">
              Você configurou um agente para atender causas trabalhistas.<br/>
              Antes de liberar para os clientes, acessa <strong>Teste de Agente</strong> e envia:
            </blockquote>
            <div class="bg-white dark:bg-neutral-700 p-3 rounded border border-gray-300 dark:border-neutral-600">
              <p class="text-sm">"Olá, quero saber se tenho direito à rescisão indireta."</p>
            </div>
            <p class="mt-2">
              A IA responde com o fluxo configurado, explicando o tema e conduzindo para a etapa de qualificação.
            </p>
            <p class="mt-2 font-semibold">
              Assim, você confirma que o agente está funcionando e só depois ativa o atendimento real no WhatsApp.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Dicas adicionais</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🧾 Faça testes após <strong>cada ajuste de etapa ou mensagem personalizada</strong>.</li>
            <li>🧩 Use o teste para <strong>corrigir falhas de lógica</strong>, como mensagens que não estão aparecendo ou repetições.</li>
            <li>📚 Combine o Teste de Agente com o <strong>Histórico de Conversas</strong>, para comparar comportamento real e simulado.</li>
            <li>💾 Sempre salve as alterações no agente <strong>antes de testar novamente</strong>.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-neutral-600">
                  <th class="text-left py-2 font-bold">Ação</th>
                  <th class="text-left py-2 font-bold">Função</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">🔄 Resetar conversa</td>
                  <td class="py-2">Reinicia o fluxo da IA</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">💬 Enviar mensagem</td>
                  <td class="py-2">Simula uma conversa real</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">⏱️ Delay mais rápido</td>
                  <td class="py-2">Facilita testes sem esperar</td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-neutral-700">
                  <td class="py-2">❌ Não agenda reuniões</td>
                  <td class="py-2">O Google Agenda não é acionado</td>
                </tr>
                <tr>
                  <td class="py-2">🔁 Use para ajustes rápidos</td>
                  <td class="py-2">Teste fluxos e mensagens antes de ativar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Conclusão</h2>
          <p class="mb-3">
            O <strong>Teste de Agente</strong> é a maneira mais prática e segura de <strong>validar o comportamento da sua IA</strong> antes de colocar em contato com clientes reais.
            Ele ajuda você a garantir que o agente está configurado corretamente, com respostas coerentes, humanizadas e alinhadas à sua estratégia de atendimento.
          </p>
        </section>
      </div>
    `
};
