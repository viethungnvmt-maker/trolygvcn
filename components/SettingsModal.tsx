import React, { useState, useEffect } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { AVAILABLE_MODELS, AIModelId } from '../types';
import { X, Key, Check, AlertTriangle, ExternalLink, Settings } from 'lucide-react';

const SettingsModal: React.FC = () => {
  const { apiKey, setApiKey, selectedModel, setSelectedModel, isSettingsOpen, setIsSettingsOpen } = useApiKey();
  const [inputKey, setInputKey] = useState('');
  const [tempModel, setTempModel] = useState<AIModelId>('gemini-3-flash-preview');

  useEffect(() => {
    if (isSettingsOpen) {
      setInputKey(apiKey);
      setTempModel(selectedModel);
    }
  }, [isSettingsOpen, apiKey, selectedModel]);

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    if (!inputKey.trim()) {
        alert("Vui lòng nhập API Key để tiếp tục!");
        return;
    }
    setApiKey(inputKey.trim());
    setSelectedModel(tempModel);
    setIsSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-teal-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex justify-between items-center flex-none">
          <div className="flex items-center gap-2 text-white">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-bold">Cài đặt hệ thống</h2>
          </div>
          {apiKey && (
            <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition"
            >
                <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
            
            {/* API Key Section */}
            <div className="mb-8">
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    1. Google Gemini API Key <span className="text-red-500">*</span>
                </label>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-3">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-blue-600" />
                        <span>
                            Để ứng dụng hoạt động, bạn cần có API Key riêng. 
                            <a 
                                href="https://aistudio.google.com/api-keys" 
                                target="_blank" 
                                rel="noreferrer"
                                className="font-bold underline ml-1 hover:text-blue-900"
                            >
                                Lấy key tại đây (Miễn phí)
                            </a>
                        </span>
                    </p>
                    <div className="mt-2 text-xs text-blue-600/80 pl-7">
                       Hoặc xem hướng dẫn chi tiết: <a href="https://tinyurl.com/hdsdpmTHT" target="_blank" rel="noreferrer" className="underline font-bold hover:text-blue-800">Tại đây</a>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="password"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="Dán API Key của bạn vào đây (bắt đầu bằng AIza...)"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition text-slate-800 font-mono"
                    />
                </div>
            </div>

            {/* Model Selection Section */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                    2. Chọn Model xử lý AI
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_MODELS.map((model) => (
                        <div 
                            key={model.id}
                            onClick={() => setTempModel(model.id)}
                            className={`cursor-pointer border rounded-xl p-4 transition-all relative flex flex-col gap-1
                                ${tempModel === model.id 
                                    ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`font-bold text-sm ${tempModel === model.id ? 'text-teal-900' : 'text-slate-700'}`}>
                                    {model.name}
                                </span>
                                {tempModel === model.id && <Check className="w-5 h-5 text-teal-600" />}
                            </div>
                            <p className="text-xs text-slate-500">{model.description}</p>
                            
                            {/* Fallback indicator for default model */}
                            {model.id === 'gemini-3-flash-preview' && (
                                <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                                    Default
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-400 mt-3 italic">
                    * Hệ thống sẽ tự động chuyển đổi sang các model khác (Fallback) nếu model được chọn gặp lỗi hoặc quá tải.
                </p>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-none">
            {apiKey && (
                <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-white transition"
                >
                    Đóng
                </button>
            )}
            <button 
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 active:scale-[0.98] transition shadow-md shadow-teal-200"
            >
                Lưu cài đặt
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;