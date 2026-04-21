import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, session } from "../../api";
import SiteNav from "../SiteNav";
import Footer from "../Footer";
import {
  connectMetaMaskWallet,
  getContractSummary,
  getOnChainMemberProfile,
  shortAddress,
  signWalletMessage,
} from "../../web3/gymPaymentContract";
import { getPackageDisplayName } from "../../utils/packageMeta";

const formatDate = (value) => {
  if (!value) {
    return "Chua co";
  }

  return new Date(Number(value) * 1000).toLocaleString("vi-VN");
};

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [chainProfile, setChainProfile] = useState(null);
  const [chainSummary, setChainSummary] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [walletLoading, setWalletLoading] = useState(false);

  const loadPortal = async () => {
    setLoading(true);
    const result = await api.getCurrentMember();

    if (result.error) {
      setMessage(result.error);
      setLoading(false);
      return;
    }

    setProfile(result.user);
    setPayments(result.payments || []);

    const walletAddress = result.user?.metamask_address || "";
    if (walletAddress) {
      try {
        const [memberInfo, contractInfo] = await Promise.all([
          getOnChainMemberProfile(walletAddress),
          getContractSummary(),
        ]);
        setChainProfile(memberInfo);
        setChainSummary(contractInfo);
      } catch {
        setChainProfile(null);
        setChainSummary(null);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadPortal();
  }, []);

  const handleLinkWallet = async () => {
    setWalletLoading(true);
    setMessage("");

    try {
      const { address } = await connectMetaMaskWallet();
      const challenge = await api.getLinkWalletChallenge(address);
      if (challenge.error) {
        setMessage(challenge.error);
        setWalletLoading(false);
        return;
      }

      const { signature } = await signWalletMessage(challenge.message);
      const result = await api.verifyLinkWallet({
        walletAddress: address,
        signature,
      });

      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Da lien ket MetaMask thanh cong.");
        await loadPortal();
      }
    } catch (error) {
      setMessage(error?.message || "Khong the lien ket MetaMask.");
    }

    setWalletLoading(false);
  };

  const logout = () => {
    session.clear();
    navigate("/");
  };

  return (
    <div className="app-shell">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {loading ? (
          <div className="glass-card rounded-[2rem] p-8 text-slate-600">
            Dang tai thong tin member...
          </div>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="glass-card rounded-[2rem] p-8 md:p-10">
                <p className="section-heading">Member portal</p>
                <h1 className="mt-4 text-5xl font-semibold uppercase text-slate-950 md:text-6xl">
                  {profile?.full_name || profile?.username}
                </h1>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Theo doi goi tap, lich su thanh toan va trang thai on-chain
                  tai mot cho. Neu chua lien ket vi, ban co the lam ngay tai
                  day.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="metric-card">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      Tai khoan
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {profile?.username}
                    </p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      Wallet
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {profile?.metamask_address
                        ? shortAddress(profile.metamask_address)
                        : "Chua lien ket"}
                    </p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      Goi hien tai
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {profile?.current_package_slug
                        ? getPackageDisplayName(
                            profile.current_package_slug,
                            profile.current_package_name,
                          )
                        : "Chua co"}
                    </p>
                  </div>
                  <div className="metric-card">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      Trang thai
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {profile?.package_status === "active"
                        ? "Dang hoat dong"
                        : "Chua kich hoat"}
                    </p>
                  </div>
                </div>

                {message && (
                  <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700">
                    {message}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleLinkWallet}
                    disabled={walletLoading}
                    className="rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {walletLoading ? "Dang lien ket..." : "Lien ket MetaMask"}
                  </button>
                  <Link
                    to="/pricing"
                    className="rounded-2xl border border-slate-300 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400"
                  >
                    Mua goi tap
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-2xl border border-red-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-red-600 transition hover:bg-red-50"
                  >
                    Dang xuat
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-[2rem] p-8 md:p-10">
                <p className="section-heading">Blockchain</p>
                <h2 className="mt-4 text-4xl font-semibold uppercase text-slate-950">
                  Membership on-chain
                </h2>

                {chainProfile ? (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Ten member
                      </p>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {chainProfile.name}
                      </p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Membership type
                      </p>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {chainProfile.membershipType === 0 ? "STANDARD" : "VIP"}
                      </p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Dang ky luc
                      </p>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {formatDate(chainProfile.registrationDate)}
                      </p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Het han
                      </p>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {formatDate(chainProfile.expiryDate)}
                      </p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Attendance
                      </p>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {chainProfile.totalAttendance}
                      </p>
                    </div>
                    <div className="metric-card">
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                        Tinh trang
                      </p>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {chainProfile.membershipValid
                          ? "Con hieu luc"
                          : "Da het han"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Chua co membership on-chain cho vi hien tai. Hay lien ket vi
                    va thanh toan goi tap tu trang pricing.
                  </div>
                )}

                {chainSummary && (
                  <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6">
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                      Contract summary
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>Owner: {shortAddress(chainSummary.owner)}</p>
                      <p>
                        Treasury: {shortAddress(chainSummary.treasuryWallet)}
                      </p>
                      <p>Total members: {chainSummary.totalMembers}</p>
                      <p>Total revenue: {chainSummary.totalRevenue} TEST</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-8 glass-card rounded-[2rem] p-8 md:p-10">
              <p className="section-heading">Lich su thanh toan</p>
              <div className="mt-6 grid gap-4">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                            {payment.package_slug}
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold uppercase text-slate-950">
                            {payment.package_name}
                          </h3>
                        </div>
                        <div className="text-sm font-semibold text-slate-600">
                          {payment.amount_test} TEST
                        </div>
                      </div>
                      <p className="mt-4 break-all text-sm text-slate-600">
                        Tx: {payment.tx_hash}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Xac nhan: {payment.confirmed_at}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Chua co payment nao duoc dong bo cho tai khoan nay.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
