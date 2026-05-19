"use client";

import { useState, useEffect } from "react";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  serverTimestamp, orderBy, query 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Plus, Trash2, Calendar, KeyRound, 
  Users, LogOut, Shield, MapPin, QrCode, 
  Activity, ArrowRight, Heart, Trophy, BarChart3, Star, Search
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actType, setActType] = useState("thien_nguyen");
  const [actPoints, setActPoints] = useState(10);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "admin") {
      router.push("/login");
    } else {
      fetchActivities();
    }
  }, []);

  const fetchActivities = async () => {
    try {
      const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const groupedActivities = activities.reduce((groups: any, activity) => {
    const date = activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000) : new Date();
    const monthYear = `THÁNG ${date.getMonth() + 1}/${date.getFullYear()}`;
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(activity);
    return groups;
  }, {});

  const handleCreateActivity = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const password = (formData.get("password") as string).trim();
    await addDoc(collection(db, "activities"), {
      name, password, type: actType, points: Number(actPoints),
      isActive: true, createdAt: serverTimestamp()
    });
    setShowModal(false);
    fetchActivities();
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      
      <main className="min-h-screen overflow-y-auto scrollbar-hide relative bg-white">
        
        {/* HEADER LOANG MÀU (BLUE MESH) */}
        <header className="relative bg-[#0055A5] pt-16 pb-32 px-6 lg:px-12 overflow-hidden rounded-b-[4rem] lg:rounded-b-[6rem]">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[100px]"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6 lg:gap-8 text-white">
                <img src="/logo.png" className="w-20 h-20 lg:w-32 lg:h-32 drop-shadow-2xl" />
                <div>
                  <div className="flex items-center gap-2 mb-2 text-white/70">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Quy Nhon University</span>
                  </div>
                  <h1 className="text-4xl lg:text-7xl font-black tracking-tighter leading-none mb-2">Xin chào!</h1>
                  <p className="text-xl lg:text-4xl font-medium text-blue-100/80 italic">Quản trị viên</p>
                </div>
              </div>

              {/* NÚT ĐIỀU HƯỚNG TRÊN HEADER */}
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-[2.5rem] backdrop-blur-xl border border-white/20 shadow-2xl">
                 {[
                   { icon: QrCode, href: "/scan" },
                   { icon: Trophy, href: "/admin/leaderboard" },
                   { icon: BarChart3, href: "/admin/stats" },
                   { icon: Users, href: "/admin/management" },
                   { icon: Shield, href: "/admin/users" }
                 ].map((item, idx) => (
                   <Link key={idx} href={item.href} className="w-11 h-11 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#0055A5] transition-all">
                     <item.icon size={22} />
                   </Link>
                 ))}
                 <button onClick={() => {localStorage.clear(); router.push('/login')}} className="w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-red-500/20 text-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <LogOut size={22} />
                 </button>
              </div>
            </div>
          </div>
        </header>

        {/* FLOATING ACTION BAR */}
        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
          <div className="bg-white/95 backdrop-blur-2xl p-6 lg:p-8 rounded-[3.5rem] shadow-2xl shadow-blue-900/10 border-4 border-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-[#0055A5]">
                <Activity size={32} />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Chào Phú! 👋</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Hệ thống quản lý <span className="text-[#0055A5] font-black">{activities.length} hoạt động</span></p>
              </div>
            </div>

            <div className="relative flex-1 max-w-sm hidden md:block">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" placeholder="Tìm tên hoặc mã..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-4 pl-14 pr-6 rounded-full outline-none font-bold text-sm focus:bg-white border border-transparent focus:border-blue-100 transition-all shadow-inner"
              />
            </div>

            <button onClick={() => setShowModal(true)} className="w-full md:w-auto py-5 px-10 bg-[#0055A5] text-white font-black rounded-[2.5rem] shadow-xl hover:shadow-blue-300 hover:bg-[#0047AB] transition-all flex items-center justify-center gap-3 active:scale-95">
              <Plus size={24} /> TẠO SỰ KIỆN MỚI
            </button>
          </div>
        </div>

        {/* DANH SÁCH HÀNG NGANG (Đã fix lỗi Passcode) */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pb-32 flex flex-col gap-12">
          {Object.keys(groupedActivities).map((month) => (
            <section key={month} className="flex flex-col gap-4">
              <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] pl-6 border-l-4 border-blue-600 leading-none">{month}</h2>
              <div className="flex flex-col gap-3">
                {groupedActivities[month].filter((a:any) => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((activity: any) => (
                  <div key={activity.id} className="group bg-white p-5 pr-8 rounded-[2.5rem] border border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-center justify-between">
                    
                    {/* CỘT TÊN HOẠT ĐỘNG */}
                    <div className="flex items-center gap-6 flex-1 min-w-0 pr-4"> 
                      <div className={`w-14 h-14 flex-shrink-0 rounded-3xl flex items-center justify-center shadow-inner ${activity.type === 'ho_tro' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                        <ArrowRight size={28} className="-rotate-45" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-lg lg:text-xl text-slate-800 group-hover:text-[#0055A5] transition-colors uppercase tracking-tight break-words line-clamp-2">
                          {activity.name}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${activity.type === 'ho_tro' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-[#0055A5]'}`}>
                            {activity.type === 'ho_tro' ? 'Hỗ trợ mảng' : 'Thiện nguyện'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CÁC CỘT THÔNG TIN HÀNG NGANG - Đã FIX Passcode */}
                    <div className="hidden lg:grid grid-cols-3 w-[500px] flex-shrink-0 gap-8 px-10 border-l border-slate-100 ml-4">
                      {/* Passcode Fix: min-w-0 và break-all */}
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pass Code</span>
                        <span className="font-mono font-black text-[#0055A5] text-lg lg:text-xl tracking-widest break-all line-clamp-1">
                          {activity.password}
                        </span>
                      </div>
                      
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Điểm</span>
                        <span className="text-slate-700 font-black text-lg flex items-center gap-1.5">
                          <Star size={14} className="fill-emerald-400 text-emerald-400"/> {activity.points || 10}
                        </span>
                      </div>
                      
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 text-center lg:text-left">Thời gian</span>
                        <span className="text-slate-400 font-bold text-xs">
                          {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : '--/--'}
                        </span>
                      </div>
                    </div>

                    {/* NÚT THAO TÁC */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Link href={`/admin/activity/${activity.id}`} className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-[#0055A5] hover:text-white transition-all text-slate-400 shadow-sm active:scale-90">
                        <QrCode size={22} />
                      </Link>
                      <button onClick={() => confirm('Xóa hoạt động này?') && deleteDoc(doc(db, "activities", activity.id))} className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-red-500 hover:text-white transition-all text-slate-400 shadow-sm active:scale-90">
                        <Trash2 size={22} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <div className="fixed bottom-6 w-full text-center pointer-events-none z-30 opacity-40 px-4">
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center justify-center gap-2">
          obi.phu08 <Heart size={12} className="fill-red-500 text-red-500 animate-pulse"/> ĐTNTN QNU
        </span>
      </div>

      {/* MODAL (GIỮ NGUYÊN) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-xl p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-in zoom-in duration-300">
            <h2 className="text-4xl font-black mb-1 tracking-tight">Tạo Sự Kiện</h2>
            <form onSubmit={handleCreateActivity} className="space-y-6 mt-8">
              <input name="name" required placeholder="Tên hoạt động..." className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none font-bold border-2 border-transparent focus:border-blue-200 shadow-inner" />
              <div className="grid grid-cols-2 gap-4">
                <select value={actType} onChange={(e) => {setActType(e.target.value); if(e.target.value === "thien_nguyen") setActPoints(10);}} className="bg-slate-50 p-6 rounded-[2rem] font-bold border-2 border-transparent focus:border-blue-200 outline-none shadow-inner">
                  <option value="thien_nguyen">Thiện nguyện</option>
                  <option value="ho_tro">Hỗ trợ mảng</option>
                </select>
                <input type="number" min="1" max="10" value={actPoints} disabled={actType === "thien_nguyen"} onChange={(e) => setActPoints(Number(e.target.value))} className="bg-slate-50 p-6 rounded-[2rem] font-bold text-center border-2 border-transparent focus:border-blue-200 outline-none shadow-inner" />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                <input name="password" required placeholder="PASSCODE" className="w-full bg-slate-50 p-6 pl-16 rounded-[2rem] outline-none font-mono font-black text-2xl text-[#0055A5] uppercase border-2 border-transparent focus:border-blue-200 shadow-inner" />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-[2rem]">HỦY</button>
                <button type="submit" className="flex-1 py-6 bg-[#0055A5] text-white font-black rounded-[2rem] shadow-xl">XÁC NHẬN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}