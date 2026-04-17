import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import bgGym from "../../../img/backgroundgym.jpg";
import SiteNav from "../SiteNav/index";
import Footer from "../Footer/index";
import { api } from "../../api";

const packageOrder = ["basic", "pro", "vip"];

const formatPrice = (value) => {
  const normalized = Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Liên hệ";
  }

  return `${normalized.toLocaleString("vi-VN")} VNĐ`;
};

const GymWebsite = () => {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const result = await api.getPackages();
        const nextPackages = (result?.packages || [])
          .filter((item) => item.is_active)
          .sort((a, b) => packageOrder.indexOf(a.slug) - packageOrder.indexOf(b.slug));
        setPackages(nextPackages);
      } catch (error) {
        setPackages([]);
      }
    };

    loadPackages();
  }, []);

  const homepagePackages = useMemo(() => {
    return packageOrder
      .map((slug) => packages.find((item) => item.slug === slug))
      .filter(Boolean)
      .slice(0, 3);
  }, [packages]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 pt-32 pb-20">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-orange-700">
              Phòng tập hiện đại
            </span>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.02em] text-slate-900 md:text-6xl">
              Không gian tập luyện
              <span className="mt-2 block text-orange-600">
                Dễ hiểu, dễ dùng, dễ bắt đầu
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-700">
              Trang chủ này giữ vai trò giới thiệu tổng quan, còn các mục chi tiết như gói tập, huấn luyện viên và liên hệ được tách thành trang riêng để bạn bấm là đi ngay.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/pricing" className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-orange-200/50 transition-all hover:bg-orange-700">
                Xem gói tập
              </Link>
              <Link to="/contact" className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 font-black uppercase tracking-widest text-slate-900 transition-all hover:border-slate-400">
                Đăng ký tư vấn
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
              {[
                { value: '3', label: 'Gói tập chính' },
                { value: '8+', label: 'Gói trên mỗi trang' },
                { value: '24/7', label: 'Truy cập linh hoạt' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-3xl font-black text-slate-900">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-xl">
            <div className="absolute inset-0 bg-linear-to-br from-orange-50 via-white to-slate-100"></div>
            <img src={bgGym} alt="Phòng tập" className="relative h-full min-h-105 w-full object-cover opacity-85" />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/80 via-slate-950/35 to-transparent p-6 text-white">
              <p className="text-[10px] uppercase tracking-[0.35em] text-orange-300">POWER GYM</p>
              <h2 className="mt-2 text-2xl font-black uppercase">Bố cục rõ ràng, thao tác nhanh</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                Menu chuyển trang riêng, trang chủ chỉ giới thiệu tổng quan và đưa người dùng tới đúng phần họ cần.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: 'Giới thiệu nhanh',
              text: 'Xem tổng quan về hệ thống, điểm mạnh và trải nghiệm cơ bản của website.',
              href: '/pricing'
            },
            {
              title: 'Huấn luyện viên',
              text: 'Xem danh sách HLV theo trang riêng, không còn nhồi toàn bộ vào một màn hình.',
              href: '/trainers'
            },
            {
              title: 'Liên hệ',
              text: 'Gửi thông tin tư vấn hoặc đăng ký nhanh theo form riêng biệt.',
              href: '/contact'
            }
          ].map((item) => (
            <Link key={item.title} to={item.href} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-600">Khám phá</p>
              <h3 className="mt-3 text-2xl font-black italic uppercase text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.text}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
                Đi tới trang
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-20 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-600">Giá gói tập</p>
              <h2 className="mt-3 text-3xl font-black italic uppercase text-slate-900 md:text-4xl">
                Cập nhật theo database
              </h2>
            </div>
            <Link
              to="/pricing"
              className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-black uppercase tracking-widest text-slate-900 transition-all hover:border-slate-400"
            >
              Xem chi tiết
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {homepagePackages.length > 0 ? (
              homepagePackages.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Gói {item.slug}</p>
                  <h3 className="mt-2 text-2xl font-black uppercase text-slate-900">{item.name}</h3>
                  <p className="mt-3 text-xl font-black text-orange-600">{formatPrice(item.price)}/Tháng</p>
                </article>
              ))
            ) : (
              <p className="md:col-span-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                Chưa có dữ liệu gói tập khả dụng. Vui lòng kiểm tra lại dữ liệu trong trang Admin.
              </p>
            )}
          </div>
        </section>

        <section className="mt-20 rounded-4xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-600">Tại sao chọn trang này</p>
              <h2 className="mt-4 text-4xl font-black italic uppercase text-slate-900 md:text-5xl">
                Giao diện cơ bản cho web bình thường
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                'Trang chủ giới thiệu tổng quan',
                'Trang gói tập riêng biệt',
                'Trang huấn luyện viên riêng biệt',
                'Trang liên hệ riêng biệt'
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GymWebsite;