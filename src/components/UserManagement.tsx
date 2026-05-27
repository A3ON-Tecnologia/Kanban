import React, { useState, useEffect } from 'react';
import type { Board } from '../types';
import type { UserRecord } from '../api';
import { listUsers, createUser, updateUser, deleteUser, getUserBoards, setUserBoards } from '../api';
import ConfirmModal from './ConfirmModal';

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
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0f16' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #2b2e3a', background: 'rgba(13,15,22,0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: '#7a7f8c', border: '1px solid #2b2e3a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#7a7f8c')}>
            ←
          </button>
          <div>
            <h1 className="font-semibold" style={{ fontSize: 17, color: '#e2e8f0' }}>Gerenciar Usuários</h1>
            <p style={{ fontSize: 11.5, color: '#7a7f8c', marginTop: 1 }}>{users.length} {users.length === 1 ? 'usuário' : 'usuários'}</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-1.5"
          style={{ background: 'rgba(7,217,99,0.12)', color: '#07d963', border: '1px solid rgba(7,217,99,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(7,217,99,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(7,217,99,0.12)')}>
          <span className="text-base leading-none">+</span> Novo usuário
        </button>
      </header>

      <main className="flex-1 px-6 py-6 max-w-3xl w-full mx-auto">
        {loading ? (
          <p style={{ color: '#7a7f8c' }}>Carregando...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: '#171a27', border: '1px solid #2b2e3a' }}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                  style={{ background: u.role === 'admin' ? 'rgba(7,217,99,0.15)' : 'rgba(59,130,246,0.15)',
                    color: u.role === 'admin' ? '#07d963' : '#60a5fa', border: `1px solid ${u.role === 'admin' ? 'rgba(7,217,99,0.25)' : 'rgba(59,130,246,0.25)'}` }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{u.username}</p>
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
                      style={{ color: '#7a7f8c', border: '1px solid #2b2e3a' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#3a3f52'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#7a7f8c'; e.currentTarget.style.borderColor = '#2b2e3a'; }}>
                      Permissões
                    </button>
                  )}
                  <button onClick={() => openEdit(u)}
                    className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#7a7f8c', border: '1px solid #2b2e3a' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#3a3f52'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#7a7f8c'; e.currentTarget.style.borderColor = '#2b2e3a'; }}>
                    Editar
                  </button>
                  <button onClick={() => setConfirmDelete(u)}
                    className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
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
          style={{ background: 'rgba(13,15,22,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowForm(false)}>
          <form className="rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ background: '#1b1e2f', border: '1px solid #2b2e3a' }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleFormSubmit}>
            <p className="font-semibold" style={{ color: '#e2e8f0' }}>
              {editUser ? 'Editar usuário' : 'Novo usuário'}
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: '#7a7f8c' }}>Usuário</label>
              <input value={formUsername} onChange={e => setFormUsername(e.target.value)}
                placeholder="Nome de usuário" autoFocus
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#242838', border: '1px solid #2b2e3a', color: '#e2e8f0' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(7,217,99,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2b2e3a')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: '#7a7f8c' }}>
                Senha {editUser && <span style={{ opacity: 0.5 }}>(deixe em branco para manter)</span>}
              </label>
              <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)}
                placeholder={editUser ? 'Nova senha (opcional)' : 'Senha'}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#242838', border: '1px solid #2b2e3a', color: '#e2e8f0' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(7,217,99,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2b2e3a')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs" style={{ color: '#7a7f8c' }}>Perfil</label>
              <div className="flex gap-2">
                {(['user', 'admin'] as const).map(r => (
                  <button type="button" key={r} onClick={() => setFormRole(r)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: formRole === r ? (r === 'admin' ? 'rgba(7,217,99,0.15)' : 'rgba(59,130,246,0.15)') : '#242838',
                      color: formRole === r ? (r === 'admin' ? '#07d963' : '#60a5fa') : '#7a7f8c',
                      border: `1px solid ${formRole === r ? (r === 'admin' ? 'rgba(7,217,99,0.3)' : 'rgba(59,130,246,0.3)') : '#2b2e3a'}`,
                    }}>
                    {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                {formError}
              </p>
            )}

            <div className="flex gap-2 mt-1">
              <button type="submit" disabled={formLoading || !formUsername || (!editUser && !formPassword)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#07d963', color: '#0d0f16', opacity: formLoading ? 0.6 : 1 }}>
                {formLoading ? 'Salvando...' : editUser ? 'Salvar' : 'Criar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: '#242838', color: '#7a7f8c' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions modal */}
      {permUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,15,22,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPermUser(null)}>
          <div className="rounded-xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ background: '#1b1e2f', border: '1px solid #2b2e3a' }}
            onClick={e => e.stopPropagation()}>
            <div>
              <p className="font-semibold" style={{ color: '#e2e8f0' }}>Permissões de acesso</p>
              <p className="text-sm mt-0.5" style={{ color: '#7a7f8c' }}>
                Quadros visíveis para <strong style={{ color: '#e2e8f0' }}>{permUser.username}</strong>
              </p>
            </div>

            {permLoading ? (
              <p className="text-sm" style={{ color: '#7a7f8c' }}>Carregando...</p>
            ) : boards.length === 0 ? (
              <p className="text-sm" style={{ color: '#7a7f8c' }}>Nenhum quadro criado ainda.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {boards.map(b => {
                  const checked = permBoardIds.includes(b.id);
                  return (
                    <label key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                      style={{ background: checked ? 'rgba(7,217,99,0.07)' : '#242838',
                        border: `1px solid ${checked ? 'rgba(7,217,99,0.2)' : '#2b2e3a'}` }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: checked ? '#07d963' : 'transparent', border: `1.5px solid ${checked ? '#07d963' : '#3a3f52'}` }}>
                        {checked && <span style={{ color: '#0d0f16', fontSize: 10, fontWeight: 700 }}>✓</span>}
                      </div>
                      <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleBoard(b.id)} />
                      <span className="text-sm" style={{ color: checked ? '#e2e8f0' : '#7a7f8c' }}>{b.title}</span>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={savePerms} disabled={permLoading}
                className="flex-1 py-2 rounded-lg text-sm font-semibold"
                style={{ background: '#07d963', color: '#0d0f16' }}>
                Salvar
              </button>
              <button onClick={() => setPermUser(null)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: '#242838', color: '#7a7f8c' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Excluir "${confirmDelete.username}"?`}
          detail="O usuário perderá acesso ao sistema."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;
