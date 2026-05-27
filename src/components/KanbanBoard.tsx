import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import type { Board, Card, Column } from '../types';
import { saveBoard } from '../storage';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import CardModal from './CardModal';
import InlineEdit from './InlineEdit';

interface Props {
  initialBoard: Board;
  onBack?: () => void;
  onBoardChange?: (board: Board) => void | Promise<void>;
}

const KanbanBoard: React.FC<Props> = ({ initialBoard, onBack, onBoardChange }) => {
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeCard, setActiveCard] = useState<{ card: Card; columnId: string } | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ cardId: string; columnId: string } | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const persist = useCallback((b: Board) => {
    setBoard(b);
    saveBoard(b);
    onBoardChange?.(b);
  }, [onBoardChange]);

  // ── Column operations ────────────────────────────────────────
  const addColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    const newBoard: Board = {
      ...board,
      columns: [...board.columns, { id: uuidv4(), title, cards: [] }],
    };
    persist(newBoard);
    setNewColumnTitle('');
    setAddingColumn(false);
  };

  const renameColumn = (columnId: string, title: string) => {
    persist({
      ...board,
      columns: board.columns.map(c => c.id === columnId ? { ...c, title } : c),
    });
  };

  const deleteColumn = (columnId: string) => {
    persist({ ...board, columns: board.columns.filter(c => c.id !== columnId) });
  };

  // ── Card operations ──────────────────────────────────────────
  const addCard = (columnId: string, title: string) => {
    const newCard: Card = {
      id: uuidv4(),
      title,
      description: '',
      color: '',
      checklist: [],
      createdAt: new Date().toISOString(),
      priority: '',
      dueDate: '',
      alertMinutes: 30,
    };
    persist({
      ...board,
      columns: board.columns.map(c =>
        c.id === columnId ? { ...c, cards: [...c.cards, newCard] } : c
      ),
    });
  };

  const deleteCard = (columnId: string, cardId: string) => {
    persist({
      ...board,
      columns: board.columns.map(c =>
        c.id === columnId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c
      ),
    });
  };

  const saveCard = (updatedCard: Card, columnId: string) => {
    persist({
      ...board,
      columns: board.columns.map(c =>
        c.id === columnId
          ? { ...c, cards: c.cards.map(card => card.id === updatedCard.id ? updatedCard : card) }
          : c
      ),
    });
  };

  // ── Drag & Drop ──────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'card') {
      const colId = active.data.current?.columnId as string;
      const col = board.columns.find(c => c.id === colId);
      const card = col?.cards.find(card => card.id === active.id);
      if (card) setActiveCard({ card, columnId: colId });
    } else if (type === 'column') {
      setActiveColumnId(active.id as string);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    if (activeType !== 'card') return;

    const activeColId = active.data.current?.columnId as string;
    let overColId: string | null = null;

    // over another card?
    if (over.data.current?.type === 'card') {
      overColId = over.data.current?.columnId as string;
    }
    // over a column droppable zone?
    if (over.id.toString().startsWith('col-')) {
      overColId = over.id.toString().replace('col-', '');
    }

    if (!overColId || activeColId === overColId) return;

    // Move card across columns
    setBoard(prev => {
      const srcCol = prev.columns.find(c => c.id === activeColId);
      const dstCol = prev.columns.find(c => c.id === overColId);
      if (!srcCol || !dstCol) return prev;

      const card = srcCol.cards.find(c => c.id === active.id);
      if (!card) return prev;

      const newColumns = prev.columns.map(col => {
        if (col.id === activeColId) return { ...col, cards: col.cards.filter(c => c.id !== active.id) };
        if (col.id === overColId) return { ...col, cards: [...col.cards, { ...card }] };
        return col;
      });

      // Update active card's column tracking
      if (active.data.current) {
        active.data.current.columnId = overColId;
      }

      return { ...prev, columns: newColumns };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumnId(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    // Reorder columns
    if (activeType === 'column') {
      const oldIndex = board.columns.findIndex(c => c.id === active.id);
      const newIndex = board.columns.findIndex(c => c.id === over.id);
      if (oldIndex !== newIndex) {
        persist({ ...board, columns: arrayMove(board.columns, oldIndex, newIndex) });
      }
      return;
    }

    // Reorder cards within same column
    if (activeType === 'card') {
      const colId = active.data.current?.columnId as string;
      const col = board.columns.find(c => c.id === colId);
      if (!col) return;

      const oldIndex = col.cards.findIndex(c => c.id === active.id);
      const newIndex = col.cards.findIndex(c => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newCols = board.columns.map(c =>
          c.id === colId ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) } : c
        );
        persist({ ...board, columns: newCols });
      }
    }
  };

  const modalCard = modalState
    ? board.columns
        .find(c => c.id === modalState.columnId)
        ?.cards.find(card => card.id === modalState.cardId)
    : null;

  const activeOverlayColumn = activeColumnId
    ? board.columns.find(c => c.id === activeColumnId)
    : null;

  const totalCards = board.columns.reduce((acc, c) => acc + c.cards.length, 0);

  return (
    <div className="min-h-screen flex flex-col grid-bg" style={{ background: 'linear-gradient(135deg, #050b18 0%, #0a0f2e 50%, #050b18 100%)' }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(99,179,237,0.1)' }}>
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#22d3ee'; e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              title="Voltar aos quadros"
            >
              ←
            </button>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', boxShadow: '0 0 20px rgba(34,211,238,0.4)' }}>
            <span className="text-white text-sm font-bold">K</span>
          </div>
          <InlineEdit
            value={board.title}
            onSave={v => persist({ ...board, title: v })}
            className="text-xl font-semibold tracking-tight"
            inputClassName="text-white placeholder-white/30"
            tag="h1"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <Stat label="COLUNAS" value={board.columns.length} color="#22d3ee" />
            <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <Stat label="CARTÕES" value={totalCards} color="#8b5cf6" />
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="relative z-10 flex-1 px-8 py-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={board.columns.map(c => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-5 items-start min-w-max pb-4">
              {board.columns.map((col: Column) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  onAddCard={addCard}
                  onDeleteCard={deleteCard}
                  onOpenCard={(cardId, columnId) => setModalState({ cardId, columnId })}
                  onRenameColumn={renameColumn}
                  onDeleteColumn={deleteColumn}
                />
              ))}

              {/* Add column */}
              {addingColumn ? (
                <div className="flex-shrink-0 w-72 glass rounded-2xl p-4 flex flex-col gap-3 animate-slide-in" style={{ border: '1px solid rgba(34,211,238,0.3)' }}>
                  <input
                    autoFocus
                    value={newColumnTitle}
                    onChange={e => setNewColumnTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addColumn();
                      if (e.key === 'Escape') { setAddingColumn(false); setNewColumnTitle(''); }
                    }}
                    placeholder="Nome da coluna..."
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none text-white placeholder-white/30 mono"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(34,211,238,0.3)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addColumn}
                      className="flex-1 text-sm py-1.5 rounded-lg font-semibold transition-all"
                      style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', color: '#050b18' }}
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => { setAddingColumn(false); setNewColumnTitle(''); }}
                      className="text-sm px-3 py-1.5 rounded-lg transition-colors"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingColumn(true)}
                  className="flex-shrink-0 w-72 glass rounded-2xl py-4 px-5 flex items-center gap-3 transition-all group"
                  style={{ border: '1px dashed rgba(99,179,237,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,179,237,0.2)')}
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)' }}>
                    <span className="text-cyan-400 text-sm leading-none">+</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Nova coluna</span>
                </button>
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeCard && (
              <div className="rotate-2 scale-105" style={{ filter: 'drop-shadow(0 0 20px rgba(34,211,238,0.3))' }}>
                <KanbanCard
                  card={activeCard.card}
                  columnId={activeCard.columnId}
                  onOpen={() => {}}
                  onDelete={() => {}}
                />
              </div>
            )}
            {activeOverlayColumn && (
              <div className="rotate-1 w-72 h-24 rounded-2xl" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.2)' }} />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Card Modal */}
      {modalCard && modalState && (
        <CardModal
          card={modalCard}
          onClose={() => setModalState(null)}
          onSave={updated => saveCard(updated, modalState.columnId)}
          onDelete={() => deleteCard(modalState.columnId, modalState.cardId)}
        />
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-end gap-0.5">
    <span className="text-xs font-semibold mono tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px' }}>{label}</span>
    <span className="text-2xl font-bold mono leading-none" style={{ color }}>{value}</span>
  </div>
);

export default KanbanBoard;
