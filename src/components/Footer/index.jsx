import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="mb-4 block text-2xl font-black italic tracking-tighter text-orange-600">
            POWER<span className="text-slate-900">GYM</span>
          </Link>
          <p className="text-sm leading-relaxed text-slate-600">
            Không gian tập luyện hiện đại với giao diện rõ ràng và các trang riêng cho từng nhu cầu.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-orange-600">Khám phá</h4>
          <ul className="space-y-3 text-sm font-semibold text-slate-700">
            <li><Link to="/" className="hover:text-orange-600">Trang chủ</Link></li>
            <li><Link to="/pricing" className="hover:text-orange-600">Gói tập</Link></li>
            <li><Link to="/trainers" className="hover:text-orange-600">Huấn luyện viên</Link></li>
            <li><Link to="/contact" className="hover:text-orange-600">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-orange-600">Hội viên</h4>
          <ul className="space-y-3 text-sm font-semibold text-slate-700">
            <li><Link to="/me" className="hover:text-orange-600">Hồ sơ của tôi</Link></li>
            <li><Link to="/member-portal" className="hover:text-orange-600">Member Portal</Link></li>
            <li><Link to="/admin-portal" className="hover:text-orange-600">Admin Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-orange-600">Liên hệ</h4>
          <div className="space-y-2 text-sm font-medium text-slate-700">
            <p>Số 1 UTC, Cầu Giấy, Hà Nội</p>
            <p>Hotline: 1900 6789</p>
            <p>Email: contact@powergym.io</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 md:flex-row md:items-center">
          <p>© 2026 Power Gym Project</p>
          <p>All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;