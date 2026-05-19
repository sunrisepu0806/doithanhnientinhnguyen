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
  Activity, ArrowRight, Heart, Trophy, BarChart3, Star
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ActivityItem {
  id: string;
  name: string;
  password: string;
  type: string; 
  points: number; 
  createdAt?: any;
  isActive?: boolean;
}

export default function AdminDashboardPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
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
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityItem)));
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const password = (formData.get("password") as string).trim();
    
    if (!name || !password) return;

    const isDuplicatePass = activities.some(act => act.password === password);
    if (isDuplicatePass) {
      alert("Lỗi: Mật khẩu này đã tồn tại!");
      return;
    }

    await addDoc(collection(db, "activities"), {
      name, 
      password, 
      type: actType,
      points: Number(actPoints),
      createdAt: serverTimestamp(), 
      isActive: true
    });
    
    setShowModal(false);
    setActType("thien_nguyen");
    setActPoints(10);
    fetchActivities();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Xác nhận xóa hoạt động?")) {
      await deleteDoc(doc(db, "activities", id));
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleLogout = () => {
      if(confirm("Đăng xuất khỏi hệ thống?")) {
        localStorage.clear();
        router.push("/login");
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      
      {/* HEADER */}
      <div className="relative bg-[#0055A5] pb-64 pt-20 px-6 rounded-b-[5rem] overflow-hidden shadow-2xl">
         <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#87CEEB] rounded-full blur-[150px]"></div>
         </div>

         <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
            <div className="flex flex-col md:flex-row items-center gap-10">
                <img src="/logo.png" alt="Logo QNU" className="w-40 h-40 object-contain drop-shadow-2xl" />
                <div className="text-center md:text-left text-white">
                    <p className="text-blue-200 font-black text-[10px] tracking-[0.4em] mb-3 uppercase">
                       <MapPin size={12} className="inline mr-1" /> Quy Nhon University
                    </p>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
                       Xin chào! <br/>
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-sky-300 italic">Quản trị viên</span>
                    </h1>
                </div>
            </div>

            {/* NAV: ĐÃ KHÔI PHỤC KHIÊNG BẢO MẬT */}
            <div className="flex items-center gap-1 bg-white/10 p-2 rounded-[3rem] backdrop-blur-xl border border-white/20">
                {[
                    { href: "/scan", icon: QrCode, label: "Quét" },
                    { href: "/admin/leaderboard", icon: Trophy, label: "Vinh Danh" },
                    { href: "/admin/stats", icon: BarChart3, label: "Thống Kê" },
                    { href: "/admin/management", icon: Users, label: "Đội Viên" },
                    { href: "/admin/users", icon: Shield, label: "Bảo Mật" }, // Cái khiêng đã trở lại ở đây
                ].map((item) => (
                    <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-[2.2rem] text-white hover:bg-white hover:text-[#0055A5] transition-all group">
                        <item.icon size={22} />
                        <span className="text-[7px] font-black uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{item.label}</span>
                    </Link>
                ))}
                <button onClick={handleLogout} className="w-16 h-16 md:w-20 md:h-20 rounded-[2.2rem] bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                    <LogOut size={22} />
                </button>
            </div>
         </div>
      </div>

      {/* DASHBOARD INFO */}
      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
        <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[4rem] shadow-2xl border-4 border-white flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
                <div className="bg-gradient-to-tr from-[#0055A5] to-[#87CEEB] p-5 rounded-[2.2rem] text-white shadow-xl">
                    <Activity size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Chào Phú! 👋</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Đang quản lý <span className="text-[#0055A5] font-black">{activities.length}</span> hoạt động</p>
                </div>
            </div>
            <button onClick={() => setShowModal(true)} className="w-full md:w-auto py-5 px-10 bg-[#0055A5] text-white font-black rounded-[2.5rem] shadow-2xl hover:bg-[#0047AB] transition-all flex items-center justify-center gap-3">
                <Plus size={24} /> TẠO SỰ KIỆN MỚI
            </button>
        </div>

        {/* HOẠT ĐỘNG CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? [1,2,3].map(i => (
                <div key={i} className="bg-white h-80 rounded-[4rem] animate-pulse shadow-xl"></div>
            )) : activities.map((activity) => (
                <Link href={`/admin/activity/${activity.id}`} key={activity.id} className="group bg-white p-2 rounded-[4.5rem] shadow-xl hover:shadow-blue-200 hover:-translate-y-3 transition-all duration-700">
                    <div className="bg-slate-50/50 rounded-[4rem] p-10 flex flex-col h-full border border-slate-100 group-hover:bg-white transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-2">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                                  activity.isActive !== false ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-200 text-slate-500 border-slate-300"
                              }`}>
                                  {activity.isActive !== false ? "● Online" : "○ Off"}
                              </span>
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                                  activity.type === 'ho_tro' ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-blue-100 text-blue-600 border-blue-200"
                              }`}>
                                  {activity.type === 'ho_tro' ? "Hỗ trợ" : "Thiện nguyện"}
                              </span>
                            </div>
                            <button onClick={(e) => handleDelete(activity.id, e)} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-4 line-clamp-2 leading-tight group-hover:text-[#0055A5]">{activity.name}</h3>
                        
                        <div className="flex items-center gap-4 mb-8">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase">
                                <Calendar size={14} />
                                {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : "Mới"}
                            </div>
                            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
                                <Star size={14} className="fill-emerald-500" />
                                {activity.points || 10} Điểm
                            </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between bg-white p-5 rounded-[2.5rem] shadow-inner border border-slate-100 group-hover:border-blue-100">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Code</p>
                                <p className="text-2xl font-mono font-black text-slate-700 group-hover:text-[#0055A5]">{activity.password}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-[#0055A5] group-hover:bg-[#0055A5] group-hover:text-white transition-all"><ArrowRight size={24} /></div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-xl p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-in zoom-in duration-300">
            <h2 className="text-4xl font-black mb-2 tracking-tight">Tạo Sự Kiện</h2>
            <p className="text-slate-400 font-bold mb-8 text-[11px] uppercase tracking-widest text-center">Phân loại & Thiết lập điểm số</p>
            
            <form onSubmit={handleCreateActivity} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Tên hoạt động</label>
                <input name="name" required placeholder="Nhập tên..." className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none font-bold text-slate-700 border-2 border-transparent focus:border-blue-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Loại hình</label>
                  <select 
                    value={actType} 
                    onChange={(e) => {
                      setActType(e.target.value);
                      if(e.target.value === "thien_nguyen") setActPoints(10);
                    }}
                    className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none font-bold text-slate-700 border-2 border-transparent focus:border-blue-200"
                  >
                    <option value="thien_nguyen">Thiện nguyện</option>
                    <option value="ho_tro">Hỗ trợ mảng</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Điểm (1-10)</label>
                  <input 
                    type="number" min="1" max="10"
                    value={actPoints}
                    disabled={actType === "thien_nguyen"}
                    onChange={(e) => setActPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none font-bold text-slate-700 border-2 border-transparent focus:border-blue-200 text-center" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Mật khẩu Passcode</label>
                <div className="relative">
                    <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                    <input name="password" required placeholder="PASSCODE" className="w-full bg-slate-50 p-6 pl-14 rounded-[2rem] outline-none font-mono font-black text-2xl text-[#0055A5] uppercase border-2 border-transparent focus:border-blue-200" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-[2rem] hover:bg-slate-200 transition-all">HỦY</button>
                <button type="submit" className="flex-1 py-6 bg-[#0055A5] text-white font-black rounded-[2rem] shadow-xl hover:bg-[#0047AB] transition-all">XÁC NHẬN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="mt-20 flex flex-col items-center gap-4 opacity-30 text-center">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">QNU Volunteer Team</p>
      </div>
    </div>
  );
}