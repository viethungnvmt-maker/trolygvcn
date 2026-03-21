
import React, { useState, useEffect } from 'react';
import { AppMode, Student, GeneratedEmail, GenerationConfig, ZaloConfig } from './types';
import SingleStudentForm from './components/SingleStudentForm';
import EmailResult from './components/EmailResult';
import BatchUpload from './components/BatchUpload';
import ZaloGroupForm from './components/ZaloGroupForm';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import StudentManagement from './components/StudentManagement';
import ComprehensiveReport from './components/ComprehensiveReport';
import { ApiKeyProvider, useApiKey } from './contexts/ApiKeyContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { generateEmailContent, generateZaloContent } from './services/geminiService';
import { GraduationCap, User, Users, Heart, MessageCircle, Settings, AlertTriangle, Facebook, Phone, Clock, LogOut, Crown, Gem, CheckCircle, Landmark, FileText, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

// Component to display visit count
const VisitCounter: React.FC = () => {
    const [count, setCount] = useState<number>(3351);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('app_visit_count');
            let current = stored ? parseInt(stored) : 0;
            
            // Increment once per session to avoid spamming on refresh
            if (!sessionStorage.getItem('has_counted_visit')) {
                current += 1;
                localStorage.setItem('app_visit_count', current.toString());
                sessionStorage.setItem('has_counted_visit', 'true');
            }
            
            setCount(3351 + current);
        } catch (e) {
            console.error("Visit counter error", e);
        }
    }, []);

    return (
        <a 
            href="https://trolygvcn.vercel.app/" 
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md border border-teal-200 rounded-full shadow-sm text-teal-800 text-xs font-bold mr-2 animate-fade-in hover:bg-white/90 transition-colors"
            title="Truy cập trang chủ"
        >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </div>
            <span>{count.toLocaleString()} lượt truy cập</span>
        </a>
    );
};

// Component to display countdown timer
const ExpiryCountdown: React.FC = () => {
    const { user } = useAuth();
    const [daysLeft, setDaysLeft] = useState<number | null>(null);

    useEffect(() => {
        if (user && user.expiry !== 'VIP') {
            const today = new Date();
            const expiryDate = new Date(user.expiry);
            
            // Set time to midnight for accurate day calculation
            today.setHours(0, 0, 0, 0);
            expiryDate.setHours(0, 0, 0, 0);

            const diffTime = expiryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setDaysLeft(diffDays);
        }
    }, [user]);

    if (!user || user.expiry === 'VIP') return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 text-xs font-bold animate-fade-in">
            <Clock size={14} className={daysLeft && daysLeft < 7 ? "text-red-400" : "text-teal-400"} />
            <span>
                {daysLeft !== null && daysLeft >= 0 
                    ? `Còn ${daysLeft} ngày sử dụng` 
                    : "Đã hết hạn sử dụng"}
            </span>
        </div>
    );
};

