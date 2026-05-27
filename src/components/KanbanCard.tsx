import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../types';

interface Props {
  card: CardType;
  columnId: string;
  onOpen: (cardId: string, columnId: string) => void;
  onDelete: (cardId: string, columnId: string) => void;
}

const COLOR_BAR: Record<string, string> = {
  '#f87171': '#f87171',
  '#fb923c': '#fb923c',
  '#facc15': '#facc15',
  '#4ade80': '#4ade80',
  '#60a5fa': '#60a5fa',
  '#c084fc': '#c084fc',
  '#f472b6': '#f472b6',
  '#94a3b8': '#94a3b8',
};

const PRIORITY_MAP = {
  baixa: { label: 'Baixa',  color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  border: 'rgba(74,222,128,0.3)' },
  media: { label: 'Média',  color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.3)' },
  alta:  { label: 'Alta',   color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)' },
};

function formatDueDate(dueDate: string): { text: string; overdue: boolean } {
  if (!dueDate) return { text: '', overdue: false };
  const due = new Date(dueDate);
  const now = new Date();
  const overdue = due < now;
  const day   = String(due.getDate()).padStart(2, '0');
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const hour  = String(due.getHours()).padStart(2, '0');
  const min   = String(due.getMinutes()).padStart(2, '0');
  return { text: `${day}/${month} ${hour}:${min}`, overdue };
}

const KanbanCard: React.FC<Props> = ({ card, columnId, onOpen, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId },
  });

  const [hovered, setHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const doneCount = card.checklist.filter(i => i.done).length;
  const totalCount = card.checklist.length;
  const colorBar = COLOR_BAR[card.color] || null;
  const priorityInfo = card.priority ? PRIORITY_MAP[card.priority] : null;
  const due = card.dueDate ? formatDueDate(card.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: hovered ? '#1e2333' : '#181d2a',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: colorBar ? `3px solid ${colorBar}` : '3px solid rgba(255,255,255,0.1)',
        transition: 'background 0.15s ease',
        opacity: isDragging ? 0.35 : 1,
      }}
      className="rounded-xl cursor-pointer select-none overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(card.id, columnId)}
    >
      <div className="p-3 flex flex-col gap-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div
            {...attributes}
            {...listeners}
            className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
            onClick={() => onOpen(card.id, columnId)}
          >
            <p className="text-sm font-semibold leading-snug break-words" style={{ color: '#e2e8f0' }}>
              {card.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            {card.alertMinutes > 0 && (
              <span
                title="Alerta configurado"
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#fbbf24',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
            {hovered && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(card.id, columnId); }}
                className="w-5 h-5 rounded flex items-center justify-center text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)', background: 'transparent' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}
                title="Excluir cartão"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Priority badge */}
        {priorityInfo && (
          <div>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded font-medium"
              style={{
                color: priorityInfo.color,
                background: priorityInfo.bg,
                border: `1px solid ${priorityInfo.border}`,
                fontSize: '11px',
                letterSpacing: '0.01em',
              }}
            >
              {priorityInfo.label}
            </span>
          </div>
        )}

        {/* Description */}
        {card.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(148,163,184,0.7)' }}>
            {card.description}
          </p>
        )}

        {/* Checklist progress */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(doneCount / totalCount) * 100}%`,
                  background: doneCount === totalCount ? '#4ade80' : '#60a5fa',
                }}
              />
            </div>
            <span style={{ color: 'rgba(148,163,184,0.5)', fontSize: '10px' }}>
              {doneCount}/{totalCount}
            </span>
          </div>
        )}

        {/* Due date */}
        {due && (
          <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke={due.overdue ? '#f87171' : 'rgba(148,163,184,0.45)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: '11px', color: due.overdue ? '#f87171' : 'rgba(148,163,184,0.55)' }}>
              {due.text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
