import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { DomainConfig } from "../utils/DomainConfig";
import { checkSessionExpiration } from "../utils/auth";

const LoginMobile = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  // Sessão existente - redireciona para app/inicio (mobile)
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && !checkSessionExpiration()) {
      navigate("/app/inicio");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://n8n.lumendigital.com.br/webhook/prospecta/auth",
        { body: { username, password } }
      );

      if (response.data.status === "sucess") {
        localStorage.setItem("user", JSON.stringify(response.data));

        // Dispara evento customizado para mostrar o modal de boas-vindas
        window.dispatchEvent(new Event('userLoggedIn'));

        // Redireciona para /app/inicio (mobile)
        navigate("/app/inicio");
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
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex flex-col">
      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Logo e Header */}
          <div className="flex flex-col items-center">
            <img
              src={logos.login}
              alt="Logo"
              className="h-24 w-auto mb-8"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.svg";
              }}
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-500 dark:text-neutral-400 mt-2 text-center text-base">
              Faça login para continuar
            </p>
          </div>

          {/* Formulário */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Usuário */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                  Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[#762297] dark:focus:ring-purple-500 focus:border-[#762297] dark:focus:border-purple-500 transition-all text-base"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2 block">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-neutral-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="w-full pl-12 pr-12 py-4 border border-gray-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-[#762297] dark:focus:ring-purple-500 focus:border-[#762297] dark:focus:border-purple-500 transition-all text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Mensagem de erro */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Botão Entrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#762297] to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-xl py-4 font-semibold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-base"
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

            {/* Links */}
            <div className="text-center space-y-3 pt-2">
              <a
                href="https://wa.me/553892590370"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-600 dark:text-neutral-400 hover:text-[#762297] dark:hover:text-purple-400 transition-colors font-medium"
              >
                Esqueci minha senha
              </a>

              <p className="text-sm text-gray-600 dark:text-neutral-400">
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
        </div>
      </div>

      {/* Rodapé */}
      <div className="flex-shrink-0 px-6 pb-6 text-center">
        <p className="text-xs text-gray-400 dark:text-neutral-500">
          © {new Date().getFullYear()} Guimoo - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default LoginMobile;
