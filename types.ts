
export interface Student {
  id: string;
  name: string;
  parentName?: string;
  score?: string | number;
  behavior?: string;
  progress?: string;
  notes?: string;
  examType?: string;
  grade?: string; // e.g., "1", "6", "10"
  className?: string; // e.g., "5A", "10A1"
  // Detailed scores for Report Generation
  detailedScores?: { [subject: string]: number | string };
  dob?: string; // Date of birth
  
  // New fields for Comprehensive Report
  averageScore?: number; // Điểm trung bình
  conduct?: string; // Hạnh kiểm (Tốt, Khá, TB...)
  absenceCount?: number; // Số ngày nghỉ
  violationCount?: number; // Số lỗi vi phạm
  achievements?: string[]; // Thành tích/Khen thưởng
}

export interface SavedClass {
    id: string;
    name: string;
    students: Student[];
    analysisResults: Record<string, string>;
    createdAt: number;
}

export interface GeneratedEmail {
  studentId?: string;
  subject: string;
  body: string;
}

export enum AppMode {
  SINGLE = 'SINGLE',
  BATCH = 'BATCH',
  ZALO = 'ZALO',
  STUDENT_MANAGEMENT = 'STUDENT_MANAGEMENT',
  VIP_UPGRADE = 'VIP_UPGRADE',
  REPORT = 'REPORT', // New mode
}

export type ProcessingStatus = 'idle' | 'loading' | 'success' | 'error';

export type EmailTone = 'friendly' | 'professional' | 'cheerful' | 'encouraging' | 'critical' | 'other';

export type EmailScenario = 'general' | 'achievement' | 'homework' | 'meeting' | 'event' | 'other';

// Expanded Zalo Topics based on PDF
export type ZaloTopic = 
  | 'general' 
  | 'meeting' 
  | 'holiday' 
  | 'timetable' 
  | 'labor' 
  | 'violation'
  // Preschool
  | 'health_menu' // Ăn uống & Sức khỏe
  | 'learning_activity' // Hoạt động học tập
  | 'pickup' // Đón trả trẻ
  // Primary
  | 'homework' // Bài tập về nhà
  | 'results' // Kết quả học tập
  | 'extracurricular' // Ngoại khóa
  | 'safety_behavior' // An toàn & Hành vi
  | 'health' // Sức khỏe chung
  // Secondary
  | 'exam_study' // Học tập & Thi cử
  | 'career_orientation' // Hướng nghiệp
  | 'union_team' // Đoàn Đội
  | 'discipline_reward' // Kỷ luật & Khen thưởng
  // High School
  | 'university_exam' // Thi ĐH & Định hướng
  | 'results_detail' // Kết quả chi tiết
  | 'student_excellence' // Thi HSG
  | 'soft_skills' // Kỹ năng mềm
  | 'graduation' // Tốt nghiệp
  // Common
  | 'fee' // Thu chi
  | 'event' // Sự kiện/Lễ hội
  | 'photo_video' // Ảnh/Video
  | 'congratulation' // Chúc mừng
  | 'emergency' // Khẩn cấp/Thời tiết
  | 'other'; // Khác (New)

export interface GenerationConfig {
  tone: EmailTone;
  customTone?: string;
  scenario: EmailScenario;
  customScenario?: string;
}

export interface ZaloConfig {
  topic: ZaloTopic;
  details: string;
  grade?: string;
  className?: string;
}

// AI Model Configuration
export type AIModelId = 'gemini-3-flash-preview' | 'gemini-3-pro-preview' | 'gemini-2.5-flash';

export const AVAILABLE_MODELS: { id: AIModelId; name: string; description: string }[] = [
  { 
    id: 'gemini-3-flash-preview', 
    name: 'Gemini 3.0 Flash (Khuyên dùng)', 
    description: 'Tốc độ nhanh, ổn định, chi phí thấp nhất.' 
  },
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Gemini 3.0 Pro', 
    description: 'Thông minh hơn, xử lý suy luận phức tạp tốt hơn.' 
  },
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    description: 'Model dự phòng, ổn định cao.' 
  }
];

export interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: AIModelId;
  setSelectedModel: (model: AIModelId) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

export interface User {
    username: string;
    fullName: string;
    expiry: string; // Format: 'YYYY-MM-DD' or 'VIP'
    title?: string; // 'Thầy' or 'Cô'
}

// Quick Notes Types
export type NoteType = 'violation' | 'reward' | 'psychology' | 'academic' | 'parent_contact' | 'other';
export type NoteSeverity = 'low' | 'medium' | 'high';

export interface QuickNote {
    id: string;
    classId: string; // Link to SavedClass
    className: string;
    studentId: string;
    studentName: string;
    date: string; // YYYY-MM-DD
    type: NoteType;
    content: string;
    severity?: NoteSeverity;
    tags?: string[];
    timestamp: number;
}
