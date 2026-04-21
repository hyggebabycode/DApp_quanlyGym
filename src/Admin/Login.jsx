import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, session } from "../api";
import {
  connectMetaMaskWallet,
  signWalletMessage,
} from "../web3/gymPaymentContract";

const storeAndRedirect = (token, user, navigate) => {
  session.setAuth(token, user);
  navigate(user.role === "admin" ? "/admin-portal" : "/member-portal");
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await api.login(form);
    if (result.error) {
      setMessage(result.error);
    } else {
      storeAndRedirect(result.token, result.user, navigate);
    }

    setLoading(false);
  };

  const handleWalletLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { address } = await connectMetaMaskWallet();
      const challenge = await api.getWalletChallenge(address);

      if (challenge.error) {
        setMessage(challenge.error);
        setLoading(false);
        return;
      }

      const { signature } = await signWalletMessage(challenge.message);
      const result = await api.verifyWalletLogin({
        walletAddress: address,
        signature,
      });

      if (result.error) {
        setMessage(result.error);
      } else {
        storeAndRedirect(result.token, result.user, navigate);
      }
    } catch (error) {
      setMessage(error?.message || "Khong the dang nhap voi MetaMask.");
    }

    setLoading(false);
  };

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-10 md:px-6">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card rounded-[2rem] p-8 md:p-10">
            <p className="section-heading">Dang nhap</p>
            <h1 className="mt-4 text-5xl font-semibold uppercase text-slate-950 md:text-6xl">
              Quay lai voi
              <span className="block text-orange-600">PowerGym</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Ban co the dang nhap bang username/password hoac bang chu ky so tu
              MetaMask. Neu vi admin duoc su dung, he thong se vao thang admin
              portal.
            </p>
            <div className="mt-8 space-y-3">
              <div className="metric-card">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Cach 1
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  Dang nhap bang tai khoan da dang ky.
                </p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Cach 2
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  Dang nhap bang MetaMask qua challenge + signature.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handlePasswordLogin}
            className="glass-card rounded-[2rem] p-8 md:p-10"
          >
            <p className="section-heading">Tai khoan</p>
            <h2 className="mt-4 text-4xl font-semibold uppercase text-slate-950">
              Dang nhap ngay
            </h2>

            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Username
                </span>
                <input
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  placeholder="admin"
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
                  placeholder="••••••••"
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
                {loading ? "Dang xu ly..." : "Dang nhap"}
              </button>
              <button
                type="button"
                onClick={handleWalletLogin}
                disabled={loading}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-900 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Dang nhap voi MetaMask
              </button>
            </div>

            <p className="mt-6 text-sm text-slate-600">
              Chua co tai khoan?{" "}
              <Link to="/register" className="font-bold text-orange-600">
                Dang ky tai day
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
