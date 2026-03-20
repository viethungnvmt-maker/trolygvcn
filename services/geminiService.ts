
import { GoogleGenAI, Type } from "@google/genai";
import { Student, GeneratedEmail, GenerationConfig, ZaloConfig, AIModelId, NoteType } from "../types";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, BorderStyle, ShadingType, VerticalAlign } from 'docx';
import saveAs from 'file-saver';
import { COMMITTEE_ROLES, SEATING_STRATEGIES } from "../data/advancedManagementData";

// Fallback chain: Default -> Pro -> Backup
const FALLBACK_CHAIN: AIModelId[] = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];

/**
 * KNOWLEDGE BASE EXTRACTED FROM PROVIDED PDFS
 * Condensed for Prompt Context
 */
const NUMEROLOGY_KNOWLEDGE_BASE = `
QUY TẮC THẦN SỐ HỌC (PITAGO):
1. CÁCH TÍNH:
- Số Đường Đời (Life Path): Cộng rút gọn từng thành phần Ngày, Tháng, Năm sinh về 1 chữ số (trừ 11, 22, 33), sau đó cộng lại và rút gọn lần cuối.
- Số Sứ Mệnh (Expression): Tổng các chữ cái trong tên đầy đủ (A=1, B=2, C=3... theo bảng Pitago).
- Số Linh Hồn (Soul Urge): Tổng các Nguyên Âm trong tên.
- Số Nhân Cách (Personality): Tổng các Phụ Âm trong tên.

2. Ý NGHĨA CỐT LÕI CÁC CON SỐ:
- Số 1 (Người Tiên Phong): Lãnh đạo, độc lập, quyết đoán, cái tôi lớn. Thích tự học, tự nghiên cứu. Cần môi trường tự do, không gò bó.
- Số 2 (Người Hòa Giải): Nhạy cảm, trực giác, yêu hòa bình, lắng nghe tốt. Giỏi làm việc nhóm. Dễ bị tổn thương bởi lời nói.
- Số 3 (Người Truyền Cảm Hứng): Sáng tạo, hoạt ngôn, vui vẻ, nghệ sĩ. Học qua hình ảnh, trò chơi. Dễ mất tập trung, cả thèm chóng chán.
- Số 4 (Người Xây Dựng): Kỷ luật, chi tiết, thực tế, quy trình rõ ràng. Thích sự ổn định. Cứng nhắc, khó thay đổi.
- Số 5 (Người Tự Do): Phiêu lưu, đa tài, thích trải nghiệm mới, ghét sự gò bó. Sáng tạo, linh hoạt. Dễ bồn chồn, thiếu kiên nhẫn.
- Số 6 (Người Chăm Sóc): Trách nhiệm, yêu thương, hướng về gia đình/cộng đồng. Thích được ghi nhận. Hay lo lắng bao đồng.
- Số 7 (Người Trí Tuệ/Chiến Lược): Phân tích sâu, thích một mình, trực giác mạnh. Học qua chiêm nghiệm, logic. Khó tính, hay hoài nghi.
- Số 8 (Người Lãnh Đạo/Kinh Doanh): Mục tiêu rõ ràng, thực tế, nhạy bén tài chính/quyền lực. Chịu áp lực tốt. Đôi khi quá thực dụng, lạnh lùng.
- Số 9 (Người Nhân Ái): Cho đi, bao dung, lý tưởng cao đẹp, trực giác tốt. Đa tài. Đôi khi mơ mộng, thiếu thực tế.
- Số 11 (Bậc Thầy Trực Giác): Nhạy cảm tâm linh, truyền cảm hứng mạnh mẽ. Dễ bị căng thẳng thần kinh.
- Số 22 (Kiến Trúc Sư Đại Tài): Tầm nhìn lớn + Khả năng thực thi của số 4. Tạo ra di sản lớn. Áp lực cao.
- Số 33 (Bậc Thầy Chữa Lành): Lòng từ bi lớn, hướng thiện. (Hiếm gặp).
`;

const DISCIPLINE_KNOWLEDGE_BASE = `
HỆ THỐNG KHEN THƯỞNG VÀ XỬ LÝ VI PHẠM (KỶ LUẬT TÍCH CỰC):
1. NGUYÊN TẮC 4R:
- Related (Liên quan): Hình phạt phải liên quan đến hành vi.
- Respectful (Tôn trọng): Không xúc phạm nhân phẩm.
- Reasonable (Hợp lý): Cân đối mức độ.
- Helpful (Hữu ích): Giúp học sinh tiến bộ.

2. CÁC MỨC ĐỘ VI PHẠM & XỬ LÝ:
- Mức 1 (Nhẹ/Lần đầu): Nhắc nhở bằng mắt/cử chỉ; Thẻ "Học Bù 15 phút"; Thẻ "Ghi Nhớ Kiến Thức".
- Mức 2 (Trung bình/Tái phạm): Thẻ Vàng (cảnh báo); Viết Nhật Ký Suy Ngẫm; Hoạt động cải thiện lớp học (lau bảng, tưới cây); Hỗ trợ giáo viên.
- Mức 3 (Nghiêm trọng): Nhiệm vụ cộng đồng; Thẻ Đỏ; Cam kết cải thiện (có phụ huynh ký); Bồi thường thiệt hại.

3. PHƯƠNG PHÁP XỬ LÝ THEO CON SỐ (THẦN SỐ HỌC):
- Số 1: KHÔNG chỉ trích trước đám đông (giữ thể diện). Giao "nhiệm vụ đặc biệt" sửa sai thay vì phạt. Khen ngợi khả năng lãnh đạo.
- Số 2: Nhẹ nhàng, riêng tư. Dùng phương pháp "Sandwich" (Khen - Góp ý - Động viên). Khen ngợi sự giúp đỡ bạn bè.
- Số 3: Biến hình phạt thành trò chơi/thử thách sáng tạo. Khen ngợi trước đám đông (Spotlight).
- Số 4: Rõ ràng, có quy trình, công bằng. Khen ngợi sự nỗ lực, chi tiết và kết quả cụ thể.
- Số 5: Cho lựa chọn hình thức phạt. Khen ngợi sự sáng tạo, linh hoạt. Tránh sự nhàm chán.
- Số 6: Đánh vào tình cảm/trách nhiệm. Khen ngợi lòng tốt, sự quan tâm đến tập thể.
- Số 7: Cho thời gian riêng suy ngẫm. Khen ngợi tư duy sâu sắc, ý tưởng độc đáo.
- Số 8: Thẳng thắn, chuyên nghiệp. Khen ngợi năng lực tổ chức, kết quả thực tế. Trao quyền lực/trách nhiệm.
- Số 9: Gắn với lý tưởng cao đẹp/nhân văn. Khen ngợi lòng nhân ái, sự cống hiến cho cộng đồng.
`;

