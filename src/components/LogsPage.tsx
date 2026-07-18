import React, { useState, useEffect } from 'react';
import type { AccessLogRecord, CardLogRecord } from '../api';
import { loadAccessLogs, loadCardLogs } from '../api';
import { ThemeToggle } from '../context/ThemeContext';

interface Props {
  onBack: () => void;
}

type Tab = 'access' | 'cards';

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('pt-BR');
}

const ACTION_LABEL: Record<string, string> = {
  create: 'Criou',
  update: 'Editou',
  delete: 'Excluiu',
};

const ACTION_COLOR: Record<string, string> = {
  create: '#22c55e',
  update: '#3b82f6',
  delete: '#ef4444',
};

const LogsPage: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('access');
  const [access, setAccess] = useState<AccessLogRecord[]>([]);
  const [cards, setCards] = useState<CardLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadAccessLogs(), loadCardLogs()])
      .then(([a, c]) => { setAccess(a); setCards(c); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const count = tab === 'access' ? access.length : cards.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 sm:px-6 py-3 sm:py-4"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
            ←
          </button>
          <div>
            <h1 className="font-semibold" style={{ fontSize: 17, color: 'var(--text-primary)' }}>Logs</h1>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
              {loading ? 'Carregando...' : `${count} registro${count === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-4xl w-full mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([['access', 'Acessos'], ['cards', 'Edições de cards']] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-sm font-medium rounded-lg px-4 py-1.5 transition-colors"
              style={tab === key
                ? { background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', color: '#f87171' }}>
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
        ) : tab === 'access' ? (
          <AccessTable rows={access} />
        ) : (
          <CardsTable rows={cards} />
        )}
      </main>
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-2">
    <span className="text-2xl opacity-40">🗒</span>
    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>
  </div>
);

const AccessTable: React.FC<{ rows: AccessLogRecord[] }> = ({ rows }) => {
  if (!rows.length) return <EmptyState text="Nenhum acesso registrado ainda" />;
  return (
    <div className="flex flex-col gap-2">
      {rows.map(r => (
        <div key={r.id} className="flex items-center flex-wrap gap-x-4 gap-y-1 px-3 sm:px-4 py-3 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-badge)', border: '1px solid var(--accent-badge-border)', color: 'var(--accent)' }}>
            {(r.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[120px]">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.username || 'desconhecido'}</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Entrou no sistema</p>
          </div>
          <div className="text-right">
            <p style={{ fontSize: 12, color: 'var(--text-primary)' }}>{formatDate(r.created_at)}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.ip || '—'}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const CardsTable: React.FC<{ rows: CardLogRecord[] }> = ({ rows }) => {
  if (!rows.length) return <EmptyState text="Nenhuma edição de card registrada ainda" />;
  return (
    <div className="flex flex-col gap-2">
      {rows.map(r => {
        const color = ACTION_COLOR[r.action] || 'var(--text-muted)';
        return (
          <div key={r.id} className="px-3 sm:px-4 py-3 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${color}` }}>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}>
                {ACTION_LABEL[r.action] || r.action}
              </span>
              <span className="text-sm font-medium flex-1 min-w-[120px]" style={{ color: 'var(--text-primary)' }}>
                {r.card_title || '(sem título)'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(r.created_at)}</span>
            </div>
            <div className="flex items-center flex-wrap gap-x-2 mt-1" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              <span>por <strong style={{ color: 'var(--text-primary)' }}>{r.username || 'desconhecido'}</strong></span>
              {r.board_title && <span>· quadro: {r.board_title}</span>}
            </div>
            {r.action === 'update' && r.changes && r.changes.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {r.changes.map((ch, i) => (
                  <li key={i} className="text-xs px-2 py-1 rounded-md"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{ch.campo}:</strong>{' '}
                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{ch.de || '∅'}</span>
                    {' → '}
                    <span style={{ color: 'var(--text-primary)' }}>{ch.para || '∅'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LogsPage;
