"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, Loader2, ArrowRight, Heart, Search, ScanLine } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const q = query(
        collection(db, "users"), 
        where("username", "==", username),
        where("password", "==", password) 
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        
        // Lưu thông tin người dùng vào Local Storage
        localStorage.setItem("user_role", userData.role); 
        localStorage.setItem("user_name", userData.username);
        localStorage.setItem("user_to", userData.to || ""); // Lưu tên tổ (dành cho tổ trưởng)

        // LOGIC CHUYỂN HƯỚNG MỚI THEO PHÂN QUYỀN
        if (userData.role === "admin") {
          router.push("/admin");
        } else if (userData.role === "totruong") {
          router.push("/leader"); // Chuyển tổ trưởng vào trang quản lý tổ
        } else {
          router.push("/scan"); // Chuyển máy quét vào trang điểm danh
        }
      } else {
        alert("Sai tên tài khoản hoặc mật khẩu!");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Lỗi hệ thống.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-800">
      
      {/* BACKGROUND DECORATIVE ORBS (Đồng bộ với hiệu ứng mờ của các trang quản trị) */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-sky-300/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-white p-6 md:p-8 rounded-soft border border-blue-50 shadow-soft-xl relative z-10 animate-in zoom-in duration-300">
        
        {/* LOGO BOX */}
        <div className="text-center mb-6">
          <div className="bg-[#0055A5] w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/10 text-white">
            <ScanLine size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Hệ Thống Đăng Nhập</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Đội Thanh niên tình nguyện QNU</p>
        </div>

        {/* FORM NHẬP LIỆU */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* TÀI KHOẢN */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Tên đăng nhập</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User size={16} />
              </span>
              <input
                required
                type="text"
                className="w-full bg-slate-50 p-3 pl-10 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm focus:bg-white transition-all text-slate-700 font-medium"
                placeholder="Nhập username của bạn..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* MẬT KHẨU */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">Mật khẩu</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                required
                type="password"
                className="w-full bg-slate-50 p-3 pl-10 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm focus:bg-white transition-all text-slate-700 font-medium"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* HÀNH ĐỘNG ĐĂNG NHẬP / TRA CỨU */}
          <div className="pt-2 space-y-4 text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0055A5] text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={16} /> Đang kiểm tra...</>
              ) : (
                <>Đăng nhập hệ thống <ArrowRight size={14} /></>
              )}
            </button>

            {/* ĐƯỜNG DẪN TRA CỨU CHIẾN SĨ CHÌM */}
            <div className="border-t border-slate-100 pt-4">
              <Link 
                href="/search" 
                className="inline-flex items-center justify-center gap-1.5 text-[#0055A5] hover:text-blue-700 font-bold text-[11px] uppercase tracking-wider transition-colors"
              >
                <Search size={13} /> Tra cứu thông tin 
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* FOOTER CHÌM */}
      <div className="mt-8 text-center pointer-events-none opacity-40">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center justify-center gap-2">
          obi.phu08 <Heart size={12} className="fill-red-500 text-red-500 animate-pulse" /> ĐTNTN QNU
        </span>
      </div>
    </div>
  );
}