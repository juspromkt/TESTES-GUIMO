// 🎨 Design Tokens — Paleta de cores oficial Guimoo
// Sistema centralizado de cores para consistência visual e facilidade de manutenção

export const colors = {
  // 🔵 Cor Primária — Blue/Indigo (principal do sistema)
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1", // Cor principal padrão
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
  },

  // 🟢 Cor de Acento — Emerald (destaque positivo, sucesso)
  accent: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981", // Verde acento padrão
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },

  // ⚫ Cores Neutras — Gray (textos, backgrounds, borders)
  neutral: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // 🟣 Cor Alternativa — Purple (tema especial, branding secundário)
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#762297", // Roxo do login
    700: "#6b21a8",
    800: "#581c87",
    900: "#3b0764",
  },

  // 🎨 Cores Semânticas (feedback visual)
  semantic: {
    success: "#10b981",  // Verde — operações bem-sucedidas
    warning: "#f59e0b",  // Âmbar — avisos e atenção
    error: "#ef4444",    // Vermelho — erros e ações destrutivas
    info: "#3b82f6",     // Azul — informações neutras
  },
};

// 📊 Backgrounds por tema
export const backgrounds = {
  light: {
    primary: "#ffffff",
    secondary: "#f9fafb",
    tertiary: "#f3f4f6",
  },
  dark: {
    primary: "#1f1f1f",
    secondary: "#111827",
    tertiary: "#0f172a",
  },
};

// 🎯 Helper para acessar cores dinamicamente
export const getColorScale = (
  color: keyof typeof colors,
  shade: number
): string => {
  const colorObj = colors[color];
  if (colorObj && typeof colorObj === "object" && shade in colorObj) {
    return (colorObj as any)[shade];
  }
  return "#000000";
};

// 📝 Export de tipos para TypeScript
export type ColorScale = keyof typeof colors;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
