"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, Loader2, ArrowRight, Heart, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* MESH GRADIENT BACKGROUND & ANIMATED ORBS */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-500/20 rounded-full blur-[100px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute top-[30%] left-[60%] w-[30vw] h-[30vw] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen animate-[pulse_12s_ease-in-out_infinite]"></div>
        
        {/* GRID PATTERN OVERLAY */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] opacity-50"></div>
      </div>

      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* ĐIỂM NHẤN TRANG TRÍ TRÊN CARD */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-400 to-[#0055A5] rounded-3xl shadow-[0_0_40px_rgba(0,85,165,0.4)] rotate-3 hover:rotate-0 transition-transform duration-500 z-20 border-2 border-white/10 backdrop-blur-md">
          <ShieldCheck size={48} className="text-white drop-shadow-lg" strokeWidth={2} />
          <Sparkles size={20} className="absolute -top-2 -right-2 text-amber-300 animate-pulse" />
        </div>

        {/* THÂN CARD LOGIN */}
        <div className="bg-white/[0.03] backdrop-blur-2xl pt-16 pb-10 px-8 sm:px-12 rounded-[2.5rem] shadow-2xl shadow-black/50 border border-white/10 relative overflow-hidden">
          
          {/* HIỆU ỨNG ÁNH SÁNG CHẠY TRÊN VIỀN (GLOW LINE) */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight uppercase mb-3 drop-shadow-sm">
              Đăng Nhập
            </h1>
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></span>
              <p className="text-blue-300 font-bold text-[10px] uppercase tracking-[0.2em]">
                Hệ thống quản lý QNU
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* INPUT TÀI KHOẢN */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-widest group-focus-within:text-blue-400 transition-colors flex items-center gap-2">
                Tài khoản
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-focus-within:bg-blue-500/20 group-focus-within:text-blue-400 text-slate-400 transition-all">
                  <User size={18} strokeWidth={2.5}/>
                </div>
                <input
                  required
                  className="w-full bg-slate-900/50 p-4 pl-16 rounded-[1.5rem] border border-white/10 focus:border-blue-500/50 focus:bg-slate-900/80 outline-none shadow-inner font-bold text-sm text-white transition-all placeholder:text-slate-600 placeholder:font-medium"
                  placeholder="Nhập tên đăng nhập..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* INPUT MẬT KHẨU */}
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-slate-400 ml-2 uppercase tracking-widest group-focus-within:text-blue-400 transition-colors flex items-center gap-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-focus-within:bg-blue-500/20 group-focus-within:text-blue-400 text-slate-400 transition-all">
                  <Lock size={18} strokeWidth={2.5}/>
                </div>
                <input
                  required
                  type="password"
                  className="w-full bg-slate-900/50 p-4 pl-16 rounded-[1.5rem] border border-white/10 focus:border-blue-500/50 focus:bg-slate-900/80 outline-none shadow-inner font-bold text-sm text-white transition-all placeholder:text-slate-600 placeholder:font-medium"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* NÚT ĐĂNG NHẬP */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden group bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-sm uppercase tracking-widest py-4 rounded-[1.5rem] shadow-[0_0_20px_rgba(0,180,255,0.3)] hover:shadow-[0_0_30px_rgba(0,180,255,0.5)] transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* HIỆU ỨNG QUÉT SÁNG KHI HOVER */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <><Loader2 className="animate-spin" size={20} /> ĐANG KIỂM TRA...</>
                  ) : (
                    <>XÁC NHẬN <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* FOOTER TEXT CHÌM DƯỚI CARD */}
        <div className="mt-8 text-center pointer-events-none opacity-50">
          <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center justify-center gap-2 bg-slate-900/30 w-fit mx-auto px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm">
            obi.phu08 <Heart size={10} className="fill-red-500 text-red-500 animate-pulse" /> ĐTNTN QNU
          </span>
        </div>
      </div>

      {/* KEYFRAMES ĐỂ TẠO HIỆU ỨNG QUÉT SÁNG */}
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}