const formatGeminiError = (error: any): string => {
    let msg = "";
    if (typeof error === 'string') msg = error;
    else if (error.message) msg = error.message;
    else msg = JSON.stringify(error);
    
    // Normalize case
    const lowerMsg = msg.toLowerCase();

    if (lowerMsg.includes('429') || lowerMsg.includes('quota') || lowerMsg.includes('resource_exhausted')) {
        return "⚠️ Hết lượt sử dụng miễn phí (Quota Exceeded). Vui lòng chờ 1-2 phút rồi thử lại, hoặc đổi API Key khác.";
    }
    if (lowerMsg.includes('400') || lowerMsg.includes('api key') || lowerMsg.includes('invalid_argument')) {
        return "⚠️ API Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại trong Cài đặt.";
    }
    if (lowerMsg.includes('503') || lowerMsg.includes('overloaded') || lowerMsg.includes('unavailable')) {
        return "⚠️ Server Google đang quá tải. Hãy thử lại sau giây lát.";
    }
    
    // Truncate long error messages for display
    return "Lỗi kết nối AI: " + (msg.length > 100 ? msg.substring(0, 100) + "..." : msg);
};

/**
 * Wrapper to call Gemini with Fallback Logic
 */
async function callGeminiWithFallback(
    apiKey: string,
    initialModel: AIModelId,
    apiCall: (ai: GoogleGenAI, model: string) => Promise<any>
): Promise<any> {
    if (!apiKey) throw new Error("Vui lòng nhập API Key trong phần Cài đặt.");

    // Determine the order of models to try
    // Start with the user selected model, then proceed through the rest of the chain
    const modelsToTry = [initialModel, ...FALLBACK_CHAIN.filter(m => m !== initialModel)];

    let lastError: any;

    for (const model of modelsToTry) {
        try {
            // console.log(`Trying model: ${model}...`);
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const result = await apiCall(ai, model);
            return result; // Success!
        } catch (error: any) {
            console.warn(`Model ${model} failed:`, error);
            lastError = error;

            // Check specifically for Quota/Key errors to fail fast or handle specific logic
            const msg = error.message || JSON.stringify(error);
            const lowerMsg = msg.toLowerCase();
            const status = error?.status || error?.response?.status;
            
            // If Invalid Key, stop immediately
            if (status === 400 || status === 401 || lowerMsg.includes('api key')) {
                 throw new Error(formatGeminiError(error));
            }
            
            // If Quota exceeded (429), we can try other models, but usually quota is per project/key.
            // However, different models might have different quotas or tiers. We continue loop.
        }
    }

    // If all failed
    throw new Error(formatGeminiError(lastError));
}

const getToneInstruction = (tone: string, custom?: string): string => {
  switch (tone) {
    case 'professional':
      return "Giọng văn trang trọng, lịch sự, ngắn gọn, tập trung vào sự chuyên nghiệp và tôn trọng.";
    case 'cheerful':
      return "Giọng văn vui tươi, hào hứng, tràn đầy năng lượng tích cực.";
    case 'encouraging':
      return "Giọng văn tập trung vào việc khích lệ, động viên, nhìn vào tiềm năng phát triển của học sinh.";
    case 'critical':
      return "Giọng văn thẳng thắn, nghiêm khắc chỉ ra khuyết điểm/lỗi sai một cách rõ ràng nhưng vẫn giữ tinh thần xây dựng, kết thúc bằng động viên để học sinh sửa đổi.";
    case 'other':
      return `Yêu cầu về giọng văn: ${custom || 'Tự do theo ngữ cảnh'}.`;
    case 'friendly':
    default:
      return "Giọng văn thân mật, ấm áp, gần gũi như người nhà, thể hiện sự quan tâm sâu sắc.";
  }
};

const getScenarioInstruction = (scenario: string, custom?: string): string => {
  switch (scenario) {
    case 'achievement':
      return "Mục đích: Khen ngợi thành tích xuất sắc hoặc sự nỗ lực vượt bậc của học sinh.";
    case 'homework':
      return "Mục đích: Nhắc nhở về tình hình làm bài tập về nhà, nhưng theo cách nhẹ nhàng và cùng tìm giải pháp.";
    case 'meeting':
      return "Mục đích: Trân trọng mời phụ huynh tham gia cuộc họp hoặc buổi gặp mặt trao đổi.";
    case 'event':
      return "Mục đích: Thông báo về sự kiện sắp tới của lớp/trường và khuyến khích học sinh tham gia.";
    case 'other':
      return `Mục đích: ${custom || 'Viết email theo yêu cầu cụ thể của giáo viên.'}`;
    case 'general':
    default:
      return "Mục đích: Thông báo tổng hợp tình hình học tập và rèn luyện định kỳ.";
  }
};

