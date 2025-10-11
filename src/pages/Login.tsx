import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { User, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { DomainConfig } from "../utils/DomainConfig";
import { checkSessionExpiration } from "../utils/auth";

const Login = () => {
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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-white text-gray-800 overflow-hidden">
      {/* === Card de Login === */}
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-gray-100
        shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25),0_0_40px_-10px_rgba(118,34,151,0.3)]
        p-10 backdrop-blur-xl transition-all duration-500 hover:shadow-[0_50px_120px_-20px_rgba(0,0,0,0.35)]
        z-10"
      >
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={logos.login}
            alt="Logo Guimoo"
            className="h-28 w-auto mb-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/logo.svg";
            }}
          />
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 text-center">
            Bem-vindo de volta<span className="text-[#762297]">.</span>
          </h2>
          <p className="text-gray-500 mt-1 text-sm text-center">
            Faça login para continuar
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Usuário */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Usuário</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu e-mail"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#762297]/30 focus:border-[#762297]/40 transition-all"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-[#762297]/30 focus:border-[#762297]/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#762297] text-white rounded-xl py-3 font-medium
            shadow-[0_8px_20px_-5px_rgba(118,34,151,0.4)]
            hover:shadow-[0_10px_25px_-5px_rgba(118,34,151,0.6)]
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
            className="text-sm text-gray-500 hover:text-[#762297] transition-colors"
          >
            Esqueci minha senha
          </a>

          <p className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <a
              href="https://guimoo.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#762297] hover:underline"
            >
              Criar conta
            </a>
          </p>
        </div>
      </div>

      {/* Rodapé */}
      <p className="mt-8 text-xs text-gray-400">
        © {new Date().getFullYear()} Guimoo - Todos os direitos reservados
      </p>
    </div>
  );
};

export default Login;
