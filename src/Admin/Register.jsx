import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const initialForm = {
  fullName: "",
  username: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("Password va xac nhan password khong khop.");
      return;
    }

    setLoading(true);
    const result = await api.register({
      fullName: form.fullName,
      username: form.username,
      password: form.password,
    });

    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setMessage("Dang ky thanh cong. He thong se chuyen sang trang dang nhap.");
    setForm(initialForm);
    setLoading(false);
    setTimeout(() => navigate("/login"), 1200);
  };

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card rounded-[2rem] p-8 md:p-10">
            <p className="section-heading">Dang ky</p>
            <h1 className="mt-4 text-5xl font-semibold uppercase text-slate-950 md:text-6xl">
              Tao tai khoan
              <span className="block text-orange-600">de bat dau tap</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Sau khi dang ky, ban co the dang nhap, lien ket MetaMask va thanh
              toan goi tap ngay tren Sapphire Testnet.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-[2rem] p-8 md:p-10"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Ho ten
                </span>
                <input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  placeholder="Nguyen Van A"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Username
                </span>
                <input
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  placeholder="nguyenvana"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Password
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  required
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Xac nhan password
                </span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  required
                />
              </label>
            </div>

            {message && (
              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700">
                {message}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Dang tao tai khoan..." : "Tao tai khoan"}
              </button>

              <Link
                to="/login"
                className="rounded-2xl border border-slate-300 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400"
              >
                Quay lai dang nhap
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
