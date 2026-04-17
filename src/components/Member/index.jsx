import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import bgGym from '../../../img/backgroundgym.jpg'

export default function MemberDashboard() {
  const navigate = useNavigate()
  const [memberName, setMemberName] = useState('')
  const [metamaskAddress, setMetamaskAddress] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPackageFeatures, setCurrentPackageFeatures] = useState([])
  const [memberSchedule, setMemberSchedule] = useState([])
  const [memberStats, setMemberStats] = useState({
    packageName: '',
    packagePrice: '',
    trainer: 'Chưa phân công',
    sessions: 'Chưa cập nhật',
    goal: 'Chưa cập nhật',
    nextSession: 'Chưa cập nhật',
    renewal: 'Chưa cập nhật'
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    loadMemberData()
  }, [navigate])

  const loadMemberData = async () => {
    try {
      const result = await api.getCurrentMember()
      if (result.error) {
        if (result.error === 'Invalid token') {
          localStorage.removeItem('token')
          localStorage.removeItem('role')
          localStorage.removeItem('currentUser')
          navigate('/login')
          return
        }
        setError(result.error)
      } else {
        setMemberName(result.user.username)
        setMetamaskAddress(result.user.metamask_address || '')
        let parsedFeatures = []

        if (result.user.current_package_features) {
          try {
            parsedFeatures = JSON.parse(result.user.current_package_features)
          } catch (parseErr) {
            parsedFeatures = []
          }
        }

        let parsedSchedule = []
        if (result.user.schedule_notes) {
          try {
            const decoded = JSON.parse(result.user.schedule_notes)
            if (Array.isArray(decoded)) {
              parsedSchedule = decoded
                .map((item) => {
                  if (typeof item === 'string') {
                    const parts = item.split('|')
                    return {
                      day: parts[0]?.trim() || '',
                      workout: parts[1]?.trim() || ''
                    }
                  }

                  return {
                    day: String(item.day || '').trim(),
                    workout: String(item.workout || '').trim()
                  }
                })
                .filter((item) => item.day || item.workout)
            }
          } catch (parseErr) {
            parsedSchedule = []
          }
        }

        setCurrentPackageFeatures(parsedFeatures)
        setMemberSchedule(parsedSchedule)
        setMemberStats({
          packageName: result.user.current_package_name || 'Chưa cập nhật',
          packagePrice: result.user.current_package_price || '---',
          trainer: result.user.trainer_name || 'Chưa phân công',
          sessions: result.user.weekly_sessions || 'Chưa cập nhật',
          goal: result.user.goal || 'Chưa cập nhật',
          nextSession: result.user.next_session_at ? new Date(result.user.next_session_at).toLocaleString('vi-VN') : 'Chưa cập nhật',
          renewal: result.user.package_updated_at ? new Date(result.user.package_updated_at).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
        })
      }
    } catch (err) {
      setError('Lỗi kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkMetamask = async () => {
    setError('')
    setStatusMsg('')

    if (!window.ethereum) {
      setError('Vui lòng cài MetaMask trước khi liên kết.')
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const address = accounts[0]?.toLowerCase() || ''
      if (!address) {
        setError('Không tìm thấy địa chỉ MetaMask.')
        return
      }

      const result = await api.linkMetamask(address)

      if (result.error) {
        setError(result.error)
      } else {
        setMetamaskAddress(address)
        setStatusMsg('Liên kết MetaMask thành công!')
      }
    } catch (err) {
      console.error(err)
      setError('Không thể kết nối MetaMask. Vui lòng thử lại.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8 flex items-center justify-center">
        <div className="text-xl text-zinc-200">Đang tải...</div>
      </div>
    )
  }

  return (
    <div
      className="member-light relative min-h-screen text-white p-6 md:p-8 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.7), rgba(241, 245, 249, 0.8)), url(${bgGym})`
      }}
    >
      <div className="pointer-events-none absolute left-2 top-2 h-44 w-44 rounded-full bg-orange-300/25 blur-3xl" />
      <div className="pointer-events-none absolute right-4 top-24 h-52 w-52 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-orange-500 mb-3">Member profile</p>
            <h1 className="text-4xl md:text-6xl font-black italic uppercase leading-none">Khu vực thành viên</h1>
            <p className="mt-4 text-zinc-100 max-w-2xl">
              Chào mừng <strong>{memberName || 'thành viên'}</strong>. Đây là nơi bạn xem gói tập, huấn luyện viên, lịch tập và kết nối Web3.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="px-5 py-3 rounded-xl border border-zinc-700 bg-zinc-950/70 hover:border-zinc-500 font-bold text-zinc-100">
              Về trang chủ
            </button>
            <button onClick={handleLogout} className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 font-black uppercase tracking-wide">
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300 mb-2">Gói hiện tại</p>
            <p className="text-xl font-black text-white">{memberStats.packageName}</p>
            <p className="mt-2 text-sm text-zinc-200">{memberStats.packagePrice} VNĐ/Tháng</p>
          </div>
          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300 mb-2">Huấn luyện viên</p>
            <p className="text-xl font-black text-white">{memberStats.trainer}</p>
          </div>
          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300 mb-2">Lịch tập</p>
            <p className="text-xl font-black text-white">{memberStats.sessions}</p>
          </div>
          <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300 mb-2">Gia hạn</p>
            <p className="text-xl font-black text-white">{memberStats.renewal}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-700 bg-zinc-950/80 p-6 md:p-8 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300 mb-2">Hồ sơ</p>
                  <h2 className="text-2xl md:text-3xl font-black italic uppercase">Thông tin cá nhân</h2>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${metamaskAddress ? 'border-green-800 bg-green-950/50 text-green-300' : 'border-yellow-800 bg-yellow-950/50 text-yellow-300'}`}>
                  <span className="h-2 w-2 rounded-full bg-current"></span>
                  {metamaskAddress ? 'MetaMask đã liên kết' : 'MetaMask chưa liên kết'}
                </div>
              </div>

              {error && <p className="text-red-300 mb-3">{error}</p>}
              {statusMsg && <p className="text-green-300 mb-3">{statusMsg}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300 mb-2">Tên đăng nhập</p>
                  <p className="text-xl font-black text-white">{memberName || 'thành viên'}</p>
                </div>
                <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300 mb-2">Địa chỉ ví</p>
                  <p className="break-all text-sm text-zinc-100">{metamaskAddress || 'Chưa có địa chỉ'}</p>
                </div>
              </div>

              <div className="mt-5">
                <button onClick={handleLinkMetamask} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black uppercase tracking-wide text-white">
                  {metamaskAddress ? 'Cập nhật MetaMask' : 'Liên kết MetaMask'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-zinc-700 bg-zinc-950/80 p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-black italic uppercase mb-5">Gói tập hiện tại</h2>
                <div className="space-y-3 text-zinc-100">
                  <div className="flex justify-between gap-4 border-b border-zinc-700 pb-3">
                    <span className="text-zinc-300">Tên gói</span>
                    <strong>{memberStats.packageName}</strong>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-zinc-700 pb-3">
                    <span className="text-zinc-300">Cập nhật</span>
                    <strong>{memberStats.renewal}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-300">Trạng thái</span>
                    <strong className={memberStats.packageName === 'Chưa cập nhật' ? 'text-yellow-400' : 'text-green-400'}>
                      {memberStats.packageName === 'Chưa cập nhật' ? 'Chưa kích hoạt' : 'Đang hoạt động'}
                    </strong>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {currentPackageFeatures.length > 0 ? (
                    currentPackageFeatures.map((feature) => (
                      <span key={feature} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                        {feature}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-zinc-300">Chưa có quyền lợi nào được kích hoạt.</span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-700 bg-zinc-950/80 p-6 backdrop-blur-sm">
                <h2 className="text-2xl font-black italic uppercase mb-5">Huấn luyện viên</h2>
                <div className="space-y-3 text-zinc-100">
                  <div className="flex justify-between gap-4 border-b border-zinc-700 pb-3">
                    <span className="text-zinc-300">Người phụ trách</span>
                    <strong>{memberStats.trainer}</strong>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-zinc-700 pb-3">
                    <span className="text-zinc-300">Mục tiêu</span>
                    <strong>{memberStats.goal}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-300">Buổi tiếp theo</span>
                    <strong>{memberStats.nextSession}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-700 bg-zinc-950/80 p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-black italic uppercase mb-5">Lịch tập tuần này</h2>
              <div className="space-y-3">
                {memberSchedule.length > 0 ? (
                  memberSchedule.map((item, index) => (
                    <div key={`${item.day}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-4 backdrop-blur-sm">
                      <div>
                        <p className="font-black text-white">{item.day || 'Buổi tập'}</p>
                        <p className="text-sm text-zinc-200">{item.workout || 'Nội dung đang cập nhật'}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-orange-500">Từ database</span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 px-4 py-5 text-sm text-zinc-300">
                    Chưa có lịch tập trong database.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-700 bg-zinc-950/80 p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-black italic uppercase mb-5">Thao tác nhanh</h2>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => navigate('/#pricing')} className="text-left rounded-2xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900/70 px-4 py-4 font-bold text-zinc-100">
                  Xem gói tập mới
                </button>
                <button onClick={() => navigate('/#contact')} className="text-left rounded-2xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900/70 px-4 py-4 font-bold text-zinc-100">
                  Liên hệ hỗ trợ
                </button>
                <button onClick={() => navigate('/me')} className="text-left rounded-2xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900/70 px-4 py-4 font-bold text-zinc-100">
                  Làm mới hồ sơ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
