import React, { useState } from 'react';
import type { Board } from '../types';
import InlineEdit from './InlineEdit';

interface Props {
  boards: Board[];
  onSelect: (id: string) => void;
  onCreate: (title: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

const BoardList: React.FC<Props> = ({ boards, onSelect, onCreate, onDelete, onRename }) => {
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
    <div
      className="min-h-screen flex flex-col grid-bg"
      style={{ background: 'linear-gradient(135deg, #050b18 0%, #0a0f2e 50%, #050b18 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header
        className="relative z-10 px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(99,179,237,0.1)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', boxShadow: '0 0 20px rgba(34,211,238,0.4)' }}
          >
            <span className="text-white text-sm font-bold">K</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Meus Quadros
            </h1>
            <p className="text-xs mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {boards.length} quadro{boards.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', color: '#050b18', boxShadow: '0 0 15px rgba(34,211,238,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 25px rgba(34,211,238,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 15px rgba(34,211,238,0.3)')}
        >
          <span className="text-base leading-none">+</span>
          <span>Novo quadro</span>
        </button>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 px-8 py-8">
        {/* Create board form */}
        {creating && (
          <div className="mb-6 p-5 rounded-2xl animate-slide-in" style={{ background: 'rgba(8,15,35,0.8)', border: '1px solid rgba(34,211,238,0.3)', backdropFilter: 'blur(20px)', maxWidth: '400px' }}>
            <p className="text-xs mono mb-3" style={{ color: 'rgba(34,211,238,0.7)', fontSize: '10px', letterSpacing: '0.1em' }}>NOVO QUADRO</p>
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setCreating(false); setNewTitle(''); }
              }}
              placeholder="Nome do quadro..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white placeholder-white/30 mono mb-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(34,211,238,0.3)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 text-sm py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', color: '#050b18' }}
              >
                Criar
              </button>
              <button
                onClick={() => { setCreating(false); setNewTitle(''); }}
                className="text-sm px-4 py-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Boards grid */}
        {boards.length === 0 && !creating ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.05)', border: '1px dashed rgba(34,211,238,0.2)' }}>
              <span className="text-3xl opacity-30">🗂</span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum quadro criado ainda</p>
            <button
              onClick={() => setCreating(true)}
              className="text-sm px-4 py-2 rounded-xl"
              style={{ color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.05)' }}
            >
              Criar primeiro quadro
            </button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {boards.map(board => {
              const totalCards = board.columns.reduce((acc, c) => acc + c.cards.length, 0);
              return (
                <BoardCard
                  key={board.id}
                  board={board}
                  totalCards={totalCards}
                  onSelect={() => onSelect(board.id)}
                  onRename={title => onRename(board.id, title)}
                  onDelete={() => setConfirmDelete(board.id)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,11,24,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm animate-slide-in"
            style={{ background: 'rgba(8,15,35,0.95)', border: '1px solid rgba(248,113,113,0.3)', backdropFilter: 'blur(20px)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white font-semibold mb-1">Excluir quadro?</p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Todas as colunas e cartões serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}
              >
                Excluir
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-xl text-sm transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface BoardCardProps {
  board: Board;
  totalCards: number;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

const BOARD_COLORS = ['#22d3ee', '#8b5cf6', '#f472b6', '#4ade80', '#fb923c', '#60a5fa', '#facc15', '#f87171'];

const BoardCard: React.FC<BoardCardProps> = ({ board, totalCards, onSelect, onRename, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const accentColor = BOARD_COLORS[Math.abs(board.id.charCodeAt(0) + board.id.charCodeAt(4)) % BOARD_COLORS.length];

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group"
      style={{
        background: 'rgba(8,15,35,0.7)',
        border: hovered ? `1px solid ${accentColor}50` : '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 8px 30px rgba(0,0,0,0.4), 0 0 20px ${accentColor}20` : '0 2px 12px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {/* Top accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)`, opacity: hovered ? 1 : 0.5, transition: 'opacity 0.2s' }} />

      <div className="p-5">
        {/* Title + delete */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
            <InlineEdit
              value={board.title}
              onSave={onRename}
              className="text-base font-semibold"
              inputClassName="text-white placeholder-white/30"
              tag="h2"
            />
          </div>
          {hovered && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Column previews */}
        {board.columns.length > 0 ? (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {board.columns.slice(0, 4).map(col => (
              <span
                key={col.id}
                className="text-xs px-2 py-0.5 rounded-md mono"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', fontSize: '10px', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {col.title}
              </span>
            ))}
            {board.columns.length > 4 && (
              <span className="text-xs px-2 py-0.5 rounded-md mono" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>
                +{board.columns.length - 4}
              </span>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <span className="text-xs mono" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>Sem colunas</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="mono" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '0.1em' }}>COLUNAS</span>
              <span className="text-lg font-bold mono leading-none" style={{ color: accentColor }}>{board.columns.length}</span>
            </div>
            <div className="w-px h-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="flex flex-col gap-0.5">
              <span className="mono" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', letterSpacing: '0.1em' }}>CARTÕES</span>
              <span className="text-lg font-bold mono leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>{totalCards}</span>
            </div>
          </div>
          <div
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{
              color: hovered ? '#050b18' : accentColor,
              background: hovered ? accentColor : `${accentColor}18`,
              border: `1px solid ${accentColor}40`,
              fontSize: '11px',
            }}
          >
            Abrir →
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardList;
