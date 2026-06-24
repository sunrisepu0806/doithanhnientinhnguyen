"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExcelJS from "exceljs";
import {
  Plus,
  Trash2,
  KeyRound,
  Users,
  LogOut,
  Shield,
  QrCode,
  Activity,
  ArrowRight,
  Heart,
  Trophy,
  BarChart3,
  Star,
  Search,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Định nghĩa kiểu dữ liệu cho Hoạt động
interface ActivityItem {
  id: string;
  name: string;
  password: string;
  type: string;
  points: number;
  isActive: boolean;
  createdAt?: any;
}

export default function AdminDashboardPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Form States
  const [actType, setActType] = useState("thien_nguyen");
  const [actPoints, setActPoints] = useState(10);
  
  const router = useRouter();

  // Kiểm tra quyền truy cập
  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "admin") {
      router.push("/login");
    } else {
      fetchActivities();
    }
  }, [router]);

  // Lấy dữ liệu từ Firestore
  const fetchActivities = async () => {
    try {
      const q = query(collection(db, "activities"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ActivityItem[];
      setActivities(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý nhóm hoạt động theo tháng
  const groupedActivities = activities.reduce((groups: Record<string, ActivityItem[]>, activity) => {
    const date = activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000) : new Date();
    const monthYear = `THÁNG ${date.getMonth() + 1}/${date.getFullYear()}`;
    
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(activity);
    
    return groups;
  }, {});

  // Xử lý tạo hoạt động mới
  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const password = (formData.get("password") as string).trim();

    try {
      await addDoc(collection(db, "activities"), {
        name,
        password,
        type: actType,
        points: Number(actPoints),
        isActive: true,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      fetchActivities();
    } catch (error) {
      console.error("Lỗi khi tạo hoạt động:", error);
      alert("Đã xảy ra lỗi khi tạo hoạt động!");
    }
  };

  // Xử lý xóa hoạt động
  const handleDeleteActivity = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) return;
    try {
      await deleteDoc(doc(db, "activities", id));
      setActivities((prev) => prev.filter((act) => act.id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      alert("Không thể xóa hoạt động này!");
    }
  };

  // Xử lý xuất báo cáo tổng hợp ra file Excel
  const handleExportReport = async () => {
    setIsExporting(true);
    // Nhường luồng cho UI render Spinner chống lag
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
      // 1. Fetch dữ liệu attendance và members
      const attSnap = await getDocs(collection(db, "attendance"));
      const attendances = attSnap.docs.map(doc => doc.data());

      const memSnap = await getDocs(collection(db, "members"));
      const membersData = memSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const workbook = new ExcelJS.Workbook();
      
      // 2. Tạo Trang tính 1: Tổng Hợp Hoạt Động
      const summaryWs = workbook.addWorksheet('Tổng Hợp Hoạt Động');
      summaryWs.columns = [
        { header: 'STT', key: 'stt', width: 5 },
        { header: 'TÊN HOẠT ĐỘNG', key: 'name', width: 40 },
        { header: 'PHÂN LOẠI', key: 'type', width: 20 },
        { header: 'ĐIỂM', key: 'points', width: 10 },
        { header: 'MẬT MÃ', key: 'password', width: 15 },
        { header: 'NGÀY TẠO', key: 'date', width: 15 },
        { header: 'SỐ LƯỢT ĐIỂM DANH', key: 'count', width: 25 },
      ];

      // Format header
      summaryWs.getRow(1).font = { bold: true, color: { argb: 'FF0055A5' } };
      summaryWs.getRow(1).alignment = { horizontal: 'center' };

      const sheetNames = new Set<string>();
      sheetNames.add('Tổng Hợp Hoạt Động');

      // 3. Duyệt qua từng hoạt động để điền trang tổng hợp và tạo trang riêng
      activities.forEach((act, index) => {
        const actAtts = attendances.filter(a => a.activityId === act.id);
        
        // Điền data vào Sheet Tổng Hợp
        summaryWs.addRow({
          stt: index + 1,
          name: act.name,
          type: act.type === "ho_tro" ? "Hỗ trợ mảng" : "Thiện nguyện",
          points: act.points || 10,
          password: act.password,
          date: act.createdAt?.seconds ? new Date(act.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : "Không rõ",
          count: actAtts.length
        });

        // Tạo Sheet riêng cho hoạt động (Tên sheet lọc ký tự đặc biệt, giới hạn 31 ký tự)
        let safeName = act.name.replace(/[\\/?*[\]:]/g, '_').substring(0, 27);
        let finalSheetName = safeName;
        let counter = 1;
        while (sheetNames.has(finalSheetName) || finalSheetName === '') {
            finalSheetName = `${safeName || 'Hoat_Dong'}_${counter}`;
            counter++;
        }
        sheetNames.add(finalSheetName);

        const ws = workbook.addWorksheet(finalSheetName);
        ws.columns = [
          { header: 'STT', key: 'stt', width: 5 },
          { header: 'HỌ VÀ TÊN', key: 'name', width: 25 },
          { header: 'MÃ SV', key: 'studentId', width: 15 },
          { header: 'TỔ', key: 'group', width: 10 },
          { header: 'NGÀNH HỌC', key: 'major', width: 30 },
          { header: 'THỜI GIAN ĐIỂM DANH', key: 'time', width: 20 },
        ];
        
        ws.getRow(1).font = { bold: true, color: { argb: 'FF0055A5' } };
        
        // Ép định dạng Text cho cột Mã SV
        ws.getColumn('studentId').numFmt = '@';

        // Sắp xếp thời gian điểm danh từ sớm đến muộn
        actAtts.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

        // Điền danh sách người điểm danh vào Sheet
        actAtts.forEach((att, idx) => {
          const memInfo = membersData.find(m => m.id === att.memberId || m.studentId === att.studentId);
          const row = ws.addRow({
            stt: idx + 1,
            name: att.memberName || memInfo?.fullName || "Không rõ",
            studentId: String(att.studentId || memInfo?.studentId || "").trim(),
            group: memInfo?.group ? `Tổ ${memInfo.group}` : "Không rõ",
            major: memInfo?.major || memInfo?.nganhHoc || "Không rõ",
            time: att.timestamp?.seconds ? new Date(att.timestamp.seconds * 1000).toLocaleString('vi-VN') : "Không rõ"
          });
          row.getCell('studentId').numFmt = '@'; // Khóa cứng hiển thị Text
        });
      });

      // 4. Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_Cao_Hoat_Dong_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
      a.click();

    } catch (error) {
      console.error("Export error:", error);
      alert("Có lỗi xảy ra khi xuất báo cáo!");
    } finally {
      setIsExporting(false);
    }
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <main className="min-h-screen overflow-y-auto scrollbar-hide relative bg-white">
        
        {/* HEADER */}
        <header className="relative bg-[#0055A5] pt-16 pb-32 px-6 lg:px-12 overflow-hidden rounded-b-[4rem] lg:rounded-b-[6rem]">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[100px]"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              
              {/* Logo & Greeting */}
              <div className="flex items-center gap-6 lg:gap-8 text-white">
                <img src="/logo.png" alt="Logo" className="w-20 h-20 lg:w-32 lg:h-32 drop-shadow-2xl" />
                <div>
                  <div className="flex items-center gap-2 mb-2 text-white/70">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-ping"></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Quy Nhon University</span>
                  </div>
                  <h1 className="text-4xl lg:text-7xl font-black tracking-tighter leading-none mb-2">Xin chào!</h1>
                  <p className="text-xl lg:text-4xl font-medium text-blue-100/80 italic">Quản trị viên</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-[2.5rem] backdrop-blur-xl border border-white/20 shadow-2xl">
                {[
                  { icon: QrCode, href: "/scan" },
                  { icon: Trophy, href: "/admin/leaderboard" },
                  { icon: BarChart3, href: "/admin/stats" },
                  { icon: Users, href: "/admin/management" },
                  { icon: Shield, href: "/admin/users" },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="w-11 h-11 lg:w-14 lg:h-14 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#0055A5] transition-all"
                  >
                    <item.icon size={22} />
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-red-500/20 text-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                >
                  <LogOut size={22} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* FLOATING ACTION BAR */}
        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
          <div className="bg-white/95 backdrop-blur-2xl p-6 lg:p-8 rounded-[3.5rem] shadow-2xl shadow-blue-900/10 border-4 border-white flex flex-col xl:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-5 w-full xl:w-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-[#0055A5] shrink-0">
                <Activity size={32} />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-xl font-black text-slate-800 tracking-tight truncate">Chào QTV! 👋</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest truncate mt-1">
                  Hệ thống quản lý <span className="text-[#0055A5] font-black">{activities.length} hoạt động</span>
                </p>
              </div>
            </div>

            <div className="relative flex-1 w-full max-w-lg hidden md:block">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 py-4 pl-14 pr-6 rounded-full outline-none font-bold text-sm focus:bg-white border border-transparent focus:border-blue-100 transition-all shadow-inner"
              />
            </div>

            <div className="flex w-full xl:w-auto flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={handleExportReport}
                disabled={isExporting}
                className="w-full sm:w-auto py-4 px-6 bg-emerald-500 text-white font-black rounded-[2rem] shadow-lg hover:shadow-emerald-300 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />} BÁO CÁO
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="w-full sm:w-auto py-4 px-6 bg-[#0055A5] text-white font-black rounded-[2rem] shadow-lg hover:shadow-blue-300 hover:bg-[#0047AB] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Plus size={20} /> TẠO SỰ KIỆN
              </button>
            </div>
          </div>
        </div>

        {/* ACTIVITY LIST */}
        <div className="max-w-7xl mx-auto px-6 mt-12 pb-32 flex flex-col gap-12">
          {loading ? (
             <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Đang tải dữ liệu...</div>
          ) : (
            Object.keys(groupedActivities).map((month) => {
              const filteredList = groupedActivities[month].filter((a) =>
                a.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              
              if (filteredList.length === 0) return null;

              return (
                <section key={month} className="flex flex-col gap-4">
                  <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] pl-6 border-l-4 border-blue-600 leading-none">
                    {month}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {filteredList.map((activity) => (
                      <div
                        key={activity.id}
                        className="group bg-white p-5 pr-8 rounded-[2.5rem] border border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-center justify-between"
                      >
                        {/* Cột Tên */}
                        <div className="flex items-center gap-6 flex-1 min-w-0 pr-4">
                          <div
                            className={`w-14 h-14 flex-shrink-0 rounded-3xl flex items-center justify-center shadow-inner ${
                              activity.type === "ho_tro" ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500"
                            }`}
                          >
                            <ArrowRight size={28} className="-rotate-45" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-black text-lg lg:text-xl text-slate-800 group-hover:text-[#0055A5] transition-colors uppercase tracking-tight break-words line-clamp-2">
                              {activity.name}
                            </h3>
                            <div className="flex gap-2 mt-1">
                              <span
                                className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                  activity.type === "ho_tro"
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-blue-100 text-[#0055A5]"
                                }`}
                              >
                                {activity.type === "ho_tro" ? "Hỗ trợ mảng" : "Thiện nguyện"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="hidden lg:grid grid-cols-3 w-[500px] flex-shrink-0 gap-8 px-10 border-l border-slate-100 ml-4">
                          <div className="flex flex-col justify-center min-w-0">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Pass Code</span>
                            <span className="font-mono font-black text-[#0055A5] text-lg lg:text-xl tracking-widest break-all line-clamp-1">
                              {activity.password}
                            </span>
                          </div>

                          <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Điểm</span>
                            <span className="text-slate-700 font-black text-lg flex items-center gap-1.5">
                              <Star size={14} className="fill-emerald-400 text-emerald-400" /> {activity.points || 10}
                            </span>
                          </div>

                          <div className="flex flex-col justify-center">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 text-center lg:text-left">Thời gian</span>
                            <span className="text-slate-400 font-bold text-xs">
                              {activity.createdAt?.seconds
                                ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString("vi-VN")
                                : "--/--"}
                            </span>
                          </div>
                        </div>

                        {/* Nút thao tác */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <Link
                            href={`/admin/activity/${activity.id}`}
                            className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-[#0055A5] hover:text-white transition-all text-slate-400 shadow-sm active:scale-90"
                          >
                            <QrCode size={22} />
                          </Link>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-red-500 hover:text-white transition-all text-slate-400 shadow-sm active:scale-90"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>

      {/* FOOTER */}
      <div className="fixed bottom-6 w-full text-center pointer-events-none z-30 opacity-40 px-4">
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center justify-center gap-2">
          obi.phu08 <Heart size={12} className="fill-red-500 text-red-500 animate-pulse" /> ĐTNTN QNU
        </span>
      </div>

      {/* MODAL TẠO SỰ KIỆN */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-xl p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-in zoom-in duration-300">
            <h2 className="text-4xl font-black mb-1 tracking-tight">Tạo Sự Kiện</h2>
            <form onSubmit={handleCreateActivity} className="space-y-6 mt-8">
              <input
                name="name"
                required
                placeholder="Tên hoạt động..."
                className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none font-bold border-2 border-transparent focus:border-blue-200 shadow-inner"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={actType}
                  onChange={(e) => {
                    setActType(e.target.value);
                    if (e.target.value === "thien_nguyen") setActPoints(10);
                  }}
                  className="bg-slate-50 p-6 rounded-[2rem] font-bold border-2 border-transparent focus:border-blue-200 outline-none shadow-inner"
                >
                  <option value="thien_nguyen">Thiện nguyện</option>
                  <option value="ho_tro">Hỗ trợ mảng</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={actPoints}
                  disabled={actType === "thien_nguyen"}
                  onChange={(e) => setActPoints(Number(e.target.value))}
                  className="bg-slate-50 p-6 rounded-[2rem] font-bold text-center border-2 border-transparent focus:border-blue-200 outline-none shadow-inner disabled:opacity-50"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                <input
                  name="password"
                  required
                  placeholder="PASSCODE"
                  className="w-full bg-slate-50 p-6 pl-16 rounded-[2rem] outline-none font-mono font-black text-2xl text-[#0055A5] uppercase border-2 border-transparent focus:border-blue-200 shadow-inner"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-6 bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors font-black rounded-[2rem]"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  className="flex-1 py-6 bg-[#0055A5] text-white hover:bg-blue-700 transition-colors font-black rounded-[2rem] shadow-xl"
                >
                  XÁC NHẬN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}