"use client";

import { useState, useEffect } from "react";
import { 
  collection, addDoc, getDocs, deleteDoc, doc, 
  query, orderBy, serverTimestamp, writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  UserPlus, Trash2, Shield, ScanLine, ChevronLeft, 
  User, Lock, Loader2, Wrench, RefreshCcw, AlertTriangle, X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState("scanner");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // Trạng thái xử lý reset/xóa data
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false); // Modal công cụ
  const router = useRouter();

  // --- 1. CHECK QUYỀN & LẤY DỮ LIỆU ---
  useEffect(() => {
    const currentRole = localStorage.getItem("user_role");
    if (currentRole !== "admin") {
      router.push("/login");
    } else {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("username"));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- 2. TẠO TÀI KHOẢN MỚI ---
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) return;

    // Check trùng
    if (users.find(u => u.username === username)) {
        alert("Tên đăng nhập đã tồn tại!");
        return;
    }

    try {
      await addDoc(collection(db, "users"), {
        username, password, role, createdAt: serverTimestamp()
      });
      alert("Tạo tài khoản thành công!");
      fetchUsers();
      (e.target as HTMLFormElement).reset();
    } catch (error) { alert("Lỗi khi tạo tài khoản."); }
  };

  // --- 3. XÓA TÀI KHOẢN ---
  const handleDelete = async (id: string, userRole: string) => {
    if (userRole === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
        alert("Không thể xóa Admin cuối cùng!");
        return;
    }
    if(confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
        try {
            await deleteDoc(doc(db, "users", id));
            fetchUsers();
        } catch (error) { alert("Lỗi khi xóa."); }
    }
  }

  // --- 4. TÍNH NĂNG CAO CẤP: XÓA DỮ LIỆU HÀNG LOẠT (BATCH DELETE) ---
  const batchDeleteCollection = async (collectionName: string, confirmMessage: string) => {
      if (!confirm(confirmMessage)) return;
      if (!confirm("⚠️ CẢNH BÁO LẦN 2: Hành động này KHÔNG THỂ khôi phục. Bạn chắc chắn muốn tiếp tục?")) return;

      setProcessing(true);
      try {
          const q = query(collection(db, collectionName));
          const snapshot = await getDocs(q);
          
          const batchSize = 500;
          let batch = writeBatch(db);
          let count = 0;

          for (const doc of snapshot.docs) {
              batch.delete(doc.ref);
              count++;
              if (count >= batchSize) {
                  await batch.commit();
                  batch = writeBatch(db);
                  count = 0;
              }
          }
          if (count > 0) await batch.commit();
          
          alert(`Đã dọn sạch dữ liệu ${collectionName === 'attendance' ? 'Lịch sử điểm danh' : 'Danh sách thành viên'} thành công!`);
          setIsToolsModalOpen(false);
      } catch (error) {
          console.error(error);
          alert("Có lỗi xảy ra khi xóa dữ liệu.");
      } finally {
          setProcessing(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-20 selection:bg-blue-200">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER NGHỆ THUẬT (BLUE GRADIENT) */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[3rem] shadow-xl shadow-blue-200/50 text-white">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="bg-white/20 p-3 rounded-full hover:bg-white hover:text-blue-600 transition-all backdrop-blur-md border border-white/30">
                    <ChevronLeft size={24}/>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight drop-shadow-sm">Quản Lý Tài Khoản</h1>
                    <p className="text-blue-100 text-sm font-medium opacity-90">Cấp quyền & Bảo trì hệ thống</p>
                </div>
            </div>
            
            {/* Nút mở công cụ quản trị dữ liệu */}
            <button 
                onClick={() => setIsToolsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-red-500/80 hover:bg-red-500 text-white rounded-[2rem] font-bold text-sm shadow-lg border border-red-400/50 transition-all"
            >
                <Wrench size={18} /> Công Cụ Dữ Liệu
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* CỘT TRÁI: FORM TẠO MỚI (GLASS STYLE) */}
            <div className="lg:col-span-5">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 sticky top-6 border border-white relative overflow-hidden">
                    {/* Decoration */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-50"></div>

                    <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <UserPlus className="text-blue-600"/> Cấp Tài Khoản Mới
                    </h2>
                    
                    <form onSubmit={handleCreateUser} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-4 uppercase tracking-wider">Tên đăng nhập</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    name="username" 
                                    required 
                                    className="w-full bg-slate-50 p-4 pl-12 rounded-[1.5rem] border-none outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 transition-all" 
                                    placeholder="VD: scan_team_1"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-4 uppercase tracking-wider">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    name="password" 
                                    required 
                                    className="w-full bg-slate-50 p-4 pl-12 rounded-[1.5rem] border-none outline-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-200 transition-all" 
                                    placeholder="VD: 123456"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-4 uppercase tracking-wider">Chọn Quyền</label>
                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setRole("scanner")} 
                                    className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm transition-all flex items-center justify-center gap-2 ${role === 'scanner' ? 'bg-green-100 text-green-700 ring-2 ring-green-500 shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    <ScanLine size={18}/> Scan
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setRole("admin")} 
                                    className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm transition-all flex items-center justify-center gap-2 ${role === 'admin' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    <Shield size={18}/> Admin
                                </button>
                            </div>
                        </div>

                        <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-[2rem] shadow-lg shadow-blue-300 hover:bg-blue-700 hover:shadow-blue-400 hover:-translate-y-1 transition-all mt-4 active:scale-95">
                            + Thêm Tài Khoản
                        </button>
                    </form>
                </div>
            </div>

            {/* CỘT PHẢI: DANH SÁCH USER */}
            <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-slate-700">Danh Sách Hiện Có</h2>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-400 shadow-sm">{users.length} users</span>
                </div>
                
                {loading ? (
                    <div className="flex justify-center py-10 text-slate-400"><Loader2 className="animate-spin" size={32}/></div>
                ) : (
                    users.map(u => (
                        <div key={u.id} className="bg-white p-5 rounded-[2rem] shadow-md shadow-slate-200/40 flex justify-between items-center group hover:shadow-xl hover:shadow-blue-100 transition-all border border-transparent hover:border-blue-100">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-sm text-white ${u.role === 'admin' ? 'bg-indigo-500' : 'bg-green-500'}`}>
                                    {u.role === 'admin' ? <Shield size={24}/> : <ScanLine size={24}/>}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{u.username}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'text-indigo-400' : 'text-green-500'}`}>
                                        {u.role === 'admin' ? 'Quản trị viên' : 'Nhân viên Scan'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block bg-slate-50 px-4 py-2 rounded-[1rem] text-xs font-mono font-bold text-slate-500 border border-slate-100">
                                    {u.password}
                                </div>
                                <button 
                                    onClick={() => handleDelete(u.id, u.role)} 
                                    className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-300 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm group-hover:bg-white"
                                    title="Xóa user này"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* --- MODAL CÔNG CỤ DỮ LIỆU --- */}
      {isToolsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-200 border-4 border-slate-50 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                      <Wrench className="text-slate-500"/> Công Cụ Dữ Liệu
                  </h2>
                  <button onClick={() => setIsToolsModalOpen(false)} className="p-2 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
              </div>
              
              <div className="space-y-5">
                  {/* Reset Điểm Danh */}
                  <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 mb-2 text-orange-600 font-black">
                          <RefreshCcw size={20}/> RESET ĐIỂM DANH
                      </div>
                      <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">
                          Hành động này sẽ xóa toàn bộ lịch sử điểm danh. Số buổi tham gia của tất cả thành viên sẽ về <span className="font-bold">0</span>.
                          <br/><span className="text-xs text-orange-400 italic">(Thông tin thành viên vẫn được giữ nguyên)</span>
                      </p>
                      <button 
                        onClick={() => batchDeleteCollection('attendance', "Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử điểm danh?")}
                        disabled={processing}
                        className="w-full bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 font-bold py-3 rounded-[1.5rem] transition-all shadow-sm"
                      >
                        {processing ? "Đang xử lý..." : "Xóa Lịch Sử Điểm Danh"}
                      </button>
                  </div>

                  {/* Xóa Sạch Thành Viên */}
                  <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 mb-2 text-red-600 font-black">
                          <AlertTriangle size={20}/> XÓA TẤT CẢ THÀNH VIÊN
                      </div>
                      <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">
                          Xóa sạch danh sách đội viên khỏi hệ thống. Dùng khi thay đổi nhiệm kỳ hoặc làm mới dữ liệu.
                          <br/><span className="text-xs text-red-400 italic font-bold">(Không thể hoàn tác!)</span>
                      </p>
                      <button 
                        onClick={() => batchDeleteCollection('members', "CỰC KỲ NGUY HIỂM: Bạn có chắc chắn muốn xóa TẤT CẢ THÀNH VIÊN không?")}
                        disabled={processing}
                        className="w-full bg-red-600 text-white font-bold py-3 rounded-[1.5rem] shadow-lg shadow-red-200 hover:bg-red-700 transition-all border border-red-600"
                      >
                        {processing ? "Đang xóa..." : "Xóa Sạch Dữ Liệu"}
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
