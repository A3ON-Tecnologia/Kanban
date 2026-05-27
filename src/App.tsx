import './index.css'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadBoards, loadMyBoards, saveBoard, createBoard as apiCreateBoard, deleteBoard as apiDeleteBoard } from './api'
import type { Board } from './types'
import KanbanBoard from './components/KanbanBoard'
import BoardList from './components/BoardList'
import LoginPage from './components/LoginPage'
import UserManagement from './components/UserManagement'
import { useAuth } from './context/AuthContext'

function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [myBoards, setMyBoards] = useState<Board[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUserMgmt, setShowUserMgmt] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([loadBoards(), loadMyBoards()])
      .then(([all, mine]) => { setBoards(all); setMyBoards(mine); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [user])

  const selectedBoard = boards.find(b => b.id === selectedId) ?? null

  const handleCreate = async (title: string) => {
    const newBoard: Board = { id: uuidv4(), title, columns: [], createdBy: user?.id }
    await apiCreateBoard(newBoard)
    setBoards(prev => [...prev, newBoard])
    setMyBoards(prev => [...prev, newBoard])
    setSelectedId(newBoard.id)
  }

  const handleDelete = async (id: string) => {
    await apiDeleteBoard(id)
    setBoards(prev => prev.filter(b => b.id !== id))
    setMyBoards(prev => prev.filter(b => b.id !== id))
  }

  const handleRename = async (id: string, title: string) => {
    const updated = boards.map(b => b.id === id ? { ...b, title } : b)
    const board = updated.find(b => b.id === id)!
    await saveBoard(board)
    setBoards(updated)
    setMyBoards(prev => prev.map(b => b.id === id ? { ...b, title } : b))
  }

  const handleBoardChange = async (board: Board) => {
    await saveBoard(board)
    setBoards(prev => prev.map(b => b.id === board.id ? board : b))
    setMyBoards(prev => prev.map(b => b.id === board.id ? board : b))
  }

  // Aguardando verificação do token
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f16' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(7,217,99,0.15)', border: '1px solid rgba(7,217,99,0.25)' }}>
            <span className="font-bold" style={{ color: '#07d963' }}>K</span>
          </div>
          <p className="text-sm" style={{ color: '#7a7f8c' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado → login
  if (!user) return <LoginPage />

  // Gerenciamento de usuários (admin)
  if (showUserMgmt) {
    return <UserManagement boards={boards} onBack={() => setShowUserMgmt(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f16' }}>
        <p className="text-sm" style={{ color: '#7a7f8c' }}>Carregando quadros...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0f16' }}>
        <div className="rounded-xl p-8 max-w-md w-full mx-4 text-center"
          style={{ background: '#171a27', border: '1px solid rgba(248,113,113,0.3)' }}>
          <p className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>Erro de conexão</p>
          <p className="text-sm mb-4" style={{ color: '#7a7f8c' }}>{error}</p>
          <button onClick={() => { setError(null); setLoading(true); loadBoards().then(setBoards).catch(e => setError(e.message)).finally(() => setLoading(false)) }}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: 'rgba(7,217,99,0.1)', color: '#07d963', border: '1px solid rgba(7,217,99,0.2)' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (selectedBoard) {
    return (
      <KanbanBoard
        initialBoard={selectedBoard}
        boards={myBoards}
        onBack={() => setSelectedId(null)}
        onSelectBoard={setSelectedId}
        onBoardChange={handleBoardChange}
      />
    )
  }

  return (
    <BoardList
      boards={boards}
      onSelect={setSelectedId}
      onCreate={handleCreate}
      onDelete={handleDelete}
      onRename={handleRename}
      user={user}
      onSignOut={signOut}
      onManageUsers={user.role === 'admin' ? () => setShowUserMgmt(true) : undefined}
    />
  )
}

export default App
