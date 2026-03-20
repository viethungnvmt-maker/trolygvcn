
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Student, GeneratedEmail, GenerationConfig } from '../types';
import { Upload, FileSpreadsheet, Play, Check, AlertCircle, Loader2, Download, SlidersHorizontal, FileText, File, FileType, CheckCircle as IconCheckCircle, XCircle, ArrowRight, Sparkles, Table as TableIcon, BrainCircuit, Lightbulb, Target } from 'lucide-react';
import { generateEmailContent, generateStudentReport, extractStudentListFromFiles } from '../services/geminiService';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, BorderStyle, VerticalAlign } from 'docx';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useAuth } from '../contexts/AuthContext';
import saveAs from 'file-saver';

interface BatchUploadProps {
    onBatchComplete: (emails: GeneratedEmail[]) => void;
}

const BatchUpload: React.FC<BatchUploadProps> = ({ onBatchComplete }) => {
    const { apiKey, selectedModel, setIsSettingsOpen } = useApiKey();
    const { user } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [processing, setProcessing] = useState(false);
    const [analyzingFile, setAnalyzingFile] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
    const [generatedReports, setGeneratedReports] = useState<{id: string, report: string, status: 'success'|'error', error?: string}[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Global config for the batch
    const [config, setConfig] = useState<GenerationConfig>({
        tone: 'friendly',
        scenario: 'general',
        customTone: ''
    });

    const handleConfigChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!apiKey) {
            setIsSettingsOpen(true);
            // Clear input so change event triggers again
            e.target.value = "";
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setStudents([]);
        setAnalyzingFile(true);

        try {
            let extractedStudents: Student[] = [];

            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                extractedStudents = await processExcelFile(file);
            } else if (file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
                 extractedStudents = await processPdfFile(file); 
            } else {
                throw new Error("Định dạng file không được hỗ trợ.");
            }

            if (extractedStudents.length === 0) {
                setError("Không tìm thấy dữ liệu học sinh nào trong file.");
            } else {
                setStudents(extractedStudents);
                setGeneratedEmails([]);
                setGeneratedReports([]);
                setProgress(0);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Lỗi khi phân tích file.");
        } finally {
            setAnalyzingFile(false);
        }
    };

    const processExcelFile = (file: File): Promise<Student[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const bstr = event.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const csv = XLSX.utils.sheet_to_csv(ws);
                    const results = await extractStudentListFromFiles(csv, 'text/csv', apiKey, selectedModel);
                    resolve(results);
                } catch (e) {
                    reject(e);
                }
            };
            reader.readAsBinaryString(file);
        });
    }

    const processPdfFile = (file: File): Promise<Student[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const base64String = (event.target?.result as string).split(',')[1];
                    let mimeType = file.type;
                    if(!mimeType) {
                        if(file.name.endsWith('.pdf')) mimeType = 'application/pdf';
                        else if(file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    }
                    const results = await extractStudentListFromFiles(base64String, mimeType, apiKey, selectedModel);
                    resolve(results);
                } catch (e) {
                    reject(e);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    const processBatch = async () => {
        if(!apiKey) { setIsSettingsOpen(true); return; }

        setProcessing(true);
        setProgress(0);
        const emailResults: GeneratedEmail[] = [];
        const reportResults: {id: string, report: string, status: 'success'|'error', error?: string}[] = [];
        
        // Initialize report states properly
        setGeneratedReports(students.map(s => ({ id: s.id, report: '', status: 'loading' as any })));

        for (let i = 0; i < students.length; i++) {
            try {
                // Generate detailed report (Comment)
                const report = await generateStudentReport(
                    students[i], 
                    config, 
                    apiKey, 
                    selectedModel,
                    user?.fullName,
                    user?.title
                );
                
                const reportEntry = { id: students[i].id, report, status: 'success' as const };
                reportResults.push(reportEntry);
                
                // Update specific item state
                setGeneratedReports(prev => [
                    ...prev.filter(p => p.id !== students[i].id),
                    reportEntry
                ]);

                // Generate Email Subject (optional, we keep it for preview consistency)
                const email = await generateEmailContent(
                    students[i], 
                    config, 
                    apiKey, 
                    selectedModel,
                    user?.fullName,
                    user?.title
                );
                emailResults.push(email);

            } catch (err: any) {
                console.error(`Error processing student ${students[i].name}:`, err);
                const errorMessage = err.message || "Lỗi không xác định";
                
                // Update item with error
                setGeneratedReports(prev => [
                    ...prev.filter(p => p.id !== students[i].id),
                    { id: students[i].id, report: errorMessage, status: 'error', error: errorMessage }
                ]);

                // If it's a critical error like Invalid Key, we should probably stop the batch
                if (errorMessage.includes("API Key không hợp lệ")) {
                    setError("Quy trình đã dừng: API Key không hợp lệ.");
                    break;
                }
            }

            setProgress(Math.round(((i + 1) / students.length) * 100));
            // Small delay to avoid aggressive rate limits even with fallback
            await new Promise(r => setTimeout(r, 1000));
        }

        setGeneratedEmails(emailResults);
        setProcessing(false);
        onBatchComplete(emailResults);
    };

    const downloadDocx = () => {
        const validReports = generatedReports.filter(r => r.status === 'success');
        if (validReports.length === 0) return;

        // Create table rows for each student
        const tables = students
            .filter(s => validReports.some(r => r.id === s.id))
            .map(student => {
            const reportData = validReports.find(r => r.id === student.id);
            if (!reportData) return [];

            const report = reportData.report;
            
            // Format scores for display
            const scoresText = student.detailedScores 
                ? Object.entries(student.detailedScores).map(([k, v]) => `${k}: ${v}`).join(" | ")
                : "Không có dữ liệu điểm";

            const reportParagraphs = report.split('\n').map(line => {
                const cleanLine = line.trim();
                if (!cleanLine) return null; 
                return new Paragraph({ 
                    text: cleanLine,
                    spacing: { after: 120, before: 120 }, 
                    alignment: AlignmentType.JUSTIFIED
                });
            }).filter(Boolean) as Paragraph[];

            return [
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 4, color: "008080" },
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: "008080" },
                        left: { style: BorderStyle.SINGLE, size: 4, color: "008080" },
                        right: { style: BorderStyle.SINGLE, size: 4, color: "008080" },
                        insideHorizontal: { style: BorderStyle.DOTTED, size: 2, color: "aaaaaa" },
                        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "008080" }
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: `HỌC SINH: ${student.name.toUpperCase()}`, bold: true, size: 28, color: "FFFFFF" })],
                                        alignment: AlignmentType.CENTER
                                    })],
                                    columnSpan: 2,
                                    shading: { fill: "008080" }, // Dark Teal Background
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                            ],
                        }),
                         new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "THÔNG TIN", bold: true, color: "005555" })] 
                                    })],
                                    width: { size: 20, type: WidthType.PERCENTAGE },
                                    shading: { fill: "E0F2F1" },
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                                new TableCell({
                                    children: [new Paragraph({
                                        text: `Lớp: ${student.className || '...'}  |  Ngày sinh: ${student.dob || '...'}`,
                                        alignment: AlignmentType.LEFT
                                    })],
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "ĐIỂM SỐ", bold: true, color: "005555" })] 
                                    })],
                                    shading: { fill: "E0F2F1" },
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                                new TableCell({
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: scoresText, italics: true })]
                                    })],
                                    verticalAlign: VerticalAlign.CENTER,
                                }),
                            ],
                        }),
                         new TableRow({
                            children: [
                                new TableCell({
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: "NHẬN XÉT CỦA GVCN", bold: true, color: "005555" })] 
                                    })],
                                    columnSpan: 2,
                                    shading: { fill: "B2DFDB" } // Medium Teal
                                }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        ...reportParagraphs
                                    ],
                                    columnSpan: 2,
                                    margins: { top: 200, bottom: 200, left: 200, right: 200 }
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "", spacing: { after: 800 } })
            ];
        }).flat();

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "SỔ NHẬN XÉT HỌC SINH", bold: true, size: 48, color: "008080" })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 600 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ 
                                text: `Giáo viên chủ nhiệm: ${user?.title || ''} ${user?.fullName || ''}`, 
                                bold: true, 
                                size: 28, 
                                color: "333333" 
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, italics: true, size: 24, color: "666666" })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 800 }
                    }),
                    ...tables
                ],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `Nhan_Xet_Lop_${new Date().toISOString().slice(0,10)}.docx`);
        });
    };

    // --- LANDING VIEW (Empty State) ---
    const renderLandingView = () => (
        <div className="flex flex-col gap-8 animate-fade-in-up">
            {/* HERO SECTION */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-3xl p-8 md:p-10 text-white shadow-xl shadow-teal-200/50 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="relative z-10 max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                        Khám phá "Bản đồ Tâm lý" Học sinh
                    </h2>
                    <p className="text-teal-50 text-lg mb-8 leading-relaxed max-w-2xl">
                        Tải lên danh sách (Excel/PDF) có Ngày Sinh. AI sẽ tính toán các chỉ số Thần số học và đưa ra lời khuyên giáo dục sâu sắc cho từng em.
                    </p>

                    {/* COMPACT INSTRUCTION */}
                    <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-8 flex items-start gap-4 max-w-2xl backdrop-blur-sm">
                        <div className="p-2 bg-white/20 rounded-lg shrink-0">
                            <FileSpreadsheet size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm mb-1 uppercase tracking-wider">Mẫu Excel nhập vào</h3>
                            <p className="text-teal-50 text-sm">
                                Cần file có các cột: <span className="font-bold text-white">STT, Họ tên, Ngày sinh, Lớp, Điểm môn học, có thể bổ sung thêm số ngày nghỉ, Vi phạm, Khen thưởng </span>.
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-teal-700 hover:bg-teal-50 px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 group"
                    >
                        {analyzingFile ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
                        <span>Tải danh sách học sinh ngay</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept=".xlsx, .xls, .pdf, .docx, .doc" 
                        onChange={handleFileUpload}
                        disabled={analyzingFile}
                    />
                </div>
            </div>
        </div>
    );

    // If no students loaded, show Landing View. Otherwise show standard interface
    if (students.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-teal-100/50 min-h-full">
                {error && (
                    <div className="mb-6 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200 font-semibold animate-fade-in">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
                {renderLandingView()}
            </div>
        );
    }

    // --- ACTIVE WORKSPACE VIEW (File Loaded) ---
    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-teal-100/50">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <FileSpreadsheet size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Tải lên Bảng điểm & Sinh Nhận Xét</h2>
            </div>

            {/* Batch Configuration */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 mb-6">
                <div className="flex items-center gap-2 mb-4 text-blue-800 font-semibold text-sm">
                    <SlidersHorizontal size={16} />
                    <span>Cấu hình chung cho cả lớp</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-blue-700/70 uppercase tracking-wide">Giọng văn nhận xét</label>
                        <select 
                            name="tone" 
                            value={config.tone}
                            onChange={handleConfigChange}
                            className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-lg text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="friendly">Thân mật & Ấm áp</option>
                            <option value="professional">Chuyên nghiệp & Trang trọng</option>
                            <option value="cheerful">Vui vẻ & Hào hứng</option>
                            <option value="encouraging">Khích lệ & Động viên</option>
                            <option value="critical">Thẳng thắn nêu khuyết điểm, phê bình và động viên</option>
                            <option value="other">📝 Giọng văn khác (Tự nhập)</option>
                        </select>
                    </div>

                    {/* Custom Tone Input */}
                    {config.tone === 'other' && (
                        <div className="animate-fade-in-up">
                            <label className="text-xs font-bold text-blue-700/70 uppercase tracking-wide block mb-1">Mô tả giọng văn mong muốn</label>
                            <div className="flex gap-2">
                                <input
                                    name="customTone"
                                    value={config.customTone || ''}
                                    onChange={handleConfigChange}
                                    placeholder="VD: Hài hước, nghiêm khắc nhưng tình cảm, giống văn phong thầy cô..."
                                    className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center shadow-sm" title="Đã xác nhận">
                                    <Check size={16} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Re-upload Area */}
            <div className="mb-6 flex justify-end">
                <button 
                    onClick={() => {
                        setStudents([]);
                        setGeneratedReports([]);
                        // Reset file input if needed
                        if(fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-sm text-slate-500 hover:text-red-500 underline flex items-center gap-1"
                >
                    <XCircle size={14} /> Xóa danh sách & Tải lại
                </button>
            </div>

            {/* Student List Preview */}
            {students.length > 0 && (
                <div className="mb-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                             <Check className="text-green-500" size={16}/>
                             Đã tìm thấy: {students.length} học sinh
                        </span>
                        {processing && <span className="text-sm text-teal-600 font-bold animate-pulse">{progress}% Hoàn thành</span>}
                    </div>
                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white shadow-inner">
                        {students.map((s, idx) => {
                            const reportState = generatedReports.find(r => r.id === s.id);
                            const hasError = reportState?.status === 'error';
                            const isSuccess = reportState?.status === 'success';

                            return (
                                <div key={idx} className={`px-4 py-3 text-sm flex justify-between items-center hover:bg-slate-50
                                    ${hasError ? 'bg-red-50' : ''}`}>
                                    <div className="flex flex-col">
                                        <span className={`font-medium ${hasError ? 'text-red-700' : 'text-slate-800'}`}>
                                            {s.name}
                                        </span>
                                        <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                                            {hasError 
                                                ? <span className="text-red-500 font-bold">{reportState.error}</span>
                                                : <span>{s.className} • {s.detailedScores ? Object.keys(s.detailedScores).length : 0} cột điểm • DOB: {s.dob || 'N/A'}</span>
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        {isSuccess && <IconCheckCircle className="text-emerald-500" size={18} />}
                                        {hasError && <XCircle className="text-red-500" size={18} />}
                                        {!isSuccess && !hasError && processing && <Loader2 className="animate-spin text-slate-300" size={16} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={processBatch}
                    disabled={students.length === 0 || processing || analyzingFile}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold transition shadow-md hover:shadow-lg
                    ${students.length === 0 || processing || analyzingFile
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:scale-[0.99]'
                        }`}
                >
                    {processing ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Đang viết từng em...</span>
                        </>
                    ) : (
                        <>
                            <Play size={20} />
                            <span>BẮT ĐẦU TẠO ({students.length})</span>
                        </>
                    )}
                </button>

                {generatedReports.some(r => r.status === 'success') && !processing && (
                    <button
                        onClick={downloadDocx}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-md hover:shadow-lg"
                    >
                        <FileText size={20} />
                        <span>Xuất file Word (.docx)</span>
                    </button>
                )}
            </div>
            
            {/* Reports Preview - Only Success Ones */}
            {generatedReports.some(r => r.status === 'success') && !processing && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Xem trước ({generatedReports.filter(r => r.status === 'success').length})</h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-64 overflow-y-auto space-y-3">
                        {generatedReports.filter(r => r.status === 'success').map((report, idx) => (
                             <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                                <div className="font-bold text-teal-800 text-sm mb-2 border-b border-slate-50 pb-2">{students.find(s=>s.id === report.id)?.name}</div>
                                <div className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{report.report}</div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchUpload;
