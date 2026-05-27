import React, { useState } from 'react';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await login(username, password);
      signIn(token, user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0d0f16' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(7,217,99,0.15)', border: '1px solid rgba(7,217,99,0.3)' }}>
            <span className="text-xl font-bold" style={{ color: '#07d963' }}>K</span>
          </div>
          <div className="text-center">
            <h1 className="font-semibold text-lg" style={{ color: '#e2e8f0' }}>Kanban</h1>
            <p className="text-sm" style={{ color: '#7a7f8c' }}>Entre com sua conta para continuar</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{ background: '#171a27', border: '1px solid #2b2e3a' }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#7a7f8c' }}>Usuário</label>
            <input
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: '#242838', border: '1px solid #2b2e3a', color: '#e2e8f0' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(7,217,99,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2b2e3a')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#7a7f8c' }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{ background: '#242838', border: '1px solid #2b2e3a', color: '#e2e8f0' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(7,217,99,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2b2e3a')}
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity"
            style={{
              background: loading || !username || !password ? 'rgba(7,217,99,0.3)' : '#07d963',
              color: '#0d0f16',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
