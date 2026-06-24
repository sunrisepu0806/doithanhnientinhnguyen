"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Search, Loader2, UserCircle, MapPin, Calendar, 
  Award, Star, CalendarCheck, ArrowLeft, Heart 
} from "lucide-react";
import Link from "next/link";

interface MemberResult {
  id: string;
  fullName: string;
  studentId: string;
  major: string;
  group: string;
  dob: string;
}

interface ActivityRecord {
  id: string;
  name: string;
  date: string;
  points: number;
}

export default function SearchStudentPage() {
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [member, setMember] = useState<MemberResult | null>(null);
  const [history, setHistory] = useState<ActivityRecord[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Cache danh sách hoạt động để map điểm
  const [activitiesMap, setActivitiesMap] = useState<Record<string, any>>({});

  useEffect(() => {
    // Tải trước danh sách hoạt động để map điểm và tên
    const fetchActivities = async () => {
      const snap = await getDocs(collection(db, "activities"));
      const map: Record<string, any> = {};
      snap.docs.forEach(doc => {
        map[doc.id] = { id: doc.id, ...doc.data() };
      });
      setActivitiesMap(map);
    };
    fetchActivities();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    setError("");
    setMember(null);
    setHistory([]);
    setTotalPoints(0);

    try {
      // 1. Tìm thông tin sinh viên
      const qMember = query(collection(db, "members"), where("studentId", "==", searchInput.trim()));
      const memberSnap = await getDocs(qMember);

      if (memberSnap.empty) {
        setError("Không tìm thấy thông tin chiến sĩ với mã số này!");
        setLoading(false);
        return;
      }

      const memberData = { id: memberSnap.docs[0].id, ...memberSnap.docs[0].data() } as MemberResult;
      setMember(memberData);

      // 2. Tìm lịch sử điểm danh
      const qAtt = query(collection(db, "attendance"), where("studentId", "==", memberData.studentId));
      const attSnap = await getDocs(qAtt);

      let points = 0;
      const attHistory: ActivityRecord[] = [];

      attSnap.docs.forEach(doc => {
        const attData = doc.data();
        const act = activitiesMap[attData.activityId];
        
        const actPoints = act ? Number(act.points || 10) : 10;
        const actName = act ? (act.name || act.title) : (attData.activityName || "Hoạt động hệ thống");
        const actDate = attData.timestamp?.seconds 
          ? new Date(attData.timestamp.seconds * 1000).toLocaleDateString('vi-VN') 
          : "N/A";

        points += actPoints;
        attHistory.push({
          id: doc.id,
          name: actName,
          date: actDate,
          points: actPoints
        });
      });

      setTotalPoints(points);
      setHistory(attHistory);

    } catch (err) {
      console.error(err);
      setError("Đã xảy ra lỗi khi tra cứu dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 pb-20 flex flex-col">
      {/* HEADER TÌM KIẾM */}
      <div className="bg-[#0055A5] pt-12 pb-24 px-6 relative overflow-hidden shrink-0 rounded-b-[3rem] lg:rounded-b-[4rem] shadow-lg">
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] bg-sky-300/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <div className="mb-6 flex justify-center">
             <div className="bg-white/10 p-4 rounded-[1.5rem] backdrop-blur-md shadow-inner text-white">
                <Search size={32} />
             </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight mb-2">Tra Cứu Thông Tin</h1>
          <p className="text-blue-100/80 font-bold text-xs uppercase tracking-widest mb-8">Hệ thống dữ liệu Đội thanh niên tình nguyện QNU</p>
          
          <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
            <input 
              type="text" 
              placeholder="Nhập mã sinh viên cần tìm..." 
              className="w-full bg-white py-4 pl-6 pr-16 rounded-full outline-none font-bold text-slate-700 shadow-xl border-4 border-white/20 focus:border-blue-300 transition-all uppercase placeholder:normal-case placeholder:text-slate-400 placeholder:font-medium"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#0055A5] rounded-full flex items-center justify-center text-white shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin"/> : <Search size={18} />}
            </button>
          </form>
        </div>
      </div>

      {/* NỘI DUNG KẾT QUẢ */}
      <main className="max-w-3xl mx-auto w-full px-4 -mt-10 relative z-20 flex-1">
        
        {/* State: Chưa tìm kiếm */}
        {!member && !loading && !error && (
          <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 text-center">
            <UserCircle size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="font-bold text-slate-400 text-sm uppercase tracking-wider">Nhập mã sinh viên để xem hồ sơ</p>
          </div>
        )}

        {/* State: Lỗi */}
        {error && (
          <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 text-center animate-in zoom-in duration-200 shadow-sm">
            <p className="font-bold text-red-500 uppercase tracking-tight">{error}</p>
          </div>
        )}

        {/* State: Có kết quả */}
        {member && !loading && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* THẺ THÔNG TIN */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -z-0"></div>
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-tr from-[#0055A5] to-blue-400 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-lg shrink-0 border-4 border-white">
                  {member.fullName.charAt(0)}
                </div>
                
                <div className="text-center md:text-left flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-1">{member.fullName}</h2>
                  <div className="inline-block bg-blue-50 text-[#0055A5] px-3 py-1 rounded-lg font-mono font-bold text-sm tracking-widest mb-4">
                    {member.studentId}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm font-semibold text-slate-600">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <div className="p-1.5 bg-slate-100 rounded-md text-slate-400"><MapPin size={14}/></div>
                      <span className="truncate">{member.major || "Chưa cập nhật ngành"}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <div className="p-1.5 bg-slate-100 rounded-md text-slate-400"><Calendar size={14}/></div>
                      <span>{member.dob || "Chưa cập nhật ngày sinh"}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <div className="p-1.5 bg-orange-50 rounded-md text-orange-400"><Award size={14}/></div>
                      <span className="text-orange-600 font-bold uppercase">Tổ {member.group || "Chưa phân tổ"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box Điểm */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số hoạt động</p>
                   <p className="text-2xl font-black text-slate-700">{history.length}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                   <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Tổng điểm</p>
                   <p className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1">
                     {totalPoints} <Star size={18} className="fill-emerald-500" />
                   </p>
                </div>
              </div>
            </div>

            {/* LỊCH SỬ HOẠT ĐỘNG */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100">
               <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2 text-sm">
                 <CalendarCheck className="text-[#0055A5]" size={18}/> 
                 Lịch sử tham gia
               </h3>
               
               <div className="space-y-3">
                 {history.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chưa tham gia hoạt động nào</p>
                    </div>
                 ) : (
                    history.map((act, idx) => (
                      <div key={act.id + idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-100 transition-all shadow-sm">
                        <div className="min-w-0 pr-4">
                          <p className="font-bold text-slate-700 text-sm uppercase truncate mb-1">{act.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{act.date}</p>
                        </div>
                        <div className="shrink-0 bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl font-black text-xs">
                          +{act.points}
                        </div>
                      </div>
                    ))
                 )}
               </div>
            </div>
            
          </div>
        )}
      </main>

      <div className="mt-12 text-center pointer-events-none opacity-20 shrink-0">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center justify-center gap-1.5">
          obi.phu08 <Heart size={10} className="fill-red-500 text-red-500"/> QNU
        </span>
      </div>
    </div>
  );
}