import { useEffect, useMemo, useState } from "react";
import SiteNav from "../SiteNav";
import Footer from "../Footer";
import { api } from "../../api";
import backgroundGymImage from "../../assets/backgroundgym-hero.jpg";
import { getPackageDisplayName } from "../../utils/packageMeta";

const filters = [
  { slug: "basic", label: "Standard" },
  { slug: "pro", label: "Pro" },
  { slug: "vip", label: "VIP" },
];

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("basic");
  const [activeTrainerId, setActiveTrainerId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadTrainers = async () => {
      const result = await api.getTrainers();
      if (result.error) {
        setMessage(result.error);
        return;
      }

      const next = result.trainers || [];
      setTrainers(next);
      setActiveTrainerId(next[0]?.id || null);
    };

    loadTrainers();
  }, []);

  const filtered = useMemo(
    () => trainers.filter((trainer) => trainer.package_slug === activeFilter),
    [activeFilter, trainers],
  );

  const activeTrainer =
    filtered.find((trainer) => trainer.id === activeTrainerId) || filtered[0] || null;

  useEffect(() => {
    if (!filtered.some((trainer) => trainer.id === activeTrainerId)) {
      setActiveTrainerId(filtered[0]?.id || null);
    }
  }, [activeTrainerId, filtered]);

  return (
    <div className="app-shell">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <section className="glass-card rounded-[2rem] p-8 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-heading">Huong dan vien</p>
              <h1 className="mt-3 text-5xl font-semibold uppercase text-slate-950 md:text-6xl">
                Chon dung
                <span className="block text-orange-600">nguoi dong hanh</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              {filters.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setActiveFilter(item.slug)}
                  className={`rounded-full px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
                    activeFilter === item.slug
                      ? "bg-orange-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700">
              {message}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              {filtered.length > 0 ? (
                filtered.map((trainer) => (
                  <button
                    key={trainer.id}
                    type="button"
                    onClick={() => setActiveTrainerId(trainer.id)}
                    className={`flex w-full items-start gap-4 rounded-[1.5rem] border p-4 text-left transition ${
                      activeTrainer?.id === trainer.id
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.25rem] bg-slate-100">
                      {trainer.image_url ? (
                        <img
                          src={trainer.image_url}
                          alt={trainer.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={backgroundGymImage}
                          alt={trainer.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                        {trainer.role}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold uppercase text-slate-950">
                        {trainer.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {trainer.experience}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
                  Chua co huan luyen vien cho goi nay. Ban co the them trong
                  admin portal.
                </div>
              )}
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 md:p-8">
              {activeTrainer ? (
                <>
                  <div className="overflow-hidden rounded-[1.5rem] bg-slate-100">
                    {activeTrainer.image_url ? (
                      <img
                        src={activeTrainer.image_url}
                        alt={activeTrainer.name}
                        className="h-80 w-full object-cover"
                      />
                    ) : (
                      <img
                        src={backgroundGymImage}
                        alt={activeTrainer.name}
                        className="h-80 w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                      {getPackageDisplayName(
                        activeTrainer.package_slug,
                        activeTrainer.package_slug || "general",
                      )}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600">
                      {activeTrainer.achievement}
                    </span>
                  </div>

                  <h2 className="mt-5 text-5xl font-semibold uppercase text-slate-950">
                    {activeTrainer.name}
                  </h2>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.28em] text-slate-500">
                    {activeTrainer.nickname}
                  </p>
                  <p className="mt-5 text-base leading-8 text-slate-600">
                    {activeTrainer.bio}
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Chuyen mon
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(activeTrainer.specialties || []).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Cam ket
                      </p>
                      <p className="mt-4 text-base leading-7 text-slate-600">
                        Moi huan luyen vien duoc gan voi goi tap cu the de admin
                        co the quan ly va cap nhat de dang.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-slate-600">
                  Chon mot huan luyen vien de xem chi tiet.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
