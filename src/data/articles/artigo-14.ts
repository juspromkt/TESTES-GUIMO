import { Article } from './types';

export const artigo14: Article = {
  id: 'artigo-14',
  title: 'Movimentação Automática no CRM (Integração com a IA da Guimoo)',
  description: 'Configure a IA para mover leads automaticamente no funil do CRM conforme o andamento do atendimento.',
  category: 'artigos',
  readTime: '5 min',
  tags: ['CRM', 'IA', 'Automação', 'Funil'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔁 O que é a Movimentação Automática no CRM</h2>
          <p class="mb-3">
            A <strong>Movimentação Automática</strong> é um recurso da plataforma Guimoo que permite que a <strong>Inteligência Artificial (IA)</strong>
            <strong>mova automaticamente os leads entre as etapas do funil do CRM</strong>, conforme o atendimento avança.
          </p>
          <p class="mb-3">
            Você pode configurar uma <strong>vinculação direta entre cada etapa do Agente de IA</strong> (exemplo: "Apresentando solução", "Negociação", "Fechamento")
            e cada <strong>etapa do funil do CRM</strong> (como "Negociação", "Proposta Enviada", "Aguardando Fechamento"), e a IA fará a movimentação de forma automática.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📍 Onde encontrar</h2>
          <p class="mb-3">
            Acesse a tela de configuração da IA:<br>
            <strong>Dashboard → Agente de IA → Configurações da IA → Movimentação Automática no CRM</strong>
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🛠 Como configurar (passo a passo)</h2>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">📋 Etapa 1 – Vincule cada etapa da IA a uma etapa do CRM</h3>
            <ul class="list-disc list-inside space-y-2 ml-4">
              <li>Na seção <strong>Movimentação Automática</strong>, você verá todas as etapas configuradas na sua <strong>IA</strong> (etapas do fluxo de conversa).</li>
              <li>Ao lado de cada etapa da IA, existe um menu suspenso (dropdown) que lista <strong>todas as etapas do seu CRM</strong>.</li>
              <li>📌 Selecione em qual etapa do CRM você quer que o lead seja movido quando o Agente de IA avançar para aquela etapa.</li>
            </ul>
          </div>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">📝 Etapa 2 – Gere uma descrição automática</h3>
            <p class="mb-2">
              Ao clicar no botão <strong>"Gerar Descrição Automática"</strong>, a própria IA criará um <strong>resumo da conversa</strong>
              até aquele ponto, e esse resumo será incluído como <strong>anotação/histórico do lead no CRM</strong>.
            </p>
            <p class="mb-2">
              ✅ É <strong>altamente recomendado</strong> ativar essa opção para ter um histórico rico de interações.
            </p>
          </div>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">🔐 Etapa 3 – Autorize acesso ao CRM (se necessário)</h3>
            <p class="mb-2">
              Se você ainda não autorizou o sistema a acessar seu CRM, será solicitado que você <strong>vincule o acesso</strong>.
            </p>
            <p class="mb-2">
              Isso é feito uma única vez. Após vincular, todas as etapas do CRM ficam disponíveis para mapeamento.
            </p>
          </div>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg mb-4">
            <h3 class="font-bold text-gray-900 dark:text-white mb-2">💾 Etapa 4 – Salve a configuração</h3>
            <p class="mb-2">
              Clique em <strong>Salvar</strong> para ativar a integração. A partir desse momento,
              <strong>cada vez que a IA avançar um lead para uma nova etapa, ele será movido automaticamente no CRM correspondente</strong>.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔁 Exemplo de configuração</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa da IA</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa do CRM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">1. Qualificação inicial</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Novo Lead</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">2. Apresentando solução</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Em Análise</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">3. Negociação</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Negociação</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">4. Enviando proposta</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Proposta Enviada</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">5. Fechamento</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Aguardando Fechamento</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">6. Venda realizada</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Convertido</td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            ✅ Quando a IA mover o lead para <strong>"Negociação"</strong>, ele será automaticamente movido para a etapa <strong>"Negociação"</strong> no funil do CRM.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como funciona na prática</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>A IA conversa com um lead no WhatsApp.</li>
            <li>A conversa avança e a IA detecta que o lead está na etapa de <strong>"Negociação"</strong>.</li>
            <li>A IA move automaticamente o card desse lead no CRM para a etapa <strong>vinculada</strong> (ex: "Negociação").</li>
            <li>Se a opção <strong>"Gerar Descrição Automática"</strong> estiver ativa, a IA cria um resumo da conversa e adiciona como observação no histórico do lead.</li>
          </ol>
          <p class="mt-3">
            ✅ Isso <strong>elimina a necessidade de mover leads manualmente</strong> e garante que o CRM esteja sempre atualizado, refletindo a real etapa de cada negociação.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔧 Funções adicionais</h2>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-3">
            <h3 class="font-bold text-blue-900 dark:text-blue-300 mb-2">🔄 Resetar vinculações</h3>
            <p class="text-blue-800 dark:text-blue-200">
              Caso queira remover todas as vinculações e reconfigurar do zero, use o botão <strong>"Resetar"</strong>.
            </p>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h3 class="font-bold text-green-900 dark:text-green-300 mb-2">♻️ Atualizar lista de etapas do CRM</h3>
            <p class="text-green-800 dark:text-green-200">
              Se você criou novas etapas no CRM recentemente, clique em <strong>"Atualizar"</strong> para carregar as novas opções na lista.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚠️ Importante</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>✅ Certifique-se de que os nomes das etapas da IA e do CRM estão <strong>claros e organizados</strong>, para facilitar o mapeamento.</li>
            <li>✅ Se houver mudanças no fluxo da IA ou no funil do CRM, <strong>revise a configuração</strong> para manter a sincronia.</li>
            <li>✅ A descrição automática é opcional, mas é <strong>altamente recomendada</strong> para criar um histórico rico de interações.</li>
            <li>❌ Não será possível mover leads automaticamente se o CRM não estiver devidamente vinculado à conta.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Dica profissional</h2>
          <blockquote class="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 italic">
            💜 <strong>Use essa integração para automatizar 100% do seu funil de vendas.</strong> Com os leads sendo movidos automaticamente conforme o andamento do atendimento,
            sua equipe de vendas sempre saberá <strong>exatamente em qual etapa cada lead está</strong>, sem precisar atualizar manualmente.
            Isso economiza tempo, reduz erros e garante um processo comercial muito mais organizado.
          </blockquote>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📋 Resumo Rápido</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Item</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2 font-semibold">Onde configurar</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Agente de IA → Configurações → Movimentação Automática no CRM</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2 font-semibold">Função</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Mover leads automaticamente no CRM conforme etapa da IA</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2 font-semibold">Descrição automática</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Gera resumo da conversa e adiciona como histórico do lead</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2 font-semibold">Benefício</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Elimina movimentação manual e mantém CRM sempre atualizado</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2 font-semibold">Pré-requisito</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">CRM vinculado à conta Guimoo</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Conclusão</h2>
          <p class="mb-3">
            A <strong>Movimentação Automática no CRM</strong> é uma das funcionalidades mais poderosas da integração entre a <strong>IA da Guimoo</strong> e o <strong>CRM</strong>.
            Ela garante que seus leads sejam <strong>organizados automaticamente</strong>, refletindo em tempo real o progresso das conversas,
            sem necessidade de intervenção manual.
          </p>
          <p>
            ✅ Configure uma vez e deixe a IA cuidar do resto!
          </p>
        </section>
      </div>
    `
};
