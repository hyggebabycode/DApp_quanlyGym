import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, session } from "../../api";
import SiteNav from "../SiteNav";
import Footer from "../Footer";
import {
  ADMIN_WALLET_ADDRESS,
  GYM_CONTRACT_ADDRESS,
  connectMetaMaskWallet,
  getMembershipTypeLabel,
  getPackagePriceEth,
  isGymPaymentConfigured,
  payPackageWithMetaMask,
  shortAddress,
} from "../../web3/gymPaymentContract";
import {
  getPackageBadgeLabel,
  getPackageDisplayName,
  PACKAGE_ORDER,
} from "../../utils/packageMeta";

export default function Pricing() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loadingSlug, setLoadingSlug] = useState("");
  const [requestingSlug, setRequestingSlug] = useState("");

  useEffect(() => {
    const loadPackages = async () => {
      const result = await api.getPackages();
      if (!result.error) {
        const nextPackages = [...(result.packages || [])].sort(
          (left, right) =>
            PACKAGE_ORDER.indexOf(left.slug) - PACKAGE_ORDER.indexOf(right.slug),
        );
        setPackages(nextPackages);
      } else {
        setMessage(result.error);
      }
    };

    loadPackages();
  }, []);

  const orderedPackages = useMemo(() => {
    return PACKAGE_ORDER
      .map((slug) => packages.find((item) => item.slug === slug))
      .filter(Boolean);
  }, [packages]);

  const requireLogin = () => {
    if (!session.token || !session.user) {
      navigate("/login");
      return false;
    }

    return true;
  };

  const handleConnectWallet = async () => {
    try {
      const { address } = await connectMetaMaskWallet();
      setWalletAddress(address);
      setMessage(`Da ket noi vi ${shortAddress(address)}.`);
    } catch (error) {
      setMessage(error?.message || "Khong the ket noi MetaMask.");
    }
  };

  const handleRequestPackage = async (packageSlug) => {
    if (!requireLogin()) {
      return;
    }

    setRequestingSlug(packageSlug);
    setMessage("");
    const result = await api.createPackageRequest(packageSlug);
    setRequestingSlug("");

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setMessage("Da gui yeu cau dang ky goi tap cho admin.");
  };

  const handlePayPackage = async (plan) => {
    if (!requireLogin()) {
      return;
    }

    setLoadingSlug(plan.slug);
    setMessage("");

    try {
      const user = session.user;
      const payment = await payPackageWithMetaMask(
        plan.slug,
        user?.full_name || user?.username || "",
      );
      setWalletAddress(payment.walletAddress);

      const confirm = await api.confirmPayment({
        txHash: payment.txHash,
        packageSlug: plan.slug,
        walletAddress: payment.walletAddress,
      });

      if (confirm.error) {
        setMessage(
          `Giao dich da len chain nhung backend chua dong bo: ${confirm.error}`,
        );
      } else {
        setMessage(
          `Thanh toan thanh cong ${payment.amountEth} TEST. Goi ${getPackageDisplayName(plan.slug, plan.name)} da duoc kich hoat.`,
        );
      }
    } catch (error) {
      setMessage(error?.message || "Khong the thuc hien thanh toan.");
    }

    setLoadingSlug("");
  };

  const packageFootnotes = [
    "STANDARD thanh toan 0.5 TEST theo gia basic trong database.",
    "PRO va VIP dang map sang membership VIP on-chain de giu flow Sapphire gon.",
    "Sau khi thanh toan, backend se verify giao dich va cap nhat portal.",
  ];

  return (
    <div className="app-shell">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <section className="glass-card rounded-[2rem] p-8 md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-heading">Pricing</p>
              <h1 className="mt-3 text-5xl font-semibold uppercase text-slate-950 md:text-6xl">
                Chon goi tap
                <span className="block text-orange-600">va thanh toan ngay</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Website ho tro 2 flow: gui yeu cau thu cong de admin xu ly, hoac
                thanh toan on-chain bang MetaMask tren Sapphire. Payment se duoc
                forward ve vi admin.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleConnectWallet}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-900 transition hover:border-sky-300 hover:text-sky-700"
              >
                {walletAddress
                  ? `Vi: ${shortAddress(walletAddress)}`
                  : "Ket noi MetaMask"}
              </button>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 text-sm font-semibold text-orange-700">
                Receiver: {shortAddress(ADMIN_WALLET_ADDRESS)}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="metric-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Contract
              </p>
              <p className="mt-3 break-all text-sm font-semibold text-slate-900">
                {GYM_CONTRACT_ADDRESS}
              </p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Network
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Oasis Sapphire Testnet
              </p>
            </div>
            <div className="metric-card">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                Payment mode
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Contract payment + backend verification
              </p>
            </div>
          </div>

          {orderedPackages.length > 0 && (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {orderedPackages.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4"
                >
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
                    {getPackageBadgeLabel(plan.slug)}
                  </p>
                  <p className="mt-2 text-xl font-black uppercase text-slate-950">
                    {getPackageDisplayName(plan.slug, plan.name)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-orange-600">
                    {plan.price}
                  </p>
                </div>
              ))}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm font-semibold text-orange-700">
              {message}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {orderedPackages.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              loading={loadingSlug === plan.slug}
              requesting={requestingSlug === plan.slug}
              onRequest={() => handleRequestPackage(plan.slug)}
              onPay={() => handlePayPackage(plan)}
            />
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card rounded-[2rem] p-8">
            <p className="section-heading">Huong dan</p>
            <div className="mt-6 space-y-5">
              {[
                "Dang nhap hoac tao tai khoan.",
                "Ket noi MetaMask tren Oasis Sapphire Testnet.",
                "Nhan thanh toan trong MetaMask.",
                "Backend verify giao dich va kich hoat goi tap.",
              ].map((item, index) => (
                <div key={item} className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-sm font-black text-white">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="pt-2 text-base font-semibold text-slate-700">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-8">
            <p className="section-heading">Luu y</p>
            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              {packageFootnotes.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4"
                >
                  {item}
                </div>
              ))}
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
                {isGymPaymentConfigured()
                  ? "Contract payment da duoc cau hinh san sang."
                  : "Frontend chua co contract address hop le."}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function PricingCard({ plan, loading, requesting, onRequest, onPay }) {
  const [chainPrice, setChainPrice] = useState(null);

  useEffect(() => {
    const loadPrice = async () => {
      try {
        const result = await getPackagePriceEth(plan.slug);
        setChainPrice(result);
      } catch {
        setChainPrice(null);
      }
    };

    loadPrice();
  }, [plan.slug]);

  return (
    <article className="glass-card rounded-[2rem] p-6 md:p-7">
      <p className="section-heading">{getPackageBadgeLabel(plan.slug)}</p>
      <h2 className="mt-4 text-4xl font-semibold uppercase text-slate-950">
        {getPackageDisplayName(plan.slug, plan.name)}
      </h2>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
        {plan.name}
      </p>
      <p className="mt-4 text-3xl font-black text-orange-600">{plan.price}</p>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
          On-chain
        </p>
        <p className="mt-3 text-base font-semibold text-slate-900">
          {chainPrice
            ? `${chainPrice.eth} TEST / ${chainPrice.durationDays} ngay`
            : "Dang tai gia contract..."}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Membership type: {getMembershipTypeLabel(plan.slug)}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(plan.features || []).map((feature) => (
          <span
            key={feature}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-3">
        <button
          type="button"
          onClick={onPay}
          disabled={loading}
          className="rounded-2xl bg-orange-600 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Dang thanh toan..." : "Thanh toan MetaMask"}
        </button>
        <button
          type="button"
          onClick={onRequest}
          disabled={requesting}
          className="rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {requesting ? "Dang gui..." : "Gui yeu cau"}
        </button>
      </div>
    </article>
  );
}
