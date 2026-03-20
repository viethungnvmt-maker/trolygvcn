
export const DISCIPLINE_DATA = {
    late: {
        title: "Quy trình xử lý Đi học muộn",
        steps: [
            { step: 1, action: "Ghi nhận", detail: "Hệ thống/Cờ đỏ ghi nhận. GVCN xác nhận nguyên nhân." },
            { step: 2, action: "Phân tích", detail: "Trao đổi riêng để tìm hiểu nguyên nhân thực tế (Khách quan/Chủ quan)." },
            { step: 3, action: "Xử lý", detail: "Áp dụng ma trận xử lý kết hợp nhắc nhở theo Thần số học." }
        ],
        matrix: [
            { level: "Nhẹ (<5p)", measure: "Nhắc nhở riêng, tìm hiểu nguyên nhân.", point: "-1 điểm" },
            { level: "Trung bình (5-15p)", measure: "Trao đổi nghiêm túc, yêu cầu viết cam kết.", point: "-3 điểm" },
            { level: "Nặng (>15p/Vắng)", measure: "Mời PHHS, lao động công ích.", point: "-5 điểm" }
        ]
    },
    uniform: {
        title: "Quy trình xử lý Đồng phục",
        matrix: [
            { type: "Quên/Nhầm", measure: "Nhắc nhở nhẹ nhàng. Nếu tái phạm >3 lần mới phạt.", point: "-1 điểm" },
            { type: "Cố ý (Thể hiện)", measure: "Dùng Thần số học tác động tâm lý (VD: Số 3,5 thích nổi bật -> Khen điểm khác).", point: "-2 điểm" },
            { type: "Hoàn cảnh", measure: "Tế nhị tìm hiểu, kết nối quỹ hỗ trợ, KHÔNG TRỪ ĐIỂM.", point: "0 điểm" }
        ]
    },
    numerology_tips: [
        { numbers: [1, 8], trait: "Tiên phong, Trách nhiệm", script: "Cô tin em là người có trách nhiệm và làm gương. Việc này giúp khẳng định uy tín của em." },
        { numbers: [2, 6], trait: "Tình cảm, Kết nối", script: "Việc em vi phạm làm cô và cả lớp rất lo lắng. Có khó khăn gì hãy chia sẻ nhé." },
        { numbers: [4, 7], trait: "Logic, Kỷ luật", script: "Chúng ta có quy định rõ ràng. Việc tuân thủ giúp lớp vận hành hiệu quả. Em hiểu rõ điều này mà." },
        { numbers: [3, 5], trait: "Sáng tạo, Tự do", script: "Em rất năng động, nhưng hãy dùng năng lượng đó đúng chỗ. Hãy thử thách bản thân đi đúng giờ xem!" },
        { numbers: [9], trait: "Nhân văn, Cống hiến", script: "Hành động của em ảnh hưởng đến thi đua của tập thể. Hãy vì mọi người mà cố gắng nhé." }
    ]
};

export const VIOLATION_TYPES = [
    { value: "di_hoc_muon", label: "⏰ Đi học muộn" },
    { value: "dong_phuc", label: "👔 Vi phạm đồng phục/đầu tóc" },
    { value: "noi_chuyen", label: "🗣️ Nói chuyện riêng/Mất trật tự" },
    { value: "bai_tap", label: "📝 Không làm bài tập về nhà" },
    { value: "dien_thoai", label: "📱 Sử dụng điện thoại trong giờ" },
    { value: "vo_le", label: "😠 Vô lễ với giáo viên" },
    { value: "gian_lan", label: "👀 Gian lận trong kiểm tra/thi" },
    { value: "danh_nhau", label: "👊 Đánh nhau/Bạo lực học đường" },
    { value: "hut_thuoc", label: "🚬 Hút thuốc lá/Vape" },
    { value: "tinh_yeu", label: "💕 Vấn đề tình cảm học trò" },
    { value: "game", label: "🎮 Nghiện Game/Xao nhãng" },
    { value: "khac", label: "✨ Vi phạm khác (Tự nhập)" }
];

export const SPECIAL_SITUATION_TYPES = [
    { value: "mat_do", label: "🕵️ Lớp bị mất đồ/Trộm cắp" },
    { value: "giao_thong", label: "🏍️ Vi phạm An toàn Giao thông" },
    { value: "ki_luat_truong", label: "🏫 Bị nhà trường xử lý kỷ luật/Đình chỉ" },
    { value: "phap_luat", label: "⚖️ Vi phạm Pháp luật/Công an mời" },
    { value: "bo_nha", label: "🏃 Bỏ nhà ra đi" },
    { value: "bao_luc_nang", label: "🚑 Bạo lực gây thương tích nặng" },
    { value: "tram_cam", label: "🧠 Dấu hiệu Trầm cảm/Tự hại" },
    { value: "quay_roi", label: "🚫 Bị quấy rối/Bắt nạt qua mạng (Cyberbully)" },
    { value: "khac", label: "🚨 Tình huống nghiêm trọng khác (Tự nhập)" }
];

