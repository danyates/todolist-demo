import { useState, useEffect } from 'react'

const STORAGE_KEY = 'todolist-demo-todos'

const SEED_TODOS = [
  { id: 1, text: 'Read a book', done: false },
  { id: 2, text: 'Go for a walk', done: true },
  { id: 3, text: 'Write some code', done: false },
]

function isValidTodo(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'number' &&
    typeof item.text === 'string' &&
    typeof item.done === 'boolean'
  )
}

function readInitialTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return SEED_TODOS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isValidTodo)) return []
    return parsed
  } catch {
    return []
  }
}

export default function App() {
  const [todos, setTodos] = useState(readInitialTodos)
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('all')

  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editInputEl, setEditInputEl] = useState(null)

  const [deleteUndo, setDeleteUndo] = useState(null)

  useEffect(() => {
    if (editingId !== null && editInputEl) {
      editInputEl.focus()
    }
  }, [editingId, editInputEl])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch {
      /* ignore quota / private mode */
    }
  }, [todos])

  useEffect(() => {
    if (!deleteUndo) return
    const t = window.setTimeout(() => setDeleteUndo(null), 5000)
    return () => window.clearTimeout(t)
  }, [deleteUndo])

  useEffect(() => {
    if (!deleteUndo) return
    const snapshot = deleteUndo
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        setTodos((prev) => {
          const next = [...prev]
          const at = Math.min(Math.max(0, snapshot.index), next.length)
          next.splice(at, 0, snapshot.todo)
          return next
        })
        setDeleteUndo(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [deleteUndo])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos([...todos, { id: Date.now(), text, done: false }])
    setInput('')
  }

  const toggleTodo = (id) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const undoDelete = () => {
    if (!deleteUndo) return
    const { todo, index } = deleteUndo
    setTodos((prev) => {
      const next = [...prev]
      const at = Math.min(Math.max(0, index), next.length)
      next.splice(at, 0, todo)
      return next
    })
    setDeleteUndo(null)
  }

  const deleteTodo = (id) => {
    const index = todos.findIndex((t) => t.id === id)
    if (index === -1) return
    const todo = todos[index]
    setDeleteUndo({ todo: { ...todo }, index })
    setTodos(todos.filter((t) => t.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setEditText('')
    }
  }

  const clearCompleted = () => {
    setTodos(todos.filter((t) => !t.done))
  }

  const startEdit = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = () => {
    if (editingId === null) return
    const trimmed = editText.trim()
    if (trimmed === '') {
      deleteTodo(editingId)
    } else {
      setTodos(todos.map((t) => (t.id === editingId ? { ...t, text: trimmed } : t)))
    }
    setEditingId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  const handleTodoKeyDown = (e, todo) => {
    if (e.key === 'F2') {
      e.preventDefault()
      startEdit(todo)
    }
  }

  const visible = todos.filter((t) =>
    filter === 'active' ? !t.done : filter === 'completed' ? t.done : true,
  )
  const remaining = todos.filter((t) => !t.done).length
  const hasCompleted = todos.some((t) => t.done)

  const tabClass = (name) =>
    `px-3 py-1 rounded-md text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      filter === name
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-200'
    }`

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-16 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Todo List</h1>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            placeholder="What needs doing?"
            aria-label="New todo title"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          />
          <button
            type="button"
            onClick={addTodo}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Add
          </button>
        </div>

        <div className="flex gap-2 mb-4" role="group" aria-label="Filter todos">
          {['all', 'active', 'completed'].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={tabClass(name)}
              aria-pressed={filter === name}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {visible.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-3 px-3 py-2 min-h-[3rem] rounded-md border border-slate-200 hover:bg-slate-50"
            >
              {editingId === todo.id ? (
                <input
                  ref={setEditInputEl}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  aria-label={`Editing: ${todo.text}`}
                  className="flex-1 min-w-0 px-1 py-0.5 border-b-2 border-indigo-500 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-transparent text-slate-800"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  onDoubleClick={() => startEdit(todo)}
                  onKeyDown={(e) => handleTodoKeyDown(e, todo)}
                  aria-label={`${todo.text}${todo.done ? ', completed' : ''}. Press F2 to edit.`}
                  className={`flex-1 min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded ${
                    todo.done ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {todo.text}
                </button>
              )}
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                className="shrink-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 text-lg font-bold opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                aria-label={`Delete ${todo.text}`}
              >
                ×
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-center text-slate-400 py-4 text-sm">
              Nothing here.
            </li>
          )}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>
            {remaining} {remaining === 1 ? 'item' : 'items'} left
          </span>
          <button
            type="button"
            onClick={clearCompleted}
            disabled={!hasCompleted}
            aria-label="Clear all completed todos"
            className="ml-auto px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Clear completed
          </button>
        </div>

        {deleteUndo && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-3 bg-slate-800 text-white rounded-lg shadow-lg max-w-md w-[calc(100%-2rem)]"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="text-sm flex-1">Todo removed.</span>
            <button
              type="button"
              onClick={undoDelete}
              className="px-3 py-1 text-sm font-semibold bg-indigo-500 rounded-md hover:bg-indigo-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
