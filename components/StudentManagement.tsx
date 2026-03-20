
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Student, SavedClass, QuickNote } from '../types';
import { useApiKey } from '../contexts/ApiKeyContext';
import { useAuth } from '../contexts/AuthContext';
import { generatePersonalityAnalysis, extractStudentListFromFiles, exportStudentAnalysesToDocx, generateSolutionForStudent, exportSolutionToDocx, generateClassCommitteeSuggestion, generateSeatingArrangementSuggestion, generateDisciplinePlan, generateSpecialSituationPlan } from '../services/geminiService';
import { SPECIAL_SITUATIONS, SEATING_STRATEGIES, COMMITTEE_ROLES, VIOLATION_TYPES, SPECIAL_SITUATION_TYPES } from '../data/advancedManagementData';
import { Upload, BrainCircuit, Search, Crown, Loader2, AlertCircle, User, Activity, Sparkles, Target, Lightbulb, Home, Lock, Save, Folder, FolderOpen, ChevronRight, FileText, MessageSquare, ArrowRight, Copy, Download, FileSpreadsheet, Gavel, Award, AlertTriangle, Scale, Clock, ShieldAlert, Users, Grid, Zap, Calendar, Siren, CheckCircle, Trash2, XCircle, RefreshCw, Plus, UserPlus, X, CheckSquare, Square, MoreVertical, StickyNote } from 'lucide-react';
import DailyQuickNotes from './DailyQuickNotes';

