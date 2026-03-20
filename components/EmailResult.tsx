import React, { useState } from 'react';
import { GeneratedEmail, AppMode } from '../types';
import { Copy, CheckCircle, RefreshCcw, Mail, Save, FileSpreadsheet, PlusCircle, MessageCircle, FileText } from 'lucide-react';
import { exportZaloToDocx } from '../services/geminiService';

interface EmailResultProps {
  emailData: GeneratedEmail | null;
  onReset: () => void;
  mode: AppMode;
}

const EmailResult: React.FC<EmailResultProps> = ({ emailData, onReset, mode }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!emailData) return null;

  const isZalo = mode === AppMode.ZALO;

  const handleCopy = () => {
    // For Zalo, we usually just want the Subject (Title) + Body combined, or just Body if Subject is redundant
    // But AI returns Subject as "HEADER" for Zalo.
    const fullText = isZalo 
        ? `${emailData.subject}\n\n${emailData.body}` 
        : `Chủ đề: ${emailData.subject}\n\n${emailData.body}`;
        
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDownloadZaloWord = () => {
      exportZaloToDocx(emailData.subject, emailData.body);
  };

  const handleSendNow = () => {
      if (isZalo) {
          // Open Zalo web maybe? Or just generic share. Zalo doesn't have a direct mailto equivalent standard.
          // Opening Zalo Web is tricky without deep links, usually users copy paste.
          // We'll keep it simple or redirect to Zalo Web home.
          window.open('https://chat.zalo.me/', '_blank');
      } else {
        const subject = encodeURIComponent(emailData.subject);
        const body = encodeURIComponent(emailData.body);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-white flex flex-col h-full overflow-hidden animate-fade-in-up 
        ${isZalo ? 'shadow-blue-900/5' : 'shadow-teal-900/5'}`}>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center flex-none">
        <div>
            <h3 className={`font-bold text-lg ${isZalo ? 'text-blue-900' : 'text-teal-900'}`}>
                {isZalo ? 'Tin nhắn Zalo Đề Xuất' : 'Email Đề Xuất'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Được soạn thảo bởi Teacher's Heart</p>
        </div>
        <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all
            ${copied 
                ? 'bg-green-100 text-green-700 ring-1 ring-green-200' 
                : isZalo 
                    ? 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 ring-1 ring-slate-200 hover:ring-blue-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700 ring-1 ring-slate-200 hover:ring-teal-200'
            }`}
        >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP'}
        </button>
      </div>

      {/* Body Content - Scrollable */}
      <div className="p-8 flex-grow overflow-y-auto bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* For Zalo, the "Subject" is really the bold header inside the message, so we display it differently or just combine */}
        <div className={`mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm ${isZalo ? 'bg-blue-50/30 border-blue-100' : ''}`}>
          <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${isZalo ? 'text-blue-600/70' : 'text-teal-600/70'}`}>
             {isZalo ? 'Tiêu đề tin nhắn' : 'Chủ đề'}
          </span>
          <p className="text-lg font-bold text-slate-800">{emailData.subject}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm min-h-[300px]">
          <span className={`text-xs font-bold uppercase tracking-widest block mb-4 ${isZalo ? 'text-blue-600/70' : 'text-teal-600/70'}`}>
            Nội dung
          </span>
          <div className="prose prose-slate prose-lg max-w-none text-slate-600 whitespace-pre-line leading-relaxed font-normal">
            {emailData.body}
          </div>
        </div>
      </div>

      {/* Footer / Next Actions */}
      <div className="bg-white p-5 border-t border-slate-100 flex-none z-10">
        <div className="flex items-center gap-3 justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden xl:block">Hành động tiếp theo</h4>
            <div className="flex gap-3 w-full xl:w-auto">
                <button 
                    onClick={handleSendNow}
                    className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-semibold transition shadow-sm hover:shadow-md
                    ${isZalo ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                >
                    {isZalo ? <MessageCircle size={16} /> : <Mail size={16} />}
                    {isZalo ? 'Mở Zalo' : 'Gửi ngay'}
                </button>

                {/* Conditional Button: Download Word for Zalo, Save Draft for others */}
                {isZalo ? (
                    <button 
                        onClick={handleDownloadZaloWord}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
                    >
                        <FileText size={16} />
                        Tải Word
                    </button>
                ) : (
                    <button 
                        onClick={handleSaveDraft}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
                    >
                        {saved ? <CheckCircle size={16} className="text-green-600"/> : <Save size={16} />}
                        {saved ? "Đã lưu!" : "Lưu nháp"}
                    </button>
                )}
                
                <button 
                    onClick={onReset}
                    className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition"
                >
                    <PlusCircle size={16} />
                    {isZalo ? 'Soạn tin mới' : 'Soạn mới'}
                </button>

                {mode === AppMode.BATCH && (
                    <button 
                        onClick={() => {}} 
                        className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
                    >
                        <FileSpreadsheet size={16} />
                        Excel
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default EmailResult;