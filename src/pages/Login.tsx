import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { LoginResponse } from '../types/auth';
import { User, Lock, LogIn, Loader2 } from 'lucide-react';
import { DomainConfig } from '../utils/DomainConfig';
import { checkSessionExpiration } from '../utils/auth';
import { fetchUserPermissions } from '../utils/permissions';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const domainConfig = DomainConfig.getInstance();
  const logos = domainConfig.getLogos();

  // Check for existing session on mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user && !checkSessionExpiration()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Update title and favicon
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = logos.favicon;
    }
    document.title = domainConfig.getTitle();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post<LoginResponse>(
        'https://n8n.lumendigital.com.br/webhook/prospecta/auth',
        {
          body: {
            username,
            password
          }
        }
      );

      if (response.data.status === 'sucess') {
        localStorage.setItem('user', JSON.stringify(response.data));
        
        // Fetch user permissions after successful login
        await fetchUserPermissions(response.data.token);
        
        navigate('/dashboard');
      } else {
        setError('Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${domainConfig.getSidebarColor()} flex items-center justify-center p-4`}>
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img 
            src={logos.login}
            alt="Logo" 
            className="h-20 w-auto mb-6"
          />
          <h2 className="text-2xl font-semibold text-gray-800">Bem-vindo de volta!</h2>
          <p className="text-gray-500 mt-2">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#19ac7c] focus:border-[#19ac7c] transition-all duration-200"
                placeholder="Digite seu usuário"
                required
              />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#19ac7c] focus:border-[#19ac7c] transition-all duration-200"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#762297] ${domainConfig.getTextLoginColor()} rounded-lg py-3 hover:opacity-90 transition-opacity font-medium shadow-lg flex items-center justify-center gap-2 disabled:opacity-70`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;