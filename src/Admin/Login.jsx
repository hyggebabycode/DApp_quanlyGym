import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import bgGym from '../../img/backgroundgym.jpg'
import { api } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await api.login(username, password)

      if (result.error) {
        setError(result.error)
      } else {
        localStorage.setItem('token', result.token)
        localStorage.setItem('role', result.user.role)
        localStorage.setItem('currentUser', result.user.username)

        if (result.user.role === 'admin') {
          navigate('/admin-portal')
        } else {
          navigate('/')
        }
      }
    } catch (err) {
      setError('Lỗi kết nối server. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleMetamask = async () => {
    if (!window.ethereum) {
      setError('Vui lòng cài MetaMask trước khi dùng tính năng này.')
      return
    }
    try {
      setLoading(true)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const address = accounts[0]?.toLowerCase() || ''

      if (!address) {
        setError('Không tìm thấy địa chỉ MetaMask.')
        return
      }

      const result = await api.loginWithMetamask(address)

      if (result.error) {
        setError(result.error)
      } else {
        localStorage.setItem('token', result.token)
        localStorage.setItem('role', result.user.role)
        localStorage.setItem('currentUser', result.user.username)

        if (result.user.role === 'admin') {
          navigate('/admin-portal')
        } else {
          navigate('/')
        }
      }
    } catch (err) {
      console.error(err)
      setError('Không thể đăng nhập MetaMask. Vui lòng thử lại.')
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
        <h2 className="text-3xl font-bold mb-5">Đăng nhập</h2>
        {error && <p className="mb-4 text-red-300">{error}</p>}

        <div className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên đăng nhập"
            className="w-full px-4 py-3 rounded-lg bg-zinc-900/90 border border-zinc-600 focus:outline-none text-white placeholder:text-zinc-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="w-full px-4 py-3 rounded-lg bg-zinc-900/90 border border-zinc-600 focus:outline-none text-white placeholder:text-zinc-400"
          />
        </div>

        <button type="submit" className="mt-4 w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold text-white" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <button
          type="button"
          onClick={handleMetamask}
          disabled={loading}
          className="mt-3 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white"
        >
          {loading ? 'Đang kết nối MetaMask...' : 'Tiếp tục với MetaMask'}
        </button>

        <p className="mt-4 text-sm text-zinc-400">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-orange-300 hover:text-orange-200 font-bold">
            Đăng ký ngay
          </Link>
        </p>

        <p className="mt-3 text-xs text-zinc-300">
          admin/admin123 hoặc user/user123 .
        </p>
      </form>
    </div>
  )
}

