import type { Board } from './types';
import { v4 as uuidv4 } from 'uuid';

const BOARDS_KEY = 'kanban-boards';
const LEGACY_KEY = 'kanban-board';

function makeDefaultBoard(): Board {
  return {
    id: uuidv4(),
    title: 'Meu Quadro Kanban',
    columns: [
      {
        id: uuidv4(),
        title: 'A Fazer',
        cards: [
          {
            id: uuidv4(),
            title: 'Planejar o projeto',
            description: 'Definir escopo e objetivos do projeto.',
            color: '#f87171',
            checklist: [
              { id: uuidv4(), title: 'Checklist', items: [
                { id: uuidv4(), text: 'Reunião de kickoff', done: false },
                { id: uuidv4(), text: 'Definir stakeholders', done: false },
              ]},
            ],
            comments: [],
            createdAt: new Date().toISOString(),
            priority: 'alta',
            dueDate: '',
            alertMinutes: 30,
          },
        ],
      },
      {
        id: uuidv4(),
        title: 'Em Progresso',
        cards: [
          {
            id: uuidv4(),
            title: 'Desenvolver protótipo',
            description: 'Criar protótipo de alta fidelidade no Figma.',
            color: '#fb923c',
            checklist: [
              { id: uuidv4(), title: 'Checklist', items: [
                { id: uuidv4(), text: 'Wireframes', done: true },
                { id: uuidv4(), text: 'Design final', done: false },
              ]},
            ],
            comments: [],
            createdAt: new Date().toISOString(),
            priority: 'media',
            dueDate: '',
            alertMinutes: 30,
          },
        ],
      },
      {
        id: uuidv4(),
        title: 'Concluído',
        cards: [
          {
            id: uuidv4(),
            title: 'Levantamento de requisitos',
            description: 'Entrevistas com usuários e documentação.',
            color: '#4ade80',
            checklist: [
              { id: uuidv4(), title: 'Checklist', items: [
                { id: uuidv4(), text: 'Entrevistas', done: true },
                { id: uuidv4(), text: 'Documentação', done: true },
              ]},
            ],
            comments: [],
            createdAt: new Date().toISOString(),
            priority: 'baixa',
            dueDate: '',
            alertMinutes: 30,
          },
        ],
      },
    ],
  };
}

function migrateCard(card: Record<string, unknown>): Record<string, unknown> {
  const migrated: Record<string, unknown> = {
    priority: '',
    dueDate: '',
    alertMinutes: 30,
    comments: [],
    ...card,
  };

  // Migrate old checklist format: ChecklistItem[] → Checklist[]
  if (Array.isArray(migrated.checklist)) {
    const first = (migrated.checklist as Record<string, unknown>[])[0];
    if (first && !('items' in first)) {
      migrated.checklist = [{ id: uuidv4(), title: 'Checklist', items: migrated.checklist }];
    }
  } else {
    migrated.checklist = [];
  }

  return migrated;
}

function migrateBoard(board: Board): Board {
  return {
    ...board,
    columns: board.columns.map(col => ({
      ...col,
      cards: col.cards.map(c => migrateCard(c as unknown as Record<string, unknown>) as unknown as typeof c),
    })),
  };
}

export function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem(BOARDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Board[];
      return parsed.map(migrateBoard);
    }
  } catch { /* ignore */ }

  // Migrate legacy single-board format
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Board;
      const boards = [migrateBoard(parsed)];
      saveBoards(boards);
      return boards;
    }
  } catch { /* ignore */ }

  const boards = [makeDefaultBoard()];
  saveBoards(boards);
  return boards;
}

export function saveBoards(boards: Board[]): void {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function saveBoard(board: Board): void {
  const boards = loadBoards();
  const idx = boards.findIndex(b => b.id === board.id);
  if (idx >= 0) {
    boards[idx] = board;
  } else {
    boards.push(board);
  }
  saveBoards(boards);
}

// Keep for backward compatibility
export function loadBoard(): Board {
  return loadBoards()[0];
}
