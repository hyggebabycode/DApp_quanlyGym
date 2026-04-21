import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, session } from "../api";
import { shortAddress } from "../web3/gymPaymentContract";

const tabs = [
  { id: "overview", label: "Tong quan" },
  { id: "members", label: "Members" },
  { id: "payments", label: "Payments" },
  { id: "requests", label: "Requests" },
  { id: "packages", label: "Packages" },
  { id: "trainers", label: "Trainers" },
  { id: "contacts", label: "Contacts" },
];

const emptyPackageForm = {
  slug: "",
  name: "",
  price: "",
  features: "",
  color: "",
  image_url: "",
  is_active: true,
};

const emptyTrainerForm = {
  slug: "",
  name: "",
  nickname: "",
  role: "",
  package_slug: "",
  experience: "",
  bio: "",
  specialties: "",
  achievement: "",
  sort_order: 0,
  image_url: "",
  is_active: true,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [editingTrainerId, setEditingTrainerId] = useState(null);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [trainerForm, setTrainerForm] = useState(emptyTrainerForm);

  const loadOverview = async () => {
    const result = await api.getAdminDashboard();
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setStats(result);
  };

  const loadMembers = async () => {
    const result = await api.getAllMembers();
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMembers(result.members || []);
  };

  const loadPayments = async () => {
    const result = await api.getAdminPayments();
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setPayments(result.payments || []);
  };

  const loadRequests = async () => {
    const result = await api.getPackageRequests();
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setRequests(result.requests || []);
  };

  const loadPackages = async () => {
    const result = await api.getAdminPackages();
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setPackages(result.packages || []);
  };

  const loadTrainers = async () => {
    const result = await api.getAdminTrainers();
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setTrainers(result.trainers || []);
  };

  const loadContacts = async () => {
    const result = await api.getAdminContacts();
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setContacts(result.contacts || []);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setMessage("");

      if (activeTab === "overview") {
        await loadOverview();
      } else if (activeTab === "members") {
        await loadMembers();
      } else if (activeTab === "payments") {
        await loadPayments();
      } else if (activeTab === "requests") {
        await loadRequests();
      } else if (activeTab === "packages") {
        await loadPackages();
      } else if (activeTab === "trainers") {
        await Promise.all([loadTrainers(), loadPackages()]);
      } else if (activeTab === "contacts") {
        await loadContacts();
      }

      setLoading(false);
    };

    run();
  }, [activeTab]);

  const logout = () => {
    session.clear();
    navigate("/");
  };

  const savePackage = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      ...packageForm,
      features: packageForm.features
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    const result = editingPackageId
      ? await api.updatePackage(editingPackageId, payload)
      : await api.createPackage(payload);

    setLoading(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(result.message || "Da luu goi tap.");
    setPackageForm(emptyPackageForm);
    setEditingPackageId(null);
    await loadPackages();
    await loadOverview();
  };

  const saveTrainer = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      ...trainerForm,
      specialties: trainerForm.specialties
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      sort_order: Number(trainerForm.sort_order) || 0,
    };

    const result = editingTrainerId
      ? await api.updateTrainer(editingTrainerId, payload)
      : await api.createTrainer(payload);

    setLoading(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage(result.message || "Da luu huan luyen vien.");
    setTrainerForm(emptyTrainerForm);
    setEditingTrainerId(null);
    await loadTrainers();
  };

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:flex-row">
        <aside className="glass-card rounded-[2rem] p-5 lg:w-72 lg:self-start">
          <div>
            <p className="section-heading">Admin</p>
            <h1 className="mt-3 text-4xl font-semibold uppercase text-slate-950">
              Portal
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {session.user?.full_name || session.user?.username}
            </p>
          </div>

          <div className="mt-8 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black uppercase tracking-[0.18em] transition ${
                  activeTab === tab.id
                    ? "bg-orange-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-8 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-red-600"
          >
            Dang xuat
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          {message && (
            <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700">
              {message}
            </div>
          )}

          {loading && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
              Dang tai du lieu...
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="glass-card rounded-[2rem] p-8">
                <p className="section-heading">Overview</p>
                <h2 className="mt-4 text-5xl font-semibold uppercase text-slate-950">
                  Tong quan he thong
                </h2>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: "Thanh vien",
                      value: stats?.stats?.memberCount || 0,
                    },
                    {
                      label: "Goi dang active",
                      value: stats?.stats?.activePackageCount || 0,
                    },
                    {
                      label: "Payments",
                      value: stats?.stats?.paymentCount || 0,
                    },
                    {
                      label: "Tong doanh thu",
                      value: `${stats?.stats?.totalRevenue || 0} TEST`,
                    },
                  ].map((item) => (
                    <div key={item.label} className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-3 text-3xl font-black text-slate-950">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {stats?.chain && (
                  <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-6">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      Blockchain
                    </p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <InfoLine label="Contract" value={stats.chain.contractAddress} />
                      <InfoLine label="Owner" value={shortAddress(stats.chain.owner)} />
                      <InfoLine
                        label="Treasury"
                        value={shortAddress(stats.chain.treasuryWallet)}
                      />
                      <InfoLine
                        label="On-chain revenue"
                        value={`${stats.chain.totalRevenue} TEST`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card rounded-[2rem] p-8">
                <p className="section-heading">Revenue by package</p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {(stats?.stats?.packageRevenueList || []).map((item) => (
                    <div key={item.slug} className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        {item.slug}
                      </p>
                      <p className="mt-3 text-2xl font-black text-slate-950">
                        {item.total_revenue} TEST
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.approved_count} giao dich
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <DataList
              title="Thanh vien"
              items={members}
              renderItem={(member) => (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        {member.role}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold uppercase text-slate-950">
                        {member.full_name || member.username}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {member.username}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.deleteMember(member.id);
                        await loadMembers();
                      }}
                      className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-red-600"
                    >
                      Xoa
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoLine
                      label="Wallet"
                      value={member.metamask_address || "Chua lien ket"}
                    />
                    <InfoLine
                      label="Goi"
                      value={member.current_package_name || "Chua co"}
                    />
                    <InfoLine
                      label="Status"
                      value={member.package_status || "inactive"}
                    />
                  </div>
                </div>
              )}
            />
          )}

          {activeTab === "payments" && (
            <DataList
              title="Payments"
              items={payments}
              renderItem={(payment) => (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        {payment.package_slug}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold uppercase text-slate-950">
                        {payment.package_name}
                      </h3>
                    </div>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-orange-600">
                      {payment.amount_test} TEST
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoLine label="Member" value={payment.full_name || payment.username} />
                    <InfoLine label="Wallet" value={shortAddress(payment.wallet_address)} />
                    <InfoLine label="Confirmed" value={payment.confirmed_at} />
                  </div>
                  <p className="mt-3 break-all text-sm text-slate-500">
                    Tx: {payment.tx_hash}
                  </p>
                </div>
              )}
            />
          )}

          {activeTab === "requests" && (
            <DataList
              title="Requests"
              items={requests}
              renderItem={(request) => (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        {request.status}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold uppercase text-slate-950">
                        {request.member_name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {request.package_name} - {request.package_price}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {["approved", "rejected"].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={async () => {
                            await api.updatePackageRequest(request.id, status);
                            await loadRequests();
                            await loadOverview();
                          }}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            />
          )}

          {activeTab === "packages" && (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <FormCard title={editingPackageId ? "Sua goi tap" : "Them goi tap"}>
                <form onSubmit={savePackage} className="space-y-4">
                  <Input label="Slug" value={packageForm.slug} onChange={(value) => setPackageForm((current) => ({ ...current, slug: value }))} />
                  <Input label="Ten goi" value={packageForm.name} onChange={(value) => setPackageForm((current) => ({ ...current, name: value }))} />
                  <Input label="Gia" value={packageForm.price} onChange={(value) => setPackageForm((current) => ({ ...current, price: value }))} />
                  <Input label="Color" value={packageForm.color} onChange={(value) => setPackageForm((current) => ({ ...current, color: value }))} />
                  <Input label="Image URL" value={packageForm.image_url} onChange={(value) => setPackageForm((current) => ({ ...current, image_url: value }))} />
                  <TextArea label="Features (phan tach dau phay)" value={packageForm.features} onChange={(value) => setPackageForm((current) => ({ ...current, features: value }))} />
                  <Toggle checked={packageForm.is_active} onChange={(checked) => setPackageForm((current) => ({ ...current, is_active: checked }))} label="Hien thi goi tap" />
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white">
                      {editingPackageId ? "Cap nhat" : "Tao moi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackageId(null);
                        setPackageForm(emptyPackageForm);
                      }}
                      className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                    >
                      Dat lai
                    </button>
                  </div>
                </form>
              </FormCard>

              <DataList
                title="Danh sach goi tap"
                items={packages}
                renderItem={(item) => (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                          {item.slug}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold uppercase text-slate-950">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-orange-600">{item.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPackageId(item.id);
                            setPackageForm({
                              slug: item.slug,
                              name: item.name,
                              price: item.price,
                              features: (item.features || []).join(", "),
                              color: item.color || "",
                              image_url: item.image_url || "",
                              is_active: Boolean(item.is_active),
                            });
                          }}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                        >
                          Sua
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await api.deletePackage(item.id);
                            await loadPackages();
                            await loadOverview();
                          }}
                          className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-red-600"
                        >
                          Xoa
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === "trainers" && (
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <FormCard title={editingTrainerId ? "Sua HLV" : "Them HLV"}>
                <form onSubmit={saveTrainer} className="space-y-4">
                  <Input label="Slug" value={trainerForm.slug} onChange={(value) => setTrainerForm((current) => ({ ...current, slug: value }))} />
                  <Input label="Ten" value={trainerForm.name} onChange={(value) => setTrainerForm((current) => ({ ...current, name: value }))} />
                  <Input label="Nickname" value={trainerForm.nickname} onChange={(value) => setTrainerForm((current) => ({ ...current, nickname: value }))} />
                  <Input label="Vai tro" value={trainerForm.role} onChange={(value) => setTrainerForm((current) => ({ ...current, role: value }))} />
                  <Input label="Package slug" value={trainerForm.package_slug} onChange={(value) => setTrainerForm((current) => ({ ...current, package_slug: value }))} />
                  <Input label="Kinh nghiem" value={trainerForm.experience} onChange={(value) => setTrainerForm((current) => ({ ...current, experience: value }))} />
                  <Input label="Achievement" value={trainerForm.achievement} onChange={(value) => setTrainerForm((current) => ({ ...current, achievement: value }))} />
                  <Input label="Sort order" value={trainerForm.sort_order} onChange={(value) => setTrainerForm((current) => ({ ...current, sort_order: value }))} />
                  <Input label="Image URL" value={trainerForm.image_url} onChange={(value) => setTrainerForm((current) => ({ ...current, image_url: value }))} />
                  <TextArea label="Bio" value={trainerForm.bio} onChange={(value) => setTrainerForm((current) => ({ ...current, bio: value }))} />
                  <TextArea label="Specialties (phan tach dau phay)" value={trainerForm.specialties} onChange={(value) => setTrainerForm((current) => ({ ...current, specialties: value }))} />
                  <Toggle checked={trainerForm.is_active} onChange={(checked) => setTrainerForm((current) => ({ ...current, is_active: checked }))} label="Hien thi HLV" />
                  <div className="flex gap-3">
                    <button type="submit" className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white">
                      {editingTrainerId ? "Cap nhat" : "Tao moi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTrainerId(null);
                        setTrainerForm(emptyTrainerForm);
                      }}
                      className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                    >
                      Dat lai
                    </button>
                  </div>
                </form>
              </FormCard>

              <DataList
                title="Danh sach HLV"
                items={trainers}
                renderItem={(item) => (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                          {item.package_slug || "general"}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold uppercase text-slate-950">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{item.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTrainerId(item.id);
                            setTrainerForm({
                              slug: item.slug,
                              name: item.name,
                              nickname: item.nickname,
                              role: item.role,
                              package_slug: item.package_slug || "",
                              experience: item.experience,
                              bio: item.bio,
                              specialties: (item.specialties || []).join(", "),
                              achievement: item.achievement,
                              sort_order: item.sort_order,
                              image_url: item.image_url || "",
                              is_active: Boolean(item.is_active),
                            });
                          }}
                          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-slate-700"
                        >
                          Sua
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await api.deleteTrainer(item.id);
                            await loadTrainers();
                          }}
                          className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-red-600"
                        >
                          Xoa
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === "contacts" && (
            <DataList
              title="Lien he"
              items={contacts}
              renderItem={(item) => (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold uppercase text-slate-950">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.phone} {item.email ? `- ${item.email}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-orange-700">
                      {item.package_name}
                    </span>
                  </div>
                  {item.message && (
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {item.message}
                    </p>
                  )}
                </div>
              )}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function DataList({ title, items, renderItem }) {
  return (
    <div className="glass-card rounded-[2rem] p-8">
      <p className="section-heading">{title}</p>
      <div className="mt-6 space-y-4">
        {items.length > 0 ? (
          items.map((item) => <div key={item.id}>{renderItem(item)}</div>)
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Chua co du lieu.
          </div>
        )}
      </div>
    </div>
  );
}

function FormCard({ title, children }) {
  return (
    <div className="glass-card rounded-[2rem] p-8">
      <p className="section-heading">{title}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">
        {label}
      </span>
      <textarea
        rows="4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 outline-none transition focus:border-orange-400"
      />
    </label>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
