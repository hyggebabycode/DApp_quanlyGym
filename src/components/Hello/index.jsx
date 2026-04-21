import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import SiteNav from "../SiteNav";
import Footer from "../Footer";
import backgroundGymImage from "../../assets/backgroundgym-hero.jpg";
import {
  getPackageBadgeLabel,
  getPackageDisplayName,
  PACKAGE_ORDER,
} from "../../utils/packageMeta";

export default function GymWebsite() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const loadPackages = async () => {
      const result = await api.getPackages();
      if (!result.error) {
        setPackages(result.packages || []);
      }
    };

    loadPackages();
  }, []);

  const featuredPackages = useMemo(() => {
    return PACKAGE_ORDER
      .map((slug) => packages.find((item) => item.slug === slug))
      .filter(Boolean);
  }, [packages]);

  return (
    <div className="app-shell">
      <SiteNav />

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <div className="status-pill">Light-theme gym dApp on Sapphire</div>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold uppercase leading-[0.95] text-slate-950 md:text-7xl">
              Mot website gym
              <span className="block text-orange-600">hoan chinh de chay that</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Trang nay ket hop web gym thong thuong voi dang nhap dang ky,
              payment bang MetaMask tren Oasis Sapphire Testnet va dashboard
              rieng cho admin/member. Muc tieu la flow ro rang, de dung va de
              demo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/pricing"
                className="rounded-2xl bg-orange-600 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-700"
              >
                Thanh toan goi tap
              </Link>
              <Link
                to="/contact"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-slate-900 transition hover:border-orange-300 hover:text-orange-600"
              >
                Nhan tu van
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { value: "3", label: "Goi tap dang ban" },
                { value: "2", label: "Portal rieng" },
                { value: "TEST", label: "Thanh toan tren Sapphire" },
              ].map((item) => (
                <div key={item.label} className="metric-card">
                  <p className="text-3xl font-black text-slate-950">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card overflow-hidden rounded-[2rem]">
            <div className="grid h-full md:grid-cols-[1.05fr_0.95fr]">
              <div className="bg-linear-to-br from-orange-100 via-white to-sky-100 p-8">
                <p className="section-heading">Overview</p>
                <h2 className="mt-5 text-4xl font-semibold uppercase text-slate-950">
                  Menu ro, form ro, payment ro
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Moi phan chinh deu tach thanh page rieng: trang chu, bang
                  gia, huan luyen vien, lien he, member portal va admin portal.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    "Dang ky tai khoan bang username/password",
                    "Dang nhap va lien ket MetaMask bang chu ky so",
                    "Thanh toan on-chain va dong bo lich su local",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/80 bg-white/85 px-4 py-4 text-sm font-semibold text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[24rem] bg-slate-100">
                <img
                  src={backgroundGymImage}
                  alt="PowerGym hero"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/80 to-transparent p-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-orange-300">
                    Payment-ready
                  </p>
                  <p className="mt-2 text-2xl font-semibold uppercase">
                    MetaMask + Sapphire Testnet
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 md:px-6">
          <div className="glass-card rounded-[2rem] p-8 md:p-10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="section-heading">Bang gia</p>
                <h2 className="mt-3 text-4xl font-semibold uppercase text-slate-950">
                  Goi tap dong bo tu database
                </h2>
              </div>
              <Link
                to="/pricing"
                className="rounded-2xl border border-slate-300 px-5 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-slate-900 transition hover:border-orange-300 hover:text-orange-600"
              >
                Xem bang gia
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {featuredPackages.length > 0 ? (
                featuredPackages.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      {getPackageBadgeLabel(item.slug)}
                    </p>
                    <h3 className="mt-3 text-3xl font-semibold uppercase text-slate-950">
                      {getPackageDisplayName(item.slug, item.name)}
                    </h3>
                    <p className="mt-3 text-2xl font-black text-orange-600">
                      {item.price}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {item.name}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(item.features || []).slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 md:col-span-3">
                  Chua tai duoc goi tap. Ban van co the mo trang pricing sau khi
                  khoi dong backend.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Goi tap",
                text: "Xem gia TEST, ket noi MetaMask, thanh toan va dong bo payment vao database.",
                href: "/pricing",
              },
              {
                title: "HLV",
                text: "Danh sach huan luyen vien duoc quan ly tu admin portal va hien thi theo goi.",
                href: "/trainers",
              },
              {
                title: "Lien he",
                text: "Form tu van luu ve backend de admin xem va cham lai khach hang.",
                href: "/contact",
              },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className="glass-card rounded-[1.75rem] p-6 transition hover:-translate-y-1"
              >
                <p className="section-heading">Kham pha</p>
                <h3 className="mt-4 text-3xl font-semibold uppercase text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {item.text}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