// Inner component to consume Context
const AppContent: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.SINGLE);
  const [currentEmail, setCurrentEmail] = useState<GeneratedEmail | null>(null);
  const [loading, setLoading] = useState(false);
  const { apiKey, selectedModel, setIsSettingsOpen } = useApiKey();
  const { logout, user } = useAuth();

  const handleSingleGenerate = async (student: Student, config: GenerationConfig) => {
    if(!apiKey) { setIsSettingsOpen(true); return; }
    setLoading(true);
    setCurrentEmail(null);
    try {
      // Pass user title and name to the service
      const email = await generateEmailContent(
          student, 
          config, 
          apiKey, 
          selectedModel,
          user?.fullName,
          user?.title
        );
      setCurrentEmail(email);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleZaloGenerate = async (config: ZaloConfig) => {
      if(!apiKey) { setIsSettingsOpen(true); return; }
      setLoading(true);
      setCurrentEmail(null);
      try {
        // Pass user title and name to the service
        const result = await generateZaloContent(
            config, 
            apiKey, 
            selectedModel,
            user?.fullName,
            user?.title
        );
        setCurrentEmail(result);
      } catch (error) {
          console.error(error);
          alert(error instanceof Error ? error.message : "Đã có lỗi xảy ra");
      } finally {
          setLoading(false);
      }
  }

  const handleBatchComplete = (emails: GeneratedEmail[]) => {
    if (emails.length > 0) {
        setCurrentEmail(emails[0]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-teal-50 relative">
      <SettingsModal />
      <ExpiryCountdown />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-teal-100 flex-none z-10 shadow-sm">
        <div className="w-full px-6 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2 rounded-lg text-white shadow-teal-200 shadow-lg">
                <Heart size={24} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-teal-900 tracking-tight uppercase">TEACHER'S HEART</h1>
                <p className="text-xs text-teal-600 font-medium">
                    Xin chào, {user?.title} {user?.fullName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
                <VisitCounter />
                
                <nav className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
                <button
                    onClick={() => setMode(AppMode.SINGLE)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                    ${mode === AppMode.SINGLE ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-teal-600'}`}
                >
                    <User size={18} />
                    <span className="hidden md:inline">Cá nhân</span>
                </button>
                <button
                    onClick={() => setMode(AppMode.BATCH)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                    ${mode === AppMode.BATCH ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-teal-600'}`}
                >
                    <Users size={18} />
                    <span className="hidden md:inline">Nhận xét tự động</span>
                </button>
                <button
                    onClick={() => setMode(AppMode.ZALO)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap
                    ${mode === AppMode.ZALO ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-blue-600'}`}
                >
                    <MessageCircle size={18} />
                    <span className="hidden md:inline">Zalo</span>
                </button>
                <button
                    onClick={() => setMode(AppMode.STUDENT_MANAGEMENT)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap
                    ${mode === AppMode.STUDENT_MANAGEMENT ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200' : 'text-slate-500 hover:text-red-600'}`}
                >
                    <Crown size={18} />
                    <span className="hidden md:inline text-red-600">Quản lý HS - VIP</span>
                </button>
                 <button
                    onClick={() => setMode(AppMode.REPORT)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap
                    ${mode === AppMode.REPORT ? 'bg-purple-50 text-purple-600 shadow-sm ring-1 ring-purple-200' : 'text-slate-500 hover:text-purple-600'}`}
                >
                    <FileText size={18} />
                    <span className="hidden md:inline">Báo cáo tổng hợp</span>
                </button>
                <button
                    onClick={() => setMode(AppMode.VIP_UPGRADE)}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap
                    ${mode === AppMode.VIP_UPGRADE ? 'bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-200' : 'bg-amber-50/70 text-amber-700 hover:text-amber-800 hover:bg-amber-100'}`}
                >
                    <Gem size={18} />
                    <span className="hidden md:inline rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                        VIP đã kích hoạt
                    </span>
                </button>
                </nav>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all animate-pulse-slow
                        ${!apiKey 
                            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        title="Cài đặt API Key"
                    >
                        {!apiKey ? <AlertTriangle size={18} /> : <Settings size={18} />}
                        <span className={!apiKey ? "hidden md:inline" : "hidden"}>
                            {!apiKey ? "Lấy API key" : ""}
                        </span>
                    </button>
                    
                    <button 
                        onClick={logout}
                        className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-600 transition"
                        title="Đăng xuất"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {mode === AppMode.STUDENT_MANAGEMENT ? (
            <div className="h-full w-full p-4 lg:p-6 overflow-hidden">
                <StudentManagement />
            </div>
        ) : mode === AppMode.REPORT ? (
             <div className="h-full w-full p-4 lg:p-6 overflow-hidden">
                <ComprehensiveReport />
            </div>
        ) : mode === AppMode.VIP_UPGRADE ? (
            <div className="h-full flex items-center justify-center p-6 overflow-y-auto bg-slate-50/50">
                <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-8 max-w-2xl w-full text-center relative overflow-hidden animate-fade-in-up">
                    {/* Decor */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-purple-500"></div>

                    <div className="mb-6 inline-block p-4 rounded-full bg-blue-50 text-blue-600 shadow-sm ring-4 ring-blue-50">
                        <Gem size={48} />
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Nâng cấp Tài khoản VIP</h2>
                    
                    <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                        Để sử dụng các tính năng ưu việt của mục <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">Quản lý HS - VIP</span> và được cập nhật miễn phí các tính năng khác trong tương lai, 
                        thầy cô vui lòng nâng cấp tài khoản VIP để ủng hộ tác giả.
                    </p>

                    <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 text-left relative shadow-sm">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md tracking-wide">
                            THÔNG TIN CHUYỂN KHOẢN
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-blue-200/50 pb-2">
                                    <span className="text-slate-500 text-sm font-medium">Giá trị</span>
                                    <span className="text-2xl font-extrabold text-blue-700">99.000đ</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-blue-200/50 pb-2">
                                    <span className="text-slate-500 text-sm font-medium">Ngân hàng</span>
                                    <span className="font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-700 rounded-md flex items-center justify-center text-white text-[9px] font-bold">B</div>
                                        BIDV
                                    </span>
                                </div>
                                <div className="flex items-center justify-between border-b border-blue-200/50 pb-2">
                                    <span className="text-slate-500 text-sm font-medium">Số tài khoản</span>
                                    <span className="font-bold text-slate-800 tracking-wider text-lg">8840489907</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-blue-200/50 pb-2">
                                    <span className="text-slate-500 text-sm font-medium">Chủ tài khoản</span>
                                    <span className="font-bold text-slate-800 uppercase text-sm">NGUYỄN VIỆT HÙNG</span>
                                </div>
                                <div className="bg-blue-100/50 p-3 rounded-lg border border-blue-200">
                                    <span className="text-xs text-slate-500 block mb-1 font-semibold uppercase">Nội dung chuyển khoản</span>
                                    <div className="font-mono text-sm font-bold text-blue-900">SĐT thầy cô + GVCN</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                {/* QR payment image */}
                                <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-inner border border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer" title="Quét mã để thanh toán">
                                    <img 
                                        src="https://img.vietqr.io/image/BIDV-8840489907-compact2.jpg?amount=&addInfo=&accountName=NGUYEN%20VIET%20HUNG"
                                        alt="QR Code BIDV"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null; 
                                            // Fallback
                                            e.currentTarget.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=8840489907'; 
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-3 italic flex items-center gap-1">
                                    <CheckCircle size={12} className="text-green-500"/>
                                    Quét mã QR để chuyển nhanh
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm font-medium text-slate-600 bg-yellow-50 border border-yellow-100 p-4 rounded-xl inline-block">
                        <p className="mb-1 flex items-center justify-center gap-2">
                            <AlertTriangle size={16} className="text-yellow-600"/> 
                            ƯU ĐÃI ĐẾN HẾT <span className="text-red-600 font-bold">1/1/2026</span>
                        </p>
                        <p className="opacity-80 text-xs">Sau 1/1/2026 - NÂNG VIP LÀ <span className="font-bold text-slate-800">99.000đ</span></p>
                    </div>
                </div>
            </div>
        ) : (
            <div className="h-full w-full grid grid-cols-12 gap-0">
            
            {/* Left Column */}
            <div className="col-span-12 lg:col-span-6 h-full overflow-y-auto border-r border-teal-100 bg-white/50 p-6 scrollbar-thin scrollbar-thumb-teal-200">
                <div className="max-w-xl mx-auto space-y-6">
                    <div className="prose prose-sm text-slate-500 mb-2">
                        <p className="text-teal-800/70 font-medium">
                            {mode === AppMode.SINGLE && "Nhập thông tin chi tiết về học sinh, chọn giọng văn phù hợp để tạo email cá nhân hóa."}
                            {mode === AppMode.BATCH && "Tải lên bảng điểm (Excel, PDF) để AI tự động phân tích và viết nhận xét cho cả lớp."}
                            {mode === AppMode.ZALO && "Soạn tin nhắn thông báo nhanh, ngắn gọn và đẹp mắt cho nhóm Zalo phụ huynh."}
                        </p>
                    </div>

                    {mode === AppMode.SINGLE && (
                        <SingleStudentForm onGenerate={handleSingleGenerate} isLoading={loading} />
                    )}
                    {mode === AppMode.BATCH && (
                        <BatchUpload onBatchComplete={handleBatchComplete} />
                    )}
                    {mode === AppMode.ZALO && (
                        <ZaloGroupForm onGenerate={handleZaloGenerate} isLoading={loading} />
                    )}

                    {/* Footer Info */}
                    <div className="mt-8 pt-6 border-t border-teal-200/60">
                        <div className="bg-gradient-to-br from-white to-teal-50 rounded-xl p-5 border border-teal-100 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500"></div>
                            <p className="text-xs font-bold text-red-500 mb-2 tracking-wide uppercase flex items-center justify-center gap-1">
                                <AlertTriangle size={12} />
                                PHIÊN BẢN THỬ NGHIỆM ĐẾN HẾT 25/5/2026
                            </p>
                            <p className="text-sm text-slate-700 font-medium mb-4">
                                Mọi thông tin chi tiết liên hệ thầy <span className="font-bold text-teal-700 text-base">Nguyễn Việt Hùng</span>
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <a 
                                    href="https://www.facebook.com/viethungnvmt/" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition w-full sm:w-auto justify-center shadow-sm shadow-blue-200"
                                >
                                    <Facebook size={16} /> Facebook
                                </a>
                                <a
                                    href="https://zalo.me/0363831337"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:border-green-300 hover:bg-green-50 transition w-full sm:w-auto justify-center shadow-sm"
                                >
                                    <Phone size={16} className="text-green-600"/> Zalo: 036.38.31.337
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="col-span-12 lg:col-span-6 h-full bg-slate-50/30 p-6 overflow-hidden flex flex-col relative">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative h-full flex flex-col z-0">
                    {(currentEmail || loading) ? (
                        <div className="h-full flex flex-col space-y-4">
                            {mode === AppMode.BATCH && currentEmail && (
                                <div className="flex-none flex items-center gap-2 text-sm text-teal-700 bg-teal-100/50 px-4 py-2 rounded-lg border border-teal-200/50 backdrop-blur-sm w-fit">
                                    <Users size={16} />
                                    <span>Đang hiển thị mẫu nhận xét đầu tiên</span>
                                </div>
                            )}
                            <div className="flex-1 overflow-hidden">
                                <EmailResult 
                                    emailData={currentEmail} 
                                    onReset={() => setCurrentEmail(null)} 
                                    mode={mode}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                            {mode === AppMode.BATCH ? (
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white shadow-xl shadow-teal-100/50 max-w-lg text-left">
                                    <h3 className="font-bold text-teal-800 text-lg mb-4 flex items-center gap-2">
                                        <FileSpreadsheetIcon /> Hướng dẫn tải lên
                                    </h3>
                                    <p className="text-teal-700 mb-6 leading-relaxed text-sm">
                                        Hệ thống hỗ trợ file Excel (.xlsx), PDF hoặc Word. AI sẽ tự động đọc bảng điểm để tạo nhận xét.
                                    </p>
                                    <ul className="space-y-3 text-slate-600 text-sm">
                                        <li className="flex items-center gap-3">
                                            <span className="w-24 font-mono text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded text-center">Excel</span>
                                            <span>File chứa cột Tên và các cột điểm số.</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-24 font-mono text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-center">PDF</span>
                                            <span>Chụp ảnh/Scan bảng điểm hoặc file PDF xuất từ phần mềm quản lý.</span>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-teal-200/50 rounded-2xl bg-white/40 p-12 max-w-md">
                                    <div className={`w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm mx-auto ${mode === AppMode.ZALO ? 'text-blue-400' : 'text-teal-200'}`}>
                                        {mode === AppMode.ZALO ? <MessageCircle size={40} /> : <GraduationCap size={40} />}
                                    </div>
                                    <h3 className="text-teal-900 font-semibold text-xl mb-2">Không gian làm việc</h3>
                                    <p className="text-teal-600/70">
                                        {mode === AppMode.ZALO 
                                            ? "Nhập nội dung thông báo bên trái để tạo tin nhắn Zalo chuyên nghiệp."
                                            : "Hãy nhập thông tin học sinh ở cột bên trái và nhấn 'Tạo Email' để xem kết quả."
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>
        )}
      </main>
      <script src="https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js"></script>
    </div>
  );
};

const MainLayout: React.FC = () => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return (
        <ApiKeyProvider>
            <AppContent />
        </ApiKeyProvider>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    )
}

const FileSpreadsheetIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>
)

export default App;
