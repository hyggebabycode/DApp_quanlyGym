import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import bgGym from '../../../img/backgroundgym.jpg'
import SiteNav from '../SiteNav/index'
import Footer from '../Footer/index'
import {
  connectMetaMaskWallet,
  getPackagePriceEth,
  isGymPaymentConfigured,
  payPackageWithMetaMask
} from '../../web3/gymPaymentContract'

const packageOrder = ['basic', 'pro', 'vip']

const faqs = [
  {
    q: 'Bao lâu thì yêu cầu được duyệt?',
    a: 'Thông thường trong giờ làm việc, admin sẽ phản hồi trong 24 giờ.'
  },
  {
    q: 'Có thể đổi gói sau khi đăng ký không?',
    a: 'Có. Bạn gửi yêu cầu đổi gói và admin sẽ cập nhật theo tình trạng thành viên.'
  },
  {
    q: 'MetaMask có bắt buộc không?',
    a: 'Không bắt buộc với bản demo, nhưng hữu ích nếu dự án của bạn muốn gắn Web3.'
  }
]

const Pricing = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [packages, setPackages] = useState([])
  const [activeTab, setActiveTab] = useState('pro')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [packagesError, setPackagesError] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [onChainStatus, setOnChainStatus] = useState({})
  const [onChainLoadingSlug, setOnChainLoadingSlug] = useState('')

  useEffect(() => {
    const loadPackages = async () => {
      setPackagesLoading(true)
      setPackagesError('')

      try {
        const result = await api.getPackages()
        if (result.error) {
          setPackagesError(result.error)
        } else {
          const sortedPackages = [...(result.packages || [])].sort((first, second) => {
            const firstIndex = packageOrder.indexOf(first.slug)
            const secondIndex = packageOrder.indexOf(second.slug)
            const normalizedFirstIndex = firstIndex === -1 ? packageOrder.length : firstIndex
            const normalizedSecondIndex = secondIndex === -1 ? packageOrder.length : secondIndex

            return normalizedFirstIndex - normalizedSecondIndex || Number(first.id) - Number(second.id)
          })

          setPackages(sortedPackages)

          setActiveTab((current) => {
            const currentExists = sortedPackages.some((item) => item.slug === current)
            return currentExists ? current : sortedPackages[0]?.slug || 'pro'
          })
        }
      } catch (err) {
        setPackagesError('Không thể tải dữ liệu gói từ database.')
      } finally {
        setPackagesLoading(false)
      }
    }

    loadPackages()
  }, [])

  useEffect(() => {
    if (!location.hash) {
      return
    }

    const targetSlug = location.hash.replace('#pricing-', '')
    if (!packageOrder.includes(targetSlug)) {
      return
    }

    setActiveTab(targetSlug)
  }, [location.hash])

  const displayedPackages = packages
  const packageMenu = packageOrder
    .map((slug) => displayedPackages.find((plan) => plan.slug === slug))
    .filter(Boolean)
  const activePlan =
    displayedPackages.find((item) => item.slug === activeTab) ||
    packageMenu[0] ||
    displayedPackages[0]

  const renderPackageImage = (plan) => {
    if (!plan.image_url) {
      return null
    }

    return (
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <img
          src={plan.image_url}
          alt={plan.name}
          className="h-44 w-full object-cover"
        />
      </div>
    )
  }

  const getPackageAccent = (slug) => {
    if (slug === 'basic') return 'from-slate-50 to-slate-100 border-slate-200'
    if (slug === 'pro') return 'from-orange-50 to-orange-100 border-orange-200'
    return 'from-yellow-50 to-yellow-100 border-yellow-200'
  }

  const getSubPackageLabel = (slug, index) => {
    const baseLabels = {
      basic: ['Starter', 'Daily Access', 'Locker'],
      pro: ['Priority', 'Coach Plus', 'Nutrition'],
      vip: ['Elite', 'Private', 'Platinum']
    }

    return baseLabels[slug]?.[index] || `Option ${index + 1}`
  }

  const getPackageHighlights = (plan) => {
    const chunkSize = 2
    const chunked = []
    for (let index = 0; index < plan.features.length; index += chunkSize) {
      chunked.push(plan.features.slice(index, index + chunkSize))
    }
    return chunked
  }

  const handleRegisterNow = (packageSlug) => {
    setActiveTab(packageSlug)
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    } else {
      setShowModal(true)
    }
  }

  const handleConnectWallet = async () => {
    try {
      const { address } = await connectMetaMaskWallet()
      setWalletAddress(address)
    } catch (err) {
      setPackagesError(err?.message || 'Không thể kết nối MetaMask.')
    }
  }

  const handlePayWithMetaMask = async (plan) => {
    setPackagesError('')
    setOnChainLoadingSlug(plan.slug)

    setOnChainStatus((current) => ({
      ...current,
      [plan.slug]: 'Đang chuẩn bị giao dịch...'
    }))

    try {
      const { address } = await connectMetaMaskWallet()
      setWalletAddress(address)

      const priceInfo = await getPackagePriceEth(plan.slug)
      setOnChainStatus((current) => ({
        ...current,
        [plan.slug]: `Giá on-chain: ${priceInfo.eth} ETH. Vui lòng xác nhận trong MetaMask...`
      }))

      const txResult = await payPackageWithMetaMask(plan.slug)

      setOnChainStatus((current) => ({
        ...current,
        [plan.slug]: `Thanh toán thành công. Tx: ${txResult.txHash}`
      }))
    } catch (err) {
      setOnChainStatus((current) => ({
        ...current,
        [plan.slug]: `Lỗi thanh toán: ${err?.message || 'Không xác định'}`
      }))
    } finally {
      setOnChainLoadingSlug('')
    }
  }

  const handleSubmitRequest = async () => {
    setLoading(true)
    setMessage('')

    try {
      const result = await api.createPackageRequest({
        packageSlug: activePlan.slug,
        packageName: activePlan.name,
        packagePrice: activePlan.price,
        packageFeatures: activePlan.features
      })
      if (result.error) {
        setMessage(`Lỗi: ${result.error}`)
      } else {
        setMessage('✓ Yêu cầu được gửi thành công! Admin sẽ duyệt trong thời gian sớm nhất.')
        setTimeout(() => {
          setShowModal(false)
        }, 2000)
      }
    } catch (err) {
      setMessage('Lỗi kết nối server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <section
        id="pricing"
        className="py-24 px-4 border-t border-slate-200 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.9), rgba(248, 250, 252, 0.94)), url(${bgGym})`
        }}
      >
        <SiteNav />
        <div className="max-w-7xl mx-auto">
        {packagesError && (
          <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {packagesError}
          </div>
        )}

        {isGymPaymentConfigured() ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div>
              <p className="font-bold">Smart contract payment đã sẵn sàng</p>
              <p>
                {walletAddress
                  ? `Ví đã kết nối: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : 'Kết nối ví để thanh toán trực tiếp bằng MetaMask.'}
              </p>
            </div>
            <button
              onClick={handleConnectWallet}
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 font-bold text-emerald-700 hover:bg-emerald-100"
            >
              {walletAddress ? 'Đổi ví' : 'Kết nối MetaMask'}
            </button>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Chưa cấu hình smart contract. Hãy set biến môi trường VITE_GYM_PAYMENT_CONTRACT_ADDRESS để bật thanh toán MetaMask.
          </div>
        )}

        <div className="text-center mb-14">
          <h2 className="text-orange-600 font-bold tracking-[0.35em] uppercase mb-4 text-xs">Bảng giá</h2>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase leading-none text-slate-900">Chọn gói tập phù hợp mục tiêu</h1>
          <p className="mt-5 text-slate-700 max-w-2xl mx-auto">
            Mỗi gói được thiết kế theo cấp độ tập luyện khác nhau, từ người mới đến hội viên cần trải nghiệm cao cấp.
          </p>
        </div>

        {packagesLoading ? (
          <div className="mb-14 rounded-2xl border border-slate-200 bg-white/90 p-8 text-center text-slate-700 backdrop-blur-sm">
            Đang tải gói tập từ database...
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-14">
          {displayedPackages.map((plan) => {
            const packageChunks = getPackageHighlights(plan)

            return (
              <article
                key={plan.id}
                id={`pricing-${plan.slug}`}
                className={`overflow-hidden rounded-4xl border bg-linear-to-b ${getPackageAccent(plan.slug)} shadow-sm`}
              >
                <div className="p-6 md:p-7">
                  {renderPackageImage(plan)}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 mb-2">Gói {plan.slug}</p>
                      <h3 className="text-3xl font-black italic text-slate-900 uppercase">{plan.name}</h3>
                      <p className="mt-2 text-sm text-slate-700">Thiết kế riêng cho nhóm hội viên {plan.slug === 'basic' ? 'mới bắt đầu' : plan.slug === 'pro' ? 'muốn nâng cấp' : 'ưu tiên cao nhất'}.</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-3xl font-black text-orange-600">{plan.price}</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">VNĐ / Tháng</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {packageChunks.map((chunk, index) => (
                      <div key={`${plan.slug}-${index}`} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
                          {getSubPackageLabel(plan.slug, index)}
                        </p>
                        <div className="space-y-2">
                          {chunk.map((feature) => (
                            <div key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="mt-1 text-orange-600 font-black">•</span>
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRegisterNow(plan.slug)}
                      className="w-full rounded-xl bg-orange-600 px-4 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200/50 hover:bg-orange-700"
                    >
                      Đăng ký
                    </button>
                    {isGymPaymentConfigured() && (
                      <button
                        onClick={() => handlePayWithMetaMask(plan)}
                        disabled={onChainLoadingSlug === plan.slug}
                        className="w-full rounded-xl border border-emerald-500 bg-emerald-600 px-4 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {onChainLoadingSlug === plan.slug ? 'Đang thanh toán...' : 'Thanh toán MetaMask'}
                      </button>
                    )}
                  </div>

                  {onChainStatus[plan.slug] && (
                    <p className="mt-3 text-xs text-slate-700 break-all">{onChainStatus[plan.slug]}</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
          <div className="bg-white/90 border border-slate-200 rounded-2xl p-8 overflow-x-auto backdrop-blur-sm shadow-sm">
            <h3 className="text-2xl font-black italic uppercase mb-6 text-slate-900">So sánh gói</h3>
            <table className="w-full text-left min-w-160">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.3em] text-slate-500 border-b border-slate-200">
                  <th className="py-3 pr-4">Trường</th>
                  {packageMenu.map((plan) => (
                    <th key={plan.slug} className="py-3 pr-4 text-orange-600">{plan.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: 'Tên gói',
                    values: packageMenu.map((plan) => plan.name)
                  },
                  {
                    label: 'Giá / tháng',
                    values: packageMenu.map((plan) => plan.price)
                  },
                  {
                    label: 'Số quyền lợi',
                    values: packageMenu.map((plan) => `${plan.features.length}`)
                  },
                  {
                    label: 'Trạng thái',
                    values: packageMenu.map((plan) => (plan.is_active ? 'Hoạt động' : 'Ẩn'))
                  }
                ].map((row) => (
                  <tr key={row.label} className="border-b border-slate-200 text-sm align-top">
                    <td className="py-4 pr-4 text-slate-600 font-bold">{row.label}</td>
                    {row.values.map((value, index) => (
                      <td key={index} className="py-4 pr-4 text-slate-900">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="bg-white/90 border border-slate-200 rounded-2xl p-8 backdrop-blur-sm shadow-sm">
              <h3 className="text-2xl font-black italic uppercase mb-4 text-slate-900">Quy trình đăng ký</h3>
              <ol className="space-y-4 text-slate-700">
                <li className="flex gap-3"><span className="text-orange-600 font-black">01</span> Chọn gói phù hợp.</li>
                <li className="flex gap-3"><span className="text-orange-600 font-black">02</span> Đăng nhập để gửi yêu cầu.</li>
                <li className="flex gap-3"><span className="text-orange-600 font-black">03</span> Admin duyệt và cập nhật profile.</li>
              </ol>
            </div>

            <div className="bg-white/90 border border-slate-200 rounded-2xl p-8 backdrop-blur-sm shadow-sm">
              <h3 className="text-2xl font-black italic uppercase mb-4 text-slate-900">Câu hỏi nhanh</h3>
              <div className="space-y-4">
                {faqs.map((item) => (
                  <div key={item.q} className="border-b border-slate-200 pb-4 last:border-none last:pb-0">
                    <p className="font-bold text-slate-900 mb-2">{item.q}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full backdrop-blur-sm shadow-lg">
              <h2 className="text-2xl font-black text-orange-600 mb-4">Yêu cầu gói tập</h2>

              <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-200">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Gói được chọn</p>
                <p className="text-xl font-bold text-slate-900">{activePlan.name}</p>
                <p className="text-lg text-orange-600 font-black">{activePlan.price} VNĐ/Tháng</p>
              </div>

              {message && (
                <div
                  className={`p-3 rounded mb-4 text-sm ${
                    message.includes('✓')
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message}
                </div>
              )}

              <p className="text-slate-700 text-sm mb-6 leading-relaxed">
                Nhấn xác nhận để gửi yêu cầu. Admin sẽ xem xét và phản hồi trong thời gian sớm nhất.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-bold disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Pricing