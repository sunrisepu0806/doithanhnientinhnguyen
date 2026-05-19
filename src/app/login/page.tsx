"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, Loader2, ArrowRight, Heart } from "lucide-react";

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
        
        localStorage.setItem("user_role", userData.role); 
        localStorage.setItem("user_name", userData.username);

        if (userData.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/scan");
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
    <div className="min-h-screen bg-[#F9FBFF] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-200">
      
      {/* BACKGROUND HIỆU ỨNG ÁNH SÁNG LOANG (GLASSMORPHISM) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-300/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* CARD ĐĂNG NHẬP */}
        <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-white">
          
          <div className="text-center mb-10 relative">
            <div className="mx-auto bg-gradient-to-tr from-[#0055A5] to-blue-400 w-20 h-20 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <ShieldCheck size={40} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-2">Đăng Nhập</h1>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              Hệ thống quản lý QNU <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest group-focus-within:text-[#0055A5] transition-colors">Tài khoản</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0055A5] transition-colors" size={20}/>
                <input
                  required
                  className="w-full bg-slate-50/50 p-5 pl-14 rounded-[2rem] border-2 border-transparent focus:border-blue-200 focus:bg-white outline-none shadow-inner font-bold text-sm text-slate-700 transition-all"
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest group-focus-within:text-[#0055A5] transition-colors">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0055A5] transition-colors" size={20}/>
                <input
                  required
                  type="password"
                  className="w-full bg-slate-50/50 p-5 pl-14 rounded-[2rem] border-2 border-transparent focus:border-blue-200 focus:bg-white outline-none shadow-inner font-bold text-sm text-slate-700 transition-all"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-[#0055A5] to-blue-600 text-white font-black text-sm uppercase tracking-widest py-5 rounded-[2rem] shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0 transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>Xác nhận <ArrowRight size={20} /></>
              )}
            </button>
          </form>
        </div>

        {/* FOOTER TEXT */}
        <div className="mt-10 text-center pointer-events-none opacity-40">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 flex items-center justify-center gap-2">
            obi.phu08 <Heart size={12} className="fill-red-500 text-red-500 animate-pulse" /> ĐTNTN QNU
          </span>
        </div>
      </div>
    </div>
  );
}