import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Lock, LogIn, Loader2, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { DomainConfig } from "../utils/DomainConfig";
import { checkSessionExpiration } from "../utils/auth";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const domainConfig = DomainConfig.getInstance();
  const logos = domainConfig.getLogos();

  // Atualiza título e favicon dinamicamente
  useEffect(() => {
    document.title = domainConfig.getTitle();
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) favicon.href = logos.favicon;
    else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = logos.favicon;
      document.head.appendChild(link);
    }
  }, [logos.favicon, domainConfig]);

  // Sessão existente
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && !checkSessionExpiration()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://n8n.lumendigital.com.br/webhook/prospecta/auth",
        { body: { username, password } } // formato esperado pelo backend
      );

      if (response.data.status === "sucess") {
        localStorage.setItem("user", JSON.stringify(response.data));
        navigate("/dashboard");
      } else {
        setError("Credenciais inválidas");
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* === Card de Login === */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl border border-gray-300 dark:border-gray-700
        shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25),0_0_40px_-10px_rgba(118,34,151,0.3)]
        dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5),0_0_40px_-10px_rgba(118,34,151,0.4)]
        p-10 backdrop-blur-xl transition-all duration-500 hover:shadow-[0_50px_120px_-20px_rgba(0,0,0,0.35)]
        z-10"
      >
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={theme === 'dark' ? logos.loginDark : logos.login}
            alt="Logo Guimoo"
            className={`w-auto transition-opacity duration-300 ${theme === 'dark' ? 'h-14 mb-8' : 'h-28 mb-0'}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.svg";
            }}
          />
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 text-center">
            Bem-vindo de volta<span className="text-[#762297] dark:text-purple-400">.</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm text-center">
            Faça login para continuar
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Usuário */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu e-mail"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#762297]/30 dark:focus:ring-purple-500/40 focus:border-[#762297]/40 dark:focus:border-purple-500/40 transition-all"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[#762297]/30 dark:focus:ring-purple-500/40 focus:border-[#762297]/40 dark:focus:border-purple-500/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#762297] dark:bg-purple-600 text-white rounded-xl py-3 font-medium
            shadow-[0_8px_20px_-5px_rgba(118,34,151,0.4)]
            hover:shadow-[0_10px_25px_-5px_rgba(118,34,151,0.6)]
            dark:hover:bg-purple-700
            transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* LINKS */}
        <div className="text-center mt-6 space-y-2">
          <a
            href="https://wa.me/553892590370"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#762297] dark:hover:text-purple-400 transition-colors"
          >
            Esqueci minha senha
          </a>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{" "}
            <a
              href="https://guimoo.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#762297] dark:text-purple-400 hover:underline"
            >
              Criar conta
            </a>
          </p>
        </div>
      </div>

      {/* Botão de troca de tema - canto inferior direito */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Rodapé */}
      <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
        © {new Date().getFullYear()} Guimoo - Todos os direitos reservados
      </p>
    </div>
  );
};

export default Login;
