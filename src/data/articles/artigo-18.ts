import { Article } from './types';

export const artigo18: Article = {
  id: 'artigo-18',
  title: 'Configuração de Funil de Vendas na Guimoo',
  description: 'Aprenda a criar e configurar funis de vendas personalizados, ativar follow-ups e integrar com a IA para movimentação automática.',
  category: 'artigos',
  readTime: '6 min',
  tags: ['CRM', 'Funil', 'Vendas', 'Configuração', 'Follow-up'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que é o Funil de Vendas</h2>
          <p class="mb-3">
            O <strong>Funil de Vendas</strong> é a estrutura que organiza todas as etapas pelas quais o seu lead passa dentro do processo comercial do escritório.
            Ele permite acompanhar a <strong>jornada do cliente</strong>, desde o primeiro contato até o fechamento do contrato — com total integração à <strong>IA e à movimentação automática do CRM</strong>.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Por que o Funil é importante</h2>
          <p class="mb-3">
            Ter um funil bem definido é essencial para:
          </p>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>🔹 Identificar em qual <strong>etapa de atendimento</strong> o lead está.</li>
            <li>🔹 Permitir que a <strong>IA mova automaticamente</strong> o lead no CRM conforme o progresso da conversa.</li>
            <li>🔹 Ativar <strong>follow-ups automáticos</strong> apenas onde faz sentido.</li>
            <li>🔹 Medir a <strong>eficiência e conversão</strong> das suas negociações.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar o Funil de Vendas</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Vá até o menu lateral esquerdo e clique em <strong>Configurações → Funil de Vendas</strong>.</li>
            <li>A tela exibirá todos os funis cadastrados no seu sistema.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧱 Estrutura de um Funil</h2>
          <p class="mb-3">
            Um funil é composto por <strong>etapas</strong> que representam os estágios do processo comercial.
            Exemplo prático de funil trabalhista:
          </p>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Descrição</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Cor sugerida</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📥 <strong>Recepção</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Primeiro contato com o lead</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Azul claro</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧮 <strong>Análise de Viabilidade</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Verificação das informações e documentação</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Amarelo</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">💬 <strong>Oferta do Contrato</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Apresentação da proposta</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Laranja</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🖋️ <strong>Contrato Assinado</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Cliente confirmou e assinou</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Verde</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">📅 <strong>Agendamento</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Reunião ou atendimento marcado</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Roxo</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ <strong>Agendamento Feito</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atendimento realizado com sucesso</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Cinza</td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 Essas etapas são apenas um modelo — você pode criar as suas conforme o fluxo do escritório.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">➕ Como criar um novo Funil</h2>
          <ol class="list-decimal list-inside space-y-2 ml-4">
            <li>Clique em <strong>"Novo Funil"</strong>.</li>
            <li>Dê um nome ao funil (exemplo: <code class="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded">Funil BPC/LOAS</code>).</li>
            <li>O novo funil aparecerá na lista.</li>
            <li>Clique em <strong>Configurações</strong> para adicionar as etapas.</li>
            <li>Escolha um nome, cor e posição para cada etapa.</li>
            <li>Marque quais delas terão <strong>Follow-up Ativo</strong>.</li>
            <li>Clique em <strong>Salvar</strong>.</li>
          </ol>
          <p class="mt-3 text-sm text-gray-600 dark:text-neutral-400">
            💡 O ideal é ter um único funil principal (ex: "Funil Trabalhista") e deixá-lo como <strong>Funil Padrão</strong>, para que a IA saiba onde movimentar automaticamente os leads.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🤖 Funil e Movimentação Automática</h2>
          <p class="mb-3">
            A Guimoo permite que a <strong>Inteligência Artificial mova automaticamente os leads</strong> entre as etapas do funil.
          </p>

          <blockquote class="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
            <strong>Exemplo:</strong><br>
            Se o lead chega na etapa de <strong>Análise de Viabilidade</strong>, a IA automaticamente atualiza o CRM e posiciona o lead nessa etapa.
            Quando o contrato é enviado e assinado, ele é movido para <strong>Contrato Assinado</strong>, sem que você precise fazer nada manualmente.
          </blockquote>

          <p class="mt-3">
            Essa sincronização garante que o CRM esteja <strong>sempre atualizado</strong> com base no progresso real das conversas.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🔁 Ativando Follow-up nas Etapas</h2>
          <p class="mb-3">
            Na mesma tela do funil, existe uma coluna chamada <strong>"Ativar Follow-up"</strong>.
            Ela permite definir <strong>em quais etapas a IA deve reenviar mensagens automáticas</strong> para reengajar o lead.
          </p>

          <h3 class="font-bold text-gray-900 dark:text-white mb-2">Exemplo:</h3>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700 mb-4">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Etapa</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Follow-up Ativo?</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Recepção</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Pode precisar de reforço para iniciar o contato</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Análise de Viabilidade</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Importante relembrar o envio de documentos</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Oferta do Contrato</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">✅ Sim</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Lead pode demorar para responder</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Contrato Assinado</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">❌ Não</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Atendimento já concluído</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Desqualificado</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">❌ Não</td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Lead descartado, não faz sentido reenviar mensagens</td>
              </tr>
            </tbody>
          </table>

          <p class="text-sm text-gray-600 dark:text-neutral-400">
            💡 Evite ativar follow-up em etapas finais ou de leads desqualificados.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🏷️ Dica de Boas Práticas</h2>
          <ul class="list-disc list-inside space-y-2 ml-4">
            <li>✅ <strong>Nomeie claramente</strong> cada etapa (ex: "Oferta do Contrato" é melhor que "Etapa 3").</li>
            <li>🎨 <strong>Use cores diferentes</strong> para cada estágio — ajuda a visualizar o progresso no CRM.</li>
            <li>🔄 <strong>Mantenha o funil limpo:</strong> evite criar vários funis desnecessários.</li>
            <li>🧠 <strong>Lembre-se:</strong> o funil padrão é o que a IA usará para entender e automatizar as movimentações.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">📊 Exemplo visual</h2>
          <p class="mb-3">
            Imagine o seu funil como uma linha de progresso dentro do CRM:
          </p>

          <div class="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            [Recepção] → [Análise de Viabilidade] → [Oferta do Contrato]<br>
            → [Contrato Assinado] → [Agendamento] → [Agendamento Feito]
          </div>

          <p class="mt-3">
            Cada vez que o agente de IA identifica o avanço na conversa, o lead é movido automaticamente para a próxima fase — e você pode acompanhar tudo no <strong>Kanban do CRM</strong>.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">✅ Resumo rápido</h2>

          <table class="w-full border-collapse border border-gray-300 dark:border-neutral-700">
            <thead>
              <tr class="bg-gray-100 dark:bg-neutral-800">
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">Função</th>
                <th class="border border-gray-300 dark:border-neutral-700 px-4 py-2 text-left">O que faz</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">➕ <strong>Novo Funil</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Cria um funil do zero</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⚙️ <strong>Configurações</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Adiciona, edita e organiza etapas</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">⭐ <strong>Funil Padrão</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Define o funil usado pela IA</td>
              </tr>
              <tr class="bg-gray-50 dark:bg-neutral-800/50">
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🔁 <strong>Ativar Follow-up</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Envia lembretes automáticos nas etapas desejadas</td>
              </tr>
              <tr>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">🧠 <strong>Integração IA</strong></td>
                <td class="border border-gray-300 dark:border-neutral-700 px-4 py-2">Move leads automaticamente no CRM</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧠 Conclusão</h2>
          <p class="mb-3">
            O <strong>Funil de Vendas da Guimoo</strong> é a base de toda a organização comercial do seu escritório.
            Com ele, você acompanha cada lead, mede resultados e deixa a IA fazer o trabalho pesado de movimentar, seguir e retomar contatos — tudo de forma <strong>automática, inteligente e personalizada</strong>.
          </p>
        </section>
      </div>
    `
};
