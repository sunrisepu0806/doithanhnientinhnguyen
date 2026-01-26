"use client";

import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  QrCode, LogOut, CheckCircle2, Camera, CameraOff, 
  Loader2, Keyboard, AlertTriangle, X, Clock, Lock,
  Activity // Giữ nguyên icon này
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // scanStep chỉ còn 'idle' (đang chờ) hoặc 'result' (hiện kết quả), bỏ 'verifying'
  const [scanStep, setScanStep] = useState<'idle' | 'result'>('idle');
  const [tempMember, setTempMember] = useState<any>(null);
  // Đã bỏ state meetingPasscode vì không cần nhập lại nữa

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
    const role = localStorage.getItem("user_role");
    if (role !== "admin" && role !== "scanner") {
      router.push("/login");
    } else {
      fetchMembers();
    }
  }, []);

  const fetchMembers = async () => {
    const snapshot = await getDocs(collection(db, "members"));
    setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleActivityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(collection(db, "activities"), where("password", "==", passwordInput));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        if (docData.isActive === false) {
            alert("Hoạt động này đã kết thúc!");
            setLoading(false);
            return;
        }
        const activity = { id: snapshot.docs[0].id, ...docData };
        setCurrentActivity(activity);
        
        const attQuery = query(collection(db, "attendance"), where("activityId", "==", activity.id));
        const attSnap = await getDocs(attQuery);
        const existingIds = new Set<string>();
        const existingList: any[] = [];
        attSnap.docs.forEach(doc => {
            const data = doc.data();
            existingIds.add(data.memberId);
            existingList.push({ memberId: data.memberId, fullName: data.memberName, studentId: data.studentId, timestamp: data.timestamp });
        });
        setCheckedInSet(existingIds);
        existingList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setRecentCheckins(existingList);
      } else { alert("Mật khẩu không đúng!"); }
    } catch (err) { alert("Lỗi Firebase"); }
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
        } catch (err) { setIsScanning(false); alert("Lỗi Camera!"); }
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

  const initiateVerification = (inputData: string) => {
    const member = members.find(m => m.id === inputData || m.studentId === inputData);
    if (member) {
      if (checkedInSet.has(member.id)) {
        // Nếu đã điểm danh rồi thì báo Warning
        setTempMember(member); // Lưu để hiển thị tên
        setAttendanceStatus({ status: 'warning', member, msg: "Đã điểm danh!" });
        setScanStep('result');
        resetAfterDelay();
      } else {
        // NẾU CHƯA ĐIỂM DANH -> GỌI HÀM LƯU LUÔN (BỎ BƯỚC NHẬP PASS)
        performDirectCheckIn(member);
      }
    } else {
      setAttendanceStatus({ status: 'error', msg: `Không tìm thấy: ${inputData}` });
      setScanStep('result');
      resetAfterDelay();
    }
  };

  // --- HÀM MỚI: XỬ LÝ ĐIỂM DANH LUÔN KHÔNG CẦN PASS ---
  const performDirectCheckIn = async (member: any) => {
    setLoading(true);
    setTempMember(member); // Lưu để hiển thị ở màn hình kết quả

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
      setCheckedInSet(prev => new Set(prev).add(member.id));
      setRecentCheckins(prev => [{ ...newRecord, fullName: member.fullName, timestamp: { seconds: Date.now() / 1000 } }, ...prev]);
      
      setAttendanceStatus({ status: 'success', member: member, msg: "Thành công!" });
      setScanStep('result');
      resetAfterDelay();
    } catch (error) { 
      setAttendanceStatus({ status: 'error', msg: "Lỗi lưu dữ liệu!" }); 
      setScanStep('result');
      resetAfterDelay();
    }
    setLoading(false);
  };

  const resetAfterDelay = () => {
    setTimeout(() => {
      setAttendanceStatus(null);
      setTempMember(null);
      // setMeetingPasscode(""); // Bỏ dòng này
      setScanStep('idle');
      setManualId("");
      if (!showManualInput) setIsScanning(true);
    }, 2000); // Giảm thời gian chờ xuống 2s cho nhanh
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!manualId.trim()) return;
    setShowManualInput(false);
    initiateVerification(manualId.trim());
  };

  if (!currentActivity) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border-4 border-white">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 text-white">
                <Lock size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Vào Ca Trực</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Nhập mã bảo mật hoạt động</p>
          </div>
          <form onSubmit={handleActivityLogin} className="space-y-6">
            <input type="password" placeholder="••••••••" className="w-full bg-slate-50 p-6 rounded-[2rem] text-center font-black text-3xl outline-none shadow-inner border-2 border-transparent focus:border-blue-100 transition-all" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
            <button className="w-full bg-blue-600 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto"/> : "XÁC NHẬN PHIÊN TRỰC"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <style>{`#reader { border: none !important; width: 100% !important; } #reader video { border-radius: 40px !important; object-fit: cover !important; }`}</style>
      
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center mb-6 border-4 border-white">
          <div className="flex items-center gap-4">
             <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><QrCode size={24}/></div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang trực tại</p>
                <h2 className="text-lg md:text-xl font-black text-slate-800 leading-tight tracking-tight">{currentActivity.name}</h2>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-full font-black text-sm border border-blue-100">
                Sĩ số: {checkedInSet.size}
             </div>
             <button onClick={() => { localStorage.clear(); router.push("/login"); }} className="p-3 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm">
                <LogOut size={20}/>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          <div className="lg:col-span-7 flex flex-col gap-4 h-full">
            <div className="bg-white p-4 rounded-[3rem] shadow-xl border-4 border-white relative overflow-hidden flex-1 flex flex-col justify-center items-center min-h-[450px]">
              
              {/* MÀN HÌNH KẾT QUẢ (SUCCESS / ERROR / WARNING) */}
              {scanStep === 'result' && attendanceStatus && (
                <div className="text-center p-8 animate-in zoom-in duration-300 w-full z-10">
                  {attendanceStatus.status === 'success' ? (
                    <div className="text-emerald-600">
                      <div className="bg-emerald-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100 border-4 border-white">
                        <CheckCircle2 size={64} />
                      </div>
                      <h3 className="text-3xl font-black mb-2 tracking-tight">{attendanceStatus.member.fullName}</h3>
                      <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Điểm danh thành công</p>
                    </div>
                  ) : attendanceStatus.status === 'warning' ? (
                    <div className="text-orange-500">
                      <div className="bg-orange-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-100 border-4 border-white">
                        <AlertTriangle size={64} />
                      </div>
                      <h3 className="text-3xl font-black mb-2 tracking-tight">{attendanceStatus.member.fullName}</h3>
                      <p className="text-lg font-black uppercase tracking-widest italic">Đã điểm danh!</p>
                    </div>
                  ) : (
                    <div className="text-red-500">
                      <div className="bg-red-100 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100 border-4 border-white">
                        <X size={64} />
                      </div>
                      <p className="text-xl font-black uppercase tracking-tighter">{attendanceStatus.msg}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ĐÃ XÓA KHỐI scanStep === 'verifying' Ở ĐÂY */}

              {/* MÀN HÌNH QUÉT CAMERA (IDLE) */}
              {scanStep === 'idle' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    {!isScanning && (
                      <div className="text-center">
                        <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                            <Camera className="text-slate-300" size={40}/>
                        </div>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Hệ thống đang chờ lệnh</p>
                      </div>
                    )}
                    <div id="reader" className={`w-full max-w-sm ${!isScanning ? 'hidden' : 'block shadow-2xl rounded-[3rem]'}`}></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setScanStep('idle'); setIsScanning(!isScanning); }}
                  disabled={scanStep !== 'idle' || showManualInput}
                  className={`py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${isScanning ? 'bg-white text-red-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
                >
                  {isScanning ? <><CameraOff size={22}/> DỪNG QUÉT</> : <><Camera size={22}/> MỞ CAMERA</>}
                </button>
                <button 
                  onClick={() => { setIsScanning(false); setShowManualInput(true); }}
                  disabled={scanStep !== 'idle'}
                  className="bg-white text-slate-700 py-6 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 border-2 border-white transition-all"
                >
                   <Keyboard size={22}/> NHẬP MÃ SV
                </button>
            </div>
          </div>

          <div className="lg:col-span-5 h-full flex flex-col gap-4 overflow-hidden">
             <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-white flex-1 flex flex-col overflow-hidden">
                <h3 className="text-slate-800 font-black text-xl mb-6 flex items-center gap-4 px-2">
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shadow-sm"><Clock size={24}/></div>
                    Lịch sử điểm danh
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {recentCheckins.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                            <Activity size={60} className="mb-4" />
                            <p className="font-black uppercase text-xs tracking-widest">Chưa có dữ liệu</p>
                        </div>
                    ) : (
                        recentCheckins.map((item, index) => (
                          <div key={index} className="flex items-center gap-5 p-5 bg-slate-50/50 rounded-[2.5rem] animate-in slide-in-from-right-10 duration-500 border border-white hover:bg-white transition-all">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-md font-black text-xl shrink-0 border border-slate-50 uppercase">
                                  {item.fullName?.charAt(0) || item.memberName?.charAt(0) || "C"}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-black text-slate-800 truncate text-base leading-none mb-1">{item.fullName || item.memberName}</p>
                                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.studentId}</p>
                              </div>
                              <div className="text-[10px] font-black text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100 italic">
                                  {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : "Mới xong"}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6">
           <div className="bg-white w-full max-sm p-12 rounded-[4rem] shadow-2xl relative animate-in zoom-in duration-300 border-4 border-white">
              <button onClick={() => setShowManualInput(false)} className="absolute top-10 right-10 text-slate-300 hover:text-red-500 transition-colors"><X size={32}/></button>
              <div className="text-center mb-10">
                  <div className="bg-slate-50 inline-block p-5 rounded-[2rem] text-slate-400 mb-4"><Keyboard size={40}/></div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Mã Sinh Viên</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Dành cho Đội viên hỏng QR</p>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-6">
                  <input autoFocus placeholder="VD: 450110..." className="w-full bg-slate-50 p-6 rounded-[2rem] text-center font-black text-3xl outline-none shadow-inner uppercase border-2 border-transparent focus:border-blue-100 transition-all" value={manualId} onChange={(e) => setManualId(e.target.value)} />
                  <button type="submit" className="w-full bg-blue-600 text-white font-black py-6 rounded-[2.5rem] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">TIẾP TỤC</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}