const getEducationLevelContext = (grade?: string): string => {
    if (!grade) return "";
    
    // Handle Preschool case
    if (grade === "MamNon") {
        return "Đối tượng: Phụ huynh MẦM NON (3-5 tuổi). Lưu ý: Giọng văn cực kỳ ân cần, chi tiết về ăn ngủ, sức khỏe. Dùng nhiều icon dễ thương (bông hoa, mặt trời, trái tim).";
    }

    const g = parseInt(grade);
    if (isNaN(g)) return "";

    if (g >= 1 && g <= 5) {
        return "Đối tượng: Phụ huynh TIỂU HỌC. Lưu ý: Cần viết nhẹ nhàng, ân cần, dỗ dành. Tập trung vào nề nếp, bài tập về nhà và sự ngoan ngoãn. Phụ huynh ở độ tuổi này thường rất lo lắng cho con.";
    } else if (g >= 6 && g <= 9) {
        return "Đối tượng: Phụ huynh TRUNG HỌC CƠ SỞ (Cấp 2). Lưu ý: Cần viết nghiêm túc hơn nhưng vẫn khích lệ. Tập trung vào ý thức tự giác, lịch thi, kỷ luật và hoạt động Đoàn Đội.";
    } else if (g >= 10 && g <= 12) {
        return "Đối tượng: Phụ huynh TRUNG HỌC PHỔ THÔNG (Cấp 3). Lưu ý: Cần viết tôn trọng, chuyên nghiệp. Tập trung vào định hướng thi đại học, hướng nghiệp, kỹ năng mềm và trách nhiệm cá nhân.";
    }
    return "";
};

export const generateEmailContent = async (
    student: Student, 
    config: GenerationConfig, 
    apiKey: string, 
    model: AIModelId,
    teacherName?: string,
    teacherTitle?: string
): Promise<GeneratedEmail> => {
  const toneInstruction = getToneInstruction(config.tone, config.customTone);
  const scenarioInstruction = getScenarioInstruction(config.scenario, config.customScenario);
  const educationContext = getEducationLevelContext(student.grade);
  
  const senderInfo = (teacherName && teacherTitle) ? `${teacherTitle} ${teacherName}` : "Giáo viên chủ nhiệm";

  const scoreInfo = student.examType 
    ? `Kỳ thi: ${student.examType}. Điểm số: ${student.score || 'Chưa cập nhật'}`
    : `Điểm số/Học lực: ${student.score || 'Không có dữ liệu cụ thể'}`;

  const classInfo = student.className ? `Lớp: ${student.className}` : (student.grade ? `Khối: ${student.grade}` : "");

  const SYSTEM_INSTRUCTION = `
Bạn là một giáo viên chủ nhiệm tận tâm (${senderInfo}). Nhiệm vụ của bạn là viết email gửi phụ huynh.
CẤU HÌNH: ${toneInstruction} | ${scenarioInstruction} | ${educationContext}
QUY TẮC: 
1. Bắt đầu bằng sự trân trọng. 
2. Dùng từ ngữ xây dựng. Xưng hô: "${teacherTitle || 'Giáo viên'}" và "Phụ huynh/Anh/Chị".
3. Kết thúc bằng lời chúc và ký tên: "${senderInfo}".
`;

  const prompt = `
    Thông tin học sinh:
    - Tên: ${student.name}
    - ${classInfo}
    - Phụ huynh: ${student.parentName || 'Phụ huynh'}
    - ${scoreInfo}
    - Hành vi: ${student.behavior || 'Bình thường'}
    - Tiến bộ/Ghi chú: ${student.progress || student.notes || 'Không có'}
    - Người gửi: ${senderInfo}
    Hãy viết email hoàn chỉnh (Tiêu đề và Nội dung).
  `;

  return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ["subject", "body"],
          },
        },
      });

      const jsonText = response.text;
      if (!jsonText) throw new Error("Empty response");
      const result = JSON.parse(jsonText);
      return {
        studentId: student.id,
        subject: result.subject,
        body: result.body,
      };
  });
};

export const generateZaloContent = async (
    config: ZaloConfig, 
    apiKey: string, 
    model: AIModelId,
    teacherName?: string,
    teacherTitle?: string
): Promise<GeneratedEmail> => {
    const educationContext = getEducationLevelContext(config.grade);
    const classInfo = config.className ? `Lớp: ${config.className}` : (config.grade ? `Khối: ${config.grade}` : "");
    const senderInfo = (teacherName && teacherTitle) ? `${teacherTitle} ${teacherName}` : "GVCN";

    const SYSTEM_INSTRUCTION = `
Bạn là giáo viên chủ nhiệm (${senderInfo}). Soạn tin nhắn Zalo nhóm.
NGỮ CẢNH: ${educationContext}
QUY TẮC: 
1. Ngắn gọn, súc tích. Dùng icon emoji sinh động. 
2. Bố cục rõ ràng (Tiêu đề hoa, nội dung, lời nhắc).
3. Xưng hô trong tin nhắn là "${teacherTitle || 'Thầy/Cô'}".
MỤC ĐÍCH: ${config.topic === 'other' ? 'Thông báo tự chọn' : config.topic}
`;

    const prompt = `
    Lớp: ${classInfo}
    Chi tiết: ${config.details}
    Người gửi: ${senderInfo}
    Hãy soạn tin nhắn Zalo hoàn chỉnh dạng JSON (subject, body).
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING },
                    },
                    required: ["subject", "body"],
                },
            },
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("No response");
        const result = JSON.parse(jsonText);
        
        return {
            studentId: 'group',
            subject: result.subject,
            body: result.body
        };
    });
}

export const generateZaloTemplate = async (topicDescription: string, apiKey: string, model: AIModelId): Promise<string> => {
    const prompt = `
    Tạo CẤU TRÚC MẪU (Template) thông báo Zalo cho giáo viên về chủ đề: "${topicDescription}".
    Yêu cầu: Dùng icon. Dùng dấu [...] cho chỗ điền. Ngắn gọn.
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
        });
        return response.text || "";
    });
}