export const SPECIAL_SITUATIONS = {
    lost_items: {
        title: "Quy trình 5 Bước xử lý Lớp mất đồ",
        steps: [
            { step: 1, title: "Tiếp nhận & Trấn an", content: "Yêu cầu HS mất đồ bình tĩnh, gặp riêng. Trấn an cả lớp, giữ trật tự, KHÔNG khám xét công khai." },
            { step: 2, title: "Thu thập thông tin", content: "Hỏi kỹ đặc điểm món đồ, thời gian, vị trí. Quan sát biểu hiện bất thường." },
            { step: 3, title: "Phân tích tâm lý", content: "Lưu ý các HS có số 5 (tò mò/bốc đồng) hoặc số 8 (thích sở hữu) đang có vấn đề tâm lý." },
            { step: 4, title: "Xử lý kín đáo", content: "Tạo cơ hội 'trả lại trong danh dự' (đặt lại trên bàn GV khi hết giờ). Không truy cứu nếu đồ vật quay lại." },
            { step: 5, title: "Phục hồi lòng tin", content: "Không nhắc lại sự việc. Giáo dục chung về sự trung thực." }
        ]
    },
    conflict: [
        { pair: "Số 1, 8 (Lãnh đạo)", method: "Tách riêng. Nói về 'Trách nhiệm người dẫn đầu'. Yêu cầu mỗi bên đưa giải pháp 'Cùng thắng'." },
        { pair: "Số 2, 6, 9 (Tình cảm)", method: "Tạo không gian an toàn để nói ra cảm xúc. GV đóng vai trò người lắng nghe, kết nối sự thấu cảm." },
        { pair: "Số 3, 5 (Hoạt ngôn)", method: "Can thiệp nhanh, dùng sự hài hước giảm căng thẳng. Nhấn mạnh ranh giới giữa đùa vui và xúc phạm." },
        { pair: "Số 4, 7 (Logic)", method: "Yêu cầu trình bày lại sự việc theo góc nhìn logic. Chỉ ra các điểm phi lý trong lập luận của cả hai." }
    ],
    psychology_checklist: [
        "Thay đổi hành vi: Trầm mặc hoặc hiếu động bất thường, hay cáu gắt.",
        "Sa sút học tập: Điểm kém đột ngột, mất tập trung, ngủ gật.",
        "Thể chất: Mệt mỏi, sụt cân/tăng cân, đau đầu/bụng không rõ nguyên nhân.",
        "Xã hội: Tách mình khỏi bạn bè, biểu hiện tiêu cực trên MXH."
    ]
};

export const SEATING_STRATEGIES = [
    { type: "A", name: "Theo Thần số học", desc: "Ghép cặp tương hợp (1-5, 2-4, 3-6). Giảm xung đột, tăng vui vẻ.", pros: "Không khí lớp tốt.", cons: "Dễ nói chuyện riêng." },
    { type: "B", name: "Theo Năng lực", desc: "Ghép Giỏi + Yếu/Trung bình (Đôi bạn cùng tiến).", pros: "Hỗ trợ học tập.", cons: "HS giỏi có thể thấy phiền." },
    { type: "C", name: "Theo Thể chất", desc: "Ưu tiên thị lực kém, chiều cao, khuyết tật ngồi bàn đầu/ngoài.", pros: "Đảm bảo sức khỏe.", cons: "Ít linh hoạt." },
    { type: "D", name: "Hỗn hợp (Tối ưu)", desc: "Dùng C làm nền -> Kết hợp A và B cho các vị trí còn lại.", pros: "Toàn diện nhất.", cons: "Cần GVCN phân tích kỹ." }
];

export const COMMITTEE_ROLES = [
    { role: "Lớp trưởng", numbers: [1, 8], traits: "Tiên phong, Quyết đoán, Chịu áp lực, Có uy." },
    { role: "Bí thư / LĐ", numbers: [2, 6, 9], traits: "Kết nối, Quan tâm, Chăm sóc, Hướng về tập thể." },
    { role: "Văn thể / Truyền thông", numbers: [3, 5], traits: "Sáng tạo, Hoạt ngôn, Năng động, Nhiều ý tưởng." },
    { role: "Học tập / Thư ký", numbers: [4, 7], traits: "Cẩn thận, Logic, Chi tiết, Ham học hỏi." }
];