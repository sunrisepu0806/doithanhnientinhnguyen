"use client";

import { useState } from "react";
import { UserPlus, X, Save } from "lucide-react";

export default function MembersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State để lưu thông tin 7 cột cho thành viên mới
  const [formData, setFormData] = useState({
    name: "", mssv: "", position: "Thành viên", group: "Tổ 1", major: "", phone: "", email: ""
  });

  return (
    <div className="p-8 relative min-h-screen bg-[#F8FAFC]">
      {/* Nút mở Modal Thêm mới */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Danh sách Đội viên</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> Thêm Đội viên
        </button>
      </div>

      {/* MODAL THÊM/SỬA (Chỉ hiện khi isModalOpen = true) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
            {/* Header Modal */}
            <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Thông tin Đội viên mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Form nhập liệu 7 cột */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Họ và Tên</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Nguyễn Văn A" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">MSSV</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="4851050..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Chức vụ</label>
                <select className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                  <option>Thành viên</option>
                  <option>Tổ trưởng</option>
                  <option>Đội phó</option>
                  <option>Đội trưởng</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Tổ</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Tổ 1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Ngành học</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Sư phạm Vật lý" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1">Số điện thoại</label>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="0905..." />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">
                Hủy bỏ
              </button>
              <button className="flex-1 py-4 bg-[#6366F1] text-white font-bold rounded-2xl hover:bg-[#4F46E5] shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all">
                <Save className="w-5 h-5" /> Lưu thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* (Phần bảng danh sách cũ vẫn nằm ở đây) */}
    </div>
  );
}