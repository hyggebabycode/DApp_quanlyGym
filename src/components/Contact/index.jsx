import { useState } from "react";
import SiteNav from "../SiteNav";
import Footer from "../Footer";
import { api } from "../../api";
import { getPackageDisplayName } from "../../utils/packageMeta";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  packageSlug: "basic",
  packageName: "STANDARD",
  message: "",
};

const packageOptions = [
  { slug: "basic", name: "STANDARD" },
  { slug: "pro", name: "PRO" },
  { slug: "vip", name: "VIP" },
];

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePackageChange = (slug) => {
    const selected = packageOptions.find((item) => item.slug === slug);
    setForm((current) => ({
      ...current,
      packageSlug: slug,
      packageName: selected?.name || current.packageName,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await api.submitContact(form);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(result.message || "Da gui yeu cau tu van.");
      setForm(initialForm);
    }

    setLoading(false);
  };

  return (
    <div className="app-shell">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="glass-card rounded-[2rem] p-8 md:p-10">
            <p className="section-heading">Lien he</p>
            <h1 className="mt-4 text-5xl font-semibold uppercase text-slate-950 md:text-6xl">
              Bat dau voi mot
              <span className="block text-orange-600">cuoc tu van ro rang</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Form nay gui thong tin ve backend de admin xem trong dashboard.
              Ban co the dung no de xin tu van, dat lich trao doi hoac chon goi
              truoc khi thanh toan.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Dia chi", value: "So 1 UTC, Cau Giay, Ha Noi" },
                { label: "Hotline", value: "1900 6789" },
                { label: "Email", value: "contact@powergym.local" },
                { label: "Network", value: "Oasis Sapphire Testnet" },
              ].map((item) => (
                <div key={item.label} className="metric-card">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glass-card rounded-[2rem] p-8 md:p-10"
          >
            <p className="section-heading">Form</p>
            <h2 className="mt-4 text-4xl font-semibold uppercase text-slate-950">
              Gui thong tin ngay
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Ho ten
                </span>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  placeholder="Nguyen Van A"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  So dien thoai
                </span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  placeholder="09xx xxx xxx"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Email
                </span>
                <input
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  placeholder="email@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                  Goi quan tam
                </span>
                <select
                  value={form.packageSlug}
                  onChange={(event) => handlePackageChange(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                  required
                >
                  {packageOptions.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {getPackageDisplayName(item.slug, item.name)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Noi dung
              </span>
              <textarea
                rows="6"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
                placeholder="Ban muon tu van muc tieu tap luyen, goi tap hay quy trinh thanh toan?"
              />
            </label>

            {message && (
              <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700">
                {message}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Dang gui..." : "Gui yeu cau"}
              </button>
              <button
                type="button"
                onClick={() => setForm(initialForm)}
                className="rounded-2xl border border-slate-300 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400"
              >
                Dat lai form
              </button>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}
