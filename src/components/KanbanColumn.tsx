import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import type { Column, Card } from '../types';
import KanbanCard from './KanbanCard';
import InlineEdit from './InlineEdit';

interface Props {
  column: Column;
  index: number;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onOpenCard: (cardId: string, columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

const COLUMN_ACCENT = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const KanbanColumn: React.FC<Props> = ({ column, index, onAddCard, onDeleteCard, onOpenCard, onRenameColumn, onDeleteColumn }) => {
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({ id: `col-${column.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleAddCard = () => {
    const title = newCardTitle.trim();
    if (title) {
      onAddCard(column.id, title);
      setNewCardTitle('');
      setAddingCard(false);
    }
  };

  return (
    <div
      ref={setSortableRef}
      style={{
        ...style,
        background: '#131720',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: `3px solid ${COLUMN_ACCENT[index % COLUMN_ACCENT.length]}`,
      }}
      className="flex-shrink-0 w-72 flex flex-col rounded-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-1 min-w-0 flex items-center gap-2"
        >
          <span
            className="text-xs font-bold mono flex-shrink-0"
            style={{ color: COLUMN_ACCENT[index % COLUMN_ACCENT.length] }}
          >
            {index + 1}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
          <InlineEdit
            value={column.title}
            onSave={v => onRenameColumn(column.id, v)}
            className="font-semibold text-sm block w-full"
            textColor="rgba(226,232,240,0.9)"
            tag="h3"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(148,163,184,0.8)',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {column.cards.length}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-6 h-6 rounded flex items-center justify-center text-base leading-none transition-colors"
              style={{ color: showMenu ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = showMenu ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)')}
            >
              ···
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-7 rounded-lg z-10 min-w-36 py-1"
                style={{ background: '#1e2333', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              >
                <button
                  onClick={() => { onDeleteColumn(column.id); setShowMenu(false); }}
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{ color: '#f87171' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Excluir coluna
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div ref={setDroppableRef} className="flex-1 px-2 py-2 flex flex-col gap-2 min-h-4">
        <SortableContext items={column.cards.map((c: Card) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card: Card) => (
            <KanbanCard
              key={card.id}
              card={card}
              columnId={column.id}
              onOpen={onOpenCard}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      {addingCard ? (
        <div className="px-2 pb-2 flex flex-col gap-2">
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={e => setNewCardTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard(); }
              if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
            }}
            placeholder="Título do cartão..."
            className="w-full rounded-lg p-2.5 text-sm resize-none outline-none"
            style={{
              background: '#1e2333',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(226,232,240,0.9)',
            }}
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddCard}
              className="flex-1 text-sm py-1.5 rounded-lg font-semibold transition-colors"
              style={{ background: COLUMN_ACCENT[index % COLUMN_ACCENT.length], color: '#0f1117' }}
            >
              Adicionar
            </button>
            <button
              onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
              className="text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(148,163,184,0.5)' }}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCard(true)}
          className="mx-2 mb-2 flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all"
          style={{ color: 'rgba(148,163,184,0.4)', border: '1px dashed rgba(255,255,255,0.07)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(148,163,184,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span className="text-base leading-none">+</span>
          <span>Adicionar cartão</span>
        </button>
      )}
    </div>
  );
};

export default KanbanColumn;
