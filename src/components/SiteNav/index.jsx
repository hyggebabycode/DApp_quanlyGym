import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { session } from "../../api";

const navItems = [
  { to: "/", label: "Trang chu" },
  { to: "/pricing", label: "Goi tap" },
  { to: "/trainers", label: "HLV" },
  { to: "/contact", label: "Lien he" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = session.user;

  const logout = () => {
    session.clear();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link
          to="/"
          className="font-display text-3xl font-semibold uppercase tracking-tight text-slate-950"
        >
          Power<span className="text-orange-600">Gym</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-2 py-2 shadow-sm md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] transition ${
                  isActive
                    ? "bg-orange-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
                <span className="font-semibold text-slate-900">
                  {user.full_name || user.username}
                </span>
                <span className="ml-2 text-slate-500">
                  {user.role === "admin" ? "Admin" : "Member"}
                </span>
              </div>
              <Link
                to={user.role === "admin" ? "/admin-portal" : "/member-portal"}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
              >
                {user.role === "admin" ? "Admin portal" : "Tai khoan"}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-red-300 hover:text-red-600"
              >
                Dang xuat
              </button>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-orange-300 hover:text-orange-600"
              >
                Dang ky
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-orange-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-700"
              >
                Dang nhap
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={open ? "Dong menu" : "Mo menu"}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm md:hidden"
        >
          <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-900">
            {open ? "X" : "|||"}
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.18em] ${
                    isActive
                      ? "bg-orange-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {user ? (
              <>
                <Link
                  to={user.role === "admin" ? "/admin-portal" : "/member-portal"}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
                >
                  {user.role === "admin" ? "Admin portal" : "Tai khoan"}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                >
                  Dang xuat
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                >
                  Dang ky
                </Link>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl bg-orange-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white"
                >
                  Dang nhap
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
