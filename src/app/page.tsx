"use client";

import Link from "next/link";
import { QrCode, LogIn, Heart, MapPin, Sparkles, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 overflow-hidden">
      
      {/* --- BACKGROUND MÂY LOANG (MESH GRADIENT) --- */}
      <div className="fixed inset-0 bg-[#0055A5] z-0">
         <div className="absolute inset-0 opacity-40">
            <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-[#87CEEB] rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] bg-[#0047AB] rounded-full blur-[130px] animate-pulse delay-700"></div>
         </div>
      </div>

      <main className="relative z-10 min-h-screen flex flex-col lg:flex-row items-center justify-center p-6 lg:p-20 gap-16 lg:gap-24">
        
        {/* --- BÊN TRÁI: THƯƠNG HIỆU (BRAND SIDE) --- */}
        <div className="w-full lg:w-3/5 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/30 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <MapPin size={14} className="text-red-400 fill-red-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Quy Nhon University</span>
            </div>
            
            <div className="relative mb-10 group">
                <div className="absolute -inset-6 bg-blue-400/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img 
                    src="/logo.png" 
                    alt="Logo QNU" 
                    className="relative w-40 h-40 lg:w-56 lg:h-56 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] animate-in zoom-in duration-1000"
                />
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] mb-6 drop-shadow-2xl animate-in slide-in-from-left-8 duration-700 delay-200">
                Đội thanh niên <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-sky-200 italic font-medium">Tình Nguyện QNU</span>
            </h1>
            
            <p className="max-w-md text-blue-100/90 font-bold text-sm uppercase tracking-[0.2em] leading-relaxed drop-shadow-md animate-in fade-in duration-1000 delay-500 text-center lg:text-left">
                Hệ thống quản lý thông minh dành cho <br/> Đội Thanh niên Tình nguyện 
            </p>
        </div>

        {/* --- BÊN PHẢI: LỰA CHỌN (SELECTION SIDE) --- */}
        <div className="w-full lg:w-2/5 max-w-md animate-in slide-in-from-right-8 duration-700 delay-300">
            <div className="bg-white/10 backdrop-blur-2xl p-10 lg:p-12 rounded-[4.5rem] shadow-2xl border-4 border-white/20 flex flex-col gap-6">
                
                <Link href="/scan" className="group relative overflow-hidden flex items-center justify-between p-8 bg-white text-[#0055A5] rounded-[3rem] shadow-xl hover:shadow-blue-900/40 hover:-translate-y-2 transition-all duration-500 active:scale-95">
                    <div className="flex items-center gap-6">
                        <div className="bg-[#0055A5]/10 p-4 rounded-3xl group-hover:bg-[#0055A5] group-hover:text-white transition-colors duration-500">
                            <QrCode size={32} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl font-black tracking-tight">Vào Ca Trực</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Quét mã QR Điểm danh</p>
                        </div>
                    </div>
                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </Link>

                <Link href="/login" className="group flex items-center justify-between p-8 bg-blue-950/30 text-white rounded-[3rem] border-2 border-white/10 hover:bg-white hover:text-slate-800 hover:shadow-2xl transition-all duration-500 active:scale-95 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div className="bg-white/10 p-4 rounded-3xl shadow-sm group-hover:bg-blue-50 transition-colors border border-white/10 group-hover:border-blue-100">
                            <LogIn size={32} className="group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl font-black tracking-tight">Quản Trị viên</h3>
                            <p className="text-white/40 group-hover:text-slate-400 text-[10px] font-black uppercase tracking-widest">Dành cho ban chấp hành</p>
                        </div>
                    </div>
                </Link>

                <div className="mt-6 flex flex-col items-center gap-4 opacity-50">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    <span className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-[0.4em] text-center">
                        obi.phu08  <Heart size={14} className="text-red-400 fill-red-400 animate-pulse" /> ĐTNTN QNU
                    </span>
                </div>
            </div>
        </div>

      </main>

      <div className="fixed bottom-10 w-full text-center z-10 pointer-events-none opacity-40 px-4">
         <p className="text-white text-[9px] font-black uppercase tracking-[0.5em] leading-relaxed">
           © 2026 Developed by Phu 
         </p>
      </div>
    </div>
  );
}