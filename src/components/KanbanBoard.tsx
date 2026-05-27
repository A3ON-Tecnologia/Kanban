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
  boards?: Board[];
  onBack?: () => void;
  onSelectBoard?: (id: string) => void;
  onBoardChange?: (board: Board) => void | Promise<void>;
}

const KanbanBoard: React.FC<Props> = ({ initialBoard, boards, onBack, onSelectBoard, onBoardChange }) => {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [board, setBoard] = useState<Board>(initialBoard);
  const [activeCard, setActiveCard] = useState<{ card: Card; columnId: string } | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{ cardId: string; columnId: string } | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#22c55e');
  const [newColumnColor2, setNewColumnColor2] = useState('#3b82f6');

  const COLUMN_ACCENT = ['#22c55e', '#3b82f6', '#f59e0b', '#facc15', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#ffffff'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Sync initialBoard prop to board state
  React.useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

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
      columns: [...board.columns, { id: uuidv4(), title, color: newColumnColor, color2: newColumnColor2, cards: [] }],
    };
    persist(newBoard);
    setNewColumnTitle('');
    setNewColumnColor('#22c55e');
    setNewColumnColor2('#3b82f6');
    setAddingColumn(false);
  };

  const recolorColumn = (columnId: string, color: string, color2: string) => {
    persist({
      ...board,
      columns: board.columns.map(c => c.id === columnId ? { ...c, color, color2 } : c),
    });
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
      comments: [],
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
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0f16' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #2b2e3a', background: 'rgba(13,15,22,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2b2e3a', color: '#7a7f8c' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#3a3f52'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7a7f8c'; e.currentTarget.style.borderColor = '#2b2e3a'; }}
              title="Voltar aos quadros"
            >
              ←
            </button>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(7,217,99,0.15)', border: '1px solid rgba(7,217,99,0.25)' }}>
            <span className="text-sm font-bold" style={{ color: '#07d963' }}>K</span>
          </div>
          <div className="flex-shrink-0">
            <InlineEdit
              value={board.title}
              onSave={v => persist({ ...board, title: v })}
              className="font-semibold leading-tight"
              inputClassName="text-white placeholder-white/30"
              tag="h1"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', color: '#e2e8f0' }}
            />
            <p style={{ fontSize: '11.5px', color: '#7a7f8c', marginTop: '1px' }}>
              {totalCards} {totalCards === 1 ? 'tarefa' : 'tarefas'} · {board.columns.length} {board.columns.length === 1 ? 'coluna' : 'colunas'}
            </p>
          </div>
          {/* Board switcher */}
          {boards && boards.length > 1 && onSelectBoard && (() => {
            const others = boards.filter(b => b.id !== board.id);
            const MAX = 4;
            const visible = others.slice(0, MAX);
            const overflow = others.slice(MAX);
            return (
              <div className="flex items-center gap-1.5 pl-2" style={{ borderLeft: '1px solid #2b2e3a' }}>
                {visible.map(b => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBoard(b.id)}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-all flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2b2e3a', color: '#a0a5b4', maxWidth: '130px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#3a3f52'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a0a5b4'; e.currentTarget.style.borderColor = '#2b2e3a'; }}
                    title={b.title}
                  >
                    <span className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(7,217,99,0.15)', color: '#07d963' }}>
                      {b.title.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate" style={{ maxWidth: '80px', fontSize: '12px', fontFamily: "'Playfair Display', serif" }}>{b.title}</span>
                  </button>
                ))}
                {overflow.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setSwitcherOpen(o => !o)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-all flex-shrink-0"
                      style={{ background: switcherOpen ? 'rgba(7,217,99,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${switcherOpen ? 'rgba(7,217,99,0.3)' : '#2b2e3a'}`, color: switcherOpen ? '#07d963' : '#a0a5b4' }}
                      onMouseEnter={e => { if (!switcherOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e2e8f0'; } }}
                      onMouseLeave={e => { if (!switcherOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a0a5b4'; } }}
                    >
                      <span style={{ fontSize: '12px' }}>+{overflow.length}</span>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" style={{ marginTop: '1px' }}>
                        <path d="M6 8.5L1.5 4h9L6 8.5z"/>
                      </svg>
                    </button>
                    {switcherOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                        <div
                          className="absolute left-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
                          style={{ background: '#171a27', border: '1px solid #2b2e3a', minWidth: '200px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                        >
                          {overflow.map(b => (
                            <button
                              key={b.id}
                              onClick={() => { setSwitcherOpen(false); onSelectBoard(b.id); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                              style={{ color: '#e2e8f0' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: 'rgba(7,217,99,0.12)', color: '#07d963' }}>
                                {b.title.charAt(0).toUpperCase()}
                              </span>
                              <span className="text-sm truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{b.title}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddingColumn(true)}
            className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
            style={{ background: 'rgba(7,217,99,0.12)', color: '#07d963', border: '1px solid rgba(7,217,99,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(7,217,99,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(7,217,99,0.12)'; }}
          >
            <span className="text-base leading-none font-light">+</span>
            Nova coluna
          </button>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 p-6 overflow-x-auto">
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
              {board.columns.map((col: Column, colIndex: number) => (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  index={colIndex}
                  onAddCard={addCard}
                  onDeleteCard={deleteCard}
                  onOpenCard={(cardId, columnId) => setModalState({ cardId, columnId })}
                  onRenameColumn={renameColumn}
                  onDeleteColumn={deleteColumn}
                  onRecolorColumn={recolorColumn}
                />
              ))}

              {/* Add column */}
              {addingColumn && (
                <div className="flex-shrink-0 w-[300px] rounded-xl p-3 flex flex-col gap-2" style={{ background: '#1b1e2f', border: '1px solid rgba(7,217,99,0.3)' }}>
                  <input
                    autoFocus
                    value={newColumnTitle}
                    onChange={e => setNewColumnTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addColumn();
                      if (e.key === 'Escape') { setAddingColumn(false); setNewColumnTitle(''); }
                    }}
                    placeholder="Nome da coluna..."
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'transparent', border: 'none', color: '#e2e8f0' }}
                  />
                  {/* Color swatches */}
                  <div className="flex flex-col gap-1.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 10, color: '#7a7f8c', width: 28, flexShrink: 0 }}>Início</span>
                      {COLUMN_ACCENT.map(c => (
                        <button key={c} onClick={() => setNewColumnColor(c)}
                          className="w-5 h-5 rounded-full flex-shrink-0 transition-transform"
                          style={{ background: c, outline: newColumnColor === c ? `2px solid ${c === '#ffffff' ? '#aaa' : c}` : 'none', outlineOffset: 2, transform: newColumnColor === c ? 'scale(1.25)' : 'scale(1)', border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 10, color: '#7a7f8c', width: 28, flexShrink: 0 }}>Fim</span>
                      {COLUMN_ACCENT.map(c => (
                        <button key={c} onClick={() => setNewColumnColor2(c)}
                          className="w-5 h-5 rounded-full flex-shrink-0 transition-transform"
                          style={{ background: c, outline: newColumnColor2 === c ? `2px solid ${c === '#ffffff' ? '#aaa' : c}` : 'none', outlineOffset: 2, transform: newColumnColor2 === c ? 'scale(1.25)' : 'scale(1)', border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none' }}
                        />
                      ))}
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: `linear-gradient(to right, ${newColumnColor}, ${newColumnColor2})` }} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addColumn}
                      className="flex-1 text-xs py-1.5 rounded-md font-semibold transition-colors"
                      style={{ background: '#07d963', color: '#0d0f16' }}
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={() => { setAddingColumn(false); setNewColumnTitle(''); }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-md transition-colors"
                      style={{ background: '#242838', color: '#7a7f8c' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SortableContext>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeCard && (
              <div className="rotate-1 scale-103 opacity-90">
                <KanbanCard
                  card={activeCard.card}
                  columnId={activeCard.columnId}
                  onOpen={() => {}}
                  onDelete={() => {}}
                />
              </div>
            )}
            {activeOverlayColumn && (
              <div className="rotate-1 w-[300px] h-24 rounded-xl" style={{ background: 'rgba(7,217,99,0.04)', border: '1px solid rgba(7,217,99,0.15)' }} />
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

export default KanbanBoard;
