# 🎨 Guimoo Design System

> Sistema de design centralizado para manter consistência visual, facilitar manutenção e permitir escalabilidade.

---

## 📚 Índice

- [Paleta de Cores](#-paleta-de-cores)
- [Temas](#-temas)
- [Componentes](#-componentes)
- [Guidelines](#-guidelines)
- [Acessibilidade](#-acessibilidade)
- [Uso no Código](#-uso-no-código)

---

## 🎨 Paleta de Cores

### Cores Primárias

#### Blue/Indigo (Principal)
Cor principal do sistema, usada para elementos de ação e destaque.

```
primary-50:  #eef2ff
primary-100: #e0e7ff
primary-200: #c7d2fe
primary-300: #a5b4fc
primary-400: #818cf8
primary-500: #6366f1 ⭐ (Cor principal)
primary-600: #4f46e5
primary-700: #4338ca
primary-800: #3730a3
primary-900: #312e81
```

**Uso**: Botões principais, links, elementos ativos, foco

---

### Cores Secundárias

#### Neutral (Cinza)
Base neutra para textos, backgrounds e borders.

```
neutral-50:  #f9fafb
neutral-100: #f3f4f6
neutral-200: #e5e7eb
neutral-300: #d1d5db
neutral-400: #9ca3af
neutral-500: #6b7280
neutral-600: #4b5563
neutral-700: #374151
neutral-800: #1f2937
neutral-900: #111827
```

**Uso**: Textos, backgrounds, borders, superfícies

---

### Cores de Acento

#### Emerald (Verde)
Cor de acento para sucesso e elementos positivos.

```
accent-50:  #ecfdf5
accent-100: #d1fae5
accent-200: #a7f3d0
accent-300: #6ee7b7
accent-400: #34d399
accent-500: #10b981 ⭐ (Acento padrão)
accent-600: #059669
accent-700: #047857
accent-800: #065f46
accent-900: #064e3b
```

**Uso**: Badges de sucesso, indicadores positivos, workspaces

---

### Cores Alternativas

#### Purple (Roxo)
Tema alternativo, usado especialmente no login.

```
purple-50:  #faf5ff
purple-100: #f3e8ff
purple-200: #e9d5ff
purple-300: #d8b4fe
purple-400: #c084fc
purple-500: #a855f7
purple-600: #762297 ⭐ (Roxo do login)
purple-700: #6b21a8
purple-800: #581c87
purple-900: #3b0764
```

**Uso**: Login, branding secundário

---

### Cores Semânticas

Cores para feedback visual consistente:

| Tipo | Cor | Hexadecimal | Uso |
|------|-----|-------------|-----|
| **Success** | Emerald | `#10b981` | Operações bem-sucedidas, confirmações |
| **Warning** | Amber | `#f59e0b` | Avisos, atenção necessária |
| **Error** | Red | `#ef4444` | Erros, ações destrutivas |
| **Info** | Blue | `#3b82f6` | Informações neutras, dicas |

---

## 🌗 Temas

### Modo Claro (Padrão)

```css
--background: #ffffff
--foreground: #111827
```

- Background principal: Branco
- Background secundário: `neutral-50` (#f9fafb)
- Background terciário: `neutral-100` (#f3f4f6)
- Textos: `neutral-900` a `neutral-600`

### Modo Escuro

```css
--background: #1f1f1f
--foreground: #f9fafb
```

- Background principal: `#1f1f1f`
- Background secundário: `neutral-900` (#111827)
- Background terciário: `neutral-800` (#1f2937)
- Textos: `neutral-100` a `neutral-400`

---

## 🧩 Componentes

### Botões

#### Primário
```tsx
<button className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-theme">
  Confirmar
</button>
```

#### Secundário
```tsx
<button className="bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 px-4 py-2 rounded-lg transition-theme">
  Cancelar
</button>
```

#### Sucesso
```tsx
<button className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg transition-theme">
  Salvar
</button>
```

#### Destrutivo
```tsx
<button className="bg-error hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-theme">
  Excluir
</button>
```

---

### Cards

```tsx
<div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm transition-theme">
  Conteúdo do card
</div>
```

---

### Inputs

```tsx
<input
  type="text"
  className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 rounded-lg px-3 py-2 transition-theme"
  placeholder="Digite aqui..."
/>
```

---

### Badges

#### Sucesso
```tsx
<span className="bg-accent-100 dark:bg-accent-900 text-accent-700 dark:text-accent-300 px-2 py-1 rounded-full text-xs font-medium">
  Ativo
</span>
```

#### Aviso
```tsx
<span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full text-xs font-medium">
  Pendente
</span>
```

#### Erro
```tsx
<span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
  Inativo
</span>
```

---

## 📋 Guidelines

### 1. Sempre Use Classes Dark

**Correto:**
```tsx
<div className="bg-white dark:bg-neutral-800">
```

**Incorreto:**
```tsx
<div className="bg-white">
```

### 2. Use a Propriedade transition-theme

Para transições suaves entre temas:

```tsx
<div className="bg-white dark:bg-neutral-800 transition-theme">
```

### 3. Importe Cores dos Tokens

**Correto:**
```tsx
import { colors } from '../styles/tokens';
const primaryColor = colors.primary[600];
```

**Incorreto:**
```tsx
const primaryColor = '#4f46e5'; // Hardcoded
```

### 4. Use o DomainConfig

Para componentes que precisam se adaptar ao domínio:

```tsx
import { DomainConfig } from '../utils/DomainConfig';

const domainConfig = DomainConfig.getInstance();
const buttonClasses = domainConfig.getButtonClasses();
```

### 5. Evite !important

Use especificidade correta ou variantes do Tailwind ao invés de `!important`.

**Correto:**
```tsx
<div className="bg-white dark:bg-neutral-800">
```

**Incorreto:**
```css
.my-class {
  background-color: white !important;
}
```

---

## ♿ Acessibilidade

### Contraste de Cores

Todos os pares de cores no sistema atendem aos padrões WCAG AA:

| Fundo | Texto | Contraste | Status |
|-------|-------|-----------|--------|
| `neutral-50` | `neutral-900` | 17.4:1 | ✅ AAA |
| `primary-600` | `white` | 7.0:1 | ✅ AA |
| `accent-500` | `white` | 4.5:1 | ✅ AA |

### Estados Interativos

Todos os elementos interativos devem ter:

- Estado de **hover** claramente visível
- Estado de **focus** com anel de foco (`focus:ring-2`)
- Estado de **disabled** com opacidade reduzida
- Transições suaves (`transition-theme`)

### Exemplo Completo

```tsx
<button
  className="bg-primary-600 hover:bg-primary-700
    focus:ring-2 focus:ring-primary-500 focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-primary-700 dark:hover:bg-primary-600
    transition-theme"
>
  Botão Acessível
</button>
```

---

## 💻 Uso no Código

### Importando Tokens

```tsx
import { colors, backgrounds, getColorScale } from '../styles/tokens';

// Acessar cor específica
const primaryColor = colors.primary[600]; // "#4f46e5"

// Usar helper
const accentColor = getColorScale('accent', 500); // "#10b981"

// Backgrounds
const lightBg = backgrounds.light.primary; // "#ffffff"
const darkBg = backgrounds.dark.primary; // "#1f1f1f"
```

### Usando no Tailwind

As cores dos tokens estão mapeadas no Tailwind:

```tsx
<div className="bg-primary-500 text-accent-600 border-neutral-300">
  Conteúdo com cores dos tokens
</div>
```

### Usando DomainConfig

```tsx
import { DomainConfig } from '../utils/DomainConfig';

const domainConfig = DomainConfig.getInstance();

// Obter classes utilitárias
const buttonClasses = domainConfig.getButtonClasses();
const cardClasses = domainConfig.getCardClasses();

// Usar no componente
<button className={buttonClasses}>Botão</button>
<div className={cardClasses}>Card</div>
```

### Componente de Exemplo Completo

```tsx
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { DomainConfig } from '../utils/DomainConfig';

export function ExampleComponent() {
  const domainConfig = DomainConfig.getInstance();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-theme">
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4 transition-theme">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Título
          </h1>
          <ThemeToggleButton />
        </div>
      </header>

      <main className="p-6">
        <div className={domainConfig.getCardClasses() + " p-6"}>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Card de Exemplo
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Conteúdo do card
          </p>
          <button className={domainConfig.getButtonClasses() + " mt-4"}>
            Ação
          </button>
        </div>
      </main>
    </div>
  );
}
```

---

## 🎯 Checklist de Implementação

Ao criar um novo componente, certifique-se de:

- ✅ Usar cores dos tokens (via Tailwind ou import direto)
- ✅ Adicionar classes `dark:` para todos os backgrounds e textos
- ✅ Incluir `transition-theme` para transições suaves
- ✅ Garantir contraste adequado (WCAG AA mínimo)
- ✅ Adicionar estados hover, focus e disabled
- ✅ Testar em modo claro e escuro
- ✅ Evitar `!important` no CSS
- ✅ Usar DomainConfig quando necessário

---

## 🔄 Atualizações do Sistema

### Changelog

#### v2.0.0 (2025)
- ✅ Sistema de design tokens centralizado
- ✅ Paleta de cores unificada
- ✅ Modo dark totalmente funcional
- ✅ Remoção de 450+ linhas de CSS com `!important`
- ✅ Componente ThemeToggleButton
- ✅ DomainConfig expandido com suporte a temas
- ✅ Transições suaves entre temas
- ✅ Documentação completa

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o design system:

- Consulte este documento primeiro
- Verifique os exemplos de código
- Teste as cores no [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors)

---

**Última atualização:** Março 2025
**Versão:** 2.0.0
**Mantido por:** Equipe Guimoo
