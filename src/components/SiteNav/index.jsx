import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function SiteNav() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const currentUser = localStorage.getItem('currentUser')

    if (token && role && currentUser) {
      setUser({ username: currentUser, role })
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('currentUser')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <Link to="/" className="text-3xl font-black italic tracking-tighter text-orange-500">
          POWER<span className="text-slate-900">GYM</span>
        </Link>

        <ul className="hidden md:flex gap-10 text-sm font-bold uppercase tracking-widest">
          <li><Link to="/" className="hover:text-orange-500">Trang chủ</Link></li>
          <li className="relative group pb-4">
            <Link to="/pricing" className="inline-flex items-center gap-1 hover:text-orange-500">
              Gói tập
              <span className="text-[10px] leading-none text-slate-400 transition-transform duration-200 group-hover:translate-y-0.5">
                ▾
              </span>
            </Link>
            <div className="absolute left-0 top-full z-50 mt-0 hidden min-w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl group-hover:block group-hover:animate-tab-content">
              <div className="h-3"></div>
              <Link to="/pricing#pricing-basic" className="flex items-center justify-between rounded-xl px-4 py-4 text-slate-700 hover:bg-orange-50 hover:text-orange-600 min-h-12">
                <span>Gói Cơ Bản</span>
                <span className="text-xs text-slate-400">→</span>
              </Link>
              <Link to="/pricing#pricing-pro" className="flex items-center justify-between rounded-xl px-4 py-4 text-slate-700 hover:bg-orange-50 hover:text-orange-600 min-h-12">
                <span>Gói Chuyên Nghiệp</span>
                <span className="text-xs text-slate-400">→</span>
              </Link>
              <Link to="/pricing#pricing-vip" className="flex items-center justify-between rounded-xl px-4 py-4 text-slate-700 hover:bg-orange-50 hover:text-orange-600 min-h-12">
                <span>Gói VIP</span>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            </div>
          </li>
          <li><Link to="/trainers" className="hover:text-orange-500">Huấn luyện viên</Link></li>
          <li><Link to="/contact" className="hover:text-orange-500">Liên hệ</Link></li>
        </ul>

        <div className="flex gap-3 items-center">
          {user ? (
            <>
              <span className="text-sm text-slate-600">
                Xin chào, <span className="text-orange-500 font-bold">{user.username}</span>
                {user.role === 'admin' && <span className="text-red-400 ml-1">(Admin)</span>}
              </span>
              <Link
                to={user.role === 'admin' ? '/admin-portal' : '/member-portal'}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full font-bold text-sm transition-all text-white"
              >
                {user.role === 'admin' ? 'Admin Panel' : 'Member Portal'}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-full font-bold text-sm transition-all text-white"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-orange-600 hover:bg-orange-500 px-6 py-2 rounded-full font-bold text-sm transition-all text-white">
              ĐĂNG KÝ / ĐĂNG NHẬP
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}