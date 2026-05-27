import './index.css'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadBoards, saveBoard, createBoard as apiCreateBoard, deleteBoard as apiDeleteBoard } from './api'
import type { Board } from './types'
import KanbanBoard from './components/KanbanBoard'
import BoardList from './components/BoardList'

function App() {
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBoards()
      .then(setBoards)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const selectedBoard = boards.find(b => b.id === selectedId) ?? null

  const handleCreate = async (title: string) => {
    const newBoard: Board = { id: uuidv4(), title, columns: [] }
    await apiCreateBoard(newBoard)
    setBoards(prev => [...prev, newBoard])
    setSelectedId(newBoard.id)
  }

  const handleDelete = async (id: string) => {
    await apiDeleteBoard(id)
    setBoards(prev => prev.filter(b => b.id !== id))
  }

  const handleRename = async (id: string, title: string) => {
    const updated = boards.map(b => b.id === id ? { ...b, title } : b)
    const board = updated.find(b => b.id === id)!
    await saveBoard(board)
    setBoards(updated)
  }

  const handleBoardChange = async (board: Board) => {
    await saveBoard(board)
    setBoards(prev => prev.map(b => b.id === board.id ? board : b))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg" style={{ background: 'linear-gradient(135deg, #050b18 0%, #0a0f2e 50%, #050b18 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)' }}>
            <span className="text-white font-bold">K</span>
          </div>
          <p className="text-sm mono" style={{ color: 'rgba(34,211,238,0.6)' }}>Conectando ao banco de dados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg" style={{ background: 'linear-gradient(135deg, #050b18 0%, #0a0f2e 50%, #050b18 100%)' }}>
        <div className="rounded-2xl p-8 max-w-md w-full mx-4 text-center" style={{ background: 'rgba(8,15,35,0.9)', border: '1px solid rgba(248,113,113,0.3)' }}>
          <p className="text-lg font-semibold text-white mb-2">Erro de conexão</p>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
          <p className="text-xs mono" style={{ color: 'rgba(248,113,113,0.7)' }}>
            Verifique se o servidor API está rodando em http://localhost:3001
          </p>
          <button
            onClick={() => { setError(null); setLoading(true); loadBoards().then(setBoards).catch(e => setError(e.message)).finally(() => setLoading(false)) }}
            className="mt-4 px-4 py-2 rounded-lg text-sm"
            style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.3)' }}
          >
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
        onBack={() => setSelectedId(null)}
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
    />
  )
}

export default App