export const generateStudentReport = async (
    student: Student, 
    config: GenerationConfig, 
    apiKey: string, 
    model: AIModelId,
    teacherName?: string,
    teacherTitle?: string
): Promise<string> => {
    const toneInstruction = getToneInstruction(config.tone, config.customTone);
    const senderInfo = (teacherName && teacherTitle) ? `${teacherTitle} ${teacherName}` : "GVCN";
    
    const SYSTEM_INSTRUCTION = `
    Bạn là ${senderInfo} - GVCN lớp. Viết nhận xét học sinh theo cấu trúc 4 phần (Khen ngợi 30%, Phân tích 40%, Gợi ý 20%, Động viên 10%).
    Định dạng: BẮT BUỘC xuống dòng (\n) giữa các phần. Không viết thành 1 khối.
    TONE (Giọng văn): ${toneInstruction}
    Độ dài: 150-250 từ.
    `;

    const detailedScores = student.detailedScores || {};
    const scoresText = Object.entries(detailedScores)
        .map(([subject, score]) => `- ${subject}: ${score}`)
        .join("\n");

    const prompt = `
    Học sinh: ${student.name} (${student.className || 'N/A'})
    Điểm:
    ${scoresText}
    ${student.behavior ? `- Hành vi: ${student.behavior}` : ''}
    ${student.progress ? `- Tiến bộ: ${student.progress}` : ''}
    Hãy viết nhận xét chi tiết.
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Không thể tạo nhận xét.";
    });
}

export const generatePersonalityAnalysis = async (
    student: Student,
    apiKey: string,
    model: AIModelId
): Promise<string> => {
    // Prompt structure designed to return HTML compatible with the "Cards" layout in the UI.
    const SYSTEM_INSTRUCTION = `
    Bạn là Chuyên gia Tâm lý Giáo dục & Thần số học (Numerology).
    Nhiệm vụ: Phân tích sâu sắc về học sinh dựa trên Tên và Ngày sinh (sử dụng hệ thống Thần số học Pitago).

    ${NUMEROLOGY_KNOWLEDGE_BASE}

    QUY TRÌNH XỬ LÝ:
    1. Chuẩn hóa ngày sinh về định dạng dd/mm/yyyy. Nếu thiếu ngày sinh, hãy giả định dựa trên hành vi (nhưng ghi chú là giả định).
    2. TÍNH TOÁN (Không cần hiển thị phép tính, chỉ lấy kết quả):
       - Đường Đời (Life Path)
       - Sứ Mệnh
    3. ĐỐI CHIẾU với Kiến thức Thần số học để viết nhận xét cho các mục.

    YÊU CẦU ĐẦU RA:
    Trả về mã HTML (chỉ các thẻ div, không html/body) hiển thị dạng GRID.
    Sử dụng Tailwind CSS.
    Tạo chính xác 10 thẻ (Card):
    1. TỔNG QUAN TÍNH CÁCH (Nêu rõ Con số chủ đạo)
    2. PHONG CÁCH HỌC TẬP
    3. KHIẾU NĂNG LỰC TẬP TRUNG
    4. ĐỘNG LỰC HỌC TẬP
    5. CÁCH TIẾP CẬN BÀI TOÁN
    6. ĐIỂM MẠNH NỔI BẬT
    7. THÁCH THỨC CẦN KHẮC PHỤC
    8. PHƯƠNG PHÁP HỌC HIỆU QUẢ
    9. MÔI TRƯỜNG HỌC TẬP LÝ TƯỞNG
    10. KẾT LUẬN & KHUYẾN NGHỊ

    Định dạng Card:
    <div class="bg-white p-4 rounded-xl border border-teal-100 shadow-sm analysis-card">
       <div class="flex items-center gap-2 mb-2 text-teal-700 font-bold uppercase text-xs tracking-wider card-title">
           [Icon] [Tiêu đề]
       </div>
       <div class="text-sm text-slate-600 leading-relaxed card-content">
           [Nội dung phân tích]
       </div>
    </div>
    
    Lưu ý: Giọng văn sư phạm, tích cực, thấu hiểu, giúp giáo viên có cái nhìn sâu sắc để giáo dục tốt hơn.
    `;

    const detailedScores = student.detailedScores || {};
    const scoresText = Object.entries(detailedScores)
        .map(([subject, score]) => `${subject}: ${score}`)
        .join(", ");

    const prompt = `
    Học sinh: ${student.name}
    Ngày sinh: ${student.dob || 'Chưa rõ (Hãy dùng trực giác phân tích dựa trên tên và hành vi)'}
    Lớp: ${student.className || 'N/A'}
    Điểm số: ${scoresText || 'Chưa có dữ liệu chi tiết'}
    Hành vi: ${student.behavior || 'Không có ghi chú'}
    
    Hãy phân tích và trả về HTML Grid 2 cột (class="grid grid-cols-1 md:grid-cols-2 gap-4").
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Không thể phân tích dữ liệu này.";
    });
}

