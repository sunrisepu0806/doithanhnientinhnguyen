"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from 'xlsx'; 
import { 
  ChevronLeft, Loader2, Clock, 
  MapPin, UserCheck, Search, FileDown, Lock, Unlock
} from "lucide-react"; 
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ActivityDetailPage() {
  const params = useParams();
  const activityId = params.id as string;
  
  const [activity, setActivity] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [membersMap, setMembersMap] = useState<Record<string, any>>({}); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const actSnap = await getDoc(doc(db, "activities", activityId));
            if (actSnap.exists()) {
                setActivity({ id: actSnap.id, ...actSnap.data() });
            }

            const memSnap = await getDocs(collection(db, "members"));
            const map: Record<string, any> = {};
            memSnap.docs.forEach(d => {
                map[d.id] = d.data();
            });
            setMembersMap(map);

            const q = query(collection(db, "attendance"), where("activityId", "==", activityId));
            const attSnap = await getDocs(q);
            
            const list = attSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            setAttendees(list);

        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    if(activityId) fetchData();
  }, [activityId]);

  const toggleActivityStatus = async () => {
      if(!activity) return;
      const newStatus = !activity.isActive;
      const confirmMsg = newStatus 
        ? "Bạn muốn MỞ LẠI điểm danh cho hoạt động này?" 
        : "Bạn muốn NGỪNG điểm danh? (Các thiết bị sẽ không thể quét mã nữa).";
      
      if(window.confirm(confirmMsg)) {
          setToggling(true);
          try {
              await updateDoc(doc(db, "activities", activityId), { isActive: newStatus });
              setActivity({ ...activity, isActive: newStatus });
          } catch (error) {
              alert("Lỗi cập nhật trạng thái");
          }
          setToggling(false);
      }
  };

  const filteredAttendees = attendees.filter((a: any) => 
      a.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.studentId?.includes(searchTerm)
  );

  const handleExport = () => {
    const data = filteredAttendees.map((a: any, index) => {
        const memberDetail = membersMap[a.memberId] || {};
        return {
            "STT": filteredAttendees.length - index,
            "Họ và Tên": a.memberName,
            "Mã Sinh Viên": a.studentId,
            "Tổ": memberDetail.group || "---",
            "Ngành Học": memberDetail.major || "---",
            "Thời Gian": a.timestamp ? new Date(a.timestamp.seconds * 1000).toLocaleString('vi-VN') : "---",
        };
    });

    // Chữa lỗi TypeScript bằng cách ép kiểu (as any) cho thư viện XLSX
    const ws = (XLSX.utils as any).json_to_sheet(data);
    const wb = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(wb, ws, "DiemDanh");
    XLSX.writeFile(wb, `DS_ThamGia_${activity?.name || 'HoatDong'}.xlsx`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!activity) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">Không tìm thấy hoạt động</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pb-20">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-6 bg-white px-6 py-3 rounded-2xl shadow-sm transition-all border border-slate-100">
                <ChevronLeft size={18}/> Quay lại Dashboard
            </Link>
            
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-100/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-white">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        {activity.isActive ? (
                            <span className="bg-green-100 text-green-600 font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full animate-pulse">
                                Đang diễn ra
                            </span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-widest px-4 py-1.5 rounded-full">
                                Đã kết thúc
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">{activity.name}</h1>
                    <div className="flex items-center gap-6 text-slate-400 font-bold text-sm">
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><Clock size={16}/> {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : ""}</span>
                        <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl"><MapPin size={16}/> QNU Campus</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                     <button 
                        onClick={toggleActivityStatus}
                        disabled={toggling}
                        className={`p-5 rounded-3xl transition-all shadow-2xl flex items-center gap-3 font-black ${
                            activity.isActive 
                            ? "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white shadow-red-100" 
                            : "bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white shadow-blue-100"
                        }`}
                     >
                        {toggling ? <Loader2 size={24} className="animate-spin"/> : (
                            activity.isActive ? <><Lock size={24}/> NGỪNG</> : <><Unlock size={24}/> MỞ LẠI</>
                        )}
                     </button>

                     <button onClick={handleExport} className="bg-green-100 text-green-700 p-5 rounded-3xl hover:bg-green-600 hover:text-white transition-all shadow-2xl shadow-green-100" title="Xuất Excel">
                        <FileDown size={24}/>
                     </button>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 overflow-hidden border border-white">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-xl font-black text-slate-700 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <UserCheck className="text-white" size={20}/>
                    </div>
                    Danh sách điểm danh ({attendees.length})
                </h3>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Tìm tên hoặc mã sinh viên..." 
                        className="w-full bg-slate-50 py-4 pl-14 pr-6 rounded-3xl outline-none font-bold text-slate-600 focus:ring-4 focus:ring-blue-50 transition-all placeholder:font-medium shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black">
                            <th className="px-8 py-5 text-center">STT</th>
                            <th className="px-8 py-5">Thành viên</th>
                            <th className="px-8 py-5">Mã SV</th>
                            <th className="px-8 py-5 text-center">Tổ</th>
                            <th className="px-8 py-5">Ngành</th>
                            <th className="px-8 py-5 text-right">Check-in lúc</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredAttendees.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-32 text-center text-slate-400 font-bold">
                                    Chưa có dữ liệu phù hợp
                                </td>
                            </tr>
                        ) : (
                            filteredAttendees.map((att, index) => {
                                const memberDetail = membersMap[att.memberId] || {};
                                return (
                                    <tr key={att.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-8 py-5 text-center font-black text-slate-300 group-hover:text-blue-500">
                                            {filteredAttendees.length - index}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-100">
                                                    {att.memberName?.charAt(0) || "?"}
                                                </div>
                                                <span className="font-black text-slate-700">{att.memberName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-mono font-black text-blue-600/60 bg-blue-50/30 rounded-xl">
                                            {att.studentId}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-xl text-[11px] font-black border border-white shadow-sm">
                                                {memberDetail.group ? `TỔ ${memberDetail.group}` : "-"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-tight">
                                            {memberDetail.major || "---"}
                                        </td>
                                        <td className="px-8 py-5 text-sm font-black text-slate-400 text-right group-hover:text-slate-900 transition-colors">
                                            {att.timestamp?.seconds 
                                                ? new Date(att.timestamp.seconds * 1000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) 
                                                : "---"}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}