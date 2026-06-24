"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  QrCode, LogOut, CheckCircle2, Camera, CameraOff, 
  Loader2, Keyboard, AlertTriangle, X, Clock, Lock,
  ChevronLeft, CalendarCheck, ScanLine, Users, Heart
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Activity {
  id: string;
  name: string;
  password?: string;
  points: number;
  isActive?: boolean;
}

interface Member {
  id: string;
  fullName: string;
  studentId: string;
}

export default function ScanPage() {
  const [activeActivities, setActiveActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivitySelectId] = useState("");
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const [role, setRole] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<'idle' | 'result'>('idle');

  const [attendanceStatus, setAttendanceStatus] = useState<{ 
    status: 'success' | 'error' | 'warning'; 
    member?: any; 
    msg: string 
  } | null>(null);

  const [members, setMembers] = useState<Member[]>([]); 
  const [checkedInSet, setCheckedInSet] = useState<Set<string>>(new Set());
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState("");

  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isstartingRef = useRef<boolean>(false);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { console.log("Audio Error:", e); }
  };

  useEffect(() => {
    setIsMounted(true);
    const currentRole = localStorage.getItem("user_role");
    setRole(currentRole);

    if (currentRole !== "admin" && currentRole !== "scanner") {
      router.push("/login");
    } else {
      const unsubMems = onSnapshot(collection(db, "members"), (snap) => {
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Member, "id">) })));
      });

      const unsubActs = onSnapshot(collection(db, "activities"), (snap) => {
        const acts = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(a => a.isActive !== false)
          .map(a => ({ id: a.id, name: a.name || a.title, points: Number(a.points || 10), password: a.password }));
        setActiveActivities(acts);
        if (acts.length > 0) setSelectedActivitySelectId(acts[0].id);
        setLoadingActivities(false);
      });

      return () => {
        unsubMems();
        unsubActs();
      };
    }
  }, [router]);

  useEffect(() => {
    if (!currentActivity) return;
    const attQuery = query(collection(db, "attendance"), where("activityId", "==", currentActivity.id));
    const unsubscribeAtt = onSnapshot(attQuery, (snapshot) => {
      const existingIds = new Set<string>();
      const existingList: any[] = [];
      snapshot.docs.forEach(doc => {
          const data = doc.data();
          existingIds.add(data.memberId);
          existingList.push({ id: doc.id, memberId: data.memberId, fullName: data.memberName, studentId: data.studentId, timestamp: data.timestamp });
      });
      setCheckedInSet(existingIds);
      existingList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setRecentCheckins(existingList);
    });

    return () => unsubscribeAtt();
  }, [currentActivity]);

  // Hàm khởi động Camera an toàn bất đồng bộ bảo vệ phần cứng thiết bị
  const startCamera = async () => {
    if (isstartingRef.current) return;
    if (scannerRef.current && scannerRef.current.isScanning) return;
    
    isstartingRef.current = true;
    setIsScanning(true);

    try {
      // Đảm bảo dọn dẹp các đối tượng camera cũ lơ lửng nếu có trước đó
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch (clearErr) {
          console.log("Dọn dẹp camera cũ: ", clearErr);
        }
        scannerRef.current = null;
      }

      // Trì hoãn một khoảng nhỏ để phần cứng hệ thống kịp giải phóng luồng
      await new Promise((resolve) => setTimeout(resolve, 300));

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 20, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, 
        onScanSuccess,
        () => {}
      );
    } catch (err) {
      console.error("Camera Start Error:", err);
      setIsScanning(false);
    } finally {
      isstartingRef.current = false;
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Camera Stop Error:", err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => {
    if (currentActivity && isScanning && scanStep === 'idle' && !showManualInput) {
      startCamera();
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [currentActivity, isScanning, scanStep, showManualInput]);

  const onScanSuccess = async (decodedText: string) => {
    await stopCamera();
    initiateVerification(decodedText);
  };

  const handleActivityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) return alert("Vui lòng chọn 1 hoạt động!");
    setLoading(true);

    const targetAct = activeActivities.find(a => a.id === selectedActivityId);
    if (!targetAct) {
      alert("Hoạt động không tồn tại!");
      setLoading(false);
      return;
    }

    if (targetAct.password === passwordInput.trim()) {
      setCurrentActivity(targetAct);
      setIsScanning(true);
    } else {
      alert("Mật mã ca trực không chính xác!");
    }
    setLoading(false);
  };

  const processCheckIn = async (member: any) => {
    setLoading(true);
    try {
      const newRecord = {
        activityId: currentActivity!.id,
        activityName: currentActivity!.name,
        memberId: member.id,
        memberName: member.fullName,
        studentId: member.studentId,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, "attendance"), newRecord);
      playBeep();
      
      setAttendanceStatus({ status: 'success', member: member, msg: "Thành công!" });
      setScanStep('result');
      resetAfterDelay();
    } catch (error) { 
      setAttendanceStatus({ status: 'error', msg: "Lỗi kết nối!" }); 
      setScanStep('result');
      resetAfterDelay();
    } finally {
      setLoading(false);
    }
  };

  const processBulkCheckIn = async (ids: string[]) => {
    setLoading(true);
    let success = 0, warning = 0, error = 0;
    
    for (const inputData of ids) {
       const member = members.find(m => m.id === inputData || m.studentId === inputData);
       if (member) {
         if (checkedInSet.has(member.id)) {
           warning++;
         } else {
           try {
             await addDoc(collection(db, "attendance"), {
               activityId: currentActivity!.id,
               activityName: currentActivity!.name,
               memberId: member.id,
               memberName: member.fullName,
               studentId: member.studentId,
               timestamp: serverTimestamp()
             });
             checkedInSet.add(member.id); 
             success++;
           } catch(e) {
             error++;
           }
         }
       } else {
         error++;
       }
       await new Promise(res => setTimeout(res, 50));
    }
    
    setLoading(false);
    playBeep();
    setAttendanceStatus({ 
      status: 'success', 
      msg: `XỬ LÝ: +${success} Mới | Trùng: ${warning} | Lỗi: ${error}` 
    });
    setScanStep('result');
    setTimeout(() => {
      setAttendanceStatus(null);
      setScanStep('idle');
      setManualId("");
      setIsScanning(true); 
    }, 3000); 
  };

  const initiateVerification = (inputData: string) => {
    const member = members.find(m => m.id === inputData || m.studentId === inputData);
    if (member) {
      if (checkedInSet.has(member.id)) {
        setAttendanceStatus({ status: 'warning', member, msg: "Đã điểm danh!" });
        setScanStep('result');
        resetAfterDelay();
      } else {
        processCheckIn(member);
      }
    } else {
      setAttendanceStatus({ status: 'error', msg: `Mã không hợp lệ: ${inputData}` });
      setScanStep('result');
      resetAfterDelay();
    }
  };

  const resetAfterDelay = () => {
    setTimeout(() => {
      setAttendanceStatus(null);
      setScanStep('idle');
      setManualId("");
      if (!showManualInput) setIsScanning(true); 
    }, 1200); 
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!manualId.trim()) return;
    setShowManualInput(false);

    const ids = manualId.split(/[\n, ]+/).map(id => id.trim()).filter(id => id);

    if(ids.length === 1) {
      initiateVerification(ids[0]);
    } else {
      await processBulkCheckIn(ids);
    }
  };

  if (!isMounted) return null;

  // --- GIAO DIỆN NHẬP CA TRỰC ---
  if (!currentActivity) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="w-full max-w-md bg-white p-6 rounded-soft border border-blue-50 shadow-soft-xl">
          
          <div className="text-center mb-6">
            <div className="bg-[#0055A5] w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/10 text-white">
              <ScanLine size={24} />
            </div>
            <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Kích Hoạt Máy Quét</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Hệ thống ghi nhận chuyên cần QNU</p>
          </div>

          <form onSubmit={handleActivityLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Chọn hoạt động diễn ra</label>
              {loadingActivities ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-400 font-semibold flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-500"/> Đang tải danh sách hoạt động...
                </div>
              ) : activeActivities.length > 0 ? (
                <select 
                  value={selectedActivityId} 
                  onChange={(e) => setSelectedActivitySelectId(e.target.value)}
                  className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm font-bold text-slate-700 cursor-pointer"
                >
                  {activeActivities.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold text-center">
                  Hiện tại không có hoạt động nào đang mở!
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Mật mã ca trực</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock size={16} />
                </span>
                <input 
                  type="password" 
                  placeholder="Nhập mật mã xác thực..." 
                  className="w-full bg-slate-50 p-3 pl-10 rounded-xl border border-slate-200 outline-none focus:border-blue-500 text-sm focus:bg-white transition-all text-slate-700 font-bold tracking-wider" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || activeActivities.length === 0}
              className="w-full bg-[#0055A5] text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={14}/> : "Vào phiên điểm danh"}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            {role === "admin" ? (
              <button type="button" onClick={() => router.push("/admin/users")} className="text-slate-500 hover:text-[#0055A5] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors">
                <ChevronLeft size={12}/> Quay lại trang chính
              </button>
            ) : (
              <span className="text-slate-300 font-bold text-[10px] uppercase tracking-wider">Scanner QNU</span>
            )}
            
            <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="text-red-500 hover:text-red-700 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
              <LogOut size={12}/> Đăng xuất
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN PHIÊN MÁY QUÉT ĐIỂM DANH CHÍNH THỨC ---
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-12 flex flex-col">
      <header className="bg-[#0055A5] text-white p-6 shadow-md shrink-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="bg-white/10 p-2.5 rounded-xl text-white shrink-0">
                 <QrCode size={18}/>
             </div>
             <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-[9px] font-bold text-blue-200 uppercase tracking-wider">Phiên quét hoạt động</p>
                </div>
                <h2 className="text-base font-bold uppercase tracking-tight truncate max-w-md">{currentActivity.name}</h2>
             </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
             <div className="bg-white/10 text-white px-3 py-1.5 rounded-xl font-bold text-xs border border-white/10 flex items-center gap-1.5">
                <Users size={14}/> Đã quét: {checkedInSet.size}
             </div>
             <button onClick={() => { setCurrentActivity(null); setPasswordInput(""); stopCamera(); }} className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow">
                <LogOut size={16}/>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 mt-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-white p-6 rounded-soft border border-blue-50 shadow-soft-xl min-h-[340px] flex flex-col justify-center items-center relative">
              
              {scanStep === 'result' && attendanceStatus && (
                <div className="text-center p-4 animate-in zoom-in duration-200 w-full">
                  {attendanceStatus.status === 'success' ? (
                    <div className="text-emerald-500">
                      <div className="bg-emerald-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200 animate-bounce">
                        <CheckCircle2 size={28} className="fill-emerald-500 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight truncate px-2">{attendanceStatus.member ? attendanceStatus.member.fullName : "NHẬP DATA THÀNH CÔNG"}</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-0.5">{attendanceStatus.member ? `MSV: ${attendanceStatus.member.studentId}` : attendanceStatus.msg}</p>
                    </div>
                  ) : attendanceStatus.status === 'warning' ? (
                    <div className="text-orange-500">
                      <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-200">
                        <AlertTriangle size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight truncate px-2">{attendanceStatus.member ? attendanceStatus.member.fullName : "CẢNH BÁO"}</h3>
                      <p className="text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg inline-block mt-1 uppercase tracking-wider">Đội viên đã điểm danh</p>
                    </div>
                  ) : (
                    <div className="text-red-500">
                      <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-red-200">
                        <X size={28} />
                      </div>
                      <p className="text-sm font-bold text-slate-700 px-2">{attendanceStatus.msg}</p>
                    </div>
                  )}
                </div>
              )}

              {scanStep === 'idle' && (
                <div className="w-full flex flex-col items-center justify-center">
                    {!isScanning && (
                      <div className="text-center py-12">
                        <div className="bg-slate-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-200/60 shadow-inner">
                            <Camera className="text-slate-300" size={22}/>
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Hệ thống camera sẵn sàng</p>
                      </div>
                    )}
                    <div id="reader" className={`w-full max-w-[320px] ${!isScanning ? 'hidden' : 'block rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50'}`}></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => { setScanStep('idle'); if(isScanning) stopCamera(); else startCamera(); }}
                  disabled={scanStep !== 'idle' || showManualInput}
                  className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${isScanning ? 'bg-white text-red-500 border border-red-200 shadow-red-100/40' : 'bg-[#0055A5] text-white shadow-blue-500/10'}`}
                >
                  {isScanning ? <><CameraOff size={14}/> Tắt Camera</> : <><Camera size={14}/> Bật Camera</>}
                </button>
                <button 
                  onClick={() => { stopCamera(); setShowManualInput(true); }}
                  disabled={scanStep !== 'idle'}
                  className="bg-white text-slate-600 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md border border-slate-200 transition-all hover:bg-slate-100"
                >
                   <Keyboard size={14}/> Mã thủ công
                </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
             <div className="bg-white p-5 rounded-soft border border-blue-50 shadow-blue-glow flex-1 flex flex-col min-h-[395px] max-h-[395px]">
                <h3 className="text-slate-800 font-bold text-sm mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-600"><Clock size={14}/></div>
                    Lượt quét gần nhất
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {recentCheckins.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 opacity-40">
                            <CalendarCheck size={32} className="mb-2 text-slate-300" />
                            <p className="font-bold uppercase text-[10px] text-slate-400 tracking-wider">Chưa có lượt quét nào</p>
                        </div>
                    ) : (
                        recentCheckins.slice(0, 5).map((item, index) => (
                          <div key={item.id || index} className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all animate-in slide-in-from-bottom-2">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#0055A5] font-bold text-xs shrink-0 border border-blue-100 uppercase">
                                    {item.fullName?.charAt(0) || "U"}
                               </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-700 truncate text-xs uppercase leading-none mb-1">{item.fullName || item.memberName}</p>
                                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.studentId}</span>
                                </div>
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-150 shrink-0 ml-2">
                                  {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', second: '2-digit'}) : "Vừa xong"}
                              </div>
                          </div>
                        ))
                    )}
                </div>
             </div>
          </div>
        </div>
      </main>

      <div className="mt-12 text-center pointer-events-none opacity-20 shrink-0">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center justify-center gap-1.5">
          obi.phu08 <Heart size={10} className="fill-red-500 text-red-500"/> QNU
        </span>
      </div>

      {/* MODAL NHẬP MÃ THỦ CÔNG */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm p-6 rounded-soft shadow-2xl border border-slate-200 relative animate-in zoom-in duration-200 text-center">
              <button onClick={() => setShowManualInput(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 p-1.5 rounded-full"><X size={16}/></button>
              <div className="bg-slate-50 inline-block p-3 rounded-xl text-slate-600 mb-2 border border-slate-100"><Keyboard size={20}/></div>
              <h3 className="text-base font-bold text-slate-800 uppercase mb-1">Nhập mã sinh viên</h3>
              <p className="text-slate-400 text-[10px] font-medium mb-4 px-2">Nhập 1 mã hoặc Copy Paste hàng loạt cách nhau bằng dấu phẩy, khoảng trắng hoặc xuống dòng.</p>
              
              <form onSubmit={handleManualSubmit} className="space-y-3">
                  <textarea 
                    autoFocus 
                    rows={4}
                    placeholder="Ví dụ: 4851050001, 4851050002..." 
                    className="w-full bg-slate-50 p-3 rounded-xl text-center font-bold text-xs outline-none border border-slate-200 focus:border-blue-500 transition-all uppercase placeholder:text-slate-300 resize-none" 
                    value={manualId} 
                    onChange={(e) => setManualId(e.target.value)} 
                  />
                  <button type="submit" disabled={loading} className="w-full bg-[#0055A5] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-wider text-[10px] flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={14}/> : "Duyệt thông tin"}
                  </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}