export const generateSolutionForStudent = async (
    student: Student,
    analysisHtml: string,
    problem: string,
    apiKey: string,
    model: AIModelId,
    interactionType: 'reward' | 'violation' | 'other' = 'other'
): Promise<string> => {
    
    const contextInstruction = interactionType === 'reward' 
        ? "NGỮ CẢNH: GIÁO VIÊN MUỐN KHEN THƯỞNG/ĐỘNG VIÊN HỌC SINH. Hãy đề xuất các hình thức khen thưởng ý nghĩa, tạo động lực dựa trên tính cách."
        : "NGỮ CẢNH: HỌC SINH CÓ HÀNH VI VI PHẠM/CẦN UỐN NẮN. Hãy đề xuất biện pháp kỷ luật tích cực, giúp học sinh nhận ra lỗi sai mà không bị tổn thương.";

    const SYSTEM_INSTRUCTION = `
    Bạn là Cố vấn Giáo dục cao cấp (Super Nanny) & Chuyên gia Thần số học.
    Nhiệm vụ: Đưa ra giải pháp xử lý tình huống sư phạm dựa trên vấn đề giáo viên nêu và đặc điểm Thần số học của học sinh.
    
    ${contextInstruction}
    
    ${NUMEROLOGY_KNOWLEDGE_BASE}
    ${DISCIPLINE_KNOWLEDGE_BASE}

    QUY TRÌNH TƯ DUY:
    1. Xác định Con số chủ đạo (Đường đời) của học sinh dựa trên Ngày sinh.
    2. Phân tích vấn đề:
       - Nếu là KHEN THƯỞNG: Học sinh số này thích được khen thế nào? (Vật chất, tinh thần, công khai hay riêng tư?).
       - Nếu là VI PHẠM: Đang ở Mức độ mấy? Cách tiếp cận nào khiến em ấy phục (Lý lẽ, tình cảm hay trải nghiệm?).
    3. Tra cứu "Phương pháp xử lý theo con số" để chọn cách tiếp cận phù hợp nhất.
    4. Xây dựng kịch bản xử lý theo nguyên tắc 4R (Related, Respectful, Reasonable, Helpful).

    OUTPUT FORMAT (Trả về Markdown):
    
    **1. Phân tích nguyên nhân & Tâm lý (Theo Thần số học):**
    - Giải thích tại sao học sinh có hành vi/thành tích này dựa trên con số chủ đạo và tính cách.
    - Động lực ẩn sâu bên trong là gì?
    
    **2. Đề xuất Phương pháp (${interactionType === 'reward' ? 'Khen thưởng sáng tạo' : 'Kỷ luật tích cực'}):**
    - Đề xuất hình thức cụ thể (VD: ${interactionType === 'reward' ? 'Trao huy hiệu, Thư khen, Voucher' : 'Thẻ vàng, Nhiệm vụ đặc biệt, Viết nhật ký'}).
    - Tại sao cách này lại hiệu quả với em ấy?
    
    **3. Hướng dẫn thực hiện từng bước (Cầm tay chỉ việc):**
    - Bước 1: Tiếp cận (Nói gì, thái độ ra sao).
    - Bước 2: Thực hiện hành động.
    - Bước 3: Theo dõi & Phản hồi sau đó.
    
    **4. Mẫu câu thoại gợi ý (Script):**
    - "Cô rất ấn tượng khi..." (Nếu khen)
    - "Cô hiểu là con đang cảm thấy..." (Nếu phạt)

    Giọng văn: Đồng cảm sâu sắc với giáo viên, nhưng bênh vực tiềm năng của học sinh. Luôn hướng tới giáo dục tích cực (Positive Discipline).
    `;

    const prompt = `
    Học sinh: ${student.name}
    Ngày sinh: ${student.dob || 'Chưa rõ'}
    Phân tích tâm lý hiện có: ${analysisHtml.replace(/<[^>]*>?/gm, '').substring(0, 500)}...
    
    VẤN ĐỀ CẦN XỬ LÝ (${interactionType === 'reward' ? 'KHEN THƯỞNG' : 'VI PHẠM'}): "${problem}"
    
    Hãy đưa ra giải pháp chi tiết.
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Chưa tìm ra giải pháp phù hợp.";
    });
}

// --- NEW FUNCTIONS FOR ADVANCED MODULES ---

export const generateClassCommitteeSuggestion = async (
    students: Student[],
    apiKey: string,
    model: AIModelId
): Promise<string> => {
    const SYSTEM_INSTRUCTION = `
    Bạn là chuyên gia Tổ chức lớp học.
    Nhiệm vụ: Đề xuất Ban Cán Sự Lớp dựa trên danh sách học sinh và Ngày sinh (để tính Thần số học).
    
    ${NUMEROLOGY_KNOWLEDGE_BASE}

    QUY TẮC CHỌN NGƯỜI:
    - Lớp trưởng: Số 1, 8 (Lãnh đạo, quyết đoán).
    - Bí thư/Lao động: Số 2, 6, 9 (Kết nối, chăm sóc).
    - Văn thể/Truyền thông: Số 3, 5 (Sáng tạo, hoạt ngôn).
    - Học tập/Thư ký: Số 4, 7 (Logic, chi tiết).

    INPUT: Danh sách JSON (Tên, Ngày sinh, Điểm/Hạnh kiểm).
    
    OUTPUT: Trả về mã HTML bảng phân công (Table).
    - Cột: Vị trí, Học sinh đề cử, Lý do phù hợp (Dựa trên số chủ đạo).
    - Phong cách: Trang trọng, rõ ràng.
    `;

    const simplifiedStudents = students.map(s => ({
        name: s.name,
        dob: s.dob,
        academic: s.score || 'N/A'
    })).slice(0, 50); // Limit to avoid token overflow

    const prompt = `Danh sách học sinh: ${JSON.stringify(simplifiedStudents)}. Hãy đề xuất ban cán sự.`;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Không thể đề xuất.";
    });
}

export const generateSeatingArrangementSuggestion = async (
    students: Student[],
    apiKey: string,
    model: AIModelId,
    strategyType: string
): Promise<string> => {
     const SYSTEM_INSTRUCTION = `
    Bạn là chuyên gia sắp xếp lớp học.
    Nhiệm vụ: Gợi ý sơ đồ chỗ ngồi dựa trên danh sách học sinh và chiến lược được chọn.
    
    CHIẾN LƯỢC: ${strategyType}
    ${NUMEROLOGY_KNOWLEDGE_BASE}

    INPUT: Danh sách JSON.
    OUTPUT: Trả về mã HTML mô tả sơ đồ (Có thể dùng Table hoặc Grid div).
    - Chia lớp thành các Tổ/Nhóm.
    - Giải thích ngắn gọn tại sao xếp bạn A ngồi cạnh bạn B (VD: Số 1 ngồi cạnh số 5 để bổ trợ...).
    `;

    const simplifiedStudents = students.map(s => ({
        name: s.name,
        dob: s.dob,
        info: s.behavior || s.score
    })).slice(0, 40);

    const prompt = `Danh sách học sinh: ${JSON.stringify(simplifiedStudents)}. Hãy xếp chỗ ngồi.`;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Không thể xếp chỗ.";
    });
}

export const generateDisciplinePlan = async (
    studentName: string,
    studentDob: string,
    violation: string,
    apiKey: string,
    model: AIModelId
): Promise<string> => {
    const SYSTEM_INSTRUCTION = `
    Bạn là Chuyên gia Tâm lý Học đường và Kỷ luật Tích cực.
    Nhiệm vụ: Xây dựng quy trình xử lý vi phạm Nề nếp cho một học sinh cụ thể.

    ${NUMEROLOGY_KNOWLEDGE_BASE}
    ${DISCIPLINE_KNOWLEDGE_BASE}

    INPUT: Tên HS, Ngày sinh, Hành vi vi phạm.

    YÊU CẦU XỬ LÝ:
    1. Xác định Số Đường Đời của HS từ Ngày sinh.
    2. Xác định Độ tuổi/Cấp học dựa trên Năm sinh (So với năm hiện tại). 
       - Nếu Tiểu học: Tiếp cận nhẹ nhàng, dỗ dành, làm gương.
       - Nếu THCS: Nghiêm khắc hơn nhưng tôn trọng cá tính.
       - Nếu THPT: Tôn trọng như người lớn, đánh vào trách nhiệm và tương lai.
    3. Phân tích hành vi vi phạm dựa trên đặc điểm Thần số học và Độ tuổi.
    4. Đưa ra quy trình xử lý 3 bước (Ghi nhận -> Phân tích -> Xử lý).

    OUTPUT FORMAT (Trả về HTML):
    - Sử dụng các thẻ div với class Tailwind CSS để trình bày đẹp mắt (Card, Timeline, Highlight box).
    - Nội dung gồm:
      - **Phân tích nhanh**: (Số chủ đạo, Đặc điểm tâm lý liên quan đến lỗi vi phạm).
      - **Ma trận xử lý đề xuất**: (Mức độ hiện tại, Hình thức xử lý phù hợp nhất).
      - **Kịch bản giao tiếp (Script)**: Những câu nói "chạm" đến tâm lý học sinh này nhất.
      - **Lời khuyên cho GVCN**: Cách tiếp cận để học sinh "Tâm phục khẩu phục".

    Lưu ý: Không trả về Markdown, chỉ trả về HTML nội dung (không bao gồm thẻ html/body).
    `;

    const prompt = `
    Học sinh: ${studentName}
    Ngày sinh: ${studentDob}
    Hành vi vi phạm: ${violation}
    
    Hãy lập kế hoạch xử lý chi tiết.
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Không thể tạo quy trình.";
    });
}

