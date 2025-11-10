# 🤖 Aba "Agentes" - Documentação

## 📦 Visão Geral

Esta implementação fornece uma interface moderna e intuitiva para o gerenciamento de agentes de IA da Guimoo, seguindo o layout especificado com cards em grid, sidebar interna e modais de configuração.

## 🗂️ Componentes Criados

### 1. **AgentsTab.tsx** (Principal)
Componente principal que renderiza a interface completa da aba "Agentes".

**Localização:** `src/components/ai-agent/AgentsTab.tsx`

**Características:**
- ✅ Layout com sidebar interna (largura fixa 256px)
- ✅ Grid responsivo de cards (1 col → 2 cols → 3 cols)
- ✅ Sistema de abas internas (Agentes, Notificações, Follow-up, Teste)
- ✅ Estados de loading, empty state e erro
- ✅ Mensagens de feedback (sucesso/erro) com auto-dismiss
- ✅ Dark mode completo
- ✅ Animações suaves e hover effects

**Props:**
```typescript
interface AgentsTabProps {
  token: string;                           // Token de autenticação
  onAgentSelect?: (agentId: number) => void; // Callback quando um agente é selecionado
}
```

**Uso:**
```tsx
import AgentsTab from '../components/ai-agent/AgentsTab';

<AgentsTab
  token={userToken}
  onAgentSelect={(id) => console.log('Agente:', id)}
/>
```

---

### 2. **AgentConfigModal.tsx**
Modal lateral (slide-in) que exibe as configurações completas do agente.

**Localização:** `src/components/ai-agent/AgentConfigModal.tsx`

**Características:**
- ✅ Animação slide-in da direita
- ✅ Largura máxima de 5xl (80rem)
- ✅ Fecha ao clicar fora ou pressionar ESC
- ✅ Carrega dados do agente (steps, FAQs, agendamento)
- ✅ Integra o componente AgentConfigTab existente
- ✅ Estados de loading individuais por seção

**Props:**
```typescript
interface AgentConfigModalProps {
  isOpen: boolean;      // Controla visibilidade
  onClose: () => void;  // Callback para fechar
  agent: Agent | null;  // Agente a ser configurado
  token: string;        // Token de autenticação
}
```

---

### 3. **AIAgentGrid.tsx** (Página de exemplo)
Página alternativa demonstrando como usar o AgentsTab.

**Localização:** `src/pages/AIAgentGrid.tsx`

---

## 🎨 Layout e Design

### Estrutura da Página

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (256px)    │  ÁREA PRINCIPAL                   │
│                     │                                   │
│  📋 Agentes        │  🔍 Agentes de IA                 │
│  🔔 Notificações   │     Gerencie seus assistentes     │
│  🔄 Follow-up      │                                   │
│  🧪 Teste          │  [+ Novo Agente]                  │
│                     │                                   │
│                     │  ┌────────┐ ┌────────┐ ┌────────┐│
│                     │  │ Card 1 │ │ Card 2 │ │ Card 3 ││
│                     │  │ Agente │ │ Agente │ │ Agente ││
│                     │  └────────┘ └────────┘ └────────┘│
│                     │  ┌────────┐ ┌────────┐           │
│                     │  │ Card 4 │ │ Card 5 │           │
│                     │  │ Agente │ │ Agente │           │
│                     │  └────────┘ └────────┘           │
└─────────────────────────────────────────────────────────┘
```

### Cards de Agentes

Cada card contém:
- 🔘 **Botão de Status** (canto superior direito) - Alterna ativo/inativo
- 🤖 **Ícone do Agente** - Box 48x48 com gradiente
- 📝 **Nome do Agente** - Fonte semibold 18px
- 🏷️ **Badges** - "Principal" (azul) e "Gatilho" (roxo)
- 🔑 **Palavra-chave** - Exibida se for agente de gatilho
- ✏️ **Botão Editar** - Aparece no hover

### Cores e Tema

**Modo Claro:**
- Background: `bg-gray-50`
- Cards: `bg-white` com `border-gray-200`
- Sidebar ativa: `bg-gray-900 text-white`
- Hover: `hover:shadow-lg`

**Modo Escuro:**
- Background: `bg-gray-900`
- Cards: `bg-gray-900` com `border-gray-700`
- Sidebar ativa: `bg-gray-700 text-white`
- Compatibilidade total com dark mode

---

## 🔄 Fluxo de Interações

### 1. Criar Novo Agente
```
Clique em "Novo Agente"
  → Abre AgentFormModal (modo: create)
  → Preenche dados (nome, status, principal, gatilho)
  → Salva
  → Atualiza lista de agentes
  → Exibe mensagem de sucesso
```

### 2. Editar Agente
```
Hover no card do agente
  → Botão "Editar" aparece (fade-in)
  → Clique em "Editar"
  → Abre AgentFormModal (modo: edit)
  → Modifica dados
  → Salva
  → Atualiza lista
```

### 3. Configurar Agente
```
Clique no card do agente
  → Abre AgentConfigModal (slide-in da direita)
  → Carrega dados (steps, FAQs, scheduling)
  → Navega pelas configurações via tabs internas
  → Modifica e salva conforme necessário
  → Fecha modal (ESC ou clique fora)
