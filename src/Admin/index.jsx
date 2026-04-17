import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import bgGym from '../../img/backgroundgym.jpg'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const trainerImageInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [members, setMembers] = useState([])
  const [requests, setRequests] = useState([])
  const [packages, setPackages] = useState([])
  const [trainers, setTrainers] = useState([])
  const [dashboardStats, setDashboardStats] = useState({
    memberCount: 0,
    activePackageCount: 0,
    pendingRequestCount: 0,
    approvedRequestCount: 0,
    totalRevenue: 0,
    packageRevenueList: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [trainerMessage, setTrainerMessage] = useState('')
  const [editingPackageId, setEditingPackageId] = useState(null)
  const [editingTrainerId, setEditingTrainerId] = useState(null)
  const [showTrainerForm, setShowTrainerForm] = useState(false)
  const [packageForm, setPackageForm] = useState({
    slug: '',
    name: '',
    price: '',
    features: '',
    color: 'border-zinc-700',
    image_url: '',
    is_active: true
  })
  const [trainerForm, setTrainerForm] = useState({
    slug: '',
    name: '',
    nickname: '',
    role: '',
    package_slug: '',
    experience: '',
    bio: '',
    specialties: '',
    achievement: '',
    sort_order: 0,
    image_url: '',
    is_active: true
  })

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard()
    } else if (activeTab === 'members') {
      loadMembers()
    } else if (activeTab === 'requests') {
      loadRequests()
    } else if (activeTab === 'packages') {
      loadPackages()
    } else if (activeTab === 'trainers') {
      loadTrainers()
      loadPackages()
    }
  }, [activeTab])

  const loadMembers = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await api.getAllMembers()
      if (result.error) {
        setError(result.error)
      } else {
        setMembers(result.members)
        setDashboardStats((current) => ({
          ...current,
          memberCount: result.members.length,
          activePackageCount: result.members.filter((member) => member.package_status === 'active').length
        }))
      }
    } catch (err) {
      setError('Lỗi kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const loadRequests = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await api.getPackageRequests()
      if (result.error) {
        setError(result.error)
      } else {
        setRequests(result.requests)
        setDashboardStats((current) => ({
          ...current,
          pendingRequestCount: result.requests.filter((request) => request.status === 'pending').length,
          approvedRequestCount: result.requests.filter((request) => request.status === 'approved').length
        }))
      }
    } catch (err) {
      setError('Lỗi kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const loadPackages = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await api.getAdminPackages()
      if (result.error) {
        setError(result.error)
      } else {
        setPackages(result.packages)
      }
    } catch (err) {
      setError('Lỗi kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const loadTrainers = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await api.getAdminTrainers()
      if (result.error) {
        setError(result.error)
      } else {
        setTrainers(result.trainers)
      }
    } catch (err) {
      setError('Lỗi kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const [membersResult, requestsResult, packagesResult, revenueSummary] = await Promise.all([
        api.getAllMembers(),
        api.getPackageRequests(),
        api.getAdminPackages(),
        api.getRevenueSummary()
      ])

      if (membersResult.error) {
        setError(membersResult.error)
        return
      }

      if (requestsResult.error) {
        setError(requestsResult.error)
        return
      }

      if (packagesResult.error) {
        setError(packagesResult.error)
        return
      }

      if (revenueSummary.error) {
        setError(revenueSummary.error)
        return
      }

      setMembers(membersResult.members)
      setRequests(requestsResult.requests)
      setPackages(packagesResult.packages)

      const trainersResult = await api.getAdminTrainers()
      if (!trainersResult.error) {
        setTrainers(trainersResult.trainers)
      }
      setDashboardStats({
        memberCount: membersResult.members.length,
        activePackageCount: membersResult.members.filter((member) => member.package_status === 'active').length,
        pendingRequestCount: requestsResult.requests.filter((request) => request.status === 'pending').length,
        approvedRequestCount: requestsResult.requests.filter((request) => request.status === 'approved').length,
        totalRevenue: revenueSummary.totalRevenue || 0,
        packageRevenueList: revenueSummary.packageRevenueList || []
      })
    } catch (err) {
      setError('Lỗi kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async (memberId, updates) => {
    try {
      const result = await api.updateMember(memberId, updates)
      if (result.error) {
        setError(result.error)
      } else {
        loadMembers()
        if (activeTab === 'dashboard') {
          loadDashboard()
        }
      }
    } catch (err) {
      setError('Lỗi cập nhật member.')
    }
  }

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Bạn có chắc muốn xóa member này?')) return

    try {
      const result = await api.deleteMember(memberId)
      if (result.error) {
        setError(result.error)
      } else {
        loadMembers()
        if (activeTab === 'dashboard') {
          loadDashboard()
        }
      }
    } catch (err) {
      setError('Lỗi xóa member.')
    }
  }

  const handleUpdateRequest = async (requestId, status) => {
    try {
      const result = await api.updatePackageRequest(requestId, status)
      if (result.error) {
        setError(result.error)
      } else {
        if (activeTab === 'dashboard') {
          loadDashboard()
        } else {
          loadRequests()
          loadMembers()
        }
      }
    } catch (err) {
      setError('Lỗi cập nhật yêu cầu.')
    }
  }

  const resetPackageForm = () => {
    setEditingPackageId(null)
    setPackageForm({
      slug: '',
      name: '',
      price: '',
      features: '',
      color: 'border-zinc-700',
      image_url: '',
      is_active: true
    })
  }

  const handleEditPackage = (item) => {
    setEditingPackageId(item.id)
    setPackageForm({
      slug: item.slug,
      name: item.name,
      price: item.price,
      features: Array.isArray(item.features) ? item.features.join(', ') : '',
      color: item.color || 'border-zinc-700',
      image_url: item.image_url || '',
      is_active: Boolean(item.is_active)
    })
    setActiveTab('packages')
  }

  const handlePackageImageChange = (file) => {
    if (!file) {
      handlePackageFormChange('image_url', '')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      handlePackageFormChange('image_url', typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  const handlePackageFormChange = (field, value) => {
    setPackageForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleSavePackage = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      slug: packageForm.slug.trim(),
      name: packageForm.name.trim(),
      price: packageForm.price.trim(),
      features: packageForm.features
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      color: packageForm.color,
      image_url: packageForm.image_url,
      is_active: packageForm.is_active
    }

    try {
      const result = editingPackageId
        ? await api.updatePackage(editingPackageId, payload)
        : await api.createPackage(payload)

      if (result.error) {
        setError(result.error)
      } else {
        resetPackageForm()
        loadPackages()
        if (activeTab === 'dashboard') {
          loadDashboard()
        }
      }
    } catch (err) {
      setError('Lỗi lưu gói tập.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm('Bạn có chắc muốn xóa gói tập này?')) return

    try {
      const result = await api.deletePackage(packageId)
      if (result.error) {
        setError(result.error)
      } else {
        if (editingPackageId === packageId) {
          resetPackageForm()
        }
        loadPackages()
        if (activeTab === 'dashboard') {
          loadDashboard()
        }
      }
    } catch (err) {
      setError('Lỗi xóa gói tập.')
    }
  }

  const resetTrainerForm = () => {
    setEditingTrainerId(null)
    setShowTrainerForm(false)
    setTrainerForm({
      slug: '',
      name: '',
      nickname: '',
      role: '',
      package_slug: '',
      experience: '',
      bio: '',
      specialties: '',
      achievement: '',
      sort_order: 0,
      image_url: '',
      is_active: true
    })
  }

  const handleEditTrainer = (trainer) => {
    setTrainerMessage('')
    setEditingTrainerId(trainer.id)
    setShowTrainerForm(true)
    setTrainerForm({
      slug: trainer.slug || '',
      name: trainer.name || '',
      nickname: trainer.nickname || '',
      role: trainer.role || '',
      package_slug: trainer.package_slug || '',
      experience: trainer.experience || '',
      bio: trainer.bio || '',
      specialties: Array.isArray(trainer.specialties) ? trainer.specialties.join(', ') : '',
      achievement: trainer.achievement || '',
      sort_order: trainer.sort_order ?? 0,
      image_url: trainer.image_url || '',
      is_active: Boolean(trainer.is_active)
    })
    setActiveTab('trainers')
  }

  const handleOpenCreateTrainer = () => {
    setTrainerMessage('')
    setEditingTrainerId(null)
    setShowTrainerForm(true)
    setTrainerForm({
      slug: '',
      name: '',
      nickname: '',
      role: '',
      package_slug: '',
      experience: '',
      bio: '',
      specialties: '',
      achievement: '',
      sort_order: trainers.length + 1,
      image_url: '',
      is_active: true
    })
  }

  const handleTrainerFormChange = (field, value) => {
    setTrainerForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const handleTrainerImageChange = (file) => {
    if (!file) {
      handleTrainerFormChange('image_url', '')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      handleTrainerFormChange('image_url', typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveTrainer = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTrainerMessage('')

    const payload = {
      slug: trainerForm.slug.trim(),
      name: trainerForm.name.trim(),
      nickname: trainerForm.nickname.trim(),
      role: trainerForm.role.trim(),
      package_slug: trainerForm.package_slug,
      experience: trainerForm.experience.trim(),
      bio: trainerForm.bio.trim(),
      specialties: trainerForm.specialties
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      achievement: trainerForm.achievement.trim(),
      sort_order: Number(trainerForm.sort_order) || 0,
      image_url: trainerForm.image_url,
      is_active: trainerForm.is_active
    }

    try {
      const result = editingTrainerId
        ? await api.updateTrainer(editingTrainerId, payload)
        : await api.createTrainer(payload)

      if (result.error) {
        setError(result.error)
      } else {
        setTrainerMessage(editingTrainerId ? 'Đã cập nhật huấn luyện viên.' : 'Đã thêm huấn luyện viên mới.')
        resetTrainerForm()
        loadTrainers()
      }
    } catch (err) {
      setError('Lỗi lưu huấn luyện viên.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTrainer = async (trainerId) => {
    if (!window.confirm('Bạn có chắc muốn xóa huấn luyện viên này?')) return

    setTrainerMessage('')

    try {
      const result = await api.deleteTrainer(trainerId)
      if (result.error) {
        setError(result.error)
      } else {
        if (editingTrainerId === trainerId) {
          resetTrainerForm()
        }
        setTrainerMessage('Đã xóa huấn luyện viên.')
        loadTrainers()
      }
    } catch (err) {
      setError('Lỗi xóa huấn luyện viên.')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  return (
    <div
      className="admin-light flex min-h-screen text-white font-sans bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.18), rgba(241, 245, 249, 0.28)), url(${bgGym})`
      }}
    >
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950/92 p-8 flex flex-col fixed h-full backdrop-blur-sm">
        <div className="text-2xl font-black italic text-orange-600 mb-12 tracking-tighter">
          ADMIN<span className="text-white">PANEL</span>
        </div>

        <nav className="space-y-6 flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'dashboard' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-300'
            }`}
          >
            01. Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`w-full text-left text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'members' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-300'
            }`}
          >
            02. Hội viên
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full text-left text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'requests' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-300'
            }`}
          >
            03. Yêu cầu gói tập
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`w-full text-left text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'packages' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-300'
            }`}
          >
            04. Gói tập
          </button>
          <button
            onClick={() => setActiveTab('trainers')}
            className={`w-full text-left text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'trainers' ? 'text-orange-500' : 'text-zinc-600 hover:text-zinc-300'
            }`}
          >
            05. Huấn luyện viên
          </button>
        </nav>

        <button onClick={logout} className="text-zinc-700 text-[10px] font-black uppercase hover:text-red-500 transition-colors text-left">
          [ Đăng xuất ]
        </button>
      </aside>

      <main className="flex-1 ml-64 p-12">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-5xl font-black uppercase italic mb-12">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-zinc-900/50 p-8 border border-zinc-800 rounded-sm">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Doanh thu</p>
                <p className="mt-4 text-3xl font-black text-white">
                  {new Intl.NumberFormat('vi-VN').format(dashboardStats.totalRevenue)}
                </p>
              </div>
              <div className="bg-zinc-900/50 p-8 border border-zinc-800 rounded-sm">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Hội viên</p>
                <p className="mt-4 text-3xl font-black text-white">{dashboardStats.memberCount}</p>
                <p className="mt-2 text-xs text-zinc-400">{dashboardStats.activePackageCount} đang có gói hoạt động</p>
              </div>
              <div className="bg-zinc-900/50 p-8 border border-zinc-800 rounded-sm">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Yêu cầu</p>
                <p className="mt-4 text-3xl font-black text-white">{dashboardStats.pendingRequestCount}</p>
                <p className="mt-2 text-xs text-zinc-400">{dashboardStats.approvedRequestCount} đã duyệt</p>
              </div>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 p-8">
              <h3 className="text-sm font-black uppercase mb-6 text-zinc-400 italic">Giao dịch gần đây</h3>
              <div className="space-y-4">
                {requests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <p className="font-bold text-white">{request.member_name}</p>
                      <p className="text-xs text-zinc-400">{request.package_name}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold ${request.status === 'approved' ? 'text-green-400' : request.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {request.status === 'approved' ? 'Đã duyệt' : request.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                ))}
                {requests.length === 0 && <p className="text-zinc-500 text-sm">Chưa có giao dịch nào.</p>}
              </div>
            </div>

            <div className="mt-8 bg-zinc-900/20 border border-zinc-800 p-8">
              <h3 className="text-sm font-black uppercase mb-6 text-zinc-400 italic">Doanh thu theo gói</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardStats.packageRevenueList.slice(0, 3).map((item) => (
                  <div key={item.slug || item.package_name} className="rounded-sm border border-zinc-800 bg-zinc-900/50 p-5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{item.package_name}</p>
                    <p className="text-2xl font-black text-white">
                      {new Intl.NumberFormat('vi-VN').format(item.total_revenue)}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">{item.approved_count} hội viên đã duyệt</p>
                  </div>
                ))}
                {dashboardStats.packageRevenueList.length === 0 && (
                  <p className="text-zinc-500 text-sm">Chưa có doanh thu từ gói nào.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-5xl font-black uppercase italic mb-12">Quản lý Hội viên</h2>

            {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded text-red-300">{error}</div>}

            {loading ? (
              <div className="text-center py-20">
                <p className="text-zinc-400">Đang tải danh sách...</p>
              </div>
            ) : (
              <div className="bg-zinc-900/20 border border-zinc-800 p-8">
                <h3 className="text-sm font-black uppercase mb-6 text-zinc-400 italic">Danh sách thành viên ({members.length})</h3>

                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="bg-zinc-900/50 p-6 border border-zinc-800 rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-orange-500">{member.username}</h4>
                          <p className="text-sm text-zinc-400">ID: {member.id}</p>
                          <p className="text-sm text-zinc-400">Ngày tạo: {new Date(member.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateMember(member.id, { role: e.target.value })}
                            className="bg-zinc-800 border border-zinc-700 px-3 py-1 rounded text-sm"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-bold"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className="text-zinc-500">MetaMask: </span>
                        {member.metamask_address ? (
                          <span className="text-green-400 font-mono">{member.metamask_address}</span>
                        ) : (
                          <span className="text-yellow-400">Chưa liên kết</span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="rounded border border-zinc-800 bg-zinc-950/70 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Gói hiện tại</p>
                          <p className="font-bold text-white">{member.current_package_name || 'Chưa kích hoạt'}</p>
                        </div>
                        <div className="rounded border border-zinc-800 bg-zinc-950/70 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Giá gói</p>
                          <p className="font-bold text-white">
                            {member.current_package_price ? `${member.current_package_price} VNĐ/Tháng` : '---'}
                          </p>
                        </div>
                        <div className="rounded border border-zinc-800 bg-zinc-950/70 p-3">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Trạng thái gói</p>
                          <p className={`font-bold ${member.package_status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {member.package_status === 'active' ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                          </p>
                        </div>
                      </div>

                      {member.current_package_features && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(() => {
                            try {
                              return JSON.parse(member.current_package_features)
                            } catch (err) {
                              return []
                            }
                          })().map((feature) => (
                            <span key={feature} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {members.length === 0 && (
                    <div className="text-center py-10 text-zinc-500">
                      Chưa có thành viên nào.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-5xl font-black uppercase italic mb-12">Yêu cầu gói tập</h2>

            {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded text-red-300">{error}</div>}

            {loading ? (
              <div className="text-center py-20">
                <p className="text-zinc-400">Đang tải danh sách...</p>
              </div>
            ) : (
              <div className="bg-zinc-900/20 border border-zinc-800 p-8">
                <h3 className="text-sm font-black uppercase mb-6 text-zinc-400 italic">Danh sách yêu cầu ({requests.length})</h3>

                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="bg-zinc-900/50 p-6 border border-zinc-800 rounded-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-orange-500">{request.member_name}</h4>
                          <p className="text-sm text-zinc-400">Gói: {request.package_name}</p>
                          <p className="text-sm text-zinc-400">Giá: {request.package_price} VNĐ/Tháng</p>
                          <p className="text-sm text-zinc-400">Ngày yêu cầu: {new Date(request.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={request.status}
                            onChange={(e) => handleUpdateRequest(request.id, e.target.value)}
                            className={`border px-3 py-1 rounded text-sm font-bold ${
                              request.status === 'approved' ? 'bg-green-900 border-green-800 text-green-300' :
                              request.status === 'rejected' ? 'bg-red-900 border-red-800 text-red-300' :
                              'bg-yellow-900 border-yellow-800 text-yellow-300'
                            }`}
                          >
                            <option value="pending">Chờ duyệt</option>
                            <option value="approved">Duyệt</option>
                            <option value="rejected">Từ chối</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-sm">
                        <span className={`font-bold ${
                          request.status === 'approved' ? 'text-green-400' :
                          request.status === 'rejected' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          Trạng thái: {
                            request.status === 'approved' ? 'Đã duyệt' :
                            request.status === 'rejected' ? 'Bị từ chối' :
                            'Chờ duyệt'
                          }
                        </span>
                      </div>
                    </div>
                  ))}

                  {requests.length === 0 && (
                    <div className="text-center py-10 text-zinc-500">
                      Không có yêu cầu nào.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-5xl font-black uppercase italic mb-12">Quản lý gói tập</h2>

            {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded text-red-300">{error}</div>}

            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
              <form onSubmit={handleSavePackage} className="bg-zinc-900/20 border border-zinc-800 p-8 rounded-sm space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-black uppercase text-zinc-400 italic">
                    {editingPackageId ? 'Chỉnh sửa gói' : 'Thêm gói mới'}
                  </h3>
                  {editingPackageId && (
                    <button
                      type="button"
                      onClick={resetPackageForm}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
                    >
                      Hủy sửa
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Slug</label>
                  <input
                    value={packageForm.slug}
                    onChange={(e) => handlePackageFormChange('slug', e.target.value)}
                    placeholder="basic, pro, vip..."
                    className="w-full border border-zinc-800 bg-black p-4 text-white outline-none transition-all focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Tên gói</label>
                  <input
                    value={packageForm.name}
                    onChange={(e) => handlePackageFormChange('name', e.target.value)}
                    placeholder="Gói VIP"
                    className="w-full border border-zinc-800 bg-black p-4 text-white outline-none transition-all focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Giá</label>
                  <input
                    value={packageForm.price}
                    onChange={(e) => handlePackageFormChange('price', e.target.value)}
                    placeholder="1.999.000"
                    className="w-full border border-zinc-800 bg-black p-4 text-white outline-none transition-all focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Màu viền</label>
                  <select
                    value={packageForm.color}
                    onChange={(e) => handlePackageFormChange('color', e.target.value)}
                    className="w-full border border-zinc-800 bg-black p-4 text-white outline-none transition-all focus:border-orange-600"
                  >
                    <option value="border-zinc-700">Zinc</option>
                    <option value="border-orange-600">Orange</option>
                    <option value="border-yellow-500">Yellow</option>
                    <option value="border-red-500">Red</option>
                    <option value="border-green-500">Green</option>
                    <option value="border-blue-500">Blue</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Ảnh gói tập</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePackageImageChange(e.target.files?.[0] || null)}
                    className="w-full border border-zinc-800 bg-black p-4 text-white outline-none transition-all focus:border-orange-600"
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Chọn ảnh từ máy tính. Ảnh sẽ được lưu cùng dữ liệu gói tập.
                  </p>
                  {packageForm.image_url && (
                    <div className="mt-3 overflow-hidden rounded border border-zinc-800">
                      <img src={packageForm.image_url} alt="Preview gói tập" className="h-40 w-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-zinc-500">Quyền lợi</label>
                  <textarea
                    value={packageForm.features}
                    onChange={(e) => handlePackageFormChange('features', e.target.value)}
                    placeholder="Truy cập mọi khung giờ, Tủ đồ riêng, ..."
                    rows="5"
                    className="w-full border border-zinc-800 bg-black p-4 text-white outline-none transition-all focus:border-orange-600"
                  />
                </div>

                <label className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={packageForm.is_active}
                    onChange={(e) => handlePackageFormChange('is_active', e.target.checked)}
                  />
                  Kích hoạt gói
                </label>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded text-sm font-black uppercase tracking-widest"
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : editingPackageId ? 'Cập nhật' : 'Tạo gói'}
                  </button>
                  {editingPackageId && (
                    <button
                      type="button"
                      onClick={resetPackageForm}
                      className="px-4 py-3 rounded border border-zinc-700 text-sm font-black uppercase tracking-widest text-zinc-300 hover:text-white"
                    >
                      Làm mới
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-zinc-900/20 border border-zinc-800 p-8">
                <h3 className="text-sm font-black uppercase mb-6 text-zinc-400 italic">Danh sách gói ({packages.length})</h3>

                <div className="space-y-4">
                  {packages.map((item) => (
                    <div key={item.id} className="bg-zinc-900/50 p-6 border border-zinc-800 rounded-sm">
                      {item.image_url && (
                        <div className="mb-4 overflow-hidden rounded border border-zinc-800">
                          <img src={item.image_url} alt={item.name} className="h-44 w-full object-cover" />
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-orange-500">{item.name}</h4>
                          <p className="text-sm text-zinc-400">Slug: {item.slug}</p>
                          <p className="text-sm text-zinc-400">Giá: {item.price} VNĐ/Tháng</p>
                          <p className="text-sm text-zinc-400">Trạng thái: {item.is_active ? 'Hoạt động' : 'Ẩn'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPackage(item)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-bold"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeletePackage(item.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-bold"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(item.features) ? item.features : []).map((feature) => (
                          <span key={feature} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {packages.length === 0 && (
                    <div className="text-center py-10 text-zinc-500">
                      Chưa có gói tập nào.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trainers' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-5xl font-black uppercase italic mb-12">Quản lý huấn luyện viên</h2>

            {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded text-red-300">{error}</div>}
            {trainerMessage && <div className="mb-6 p-4 bg-green-50/80 border border-green-300 rounded text-green-800">{trainerMessage}</div>}

            <div className="mb-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenCreateTrainer}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded text-sm font-black uppercase tracking-widest"
              >
                Thêm huấn luyện viên
              </button>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800 p-8 mb-6">
              <h3 className="text-sm font-black uppercase mb-6 text-zinc-400 italic">Danh sách huấn luyện viên hiện tại ({trainers.length})</h3>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {trainers.map((trainer) => (
                  <div key={trainer.id} className="bg-zinc-900/50 p-6 border border-zinc-800 rounded-sm">
                    {trainer.image_url && (
                      <div className="mb-4 overflow-hidden rounded border border-zinc-800">
                        <img src={trainer.image_url} alt={trainer.name} className="h-44 w-full object-cover" />
                      </div>
                    )}

                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-orange-500">{trainer.name}</h4>
                        <p className="text-sm text-zinc-400">Slug: {trainer.slug}</p>
                        <p className="text-sm text-zinc-400">Nickname: {trainer.nickname}</p>
                        <p className="text-sm text-zinc-400">Vai trò: {trainer.role}</p>
                        <p className="text-sm text-zinc-400">
                          Gói phụ trách: {packages.find((item) => item.slug === trainer.package_slug)?.name || trainer.package_slug || 'Chưa gán'}
                        </p>
                        <p className="text-sm text-zinc-400">Kinh nghiệm: {trainer.experience}</p>
                        <p className="text-sm text-zinc-400">Thứ tự: {trainer.sort_order}</p>
                        <p className="text-sm text-zinc-400">Trạng thái: {trainer.is_active ? 'Hiển thị' : 'Ẩn'}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTrainer(trainer)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-bold"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteTrainer(trainer.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-bold"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-zinc-300 leading-relaxed mb-3">{trainer.bio}</p>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Chuyên môn</p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(trainer.specialties) ? trainer.specialties : []).map((item) => (
                        <span key={item} className="text-[10px] uppercase tracking-widest border border-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {trainers.length === 0 && (
                  <div className="text-center py-10 text-zinc-500 xl:col-span-2">
                    Chưa có huấn luyện viên nào.
                  </div>
                )}
              </div>
            </div>

            {showTrainerForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
              <form onSubmit={handleSaveTrainer} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 space-y-5 shadow-2xl text-slate-900">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-black uppercase text-slate-700 italic">
                    {editingTrainerId ? 'Chỉnh sửa huấn luyện viên' : 'Thêm huấn luyện viên mới'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetTrainerForm}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
                  >
                    Đóng form
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Slug</label>
                    <input
                      value={trainerForm.slug}
                      onChange={(e) => handleTrainerFormChange('slug', e.target.value)}
                      className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Thứ tự hiển thị</label>
                    <input
                      type="number"
                      value={trainerForm.sort_order}
                      onChange={(e) => handleTrainerFormChange('sort_order', e.target.value)}
                      className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Tên</label>
                    <input
                      value={trainerForm.name}
                      onChange={(e) => handleTrainerFormChange('name', e.target.value)}
                      className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Nickname</label>
                    <input
                      value={trainerForm.nickname}
                      onChange={(e) => handleTrainerFormChange('nickname', e.target.value)}
                      className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Vai trò</label>
                    <input
                      value={trainerForm.role}
                      onChange={(e) => handleTrainerFormChange('role', e.target.value)}
                      className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Gói phụ trách</label>
                    <select
                      value={trainerForm.package_slug}
                      onChange={(e) => handleTrainerFormChange('package_slug', e.target.value)}
                      className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                    >
                      <option value="">Chưa gán</option>
                      {packages.map((item) => (
                        <option key={item.slug} value={item.slug}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Kinh nghiệm</label>
                    <input
                      value={trainerForm.experience}
                      onChange={(e) => handleTrainerFormChange('experience', e.target.value)}
                      className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                    />
                  </div>
                  <div></div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Ảnh huấn luyện viên</label>
                  <input
                    ref={trainerImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTrainerImageChange(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => trainerImageInputRef.current?.click()}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700 hover:border-orange-500 hover:text-orange-600"
                    >
                      Tải ảnh lên
                    </button>
                    {trainerForm.image_url && (
                      <button
                        type="button"
                        onClick={() => handleTrainerFormChange('image_url', '')}
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-700 hover:bg-red-100"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                  {trainerForm.image_url && (
                    <div className="mt-3 overflow-hidden rounded border border-slate-300">
                      <img src={trainerForm.image_url} alt="Preview huấn luyện viên" className="h-40 w-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Bio</label>
                  <textarea
                    value={trainerForm.bio}
                    onChange={(e) => handleTrainerFormChange('bio', e.target.value)}
                    rows="4"
                    className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Chuyên môn (phân tách dấu phẩy)</label>
                  <textarea
                    value={trainerForm.specialties}
                    onChange={(e) => handleTrainerFormChange('specialties', e.target.value)}
                    rows="3"
                    className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">Thành tích</label>
                  <input
                    value={trainerForm.achievement}
                    onChange={(e) => handleTrainerFormChange('achievement', e.target.value)}
                    className="w-full border border-slate-300 bg-white p-4 text-slate-900 outline-none transition-all focus:border-orange-600"
                  />
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={trainerForm.is_active}
                    onChange={(e) => handleTrainerFormChange('is_active', e.target.checked)}
                  />
                  Kích hoạt hiển thị
                </label>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded text-sm font-black uppercase tracking-widest"
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : editingTrainerId ? 'Cập nhật' : 'Tạo huấn luyện viên'}
                  </button>
                  <button
                    type="button"
                    onClick={resetTrainerForm}
                    className="px-4 py-3 rounded border border-slate-300 bg-white text-sm font-black uppercase tracking-widest text-slate-700 hover:text-slate-900"
                  >
                    Hủy
                  </button>
                </div>
              </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
