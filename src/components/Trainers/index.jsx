import React, { useEffect, useMemo, useState } from 'react'
import SiteNav from '../SiteNav/index'
import Footer from '../Footer/index'
import { api } from '../../api'

const packageLabelBySlug = {
  basic: 'Gói Cơ Bản',
  pro: 'Gói Chuyên Nghiệp',
  vip: 'Gói VIP'
}

const trainerFilterOptions = [
  { slug: 'basic', label: 'Cơ bản' },
  { slug: 'pro', label: 'Pro' },
  { slug: 'vip', label: 'VIP' }
]

const Trainers = () => {
  const [trainers, setTrainers] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activePackageFilter, setActivePackageFilter] = useState('basic')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTrainers = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await api.getTrainers()
        if (result.error) {
          setError(result.error)
        } else {
          const data = Array.isArray(result.trainers) ? result.trainers : []
          setTrainers(data)
          setActiveId(data[0]?.id || null)
          const availableFilter = trainerFilterOptions.find((item) => data.some((trainer) => trainer.package_slug === item.slug))
          if (availableFilter) {
            setActivePackageFilter(availableFilter.slug)
          }
        }
      } catch (err) {
        setError('Không thể tải dữ liệu huấn luyện viên từ server.')
        setTrainers([])
        setActiveId(null)
      } finally {
        setLoading(false)
      }
    }

    loadTrainers()
  }, [])

  const activePT = useMemo(
    () => {
      const filtered = trainers.filter((item) => item.package_slug === activePackageFilter)
      return filtered.find((item) => String(item.id) === String(activeId)) || filtered[0] || null
    },
    [activeId, activePackageFilter, trainers]
  )

  const filteredTrainers = useMemo(
    () => trainers.filter((item) => item.package_slug === activePackageFilter),
    [activePackageFilter, trainers]
  )

  useEffect(() => {
    if (filteredTrainers.length === 0) {
      setActiveId(null)
      return
    }

    const exists = filteredTrainers.some((item) => String(item.id) === String(activeId))
    if (!exists) {
      setActiveId(filteredTrainers[0].id)
    }
  }, [activeId, filteredTrainers])

  if (loading) {
    return (
      <div>
        <section id="trainers" className="bg-slate-50 py-24 px-4 border-t border-slate-200">
          <SiteNav />
          <div className="max-w-6xl mx-auto rounded-xl border border-slate-200 bg-white p-8 text-slate-700">
            Đang tải danh sách huấn luyện viên...
          </div>
        </section>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <section id="trainers" className="bg-slate-50 py-24 px-4 border-t border-slate-200">
        <SiteNav />
        <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {error}
          </div>
        )}
        
        {/* TIÊU ĐỀ */}
        <div className="mb-16">
          <h2 className="text-orange-600 font-bold tracking-[0.3em] uppercase mb-2">Expert Team</h2>
          <h1 className="text-5xl font-black italic uppercase text-slate-900">Đội ngũ chuyên gia</h1>
          <div className="mt-6 flex flex-wrap gap-3">
            {trainerFilterOptions.map((item) => {
              const isActive = activePackageFilter === item.slug

              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setActivePackageFilter(item.slug)}
                  className={`rounded-xl border px-4 py-2 text-sm font-black uppercase tracking-wide transition-all ${
                    isActive
                      ? 'border-orange-500 bg-orange-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-orange-300'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* CỘT TRÁI: DANH SÁCH PT CÓ ẢNH */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {filteredTrainers.map((pt) => (
              <button
                key={pt.id}
                onClick={() => setActiveId(pt.id)}
                className={`group flex items-center gap-4 p-4 transition-all duration-300 border-l-4 ${
                  activePT.id === pt.id 
                  ? 'bg-white border-orange-600 shadow-sm' 
                  : 'bg-transparent border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {pt.image_url ? (
                    <img src={pt.image_url} alt={pt.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs font-bold uppercase tracking-widest text-slate-500">
                      No image
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className={`text-xs uppercase font-bold ${activePT.id === pt.id ? 'text-orange-600' : 'text-slate-500'}`}>
                    {pt.role}
                  </p>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">{pt.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{pt.experience} kinh nghiệm</p>
                </div>
                <span className={`ml-auto text-2xl transition-transform duration-300 ${activePT.id === pt.id ? 'translate-x-2 text-orange-600' : 'text-slate-400'}`}>
                  →
                </span>
              </button>
            ))}

            {filteredTrainers.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                Chưa có huấn luyện viên cho gói {packageLabelBySlug[activePackageFilter]}.
              </div>
            )}
          </div>

          {/* CỘT PHẢI: CHI TIẾT PT (NỘI DUNG CHUYỂN ĐỔI) */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            {!activePT ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
                Vui lòng chọn gói khác hoặc thêm huấn luyện viên cho gói này trong trang admin.
              </div>
            ) : (
              <>
            <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {activePT.image_url ? (
                <img
                  src={activePT.image_url}
                  alt={activePT.name}
                  className="h-64 w-full object-cover md:h-72"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm font-bold uppercase tracking-[0.2em] text-slate-500 md:h-72">
                  Huấn luyện viên chưa có ảnh
                </div>
              )}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-4 flex flex-wrap gap-3">
                <span className="bg-orange-600 text-white text-[10px] font-black uppercase px-3 py-1 tracking-widest">
                  {activePT.experience} Kinh nghiệm
                </span>
                <span className="border border-orange-200 bg-orange-50 text-orange-700 text-[10px] font-black uppercase px-3 py-1 tracking-widest">
                  {packageLabelBySlug[activePT.package_slug] || 'Chưa gán gói tập'}
                </span>
                <span className="border border-slate-300 text-slate-600 text-[10px] font-black uppercase px-3 py-1 tracking-widest">
                  {activePT.achievement}
                </span>
              </div>

              <h2 className="mb-2 text-4xl font-black italic uppercase text-orange-600 md:text-5xl">
                {activePT.name}
              </h2>
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">{activePT.nickname}</p>
              
              <p className="mb-5 max-w-3xl text-base leading-relaxed text-slate-700">
                "{activePT.bio}"
              </p>

              <div className="grid grid-cols-1 gap-5 border-t border-slate-200 pt-5 md:grid-cols-2">
                <div>
                  <h4 className="text-orange-600 font-bold uppercase text-xs tracking-widest mb-4">Chuyên môn chính</h4>
                  <ul className="space-y-2">
                    {activePT.specialties.map((spec, index) => (
                      <li key={index} className="flex items-center gap-2 text-slate-700 font-medium">
                        <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Phân công theo gói</p>
                  <p className="text-lg font-black text-slate-900">
                    {packageLabelBySlug[activePT.package_slug] || 'Huấn luyện viên chưa được gán gói'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Trang này chỉ hiển thị thông tin huấn luyện viên, không có chức năng đặt lịch tập.
                  </p>
                </div>
              </div>
            </div>
              </>
            )}
          </div>

        </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Trainers