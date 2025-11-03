import { Article } from './types';

export const artigo8: Article = {
  id: 'artigo-8',
  title: 'Modelos de Agente de IA (Criando, Aplicando e Gerenciando Agentes na Guimoo)',
  description: 'Entenda como usar modelos prontos de IA para diferentes áreas jurídicas e como criar agentes personalizados do zero.',
  category: 'artigos',
  readTime: '7 min',
  tags: ['IA', 'Modelos', 'Configuração', 'Agente'],
  content: `
      <div class="space-y-6">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧭 O que são Modelos de Agente</h2>
          <p class="mb-3">
            Os <strong>Modelos de Agente</strong> são configurações pré-prontas da IA, adaptadas para diferentes <strong>áreas jurídicas</strong> (Trabalhista, Previdenciária, Cível etc.).
          </p>
          <p class="mb-3">
            Em vez de configurar manualmente cada etapa, regra e pergunta frequente, você pode <strong>aplicar um modelo</strong> e o sistema preencherá automaticamente as configurações ideais.
          </p>
          <p class="italic bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500">
            Isso economiza tempo e garante que sua IA comece a atender com um roteiro profissional desde o início.
          </p>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">⚙️ Como acessar</h2>
          <ol class="list-decimal list-inside space-y-2">
            <li>Acesse o painel da <strong>Guimoo</strong>.</li>
            <li>Vá até <strong>Agente de IA</strong>.</li>
            <li>Dentro das configurações do agente, localize a seção <strong>Modelos de Agente</strong>.</li>
            <li>Você verá uma lista com as áreas disponíveis.</li>
          </ol>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🪜 Como aplicar um modelo</h2>

          <div class="space-y-4">
            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">1. Escolher o modelo:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Selecione a área jurídica que se encaixa no seu escritório (ex: Trabalhista, Previdenciário, Cível).</li>
                <li>Cada modelo traz configurações específicas para aquele nicho.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">2. Confirmar a aplicação:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li>Clique em <strong>Aplicar Modelo</strong>.</li>
                <li>O sistema pedirá uma confirmação (geralmente você digita um texto específico).</li>
                <li>Ao confirmar, as configurações serão aplicadas automaticamente.</li>
              </ul>
            </div>

            <div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-2">3. O que é preenchido automaticamente:</h3>
              <ul class="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personalidade</strong>: Nome do agente e estilo de atendimento</li>
                <li><strong>Regras Gerais</strong>: Diretrizes de qualificação</li>
                <li><strong>Etapas de Atendimento</strong>: Roteiro completo da conversa</li>
                <li><strong>Perguntas Frequentes</strong>: FAQ adaptado</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">💡 Recomendações da Guimoo</h2>
          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500 space-y-3">
            <p>✅ Mesmo usando um modelo, você <strong>pode e deve personalizar</strong> as configurações depois.</p>
            <p>✅ Ajuste o nome do agente, escritório, percentual de honorários e link do contrato.</p>
            <p>⚠️ Se você já tinha uma IA configurada, aplicar um modelo <strong>substitui as configurações anteriores</strong>.</p>
            <p>💡 Para escritórios com múltiplas áreas, considere criar um <strong>Workspace separado</strong> para cada nicho.</p>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">🧩 Exemplo prático</h2>
          <div class="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg space-y-3">
            <p>👨‍💼 <strong>Carlos</strong> tem um escritório focado em causas trabalhistas.</p>
            <p>✅ Ele acessa <strong>Modelos de Agente</strong> e seleciona o modelo "Trabalhista".</p>
            <p>✅ Ao aplicar, o sistema preenche automaticamente:</p>
            <ul class="list-disc list-inside space-y-1 ml-4 text-sm">
              <li>Etapas de Recepção, Qualificação, Análise de Viabilidade, Oferta de Contrato e Agendamento</li>
              <li>Perguntas sobre tempo de trabalho, salário, demissão, rescisão etc.</li>
              <li>Regras de qualificação (ex: "lead desqualificado se trabalhou menos de 6 meses")</li>
            </ul>
            <p>✅ Carlos então personaliza o nome do agente, escritório e link do contrato — e sua IA está pronta!</p>
          </div>
        </section>
      </div>
    `
};
