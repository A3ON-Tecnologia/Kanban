import React, { useState, useEffect } from 'react';
import type { Board } from '../types';
import type { UserRecord } from '../api';
import { listUsers, createUser, updateUser, deleteUser, getUserBoards, setUserBoards } from '../api';
import ConfirmModal from './ConfirmModal';
import { ThemeToggle } from '../context/ThemeContext';

interface Props {
  boards: Board[];
  onBack: () => void;
}

const ROLE_LABEL = { admin: 'Admin', user: 'Usuário' };

const UserManagement: React.FC<Props> = ({ boards, onBack }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<UserRecord | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'user'>('user');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Permissions panel
  const [permUser, setPermUser] = useState<UserRecord | null>(null);
  const [permBoardIds, setPermBoardIds] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  useEffect(() => {
    listUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditUser(null);
    setFormUsername(''); setFormPassword(''); setFormRole('user'); setFormError('');
    setShowForm(true);
  };

  const openEdit = (u: UserRecord) => {
    setEditUser(u);
    setFormUsername(u.username); setFormPassword(''); setFormRole(u.role); setFormError('');
    setShowForm(true);
  };

  const openPerms = async (u: UserRecord) => {
    setPermUser(u);
    setPermLoading(true);
    const ids = await getUserBoards(u.id).catch(() => []);
    setPermBoardIds(ids);
    setPermLoading(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormLoading(true);
    try {
      if (editUser) {
        const data: { username: string; password?: string; role: 'admin' | 'user' } = { username: formUsername, role: formRole };
        if (formPassword) data.password = formPassword;
        await updateUser(editUser.id, data);
        setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, username: formUsername, role: formRole } : u));
      } else {
        const created = await createUser({ username: formUsername, password: formPassword, role: formRole });
        setUsers(prev => [...prev, { ...created, created_at: new Date().toISOString() }]);
      }
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (u: UserRecord) => {
    await deleteUser(u.id).catch(() => {});
    setUsers(prev => prev.filter(x => x.id !== u.id));
    setConfirmDelete(null);
  };

  const toggleBoard = (boardId: string) => {
    setPermBoardIds(prev =>
      prev.includes(boardId) ? prev.filter(id => id !== boardId) : [...prev, boardId]
    );
  };

  const savePerms = async () => {
    if (!permUser) return;
    setPermLoading(true);
    await setUserBoards(permUser.id, permBoardIds).catch(() => {});
    setPermLoading(false);
    setPermUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            ←
          </button>
          <div>
            <h1 className="font-semibold" style={{ fontSize: 17, color: 'var(--text-primary)' }}>Gerenciar Usuários</h1>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{users.length} {users.length === 1 ? 'usuário' : 'usuários'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate}
            className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-1.5"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}>
            <span className="text-base leading-none">+</span> Novo usuário
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-3xl w-full mx-auto">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                  style={{ background: u.role === 'admin' ? 'rgba(7,217,99,0.15)' : 'rgba(59,130,246,0.15)',
                    color: u.role === 'admin' ? '#07d963' : '#60a5fa', border: `1px solid ${u.role === 'admin' ? 'rgba(7,217,99,0.25)' : 'rgba(59,130,246,0.25)'}` }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: u.role === 'admin' ? 'rgba(7,217,99,0.1)' : 'rgba(59,130,246,0.1)',
                      color: u.role === 'admin' ? '#07d963' : '#60a5fa' }}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {u.role !== 'admin' && (
                    <button onClick={() => openPerms(u)}
                      className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                    Permissões
                  </button>
                  )}
                  <button onClick={() => openEdit(u)}
                    className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                    Editar
                  </button>
                  <button onClick={() => setConfirmDelete(u)}
                    className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#f87171', border: '1px solid var(--danger-border-sm)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay-dark)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowForm(false)}>
          <form className="rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleFormSubmit}>
            <p className="font-semibold" style={{ color: '#e2e8f0' }}>
              {editUser ? 'Editar usuário' : 'Novo usuário'}
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Usuário</label>
              <input value={formUsername} onChange={e => setFormUsername(e.target.value)}
                placeholder="Nome de usuário" autoFocus
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-focus)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Senha {editUser && <span style={{ opacity: 0.5 }}>(deixe em branco para manter)</span>}
              </label>
              <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                placeholder={editUser ? 'Nova senha (opcional)' : 'Senha'}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-focus)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Perfil</label>
              <div className="flex gap-2">
                {(['user', 'admin'] as const).map(r => (
                  <button type="button" key={r} onClick={() => setFormRole(r)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: formRole === r ? (r === 'admin' ? 'var(--accent-badge)' : 'rgba(59,130,246,0.15)') : 'var(--bg-input)',
                      color: formRole === r ? (r === 'admin' ? 'var(--accent)' : '#60a5fa') : 'var(--text-muted)',
                      border: `1px solid ${formRole === r ? (r === 'admin' ? 'var(--accent-glow)' : 'rgba(59,130,246,0.3)') : 'var(--border)'}`,
                    }}>
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'var(--danger-faint)', color: '#f87171', border: '1px solid var(--danger-border-sm)' }}>
                {formError}
              </p>
            )}

            <div className="flex gap-2 mt-1">
              <button type="submit" disabled={formLoading || !formUsername || (!editUser && !formPassword)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', opacity: formLoading ? 0.6 : 1 }}>
                {formLoading ? 'Salvando...' : editUser ? 'Salvar' : 'Criar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions modal */}
      {permUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--overlay-dark)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPermUser(null)}>
          <div className="rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Permissões de acesso</p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Quadros visíveis para <strong style={{ color: 'var(--text-primary)' }}>{permUser.username}</strong>
              </p>
            </div>

            {permLoading ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
            ) : boards.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum quadro criado ainda.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {boards.map(b => {
                  const checked = permBoardIds.includes(b.id);
                  return (
                    <label key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                      style={{ background: checked ? 'rgba(7,217,99,0.07)' : '#242838',
                        border: `1px solid ${checked ? 'rgba(7,217,99,0.2)' : '#2b2e3a'}` }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: checked ? 'var(--accent)' : 'transparent', border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-hover)'}` }}>
                        {checked && <span style={{ color: 'var(--text-on-accent)', fontSize: 10, fontWeight: 700 }}>✓</span>}
                      </div>
                      <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleBoard(b.id)} />
                      <span className="text-sm" style={{ color: checked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{b.title}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={savePerms} disabled={permLoading}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                Salvar
              </button>
              <button onClick={() => setPermUser(null)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Tem certeza que deseja excluir "${confirmDelete.username}"?`}
          confirmLabel="SIM"
          cancelLabel="NAO"
          detail="O usuário perderá acesso ao sistema."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
