export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
}

export type Priority = 'baixa' | 'media' | 'alta' | '';

export interface Card {
  id: string;
  title: string;
  description: string;
  color: string;
  checklist: Checklist[];
  comments: Comment[];
  createdAt: string;
  createdBy?: string;
  priority: Priority;
  dueDate: string;       // datetime-local string or ''
  alertMinutes: number;  // minutes before due date
  notifyByEmail?: boolean;
}

export interface Column {
  id: string;
  title: string;
  color?: string;
  color2?: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  createdBy?: string;
}