const StudentManagement: React.FC = () => {
    const { apiKey, selectedModel, setIsSettingsOpen } = useApiKey();
    const { user } = useAuth();
    
    // Core State
    const [students, setStudents] = useState<Student[]>([]);
    const [analysisResults, setAnalysisResults] = useState<Record<string, string>>({});
    
    // UI State
    const [analyzingFile, setAnalyzingFile] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'upload' | 'folders' | 'class_detail' | 'student_detail' | 'quick_consult' | 'advanced_management' | 'daily_notes'>('upload');
    const [advancedModule, setAdvancedModule] = useState<'discipline' | 'special' | 'seating' | 'committee' | null>(null);
    
    // Advanced Management State
    const [advancedLoading, setAdvancedLoading] = useState(false);
    const [advancedResult, setAdvancedResult] = useState('');

    // Module 1 Specific State
    const [disciplineStudentName, setDisciplineStudentName] = useState('');
    const [disciplineStudentDob, setDisciplineStudentDob] = useState('');
    const [selectedViolation, setSelectedViolation] = useState('');
    const [customViolation, setCustomViolation] = useState('');
    const [disciplineResult, setDisciplineResult] = useState('');
    const [isGeneratingDiscipline, setIsGeneratingDiscipline] = useState(false);

    // Module 2 Specific State
    const [specialStudentName, setSpecialStudentName] = useState('');
    const [specialStudentDob, setSpecialStudentDob] = useState('');
    const [selectedSpecialSituation, setSelectedSpecialSituation] = useState('');
    const [customSpecialSituation, setCustomSpecialSituation] = useState('');
    const [specialResult, setSpecialResult] = useState('');
    const [isGeneratingSpecial, setIsGeneratingSpecial] = useState(false);

    // Folder/Saved State
    const [savedClasses, setSavedClasses] = useState<SavedClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Manage Students in Class State
    const [selectedStudentIdsForAction, setSelectedStudentIdsForAction] = useState<Set<string>>(new Set());
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [newStudentData, setNewStudentData] = useState({ name: '', dob: '', behavior: '' });

    // Problem Solving State (For Saved Students)
    const [teacherProblem, setTeacherProblem] = useState('');
    const [solution, setSolution] = useState('');
    const [isSolving, setIsSolving] = useState(false);

    // Quick Consult State
    const [quickName, setQuickName] = useState('');
    const [quickDob, setQuickDob] = useState('');
    const [quickType, setQuickType] = useState<'reward' | 'violation'>('violation');
    const [quickIssue, setQuickIssue] = useState('');
    const [quickAnalysis, setQuickAnalysis] = useState('');
    const [quickSolution, setQuickSolution] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('vip_saved_classes');
        if (saved) {
            try {
                setSavedClasses(JSON.parse(saved));
            } catch (e) {
                console.error("Error loading saved classes", e);
            }
        }
    }, []);

    // Helper to update persistent storage whenever savedClasses changes
    const updateStorage = (updatedClasses: SavedClass[]) => {
        setSavedClasses(updatedClasses);
        try {
            localStorage.setItem('vip_saved_classes', JSON.stringify(updatedClasses));
        } catch (e) {
            console.error("Lỗi khi lưu vào LocalStorage", e);
            alert("Bộ nhớ trình duyệt đã đầy hoặc gặp lỗi. Không thể lưu thay đổi.");
        }
    };

    const saveClassToStorage = () => {
        if (students.length === 0) return;
        
        // Determine class name
        const classNameRaw = students[0].className || 'Unknown';
        const year = new Date().getFullYear();
        let birthYear = '';
        if (students[0].dob) {
            const parts = students[0].dob.split('/');
            if (parts.length === 3) birthYear = parts[2];
        }

        const folderName = `Lớp ${classNameRaw} - ${birthYear ? birthYear : year}`;
        
        const newClass: SavedClass = {
            id: Date.now().toString(),
            name: folderName,
            students: students,
            analysisResults: analysisResults,
            createdAt: Date.now()
        };

        const updated = [...savedClasses, newClass];
        updateStorage(updated);
        
        // Switch view
        setViewMode('folders');
        setStudents([]);
        setAnalysisResults({});
        alert(`Đã lưu hồ sơ vào thư mục: ${folderName}`);
    };

    const deleteClass = (e: React.MouseEvent, classId: string) => {
        e.stopPropagation(); 
        e.preventDefault();
        
        const clsToDelete = savedClasses.find(c => c.id === classId);
        const confirmMsg = `XÁC NHẬN XÓA LỚP:\n\nBạn có chắc chắn muốn xóa hồ sơ "${clsToDelete?.name}" không?\n\nHành động này sẽ xóa vĩnh viễn dữ liệu của lớp này và không thể hoàn tác.`;

        if (window.confirm(confirmMsg)) {
            const updatedClasses = savedClasses.filter(c => c.id !== classId);
            updateStorage(updatedClasses);
            
            // Nếu lớp đang chọn bị xóa, reset state và quay về view folders
            if (selectedClassId === classId) {
                setSelectedClassId(null);
                setStudents([]);
                setAnalysisResults({});
                if (viewMode === 'class_detail' || viewMode === 'student_detail') {
                    setViewMode('folders');
                }
            }
        }
    };

    // --- STUDENT MANAGEMENT LOGIC (ADD/DELETE) ---

    const toggleStudentSelection = (id: string) => {
        const newSet = new Set(selectedStudentIdsForAction);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedStudentIdsForAction(newSet);
    };

    const toggleSelectAll = (currentStudents: Student[]) => {
        if (selectedStudentIdsForAction.size === currentStudents.length) {
            setSelectedStudentIdsForAction(new Set());
        } else {
            const allIds = new Set(currentStudents.map(s => s.id));
            setSelectedStudentIdsForAction(allIds);
        }
    };

    const deleteSelectedStudents = () => {
        if (selectedStudentIdsForAction.size === 0) {
            alert("Vui lòng chọn ít nhất một học sinh để xóa.");
            return;
        }
        if (!selectedClassId) {
            alert("Không xác định được lớp học hiện tại.");
            return;
        }

        if (window.confirm(`Bạn có chắc muốn xóa ${selectedStudentIdsForAction.size} học sinh đã chọn khỏi lớp?`)) {
            const updatedClasses = savedClasses.map(cls => {
                if (cls.id === selectedClassId) {
                    const newStudents = cls.students.filter(s => !selectedStudentIdsForAction.has(s.id));
                    return { ...cls, students: newStudents };
                }
                return cls;
            });
            updateStorage(updatedClasses);
            setSelectedStudentIdsForAction(new Set());
            // alert("Đã xóa học sinh thành công!");
        }
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassId || !newStudentData.name) return;

        const newStudent: Student = {
            id: `manual-${Date.now()}`,
            name: newStudentData.name,
            dob: newStudentData.dob,
            behavior: newStudentData.behavior,
            className: '' // Will inherit or leave blank
        };

        const updatedClasses = savedClasses.map(cls => {
            if (cls.id === selectedClassId) {
                // Also assign class name if the class has one commonly used
                const commonClassName = cls.students.length > 0 ? cls.students[0].className : '';
                newStudent.className = commonClassName;
                return { ...cls, students: [...cls.students, newStudent] };
            }
            return cls;
        });

        updateStorage(updatedClasses);
        setNewStudentData({ name: '', dob: '', behavior: '' });
        setIsAddStudentModalOpen(false);
    };

    // --- QUICK NOTE INTEGRATION ---
    const handleSaveQuickNoteToStudent = (note: QuickNote) => {
        const updatedClasses = savedClasses.map(cls => {
            if (cls.id === note.classId) {
                const updatedStudents = cls.students.map(std => {
                    if (std.id === note.studentId) {
                        // Create a formatted note string: [Date] [Type]: Content
                        const dateParts = note.date.split('-'); // YYYY-MM-DD
                        const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                        
                        const typeLabel = note.type === 'violation' ? 'Vi phạm' : 
                                          note.type === 'reward' ? 'Khen thưởng' :
                                          note.type === 'academic' ? 'Học tập' :
                                          note.type === 'parent_contact' ? 'Liên hệ PH' :
                                          note.type === 'psychology' ? 'Tâm lý' : 'Ghi chú';
                        
                        const newEntry = `[${formattedDate}] ${typeLabel}: ${note.content}`;
                        
                        // Append to 'notes' field
                        const currentNotes = std.notes ? std.notes + '\n\n' : '';
                        
                        return { ...std, notes: currentNotes + newEntry };
                    }
                    return std;
                });
                return { ...cls, students: updatedStudents };
            }
            return cls;
        });
        
        updateStorage(updatedClasses);
    };

    // ----------------------------------------------------

    const handleResetUpload = () => {
        setStudents([]);
        setAnalysisResults({});
        setViewMode('upload');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!apiKey) {
            setIsSettingsOpen(true);
            e.target.value = "";
            return;
        }

        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setStudents([]);
        setAnalysisResults({});
        setAnalyzingFile(true);
        setViewMode('upload'); // Ensure we are in upload view

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

    const handleAnalyzeAll = async () => {
        setError(null);
        if (user?.expiry !== 'VIP') {
            const msg = "Thầy cô cần nâng cấp tài khoản VIP để sử dụng tính năng này và không giới hạn thời gian sử dụng";
            setError(msg);
            window.alert(msg);
            return;
        }

        if(!apiKey) { setIsSettingsOpen(true); return; }
        setIsAnalyzing(true);
        
        for (const student of students) {
            if (analysisResults[student.id]) continue;
            try {
                const result = await generatePersonalityAnalysis(student, apiKey, selectedModel);
                setAnalysisResults(prev => ({...prev, [student.id]: result}));
            } catch (err) {
                console.error(err);
            }
            await new Promise(r => setTimeout(r, 500));
        }
        setIsAnalyzing(false);
    };

    const handleDownloadWord = () => {
         let currentStds = students;
         let currentAnls = analysisResults;
         let clsName = "Moi";

         if (viewMode === 'class_detail' && selectedClassId) {
             const cls = savedClasses.find(c => c.id === selectedClassId);
             if (cls) {
                 currentStds = cls.students;
                 currentAnls = cls.analysisResults;
                 clsName = cls.name;
             }
         }

         if (currentStds.length === 0) return;
         exportStudentAnalysesToDocx(currentStds, currentAnls, clsName);
    };

    // --- LOGIC FOR SAVED STUDENT CONSULTATION ---
    const handleSolveProblem = async () => {
        if (!apiKey || !teacherProblem.trim()) return;
        setIsSolving(true);
        
        // Identify current student context
        let currentStudent: Student | undefined;
        let currentAnalysis = "";

        if (viewMode === 'student_detail' && selectedClassId && selectedStudentId) {
             const cls = savedClasses.find(c => c.id === selectedClassId);
             currentStudent = cls?.students.find(s => s.id === selectedStudentId);
             currentAnalysis = cls?.analysisResults[selectedStudentId] || "";
        }

        if (currentStudent) {
            try {
                const res = await generateSolutionForStudent(currentStudent, currentAnalysis, teacherProblem, apiKey, selectedModel, 'other');
                setSolution(res);
            } catch (e) {
                setSolution("Có lỗi xảy ra khi tạo giải pháp.");
            }
        }
        setIsSolving(false);
    };

    // --- LOGIC FOR QUICK CONSULT ---
    const handleQuickConsult = async (e: React.FormEvent) => {
        e.preventDefault();

        // VIP CHECK: Kiểm tra quyền VIP
        if (user?.expiry !== 'VIP') {
            const msg = "Thầy cô cần nâng cấp tài khoản VIP để sử dụng tính năng này và không giới hạn thời gian sử dụng";
            setError(msg);
            window.alert(msg);
            return;
        }

        if (!apiKey) {
            setIsSettingsOpen(true);
            return;
        }
        setIsSolving(true);
        setQuickAnalysis('');
        setQuickSolution('');
        setError(null);

        const tempStudent: Student = {
            id: 'temp',
            name: quickName,
            dob: quickDob,
            className: 'N/A'
        };

        try {
            // Step 1: Analyze Personality
            const analysis = await generatePersonalityAnalysis(tempStudent, apiKey, selectedModel);
            setQuickAnalysis(analysis);

            // Step 2: Propose Solution based on Analysis
            const sol = await generateSolutionForStudent(tempStudent, analysis, quickIssue, apiKey, selectedModel, quickType);
            setQuickSolution(sol);

        } catch (error: any) {
            console.error(error);
            setError("Có lỗi xảy ra trong quá trình xử lý: " + (error.message || ""));
        } finally {
            setIsSolving(false);
        }
    };

    const handleDownloadQuickAnalysis = () => {
        if (!quickAnalysis || !quickName) return;
        const tempStudent: Student = {
            id: 'quick-consult',
            name: quickName,
            dob: quickDob,
            className: 'Tu_Van_Nhanh'
        };
        exportStudentAnalysesToDocx([tempStudent], {[tempStudent.id]: quickAnalysis}, "Tu_Van_Nhanh");
    };

    // --- LOGIC FOR ADVANCED MODULES ---

    const handleGenerateAdvanced = async (type: 'committee' | 'seating') => {
        if (user?.expiry !== 'VIP') {
            const msg = "Thầy cô cần nâng cấp tài khoản VIP để sử dụng tính năng này và không giới hạn thời gian sử dụng";
            setError(msg);
            window.alert(msg);
            return;
        }

        if (!apiKey) { setIsSettingsOpen(true); return; }
        
        let targetStudents = students;
        // If we are viewing a saved class, use those students
        if (viewMode === 'advanced_management' && selectedClassId) {
             const cls = savedClasses.find(c => c.id === selectedClassId);
             if (cls) targetStudents = cls.students;
        } else if (students.length === 0) {
            alert("Vui lòng tải lên danh sách học sinh hoặc chọn Lớp đã lưu trước!");
            return;
        }

        setAdvancedLoading(true);
        setAdvancedResult('');
        try {
            let res = '';
            if (type === 'committee') {
                res = await generateClassCommitteeSuggestion(targetStudents, apiKey, selectedModel);
            } else {
                res = await generateSeatingArrangementSuggestion(targetStudents, apiKey, selectedModel, "D. Kết hợp đa yếu tố (Tối ưu nhất)");
            }
            setAdvancedResult(res);
        } catch (e) {
            console.error(e);
            setAdvancedResult("Có lỗi xảy ra. Vui lòng thử lại.");
        } finally {
            setAdvancedLoading(false);
        }
    };

    const handleGenerateDiscipline = async () => {
        if (user?.expiry !== 'VIP') {
            const msg = "Thầy cô cần nâng cấp tài khoản VIP để sử dụng tính năng này và không giới hạn thời gian sử dụng";
            setError(msg);
            window.alert(msg);
            return;
        }

        if (!apiKey) { setIsSettingsOpen(true); return; }
        if (!disciplineStudentName || !disciplineStudentDob || !selectedViolation) return;

        const violationDetail = selectedViolation === 'khac' ? customViolation : VIOLATION_TYPES.find(v => v.value === selectedViolation)?.label;
        if (!violationDetail) return;

        setIsGeneratingDiscipline(true);
        setDisciplineResult('');
        try {
            const res = await generateDisciplinePlan(disciplineStudentName, disciplineStudentDob, violationDetail, apiKey, selectedModel);
            setDisciplineResult(res);
        } catch (e) {
            console.error(e);
            alert("Có lỗi xảy ra: " + (e as Error).message);
        } finally {
            setIsGeneratingDiscipline(false);
        }
    };

    const handleGenerateSpecial = async () => {
        if (user?.expiry !== 'VIP') {
            const msg = "Thầy cô cần nâng cấp tài khoản VIP để sử dụng tính năng này và không giới hạn thời gian sử dụng";
            setError(msg);
            window.alert(msg);
            return;
        }

        if (!apiKey) { setIsSettingsOpen(true); return; }
        if (!specialStudentName || !specialStudentDob || !selectedSpecialSituation) return;

        const situationDetail = selectedSpecialSituation === 'khac' ? customSpecialSituation : SPECIAL_SITUATION_TYPES.find(v => v.value === selectedSpecialSituation)?.label;
        if (!situationDetail) return;

        setIsGeneratingSpecial(true);
        setSpecialResult('');
        try {
            const res = await generateSpecialSituationPlan(specialStudentName, specialStudentDob, situationDetail, apiKey, selectedModel);
            setSpecialResult(res);
        } catch (e) {
            console.error(e);
            alert("Có lỗi xảy ra: " + (e as Error).message);
        } finally {
            setIsGeneratingSpecial(false);
        }
    };


    // --- RENDER HELPERS ---

    const renderFolderView = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
            {savedClasses.map(cls => (
                <div 
                    key={cls.id} 
                    className="relative group h-full hover:z-10 transition-all"
                >
                    {/* The Card */}
                    <div 
                        onClick={() => { 
                            setSelectedClassId(cls.id); 
                            setSelectedStudentIdsForAction(new Set()); 
                            if (viewMode !== 'advanced_management') setViewMode('class_detail'); 
                        }}
                        className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-5 cursor-pointer h-full flex flex-col justify-between
                            ${selectedClassId === cls.id ? 'border-teal-500 ring-2 ring-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-300'}`}
                    >
                        <div>
                            <div className="flex items-start justify-between gap-3 mb-4 relative">
                                <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                                    <FolderOpen size={28} />
                                </div>
                                <div className="flex gap-2">
                                    {selectedClassId === cls.id && <Award size={20} className="text-teal-600"/>}
                                    {/* Delete Button moved inside the card for better clickability */}
                                    <button 
                                        onClick={(e) => deleteClass(e, cls.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Xóa lớp này"
                                        type="button"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1" title={cls.name}>{cls.name}</h3>
                            <p className="text-xs text-slate-500 font-medium">{new Date(cls.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>

                        <div className="flex justify-between items-center text-sm text-slate-500 border-t border-slate-100 pt-4 mt-4">
                             <span className="flex items-center gap-1.5 font-medium"><User size={16}/> {cls.students.length} Học sinh</span>
                             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:bg-teal-50 transition-colors">
                                <ChevronRight size={18} />
                             </div>
                        </div>
                    </div>
                </div>
            ))}
            {savedClasses.length === 0 && (
                <div className="col-span-full text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Folder size={64} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Chưa có lớp nào được lưu.</p>
                    <p className="text-sm mt-1">Hãy tải lên danh sách và lưu lại để quản lý.</p>
                </div>
            )}
        </div>
    );

    const renderClassDetailView = () => {
        const currentClass = savedClasses.find(c => c.id === selectedClassId);
        if (!currentClass) return <div>Không tìm thấy lớp học.</div>;

        return (
            <div className="h-full flex flex-col animate-fade-in">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setViewMode('folders')} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{currentClass.name}</h2>
                        <p className="text-slate-500">{currentClass.students.length} học sinh</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap gap-2 mb-4">
                     <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition"
                    >
                        <UserPlus size={16} /> Thêm HS
                    </button>
                    <button
                         onClick={deleteSelectedStudents}
                         disabled={selectedStudentIdsForAction.size === 0}
                         className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition
                         ${selectedStudentIdsForAction.size > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-400'}`}
                    >
                        <Trash2 size={16} /> Xóa ({selectedStudentIdsForAction.size})
                    </button>
                     <button
                        onClick={handleDownloadWord}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition ml-auto"
                    >
                        <FileText size={16} /> Xuất Word
                    </button>
                </div>

                {/* Student List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudentIdsForAction.size === currentClass.students.length && currentClass.students.length > 0}
                                        onChange={() => toggleSelectAll(currentClass.students)}
                                    />
                                </th>
                                <th className="px-4 py-3">Họ và tên</th>
                                <th className="px-4 py-3">Ngày sinh</th>
                                <th className="px-4 py-3">Trạng thái Analysis</th>
                                <th className="px-4 py-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentClass.students.map((s) => {
                                const hasAnalysis = !!currentClass.analysisResults[s.id];
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => { setSelectedStudentId(s.id); setViewMode('student_detail'); }}>
                                        <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleStudentSelection(s.id); }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedStudentIdsForAction.has(s.id)}
                                                onChange={() => toggleStudentSelection(s.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{s.dob || '-'}</td>
                                        <td className="px-4 py-3">
                                            {hasAnalysis ?
                                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={12}/> Đã có</span> :
                                                <span className="text-slate-400 text-xs italic">Chưa phân tích</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button className="text-teal-600 hover:text-teal-800 font-bold text-xs">Chi tiết &gt;</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                 {/* Add Student Modal */}
                 {isAddStudentModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-fade-in-up">
                            <h3 className="font-bold text-lg mb-4">Thêm học sinh mới</h3>
                            <form onSubmit={handleAddStudent} className="space-y-4">
                                <input
                                    required
                                    placeholder="Họ và tên"
                                    value={newStudentData.name}
                                    onChange={e => setNewStudentData({...newStudentData, name: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <input
                                    placeholder="Ngày sinh (dd/mm/yyyy)"
                                    value={newStudentData.dob}
                                    onChange={e => setNewStudentData({...newStudentData, dob: e.target.value})}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Hủy</button>
                                    <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold">Thêm</button>
                                </div>
                            </form>
                        </div>
                    </div>
                 )}
            </div>
        );
    };

    const renderStudentDetailView = () => {
        const currentClass = savedClasses.find(c => c.id === selectedClassId);
        const student = currentClass?.students.find(s => s.id === selectedStudentId);
        const analysis = currentClass?.analysisResults[student?.id || ''];

        if (!student) return <div>Không tìm thấy thông tin học sinh.</div>;

        return (
            <div className="h-full flex flex-col animate-fade-in overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-4 mb-6 shrink-0">
                    <button onClick={() => setViewMode('class_detail')} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <ArrowRight className="rotate-180" size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                        <p className="text-slate-500">{currentClass?.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                    {/* Left: Analysis */}
                    <div className="space-y-6">
                         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-purple-500"/> Phân tích Thần số học</h3>
                            {analysis ? (
                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: analysis }} />
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    <p>Chưa có dữ liệu phân tích.</p>
                                    <button
                                        onClick={async () => {
                                            if(!apiKey) { setIsSettingsOpen(true); return; }
                                            const res = await generatePersonalityAnalysis(student, apiKey, selectedModel);
                                            // Simplistic update for local state
                                            const clsIdx = savedClasses.findIndex(c => c.id === selectedClassId);
                                            if(clsIdx >= 0) {
                                                const updatedCls = {...savedClasses[clsIdx]};
                                                updatedCls.analysisResults = {...updatedCls.analysisResults, [student.id]: res};
                                                const newClasses = [...savedClasses];
                                                newClasses[clsIdx] = updatedCls;
                                                updateStorage(newClasses);
                                            }
                                        }}
                                        className="mt-2 text-teal-600 font-bold hover:underline"
                                    >
                                        Phân tích ngay
                                    </button>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Right: Consultation */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-0">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageSquare className="text-blue-500"/> Trợ lý Sư phạm AI</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">Vấn đề cần tư vấn</label>
                                    <textarea
                                        value={teacherProblem}
                                        onChange={e => setTeacherProblem(e.target.value)}
                                        placeholder="VD: Em hay mất tập trung, nói chuyện riêng. Làm sao để nhắc nhở khéo léo?"
                                        rows={4}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleSolveProblem}
                                    disabled={isSolving || !teacherProblem}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-slate-300"
                                >
                                    {isSolving ? <Loader2 className="animate-spin" /> : <Lightbulb size={18} />}
                                    Tìm giải pháp
                                </button>
                            </div>

                            {solution && (
                                <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in-up">
                                    <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2"><CheckCircle size={18}/> Giải pháp đề xuất</h4>
                                    <div className="bg-green-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-line leading-relaxed border border-green-100">
                                        {solution}
                                    </div>
                                    <button
                                        onClick={() => exportSolutionToDocx(student.name, teacherProblem, solution)}
                                        className="mt-3 w-full py-2 border border-green-200 text-green-700 rounded-lg font-bold hover:bg-green-100 transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <FileText size={16} /> Tải giải pháp (.docx)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderQuickConsultView = () => (
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
            {/* Form */}
            <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit overflow-y-auto">
                <div className="flex items-center gap-3 mb-6 text-purple-700">
                    <div className="p-2 bg-purple-100 rounded-lg"><Zap size={24} /></div>
                    <h2 className="text-xl font-bold">Tư vấn Nhanh</h2>
                </div>
                
                <form onSubmit={handleQuickConsult} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Họ tên học sinh</label>
                        <input
                            required
                            value={quickName}
                            onChange={e => setQuickName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Nguyễn Văn A"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Ngày sinh (Quan trọng)</label>
                        <input
                            required
                            value={quickDob}
                            onChange={e => setQuickDob(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="dd/mm/yyyy"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Loại vấn đề</label>
                        <div className="flex gap-2">
                             <button type="button" onClick={() => setQuickType('violation')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${quickType === 'violation' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-500'}`}>Xử lý Vi phạm</button>
                             <button type="button" onClick={() => setQuickType('reward')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${quickType === 'reward' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500'}`}>Khen thưởng</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả chi tiết</label>
                        <textarea
                            required
                            value={quickIssue}
                            onChange={e => setQuickIssue(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder={quickType === 'violation' ? "VD: Hay nói chuyện riêng, lì lợm..." : "VD: Làm bài tốt nhưng nhút nhát..."}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSolving}
                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-md shadow-purple-200"
                    >
                        {isSolving ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        Phân tích & Tìm giải pháp
                    </button>
                </form>
            </div>

            {/* Result */}
            <div className="lg:col-span-8 h-full overflow-y-auto custom-scrollbar space-y-6 pb-10">
                {!quickAnalysis && !quickSolution && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <BrainCircuit size={64} className="mb-4 opacity-20" />
                        <p>Nhập thông tin bên trái để nhận tư vấn ngay lập tức.</p>
                    </div>
                )}

                {quickAnalysis && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><User size={20} className="text-teal-600"/> Phân tích Hồ sơ Tâm lý</h3>
                            <button onClick={handleDownloadQuickAnalysis} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><Download size={12}/> Lưu hồ sơ</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dangerouslySetInnerHTML={{ __html: quickAnalysis }} />
                    </div>
                )}

                {quickSolution && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Lightbulb size={20} className="text-yellow-500"/> Giải pháp Đề xuất</h3>
                        <div className="prose prose-sm max-w-none text-slate-700 bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                             <div style={{whiteSpace: 'pre-line'}}>{quickSolution}</div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={() => exportSolutionToDocx(quickName, quickIssue, quickSolution)}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                            >
                                Tải về máy
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAdvancedManagementView = () => (
        <div className="h-full flex flex-col animate-fade-in">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                 {[
                     { id: 'discipline', label: 'Xử lý Kỷ luật', icon: <Gavel size={20}/>, color: 'bg-red-100 text-red-700' },
                     { id: 'special', label: 'Tình huống Đặc biệt', icon: <ShieldAlert size={20}/>, color: 'bg-orange-100 text-orange-700' },
                     { id: 'seating', label: 'Sơ đồ Lớp học', icon: <Grid size={20}/>, color: 'bg-blue-100 text-blue-700' },
                     { id: 'committee', label: 'Ban Cán sự', icon: <Users size={20}/>, color: 'bg-teal-100 text-teal-700' },
                 ].map(item => (
                     <button
                        key={item.id}
                        onClick={() => { setAdvancedModule(item.id as any); setAdvancedResult(''); }}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 font-bold
                        ${advancedModule === item.id 
                            ? `${item.color} border-current ring-1 ring-current` 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                     >
                         {item.icon}
                         <span>{item.label}</span>
                     </button>
                 ))}
             </div>

             <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
                {!advancedModule && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <Crown size={64} className="mb-4 opacity-20 text-orange-400" />
                        <p className="font-bold text-slate-500">Chọn một module quản lý nâng cao ở trên.</p>
                        <p className="text-sm mt-1 text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Dành riêng cho tài khoản VIP</p>
                    </div>
                )}

                {advancedModule === 'discipline' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Gavel className="text-red-600"/> Quy trình Xử lý Kỷ luật Tích cực
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input value={disciplineStudentName} onChange={e => setDisciplineStudentName(e.target.value)} placeholder="Tên học sinh" className="px-4 py-2 border rounded-lg"/>
                            <input value={disciplineStudentDob} onChange={e => setDisciplineStudentDob(e.target.value)} placeholder="Ngày sinh (dd/mm/yyyy)" className="px-4 py-2 border rounded-lg"/>
                        </div>
                        <select value={selectedViolation} onChange={e => setSelectedViolation(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                            <option value="">-- Chọn hành vi vi phạm --</option>
                            {VIOLATION_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                        </select>
                        {selectedViolation === 'khac' && (
                            <input value={customViolation} onChange={e => setCustomViolation(e.target.value)} placeholder="Mô tả hành vi..." className="w-full px-4 py-2 border rounded-lg"/>
                        )}
                        <button onClick={handleGenerateDiscipline} disabled={isGeneratingDiscipline} className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex justify-center gap-2">
                            {isGeneratingDiscipline ? <Loader2 className="animate-spin"/> : <Zap/>} Tạo Quy trình Xử lý
                        </button>
                        {disciplineResult && <div className="mt-6 prose prose-sm max-w-none bg-slate-50 p-6 rounded-xl border border-slate-200" dangerouslySetInnerHTML={{ __html: disciplineResult }} />}
                    </div>
                )}

                {advancedModule === 'special' && (
                     <div className="max-w-2xl mx-auto space-y-6">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ShieldAlert className="text-orange-600"/> Xử lý Tình huống Đặc biệt (Khủng hoảng)
                        </h3>
                         <div className="grid grid-cols-2 gap-4">
                            <input value={specialStudentName} onChange={e => setSpecialStudentName(e.target.value)} placeholder="Tên học sinh" className="px-4 py-2 border rounded-lg"/>
                            <input value={specialStudentDob} onChange={e => setSpecialStudentDob(e.target.value)} placeholder="Ngày sinh (dd/mm/yyyy)" className="px-4 py-2 border rounded-lg"/>
                        </div>
                         <select value={selectedSpecialSituation} onChange={e => setSelectedSpecialSituation(e.target.value)} className="w-full px-4 py-2 border rounded-lg">
                            <option value="">-- Chọn tình huống --</option>
                            {SPECIAL_SITUATION_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                        </select>
                        {selectedSpecialSituation === 'khac' && (
                            <input value={customSpecialSituation} onChange={e => setCustomSpecialSituation(e.target.value)} placeholder="Mô tả tình huống..." className="w-full px-4 py-2 border rounded-lg"/>
                        )}
                        <button onClick={handleGenerateSpecial} disabled={isGeneratingSpecial} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex justify-center gap-2">
                            {isGeneratingSpecial ? <Loader2 className="animate-spin"/> : <Siren/>} Lập Kế hoạch Ứng phó
                        </button>
                         {specialResult && <div className="mt-6 prose prose-sm max-w-none bg-slate-50 p-6 rounded-xl border border-slate-200" dangerouslySetInnerHTML={{ __html: specialResult }} />}
                     </div>
                )}

                {(advancedModule === 'seating' || advancedModule === 'committee') && (
                     <div className="max-w-3xl mx-auto space-y-6">
                         <div className="flex items-center justify-between">
                             <h3 className="text-xl font-bold text-slate-800">
                                 {advancedModule === 'seating' ? 'Sắp xếp Sơ đồ Lớp học' : 'Đề xuất Ban Cán sự'}
                             </h3>
                             <div className="text-sm text-slate-500">
                                 {selectedClassId 
                                    ? `Đang dùng danh sách lớp: ${savedClasses.find(c=>c.id === selectedClassId)?.name}` 
                                    : students.length > 0 ? `Đang dùng danh sách tải lên (${students.length} HS)` : <span className="text-red-500">Chưa có danh sách HS</span>}
                             </div>
                         </div>

                         {advancedModule === 'seating' && (
                             <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-200">
                                 <p className="font-bold mb-2">Chiến lược: Kết hợp Đa yếu tố (Tối ưu nhất)</p>
                                 <ul className="list-disc pl-5 space-y-1">
                                     <li>Thần số học: Ghép cặp bổ trợ tính cách (VD: Số 1 lãnh đạo + Số 9 hòa đồng).</li>
                                     <li>Năng lực: Đôi bạn cùng tiến.</li>
                                     <li>Thể chất: Ưu tiên thị lực/chiều cao.</li>
                                 </ul>
                             </div>
                         )}

                         <button 
                            onClick={() => handleGenerateAdvanced(advancedModule as 'committee'|'seating')}
                            disabled={advancedLoading || (students.length === 0 && !selectedClassId)}
                            className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-md flex items-center justify-center gap-2 disabled:bg-slate-300"
                         >
                             {advancedLoading ? <Loader2 className="animate-spin"/> : <Sparkles/>} 
                             {advancedModule === 'seating' ? 'Tạo Sơ đồ Chỗ ngồi' : 'Đề xuất Ban Cán sự'}
                         </button>

                         {advancedResult && (
                             <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in-up">
                                 <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                                     <span>Kết quả Đề xuất</span>
                                     <button className="text-blue-600 text-xs hover:underline">Sao chép</button>
                                 </div>
                                 <div className="p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: advancedResult }} />
                             </div>
                         )}
                     </div>
                )}
             </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* ... (Header) ... */}
            <div className="flex-none border-b border-slate-100 p-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setViewMode('upload')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2
                        ${viewMode === 'upload' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Upload size={16} /> Tải dữ liệu
                    </button>
                    <button 
                        onClick={() => setViewMode('folders')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2
                        ${(viewMode === 'folders' || viewMode === 'class_detail' || viewMode === 'student_detail') ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <FolderOpen size={16} /> Hồ sơ lớp ({savedClasses.length})
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-2"></div>
                    <button 
                        onClick={() => setViewMode('quick_consult')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2
                        ${viewMode === 'quick_consult' ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Zap size={16} /> Xử lý nhanh
                    </button>
                    <button 
                        onClick={() => setViewMode('advanced_management')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2
                        ${viewMode === 'advanced_management' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Crown size={16} className="text-orange-500"/> Quản lý cao cấp
                    </button>
                    <button 
                        onClick={() => setViewMode('daily_notes')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2
                        ${viewMode === 'daily_notes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <StickyNote size={16} /> Ghi chú nhanh
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-6 bg-slate-50/30">
                {viewMode === 'upload' && (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
                        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 w-full hover:border-teal-400 transition-colors group">
                             <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                 {analyzingFile ? <Loader2 className="animate-spin text-teal-600" size={32}/> : <Upload className="text-teal-600" size={32}/>}
                             </div>
                             
                             <h3 className="text-xl font-bold text-slate-800 mb-2">Tải lên danh sách học sinh</h3>
                             
                             <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-sm text-blue-800">
                                 <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 flex-wrap">
                                    <span className="font-bold flex items-center gap-1"><AlertCircle size={16}/> File Excel cần có cột:</span>
                                    <span className="font-semibold bg-white px-2 py-0.5 rounded border border-blue-200 shadow-sm">Họ và tên</span>
                                    <span className="font-semibold bg-white px-2 py-0.5 rounded border border-blue-200 shadow-sm">Ngày sinh (dd/mm/yyyy)</span>
                                    <span className="font-semibold bg-white px-2 py-0.5 rounded border border-blue-200 shadow-sm">Lớp</span>
                                 </div>
                             </div>
                             
                             <div className="relative">
                                 <input 
                                     type="file" 
                                     onChange={handleFileUpload}
                                     accept=".xlsx,.xls,.pdf,.docx,.doc"
                                     disabled={analyzingFile}
                                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                 />
                                 <button className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-200 pointer-events-none">
                                     {analyzingFile ? "Đang phân tích..." : "Chọn file từ máy tính"}
                                 </button>
                             </div>
                             
                             {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
                        </div>

                        {students.length > 0 && (
                            <div className="mt-8 w-full animate-fade-in-up">
                                <div className="mb-6 p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-teal-800 flex items-center gap-2"><Sparkles size={18} className="text-teal-600"/> Phân tích Thần số học & Tâm lý</h4>
                                        <p className="text-xs text-teal-600 mt-1">Phân tích sâu cho toàn bộ danh sách (Mất khoảng vài phút)</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleAnalyzeAll}
                                            disabled={isAnalyzing}
                                            className="bg-teal-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition shadow-md flex items-center gap-2 disabled:bg-slate-400"
                                        >
                                            {isAnalyzing ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                                            {isAnalyzing ? `Đang xử lý ${Object.keys(analysisResults).length}/${students.length}...` : "Phân tích ngay"}
                                        </button>

                                        {Object.keys(analysisResults).length > 0 && !isAnalyzing && (
                                            <button 
                                                onClick={handleDownloadWord}
                                                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2 animate-fade-in"
                                            >
                                                <FileText size={18} /> Tải báo cáo Word
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><CheckCircle size={18} className="text-green-500"/> Đã tìm thấy {students.length} học sinh</h3>
                                    <div className="flex gap-2">
                                        <button onClick={handleResetUpload} className="text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-medium">Hủy bỏ</button>
                                        <button 
                                            onClick={saveClassToStorage}
                                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
                                        >
                                            <Save size={16}/> Lưu hồ sơ lớp
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3">STT</th>
                                                <th className="px-4 py-3">Họ và tên</th>
                                                <th className="px-4 py-3">Ngày sinh</th>
                                                <th className="px-4 py-3">Lớp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {students.map((s, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition">
                                                    <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
                                                    <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                                                    <td className="px-4 py-2.5 text-slate-600">{s.dob || '-'}</td>
                                                    <td className="px-4 py-2.5 text-slate-600">{s.className || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'folders' && renderFolderView()}
                {viewMode === 'class_detail' && renderClassDetailView()}
                {viewMode === 'student_detail' && renderStudentDetailView()}
                {viewMode === 'quick_consult' && renderQuickConsultView()}
                {viewMode === 'advanced_management' && renderAdvancedManagementView()}
                {viewMode === 'daily_notes' && (
                    <DailyQuickNotes 
                        savedClasses={savedClasses} 
                        onSaveToStudent={handleSaveQuickNoteToStudent}
                    />
                )}
            </div>
        </div>
    );
};

export default StudentManagement;
