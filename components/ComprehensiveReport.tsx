
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useAuth } from '../contexts/AuthContext';
import { extractStudentListFromFiles, generateClassReportAssessment } from '../services/geminiService';
import { BarChart, PieChart, FileSpreadsheet, Upload, Loader2, Sparkles, AlertCircle, FileText, CheckCircle, Trophy, User, Calendar, Activity, XCircle, Download, Target, ThumbsUp, Frown, Meh, Star } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import saveAs from 'file-saver';

const ComprehensiveReport: React.FC = () => {
    const { apiKey, selectedModel, setIsSettingsOpen } = useApiKey();
    const { user } = useAuth();
    
    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAssessment, setAiAssessment] = useState('');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- HELPER FUNCTIONS FOR CLASSIFICATION ---
    const getAcademicRank = (score: number) => {
        if (score >= 8.0) return 'Giỏi';
        if (score >= 6.5) return 'Khá';
        if (score >= 5.0) return 'TB';
        return 'Yếu';
    };

    const getConductRank = (conduct: string) => {
        const c = conduct.toLowerCase();
        if (c.includes('tốt') || c.includes('tot')) return 'Tốt';
        if (c.includes('khá') || c.includes('kha')) return 'Khá';
        if (c.includes('trung bình') || c.includes('tb')) return 'TB';
        if (c.includes('yếu') || c.includes('yeu')) return 'Yếu';
        return 'Chưa XĐ';
    };

    // --- DERIVED STATISTICS ---
    const stats = useMemo(() => {
        if (students.length === 0) return null;

        const totalStudents = students.length;
        
        // Counters
        const academicCounts = { Giỏi: 0, Khá: 0, TB: 0, Yếu: 0 };
        const conductCounts = { Tốt: 0, Khá: 0, TB: 0, Yếu: 0 };
        
        // Matrix: [Academic][Conduct]
        const matrix: Record<string, Record<string, number>> = {
            'Giỏi': { 'Tốt': 0, 'Khá': 0, 'TB': 0, 'Yếu': 0 },
            'Khá': { 'Tốt': 0, 'Khá': 0, 'TB': 0, 'Yếu': 0 },
            'TB': { 'Tốt': 0, 'Khá': 0, 'TB': 0, 'Yếu': 0 },
            'Yếu': { 'Tốt': 0, 'Khá': 0, 'TB': 0, 'Yếu': 0 },
        };

        let totalScoreSum = 0;
        let validScoreCount = 0;
        let totalViolations = 0;
        let totalRewards = 0;
        let totalAbsence = 0;

        // KPI Badges
        let excellentStudents = 0; // Giỏi + HK Tốt
        let concernStudents = 0;   // Yếu hoặc HK Yếu

        students.forEach(s => {
            const score = s.averageScore || 0;
            const academicRank = getAcademicRank(score);
            const conductRank = getConductRank(s.conduct || '');

            // Academic Stats
            if (academicRank in academicCounts) academicCounts[academicRank as keyof typeof academicCounts]++;
            
            // Score Avg
            if (score > 0) {
                totalScoreSum += score;
                validScoreCount++;
            }

            // Conduct Stats
            if (conductRank in conductCounts) conductCounts[conductRank as keyof typeof conductCounts]++;

            // Matrix Population
            if (academicRank in matrix && conductRank in matrix[academicRank]) {
                matrix[academicRank][conductRank]++;
            }

            // KPIs
            if (academicRank === 'Giỏi' && conductRank === 'Tốt') excellentStudents++;
            if (academicRank === 'Yếu' || conductRank === 'Yếu') concernStudents++;

            totalViolations += s.violationCount || 0;
            totalRewards += (s.achievements?.length || 0);
            totalAbsence += s.absenceCount || 0;
        });

        const avgScore = validScoreCount > 0 ? (totalScoreSum / validScoreCount).toFixed(1) : "N/A";
        const avgAttendance = totalStudents > 0 ? (100 - ((totalAbsence / (totalStudents * 90)) * 100)).toFixed(1) : 100;

        return {
            totalStudents,
            academicCounts,
            conductCounts,
            matrix,
            excellentStudents,
            concernStudents,
            totalViolations,
            totalRewards,
            classAverageScore: avgScore,
            attendanceRate: avgAttendance
        };
    }, [students]);

    const topStudents = useMemo(() => {
        return [...students]
            .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
            .slice(0, 5);
    }, [students]);


    // Handlers
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!apiKey) { setIsSettingsOpen(true); return; }
        const file = e.target.files?.[0];
        if (!file) return;

        setStudents([]);
        setAiAssessment('');
        setError(null);
        setIsAnalyzing(true);

        try {
            let extractedStudents: Student[] = [];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                 const reader = new FileReader();
                 reader.onload = async (event) => {
                     const bstr = event.target?.result;
                     const wb = XLSX.read(bstr, { type: 'binary' });
                     const wsname = wb.SheetNames[0];
                     const ws = wb.Sheets[wsname];
                     const csv = XLSX.utils.sheet_to_csv(ws);
                     extractedStudents = await extractStudentListFromFiles(csv, 'text/csv', apiKey, selectedModel);
                     setStudents(extractedStudents);
                     setIsAnalyzing(false);
                 };
                 reader.readAsBinaryString(file);
            } else {
                 throw new Error("Vui lòng tải lên file Excel (.xlsx, .xls) để có dữ liệu chính xác nhất.");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Lỗi xử lý file.");
            setIsAnalyzing(false);
        }
    };

    const handleGenerateAiAssessment = async () => {
        if (!apiKey || !stats) return;
        setIsGeneratingAi(true);
        try {
            // Transform stats for AI prompt
            const simpleStats = {
                totalStudents: stats.totalStudents,
                excellent: stats.academicCounts.Giỏi,
                good: stats.academicCounts.Khá,
                average: stats.academicCounts.TB,
                weak: stats.academicCounts.Yếu,
                conductGood: stats.conductCounts.Tốt,
                totalViolations: stats.totalViolations,
                totalRewards: stats.totalRewards,
                classAverageScore: stats.classAverageScore
            };
            const text = await generateClassReportAssessment(simpleStats, topStudents, apiKey, selectedModel);
            setAiAssessment(text);
        } catch (e) {
            setError("Lỗi tạo đánh giá AI.");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleExportDocx = () => {
        if (!stats) return;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "BÁO CÁO TỔNG KẾT LỚP HỌC", bold: true, size: 36, color: "008080" })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [new TextRun({ text: `GVCN: ${user?.title || ''} ${user?.fullName || ''}`, bold: true, size: 24 })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // Stats Table
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({ children: [
                                new TableCell({ children: [new Paragraph(`Sĩ số: ${stats.totalStudents}`)] }),
                                new TableCell({ children: [new Paragraph(`Giỏi: ${stats.academicCounts.Giỏi} (${((stats.academicCounts.Giỏi/stats.totalStudents)*100).toFixed(0)}%)`)] }),
                                new TableCell({ children: [new Paragraph(`TB Lớp: ${stats.classAverageScore}`)] }),
                            ]}),
                            new TableRow({ children: [
                                new TableCell({ children: [new Paragraph(`Khen thưởng: ${stats.totalRewards}`)] }),
                                new TableCell({ children: [new Paragraph(`Vi phạm: ${stats.totalViolations}`)] }),
                                new TableCell({ children: [new Paragraph(`Chuyên cần: ${stats.attendanceRate}%`)] }),
                            ]})
                        ]
                    }),

                    new Paragraph({ text: "", spacing: { after: 400 } }),
                    
                    new Paragraph({
                        children: [new TextRun({ text: "ĐÁNH GIÁ CỦA GVCN", bold: true, size: 28, color: "2E74B5" })],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [new TextRun(aiAssessment || "(Chưa có nội dung)")],
                        spacing: { after: 400 }
                    }),

                    new Paragraph({
                         children: [new TextRun({ text: "DANH SÁCH HỌC SINH TIÊU BIỂU", bold: true, size: 24 })],
                         spacing: { after: 200 }
                    }),
                    ...topStudents.map(s => new Paragraph({
                        text: `• ${s.name} - ĐTB: ${s.averageScore} - ${s.achievements?.join(', ') || 'Thành tích tốt'}`,
                        spacing: { after: 100 }
                    }))
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `Bao_Cao_Tong_Ket_${new Date().toISOString().slice(0,10)}.docx`);
        });
    };

    // --- CHART COMPONENTS ---

    const AcademicChart = () => {
        if (!stats || stats.totalStudents === 0) return null;
        const data = [
            { label: 'Giỏi', val: stats.academicCounts.Giỏi, color: 'from-green-500 to-green-300', icon: '🏆', textColor: 'text-green-700' },
            { label: 'Khá', val: stats.academicCounts.Khá, color: 'from-blue-500 to-blue-300', icon: '⭐', textColor: 'text-blue-700' },
            { label: 'TB', val: stats.academicCounts.TB, color: 'from-orange-400 to-yellow-300', icon: '📊', textColor: 'text-orange-700' },
            { label: 'Yếu', val: stats.academicCounts.Yếu, color: 'from-red-500 to-red-300', icon: '📉', textColor: 'text-red-700' },
        ];
        const max = Math.max(...data.map(d => d.val)) || 1;

        return (
            <div className="flex items-end justify-around h-56 gap-4 pt-8 px-4 border-b border-slate-200 pb-2">
                {data.map((item, idx) => {
                    const percent = ((item.val / stats.totalStudents) * 100).toFixed(0);
                    return (
                        <div key={idx} className="flex flex-col items-center gap-2 w-1/4 group relative">
                            {/* Icon Top */}
                            <span className="text-2xl mb-1 filter drop-shadow-sm animate-bounce-slow">{item.icon}</span>
                            
                            {/* Value Label */}
                            <span className={`text-sm font-bold text-slate-700 transition-all ${item.val > 0 ? 'opacity-100' : 'opacity-50'}`}>
                                {item.val} <span className="text-xs font-normal text-slate-500">({percent}%)</span>
                            </span>
                            
                            {/* Bar */}
                            <div 
                                className={`w-full max-w-[60px] rounded-t-lg bg-gradient-to-t ${item.color} shadow-md relative overflow-hidden group-hover:brightness-110 transition-all duration-500`} 
                                style={{height: `${Math.max(10, (item.val / max) * 100)}%`}}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                            </div>
                            
                            {/* Label Bottom */}
                            <span className={`text-sm font-extrabold uppercase tracking-wide mt-1 ${item.textColor}`}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const ConductChart = () => {
        if (!stats || stats.totalStudents === 0) return null;
        const data = [
            { label: 'Tốt', val: stats.conductCounts.Tốt, color: 'from-emerald-500 to-emerald-300', icon: '⭐', textColor: 'text-emerald-700' },
            { label: 'Khá', val: stats.conductCounts.Khá, color: 'from-sky-500 to-sky-300', icon: '👍', textColor: 'text-sky-700' },
            { label: 'TB', val: stats.conductCounts.TB, color: 'from-yellow-400 to-yellow-200', icon: '😐', textColor: 'text-yellow-700' },
            { label: 'Yếu', val: stats.conductCounts.Yếu, color: 'from-rose-500 to-rose-300', icon: '😟', textColor: 'text-rose-700' },
        ];
        const max = Math.max(...data.map(d => d.val)) || 1;

        return (
            <div className="flex items-end justify-around h-56 gap-4 pt-8 px-4 border-b border-slate-200 pb-2">
                {data.map((item, idx) => {
                    const percent = ((item.val / stats.totalStudents) * 100).toFixed(0);
                    return (
                        <div key={idx} className="flex flex-col items-center gap-2 w-1/4 group relative">
                            <span className="text-2xl mb-1 filter drop-shadow-sm">{item.icon}</span>
                            <span className={`text-sm font-bold text-slate-700 transition-all ${item.val > 0 ? 'opacity-100' : 'opacity-50'}`}>
                                {item.val} <span className="text-xs font-normal text-slate-500">({percent}%)</span>
                            </span>
                            <div 
                                className={`w-full max-w-[60px] rounded-t-lg bg-gradient-to-t ${item.color} shadow-md relative overflow-hidden group-hover:brightness-110 transition-all duration-500`} 
                                style={{height: `${Math.max(10, (item.val / max) * 100)}%`}}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                            </div>
                            <span className={`text-sm font-extrabold uppercase tracking-wide mt-1 ${item.textColor}`}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const MatrixHeatmap = () => {
        if (!stats) return null;
        const rows = ['Giỏi', 'Khá', 'TB', 'Yếu'];
        const cols = ['Tốt', 'Khá', 'TB', 'Yếu'];

        // Helper to get cell style based on value and type
        const getCellStyle = (row: string, col: string, val: number) => {
            if (val === 0) return 'bg-slate-50 text-slate-300'; // Empty
            
            // Ideal zone
            if ((row === 'Giỏi' || row === 'Khá') && col === 'Tốt') return 'bg-green-100 text-green-800 font-bold border border-green-200';
            
            // Warning zone (Good academic but bad conduct OR bad academic but good conduct)
            if (row === 'Giỏi' && (col === 'TB' || col === 'Yếu')) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            if ((row === 'TB' || row === 'Yếu') && col === 'Tốt') return 'bg-orange-100 text-orange-800 border border-orange-200';

            // Danger zone
            if (row === 'Yếu' && col === 'Yếu') return 'bg-red-100 text-red-800 font-bold border border-red-200';

            return 'bg-blue-50 text-blue-800'; // Standard
        };

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-slate-400 font-medium italic text-xs">Học lực \ Hạnh kiểm</th>
                            {cols.map(c => <th key={c} className="p-2 font-bold text-slate-600 bg-slate-100/50 rounded-t-lg">{c}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r}>
                                <td className="p-2 font-bold text-slate-600 bg-slate-100/50 rounded-l-lg">{r}</td>
                                {cols.map(c => {
                                    const val = stats.matrix[r][c];
                                    return (
                                        <td key={`${r}-${c}`} className="p-1">
                                            <div className={`py-3 rounded-lg transition-all hover:scale-105 cursor-default ${getCellStyle(r, c, val)}`}>
                                                {val > 0 ? `${val} HS` : '-'}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (students.length === 0 && !isAnalyzing) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-dashed border-teal-200 max-w-2xl w-full">
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 text-teal-600">
                        <FileText size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">Tạo Báo Cáo Tổng Hợp</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Tải lên bảng điểm Excel (có cột Điểm TB, Hạnh kiểm, Vi phạm...) để hệ thống tự động phân tích và tạo báo cáo tổng kết học kỳ chuyên nghiệp.
                    </p>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-teal-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition flex items-center justify-center gap-3 w-full sm:w-auto mx-auto"
                    >
                        <Upload size={20} />
                        Tải lên bảng điểm Excel
                    </button>
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
                </div>
            </div>
        );
    }

    if (isAnalyzing) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-teal-600">
                <Loader2 size={48} className="animate-spin mb-4" />
                <p className="text-lg font-bold">Đang phân tích dữ liệu...</p>
                <p className="text-sm opacity-70">Vui lòng đợi trong giây lát</p>
            </div>
        );
    }

    // Determine Avg Score Color
    const getAvgScoreColor = (scoreStr: string) => {
        const s = parseFloat(scoreStr);
        if (isNaN(s)) return 'from-gray-400 to-gray-600';
        if (s >= 8.0) return 'from-green-500 to-emerald-600';
        if (s >= 6.5) return 'from-blue-500 to-indigo-600';
        if (s >= 5.0) return 'from-orange-400 to-red-400';
        return 'from-red-600 to-rose-700';
    };

    return (
        <div className="h-full bg-slate-50 p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-100 rounded-lg text-teal-700">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Báo Cáo Tổng Kết Lớp Học</h2>
                            <p className="text-sm text-slate-500">{students.length} học sinh • Ngày xuất: {new Date().toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setStudents([]); setAiAssessment(''); }}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition"
                        >
                            Tải lại
                        </button>
                        <button 
                            onClick={handleExportDocx}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <Download size={18} /> Xuất Word
                        </button>
                    </div>
                </div>

                {/* OVERVIEW CARDS & BADGES */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Class Avg Score Card - Big Feature */}
                        <div className={`md:col-span-1 bg-gradient-to-br ${getAvgScoreColor(stats.classAverageScore)} text-white p-5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between`}>
                            <div className="absolute top-0 right-0 p-4 opacity-20"><Target size={64}/></div>
                            <div>
                                <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Điểm Trung Bình Lớp</p>
                                <h3 className="text-4xl font-extrabold">{stats.classAverageScore}</h3>
                            </div>
                            <div className="mt-4 inline-flex items-center gap-1 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                                {parseFloat(stats.classAverageScore) >= 8 ? 'Xếp loại: Tốt' : 'Cần cố gắng'}
                            </div>
                        </div>

                        {/* KPI Badges */}
                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full"><Trophy size={24}/></div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{stats.excellentStudents}</p>
                                    <p className="text-xs text-slate-500 uppercase font-bold">HS Xuất sắc (Giỏi + Tốt)</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-full"><AlertCircle size={24}/></div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{stats.concernStudents}</p>
                                    <p className="text-xs text-slate-500 uppercase font-bold">HS Cần quan tâm</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Activity size={24}/></div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-800">{stats.attendanceRate}%</p>
                                    <p className="text-xs text-slate-500 uppercase font-bold">Tỷ lệ chuyên cần</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MAIN ANALYSIS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Academic Spectrum */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <BarChart size={18} className="text-blue-600"/> Phổ điểm Học lực
                        </h3>
                        <AcademicChart />
                    </div>

                    {/* Conduct Spectrum */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <Star size={18} className="text-yellow-500"/> Phổ điểm Hạnh kiểm
                        </h3>
                        <ConductChart />
                    </div>
                </div>

                {/* ADVANCED MATRIX */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <Target size={18} className="text-red-500"/> Ma trận Học lực × Hạnh kiểm
                        </h3>
                        <span className="text-xs text-slate-400 italic hidden sm:block">Giúp GVCN nhận diện nhanh nhóm học sinh</span>
                    </div>
                    <MatrixHeatmap />
                    <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-center flex-wrap">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-200"></div> Lý tưởng</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-100 border border-yellow-200"></div> Cần lưu ý</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-100 border border-orange-200"></div> Cần can thiệp</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 border border-red-200"></div> Báo động</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Students */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <Trophy size={18} className="text-yellow-500"/> Học sinh tiêu biểu
                        </h3>
                        <div className="space-y-3">
                            {topStudents.map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm ${i===0?'bg-yellow-400':i===1?'bg-slate-400':'bg-orange-400'}`}>
                                            {i+1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                                            <p className="text-xs text-slate-500">{s.achievements && s.achievements.length > 0 ? s.achievements[0] : "Thành tích học tập tốt"}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-teal-700">{s.averageScore}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{s.conduct || 'Tốt'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assessment Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                                <Sparkles size={18} className="text-purple-500"/> Đánh giá của GVCN
                            </h3>
                            
                            <div className="flex-1 mb-4 relative">
                                <textarea 
                                    className="w-full h-full min-h-[250px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm leading-relaxed text-slate-700 resize-none"
                                    value={aiAssessment}
                                    onChange={(e) => setAiAssessment(e.target.value)}
                                    placeholder="Nhấn nút bên dưới để AI soạn thảo đánh giá tổng kết..."
                                />
                                {isGeneratingAi && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                        <Loader2 className="animate-spin text-teal-600" size={32} />
                                    </div>
                                )}
                            </div>
                            
                            <button 
                                onClick={handleGenerateAiAssessment}
                                disabled={isGeneratingAi}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                            >
                                <Sparkles size={18} />
                                {aiAssessment ? "Viết lại đánh giá" : "AI Soạn đánh giá"}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ComprehensiveReport;