export const generateSpecialSituationPlan = async (
    studentName: string,
    studentDob: string,
    situation: string,
    apiKey: string,
    model: AIModelId
): Promise<string> => {
    const SYSTEM_INSTRUCTION = `
    Bạn là Chuyên gia Tâm lý Khủng hoảng và Cố vấn Giáo dục.
    Nhiệm vụ: Đưa ra quy trình xử lý tình huống ĐẶC BIỆT NGHIÊM TRỌNG (Crisis Management).

    ${NUMEROLOGY_KNOWLEDGE_BASE}

    INPUT: Tên HS, Ngày sinh, Tình huống (VD: Trộm cắp, Bạo lực, Bỏ nhà, Vi phạm pháp luật...).

    QUY TẮC AN TOÀN & ĐẠO ĐỨC:
    - Đặt sự an toàn của học sinh lên hàng đầu.
    - Tuân thủ quy định pháp luật và quy chế nhà trường.
    - Bảo mật thông tin học sinh (trong quy trình xử lý).

    YÊU CẦU XỬ LÝ:
    1. Xác định Số Đường Đời & Đặc điểm tâm lý cốt lõi.
    2. Đánh giá mức độ nghiêm trọng và rủi ro (Risk Assessment).
    3. Đề xuất Quy trình xử lý khẩn cấp (Immediate Action) và Lâu dài (Long-term Support).
    4. Gợi ý cách trao đổi với Phụ huynh và các bên liên quan (Công an, BGH, Chuyên gia tâm lý).

    OUTPUT FORMAT (Trả về HTML):
    - Sử dụng Tailwind CSS (Warning alerts, Steps, Badge).
    - Cấu trúc:
      - 🚨 **Đánh giá rủi ro**: Mức độ nghiêm trọng, các nguy cơ tiềm ẩn.
      - 🧠 **Phân tích Tâm lý (Thần số)**: Tại sao em lại hành động như vậy? (Gốc rễ vấn đề).
      - 🛡️ **Quy trình xử lý (Từng bước)**: 
        1. Ổn định tình hình/An toàn.
        2. Thu thập thông tin.
        3. Phối hợp gia đình/nhà trường.
        4. Biện pháp giáo dục/răn đe/hỗ trợ.
      - 💬 **Kịch bản đối thoại khéo léo**: Với HS, với Phụ huynh.

    Lưu ý: Giọng văn bình tĩnh, chuyên nghiệp, thấu cảm nhưng cương quyết.
    `;

    const prompt = `
    Học sinh: ${studentName}
    Ngày sinh: ${studentDob}
    Tình huống nghiêm trọng: ${situation}
    
    Hãy lập kế hoạch xử lý khủng hoảng.
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Không thể tạo quy trình.";
    });
}

/**
 * Suggest Quick Note Content
 */
export const suggestQuickNoteContent = async (
    type: NoteType,
    studentName: string,
    apiKey: string,
    model: AIModelId
): Promise<string> => {
    const SYSTEM_INSTRUCTION = `
    Bạn là Trợ lý Giáo viên. Nhiệm vụ: Gợi ý nội dung ghi chú nhanh về học sinh.
    
    INPUT: Loại sự việc (Vi phạm/Khen thưởng...), Tên học sinh.
    
    YÊU CẦU:
    - Tạo 5 mẫu câu ngắn gọn (10-20 từ).
    - Phù hợp môi trường giáo dục Việt Nam.
    - Có chỗ trống [...] để giáo viên điền thêm chi tiết.
    - Định dạng: Trả về JSON Array string [ "Mẫu 1", "Mẫu 2", ... ]
    `;

    const prompt = `
    Loại ghi chú: ${type}
    Học sinh: ${studentName}
    
    Hãy gợi ý 5 mẫu câu.
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { 
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json" 
            }
        });
        
        const jsonText = response.text || "[]";
        try {
            const arr = JSON.parse(jsonText);
            if (Array.isArray(arr)) return JSON.stringify(arr); // Return as JSON string for parsing in UI
            return JSON.stringify([]);
        } catch (e) {
            return JSON.stringify([]);
        }
    });
}

