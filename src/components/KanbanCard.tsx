import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType } from '../types';
import ConfirmModal from './ConfirmModal';

interface Props {
  card: CardType;
  columnId: string;
  accentColor?: string;
  onOpen: (cardId: string, columnId: string) => void;
  onDelete: (cardId: string, columnId: string) => void;
  currentUserId?: string;
}


const PRIORITY_DOT: Record<string, string> = {
  baixa: '#4ade80',
  media: '#facc15',
  alta:  '#f87171',
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

const KanbanCard: React.FC<Props> = ({ card, columnId, accentColor = '#07d963', onOpen, onDelete, currentUserId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId },
  });

  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const priorityDot = card.priority ? PRIORITY_DOT[card.priority] : null;
  const due = card.dueDate ? formatDueDate(card.dueDate) : null;
  const doneCount = card.checklist.filter(i => i.done).length;
  const totalCount = card.checklist.length;

  // Build transform string — add rotate+scale when dragging
  const baseTransform = CSS.Transform.toString(transform);
  const cardTransform = isDragging && baseTransform
    ? `${baseTransform} rotate(1deg)`
    : baseTransform ?? undefined;

  return (
    <>
    <div
      ref={setNodeRef}
      style={{
        transform: cardTransform,
        transition: isDragging ? 'none' : transition,
        background: 'var(--bg-surface)',
        borderTop: `1px solid ${isDragging ? 'var(--accent-focus)' : hovered ? 'var(--accent-glow-hover)' : 'var(--border)'}`,
        borderRight: `1px solid ${isDragging ? 'var(--accent-focus)' : hovered ? 'var(--accent-glow-hover)' : 'var(--border)'}`,
        borderBottom: `1px solid ${isDragging ? 'var(--accent-focus)' : hovered ? 'var(--accent-glow-hover)' : 'var(--border)'}`,
        borderLeft: card.color ? `3px solid ${card.color}` : `3px solid ${isDragging ? 'var(--accent-focus)' : 'var(--border)'}`,
        boxShadow: isDragging
          ? '0 0 20px var(--accent-glow), var(--shadow-modal)'
          : hovered ? 'var(--shadow-hover)' : 'var(--shadow-card)',
        opacity: isDragging ? 0.9 : 1,
      }}
      className={`rounded-xl cursor-pointer select-none overflow-hidden${card.color ? ' kanban-card-has-color' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(card.id, columnId)}
      data-color={card.color || undefined}
    >
      <div className="p-4 flex flex-col gap-2.5">
        {/* Header: title + priority dot */}
        <div className="flex items-start justify-between gap-1">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex flex-col justify-center items-center mr-2 cursor-grab active:cursor-grabbing select-none px-0.5 py-1 rounded opacity-40 hover:opacity-80 transition-opacity"
            style={{ touchAction: 'none' }}
            title="Arrastar cartão"
            onClick={e => e.stopPropagation()}
          >
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#888', display: 'block' }} />
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#888', display: 'block' }} />
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#888', display: 'block' }} />
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#888', display: 'block' }} />
            </span>
            <span style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#888', display: 'block' }} />
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#888', display: 'block' }} />
            </span>
          </div>
          <div className="flex-1 min-w-0" onClick={() => onOpen(card.id, columnId)}>
            <h3 className="text-xs font-semibold leading-tight line-clamp-1" style={{ color: 'var(--text-primary)' }}>
              {card.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
            {card.alertMinutes > 0 && card.dueDate && (
              <span title="Alerta configurado" style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', flexShrink: 0 }} />
            )}
            {priorityDot && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: priorityDot, display: 'inline-block', flexShrink: 0 }} />
            )}
            {hovered && (!card.createdBy || card.createdBy === currentUserId) && (
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                className="w-5 h-5 rounded flex items-center justify-center text-xs transition-colors"
                style={{ color: 'var(--text-faint)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'var(--danger-subtle)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.background = 'transparent'; }}
                title="Excluir cartão"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--text-muted)' }}>
            {card.description}
          </p>
        )}

        {/* Due date */}
        {due && (
          <div className="flex items-center gap-1" style={{ color: due.overdue ? '#f87171' : '#7a7f8c' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke={due.overdue ? '#f87171' : 'var(--text-muted)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: '11px', color: due.overdue ? '#f87171' : 'var(--text-muted)' }}>{due.text}</span>
          </div>
        )}

        {/* Checklist progress */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${accentColor}66` }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(doneCount / totalCount) * 100}%`,
                  background: doneCount === totalCount ? '#4ade80' : accentColor,
                }}
              />
            </div>
            <span style={{ color: 'var(--text-body)', fontSize: '10px', fontWeight: 500 }}>{doneCount}/{totalCount}</span>
          </div>
        )}
      </div>
    </div>
      {confirmDelete && (
        <ConfirmModal
          title="Excluir cartão?"
          detail='Esta ação não pode ser desfeita.'
          onConfirm={() => { onDelete(card.id, columnId); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
};

export default KanbanCard;
