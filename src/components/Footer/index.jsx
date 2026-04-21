import { Link } from "react-router-dom";
import { ADMIN_WALLET_ADDRESS, shortAddress } from "../../web3/gymPaymentContract";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-1">
          <Link
            to="/"
            className="font-display text-3xl font-semibold uppercase tracking-tight text-slate-950"
          >
            Power<span className="text-orange-600">Gym</span>
          </Link>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Web gym light-theme, co login dang ky, MetaMask payment tren Oasis
            Sapphire Testnet va khu vuc admin/member tach rieng.
          </p>
        </div>

        <div>
          <p className="section-heading">Dieu huong</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
            <Link to="/">Trang chu</Link>
            <Link to="/pricing">Bang gia</Link>
            <Link to="/trainers">Huong dan vien</Link>
            <Link to="/contact">Lien he</Link>
          </div>
        </div>

        <div>
          <p className="section-heading">Tai khoan</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
            <Link to="/login">Dang nhap</Link>
            <Link to="/register">Dang ky</Link>
            <Link to="/member-portal">Member portal</Link>
            <Link to="/admin-portal">Admin portal</Link>
          </div>
        </div>

        <div>
          <p className="section-heading">Thanh toan</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Network: Oasis Sapphire Testnet</p>
            <p>Currency: TEST</p>
            <p>Admin wallet: {shortAddress(ADMIN_WALLET_ADDRESS)}</p>
            <p>All on-chain payments are forwarded to the admin wallet.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <span>(c) 2026 PowerGym Web DApp</span>
          <span>Built for Sapphire Testnet payment flow</span>
        </div>
      </div>
    </footer>
  );
}
