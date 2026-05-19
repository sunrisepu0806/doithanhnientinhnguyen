"use client";

import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tìm trong collection "users" xem có khớp tài khoản không
      const q = query(
        collection(db, "users"), 
        where("username", "==", username),
        where("password", "==", password) 
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        
        // Lưu thông tin đăng nhập vào localStorage để các trang khác kiểm tra
        localStorage.setItem("user_role", userData.role); 
        localStorage.setItem("user_name", userData.username);

        // Điều hướng dựa trên quyền (Role)
        if (userData.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/scan");
        }
      } else {
        alert("Sai tên tài khoản hoặc mật khẩu!");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Lỗi hệ thống.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-300">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Đăng Nhập Hệ Thống</h1>
          <p className="text-slate-500 text-sm mt-1">Dành cho Admin & Đội Scan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-4 uppercase">Tài khoản</label>
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input
                required
                className="w-full bg-slate-50 p-4 pl-12 rounded-[1.5rem] border-none focus:ring-2 focus:ring-blue-400 outline-none shadow-inner font-bold text-slate-700"
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 ml-4 uppercase">Mật khẩu</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input
                required
                type="password"
                className="w-full bg-slate-50 p-4 pl-12 rounded-[1.5rem] border-none focus:ring-2 focus:ring-blue-400 outline-none shadow-inner font-bold text-slate-700"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-[2rem] shadow-lg shadow-blue-300 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Đăng Nhập Ngay"}
          </button>
        </form>
      </div>
    </div>
  );
}