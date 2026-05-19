"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  QrCode, LogOut, CheckCircle2, Camera, CameraOff, 
  Loader2, Keyboard, AlertTriangle, X, Clock, Lock,
  Star, ChevronLeft, CalendarCheck, ScanLine, Users, Heart
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ScanPage() {
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [scanStep, setScanStep] = useState<'idle' | 'result'>('idle');

  const [attendanceStatus, setAttendanceStatus] = useState<{ 
    status: 'success' | 'error' | 'warning'; 
    member?: any; 
    msg: string 
  } | null>(null);

  const [members, setMembers] = useState<any[]>([]); 
  const [checkedInSet, setCheckedInSet] = useState<Set<string>>(new Set());
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState("");

  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
    const role = localStorage.getItem("user_role");
    if (role !== "admin" && role !== "scanner") {
      router.push("/login");
    } else {
      const unsubMems = onSnapshot(collection(db, "members"), (snap) => {
        setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubMems();
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

  const handleActivityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(collection(db, "activities"), where("password", "==", passwordInput));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        if (docData.isActive === false) {
            alert("Hoạt động này đã đóng! Vui lòng liên hệ Admin để mở lại.");
            setLoading(false);
            return;
        }
        const activity = { id: snapshot.docs[0].id, points: Number(docData.points || 10), ...docData };
        setCurrentActivity(activity);
      } else { alert("Mật mã ca trực không chính xác!"); }
    } catch (err) { alert("Lỗi kết nối máy chủ"); }
    setLoading(false);
  };

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    if (isScanning && scanStep === 'idle' && !showManualInput) {
      const startScanner = async () => {
        try {
          html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 60, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            onScanSuccess,
            () => {} 
          );
        } catch (err) { setIsScanning(false); alert("Không thể khởi động Camera. Vui lòng kiểm tra quyền truy cập."); }
      };
      startScanner();
    }
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode?.clear()).catch(() => {});
      }
    };
  }, [isScanning, scanStep, showManualInput]);

  const onScanSuccess = async (decodedText: string) => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
    }
    setIsScanning(false); 
    initiateVerification(decodedText);
  };

  const processCheckIn = async (member: any) => {
    setLoading(true);
    try {
      const newRecord = {
        activityId: currentActivity.id,
        activityName: currentActivity.name,
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
      setAttendanceStatus({ status: 'error', msg: "Lỗi đường truyền!" }); 
      setScanStep('result');
      resetAfterDelay();
    }
    setLoading(false);
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
               activityId: currentActivity.id,
               activityName: currentActivity.name,
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
       await new Promise(res => setTimeout(res, 100));
    }
    
    setLoading(false);
    playBeep();
    setAttendanceStatus({ 
      status: 'success', 
      msg: `HOÀN TẤT: ${success} Mới | ${warning} Trùng | ${error} Lỗi` 
    });
    setScanStep('result');
    setTimeout(() => {
      setAttendanceStatus(null);
      setScanStep('idle');
      setManualId("");
      setIsScanning(true); 
    }, 4000); 
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

  if (!currentActivity) {
    return (
      <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4 font-sans relative overflow-hidden selection:bg-blue-100">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="bg-white/90 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl shadow-blue-900/5 w-full max-w-md border-2 border-white relative z-10 animate-in zoom-in duration-300">
          <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-2 bg-slate-50 hover:bg-red-50 rounded-full">
             <LogOut size={16} />
          </button>
          <div className="text-center mb-6">
            <div className="bg-gradient-to-tr from-[#0055A5] to-blue-400 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200 text-white">
                <ScanLine size={28} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-1 tracking-tighter uppercase">Điểm Danh</h1>
            <p className="text-slate-400 font-black uppercase text-[8px] tracking-[0.3em]">Hệ thống Scanner QNU</p>
          </div>
          <form onSubmit={handleActivityLogin} className="space-y-4">
            <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 ml-3 uppercase tracking-[0.2em]">Mã Ca Trực</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full bg-slate-50 p-3 pl-10 rounded-[1.5rem] font-black text-lg tracking-widest outline-none shadow-inner border-2 border-transparent focus:border-blue-200 transition-all text-[#0055A5]" 
                      value={passwordInput} 
                      onChange={(e) => setPasswordInput(e.target.value)} 
                      autoFocus
                    />
                </div>
            </div>
            <button className="w-full bg-[#0055A5] text-white font-black py-3.5 rounded-[1.5rem] shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-[10px] flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={16}/> : "Kích Hoạt Máy Quét"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FBFF] p-2 md:p-4 font-sans pb-10 selection:bg-blue-100 flex flex-col">
      <style>{`#reader { border: none !important; width: 100% !important; background: transparent; } #reader video { border-radius: 1.5rem !important; object-fit: cover !important; box-shadow: inset 0 2px 20px rgba(0,0,0,0.05); }`}</style>
      
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        <div className="bg-white/80 backdrop-blur-xl p-3 md:p-4 rounded-[1.5rem] shadow-md shadow-blue-900/5 flex flex-col md:flex-row justify-between items-center gap-3 mb-4 border border-white shrink-0">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="bg-gradient-to-tr from-[#0055A5] to-blue-400 p-2.5 rounded-xl text-white shadow-sm shrink-0">
                 <QrCode size={18}/>
             </div>
             <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Hệ thống hoạt động</p>
                </div>
                <h2 className="text-base md:text-lg font-black text-slate-800 leading-tight tracking-tight uppercase truncate">{currentActivity.name}</h2>
             </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex-1 md:flex-none bg-blue-50 text-[#0055A5] px-3 py-1.5 rounded-xl font-black text-[11px] border border-blue-100 flex items-center justify-center gap-1.5">
                <Users size={14}/> Sĩ số: {checkedInSet.size}
             </div>
             <div className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl font-black text-[11px] border border-amber-100 flex items-center gap-1.5">
                <Star size={14}/> +{currentActivity.points}
             </div>
             <button onClick={() => { setCurrentActivity(null); setPasswordInput(""); if(scannerRef.current) scannerRef.current.stop().catch(()=>{}); }} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={16}/>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[450px]">
          
          <div className="lg:col-span-7 flex flex-col gap-3 h-full">
            <div className="bg-white p-4 rounded-[2rem] shadow-lg shadow-blue-900/5 border-2 border-white relative overflow-hidden flex-1 flex flex-col justify-center items-center">
              
              {scanStep === 'result' && attendanceStatus && (
                <div className="text-center p-4 animate-in zoom-in duration-200 w-full z-10">
                  {attendanceStatus.status === 'success' ? (
                    <div className="text-emerald-500">
                      <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200 border-2 border-white animate-bounce">
                        <CheckCircle2 size={32} className="fill-emerald-500 text-white" />
                      </div>
                      <h3 className="text-xl font-black mb-1 tracking-tight uppercase truncate px-2">{attendanceStatus.member ? attendanceStatus.member.fullName : "NHẬP HÀNG LOẠT"}</h3>
                      <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-[8px] leading-relaxed">{attendanceStatus.member ? "Cập nhật thành công" : attendanceStatus.msg}</p>
                    </div>
                  ) : attendanceStatus.status === 'warning' ? (
                    <div className="text-orange-500">
                      <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-200 border-2 border-white">
                        <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-black mb-1 tracking-tight uppercase truncate px-2">{attendanceStatus.member ? attendanceStatus.member.fullName : "CẢNH BÁO"}</h3>
                      <p className="font-black uppercase tracking-[0.2em] text-[8px] bg-orange-100 inline-block px-3 py-1 rounded-full mt-1">Dữ liệu đã tồn tại</p>
                    </div>
                  ) : (
                    <div className="text-red-500">
                      <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-red-200 border-2 border-white">
                        <X size={32} />
                      </div>
                      <p className="text-sm font-black uppercase tracking-tighter leading-tight px-2">{attendanceStatus.msg}</p>
                    </div>
                  )}
                </div>
              )}

              {scanStep === 'idle' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                    {!isScanning && (
                      <div className="text-center animate-pulse">
                        <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-slate-100 shadow-inner">
                            <Camera className="text-slate-300" size={24}/>
                        </div>
                        <p className="text-slate-400 font-black uppercase text-[8px] tracking-[0.3em]">Ready to scan</p>
                      </div>
                    )}
                    <div id="reader" className={`w-full max-w-[320px] ${!isScanning ? 'hidden' : 'block shadow-md rounded-[1.5rem] border-2 border-slate-50 overflow-hidden'}`}></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 shrink-0">
                <button 
                  onClick={() => { setScanStep('idle'); setIsScanning(!isScanning); }}
                  disabled={scanStep !== 'idle' || showManualInput}
                  className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm ${isScanning ? 'bg-white text-red-500 border border-red-100' : 'bg-[#0055A5] text-white'}`}
                >
                  {isScanning ? <><CameraOff size={14}/> Tắt Camera</> : <><Camera size={14}/> Bật Camera</>}
                </button>
                <button 
                  onClick={() => { setIsScanning(false); setShowManualInput(true); }}
                  disabled={scanStep !== 'idle'}
                  className="bg-white text-slate-600 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm border border-slate-100 transition-all"
                >
                   <Keyboard size={14}/> Mã thủ công
                </button>
            </div>
          </div>

          <div className="lg:col-span-5 h-[350px] lg:h-full flex flex-col gap-3">
             <div className="bg-white p-4 rounded-[2rem] shadow-lg shadow-blue-900/5 border-2 border-white flex-1 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-[3rem] opacity-50 pointer-events-none"></div>
                
                <h3 className="text-slate-800 font-black text-sm mb-3 flex items-center gap-2 px-1 relative z-10">
                    <div className="bg-[#0055A5] p-1.5 rounded-lg text-white shadow-sm"><Clock size={14}/></div>
                    Lượt gần nhất
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar relative z-10">
                    {recentCheckins.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale">
                            <CalendarCheck size={36} className="mb-2 text-blue-500" />
                            <p className="font-black uppercase text-[8px] tracking-[0.2em]">Phiên quét trống</p>
                        </div>
                    ) : (
                        recentCheckins.slice(0, 5).map((item, index) => (
                          <div key={item.id || index} className="group flex items-center gap-3 p-2.5 bg-slate-50/70 rounded-2xl animate-in slide-in-from-right-4 duration-200 border border-slate-50 hover:bg-white hover:shadow-md transition-all">
                              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-[#0055A5] shadow-sm font-black text-xs shrink-0 border border-slate-100 uppercase group-hover:bg-[#0055A5] group-hover:text-white transition-colors">
                                  {item.fullName?.charAt(0) || item.memberName?.charAt(0) || "U"}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-700 truncate text-[11px] uppercase leading-none mb-1">{item.fullName || item.memberName}</p>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-mono font-black text-slate-500 uppercase">{item.studentId}</span>
                                  </div>
                              </div>
                              <div className="text-[8px] font-black text-slate-400 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-slate-100 shrink-0">
                                  {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : "Mới"}
                              </div>
                          </div>
                        ))
                    )}
                </div>
             </div>
          </div>
        </div>
      </div>

      {showManualInput && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm p-6 rounded-[2.5rem] shadow-2xl relative animate-in zoom-in duration-200 border-2 border-white text-center">
              <button onClick={() => setShowManualInput(false)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 p-1.5 rounded-full"><X size={18}/></button>
              <div className="bg-blue-50 inline-block p-3 rounded-2xl text-[#0055A5] mb-3 shadow-inner"><Keyboard size={24}/></div>
              <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-1">Nhập Mã SV</h3>
              <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] mb-4 px-2">Nhập 1 mã hoặc Copy Paste hàng loạt (cách nhau bằng phẩy hoặc xuống dòng)</p>
              
              <form onSubmit={handleManualSubmit} className="space-y-4">
                  <textarea 
                    autoFocus 
                    rows={4}
                    placeholder="VD: 4501104, 4501105..." 
                    className="w-full bg-slate-50 p-4 rounded-2xl text-center font-black text-xs outline-none shadow-inner border-2 border-transparent focus:border-blue-200 transition-all uppercase placeholder:text-slate-300 resize-none custom-scrollbar" 
                    value={manualId} 
                    onChange={(e) => setManualId(e.target.value)} 
                  />
                  <button type="submit" disabled={loading} className="w-full bg-[#0055A5] text-white font-black py-3 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-[9px] flex justify-center items-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={14}/> : "DUYỆT DANH SÁCH"}
                  </button>
              </form>
           </div>
        </div>
      )}

      <div className="mt-8 text-center pointer-events-none opacity-40">
        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center justify-center gap-1.5">
          obi.phu08 <Heart size={10} className="fill-red-500 text-red-500"/> QNU
        </span>
      </div>

    </div>
  );
}