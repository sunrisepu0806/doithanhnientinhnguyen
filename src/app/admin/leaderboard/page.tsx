"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ChevronLeft, Loader2, Trophy, Star, Search, 
  Heart, Medal, Crown, Flame, Award, TrendingUp, CalendarCheck, MapPin, Calendar
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  fullName: string;
  studentId: string;
  major: string;
  group: string;
  totalSessions: number;
  totalPoints: number;
}

export default function AdminLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  
  // State lọc thời gian
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Lấy dữ liệu Realtime
    const unsubActs = onSnapshot(collection(db, "activities"), (actSnap) => {
      const actData = actSnap.docs.map(d => ({ 
        id: d.id, 
        points: Number(d.data().points || 10) 
      }));

      const unsubMems = onSnapshot(collection(db, "members"), (memSnap) => {
        const mems = memSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        onSnapshot(collection(db, "attendance"), (attSnap) => {
          const allAtt = attSnap.docs.map(d => d.data());

          // LỌC DỮ LIỆU THEO THÁNG/NĂM CHỌN
          const filteredAttendance = allAtt.filter(att => {
            if (!att.timestamp) return false;
            const date = new Date(att.timestamp.seconds * 1000);
            return (date.getMonth() + 1) === selectedMonth && date.getFullYear() === selectedYear;
          });

          const updated = mems.map(m => {
            const myAtt = filteredAttendance.filter((a: any) => a.memberId === m.id || a.studentId === m.studentId);
            const totalPoints = myAtt.reduce((sum, att) => {
              const activity = actData.find(act => act.id === att.activityId);
              return sum + (activity ? Number(activity.points) : 10);
            }, 0);

            return {
              ...m,
              totalSessions: myAtt.length,
              totalPoints: totalPoints
            };
          }).sort((a, b) => b.totalPoints - a.totalPoints); 

          setMembers(updated);
          setLoading(false);
        });
      });
    });

    return () => unsubActs();
  }, [isMounted, selectedMonth, selectedYear]);

  if (!isMounted) return null;

  const filteredMembers = members.filter(m => 
    (m.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.studentId || "").includes(searchTerm)
  );

  const topThree = filteredMembers.slice(0, 3);
  const normalList = filteredMembers.slice(3);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#0055A5]" size={40}/>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-32">
      
      {/* HEADER LOANG MÀU + BỘ LỌC THÁNG */}
      <header className="relative bg-[#0055A5] pt-16 pb-48 px-6 lg:px-12 overflow-hidden rounded-b-[4rem] lg:rounded-b-[6rem]">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:text-[#0055A5] transition-all border border-white/10 text-white">
                <ChevronLeft size={28} />
              </Link>
              <div>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase drop-shadow-lg text-white flex items-center gap-4">
                  Vinh Danh <Trophy className="text-amber-400 fill-amber-400" size={48} />
                </h1>
                <p className="text-blue-100 font-bold text-sm tracking-widest uppercase opacity-80 flex items-center gap-2">
                   Bảng xếp hạng tháng {selectedMonth}/{selectedYear}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
              {/* BỘ LỌC THÁNG/NĂM */}
              <div className="flex items-center gap-2 bg-white/10 p-2 rounded-[2rem] backdrop-blur-xl border border-white/20 shadow-2xl">
                <div className="flex items-center gap-2 px-4 border-r border-white/10">
                  <Calendar size={18} className="text-blue-200" />
                  <select 
                    value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent text-white font-black outline-none cursor-pointer text-sm"
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1} className="text-slate-800">Tháng {i+1}</option>
                    ))}
                  </select>
                </div>
                <select 
                  value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-white font-black outline-none px-4 cursor-pointer text-sm"
                >
                  <option value="2026" className="text-slate-800">2026</option>
                  <option value="2025" className="text-slate-800">2025</option>
                </select>
              </div>

              {/* TÌM KIẾM */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-200" size={18} />
                <input 
                  type="text" placeholder="Tìm tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md py-4 pl-12 pr-6 rounded-[1.8rem] outline-none border border-white/20 text-white placeholder:text-blue-200 font-bold focus:bg-white focus:text-[#0055A5] transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* PODIUM TOP 3 (Dynamic) */}
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-20">
        {filteredMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            {/* HẠNG 2 */}
            {topThree[1] && (
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[3.5rem] shadow-2xl border border-white flex flex-col items-center text-center h-[320px] justify-center order-2 md:order-1">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400"><Medal size={40} /></div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-400 text-white rounded-full flex items-center justify-center font-black border-4 border-white text-sm">2</div>
                </div>
                <h3 className="font-black text-xl text-slate-800 uppercase line-clamp-1">{topThree[1].fullName}</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-widest mb-4">TỔ {topThree[1].group} • {topThree[1].totalSessions} buổi</p>
                <div className="bg-slate-50 px-6 py-3 rounded-2xl font-black text-slate-600 flex items-center gap-2 border border-slate-100 shadow-sm">
                  <Star size={18} className="fill-slate-400 text-slate-400" /> {topThree[1].totalPoints}
                </div>
              </div>
            )}

            {/* HẠNG 1 */}
            {topThree[0] && (
              <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-amber-100 flex flex-col items-center text-center h-[380px] justify-center order-1 md:order-2 relative overflow-hidden group">
                <div className="relative mb-6">
                  <div className="w-28 h-28 bg-amber-100 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-xl shadow-amber-200"><Crown size={60} className="fill-amber-500" /></div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center font-black text-xl border-4 border-white">1</div>
                </div>
                <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight line-clamp-1">{topThree[0].fullName}</h3>
                <p className="text-[11px] font-black text-slate-400 tracking-[0.2em] mb-6 uppercase">Hào kiệt tháng {selectedMonth}</p>
                <div className="bg-amber-500 text-white px-8 py-4 rounded-[2rem] font-black text-lg flex items-center gap-3 shadow-xl">
                  <Flame size={20} className="fill-white" /> {topThree[0].totalPoints} ĐIỂM
                </div>
              </div>
            )}

            {/* HẠNG 3 */}
            {topThree[2] && (
              <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[3.5rem] shadow-2xl border border-white flex flex-col items-center text-center h-[290px] justify-center order-3">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-400"><Award size={40} /></div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-orange-400 text-white rounded-full flex items-center justify-center font-black border-4 border-white text-sm">3</div>
                </div>
                <h3 className="font-black text-xl text-slate-800 uppercase line-clamp-1">{topThree[2].fullName}</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-widest mb-4">TỔ {topThree[2].group} • {topThree[2].totalSessions} buổi</p>
                <div className="bg-orange-50 px-6 py-3 rounded-2xl font-black text-orange-600 flex items-center gap-2 border border-orange-100 shadow-sm">
                  <TrendingUp size={18} /> {topThree[2].totalPoints}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[4rem] text-center shadow-2xl border border-white flex flex-col items-center gap-4">
             <Calendar size={48} className="text-slate-200" />
             <p className="font-black text-slate-400 uppercase tracking-widest">Không có dữ liệu trong tháng {selectedMonth}/{selectedYear}</p>
          </div>
        )}
      </div>

      {/* DANH SÁCH TIẾP THEO */}
      <div className="max-w-6xl mx-auto px-6 mt-16 flex flex-col gap-4">
        {normalList.length > 0 && (
          <>
            <h2 className="text-[10px] font-black text-[#0055A5] uppercase tracking-[0.4em] pl-6 border-l-4 border-blue-600 leading-none mb-4">Bảng xếp hạng chi tiết</h2>
            {normalList.map((m) => {
              const rank = members.findIndex(orig => orig.id === m.id) + 1;
              return (
                <div key={m.id} className="group bg-white p-5 pr-10 rounded-[2.5rem] border border-slate-100 hover:border-blue-400 shadow-sm hover:shadow-xl transition-all flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-8 flex-1 min-w-0">
                    <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-50 group-hover:text-[#0055A5] transition-all text-xl">{rank}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-lg lg:text-xl text-slate-800 group-hover:text-[#0055A5] uppercase truncate">{m.fullName}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-mono font-black text-blue-500/60 uppercase">{m.studentId}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5"><MapPin size={12}/> {m.major}</span>
                      </div>
                    </div>
                    <div className="hidden lg:grid grid-cols-3 w-[450px] flex-shrink-0 gap-6 px-10 border-l border-slate-100 ml-4 text-center">
                      <div><span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Đơn vị</span><span className="font-black text-slate-600 text-sm uppercase">Tổ {m.group}</span></div>
                      <div className="border-x border-slate-50"><span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Tham gia</span><span className="font-black text-slate-600 text-sm">{m.totalSessions} buổi</span></div>
                      <div><span className="text-[9px] font-black text-slate-300 uppercase block mb-1">Thành tích</span><span className="text-[#0055A5] font-black text-lg flex items-center justify-center gap-1.5"><Star size={16} className="fill-[#0055A5]"/> {m.totalPoints}</span></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-20 flex flex-col items-center gap-4 opacity-30 text-center px-4">
        <Heart size={24} className="text-red-500 fill-red-500 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">obi.phu08 ĐTNTN QNU</p>
      </div>
      
    </div>
  );
}