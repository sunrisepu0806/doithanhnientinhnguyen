"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ExcelJS from "exceljs";
import {
  LogOut, Users, Search, Download, Loader2, Star, 
  MapPin, CalendarCheck, Heart, Award, X, Eye, QrCode // <-- Sửa chữ r viết thường
} from "lucide-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

interface MemberStats {
  id: string;
  fullName: string;
  studentId: string;
  major: string;
  group: string;
  dob: string;
  totalSessions: number;
  totalPoints: number;
  history: any[];
}

export default function LeaderDashboardPage() {
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [userTo, setUserTo] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  // State quản lý xem chi tiết thành viên thông qua Modal
  const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const to = localStorage.getItem("user_to");
    const name = localStorage.getItem("user_name");
    
    if (role !== "totruong") {
      router.push("/login");
    } else {
      setUserTo(to || "");
      setUserName(name || "Tổ trưởng");
      fetchGroupData(to || "");
    }
  }, [router]);

  const fetchGroupData = async (groupName: string) => {
    try {
      const actSnap = await getDocs(collection(db, "activities"));
      const actMap: Record<string, any> = {};
      actSnap.docs.forEach(doc => { actMap[doc.id] = { id: doc.id, ...doc.data() }; });

      const qMembers = query(collection(db, "members"), where("group", "==", groupName));
      const memSnap = await getDocs(qMembers);
      let memData = memSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      if (memData.length === 0) {
        const allMemSnap = await getDocs(collection(db, "members"));
        memData = allMemSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() as any }))
          .filter(m => String(m.group || m.to || "").trim() === String(groupName).trim());
      }

      const attSnap = await getDocs(collection(db, "attendance"));
      const allAtt = attSnap.docs.map(doc => doc.data());

      const calculatedMembers = memData.map(m => {
        const myAtts = allAtt.filter(a => a.memberId === m.id || a.studentId === m.studentId);
        let totalPoints = 0;
        const history: any[] = [];

        myAtts.forEach(att => {
          const act = actMap[att.activityId];
          const pts = act ? Number(act.points || 10) : 10;
          totalPoints += pts;
          history.push({
            name: act?.name || act?.title || att.activityName || "Hệ thống quét",
            date: att.timestamp?.seconds ? new Date(att.timestamp.seconds * 1000).toLocaleString('vi-VN') : "N/A",
            points: pts
          });
        });

        return {
          id: m.id,
          fullName: m.fullName || m.hoTen || "Chưa cập nhật",
          studentId: m.studentId || m.msv || "",
          major: m.major || m.nganhHoc || "Chưa cập nhật",
          group: groupName,
          dob: m.dob || m.ngaySinh || "Chưa cập nhật",
          totalSessions: myAtts.length,
          totalPoints,
          history
        };
      });

      calculatedMembers.sort((a, b) => b.totalPoints - a.totalPoints);
      setMembers(calculatedMembers);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGroup = async () => {
    setIsExporting(true);
    try {
      if (members.length === 0) return;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet(`Tổ ${userTo}`);
      ws.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'HỌ VÀ TÊN', key: 'fullName', width: 28 },
        { header: 'MÃ SV', key: 'studentId', width: 14 },
        { header: 'SỐ BUỔI', key: 'sessions', width: 10 },
        { header: 'TỔNG ĐIỂM', key: 'points', width: 12 },
      ];
      ws.getRow(1).font = { bold: true, color: { argb: 'FF0055A5' } };
      members.forEach((m, i) => ws.addRow({ stt: i + 1, fullName: m.fullName, studentId: m.studentId, sessions: m.totalSessions, points: m.totalPoints }));
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `Danh_Sach_To_${userTo}.xlsx`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  // Hàm hỗ trợ tải mã QR cá nhân của thành viên về máy
  const downloadQR = (studentId: string, fullName: string) => {
    const svg = document.getElementById(`qr-${studentId}`);
    if (!svg) return;
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, 300, 300);
        context.drawImage(image, 0, 0, 300, 300);
        const png = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = png;
        downloadLink.download = `QR_${studentId}_${fullName.replace(/\s+/g, "_")}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = URL;
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || m.studentId.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-[#f4f8fc] font-sans text-slate-800 pb-24">
      {/* HEADER BANNER */}
      <header className="relative bg-[#0055A5] pt-12 pb-28 px-6 overflow-hidden rounded-b-[3rem] shadow-lg">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex justify-between items-center text-white">
          <div>
            <div className="flex items-center gap-2 mb-1.5 opacity-80">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest">Trực thuộc QNU</span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Tổ {userTo}</h1>
            <p className="text-xs font-medium text-blue-100/80 mt-0.5">Quản lý bởi: <span className="font-bold">{userName}</span></p>
          </div>
          <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="w-11 h-11 rounded-full bg-red-500/20 text-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-md cursor-pointer">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* FLOATING ACTION CONTROL */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-blue-50 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm tên hoặc mã chiến sĩ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-slate-50 py-3 pl-11 pr-4 rounded-xl outline-none font-bold text-xs border border-transparent focus:border-blue-100 focus:bg-white transition-all shadow-inner" 
            />
          </div>
          <button 
            onClick={handleExportGroup} 
            disabled={isExporting} 
            className="w-full sm:w-auto py-3 px-6 bg-emerald-500 text-white font-black rounded-xl shadow-md hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} Xuất Data Tổ
          </button>
        </div>
      </div>

      {/* MEMBER LIST LAYER */}
      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-4">
        <div className="flex items-center justify-between px-2 mb-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách / Kiểm soát quân số</p>
          <span className="text-[10px] font-black text-[#0055A5] bg-blue-50 border border-blue-100/50 px-2.5 py-1 rounded-full uppercase tracking-wider">{filteredMembers.length} Chiến sĩ</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 font-bold animate-pulse text-xs uppercase tracking-wider">Đang tải dữ liệu tổ...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-bold bg-white rounded-2xl border border-dashed border-slate-200 text-xs uppercase tracking-wider">Không tìm thấy thành viên nào</div>
        ) : (
          filteredMembers.map((member, index) => (
            /* BỐ CỤC KHỐI DÒNG NGANG KHỚP CHUẨN 100% ẢNH MẪU image_dcfc5f.png */
            <div 
              key={member.id} 
              className="bg-white p-4 rounded-[2rem] border border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-center justify-between gap-6 relative"
            >
              
              {/* KHỐI 1: KHUNG CHỨA MÃ QR CÁ NHÂN (BÊN TRÁI) */}
              <div className="flex items-center gap-5 w-full lg:w-auto flex-1 min-w-0">
                <div className="p-2 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 group/qr shrink-0 relative">
                  <QRCodeSVG
                    id={`qr-${member.studentId}`}
                    value={member.studentId}
                    size={64}
                    level={"H"}
                    includeMargin={false}
                  />
                  <span onClick={() => downloadQR(member.studentId, member.fullName)} className="text-[8px] font-black text-slate-400 uppercase tracking-tight cursor-pointer hover:text-[#0055A5] transition-colors">Tải Mã</span>
                </div>

                {/* KHỐI 2: TÊN, MSSV VÀ NGÀNH HỌC */}
                <div className="min-w-0">
                  <h3 className="font-black text-base text-slate-800 uppercase tracking-tight truncate">{member.fullName}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-[10px] font-bold text-slate-400">
                    <span className="font-mono text-[#0055A5] bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 rounded-md w-fit">{member.studentId}</span>
                    <span className="truncate flex items-center gap-1 uppercase tracking-wide"><MapPin size={11} className="text-slate-300"/> {member.major}</span>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: ĐƠN VỊ TỔ TRỰC THUỘC */}
              <div className="grid grid-cols-3 gap-6 lg:gap-12 w-full lg:w-auto text-center border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0 shrink-0 items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đơn vị</p>
                  <p className="text-xs font-black text-orange-500 uppercase tracking-wider">Tổ {userTo}</p>
                </div>

                {/* KHỐI 4: SỐ BUỔI CHUYÊN CẦN */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Số buổi</p>
                  <p className="text-xs font-black text-slate-700 flex items-center justify-center gap-1">
                    <CalendarCheck size={12} className="text-blue-500" /> {member.totalSessions}
                  </p>
                </div>

                {/* KHỐI 5: THÀNH TÍCH ĐIỂM SỐ */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Thành tích</p>
                  <p className="text-xs font-black text-emerald-600 flex items-center justify-center gap-0.5">
                    <Star size={12} className="fill-emerald-500 text-emerald-500" /> {member.totalPoints}
                  </p>
                </div>
              </div>
              
              {/* KHỐI 6: NHÓM NÚT HÀNH ĐỘNG (Chỉ giữ lại nút xem và nút tải, KHÔNG có nút sửa/xóa bảo mật) */}
              <div className="flex items-center gap-2 border-t lg:border-t-0 border-slate-50 w-full lg:w-auto pt-4 lg:pt-0 justify-end shrink-0">
                <button 
                  onClick={() => setSelectedMember(member)}
                  className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#0055A5] hover:text-white hover:border-[#0055A5] transition-all cursor-pointer shadow-sm"
                  title="Xem lịch sử hoạt động"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => downloadQR(member.studentId, member.fullName)}
                  className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all cursor-pointer shadow-sm"
                  title="Tải mã QR"
                >
                  <Download size={16} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* INTERACTIVE MEMBER DETAIL MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-blue-50 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer">
              <X size={16}/>
            </button>
            
            {/* Modal Header */}
            <div className="text-center border-b border-slate-100 pb-5 mb-5">
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-[#0055A5] text-xl font-black mx-auto mb-3 shadow-inner">
                {selectedMember.fullName.charAt(0)}
              </div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{selectedMember.fullName}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 font-mono">{selectedMember.studentId} <span className="text-slate-200 mx-1">|</span> Hồ sơ tổ viên</p>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Ngành học</span>
                <span className="text-xs font-bold text-slate-700 truncate block">{selectedMember.major}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Ngày sinh</span>
                <span className="text-xs font-bold text-slate-700 truncate block font-mono">{selectedMember.dob}</span>
              </div>
            </div>

            {/* History Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                <Award size={12} className="text-[#0055A5]"/> Lịch sử chuyên cần ({selectedMember.totalSessions} buổi)
              </div>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-left">
                {selectedMember.history.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 font-medium italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Chưa tham gia hoạt động nào.</p>
                ) : (
                  selectedMember.history.map((act, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-blue-50/30 rounded-xl border border-slate-100/60 transition-colors gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{act.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5 font-mono">{act.date}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md shrink-0">+{act.points}đ</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="fixed bottom-4 w-full text-center pointer-events-none z-30 opacity-35 px-4">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center justify-center gap-1.5">
          obi.phu08 <Heart size={10} className="fill-red-500 text-red-500 animate-pulse" /> ĐTNTN QNU
        </span>
      </div>
    </div>
  );
}