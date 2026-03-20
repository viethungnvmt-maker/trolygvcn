import React, { useState, useEffect } from 'react';
import { ZaloConfig, ZaloTopic } from '../types';
import { MessageCircle, Send, School, Eraser, Sparkles, Wand2 } from 'lucide-react';
import { generateZaloTemplate } from '../services/geminiService';
import { useApiKey } from '../contexts/ApiKeyContext';

interface ZaloGroupFormProps {
  onGenerate: (config: ZaloConfig) => void;
  isLoading: boolean;
}

// Templates based on the provided PDF structure
const TEMPLATES: Partial<Record<ZaloTopic, string>> = {
  // --- Mầm Non ---
  health_menu: `🍎 Thực đơn hôm nay:
- Sáng: [Món ăn]
- Trưa: [Món ăn]
- Xế: [Món ăn]

💊 Lưu ý sức khỏe:
- Tình trạng: [Sốt/Ho/Bình thường]
- Thuốc cần uống (nếu có):`,

  learning_activity: `📚 Chủ đề hoạt động: [Tên chủ đề]
- Hoạt động chính: [Mô tả ngắn]
- Kỹ năng rèn luyện: [Vận động/Ngôn ngữ/...]
- Nhận xét bé hôm nay: [Ngoan/Vui vẻ/...]`,

  pickup: `⏰ Thông báo giờ đón/trả trẻ:
- Thời gian: [Giờ cụ thể]
- Địa điểm: [Tại lớp/Sân trường]
- Người đón dự kiến: [Bố/Mẹ/Ông/Bà]
⚠️ Lưu ý: Phụ huynh vui lòng đón đúng giờ.`,

  // --- Tiểu Học ---
  homework: `📝 Bài tập về nhà ngày [Ngày/Tháng]:
1. Toán: [Bài tập/Trang]
2. Tiếng Việt: [Bài tập/Trang]
3. Môn khác: [Nội dung]

⏰ Hạn nộp: [Sáng mai/Thứ Hai tới]
✍️ Yêu cầu: Phụ huynh kiểm tra và ký tên vào vở.`,

  results: `📊 Báo cáo kết quả tuần/tháng [Thời gian]:
- Toán: [Điểm/Nhận xét]
- Tiếng Việt: [Điểm/Nhận xét]
- Rèn luyện: [Tốt/Cần cố gắng]
🌟 Lời khen: [Điểm mạnh của con]`,

  safety_behavior: `⚠️ Thông báo về An toàn & Hành vi:
- Vấn đề ghi nhận: [Mô tả tình huống/Hành vi]
- Thời gian xảy ra: [Giờ ra chơi/Trong giờ học]
- Hướng xử lý của cô: [Đã nhắc nhở/Đã phạt nhẹ]
🤝 Nhờ phụ huynh: [Trò chuyện thêm với con ở nhà]`,

  // --- THCS ---
  exam_study: `📝 Thông báo Kiểm tra/Thi:
- Môn: [Tên môn]
- Hình thức: [Tự luận/Trắc nghiệm]
- Thời gian: [Ngày, Giờ/Tiết mấy]
- Nội dung ôn tập: [Chương mấy/Bài nào]
🎒 Dụng cụ cần mang: [Máy tính/Atlat/...]`,

  discipline_reward: `⚖️ Thông báo Kỷ luật/Khen thưởng:
- Học sinh: [Tên học sinh - nếu cần]
- Lý do: [Mô tả hành vi/Thành tích]
- Hình thức: [Phê bình/Tuyên dương]
- Đề nghị gia đình: [Phối hợp nhắc nhở/Khích lệ]`,

  career_orientation: `🧭 Hoạt động Hướng nghiệp:
- Chủ đề: [Tên ngành/Trường]
- Diễn giả: [Tên/Chức danh]
- Thời gian: [Ngày, Giờ]
- Địa điểm: [Hội trường/Lớp]`,

  // --- THPT ---
  university_exam: `🎓 Thông tin Thi Đại học/Tuyển sinh:
- Kỳ thi: [Thi thử/ĐGNL/Tốt nghiệp]
- Thời gian: [Ngày diễn ra]
- Địa điểm thi: [Tại trường/...]
- Hồ sơ cần nộp: [Giấy tờ 1, Giấy tờ 2]
🔗 Link đăng ký (nếu có):`,

  student_excellence: `🏅 Đội tuyển Học sinh giỏi:
- Môn thi: [Tên môn]
- Danh sách tham gia: [Các em được chọn]
- Lịch bồi dưỡng: [Thứ mấy, Giờ nào]
- Tài liệu: [Đã phát/File đính kèm]`,

  graduation: `🎓 Thông báo Lễ Tốt Nghiệp/Kỷ Yếu:
- Thời gian: [Ngày, Giờ]
- Địa điểm: [Sân trường/Hội trường]
- Trang phục (Dress code): [Áo dài/Vest/Đồng phục]
- Chi phí dự kiến: [Số tiền]`,

  // --- Chung ---
  general: `📢 Thông báo chung:
- Nội dung: [Nhập nội dung thông báo]
- Thời gian áp dụng: [Từ ngày...]
- Yêu cầu: [Phụ huynh nắm thông tin]`,

  meeting: `🤝 Mời họp Phụ huynh [Đầu năm/Cuối kỳ]:
- Thời gian: [Giờ, Ngày/Tháng/Năm]
- Địa điểm: [Phòng học lớp...]
- Nội dung chính: [Báo cáo học tập/Thu chi/...]
⚠️ Yêu cầu: Kính mong Quý phụ huynh tham dự đầy đủ.`,

  fee: `💰 Thông báo Thu Chi:
- Khoản thu: [Học phí/Quỹ lớp/Đồng phục]
- Số tiền: [XXX.000 VNĐ]
- Hạn nộp: [Trước ngày...]
- Hình thức: [Tiền mặt/Chuyển khoản STK...]`,

  event: `🎉 Thông báo Sự kiện/Lễ hội [Tên sự kiện]:
- Thời gian: [Giờ, Ngày]
- Địa điểm: [Sân trường/...]
- Trang phục: [Đồng phục/Tự chọn]
- Cần chuẩn bị: [Đồ ăn nhẹ/Dụng cụ/...]`,

  holiday: `🏖️ Thông báo Nghỉ Lễ/Tết:
- Dịp lễ: [Tên ngày lễ]
- Thời gian nghỉ: [Từ ngày... đến hết ngày...]
- Ngày đi học lại: [Thứ..., Ngày...]
❤️ Chúc quý phụ huynh và các con kỳ nghỉ vui vẻ!`,

  photo_video: `📸 Chia sẻ Khoảnh khắc:
- Hoạt động: [Dã ngoại/Trung thu/...]
- Link ảnh/Video: [Google Drive/Youtube...]
❤️ Mời bố mẹ vào xem các con rất đáng yêu ạ!`,
  
  emergency: `⚠️ THÔNG BÁO KHẨN (Bão/Lũ/Dịch bệnh):
- Tình huống: [Mô tả ngắn]
- Chỉ đạo nhà trường: [Cho học sinh nghỉ học/...]
- Thời gian áp dụng: [Ngay lập tức/Từ ngày mai]
📞 Hotline liên hệ: [SĐT Giáo viên]`,
  
  timetable: `📅 Thời khóa biểu mới:
- Áp dụng từ: [Ngày/Tháng]
- Thay đổi chính: [Sáng thứ 2 học..., Chiều thứ 4 nghỉ...]
- Lưu ý: Nhắc con mang đúng sách vở.`,
  
  labor: `🧹 Lịch Lao động/Vệ sinh lớp:
- Thời gian: [Giờ, Ngày]
- Thành phần: [Tổ 1/Tổ 2/Toàn lớp]
- Dụng cụ cần mang: [Chổi/Khăn lau/...]`,
  
  violation: `⚠️ Nhắc nhở nề nếp:
- Vấn đề: [Đi học muộn/Quên khăn quàng/...]
- Số lượng học sinh vi phạm: [Nhiều/Ít]
- Đề nghị: Phụ huynh nhắc nhở con thực hiện đúng nội quy.`
};