// --- REPORT GENERATION FUNCTIONS ---

export const generateClassReportAssessment = async (
    stats: any,
    topStudents: any[],
    apiKey: string,
    model: AIModelId
): Promise<string> => {
    const SYSTEM_INSTRUCTION = `
    Bạn là Giáo viên chủ nhiệm (GVCN) có kinh nghiệm.
    Nhiệm vụ: Viết phần "ĐÁNH GIÁ CHUNG CỦA GVCN" cho Báo cáo Tổng kết Lớp học.
    
    YÊU CẦU:
    - Dựa trên số liệu thống kê được cung cấp.
    - Giọng văn: Chuyên nghiệp, khách quan, vừa ghi nhận thành tích, vừa chỉ ra hạn chế một cách xây dựng.
    - Cấu trúc:
      1. Tổng quan: Nhận xét về tinh thần học tập và nề nếp chung.
      2. Điểm mạnh: Nêu bật các thành tích (Tỷ lệ Giỏi, Khen thưởng...).
      3. Hạn chế: Chỉ ra các vấn đề cần khắc phục (Nếu có vi phạm, điểm yếu...).
      4. Phương hướng: Đề xuất ngắn gọn cho giai đoạn tới.
    - Độ dài: 150-200 từ.
    `;

    const prompt = `
    Dữ liệu lớp học:
    - Sĩ số: ${stats.totalStudents}
    - Học lực: Giỏi (${stats.excellent}), Khá (${stats.good}), TB (${stats.average}), Yếu (${stats.weak})
    - Điểm trung bình lớp: ${stats.classAverageScore}
    - Hạnh kiểm/Nề nếp: Tốt (${stats.conductGood}), Vi phạm (${stats.totalViolations} lượt)
    - Số học sinh được khen thưởng: ${stats.totalRewards}
    
    Học sinh tiêu biểu: ${topStudents.map(s => `${s.name} (${s.averageScore})`).join(', ')}

    Hãy viết đoạn đánh giá tổng kết.
    `;

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        return response.text || "Không thể tạo đánh giá.";
    });
}

export const extractStudentListFromFiles = async (
    fileData: string, 
    mimeType: string,
    apiKey: string, 
    model: AIModelId
): Promise<Student[]> => {
    const SYSTEM_INSTRUCTION = `
    Trích xuất danh sách học sinh từ file (Excel/PDF/Image).
    
    Output JSON Array với các trường sau:
    - name (String): Họ và tên
    - dob (String): Ngày sinh (dd/mm/yyyy)
    - className (String): Lớp
    - averageScore (Number): Điểm trung bình môn (nếu có cột TB, TBHK, TBC...)
    - conduct (String): Hạnh kiểm (Tốt, Khá, TB, Yếu)
    - absenceCount (Number): Số ngày nghỉ (có phép + không phép)
    - violationCount (Number): Số lần vi phạm/lỗi
    - achievements (Array String): Các thành tích/khen thưởng (nếu có)
    - detailedScores (Object): Điểm các môn (Toán, Văn, Anh...)
    
    Nếu không có dữ liệu, hãy để trống hoặc null.
    `;

    const parts = [];
    if (mimeType === 'text/csv' || mimeType === 'text/plain') {
        parts.push({ text: fileData });
    } else {
        parts.push({ inlineData: { mimeType: mimeType, data: fileData } });
        parts.push({ text: "Trích xuất danh sách học sinh." });
    }

    return callGeminiWithFallback(apiKey, model, async (ai, currentModel) => {
        const response = await ai.models.generateContent({
            model: currentModel,
            contents: { parts },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json"
            }
        });
        
        const jsonText = response.text;
        if (!jsonText) throw new Error("Empty response");
        const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        
        return data.map((item: any, idx: number) => ({
            id: `extracted-${idx}-${Date.now()}`,
            name: item.name || `Học sinh ${idx+1}`,
            className: item.className || '',
            dob: item.dob || '',
            detailedScores: item.detailedScores || {},
            behavior: item.behavior || '',
            progress: item.progress || '',
            averageScore: item.averageScore ? parseFloat(item.averageScore) : undefined,
            conduct: item.conduct || '',
            absenceCount: item.absenceCount || 0,
            violationCount: item.violationCount || 0,
            achievements: item.achievements || []
        }));
    });
}

/**
 * Export Analysis to Docx with beautiful professional Table layout
 */
