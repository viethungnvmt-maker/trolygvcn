import React, { useState } from 'react';
import { Student, GenerationConfig } from '../types';
import { Sparkles, Send, SlidersHorizontal, Calculator, School, Check } from 'lucide-react';
import { useApiKey } from '../contexts/ApiKeyContext';

interface SingleStudentFormProps {
  onGenerate: (student: Student, config: GenerationConfig) => void;
  isLoading: boolean;
}

const SingleStudentForm: React.FC<SingleStudentFormProps> = ({ onGenerate, isLoading }) => {
  const { apiKey, setIsSettingsOpen } = useApiKey();
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    name: '',
    parentName: '',
    score: '',
    behavior: '',
    progress: '',
    examType: '',
    grade: '',
    className: '',
  });

  const [config, setConfig] = useState<GenerationConfig>({
    tone: 'friendly',
    scenario: 'general',
    customScenario: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
        setIsSettingsOpen(true);
        return;
    }
    onGenerate({
      id: Date.now().toString(),
      ...formData,
    }, config);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-teal-100/50">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
          <Sparkles size={20} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Nhập thông tin học sinh</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Configuration Section */}
        <div className="bg-teal-50/50 p-5 rounded-xl border border-teal-100">
            <div className="flex items-center gap-2 mb-4 text-teal-800 font-semibold text-sm">
                <SlidersHorizontal size={16} />
                <span>Cấu hình Email</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-teal-700/70 uppercase tracking-wide">Giọng văn</label>
                    <div className="relative">
                        <select 
                            name="tone" 
                            value={config.tone}
                            onChange={handleConfigChange}
                            className="w-full pl-3 pr-10 py-2.5 bg-white border border-teal-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none transition-shadow shadow-sm"
                        >
                            <option value="friendly">Thân mật & Ấm áp</option>
                            <option value="professional">Chuyên nghiệp & Trang trọng</option>
                            <option value="cheerful">Vui vẻ & Hào hứng</option>
                            <option value="encouraging">Khích lệ & Động viên</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-teal-700/70 uppercase tracking-wide">Loại Email</label>
                    <div className="relative">
                        <select 
                            name="scenario" 
                            value={config.scenario}
                            onChange={handleConfigChange}
                            className="w-full pl-3 pr-10 py-2.5 bg-white border border-teal-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none appearance-none transition-shadow shadow-sm"
                        >
                            <option value="general">Tổng hợp tình hình</option>
                            <option value="achievement">Khen ngợi thành tích</option>
                            <option value="homework">Nhắc nhở bài tập</option>
                            <option value="meeting">Mời họp phụ huynh</option>
                            <option value="event">Thông báo sự kiện</option>
                            <option value="other">📝 Nội dung khác (Tự nhập)</option>
                        </select>
                    </div>
                    {/* Custom Scenario Input */}
                    {config.scenario === 'other' && (
                        <div className="mt-3 animate-fade-in-up">
                            <label className="text-xs font-bold text-teal-700/70 uppercase tracking-wide block mb-1">Nội dung tùy chỉnh</label>
                            <div className="flex gap-2">
                                <input
                                    name="customScenario"
                                    value={config.customScenario || ''}
                                    onChange={handleConfigChange}
                                    placeholder="VD: Nhắc nhở nộp học phí, thông báo nghỉ ốm,..."
                                    className="flex-1 px-3 py-2 bg-white border border-teal-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                />
                                <div className="bg-teal-600 text-white p-2 rounded-lg flex items-center justify-center shadow-sm" title="Đã xác nhận">
                                    <Check size={16} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* School Info Section */}
        <div className="space-y-1">
             <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <School size={16} className="text-teal-600"/>
                Thông tin lớp học
            </label>
            <div className="grid grid-cols-2 gap-4">
                <div>
                     <select
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition"
                     >
                        <option value="">-- Chọn Khối --</option>
                        <optgroup label="Tiểu học">
                            <option value="1">Khối 1</option>
                            <option value="2">Khối 2</option>
                            <option value="3">Khối 3</option>
                            <option value="4">Khối 4</option>
                            <option value="5">Khối 5</option>
                        </optgroup>
                        <optgroup label="THCS">
                            <option value="6">Khối 6</option>
                            <option value="7">Khối 7</option>
                            <option value="8">Khối 8</option>
                            <option value="9">Khối 9</option>
                        </optgroup>
                        <optgroup label="THPT">
                            <option value="10">Khối 10</option>
                            <option value="11">Khối 11</option>
                            <option value="12">Khối 12</option>
                        </optgroup>
                     </select>
                </div>
                <div>
                    <input
                        name="className"
                        value={formData.className}
                        onChange={handleChange}
                        placeholder="Tên lớp (VD: 5A, 9B)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                    />
                </div>
            </div>
        </div>

        {/* Basic Info Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Tên học sinh <span className="text-red-500">*</span></label>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Tên phụ huynh</label>
            <input
              name="parentName"
              value={formData.parentName}
              onChange={handleChange}
              placeholder="Anh Nam / Chị Hoa"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>
        </div>

        {/* Score Section */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
             <Calculator size={16} className="text-teal-600"/>
             Kết quả học tập
          </label>
          <div className="flex flex-col md:flex-row gap-3">
              <div className="w-full md:w-1/3">
                  <select
                    name="examType"
                    value={formData.examType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition"
                  >
                      <option value="">-- Chọn kỳ thi (Nếu có) --</option>
                      <option value="Khảo sát chất lượng">Điểm Khảo sát</option>
                      <option value="Giữa kỳ 1">Điểm Giữa kỳ 1</option>
                      <option value="Cuối kỳ 1">Điểm Cuối kỳ 1</option>
                      <option value="Giữa kỳ 2">Điểm Giữa kỳ 2</option>
                      <option value="Cuối kỳ 2">Điểm Cuối kỳ 2</option>
                      <option value="Thường xuyên">Điểm Thường xuyên</option>
                  </select>
              </div>
              <div className="w-full md:w-2/3">
                <input
                    name="score"
                    value={formData.score}
                    onChange={handleChange}
                    placeholder="Nhập điểm: Toán 9, Văn 8, Anh 7.5..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Hành vi & Thái độ</label>
          <textarea
            name="behavior"
            value={formData.behavior}
            onChange={handleChange}
            rows={2}
            placeholder="Ví dụ: Ngoan, lễ phép, đôi khi còn mất tập trung..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Sự tiến bộ & Ghi chú</label>
          <textarea
            name="progress"
            value={formData.progress}
            onChange={handleChange}
            rows={2}
            placeholder="Ví dụ: Đã chủ động phát biểu hơn so với tháng trước..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
          />
        </div>

        <div className="pt-2">
            <button
            type="submit"
            disabled={isLoading || !formData.name}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-bold tracking-wide transition-all shadow-md hover:shadow-lg
                ${isLoading || !formData.name
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 active:scale-[0.98]'
                }`}
            >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang soạn thảo...
                </span>
            ) : (
                <>
                <Send size={18} />
                <span>TẠO EMAIL</span>
                </>
            )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default SingleStudentForm;
