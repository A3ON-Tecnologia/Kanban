import type { Board } from './types';

// Em produção usa URL relativa; em dev aponta para o servidor local
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8687/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('kanban_token');
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthUser { id: string; username: string; role: 'admin' | 'user'; }

export async function login(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao fazer login');
  }
  return res.json();
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Sessão expirada');
  return res.json();
}

// ── Boards ────────────────────────────────────────────────────
export async function loadBoards(): Promise<Board[]> {
  const res = await fetch(`${API_URL}/boards`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Erro ao carregar quadros: ${res.statusText}`);
  return res.json();
}

export async function createBoard(board: Board): Promise<void> {
  const res = await fetch(`${API_URL}/boards`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(board),
  });
  if (!res.ok) throw new Error(`Erro ao criar quadro: ${res.statusText}`);
}

export async function saveBoard(board: Board): Promise<void> {
  const res = await fetch(`${API_URL}/boards/${board.id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(board),
  });
  if (!res.ok) throw new Error(`Erro ao salvar quadro: ${res.statusText}`);
}

export async function deleteBoard(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/boards/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Erro ao excluir quadro: ${res.statusText}`);
}

// ── Users (admin) ─────────────────────────────────────────────
export interface UserRecord { id: string; username: string; role: 'admin' | 'user'; created_at: string; }

export async function listUsers(): Promise<UserRecord[]> {
  const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Erro ao listar usuários');
  return res.json();
}

export async function createUser(data: { username: string; password: string; role: 'admin' | 'user' }): Promise<UserRecord> {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao criar usuário');
  return json;
}

export async function updateUser(id: string, data: { username: string; password?: string; role: 'admin' | 'user' }): Promise<void> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao atualizar usuário');
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Erro ao excluir usuário');
}

export async function getUserBoards(userId: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/users/${userId}/boards`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Erro ao carregar permissões');
  return res.json();
}

export async function setUserBoards(userId: string, boardIds: string[]): Promise<void> {
  const res = await fetch(`${API_URL}/users/${userId}/boards`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify({ boardIds }),
  });
  if (!res.ok) throw new Error('Erro ao salvar permissões');
}

