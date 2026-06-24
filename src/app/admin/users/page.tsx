"use client";

import { useState, useEffect } from "react";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  query, orderBy, serverTimestamp, writeBatch, onSnapshot, where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  UserPlus, Trash2, Shield, ScanLine, ChevronLeft, 
  Loader2, Wrench, RefreshCcw, AlertTriangle, X, Activity, LayoutGrid, Users, Briefcase
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: "admin" | "scanner" | "totruong";
  to?: string; 
  createdAt?: any;
}

interface MemberInfo {
  id: string;
  hoTen: string;
  to: string;
  msv: string;
  nganh: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]); 
  const [role, setRole] = useState<string>("scanner");
  const [toInput, setToInput] = useState<string>(""); 
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); 
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); 
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserTo, setCurrentUserTo] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const currentRole = localStorage.getItem("user_role");
    const userTo = localStorage.getItem("user_to"); 
    
    if (currentRole !== "admin" && currentRole !== "totruong") {
      router.push("/login");
    } else {
      setCurrentUserRole(currentRole);
      setCurrentUserTo(userTo);
    }
  }, [router]);

  useEffect(() => {
    if (!isMounted || !currentUserRole) return;

    if (currentUserRole === "admin") {
      const q = query(collection(db, "users"), orderBy("username"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<UserAccount, "id">) })));
        setLoading(false);
      });
      return () => unsubscribe();
    }

    if (currentUserRole === "totruong" && currentUserTo) {
      const q = query(collection(db, "members"), where("to", "==", currentUserTo));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMembers(snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Omit<MemberInfo, "id">) })));
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isMounted, currentUserRole, currentUserTo]);

  if (!isMounted) return null;

  const filteredUsers = users.filter(u => activeTab === "all" || u.role === activeTab);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const username = (formData.get("username") as string).trim();
    const password = (formData.get("password") as string).trim();
    
    if (!username || !password) return alert("Vui lòng nhập đủ thông tin!");
    if (role === "totruong" && !toInput.trim()) return alert("Vui lòng nhập tên Tổ!");
    if (users.find(u => u.username === username)) return alert("Tên đăng nhập đã tồn tại!");

    try {
      const payload: any = {
        username,
        password,
        role,
        createdAt: serverTimestamp()
      };

      if (role === "totruong") {
        payload.to = toInput.trim(); 
      }

      await addDoc(collection(db, "users"), payload);
      (e.target as HTMLFormElement).reset();
      setToInput("");
    } catch (error) { 
      alert("Lỗi hệ thống."); 
    }
  };

  const batchDelete = async (col: string, msg: string) => {
    if (!confirm(msg) || !confirm("⚠️ XÁC NHẬN LẦN CUỐI!")) return;
    setProcessing(true);
    try {
      const q = query(collection(db, col));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("Dữ liệu trống!");
        setProcessing(false);
        return;
      }
      let batch = writeBatch(db);
      let count = 0;
      for (let i = 0; i < snap.docs.length; i++) {
        batch.delete(snap.docs[i].ref);
        count++;
        if (count === 500) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
      alert("Thành công!");
      setIsToolsModalOpen(false);
    } catch (e) { 
      alert("Lỗi xử lý!"); 
    } finally { 
      setProcessing(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-12">
      
      <header className="bg-[#0055A5] text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-tight">
                {currentUserRole === "admin" ? "Bảo Mật Hệ Thống" : `Quản Lý Tổ: ${currentUserTo}`}
              </h1>
            </div>
          </div>
          {currentUserRole === "admin" && (
            <button onClick={() => setIsToolsModalOpen(true)} className="bg-red-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 hover:bg-red-700 transition-all text-xs uppercase shadow-md">
              <Wrench size={14} /> Công cụ
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {currentUserRole === "admin" ? (
            <div className="bg-white p-6 rounded-soft border border-blue-50 shadow-soft-xl h-fit">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-800">
                <UserPlus size={18} className="text-[#0055A5]"/> Cấp Tài Khoản
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tên đăng nhập</label>
                  <input name="username" required className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm focus:bg-white transition-all" placeholder="Nhập username..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Mật khẩu</label>
                  <input name="password" required className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm focus:bg-white transition-all" placeholder="Nhập mật khẩu..." />
                </div>
                
                {role === "totruong" && (
                  <div className="animate-in fade-in zoom-in duration-200">
                    <label className="text-xs font-bold text-orange-600 block mb-1">Tên Tổ quản lý</label>
                    <input value={toInput} onChange={(e) => setToInput(e.target.value)} required className="w-full bg-orange-50/30 p-3 rounded-xl border border-orange-200 outline-none focus:border-orange-500 text-sm" placeholder="Ví dụ: Tổ 1" />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'scanner', txt: 'Máy quét' },
                    { id: 'totruong', txt: 'Tổ trưởng' },
                    { id: 'admin', txt: 'Admin' }
                  ].map((item) => (
                    <button key={item.id} type="button" onClick={() => setRole(item.id)} className={`py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all ${role === item.id ? 'bg-[#0055A5] text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'}`}>
                      {item.txt}
                    </button>
                  ))}
                </div>
                <button className="w-full bg-[#0055A5] text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-wider shadow-lg">
                  Tạo tài khoản
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-6 rounded-soft text-white shadow-blue-glow h-fit border border-slate-600/30">
              <Briefcase size={24} className="mb-2 opacity-80" />
              <h2 className="text-base font-bold uppercase">Quyền Tổ Trưởng</h2>
              <p className="text-xs text-slate-300 mt-1">
                Xem danh sách thành viên trực thuộc: <span className="font-bold text-white">{currentUserTo}</span>
              </p>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <span>Số lượng:</span>
                <span className="text-xl font-bold">{members.length}</span>
              </div>
            </div>
          )}

          <div className="lg:col-span-2 space-y-4">
            {currentUserRole === "admin" ? (
              <>
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-sm">
                   {[
                     { id: "all", label: "Tất cả", icon: LayoutGrid },
                     { id: "admin", label: "Admin", icon: Shield },
                     { id: "totruong", label: "Tổ trưởng", icon: Briefcase },
                     { id: "scanner", label: "Scanner", icon: ScanLine }
                   ].map((tab) => (
                     <button 
                      key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-[10px] uppercase transition-all ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                     >
                       <tab.icon size={12} /> {tab.label}
                     </button>
                   ))}
                </div>

                <div className="space-y-2">
                  {loading ? (
                    <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={20} /></div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map(u => (
                      <div key={u.id} className="bg-white p-4 px-6 rounded-soft border border-slate-150 flex justify-between items-center shadow-blue-glow hover:scale-[1.01] transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${u.role === 'admin' ? 'bg-[#0055A5]' : u.role === 'totruong' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                            {u.role === 'admin' ? <Shield size={16}/> : u.role === 'totruong' ? <Briefcase size={16}/> : <ScanLine size={16}/>}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{u.username}</p>
                            <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                              {u.role === 'admin' ? 'Admin' : u.role === 'totruong' ? `Tổ trưởng (${u.to})` : 'Scanner'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">PW: {u.password}</span>
                          <button onClick={() => confirm(`Xóa ${u.username}?`) && deleteDoc(doc(db, "users", u.id))} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-8 text-center border border-slate-200 rounded-soft text-xs text-slate-400 font-bold uppercase shadow-sm">Không có tài khoản</div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="bg-slate-700 text-white p-3 px-4 rounded-xl text-xs font-bold uppercase flex justify-between items-center shadow-md">
                  <span>Thành viên tổ trực thuộc</span>
                  <span className="bg-slate-600 px-2 py-0.5 rounded">{currentUserTo}</span>
                </div>
                
                <div className="space-y-2">
                  {loading ? (
                    <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={20} /></div>
                  ) : members.length > 0 ? (
                    members.map(m => (
                      <div key={m.id} className="bg-white p-5 rounded-soft border border-blue-50 shadow-blue-glow flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{m.hoTen}</p>
                          <p className="text-[11px] text-slate-400">Ngành: <span className="text-slate-600 font-medium">{m.nganh}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">MSV: {m.msv}</span>
                          <span className="text-[10px] font-bold bg-blue-50 text-[#0055A5] px-2 py-1 rounded">Tổ: {m.to}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-8 text-center border border-slate-200 rounded-soft text-xs text-slate-400 font-bold uppercase shadow-sm">Không có thành viên</div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {isToolsModalOpen && currentUserRole === "admin" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm p-6 rounded-soft border border-slate-200 shadow-xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold flex items-center gap-2 uppercase text-red-600"><AlertTriangle size={16}/> Hành động nguy hiểm</h2>
              <button onClick={() => setIsToolsModalOpen(false)}><X size={18} className="text-slate-400"/></button>
            </div>
            <div className="space-y-2">
              <button onClick={() => batchDelete('attendance', 'Reset toàn bộ chuyên cần?')} disabled={processing} className="w-full py-3 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs uppercase border border-orange-200 hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2">
                <RefreshCcw size={14} className={processing ? "animate-spin" : ""} /> Reset Chuyên Cần
              </button>
              <button onClick={() => batchDelete('activities', 'Xóa tất cả hoạt động?')} disabled={processing} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-xs uppercase border border-red-200 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
                <Activity size={14} /> Xóa Hoạt Động
              </button>
              <button onClick={() => batchDelete('members', 'Xóa tất cả thành viên?')} disabled={processing} className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs uppercase border border-slate-200 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2">
                <Users size={14} /> Xóa Thành Viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}