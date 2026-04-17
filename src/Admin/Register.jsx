import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import bgGym from '../../img/backgroundgym.jpg'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!username || !password) {
      setError('Vui lòng điền đầy đủ thông tin.')
      setLoading(false)
      return
    }
    if (password !== confirm) {
      setError('Mật khẩu và xác nhận mật khẩu không khớp.')
      setLoading(false)
      return
    }

    try {
      const result = await api.register(username, password)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Đăng ký thành công! Vui lòng đăng nhập.')
        setUsername('')
        setPassword('')
        setConfirm('')

        setTimeout(() => {
          navigate('/login')
        }, 1200)
      }
    } catch (err) {
      setError('Lỗi kết nối server. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.84), rgba(241, 245, 249, 0.92)), url(${bgGym})`
      }}
    >
      <div className="pointer-events-none absolute -left-12 top-8 h-44 w-44 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-6 h-56 w-56 rounded-full bg-sky-200/45 blur-3xl" />
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-zinc-950/90 rounded-xl p-8 shadow-lg text-white border border-zinc-700 backdrop-blur-sm">
        <h2 className="text-3xl font-bold mb-5">Đăng ký</h2>
        {error && <p className="mb-4 text-red-300">{error}</p>}
        {success && <p className="mb-4 text-green-300">{success}</p>}

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Tên đăng nhập"
          className="w-full mb-3 px-4 py-3 rounded-lg bg-zinc-900/90 border border-zinc-600 focus:outline-none text-white placeholder:text-zinc-400"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className="w-full mb-3 px-4 py-3 rounded-lg bg-zinc-900/90 border border-zinc-600 focus:outline-none text-white placeholder:text-zinc-400"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Xác nhận mật khẩu"
          className="w-full mb-4 px-4 py-3 rounded-lg bg-zinc-900/90 border border-zinc-600 focus:outline-none text-white placeholder:text-zinc-400"
        />

        <button className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold text-white" type="submit" disabled={loading}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
        <button
          type="button"
          className="mt-3 w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-white"
          onClick={() => navigate('/login')}
        >
          Quay lại Đăng nhập
        </button>
      </form>
    </div>
  )
}