```

### 4. Ativar/Desativar Agente
```
Clique no botão de status (⚡ Power)
  → Exibe loader no botão
  → POST /toggle
  → Atualiza estado localmente
  → Exibe mensagem de feedback
```

---

## 🛠️ Funcionalidades Implementadas

### ✅ Recursos Principais

- [x] Grid responsivo de agentes
- [x] Sidebar interna com navegação por abas
- [x] Sistema de permissões (can_edit_agent)
- [x] Toggle de status dos agentes
- [x] Modal de criação/edição de agentes
- [x] Modal de configuração completa (slide-in)
- [x] Estados de loading, empty state e erro
- [x] Mensagens de feedback (auto-dismiss 3s)
- [x] Dark mode completo
- [x] Animações e transições suaves
- [x] Hover effects nos cards
- [x] Badges visuais (Principal, Gatilho)
- [x] Exibição de palavra-chave para agentes de gatilho

### 🎯 Estados e Feedback

**Loading:**
- Ícone `Loader2` animado centralizado
- Cor: `text-gray-400`

**Empty State:**
- Ícone `Bot` grande
- Mensagem: "Nenhum agente criado"
- Botão "Criar Agente"

**Sucesso:**
- Background: `bg-green-50` (light) / `bg-green-900/20` (dark)
- Bolinha pulsante verde
- Auto-dismiss após 3 segundos

**Erro:**
- Background: `bg-red-50` (light) / `bg-red-900/20` (dark)
- Bolinha vermelha
- Auto-dismiss após 3 segundos

---

## 🚀 Como Integrar na Aplicação

### Opção 1: Página Dedicada (Recomendado)
```tsx
// Em App.tsx ou Router
import AIAgentGrid from './pages/AIAgentGrid';

<Route path="/agents" element={<AIAgentGrid />} />
```

### Opção 2: Como Tab na Página Existente
```tsx
// Em AIAgent.tsx
import AgentsTab from '../components/ai-agent/AgentsTab';

const AIAgent = () => {
  const [view, setView] = useState<'config' | 'grid'>('config');

  return (
    <>
      <button onClick={() => setView('grid')}>Visualização em Grid</button>
      <button onClick={() => setView('config')}>Visualização Config</button>

      {view === 'grid' ? (
        <AgentsTab token={token} />
      ) : (
        // Renderiza a interface atual
      )}
    </>
  );
};
```

### Opção 3: Substituir a Página Atual
```tsx
// Renomear AIAgent.tsx para AIAgentOld.tsx
// Renomear AIAgentGrid.tsx para AIAgent.tsx
```

---

## 🔧 Customização

### Alterar Cores do Tema
```tsx
// No componente AgentsTab.tsx, procure por:
className="bg-gray-900" // Cor da sidebar ativa
className="bg-blue-50"  // Cor do badge "Principal"
className="bg-purple-50" // Cor do badge "Gatilho"
```

### Adicionar Abas na Sidebar
```tsx
const subTabs = [
  { id: 'agents', label: 'Agentes', icon: Bot },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'followup', label: 'Follow-up', icon: Repeat2 },
  { id: 'test', label: 'Teste', icon: FlaskConical },
  { id: 'custom', label: 'Nova Aba', icon: Star }, // 👈 Adicione aqui
];
```

### Alterar Grid Responsivo
```tsx
// Atualmente: 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Para 4 colunas em telas grandes:
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
```

---

## 📱 Responsividade

### Breakpoints Tailwind

- **Mobile** (< 768px): 1 coluna, sidebar oculta (TODO)
- **Tablet** (768px - 1024px): 2 colunas
- **Desktop** (> 1024px): 3 colunas

### Melhorias Futuras

- [ ] Sidebar responsiva (hamburger menu no mobile)
- [ ] Grid adaptativo (auto-fit)
- [ ] Swipe gestures no mobile

---

## 🐛 Troubleshooting

### Cards não aparecem
- Verificar se o token está sendo passado corretamente
- Checar resposta da API no console (`console.log` em `fetchAgents`)
- Validar estrutura dos dados retornados (deve ser array)

### Modal não abre
- Verificar se `isOpen` está sendo atualizado
- Checar z-index do modal (deve ser 50+)
- Validar que o agent selecionado não é null

### Dark mode não funciona
- Garantir que a classe `dark` está no elemento raiz
- Verificar configuração do Tailwind (darkMode: 'class')

### Animações travadas
- Reduzir duração das transições
- Verificar performance do navegador
- Desabilitar animações: remover classes `transition-*`

---

## 🎯 Próximos Passos

### Funcionalidades Futuras

1. **Notificações** - Implementar aba de notificações
2. **Follow-up** - Integrar componente FollowUpTab
3. **Teste** - Integrar componente AgentTestTab
4. **Busca/Filtro** - Adicionar campo de busca de agentes
5. **Ordenação** - Permitir ordenar por nome, status, data
6. **Ações em lote** - Ativar/desativar múltiplos agentes
7. **Drag & Drop** - Reorganizar ordem dos agentes
8. **Estatísticas** - Cards com métricas dos agentes
9. **Exportação** - Exportar configurações em JSON
10. **Importação** - Importar agentes via arquivo

---

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte o código-fonte em `src/components/ai-agent/`
- Verifique os logs no console do navegador
- Teste com dados mockados para isolar problemas de API

---

**Desenvolvido seguindo as especificações da Guimoo** ✨
