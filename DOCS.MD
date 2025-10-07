# LumenCRM - Documentação do Sistema

## Abas e Funcionalidades

### 1. Dashboard

**Funcionalidades:**
- Visão geral de métricas e KPIs
- Gráficos de desempenho por funil
- Status de conexão do WhatsApp
- Relatórios de negociações por estágio
- Análise de conversão e insights
- Visualização de tendências temporais

### 2. Chat

**Funcionalidades:**
- Visualização de conversas em tempo real
- Histórico de mensagens
- Notificações de novas mensagens
- Transferência de atendimento

### 3. Conversas

**Funcionalidades:**
- Chat nativo para comunicação direta via WhatsApp
- Visualização de todas as conversas ativas
- Envio de mensagens, imagens, áudios e documentos
- Resposta a mensagens específicas
- Filtro de conversas por usuário

### 4. Agente de IA

**Funcionalidades:**

#### Configurações do Agente
- **Personalidade**: Define o tom, comportamento e área de expertise do agente
- **Regras Gerais**: Estabelece diretrizes de comportamento
- **Etapas de Atendimento**: Configura o fluxo de conversação
- **Perguntas Frequentes**: Base de conhecimento para respostas comuns
- **Configurações de Agendamento**: Integração com Google Calendar
- **Modelos**: Templates pré-configurados para diferentes segmentos
- **Gatilho de Acionamento**: Palavras-chave para ativar o agente
- **Configurações de Áudio**: Personalização de voz e respostas em áudio
- **Horário de Funcionamento**: Define quando o agente está ativo
- **Parâmetros do Agente**: Configurações avançadas de comportamento

#### Follow-up
- Configuração de mensagens automáticas de acompanhamento
- Definição de quantidade e intervalo entre mensagens
- Histórico de follow-ups realizados
- Gerador de prompt de follow-up com IA

#### Movimentação Automática
- Configuração de regras para movimentação entre estágios do funil
- Mapeamento de etapas de atendimento para estágios do CRM
- Gerador de descrições de movimentação com IA

#### Gestão de Sessões
- Visualização e gerenciamento de sessões ativas
- Controle de intervenções humanas
- Exclusão de sessões

#### Teste de Agente
- Simulação de conversa com o agente
- Envio de mensagens de texto, áudio e imagens
- Reset de conversa para novos testes

### 5. CRM

**Funcionalidades:**
- Visualização de negociações em formato Kanban ou Lista
- Criação, edição e exclusão de negociações
- Movimentação de negociações entre estágios
- Filtros por data, título e contato
- Detalhes da negociação com histórico de conversas
- Atividades e anotações por negociação
- Atribuição de usuário responsável

### 6. Agendamentos

**Funcionalidades:**
- Calendário de compromissos
- Lista de agendamentos
- Criação, edição e exclusão de compromissos
- Vinculação de agendamentos a negociações
- Configuração de lembretes automáticos
- Filtros por data e cliente

### 7. Prospectar

**Funcionalidades:**

#### Prospecção
- Busca de leads por segmento e localização
- Aplicação de filtros específicos
- Histórico de prospecções realizadas
- Detalhes de leads encontrados
- Controle de disparos

#### Disparo Direto
- Importação de listas de contatos
- Configuração de mensagens para disparo
- Controle de envio de mensagens
- Histórico de disparos realizados

### 8. Contatos

**Funcionalidades:**
- Cadastro e gestão de contatos
- Importação e exportação de listas
- Filtros e busca avançada
- Visualização de histórico de interações

### 9. Conexão

**Funcionalidades:**

#### Conexão WhatsApp
- Configuração da conexão principal via QR Code
- Status da conexão
- Exclusão da conexão

### 10. Configurações

**Funcionalidades:**

#### Disparo
- **Parâmetros**: Configurações de limites e delays
- **Modelos**: Gerenciamento de templates de mensagens

#### CRM
- **Funis**: Criação e edição de funis de vendas e estágios
- **Fontes**: Gerenciamento de fontes de leads

#### Usuários
- Criação e gestão de usuários
- Definição de permissões
- Ativação/desativação de contas

#### Webhooks
- Configuração de endpoints para eventos do sistema
- Notificações para sistemas externos

#### Chave de API
- Geração e gerenciamento de chaves de API
- Segurança de acesso

## Sistema de Permissões

O LumenCRM possui um sistema de permissões granular que permite controlar o acesso dos usuários a diferentes funcionalidades.

## Fluxos Principais

### Fluxo de Atendimento com IA
1. Cliente inicia conversa via WhatsApp
2. Agente de IA responde seguindo etapas configuradas
3. Agente qualifica o lead e coleta informações
4. Lead é movido automaticamente no funil de vendas
5. Agendamento é realizado (se configurado)
6. Follow-up automático é enviado quando necessário

### Fluxo de Prospecção
1. Usuário configura busca por segmento e localização
2. Sistema encontra leads potenciais
3. Usuário inicia disparo para leads encontrados
4. Sistema envia mensagens conforme modelo selecionado
5. Respostas são capturadas e leads são criados no CRM

### Fluxo de Gestão de Negociações
1. Leads são visualizados no Kanban ou Lista
2. Usuários movem negociações entre estágios
3. Atividades são registradas para cada negociação
4. Agendamentos são criados e vinculados às negociações
5. Lembretes automáticos são enviados antes dos compromissos

## Integrações

- **Google Calendar**: Para agendamentos
- **Webhooks**: Para integração com sistemas externos
