import React, { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile, changeMyPassword, testMyEmail, testMySms } from '../api';
import { ThemeToggle } from '../context/ThemeContext';

interface Props {
  username?: string;
  onBack: () => void;
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
};

const AccountSettings: React.FC<Props> = ({ username, onBack }) => {
  const [loading, setLoading] = useState(true);

  // Perfil
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [testing, setTesting] = useState(false);

  // Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then(u => {
        setEmail(u.email ?? '');
        setPhone(u.phone ?? '');
        setSmtpHost(u.smtp_host ?? '');
        setSmtpPort(String(u.smtp_port ?? 587));
        setSmtpSecure(!!u.smtp_secure);
        setSmtpUser(u.smtp_user ?? '');
        setSmtpPass(u.smtp_pass ?? '');
      })
      .catch(e => setProfileError(e instanceof Error ? e.message : 'Erro ao carregar perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(''); setProfileMsg(''); setSavingProfile(true);
    try {
      await updateMyProfile({
        email,
        phone,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort || 587),
        smtp_secure: smtpSecure,
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
      });
      setProfileMsg('Dados salvos com sucesso.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTestEmail = async () => {
    setProfileError(''); setProfileMsg(''); setTesting(true);
    try {
      await testMyEmail();
      setProfileMsg('Email de teste enviado. Verifique sua caixa de entrada.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erro ao enviar email de teste');
    } finally {
      setTesting(false);
    }
  };

  const handleTestSms = async () => {
    setProfileError(''); setProfileMsg(''); setTesting(true);
    try {
      await testMySms();
      setProfileMsg('SMS de teste enviado.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erro ao enviar SMS de teste');
    } finally {
      setTesting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(''); setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação não confere com a nova senha.');
      return;
    }
    setSavingPassword(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setPasswordMsg('Senha alterada com sucesso.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erro ao trocar senha');
    } finally {
      setSavingPassword(false);
    }
  };

  const fieldLabel = 'text-xs font-medium';
  const fieldLabelStyle: React.CSSProperties = { color: 'var(--text-muted)' };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Voltar">
            ←
          </button>
          <div className="min-w-0">
            <h1 className="font-semibold truncate" style={{ fontSize: 17, color: 'var(--text-primary)' }}>Minha conta</h1>
            {username && <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{username}</p>}
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-2xl w-full mx-auto flex flex-col gap-4">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : (
          <>
            {/* Perfil + SMTP */}
            <form onSubmit={handleSaveProfile}
              className="rounded-xl p-4 sm:p-5 flex flex-col gap-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Perfil e notificações</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel} style={fieldLabelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@exemplo.com" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel} style={fieldLabelStyle}>Telefone (SMS)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+55 11 99999-8888" className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                </div>
              </div>

              {/* SMTP */}
              <div className="rounded-lg p-3 flex flex-col gap-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Configuração SMTP</p>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Opcional</span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Para o Gmail, use uma "Senha de app" de 16 dígitos (não a senha normal da conta).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel} style={fieldLabelStyle}>Servidor SMTP</label>
                    <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com"
                      className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...inputStyle, background: 'var(--bg-surface)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel} style={fieldLabelStyle}>Porta SMTP</label>
                    <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587"
                      className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...inputStyle, background: 'var(--bg-surface)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel} style={fieldLabelStyle}>Usuário SMTP</label>
                    <input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="usuario@gmail.com"
                      className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...inputStyle, background: 'var(--bg-surface)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={fieldLabel} style={fieldLabelStyle}>Senha de app SMTP</label>
                    <input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="16 dígitos"
                      className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...inputStyle, background: 'var(--bg-surface)' }} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={smtpSecure} onChange={e => setSmtpSecure(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                  Usar conexão segura (SSL/TLS)
                </label>
              </div>

              {profileError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--danger-faint)', color: '#f87171', border: '1px solid var(--danger-border-sm)' }}>
                  {profileError}
                </p>
              )}
              {profileMsg && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {profileMsg}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleTestEmail} disabled={testing || savingProfile}
                  className="flex-1 min-w-[130px] py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                  {testing ? 'Enviando...' : 'Testar email'}
                </button>
                <button type="button" onClick={handleTestSms} disabled={testing || savingProfile}
                  className="flex-1 min-w-[130px] py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                  {testing ? 'Enviando...' : 'Testar SMS'}
                </button>
                <button type="submit" disabled={savingProfile || !email}
                  className="flex-1 min-w-[130px] py-2 rounded-lg text-sm font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', opacity: savingProfile ? 0.6 : 1 }}>
                  {savingProfile ? 'Salvando...' : 'Salvar dados'}
                </button>
              </div>
            </form>

            {/* Trocar senha */}
            <form onSubmit={handleChangePassword}
              className="rounded-xl p-4 sm:p-5 flex flex-col gap-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Alterar senha</p>

              <div className="flex flex-col gap-1.5">
                <label className={fieldLabel} style={fieldLabelStyle}>Senha atual</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  autoComplete="current-password" placeholder="Digite sua senha atual"
                  className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel} style={fieldLabelStyle}>Nova senha</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password" placeholder="Nova senha"
                    className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={fieldLabel} style={fieldLabelStyle}>Confirmar nova senha</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password" placeholder="Repita a nova senha"
                    className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
                </div>
              </div>

              {passwordError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--danger-faint)', color: '#f87171', border: '1px solid var(--danger-border-sm)' }}>
                  {passwordError}
                </p>
              )}
              {passwordMsg && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--accent-faint)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {passwordMsg}
                </p>
              )}

              <button type="submit" disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full sm:w-auto sm:self-start px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', opacity: savingPassword ? 0.6 : 1 }}>
                {savingPassword ? 'Salvando...' : 'Alterar senha'}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default AccountSettings;
