"use client";

import { useState, useEffect, useRef } from "react";
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import * as XLSX from "xlsx"; 
import ExcelJS from "exceljs";
import QRCode from "qrcode";   
import { QRCodeSVG } from "qrcode.react"; 
import { 
  Search, UserPlus, Pencil, Trash2, ChevronLeft, Loader2, 
  FileDown, FileUp, Trophy, Heart, Settings2, X, MapPin, Filter, Star, CalendarCheck, LogOut, Download, Eye, ListFilter, FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  fullName: string;
  studentId: string;
  major: string;
  group: string;
  dob: string;
  totalSessions: number; 
  totalPoints: number;   
  createdAt?: any;
}

const EXPORT_LABELS: Record<string, string> = {
  fullName: "Họ và Tên",
  studentId: "Mã Sinh Viên",
  dob: "Ngày Sinh",
  major: "Ngành Học",
  group: "Tổ",
  totalSessions: "Số Buổi",
  totalPoints: "Tổng Điểm",
  qrCode: "Mã QR"
};

export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportGroupSelect, setExportGroupSelect] = useState("1");
  
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportOptions, setExportOptions] = useState({
    fullName: true,
    studentId: true,
    dob: true,
    major: true,
    group: true,
    totalSessions: true,
    totalPoints: true,
    qrCode: true,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const unsubActivities = onSnapshot(collection(db, "activities"), (actSnap) => {
      const actData = actSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        points: Number(d.data().points || 10) 
      }));
      setActivities(actData);

      const qMembers = query(collection(db, "members"), orderBy("createdAt", "desc"));
      const unsubMembers = onSnapshot(qMembers, (memSnap) => {
        const mems = memSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        const unsubAttendance = onSnapshot(collection(db, "attendance"), (attSnap) => {
          const allAtt = attSnap.docs.map(d => d.data());
          setAttendanceRecords(allAtt);

          const updated = mems.map(m => {
            const myAtt = allAtt.filter((a: any) => a.memberId === m.id || a.studentId === m.studentId);
            const totalPoints = myAtt.reduce((sum, att) => {
              const activity = actData.find(act => act.id === att.activityId);
              return sum + (activity ? Number(activity.points) : 10);
            }, 0);

            return {
              ...m,
              major: m.major || m.Major || m.nganhHoc || m["ngành học"] || m["Ngành Học"] || m["nganh hoc"] || m.nganh || m.class || m.lop || "",
              totalSessions: myAtt.length,
              totalPoints: totalPoints
            };
          });

          setMembers(updated);
          setLoading(false);
        });
      });
    });

    return () => unsubActivities();
  }, [isMounted]);

  if (!isMounted) return null;

  const filteredMembers = members.filter(m => {
    const matchSearch = (m.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (m.studentId || "").includes(searchTerm);
    const matchGroup = filterGroup === "all" || String(m.group) === filterGroup;
    return matchSearch && matchGroup;
  });

  const downloadQR = async (id: string, name: string) => {
    try {
      const url = await QRCode.toDataURL(id, { width: 1000, margin: 2 });
      const a = document.createElement("a");
      a.href = url; a.download = `QR_${name}.png`; a.click();
    } catch (e) { console.error(e); }
  };

  const downloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('File Mau Nhap Lieu');
      
      worksheet.columns = [
        { header: 'HỌ VÀ TÊN', key: 'fullName', width: 25 },
        { header: 'MÃ SV', key: 'studentId', width: 15 },
        { header: 'NGÀY SINH', key: 'dob', width: 15 },
        { header: 'NGÀNH HỌC', key: 'major', width: 25 },
        { header: 'TỔ', key: 'group', width: 10 }
      ];

      // Ép kiểu text chống lỗi ngày sinh cho file mẫu nhập liệu
      worksheet.getColumn('dob').numFmt = '@';

      worksheet.addRow({
        fullName: 'Nguyễn Văn A',
        studentId: '4501104123',
        dob: '01/01/2006',
        major: 'Công nghệ thông tin K47A',
        group: '1'
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; 
      a.download = `File_Mau_Nhap_Thanh_Vien.xlsx`; 
      a.click();
    } catch (e) {
      alert("Lỗi khi tạo file mẫu!");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", codepage: 65001 });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          if (!jsonData || jsonData.length === 0) {
            alert("File Excel trống hoặc định dạng không thể đọc được!");
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
          }

          let successCount = 0;
          let errorCount = 0;

          for (const row of jsonData) {
            const normalizedRow: any = {};
            Object.keys(row).forEach(k => {
              const cleanKey = k.toString().trim().toLowerCase().replace(/\s+/g, ' ');
              normalizedRow[cleanKey] = row[k];
            });

            const fullName = normalizedRow["họ và tên"] || normalizedRow["họ tên"] || normalizedRow["fullname"] || normalizedRow["tên"] || "";
            const studentId = normalizedRow["mã sv"] || normalizedRow["mã sinh viên"] || normalizedRow["studentid"] || normalizedRow["mssv"] || "";
            
            const majorKey = Object.keys(normalizedRow).find(k => k.includes("ngành") || k.includes("nganh") || k.includes("chuyên môn") || k.includes("chuyên ngành") || k.includes("lớp") || k.includes("major"));
            const major = majorKey ? normalizedRow[majorKey] : "";
            const group = normalizedRow["tổ"] || normalizedRow["group"] || "";
            const dob = normalizedRow["ngày sinh"] || normalizedRow["ngay sinh"] || normalizedRow["dob"] || "";

            if (!fullName || !studentId) {
              errorCount++;
              continue; 
            }

            if (members.some(m => String(m.studentId) === String(studentId).trim())) {
              errorCount++;
              continue; 
            }

            await addDoc(collection(db, "members"), {
              fullName: String(fullName).trim(),
              studentId: String(studentId).trim(),
              major: String(major).trim(),
              group: String(group).trim(),
              dob: String(dob).trim(),
              createdAt: serverTimestamp()
            });
            successCount++;
          }

          alert(`Nhập thành công: ${successCount} dữ liệu.\nLỗi/Trùng lặp/Bỏ qua: ${errorCount} dòng.`);
        } catch (err) {
          console.error(err);
          alert("Lỗi cấu trúc file Excel. Vui lòng tải file đúng định dạng để thử lại.");
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      alert("Đã xảy ra lỗi khi cố gắng tải file.");
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const executeCustomExport = async (dataToExport: Member[], fileName: string) => {
    setExporting(true);
    await new Promise(resolve => setTimeout(resolve, 150)); // Nhường luồng cho UI render trạng thái loading (chống lag)

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('DS Thành Viên');
      const cols: any[] = [];
      if (exportOptions.fullName) cols.push({ header: 'HỌ VÀ TÊN', key: 'fullName', width: 30 });
      if (exportOptions.studentId) cols.push({ header: 'MÃ SV', key: 'studentId', width: 15 });
      if (exportOptions.dob) cols.push({ header: 'NGÀY SINH', key: 'dob', width: 15 });
      if (exportOptions.major) cols.push({ header: 'NGÀNH HỌC', key: 'major', width: 25 });
      if (exportOptions.group) cols.push({ header: 'TỔ', key: 'group', width: 10 });
      if (exportOptions.totalSessions) cols.push({ header: 'SỐ BUỔI', key: 'totalSessions', width: 12 });
      if (exportOptions.totalPoints) cols.push({ header: 'TỔNG ĐIỂM', key: 'totalPoints', width: 12 });
      if (exportOptions.qrCode) cols.push({ header: 'MÃ QR', key: 'qrCode', width: 20 });
      worksheet.columns = cols;

      // Ép cứng định dạng TEXT thuần túy cho cột ngày sinh
      const dobColIdx = cols.findIndex(c => c.key === 'dob');
      if (dobColIdx !== -1) {
        worksheet.getColumn(dobColIdx + 1).numFmt = '@';
      }

      for (const m of dataToExport) {
        const rowData: any = {};
        if (exportOptions.fullName) rowData.fullName = m.fullName || "";
        if (exportOptions.studentId) rowData.studentId = m.studentId || "";
        if (exportOptions.dob) rowData.dob = String(m.dob || "").trim(); // Chuyển chuỗi thuần túy
        if (exportOptions.major) rowData.major = m.major || "Chưa cập nhật"; 
        if (exportOptions.group) rowData.group = m.group || "";
        if (exportOptions.totalSessions) rowData.totalSessions = m.totalSessions || 0;
        if (exportOptions.totalPoints) rowData.totalPoints = m.totalPoints || 0;

        const row = worksheet.addRow(rowData);
        row.height = exportOptions.qrCode ? 80 : 25;
        row.alignment = { vertical: 'middle', horizontal: 'center' };

        // Ép định dạng chuỗi tại ô chứa dữ liệu để Excel không tự ý parse ngày tháng lệch múi giờ
        if (exportOptions.dob && dobColIdx !== -1) {
          const dobCell = row.getCell(dobColIdx + 1);
          dobCell.value = String(m.dob || "").trim();
          dobCell.numFmt = '@';
        }

        if (exportOptions.qrCode) {
          const qrUrl = await QRCode.toDataURL(m.studentId, { margin: 1 });
          const imageId = workbook.addImage({ base64: qrUrl, extension: 'png' });
          const colIdx = cols.findIndex(c => c.key === 'qrCode');
          worksheet.addImage(imageId, {
            tl: { col: colIdx, row: row.number - 1 },
            ext: { width: 90, height: 90 }
          });
        }
      }
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${fileName}.xlsx`; a.click();
    } catch (e) { 
      console.error(e);
      alert("Lỗi xuất file"); 
    }
    finally { 
      setExporting(false); 
      setIsExportModalOpen(false); 
    }
  };

  const handleExportCustom = () => executeCustomExport(filteredMembers, "DanhSach_TuyChon");
  
  // Xuất file sắp xếp theo Mã sinh viên
  const handleExportByMSSV = () => {
    const sorted = [...filteredMembers].sort((a, b) => (a.studentId || "").localeCompare(b.studentId || ""));
    executeCustomExport(sorted, "DanhSach_Theo_MSSV");
  };

  // Xuất file theo tổ (Sheet 1: Tổng hợp, Các sheet sau là Lịch sử chi tiết từng chiến sĩ)
  const handleExportByGroup = async (group: string) => {
    setExporting(true);
    await new Promise(resolve => setTimeout(resolve, 150)); 
    
    try {
      const groupMembers = members.filter(m => String(m.group) === String(group));
      if (groupMembers.length === 0) {
        alert(`Không có thành viên nào trong Tổ ${group}`);
        setExporting(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      
      // Trang tính 1: Danh sách tổng hợp
      const summarySheetName = `Tổng Hợp Tổ ${group}`;
      const summaryWs = workbook.addWorksheet(summarySheetName);
      summaryWs.columns = [
        { header: 'HỌ VÀ TÊN', key: 'fullName', width: 25 },
        { header: 'MÃ SV', key: 'studentId', width: 15 },
        { header: 'NGÀY SINH', key: 'dob', width: 15 },
        { header: 'NGÀNH HỌC', key: 'major', width: 25 },
        { header: 'SỐ BUỔI', key: 'totalSessions', width: 12 },
        { header: 'TỔNG ĐIỂM', key: 'totalPoints', width: 12 },
      ];

      // Đặt định dạng văn bản cho cột ngày sinh ở sheet tổng hợp
      summaryWs.getColumn('dob').numFmt = '@';

      groupMembers.forEach(m => {
        const row = summaryWs.addRow({
          fullName: m.fullName, 
          studentId: m.studentId, 
          dob: String(m.dob || "").trim(),
          major: m.major, 
          totalSessions: m.totalSessions, 
          totalPoints: m.totalPoints
        });
        row.getCell('dob').numFmt = '@';
      });

      const sheetNames = new Set<string>();
      sheetNames.add(summarySheetName);

      // Tạo các trang tính riêng biệt cho từng thành viên trong tổ
      groupMembers.forEach((member, index) => {
        let safeName = (member.studentId || `TV_${index}`).replace(/[\\/?*[\]:]/g, '_').substring(0, 27);
        let finalSheetName = safeName;
        let counter = 1;
        
        while (sheetNames.has(finalSheetName)) {
            finalSheetName = `${safeName}_${counter}`;
            counter++;
        }
        sheetNames.add(finalSheetName);

        const ws = workbook.addWorksheet(finalSheetName);
        ws.columns = [{ width: 30 }, { width: 30 }, { width: 15 }];
        
        ws.addRow(["THÔNG TIN CÁ NHÂN", ""]);
        ws.addRow(["Họ và tên:", member.fullName]);
        
        const rId = ws.addRow(["MSSV:", member.studentId]);
        rId.getCell(2).numFmt = '@';
        
        ws.addRow(["Tổ:", member.group]);
        ws.addRow(["Ngành học:", member.major]);
        
        // Khóa định dạng TEXT cho ô Ngày sinh của thành viên trong sheet riêng biệt
        const rDob = ws.addRow(["Ngày sinh:", String(member.dob || "").trim()]);
        rDob.getCell(2).numFmt = '@'; 
        
        ws.addRow([]);
        ws.addRow(["LỊCH SỬ HOẠT ĐỘNG", "Ngày tham gia", "Điểm"]);
        
        ws.getRow(1).font = { bold: true, color: { argb: 'FF0055A5' } };
        ws.getRow(8).font = { bold: true, color: { argb: 'FF0055A5' } };

        const myAtt = attendanceRecords.filter(a => a.memberId === member.id || a.studentId === member.studentId);
        myAtt.forEach(att => {
           const act = activities.find(a => a.id === att.activityId);
           ws.addRow([
             act?.name || act?.title || "Hoạt động hệ thống", 
             act?.date || att.timestamp?.toDate?.()?.toLocaleDateString() || "N/A", 
             act?.points || 10
           ]);
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `DanhSach_To_${group}.xlsx`; a.click();
    } catch(e: any) {
      console.error(e);
      alert(`Lỗi khi xuất file Tổ: ${e.message}`);
    } finally {
      setExporting(false);
      setIsExportModalOpen(false);
    }
  };

  // Xuất hồ sơ cá nhân riêng biệt cho từng thành viên độc lập
  const exportIndividualFile = async (member: Member) => {
    setExporting(true);
    await new Promise(resolve => setTimeout(resolve, 150)); 

    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Thông tin cá nhân");
      
      ws.columns = [{ width: 35 }, { width: 35 }, { width: 15 }];
      ws.addRow(["THÔNG TIN CHI TIẾT ĐỘI VIÊN", ""]);
      ws.addRow(["Họ và tên:", member.fullName]);
      
      const rId = ws.addRow(["Mã sinh viên:", member.studentId]);
      rId.getCell(2).numFmt = '@';

      // Sửa dứt điểm lỗi ngày sinh tại file xuất hồ sơ cá nhân đơn lẻ
      const rDob = ws.addRow(["Ngày sinh:", String(member.dob || "Chưa cập nhật").trim()]);
      rDob.getCell(2).numFmt = '@'; // Khóa cứng hiển thị TEXT

      ws.addRow(["Trực thuộc:", `Tổ ${member.group}`]);
      ws.addRow(["Ngành học:", member.major || "Chưa cập nhật"]);
      ws.addRow(["Tổng số buổi tham gia:", member.totalSessions]);
      ws.addRow(["Tổng điểm thành tích:", member.totalPoints]);
      ws.addRow([]);
      ws.addRow(["--- LỊCH SỬ HOẠT ĐỘNG ---", "Thời gian", "Điểm"]);
      
      ws.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF0055A5' } };
      ws.getRow(11).font = { bold: true, color: { argb: 'FF10B981' } };

      const myAtt = attendanceRecords.filter(a => a.memberId === member.id || a.studentId === member.studentId);
      if (myAtt.length === 0) {
        ws.addRow(["Chưa tham gia hoạt động nào", "", ""]);
      } else {
        myAtt.forEach(att => {
           const act = activities.find(a => a.id === att.activityId);
           ws.addRow([
             act?.name || act?.title || "Hoạt động hệ thống", 
             act?.date || att.timestamp?.toDate?.()?.toLocaleDateString() || "N/A", 
             act?.points || 10
           ]);
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `HoSo_${member.studentId}.xlsx`; a.click();
    } catch(e: any) {
      console.error(e);
      alert(`Có lỗi khi tạo file cá nhân: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      fullName: fd.get("fullName") as string,
      studentId: fd.get("studentId") as string,
      major: fd.get("major") as string,
      group: fd.get("group") as string,
      dob: fd.get("dob") as string,
    };

    if (!editingMember && members.some(m => m.studentId === data.studentId)) {
      alert(`Lỗi: Mã sinh viên ${data.studentId} đã tồn tại!`);
      return;
    }

    if (editingMember) await updateDoc(doc(db, "members", editingMember.id), data);
    else await addDoc(collection(db, "members"), { ...data, createdAt: serverTimestamp() });
    setIsModalOpen(false); setEditingMember(null);
  };

  const openViewModal = (member: Member) => {
    setSelectedMember(member);
    setIsViewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-32">
      <header className="relative bg-[#0055A5] pt-16 pb-40 px-6 lg:px-12 overflow-hidden rounded-b-[4rem] lg:rounded-b-[6rem]">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-8 text-white">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white hover:text-[#0055A5] transition-all">
              <ChevronLeft size={28} />
            </Link>
            <div>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none mb-2 uppercase text-white drop-shadow-lg">Thành Viên Đội</h1>
              <p className="text-blue-100 font-bold text-sm tracking-widest flex items-center gap-2 uppercase opacity-80">
                <Trophy size={16} className="text-amber-400 fill-amber-400" /> Quản lý {members.length} chiến sĩ QNU
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            
            <button onClick={downloadTemplate} className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-[#0055A5] transition-all flex items-center gap-2">
              <Download size={18}/> File Mẫu
            </button>
            <button disabled={importing} onClick={() => fileInputRef.current?.click()} className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-[#0055A5] transition-all flex items-center gap-2">
              {importing ? <Loader2 size={18} className="animate-spin"/> : <FileUp size={18}/>} Nhập File
            </button>
            <button onClick={() => setIsExportModalOpen(true)} className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-[#0055A5] transition-all flex items-center gap-2">
              <Settings2 size={18}/> Xuất File
            </button>
            <button onClick={() => { setEditingMember(null); setIsModalOpen(true); }} className="bg-white text-[#0055A5] px-8 py-4 rounded-[1.5rem] font-black shadow-2xl flex items-center gap-2 hover:scale-105 transition-all">
              <UserPlus size={22} /> THÊM MỚI
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white/95 backdrop-blur-2xl p-4 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 flex flex-col xl:flex-row items-center gap-4">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0055A5] transition-colors" size={20} />
            <input 
              type="text" placeholder="Tìm kiếm tên, MSSV..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 py-5 pl-16 pr-8 rounded-[1.8rem] outline-none border border-transparent focus:border-blue-200 transition-all font-bold text-sm shadow-inner"
            />
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[1.8rem] border border-slate-100 shadow-inner group">
                <div className="pl-4 text-slate-400"><Filter size={20}/></div>
                <select 
                  value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}
                  className="bg-transparent py-3 pr-6 outline-none font-black text-[12px] uppercase tracking-widest text-slate-600 appearance-none cursor-pointer"
                >
                  <option value="all">TẤT CẢ CÁC TỔ</option>
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num.toString()}>TỔ {num}</option>
                  ))}
                </select>
            </div>
            <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="bg-red-50 text-red-500 p-4 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm">
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 flex flex-col gap-4">
        {loading ? (
          <div className="py-40 text-center"><Loader2 className="animate-spin mx-auto text-[#0055A5]" size={48}/></div>
        ) : filteredMembers.map(mem => (
          <div key={mem.id} className="group bg-white p-5 pr-8 rounded-[2.5rem] border border-slate-100 hover:border-blue-400 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all flex items-center justify-between">
            <div className="flex items-center gap-8 flex-1 min-w-0">
              <div className="flex-shrink-0 flex flex-col items-center gap-1 group/qr cursor-pointer" onClick={() => downloadQR(mem.studentId, mem.fullName)}>
                <div className="p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover/qr:scale-110 transition-transform">
                  <QRCodeSVG value={mem.studentId} size={60} />
                </div>
                <span className="text-[7px] font-black text-slate-300">TẢI MÃ</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-xl text-slate-800 group-hover:text-[#0055A5] transition-colors uppercase truncate mb-1">{mem.fullName}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono font-black text-blue-600/60 bg-blue-50 px-3 py-1 rounded-lg tracking-widest">{mem.studentId}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12}/> {mem.major || "Chưa cập nhật"}</span>
                </div>
              </div>
              <div className="hidden lg:grid grid-cols-3 w-[450px] flex-shrink-0 gap-6 px-10 border-l border-slate-100 ml-4 text-center">
                <div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 block">Đơn vị</span>
                  <span className="font-black text-orange-500 text-sm uppercase">Tổ {mem.group}</span>
                </div>
                <div className="border-x border-slate-50">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 block">Số buổi</span>
                  <span className="text-slate-700 font-black text-sm flex items-center justify-center gap-2"><CalendarCheck size={14} className="text-blue-500"/> {mem.totalSessions}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1 block">Thành tích</span>
                  <span className="text-emerald-600 font-black text-base flex items-center justify-center gap-1.5"><Star size={16} className="fill-emerald-500"/> {mem.totalPoints}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-6 flex-wrap justify-end w-[130px] lg:w-auto">
              <button onClick={() => openViewModal(mem)} className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-indigo-500 hover:text-white transition-all text-slate-400" title="Xem lịch sử hoạt động">
                <Eye size={20} />
              </button>
              <button onClick={() => exportIndividualFile(mem)} disabled={exporting} className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-emerald-500 hover:text-white transition-all text-slate-400" title="Xuất file cá nhân">
                {exporting && selectedMember?.id === mem.id ? <Loader2 size={20} className="animate-spin"/> : <Download size={20} />}
              </button>
              <button onClick={() => { setEditingMember(mem); setIsModalOpen(true); }} className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-blue-600 hover:text-white transition-all text-slate-400" title="Sửa">
                <Pencil size={20} />
              </button>
              <button 
                onClick={async () => { 
                  if(confirm("Bạn có chắc chắn muốn xóa thành viên này?")) {
                    try { await deleteDoc(doc(db, "members", mem.id)); } 
                    catch(e: any) { alert("Không thể xóa. Lỗi: " + e.message); }
                  } 
                }} 
                className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-50 flex items-center justify-center rounded-2xl hover:bg-red-500 hover:text-white transition-all text-slate-400 shadow-sm active:scale-90"
                title="Xóa"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL XEM CHI TIẾT VÀ HOẠT ĐỘNG */}
      {isViewModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-[#0055A5] p-8 flex justify-between items-center text-white shrink-0">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">{selectedMember.fullName}</h2>
                <span className="text-xs font-bold text-blue-200 tracking-widest uppercase mt-1 block">Tổ {selectedMember.group} • {selectedMember.studentId}</span>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-50 flex-1">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Chuyên ngành</span>
                  <span className="font-black text-slate-700 text-sm">{selectedMember.major || "Chưa cập nhật"}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Ngày sinh</span>
                  <span className="font-black text-slate-700 text-sm">{selectedMember.dob || "Chưa cập nhật"}</span>
                </div>
              </div>

              <h3 className="font-black text-slate-800 mb-4 uppercase tracking-widest flex items-center gap-2 text-sm"><CalendarCheck className="text-emerald-500" size={18}/> Lịch sử tham gia</h3>
              <div className="space-y-3">
                {attendanceRecords.filter(a => a.memberId === selectedMember.id || a.studentId === selectedMember.studentId).length > 0 ? (
                  attendanceRecords.filter(a => a.memberId === selectedMember.id || a.studentId === selectedMember.studentId).map((att, idx) => {
                    const act = activities.find(a => a.id === att.activityId);
                    return (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                        <div>
                          <p className="font-black text-slate-700 text-sm uppercase">{act?.name || act?.title || "Hoạt động hệ thống"}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{act?.date || att.timestamp?.toDate?.()?.toLocaleDateString() || "N/A"}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">+{act?.points || 10} điểm</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chưa có dữ liệu điểm danh</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <button disabled={exporting} onClick={() => { setIsViewModalOpen(false); exportIndividualFile(selectedMember); }} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs transition-all">
                {exporting ? <Loader2 className="animate-spin" size={18}/> : <Download size={18} />} Xuất hồ sơ cá nhân này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XUẤT FILE TỔNG HỢP */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3.5rem] shadow-2xl border-4 border-white animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-[#0055A5]">Tùy chọn xuất file</h2>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-red-500"><X/></button>
            </div>
            
            <div className="space-y-6">
              {/* Option 1: Xuất Custom List */}
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                <h3 className="text-xs font-black text-[#0055A5] mb-4 uppercase tracking-widest flex items-center gap-2"><Settings2 size={16}/> 1. Xuất theo trường thông tin</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {Object.entries(exportOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:border-blue-200 border border-transparent transition-all">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600">{EXPORT_LABELS[key] || key}</span>
                      <input type="checkbox" checked={value} onChange={(e) => setExportOptions({...exportOptions, [key]: e.target.checked})} className="w-4 h-4 accent-[#0055A5]"/>
                    </label>
                  ))}
                </div>
                <button onClick={handleExportCustom} disabled={exporting} className="w-full py-4 bg-[#0055A5] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:bg-blue-700 transition-all">
                  {exporting ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={18}/>} Xuất Tùy Chọn
                </button>
              </div>

              {/* Option 2: Xuất theo MSSV */}
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                 <h3 className="text-xs font-black text-emerald-600 mb-4 uppercase tracking-widest flex items-center gap-2"><ListFilter size={16}/> 2. Xuất sắp xếp theo Mã SV</h3>
                 <button onClick={handleExportByMSSV} disabled={exporting} className="w-full py-4 bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all">
                   {exporting ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={18}/>} Xuất DS Theo MSSV
                 </button>
              </div>

              {/* Option 3: Xuất theo Tổ kèm hoạt động */}
              <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                 <h3 className="text-xs font-black text-orange-600 mb-4 uppercase tracking-widest flex items-center gap-2"><FileSpreadsheet size={16}/> 3. Xuất toàn bộ Tổ (Kèm Lịch Sử)</h3>
                 <div className="flex gap-3">
                    <select 
                      value={exportGroupSelect} onChange={(e) => setExportGroupSelect(e.target.value)}
                      className="bg-white p-4 rounded-2xl outline-none font-black text-sm text-slate-700 shadow-sm flex-1 cursor-pointer"
                    >
                      {[1,2,3,4,5,6].map(num => <option key={num} value={num.toString()}>TỔ {num}</option>)}
                    </select>
                    <button onClick={() => handleExportByGroup(exportGroupSelect)} disabled={exporting} className="flex-1 py-4 bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 hover:bg-orange-600 transition-all">
                      {exporting ? <Loader2 className="animate-spin" size={16}/> : <Download size={18}/>} Xuất Tổ
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-xl p-12 rounded-[4rem] shadow-2xl border-4 border-white animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black mb-8 text-center uppercase tracking-tight text-[#0055A5]">{editingMember ? "Cập nhật dữ liệu" : "Thêm mới chiến sĩ"}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <input name="fullName" defaultValue={editingMember?.fullName} required placeholder="Họ và Tên" className="w-full bg-slate-50 p-6 rounded-[1.8rem] outline-none font-bold border-2 border-transparent focus:border-blue-200 shadow-inner" />
              <div className="grid grid-cols-2 gap-4">
                <input name="studentId" defaultValue={editingMember?.studentId} required placeholder="Mã SV" className="bg-slate-50 p-6 rounded-[1.8rem] outline-none font-bold shadow-inner" />
                <input name="group" defaultValue={editingMember?.group} placeholder="Tổ (1-6)" className="bg-slate-50 p-6 rounded-[1.8rem] outline-none font-bold shadow-inner" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="major" defaultValue={editingMember?.major} placeholder="Ngành học" className="bg-slate-50 p-6 rounded-[1.8rem] outline-none font-bold shadow-inner" />
                <input name="dob" defaultValue={editingMember?.dob} placeholder="Ngày sinh" className="bg-slate-50 p-6 rounded-[1.8rem] outline-none font-bold shadow-inner" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingMember(null); }} className="flex-1 py-6 bg-slate-100 text-slate-500 font-black rounded-[1.8rem] hover:bg-slate-200 transition-all">HỦY</button>
                <button type="submit" className="flex-1 py-6 bg-[#0055A5] text-white font-black rounded-[1.8rem] shadow-xl shadow-blue-200 uppercase hover:bg-blue-700 transition-all">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}