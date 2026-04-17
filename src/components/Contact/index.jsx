import React, { useState } from "react";
import SiteNav from '../SiteNav/index'
import Footer from '../Footer/index'

const Contact = () => {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', package: 'Gói Cơ Bản' })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Yêu cầu tư vấn đã gửi', formData)
    setSubmitted(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }))
  }


  return (
    <div>
      <section
        id="contact"
        className="relative overflow-hidden border-t border-slate-200 bg-linear-to-b from-white to-slate-100 px-4 py-24 text-slate-900"
      >
        <SiteNav />
        {/* Hiệu ứng ánh sáng nền (thay cho ảnh) */}
        <div className="absolute bottom-0 right-0 h-125 w-125 rounded-full bg-orange-500/20 blur-[150px]"></div>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
        {/* CỘT 1: GIỚI THIỆU */}
        <div className="animate-in fade-in duration-700">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.4em] text-orange-500">
            Gia nhập cộng đồng
          </h2>
          <h1 className="mb-8 text-6xl font-black italic uppercase leading-[0.9] md:text-8xl">
            BẮT ĐẦU <br /> <span className="text-orange-600">THAY ĐỔI</span>
          </h1>
          <p className="mb-12 max-w-md text-lg leading-relaxed text-slate-700">
            Đăng ký tư vấn và sở hữu thẻ NFT để nhận đặc quyền hội viên vĩnh
            viễn.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center border border-slate-300 bg-white">
                <span className="font-bold italic text-orange-500">A</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  Địa chỉ
                </p>
                <p className="font-bold">Số 1 UTC, Cầu Giấy, Hà Nội</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center border border-slate-300 bg-white">
                <span className="font-bold italic text-orange-500">P</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  Hotline
                </p>
                <p className="font-bold">1900 6789</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-125 items-center border border-slate-200 bg-white p-8 backdrop-blur-sm shadow-sm">
          {!submitted ? (
            <form className="w-full space-y-6 animate-in fade-in duration-500" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Họ và tên
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-slate-300 bg-white p-4 outline-none transition-all focus:border-orange-600"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Số điện thoại
                </label>
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="0912 345 xxx"
                  className="w-full border border-slate-300 bg-white p-4 outline-none transition-all focus:border-orange-600"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Gói tập quan tâm
                </label>
                <select
                  name="package"
                  value={formData.package}
                  onChange={handleChange}
                  className="w-full border border-slate-300 bg-white p-4 text-slate-800 outline-none transition-all focus:border-orange-600"
                >
                  <option>Gói Cơ Bản</option>
                  <option>Gói Chuyên Nghiệp</option>
                  <option>Gói VIP</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-orange-600 py-5 text-white font-black uppercase tracking-[0.2em] transition-all hover:bg-orange-500">
                Gửi yêu cầu tư vấn
              </button>
            </form>
          ) : (
            <div className="w-full text-center animate-in zoom-in duration-500">
              <h3 className="mb-3 text-2xl font-black uppercase">Yêu cầu tư vấn đã được gửi!</h3>
              <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-slate-600">
                Chúng tôi sẽ liên hệ lại bạn trong thời gian sớm nhất.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full bg-slate-900 text-white px-6 py-4 font-black uppercase tracking-widest transition-all hover:bg-orange-600"
              >
                Gửi yêu cầu khác
              </button>
            </div>
          )}
        </div>
      </div>
      </section>
      <Footer />
    </div>
  );
};

export default Contact;