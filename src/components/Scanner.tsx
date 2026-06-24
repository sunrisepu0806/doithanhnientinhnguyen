"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScanSuccess, onClose }: ScannerProps) {
  useEffect(() => {
    // Cấu hình trình quét
    const scanner = new Html5QrcodeScanner(
      "reader", 
      { fps: 10, qrbox: { width: 250, height: 250 } }, 
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
      },
      (error) => {
        // Có thể log lỗi ở đây nếu cần
      }
    );

    // Dọn dẹp khi đóng component
    return () => {
      scanner.clear().catch((error) => console.error("Failed to clear scanner", error));
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-[2rem] p-6 max-w-lg w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">Quét mã điểm danh</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div id="reader" className="overflow-hidden rounded-2xl border-4 border-indigo-100 bg-slate-50"></div>
        
        <p className="text-sm text-slate-500">
          Vui lòng đưa mã QR của sinh viên vào khung hình
        </p>
      </div>
    </div>
  );
}