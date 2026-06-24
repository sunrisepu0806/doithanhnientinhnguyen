"use client";

import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Heart, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f4f8fc] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-800 selection:bg-[#0055A5]/10">
      
      {/* 🌟 ĐIỂM NHẤN XANH DƯƠNG LOANG CAO CẤP (Tăng độ rộng và làm mịn dải mờ) */}
      <div className="absolute top-[-30%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-[#0055A5]/18 to-sky-400/10 rounded-full blur-[160px] pointer-events-none animate-[pulse_8s_ease-in-out_infinite]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[650px] h-[650px] bg-gradient-to-bl from-blue-500/12 to-transparent rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[550px] h-[550px] bg-sky-300/8 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-4xl text-center z-10">
        
        {/* LOGO CONTAINER WITH GLASS EFFECTS */}
        <div className="mb-8 inline-flex items-center justify-center p-3 bg-white/80 backdrop-blur-md rounded-full shadow-md border border-blue-100/80 relative group animate-in fade-in slide-in-from-top-4 duration-600">
          <div className="absolute inset-0 bg-[#0055A5]/8 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <img 
            src="/logo.png" 
            alt="QNU Logo" 
            className="w-14 h-14 object-contain relative z-10 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300" 
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
          />
        </div>

        {/* TYPOGRAPHY SECTION */}
        <div className="animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight mb-2">
            Hệ thống quản lý
          </h1>
          <h2 className="text-3xl md:text-4xl font-black text-[#0055A5] uppercase tracking-tight mb-4 inline-flex items-center justify-center gap-2 relative">
            Đội thanh niên tình nguyện
            <Sparkles size={22} className="text-amber-400 animate-pulse absolute -right-8 top-1 hidden md:block" />
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto font-bold uppercase tracking-widest leading-relaxed mb-14 opacity-90">
            Trang thông tin chính thức <span className="text-[#0055A5]/40 mx-1">•</span> Dành cho ban chấp hành và thành viên
          </p>
        </div>

        {/* CARD GRID LAYOUT (Tinh chỉnh viền mờ ảo border-blue-50/50 và bóng đổ đa tầng) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          
          {/* THẺ TRA CỨU ĐỘI VIÊN */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(11,32,70,0.06)] border border-blue-50/80 flex flex-col justify-between text-center transition-all duration-300 hover:translate-y-[-6px] hover:shadow-[0_30px_60px_-15px_rgba(0,85,165,0.12)] hover:border-[#0055A5]/20 group">
             <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-50/80 rounded-2xl flex items-center justify-center text-[#0055A5] mx-auto mb-6 shadow-inner group-hover:bg-[#0055A5] group-hover:text-white transition-all duration-300">
                   <Search size={24} className="group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-[#0055A5] transition-colors duration-300">Tra cứu thông tin</h3>
                <p className="text-slate-400 text-xs font-semibold px-4 leading-relaxed mb-10">
                   Dành cho Đội viên. Xem danh sách sự kiện cá nhân và lịch sử các buổi quét mã điểm danh.
                </p>
             </div>
             <button 
               onClick={() => router.push("/search")}
               className="w-full bg-[#0055A5] text-white text-xs uppercase tracking-widest font-black py-4 rounded-2xl shadow-[0_8px_20px_-4px_rgba(0,85,165,0.25)] hover:bg-blue-700 hover:shadow-[0_12px_24px_-4px_rgba(0,85,165,0.35)] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
             >
               Vào cổng tra cứu <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
             </button>
          </div>

          {/* THẺ BAN TỔ CHỨC */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(11,32,70,0.06)] border border-blue-50/80 flex flex-col justify-between text-center transition-all duration-300 hover:translate-y-[-6px] hover:shadow-[0_30px_60px_-15px_rgba(11,32,70,0.1)] hover:border-slate-300 group">
             <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mx-auto mb-6 shadow-inner group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
                   <ShieldCheck size={24} className="group-hover:scale-105 transition-transform" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-slate-900 transition-colors duration-300">Ban tổ chức</h3>
                <p className="text-slate-400 text-xs font-semibold px-4 leading-relaxed mb-10">
                   Dành cho Ban Chấp Hành Đội. Thiết lập sự kiện, kiểm soát máy quét QR và quản trị nhân sự tổ.
                </p>
             </div>
             <button 
               onClick={() => router.push("/login")}
               className="w-full bg-white text-slate-600 border border-slate-200 text-xs uppercase tracking-widest font-black py-4 rounded-2xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
             >
               Đăng nhập hệ thống <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
             </button>
          </div>

        </div>
      </div>

      {/* FOOTER CHÌM */}
      <div className="mt-20 text-center opacity-35 pointer-events-none">
         <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center justify-center gap-1.5">
           obi.phu08 <Heart size={12} className="fill-red-500 text-red-500 animate-pulse"/> QNU
         </span>
      </div>
    </div>
  );
}