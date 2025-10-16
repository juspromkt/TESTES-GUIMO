import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/**
 * Componente de botão para alternar entre modo claro e escuro
 * Utiliza o ThemeContext para gerenciar o estado do tema
 */
export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-theme duration-300
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
        active:scale-95"
      title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-neutral-700 dark:text-neutral-300 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
