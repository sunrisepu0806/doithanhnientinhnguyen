"use client";

import { useState, useEffect } from "react";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  query, orderBy, serverTimestamp, writeBatch, onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  UserPlus, Trash2, Shield, ScanLine, ChevronLeft, 
  User, Lock, Loader2, Wrench, RefreshCcw, AlertTriangle, X, Heart, Database, Activity, LayoutGrid, Users
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState("scanner");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); 
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); 

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const currentRole = localStorage.getItem("user_role");
    if (currentRole !== "admin") router.push("/login");
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const q = query(collection(db, "users"), orderBy("username"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isMounted]);

  if (!isMounted) return null;

  const filteredUsers = users.filter(u => activeTab === "all" || u.role === activeTab);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string).trim();
    const password = (formData.get("password") as string).trim();
    if (users.find(u => u.username === username)) return alert("Tên đã tồn tại!");
    try {
      await addDoc(collection(db, "users"), { username, password, role, createdAt: serverTimestamp() });
      (e.target as HTMLFormElement).reset();
    } catch (error) { alert("Lỗi hệ thống."); }
  };

  // FIX LỖI: Chia nhỏ batch 500 documents để không bị Firebase chặn
  const batchDelete = async (col: string, msg: string) => {
    if (!confirm(msg) || !confirm("⚠️ XÁC NHẬN LẦN CUỐI! Dữ liệu sẽ mất vĩnh viễn!")) return;
    setProcessing(true);
    try {
      const q = query(collection(db, col));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        alert("Dữ liệu đã trống sẵn rồi!");
        setProcessing(false);
        return;
      }

      let batch = writeBatch(db);
      let count = 0;

      for (let i = 0; i < snap.docs.length; i++) {
        batch.delete(snap.docs[i].ref);
        count++;
        // Nếu đủ 500 thì commit và tạo batch mới
        if (count === 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      
      // Xóa nốt phần dư còn lại
      if (count > 0) {
        await batch.commit();
      }

      alert("Dọn dẹp thành công!");
      setIsToolsModalOpen(false);
    } catch (e) { 
      console.error(e);
      alert("Lỗi xử lý! Vui lòng mở F12 xem Console."); 
    } finally { 
      setProcessing(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] font-sans text-slate-800 pb-20 selection:bg-blue-100">
      
      {/* HEADER GỌN HƠN */}
      <header className="relative bg-[#0055A5] pt-16 pb-40 px-6 lg:px-12 overflow-hidden rounded-b-[3rem] lg:rounded-b-[5rem]">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:text-[#0055A5] transition-all border border-white/10">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase drop-shadow-lg">Bảo Mật</h1>
              <p className="text-blue-100 font-bold text-[10px] tracking-[0.3em] uppercase opacity-70">Hệ thống QNU Volunteer</p>
            </div>
          </div>
          <button onClick={() => setIsToolsModalOpen(true)} className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black py-3 px-6 rounded-2xl flex items-center gap-2 hover:bg-red-500 transition-all text-xs uppercase tracking-widest">
            <Wrench size={16} /> Công cụ
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-24 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* CỘT TRÁI: FORM (STICKY) */}
          <aside className="w-full lg:w-[380px] lg:sticky lg:top-8 shrink-0">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-white">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <UserPlus size={20} className="text-[#0055A5]"/> Cấp Tài Khoản
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Tên đăng nhập</label>
                  <input name="username" required className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-100 shadow-inner" placeholder="username..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Mật khẩu</label>
                  <input name="password" required className="w-full bg-slate-50 p-4 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-100 shadow-inner" placeholder="password..." />
                </div>
                <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl shadow-inner">
                  {['scanner', 'admin'].map((r) => (
                    <button key={r} type="button" onClick={() => setRole(r)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${role === r ? 'bg-[#0055A5] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                      {r === 'admin' ? 'Quản trị' : 'Máy quét'}
                    </button>
                  ))}
                </div>
                <button className="w-full bg-[#0055A5] text-white font-black py-4 rounded-[1.5rem] shadow-xl hover:bg-blue-700 transition-all uppercase text-[11px] tracking-widest">
                  Tạo tài khoản
                </button>
              </form>
            </div>
          </aside>

          {/* CỘT PHẢI: DANH SÁCH (THU GỌN) */}
          <section className="flex-1 w-full space-y-4">
            {/* THANH TAB NHỎ GỌN */}
            <div className="bg-white/80 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-slate-100 shadow-lg flex items-center gap-1">
               {[
                 { id: "all", label: "Tất cả", icon: LayoutGrid },
                 { id: "admin", label: "Admin", icon: Shield },
                 { id: "scanner", label: "Scanner", icon: ScanLine }
               ].map((tab) => (
                 <button 
                  key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                   <tab.icon size={14} /> {tab.label}
                 </button>
               ))}
            </div>

            {/* DANH SÁCH TÀI KHOẢN */}
            <div className="grid grid-cols-1 gap-2">
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(u => (
                  <div key={u.id} className="group bg-white p-3 px-5 rounded-2xl border border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${u.role === 'admin' ? 'bg-[#0055A5]' : 'bg-emerald-500'}`}>
                        {u.role === 'admin' ? <Shield size={18}/> : <ScanLine size={18}/>}
                      </div>
                      <div>
                        <p className="font-black text-slate-700 text-sm uppercase leading-none">{u.username}</p>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{u.role === 'admin' ? 'Administrator' : 'Scanner'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">PW: {u.password}</span>
                      <button onClick={() => confirm(`Xóa ${u.username}?`) && deleteDoc(doc(db, "users", u.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-12 rounded-[2rem] text-center border border-slate-100">
                   <Users className="mx-auto text-slate-200 mb-2" size={40} />
                   <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Chưa có tài khoản</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <div className="mt-20 opacity-20 text-center pointer-events-none">
        <span className="text-[9px] font-black uppercase tracking-[1em] text-slate-400 flex items-center justify-center gap-2">
           obi.phu08 <Heart size={10} className="fill-red-500 text-red-500"/> QNU
        </span>
      </div>

      {/* MODAL CÔNG CỤ */}
      {isToolsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl border-4 border-white animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight"><Database size={20}/> Quản trị</h2>
              <button onClick={() => setIsToolsModalOpen(false)}><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => batchDelete('attendance', 'Xóa lịch sử quét?')} disabled={processing} className="w-full py-4 rounded-2xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest border border-orange-100 hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                {processing ? "ĐANG DỌN..." : "Dọn dẹp quét mã"}
              </button>
              <button onClick={() => batchDelete('activities', 'Xóa toàn bộ buổi trực?')} disabled={processing} className="w-full py-4 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                {processing ? "ĐANG XÓA..." : "Xóa sạch buổi trực"}
              </button>
              <button onClick={() => batchDelete('members', 'Xóa toàn bộ Đội?')} disabled={processing} className="w-full py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl">
                {processing ? "ĐANG RESET..." : "Reset danh sách Đội"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}