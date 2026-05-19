"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ChevronLeft, Loader2, BarChart3, Calendar, 
  Trophy, Star, Users, Activity, ArrowUpRight, 
  Target, Heart, Filter, TrendingUp, Award, CalendarCheck
} from "lucide-react";
import Link from "next/link";

export default function AdminStatsPage() {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    setIsMounted(true);
    const unsubActs = onSnapshot(collection(db, "activities"), (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAtt = onSnapshot(collection(db, "attendance"), (snap) => {
      setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMems = onSnapshot(collection(db, "members"), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => { unsubActs(); unsubAtt(); unsubMems(); };
  }, []);

  if (!isMounted) return null;

  // 1. Lọc dữ liệu điểm danh theo tháng/năm đã chọn
  const filteredAtt = attendance.filter(att => {
    if (!att.timestamp) return false;
    const date = new Date(att.timestamp.seconds * 1000);
    return (date.getMonth() + 1) === selectedMonth && date.getFullYear() === selectedYear;
  });

  // 2. Tính tổng điểm cả Đội trong tháng
  const monthlyTotalPoints = filteredAtt.reduce((sum, att) => {
    const act = activities.find(a => a.id === att.activityId);
    return sum + Number(act?.points || 10);
  }, 0);

  // 3. Tính toán Top 5 Chiến Sĩ (Quan trọng - Đã sửa lỗi)
  const topMembers = members.map(m => {
    // Lọc những lần bạn này đi trong tháng được chọn
    const memberAttInMonth = filteredAtt.filter(att => att.memberId === m.id || att.studentId === m.studentId);
    
    // Tính tổng điểm cá nhân trong tháng đó
    const totalPoints = memberAttInMonth.reduce((sum, att) => {
      const act = activities.find(a => a.id === att.activityId);
      return sum + Number(act?.points || 10);
    }, 0);

    return {
      ...m,
      calculatedPoints: totalPoints,
      calculatedSessions: memberAttInMonth.length
    };
  })
  .filter(m => m.calculatedPoints > 0) // Chỉ hiện những người có hoạt động
  .sort((a, b) => b.calculatedPoints - a.calculatedPoints) // Sắp xếp điểm cao lên đầu
  .slice(0, 5); // Lấy đúng 5 người

  // 4. Thống kê theo Tổ
  const groupStats = [1, 2, 3, 4, 5, 6].map(g => {
    const groupMems = members.filter(m => String(m.group) === String(g));
    const groupAtt = filteredAtt.filter(att => groupMems.some(m => m.id === att.memberId || m.studentId === att.studentId));
    const groupPoints = groupAtt.reduce((sum, att) => {
        const act = activities.find(a => a.id === att.activityId);
        return sum + Number(act?.points || 10);
    }, 0);
    return { group: g, count: groupAtt.length, points: groupPoints };
  });

  const maxPoints = Math.max(...groupStats.map(s => s.points), 1);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#0055A5]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-32">
      
      <header className="relative bg-[#0055A5] pt-16 pb-44 px-6 lg:px-12 overflow-hidden rounded-b-[4rem] lg:rounded-b-[6rem]">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6 text-white">
              <Link href="/admin" className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:text-[#0055A5] transition-all">
                <ChevronLeft size={28} />
              </Link>
              <div>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none mb-2 uppercase text-white">Thống Kê Đội</h1>
                <p className="text-blue-100 font-bold text-sm tracking-widest flex items-center gap-2 uppercase opacity-80">
                  <BarChart3 size={18} /> Phân tích dữ liệu tháng {selectedMonth}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-[2rem] backdrop-blur-xl border border-white/20 shadow-2xl">
              <div className="flex items-center gap-2 px-4 border-r border-white/10">
                <Calendar size={18} className="text-blue-200" />
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-white font-black outline-none cursor-pointer">
                  {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1} className="text-slate-800">Tháng {i+1}</option>)}
                </select>
              </div>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-white font-black outline-none px-4 cursor-pointer">
                <option value="2026" className="text-slate-800">2026</option>
                <option value="2025" className="text-slate-800">2025</option>
              </select>
            </div>
        </div>
      </header>

      {/* SUMMARY CARDS */}
      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Hoạt động", val: activities.filter(a => {
            const d = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date();
            return (d.getMonth() + 1) === selectedMonth;
          }).length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Lượt tham gia", val: filteredAtt.length, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Tổng điểm tháng", val: monthlyTotalPoints, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Tổ xuất sắc", val: `TỔ ${groupStats.sort((a,b) => b.points - a.points)[0].group}`, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((item, i) => (
          <div key={i} className="bg-white/95 backdrop-blur-xl p-7 rounded-[3rem] shadow-xl shadow-blue-900/5 border border-white">
            <div className={`${item.bg} ${item.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}><item.icon size={28} /></div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">{item.label}</p>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{item.val}</h3>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* HIỆU SUẤT TỔ */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] shadow-2xl border border-white">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3 mb-10">
            <TrendingUp className="text-blue-500" /> Hiệu suất các Tổ
          </h3>
          <div className="flex flex-col gap-8">
            {groupStats.map((stat, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-black text-slate-700 text-sm uppercase">Tổ {stat.group}</span>
                  <span className="font-black text-blue-600 text-sm">{stat.points} Điểm <span className="text-slate-300 font-bold ml-2">/ {stat.count} buổi</span></span>
                </div>
                <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                  <div className="h-full bg-gradient-to-r from-[#0055A5] to-sky-400 rounded-full transition-all duration-1000" style={{ width: `${(stat.points / maxPoints) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP CHIẾN SĨ (ĐÃ FIX HIỂN THỊ ĐÚNG) */}
        <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-white flex flex-col">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3 mb-8">
            <Trophy className="text-amber-500" /> Top Chiến Sĩ
          </h3>
          
          <div className="flex flex-col gap-4 flex-1">
            {topMembers.length > 0 ? topMembers.map((m, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400 border border-slate-100'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-700 text-[13px] uppercase truncate">{m.fullName}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tổ {m.group} • {m.calculatedSessions} buổi</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#0055A5] text-sm">{m.calculatedPoints}</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Điểm</p>
                </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-30 gap-2">
                <CalendarCheck size={40} />
                <p className="text-[10px] font-black uppercase">Trống dữ liệu</p>
              </div>
            )}
          </div>
          
          <Link href="/admin/leaderboard" className="mt-8 py-5 bg-slate-50 text-[#0055A5] font-black text-[10px] uppercase tracking-[0.2em] rounded-[2rem] text-center hover:bg-[#0055A5] hover:text-white transition-all border border-blue-50 shadow-sm">
            Xem tất cả xếp hạng
          </Link>
        </div>

      </div>

      <div className="mt-20 flex flex-col items-center gap-4 opacity-30 text-center px-4">
        <Heart size={24} className="text-red-500 fill-red-500 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">obi.phu08 • QNU Volunteer</p>
      </div>

    </div>
  );
}