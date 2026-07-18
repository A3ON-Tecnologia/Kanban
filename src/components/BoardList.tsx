import React, { useState } from 'react';
import type { Board } from '../types';
import type { AuthUser } from '../api';
import InlineEdit from './InlineEdit';
import ConfirmModal from './ConfirmModal';
import { ThemeToggle } from '../context/ThemeContext';

interface Props {
  boards: Board[];
  onSelect: (id: string) => void;
  onCreate: (title: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onRename: (id: string, title: string) => void | Promise<void>;
  user?: AuthUser;
  onSignOut?: () => void;
  onManageUsers?: () => void;
  onAccount?: () => void;
}

const BoardList: React.FC<Props> = ({ boards, onSelect, onCreate, onDelete, onRename, user, onSignOut, onManageUsers, onAccount }) => {
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCreate = () => {
    const title = newTitle.trim();
    if (!title) return;
    onCreate(title);
    setNewTitle('');
    setCreating(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between flex-wrap gap-y-2 gap-x-2 px-3 sm:px-6 py-3 sm:py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-badge)', border: '1px solid var(--accent-badge-border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>K</span>
          </div>
          <div>
            <h1
              className="font-semibold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', color: 'var(--text-primary)' }}
            >
              Meus Quadros
            </h1>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {boards.length} {boards.length === 1 ? 'quadro' : 'quadros'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onManageUsers && (
            <button
              onClick={onManageUsers}
              className="flex items-center gap-2 text-sm font-medium rounded-lg px-2.5 sm:px-3 py-1.5 transition-colors"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)'; }}
            >
              Usuários
            </button>
          )}
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 text-sm font-medium rounded-lg px-2.5 sm:px-3 py-1.5 transition-colors"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-subtle)'; }}
          >
            <span className="text-base leading-none font-light">+</span>
            <span className="hidden sm:inline">Novo quadro</span>
            <span className="sm:hidden">Novo</span>
          </button>
          <ThemeToggle />
          {onAccount && (
            <button
              onClick={onAccount}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              title="Minha conta"
            >
              <span aria-hidden>⚙</span>
              <span className="hidden sm:inline">Minha conta</span>
            </button>
          )}
          {user && onSignOut && (
            <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
              <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>{user.username}</span>
              <button
                onClick={onSignOut}
                className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'var(--danger-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                title="Sair"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6">
        {/* Create board form */}
        {creating && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-glow)', maxWidth: '380px' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--accent)', letterSpacing: '0.08em' }}>NOVO QUADRO</p>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setCreating(false); setNewTitle(''); }
              }}
              placeholder="Nome do quadro..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 text-xs py-1.5 rounded-md font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
              >
                Criar
              </button>
              <button
                onClick={() => { setCreating(false); setNewTitle(''); }}
                className="flex-1 text-xs py-1.5 rounded-md"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Boards grid */}
        {boards.length === 0 && !creating ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-ghost)', border: '1px dashed var(--accent-border)' }}>
              <span className="text-2xl opacity-40">🗂</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum quadro criado ainda</p>
            <button
              onClick={() => setCreating(true)}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ color: 'var(--accent)', border: '1px solid var(--accent-border)', background: 'var(--accent-ghost)' }}
            >
              Criar primeiro quadro
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {boards.map(board => {
              const totalCards = board.columns.reduce((acc, c) => acc + c.cards.length, 0);
              const canDelete = user?.role === 'admin' || board.createdBy === user?.id;
              return (
                <BoardCard
                  key={board.id}
                  board={board}
                  totalCards={totalCards}
                  canDelete={canDelete}
                  onSelect={() => onSelect(board.id)}
                  onRename={title => onRename(board.id, title)}
                  onDelete={() => setConfirmDelete(board.id)}
                />
              );
            })}
          </div>
        )}
      </main>

      {confirmDelete && (
        <ConfirmModal
          title="Tem certeza que deseja excluir?"
          detail="Todas as colunas e cartões serão removidos permanentemente."
          confirmLabel="SIM"
          cancelLabel="NAO"
          onConfirm={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

interface BoardCardProps {
  board: Board;
  totalCards: number;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

const BOARD_ACCENTS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const BoardCard: React.FC<BoardCardProps> = ({ board, totalCards, canDelete, onSelect, onRename, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const accent = BOARD_ACCENTS[Math.abs(board.id.charCodeAt(0) + (board.id.charCodeAt(4) || 0)) % BOARD_ACCENTS.length];

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: 'var(--bg-surface)',
        border: hovered ? `1px solid ${accent}55` : '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
        transition: 'border-color 0.15s ease, transform 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Title + delete */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
            <InlineEdit
              value={board.title}
              onSave={onRename}
              className="text-base font-semibold"
              tag="h2"
              textColor="var(--text-primary)"
            />
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all"
            style={{ color: canDelete ? 'var(--text-faint)' : 'transparent', background: 'var(--glass-bg)', visibility: canDelete ? 'visible' : 'hidden' }}
            onMouseEnter={e => { if (canDelete) { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'var(--danger-subtle)'; } }}
            onMouseLeave={e => { if (canDelete) { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'var(--glass-bg)'; } }}
          >
            ✕
          </button>
        </div>

        {/* Column tags */}
        {board.columns.length > 0 ? (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {board.columns.slice(0, 4).map(col => (
              <span
                key={col.id}
                className="text-xs px-2 py-0.5 rounded-md"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', fontSize: '10.5px', border: '1px solid var(--border)' }}
              >
                {col.title}
              </span>
            ))}
            {board.columns.length > 4 && (
              <span className="text-xs px-2 py-0.5 rounded-md" style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>
                +{board.columns.length - 4}
              </span>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Sem colunas</span>
          </div>
        )}

        {/* Stats + open button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.08em' }}>COLUNAS</span>
              <span className="text-base font-bold leading-none" style={{ color: accent }}>{board.columns.length}</span>
            </div>
            <div className="w-px h-5" style={{ background: 'var(--border)' }} />
            <div className="flex flex-col gap-0.5">
              <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.08em' }}>CARTÕES</span>
              <span className="text-base font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{totalCards}</span>
            </div>
          </div>
          <span
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{
              color: hovered ? 'var(--text-on-accent)' : accent,
              background: hovered ? accent : `${accent}18`,
              border: `1px solid ${accent}40`,
              transition: 'all 0.15s ease',
              fontSize: '11px',
            }}
          >
            Abrir →
          </span>
        </div>
      </div>
    </div>
  );
};

export default BoardList;