const ZaloGroupForm: React.FC<ZaloGroupFormProps> = ({ onGenerate, isLoading }) => {
  const { apiKey, selectedModel, setIsSettingsOpen } = useApiKey();
  const [config, setConfig] = useState<ZaloConfig>({
    topic: 'general',
    details: TEMPLATES['general'] || '',
    grade: '',
    className: '',
  });

  const [availableTopics, setAvailableTopics] = useState<{value: ZaloTopic, label: string}[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  useEffect(() => {
    const getTopics = () => {
        const commonTopics: {value: ZaloTopic, label: string}[] = [
            { value: 'general', label: '📢 Thông báo chung' },
            { value: 'meeting', label: '🤝 Họp phụ huynh' },
            { value: 'holiday', label: '🏖️ Lịch nghỉ học/Lễ tết' },
            { value: 'fee', label: '💰 Thông báo Thu Chi' },
            { value: 'event', label: '🎉 Sự kiện/Lễ hội' },
            { value: 'photo_video', label: '📸 Chia sẻ Ảnh/Video' },
            { value: 'congratulation', label: '🏆 Chúc mừng' },
            { value: 'emergency', label: '⚠️ Khẩn cấp/Thời tiết' },
        ];

        let levelTopics: {value: ZaloTopic, label: string}[] = [];

        const g = config.grade;
        
        if (g === 'MamNon') {
            levelTopics = [
                { value: 'health_menu', label: '🍎 Ăn uống & Sức khỏe' },
                { value: 'learning_activity', label: '🎨 Hoạt động học tập' },
                { value: 'pickup', label: '🏠 Gửi/Đón trẻ' },
            ];
        } else if (g) {
            const gradeNum = parseInt(g);
            if (gradeNum >= 1 && gradeNum <= 5) { // Primary
                levelTopics = [
                    { value: 'homework', label: '📚 Bài tập về nhà' },
                    { value: 'results', label: '📊 Kết quả học tập' },
                    { value: 'extracurricular', label: '⚽ Hoạt động ngoại khóa' },
                    { value: 'safety_behavior', label: '⚠️ An toàn & Hành vi' },
                    { value: 'health', label: '💊 Sức khỏe' },
                ];
            } else if (gradeNum >= 6 && gradeNum <= 9) { // Secondary
                levelTopics = [
                    { value: 'exam_study', label: '📝 Học tập & Thi cử' },
                    { value: 'career_orientation', label: '🧭 Hướng nghiệp' },
                    { value: 'union_team', label: '🚩 Hoạt động Đoàn Đội' },
                    { value: 'discipline_reward', label: '⚖️ Kỷ luật & Khen thưởng' },
                ];
            } else if (gradeNum >= 10 && gradeNum <= 12) { // High School
                levelTopics = [
                    { value: 'university_exam', label: '🎓 Thi ĐH & Định hướng' },
                    { value: 'results_detail', label: '📈 Kết quả chi tiết' },
                    { value: 'student_excellence', label: '🏅 Thi HSG' },
                    { value: 'soft_skills', label: '💼 Kỹ năng mềm' },
                    { value: 'graduation', label: '🎓 Tốt nghiệp' },
                ];
            }
        }

        if (g && g !== 'MamNon') {
             commonTopics.push({ value: 'timetable', label: '📅 Thời khóa biểu' });
             commonTopics.push({ value: 'labor', label: '🧹 Lao động/Vệ sinh' });
             commonTopics.push({ value: 'violation', label: '⚠️ Vi phạm/Nhắc nhở' });
        }

        const finalTopics = [...levelTopics, ...commonTopics];
        finalTopics.push({ value: 'other', label: '✨ Thông báo khác...' });

        return finalTopics;
    };

    setAvailableTopics(getTopics());
  }, [config.grade]);


  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'topic') {
        const topicValue = value as ZaloTopic;
        if (topicValue === 'other') {
            setConfig(prev => ({ ...prev, topic: topicValue, details: '' }));
        } else {
            const template = TEMPLATES[topicValue] || '';
            setConfig(prev => ({ 
                ...prev, 
                topic: topicValue,
                details: template 
            }));
        }
    } else {
        setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClearDetails = () => {
      setConfig(prev => ({ ...prev, details: '' }));
  }

  const handleGenerateTemplate = async () => {
      if (!apiKey) {
          setIsSettingsOpen(true);
          return;
      }
      if (!customTopic.trim()) return;
      setIsGeneratingTemplate(true);
      try {
          const template = await generateZaloTemplate(customTopic, apiKey, selectedModel);
          setConfig(prev => ({ ...prev, details: template }));
      } catch (error) {
          console.error(error);
          alert("Lỗi khi tạo mẫu. Vui lòng thử lại.");
      } finally {
          setIsGeneratingTemplate(false);
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
        setIsSettingsOpen(true);
        return;
    }
    onGenerate(config);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-teal-100/50">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
        <div className="p-2 bg-blue-500 rounded-lg text-white shadow-blue-200 shadow-md">
          <MessageCircle size={20} />
        </div>
        <div>
            <h2 className="text-lg font-bold text-slate-800">Soạn tin nhắn Zalo Lớp</h2>
            <p className="text-xs text-slate-400">Gửi thông báo nhanh cho toàn thể phụ huynh</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Class Selection */}
        <div className="space-y-1">
             <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <School size={16} className="text-blue-600"/>
                Thông tin lớp học
            </label>
            <div className="grid grid-cols-2 gap-4">
                <div>
                     <select
                        name="grade"
                        value={config.grade}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                     >
                        <option value="">-- Chọn Cấp/Khối --</option>
                        <option value="MamNon">Mầm Non (3-5 tuổi)</option>
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
                        value={config.className}
                        onChange={handleChange}
                        placeholder="Tên lớp (VD: Chồi 1, 10A1)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                </div>
            </div>
        </div>

        <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Loại thông báo</label>
            <div className="relative">
                <select 
                    name="topic" 
                    value={config.topic}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                >
                    {availableTopics.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Custom Topic Input Section */}
        {config.topic === 'other' && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl space-y-3 animate-fade-in-up">
                <div className="flex items-center gap-2 text-blue-800 text-sm font-semibold">
                    <Sparkles size={16} className="text-yellow-500" />
                    <span>Tạo mẫu nội dung bằng AI</span>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="Nhập chủ đề bạn muốn thông báo (VD: Nhắc đóng quỹ, Kế hoạch cắm trại...)"
                        className="flex-1 px-4 py-2.5 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        type="button"
                        onClick={handleGenerateTemplate}
                        disabled={!customTopic.trim() || isGeneratingTemplate}
                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm
                        ${(!customTopic.trim() || isGeneratingTemplate) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isGeneratingTemplate ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Wand2 size={16} />
                        )}
                        {isGeneratingTemplate ? 'Đang tạo...' : 'Tạo mẫu'}
                    </button>
                </div>
            </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-end">
            <label className="block text-sm font-medium text-slate-700">Nội dung chi tiết</label>
            <button 
                type="button" 
                onClick={handleClearDetails}
                className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition"
            >
                <Eraser size={12} /> Xóa trắng
            </button>
          </div>
          <textarea
            name="details"
            value={config.details}
            onChange={handleChange}
            rows={8}
            required
            placeholder={config.topic === 'other' 
                ? "Nhập nội dung chi tiết hoặc sử dụng AI để tạo mẫu ở trên..." 
                : "Chọn loại thông báo để xem mẫu gợi ý..."}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono text-sm leading-relaxed"
          />
           <p className="text-xs text-slate-500 text-right italic mt-1">
               💡 Mẹo: Bạn chỉ cần điền vào các phần trong ngoặc vuông [], AI sẽ lo phần còn lại.
           </p>
        </div>

        <div className="pt-2">
            <button
            type="submit"
            disabled={isLoading || !config.details}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white font-bold tracking-wide transition-all shadow-md hover:shadow-lg
                ${isLoading || !config.details
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                }`}
            >
            {isLoading ? (
                <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Đang viết tin nhắn...
                </span>
            ) : (
                <>
                <Send size={18} />
                <span>TẠO TIN NHẮN ZALO</span>
                </>
            )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ZaloGroupForm;