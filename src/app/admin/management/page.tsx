"use client";

import { useState, useEffect } from "react";
// 1. THÊM setDoc vào import
import { 
  collection, setDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, query, orderBy, serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx"; 
import ExcelJS from "exceljs"; 
import QRCode from "qrcode";   
import { QRCodeSVG } from "qrcode.react"; 
import { 
  Search, UserPlus, Pencil, Trash2, ChevronLeft, Loader2, 
  FileDown, FileSpreadsheet, Settings2, X, FileUp, Trophy, Heart
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  fullName: string;
  studentId: string;
  major: string;
  group: string;
  dob: string;
  attendanceCount: number;
  createdAt?: any;
}

export default function MemberManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [exportOptions, setExportOptions] = useState({
    fullName: true,
    studentId: true,
    dob: true,
    group: true,
    major: true,
    attendanceCount: true,
    qrCode: true,
  });

  useEffect(() => {
    // Sắp xếp theo ID (MSSV) hoặc tên để dễ tìm
    const qMembers = query(collection(db, "members"), orderBy("studentId", "asc"));
    const unsubscribe = onSnapshot(qMembers, (snapshot) => {
      const mems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      const qAttendance = query(collection(db, "attendance"));
      onSnapshot(qAttendance, (attSnap) => {
        const allAtt = attSnap.docs.map(d => d.data());
        const updated = mems.map(m => ({
          ...m,
          // Kiểm tra cả theo ID (MSSV)
          attendanceCount: allAtt.filter((a: any) => a.memberId === m.id || a.studentId === m.studentId).length
        }));
        setMembers(updated);
        setFilteredMembers(updated);
        setLoading(false);
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredMembers(members.filter(m => m.fullName.toLowerCase().includes(lower) || m.studentId.includes(lower)));
  }, [searchTerm, members]);

  const downloadQR = async (id: string, name: string) => {
    try {
      // id ở đây chính là MSSV nhờ logic setDoc bên dưới
      const url = await QRCode.toDataURL(id, { width: 1000, margin: 2 });
      const a = document.createElement("a");
      a.href = url; a.download = `QR_${name}.png`; a.click();
    } catch (e) { console.error(e); }
  };

  const handleCustomExport = async () => {
    if (filteredMembers.length === 0) return;
    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Danh Sách');
      const cols: any[] = [];
      if (exportOptions.fullName) cols.push({ header: 'Họ và Tên', key: 'fullName', width: 25 });
      if (exportOptions.studentId) cols.push({ header: 'Mã SV', key: 'studentId', width: 15 });
      if (exportOptions.dob) cols.push({ header: 'Ngày Sinh', key: 'dob', width: 15 });
      if (exportOptions.major) cols.push({ header: 'Ngành', key: 'major', width: 20 });
      if (exportOptions.group) cols.push({ header: 'Tổ', key: 'group', width: 10 });
      if (exportOptions.attendanceCount) cols.push({ header: 'Buổi', key: 'attendanceCount', width: 10 });
      if (exportOptions.qrCode) cols.push({ header: 'Mã QR', key: 'qrCode', width: 20 });
      worksheet.columns = cols;
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      for (const m of filteredMembers) {
        const rowData: any = {};
        if (exportOptions.fullName) rowData.fullName = m.fullName;
        if (exportOptions.studentId) rowData.studentId = m.studentId;
        if (exportOptions.dob) rowData.dob = m.dob;
        if (exportOptions.major) rowData.major = m.major;
        if (exportOptions.group) rowData.group = m.group;
        if (exportOptions.attendanceCount) rowData.attendanceCount = m.attendanceCount;
        const row = worksheet.addRow(rowData);
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        if (exportOptions.qrCode) {
          row.height = 70;
          const qrUrl = await QRCode.toDataURL(m.id, { margin: 1, width: 200 });
          const imageId = workbook.addImage({ base64: qrUrl, extension: 'png' } as any);
          const colIdx = cols.findIndex(c => c.key === 'qrCode');
          if (colIdx !== -1) {
            worksheet.addImage(imageId, {
              tl: { col: colIdx, row: row.number - 1 },
              ext: { width: 85, height: 85 },
              editAs: 'oneCell'
            } as any);
          }
        }
      }
      const buffer = await (workbook.xlsx as any).writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Export_QNU.xlsx`; a.click();
    } catch (e) { alert("Lỗi xuất file!"); } 
    finally { setExporting(false); setIsExportModalOpen(false); }
  };

  const downloadSample = () => {
    const data = [{ "Họ và Tên": "Nguyễn Văn Phú", "Mã SV": "4651050123", "Ngày Sinh": "08/08/2006", "Ngành": "Vật Lý", "Tổ": "1" }];
    const ws = (XLSX as any).utils.json_to_sheet(data);
    const wb = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(wb, ws, "Mẫu");
    XLSX.writeFile(wb, "Mau_QNU.xlsx");
  };

  // --- CẬP NHẬT: LOGIC IMPORT EXCEL ÁNH XẠ ID ---
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const workbook = XLSX.read(event.target?.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);
      
      let successCount = 0;

      try {
        for (const item of json) {
          // Lấy MSSV làm ID chuẩn
          const rawId = item["Mã SV"] || item["studentId"];
          if(!rawId) continue;
          
          const sId = String(rawId).trim(); // Xóa khoảng trắng thừa

          // Sử dụng setDoc thay vì addDoc
          // doc(db, "members", sId) -> Ép ID của document = MSSV
          await setDoc(doc(db, "members", sId), {
            fullName: item["Họ và Tên"] || item["fullName"],
            studentId: sId,
            major: item["Ngành"] || item["major"] || "Chưa rõ",
            group: String(item["Tổ"] || item["group"] || "1"),
            dob: item["Ngày Sinh"] || item["dob"] || "",
            createdAt: serverTimestamp()
          }, { merge: true }); // merge: true giúp ghi đè thông tin nếu đã tồn tại mà không mất dữ liệu cũ
          
          successCount++;
        }
        alert(`Đã đồng bộ thành công ${successCount} thành viên!`);
      } catch (e) { alert("Lỗi đọc file hoặc lỗi mạng!"); console.error(e); }
      setUploading(false);
    };
    reader.readAsBinaryString(file);
  };

  // --- CẬP NHẬT: LOGIC THÊM THỦ CÔNG ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const sId = (fd.get("studentId") as string).trim();
    
    const data = {
      fullName: fd.get("fullName") as string,
      studentId: sId,
      major: fd.get("major") as string,
      group: fd.get("group") as string,
      dob: fd.get("dob") as string,
    };

    try {
      if (editingMember) {
        // Nếu đang sửa, ta cập nhật vào ID cũ
        await updateDoc(doc(db, "members", editingMember.id), data);
      } else {
        // Nếu thêm mới: KIỂM TRA XEM ĐÃ TỒN TẠI CHƯA
        // Dùng setDoc để ép ID = MSSV
        await setDoc(doc(db, "members", sId), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false); 
      setEditingMember(null);
      alert("Lưu thành công!");
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans selection:bg-blue-100 pb-20">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <Link href="/admin" className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all border border-slate-100">
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Thành Viên Đội</h1>
              <p className="text-slate-400 font-bold text-sm">Quản lý {members.length} chiến sĩ QNU</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={downloadSample} className="bg-white text-slate-600 font-bold py-3 px-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-2"><FileSpreadsheet size={18} className="text-green-600"/> Mẫu</button>
            <label className="bg-white text-slate-600 font-bold py-3 px-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-2 cursor-pointer">
              {uploading ? <Loader2 className="animate-spin text-purple-500"/> : <FileUp size={18} className="text-purple-600"/>} Nhập Excel (Restore)
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={() => setIsExportModalOpen(true)} className="bg-white text-slate-600 font-bold py-3 px-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-2"><Settings2 size={18} className="text-orange-500"/> Xuất File</button>
            <button onClick={() => { setEditingMember(null); setIsModalOpen(true); }} className="bg-blue-600 text-white font-black py-3 px-8 rounded-[1.5rem] shadow-xl shadow-blue-200 flex items-center gap-2"><UserPlus size={20} /> Thêm Mới</button>
          </div>
        </div>

        <div className="bg-white p-2 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex items-center border border-white">
          <Search className="ml-6 text-slate-400" size={20} />
          <input type="text" placeholder="Tìm kiếm đồng đội..." className="w-full p-5 bg-transparent outline-none text-slate-700 font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black">
                  <th className="px-8 py-6 text-center w-32">Mã QR</th>
                  <th className="px-8 py-6">Họ và Tên</th>
                  <th className="px-8 py-6">Mã SV (ID)</th>
                  <th className="px-8 py-6">Ngành Học</th>
                  <th className="px-8 py-6 text-center">Tổ</th>
                  <th className="px-8 py-6 text-center">Tích Lũy</th>
                  <th className="px-8 py-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" size={40}/></td></tr>
                ) : filteredMembers.map(mem => (
                  <tr key={mem.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-8 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                           {/* Giá trị QR Code bây giờ chính là ID (MSSV) */}
                           <QRCodeSVG value={mem.id} size={50} className="bg-white p-1 rounded-lg border shadow-sm" />
                           <button onClick={() => downloadQR(mem.id, mem.fullName)} className="text-[9px] font-black text-blue-500 hover:underline">TẢI QR</button>
                        </div>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-700">{mem.fullName}</td>
                    <td className="px-8 py-6 font-mono font-bold text-blue-600/60">{mem.id}</td> {/* Hiển thị ID để kiểm tra */}
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">{mem.major}</td>
                    <td className="px-8 py-6 text-center">
                      <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-xl text-[10px] font-black">Tổ {mem.group}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-xl text-xs font-black shadow-sm"><Trophy size={14}/> {mem.attendanceCount} buổi</div>
                    </td>
                    <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition-all">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setEditingMember(mem); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Pencil size={18}/></button>
                        <button onClick={async () => { if(confirm("Xóa thành viên?")) await deleteDoc(doc(db, "members", mem.id)) }} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl border-4 border-white animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cấu Hình Xuất File</h2>
                  <button onClick={() => setIsExportModalOpen(false)}><X className="text-slate-400"/></button>
              </div>
              <div className="space-y-3 mb-10">
                  {Object.entries(exportOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                        <input type="checkbox" checked={value} onChange={(e) => setExportOptions({...exportOptions, [key]: e.target.checked})} className="w-5 h-5 text-blue-600 rounded-lg"/>
                        <span className="font-black text-slate-700 text-sm uppercase tracking-wide">
                          {key === 'fullName' ? 'Họ và Tên' : 
                           key === 'studentId' ? 'Mã Sinh Viên' : 
                           key === 'dob' ? 'Ngày Sinh' : 
                           key === 'group' ? 'Tổ' : 
                           key === 'major' ? 'Ngành Học' : 
                           key === 'attendanceCount' ? 'Số Buổi Tích Lũy' : 
                           key === 'qrCode' ? 'Mã QR (Hình ảnh)' : key}
                        </span>
                    </label>
                  ))}
              </div>
              <button onClick={handleCustomExport} disabled={exporting} className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex justify-center gap-3 items-center">
                 {exporting ? <Loader2 className="animate-spin" size={20}/> : <FileDown size={22}/>} 
                 {exporting ? "ĐANG TẠO FILE..." : "XUẤT FILE NGAY"}
              </button>
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3.5rem] shadow-2xl border-4 border-white animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-slate-800 mb-8 text-center">{editingMember ? "Cập Nhật" : "Thêm Mới"}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input name="fullName" defaultValue={editingMember?.fullName} required placeholder="Họ và Tên" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black text-slate-700 border border-transparent focus:border-blue-200" />
              <div className="grid grid-cols-2 gap-4">
                <input name="studentId" defaultValue={editingMember?.studentId} disabled={!!editingMember} required placeholder="Mã SV (Làm ID)" className="bg-slate-50 p-5 rounded-2xl outline-none font-bold disabled:opacity-50" />
                <input name="dob" defaultValue={editingMember?.dob} required placeholder="Ngày sinh" className="bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="major" defaultValue={editingMember?.major} required placeholder="Ngành" className="bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
                <input name="group" defaultValue={editingMember?.group} required placeholder="Tổ" className="bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 font-black rounded-[2rem]">HỦY</button>
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-lg">LƯU LẠI</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-2 opacity-30 select-none">
        <Heart size={20} className="text-red-500 fill-red-500 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 text-center leading-relaxed">
          QNU Volunteer Team System <br/> Developed by Phu
        </p>
      </div>
    </div>
  );
}