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
  Activity, Sparkles, ArrowRight, Heart
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ActivityItem {
  id: string;
  name: string;
  password: string;
  createdAt?: any;
  isActive?: boolean;
}

export default function AdminDashboardPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // "Người gác cổng" - Giữ nguyên logic bảo vệ trang Admin
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

  // --- PHẦN BẢO ĐẢM DỮ LIỆU: KIỂM TRA TRÙNG LẶP ---
  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const password = (formData.get("password") as string).trim();
    
    if (!name || !password) return;

    // Kiểm tra xem Tên hoặc Passcode đã tồn tại chưa
    const isDuplicateName = activities.some(act => act.name.toLowerCase() === name.toLowerCase());
    const isDuplicatePass = activities.some(act => act.password === password);

    if (isDuplicateName) {
      alert("Lỗi: Tên hoạt động này đã tồn tại!");
      return;
    }

    if (isDuplicatePass) {
      alert("Lỗi: Mật khẩu (Passcode) này đã được sử dụng cho hoạt động khác!");
      return;
    }

    await addDoc(collection(db, "activities"), {
      name, 
      password, 
      createdAt: serverTimestamp(), 
      isActive: true
    });
    
    setShowModal(false);
    fetchActivities();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Xác nhận xóa hoạt động? Dữ liệu sẽ mất vĩnh viễn!")) {
      await deleteDoc(doc(db, "activities", id));
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleLogout = () => {
      if(confirm("Đội trưởng muốn đăng xuất?")) {
        localStorage.clear();
        router.push("/login");
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 selection:bg-blue-100">
      
      {/* HEADER: PHỐI MÀU THEO LOGO ĐỘI */}
      <div className="relative bg-[#0055A5] pb-64 pt-20 px-6 rounded-b-[5rem] overflow-hidden shadow-2xl shadow-blue-900/40">
         <div className="absolute inset-0 opacity-40 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#87CEEB] rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#0047AB] rounded-full blur-[120px]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-[40px] border-white/5 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-white/10 rounded-full"></div>
         </div>

         <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
            <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <img src="/logo.png" alt="Logo QNU" className="relative w-40 h-40 object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.4)]" />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-blue-200 font-black text-[10px] uppercase tracking-[0.4em] mb-3 flex items-center justify-center md:justify-start gap-2">
                       <MapPin size={12} className="text-red-400 fill-red-400" /> QUY NHON UNIVERSITY
                    </p>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight drop-shadow-lg">
                       Xin chào! <br/>
                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-sky-300 italic">Quản trị viên</span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 p-3 rounded-[3rem] backdrop-blur-xl border border-white/20 shadow-2xl">
                {[
                    { href: "/scan", icon: QrCode, label: "Quét" },
                    { href: "/admin/management", icon: Users, label: "Đội Viên" },
                    { href: "/admin/users", icon: Shield, label: "Bảo Mật" },
                ].map((item) => (
                    <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center w-20 h-20 rounded-[2.2rem] text-white hover:bg-white hover:text-[#0055A5] transition-all duration-500 group">
                        <item.icon size={26} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest">{item.label}</span>
                    </Link>
                ))}
                <button onClick={handleLogout} className="w-20 h-20 rounded-[2.2rem] bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-400/20">
                    <LogOut size={26} />
                </button>
            </div>
         </div>
      </div>

      {/* CONTENT AREA: SOFT UI CARDS */}
      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
        <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[4rem] shadow-2xl shadow-blue-900/10 border-4 border-white flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
                <div className="bg-gradient-to-tr from-[#0055A5] to-[#87CEEB] p-5 rounded-[2.2rem] text-white shadow-xl shadow-blue-200">
                    <Activity size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Chào Phú! 👋</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Hệ thống đang quản lý <span className="text-[#0055A5] font-black">{activities.length}</span> hoạt động</p>
                </div>
            </div>
            <button onClick={() => setShowModal(true)} className="w-full md:w-auto py-5 px-10 bg-[#0055A5] text-white font-black rounded-[2.5rem] shadow-2xl shadow-blue-300 hover:bg-[#0047AB] transition-all flex items-center justify-center gap-3">
                <Plus size={24} /> TẠO SỰ KIỆN MỚI
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? [1,2,3].map(i => (
                <div key={i} className="bg-white h-80 rounded-[4rem] animate-pulse border-4 border-white shadow-xl"></div>
            )) : activities.map((activity) => (
                <Link href={`/admin/activity/${activity.id}`} key={activity.id} className="group bg-white p-2 rounded-[4.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-200 hover:-translate-y-3 transition-all duration-700 border border-white">
                    <div className="bg-slate-50/50 rounded-[4rem] p-10 flex flex-col h-full border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-all duration-500">
                        <div className="flex justify-between items-start mb-8">
                            <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                activity.isActive !== false ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-200 text-slate-500 border-slate-300"
                            }`}>
                                {activity.isActive !== false ? "● Đang chạy" : "○ Đã đóng"}
                            </span>
                            <button onClick={(e) => handleDelete(activity.id, e)} className="p-3 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 mb-6 line-clamp-2 leading-tight group-hover:text-[#0055A5] transition-colors">{activity.name}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase mb-12">
                            <Calendar size={14} className="text-blue-400" />
                            {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : "Mới tạo"}
                        </div>
                        <div className="mt-auto flex items-center justify-between bg-white p-5 rounded-[2.5rem] shadow-inner border border-slate-100 group-hover:border-blue-100 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Code</p>
                                <p className="text-3xl font-mono font-black text-slate-700 tracking-widest group-hover:text-[#0055A5]">{activity.password}</p>
                            </div>
                            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-[#0055A5] shadow-md group-hover:bg-[#0055A5] group-hover:text-white transition-all"><ArrowRight size={28} /></div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </div>

      {/* MODAL: CHỐNG TRÙNG LẶP DỮ LIỆU */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-lg p-12 rounded-[4.5rem] shadow-2xl border-4 border-white relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <h2 className="text-4xl font-black mb-2 tracking-tight">Sự Kiện Mới</h2>
            <p className="text-slate-400 font-bold mb-10 text-sm uppercase tracking-widest text-center">Kiểm tra kỹ Tên và Passcode</p>
            <form onSubmit={handleCreateActivity} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-6 uppercase tracking-widest">Tên hoạt động</label>
                <input name="name" required placeholder="Ví dụ: Đại hội Đội..." className="w-full bg-slate-50 p-7 rounded-[2.5rem] outline-none font-bold text-slate-700 border-2 border-transparent focus:border-blue-200 shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 ml-6 uppercase tracking-widest">Mật khẩu điểm danh</label>
                <div className="relative">
                    <KeyRound className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                    <input name="password" required placeholder="PASSCODE" className="w-full bg-slate-50 p-7 pl-16 rounded-[2.5rem] outline-none font-mono font-black text-3xl text-[#0055A5] uppercase border-2 border-transparent focus:border-blue-200 shadow-inner" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-7 bg-slate-100 text-slate-500 font-black rounded-[2.5rem] hover:bg-slate-200 transition-all">HỦY</button>
                <button type="submit" className="flex-1 py-7 bg-[#0055A5] text-white font-black rounded-[2.5rem] shadow-xl shadow-blue-200 hover:bg-[#0047AB] transition-all">XÁC NHẬN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-20 flex flex-col items-center gap-4 opacity-30 pointer-events-none text-center px-4">
        <Heart size={24} className="text-red-500 fill-red-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Kết nối sức trẻ - Lan tỏa yêu thương - QNU</p>
      </div>
    </div>
  );
}