export const exportStudentAnalysesToDocx = async (
    students: Student[],
    analysisResults: Record<string, string>,
    className: string
) => {
    // Advanced Parser to convert HTML Grid to structured data
    const parseAnalysisToData = (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // The prompt asks for <div class="... analysis-card">...</div> but sometimes AI might miss classes.
        // We look for divs that likely contain the content.
        const cards = Array.from(doc.querySelectorAll('div')); 
        
        const extractedItems: {title: string, content: string}[] = [];

        cards.forEach(card => {
            // Try to find title and content based on common structure or specific classes if present
            // Strategy: Look for the first child with bold/uppercase text as Title, remaining as Content
            // OR look for our specific requested classes
            let titleEl = card.querySelector('.card-title') || card.querySelector('.font-bold');
            let contentEl = card.querySelector('.card-content') || card.querySelector('.text-slate-600');
            
            // Heuristic fallback if classes are missing:
            // If a div has exactly 2 children divs, first is title, second is content
            if (!titleEl && !contentEl && card.children.length >= 2) {
                 titleEl = card.children[0];
                 contentEl = card.children[1];
            }

            if (titleEl && contentEl) {
                const title = titleEl.textContent?.trim() || "Mục phân tích";
                const content = contentEl.textContent?.trim() || "";
                
                // Avoid duplicates or nested divs picking up same content
                if(content.length > 10 && !extractedItems.some(i => i.title === title)) {
                    extractedItems.push({ title, content });
                }
            }
        });

        return extractedItems;
    };

    const createStudentTable = (student: Student, analysisItems: {title: string, content: string}[]) => {
        // Create rows for the table. Since it's 2 columns, we pair items.
        const dataRows: TableRow[] = [];
        
        for (let i = 0; i < analysisItems.length; i += 2) {
            const item1 = analysisItems[i];
            const item2 = analysisItems[i+1];

            const cells = [
                // Cell 1
                new TableCell({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: item1.title, bold: true, color: "008080", size: 22 })],
                            spacing: { after: 100 }
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: item1.content, size: 22 })],
                        })
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    margins: { top: 150, bottom: 150, left: 150, right: 150 },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    }
                })
            ];

            // Cell 2 (Check if exists)
            if (item2) {
                cells.push(
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [new TextRun({ text: item2.title, bold: true, color: "008080", size: 22 })],
                                spacing: { after: 100 }
                            }),
                            new Paragraph({
                                children: [new TextRun({ text: item2.content, size: 22 })],
                            })
                        ],
                        width: { size: 50, type: WidthType.PERCENTAGE },
                        margins: { top: 150, bottom: 150, left: 150, right: 150 },
                         borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                        }
                    })
                );
            } else {
                 // Empty cell filler if odd number of items
                 cells.push(new TableCell({ children: [], width: { size: 50, type: WidthType.PERCENTAGE }}));
            }

            dataRows.push(new TableRow({ children: cells }));
        }

        return new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                // Header Row (Student Name)
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `HỌC SINH: ${student.name.toUpperCase()}`, bold: true, size: 28, color: "FFFFFF" }),
                                    ],
                                    alignment: AlignmentType.CENTER
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: `Ngày sinh: ${student.dob || '...'}  |  Lớp: ${student.className || '...'}`, color: "E0F2F1", size: 20 }),
                                    ],
                                    alignment: AlignmentType.CENTER
                                })
                            ],
                            columnSpan: 2,
                            shading: { fill: "008080" },
                            verticalAlign: VerticalAlign.CENTER,
                            margins: { top: 200, bottom: 200 }
                        })
                    ]
                }),
                ...dataRows
            ],
        });
    }

    const sections = [];

    // Title Page (Optional, just simple Header for now)
    sections.push(
        new Paragraph({
            children: [new TextRun({ text: `BÁO CÁO PHÂN TÍCH TÂM LÝ & THẦN SỐ HỌC`, bold: true, size: 36, color: "008080" })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
             children: [new TextRun({ text: `LỚP: ${className.toUpperCase()}`, bold: true, size: 28, color: "333333" })],
             alignment: AlignmentType.CENTER,
             spacing: { after: 800 }
        })
    );

    // Generate Tables for each student
    students.forEach(student => {
        if (analysisResults[student.id]) {
            const data = parseAnalysisToData(analysisResults[student.id]);
            if (data.length > 0) {
                sections.push(
                    createStudentTable(student, data),
                    new Paragraph({ text: "", spacing: { after: 600 }, pageBreakBefore: true }) // Page break after each student
                );
            }
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: sections,
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Bao_Cao_Tam_Ly_Lop_${className || 'Moi'}.docx`);
    });
}

/**
 * Export specific problem solution to Docx
 */
export const exportSolutionToDocx = async (
    studentName: string,
    problem: string,
    solution: string
) => {
    // Parse Markdown bolding simply
    const paragraphs = solution.split('\n').map(line => {
        const parts = line.split(/(\*\*.*?\*\*)/g); 
        const children = parts.map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return new TextRun({ text: part.replace(/\*\*/g, ''), bold: true });
            }
            return new TextRun({ text: part });
        });
        
        return new Paragraph({
            children: children,
            spacing: { after: 120 } 
        });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [new TextRun({ text: "GỢI Ý XỬ LÝ TÌNH HUỐNG SƯ PHẠM", bold: true, size: 32, color: "2E74B5" })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Học sinh: ", bold: true }),
                        new TextRun({ text: studentName })
                    ],
                    spacing: { after: 200 }
                }),
                 new Paragraph({
                    children: [
                        new TextRun({ text: "Vấn đề cần xử lý: ", bold: true, color: "C00000" }),
                        new TextRun({ text: problem, italics: true })
                    ],
                    spacing: { after: 400 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                        bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                        left: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                        right: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        new Paragraph({
                                            children: [new TextRun({ text: "GIẢI PHÁP TỪ CHUYÊN GIA AI", bold: true, color: "2E74B5" })],
                                            spacing: { after: 200 }
                                        }),
                                        ...paragraphs
                                    ],
                                    margins: { top: 200, bottom: 200, left: 200, right: 200 }
                                })
                            ]
                        })
                    ]
                }),
                new Paragraph({
                    children: [new TextRun({ text: "Được tạo bởi Teacher's Heart App", italics: true, size: 16, color: "888888" })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400 }
                })
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Giai_Phap_${studentName.replace(/\s+/g, '_')}.docx`);
    });
}

/**
 * Export Zalo Message to Word
 */
export const exportZaloToDocx = async (title: string, content: string) => {
    const paragraphs = content.split('\n').map(line => {
        return new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 120 } 
        });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [new TextRun({ text: "THÔNG BÁO ZALO", bold: true, size: 32, color: "008080" })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                 new Paragraph({
                    children: [
                        new TextRun({ text: "Chủ đề: ", bold: true }),
                        new TextRun({ text: title, italics: true })
                    ],
                    spacing: { after: 200 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                        bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                        left: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                        right: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" },
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        ...paragraphs
                                    ],
                                    margins: { top: 200, bottom: 200, left: 200, right: 200 }
                                })
                            ]
                        })
                    ]
                })
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Tin_Nhan_Zalo_${new Date().toISOString().slice(0,10)}.docx`);
    });
}
