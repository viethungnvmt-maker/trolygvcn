
import React, { useState, useEffect } from 'react';
import { Student, NoteType, NoteSeverity, QuickNote, SavedClass } from '../types';
import { useApiKey } from '../contexts/ApiKeyContext';
import { suggestQuickNoteContent } from '../services/geminiService';
import { 
    Plus, Search, Filter, Calendar, User, Tag, Mic, AlertCircle, 
    Check, X, Sparkles, Clock, Trash2, Edit2, ChevronDown, 
    StickyNote, Zap, Heart, BookOpen, MessageSquare, AlertTriangle, School 
} from 'lucide-react';

interface DailyQuickNotesProps {
    savedClasses: SavedClass[];
    onSaveToStudent?: (note: QuickNote) => void;
}

const NOTE_TYPES: { type: NoteType; label: string; color: string; icon: React.ReactNode }[] = [
    { type: 'violation', label: 'Vi phạm', color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertTriangle size={16}/> },
    { type: 'reward', label: 'Khen thưởng', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Heart size={16}/> },
    { type: 'psychology', label: 'Tâm lý', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Zap size={16}/> },
    { type: 'academic', label: 'Học tập', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <BookOpen size={16}/> },
    { type: 'parent_contact', label: 'Liên hệ PHHS', color: 'bg-green-50 text-green-700 border-green-200', icon: <MessageSquare size={16}/> },
    { type: 'other', label: 'Khác', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: <StickyNote size={16}/> },
];

const SEVERITY_LEVELS: { level: NoteSeverity; label: string; color: string }[] = [
    { level: 'low', label: '🟢 Nhẹ', color: 'bg-green-100 text-green-800' },
    { level: 'medium', label: '🟡 Trung bình', color: 'bg-yellow-100 text-yellow-800' },
    { level: 'high', label: '🔴 Nặng', color: 'bg-red-100 text-red-800' },
];

// Helper to get local date in YYYY-MM-DD
const getLocalDateISO = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 10);
}

const DailyQuickNotes: React.FC<DailyQuickNotesProps> = ({ savedClasses, onSaveToStudent }) => {
    const { apiKey, selectedModel, setIsSettingsOpen } = useApiKey();

    // State
    const [notes, setNotes] = useState<QuickNote[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Filters - Default to Local Date
    const [filterDate, setFilterDate] = useState(getLocalDateISO());
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    
    // Form State
    const [currentNote, setCurrentNote] = useState<Partial<QuickNote>>({
        date: getLocalDateISO(),
        type: 'violation',
        severity: 'low',
        content: '',
        tags: [],
        classId: '',
        studentId: ''
    });
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Derived State for Form
    const currentClassStudents = savedClasses.find(c => c.id === currentNote.classId)?.students || [];

    // Load/Save Notes
    useEffect(() => {
        const saved = localStorage.getItem('daily_quick_notes');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load notes");
            }
        }
    }, []);

    const saveNotes = (updatedNotes: QuickNote[]) => {
        setNotes(updatedNotes);
        localStorage.setItem('daily_quick_notes', JSON.stringify(updatedNotes));
    };

    // --- HANDLERS ---

    const handleOpenModal = () => {
        // Pre-select the first class if available
        const defaultClassId = savedClasses.length > 0 ? savedClasses[0].id : '';
        
        setCurrentNote({
            id: undefined,
            date: getLocalDateISO(),
            type: 'violation',
            severity: 'low',
            content: '',
            classId: defaultClassId,
            studentId: '',
            tags: []
        });
        setSuggestions([]);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSaveNote = () => {
        if (!currentNote.classId || !currentNote.studentId || !currentNote.content) {
            alert("Vui lòng chọn Lớp, Học sinh và nhập nội dung.");
            return;
        }

        const selectedClass = savedClasses.find(c => c.id === currentNote.classId);
        const student = selectedClass?.students.find(s => s.id === currentNote.studentId);
        
        if (!selectedClass || !student) return;

        const newNote: QuickNote = {
            id: currentNote.id || Date.now().toString(),
            classId: currentNote.classId,
            className: selectedClass.name,
            studentId: currentNote.studentId,
            studentName: student.name,
            date: currentNote.date || getLocalDateISO(),
            type: currentNote.type as NoteType,
            content: currentNote.content,
            severity: currentNote.severity as NoteSeverity,
            tags: currentNote.tags,
            timestamp: Date.now()
        };

        let updatedNotes;
        if (currentNote.id) {
            updatedNotes = notes.map(n => n.id === currentNote.id ? newNote : n);
        } else {
            updatedNotes = [newNote, ...notes];
        }

        saveNotes(updatedNotes);
        
        // Also save to student profile directly for reporting
        if (onSaveToStudent) {
            onSaveToStudent(newNote);
        }

        handleCloseModal();
    };

    const handleDeleteNote = (id: string) => {
        if (confirm("Bạn có chắc muốn xóa ghi chú này?")) {
            saveNotes(notes.filter(n => n.id !== id));
        }
    };

    const handleGetSuggestions = async () => {
        if (!apiKey) {
            setIsSettingsOpen(true);
            return;
        }
        if (!currentNote.type) return;

        const selectedClass = savedClasses.find(c => c.id === currentNote.classId);
        const student = selectedClass?.students.find(s => s.id === currentNote.studentId);
        const sName = student ? student.name : "Học sinh";

        setIsSuggesting(true);
        try {
            const raw = await suggestQuickNoteContent(currentNote.type as NoteType, sName, apiKey, selectedModel);
            const parsed = JSON.parse(raw);
            setSuggestions(parsed);
        } catch (e) {
            console.error(e);
            alert("Không thể lấy gợi ý lúc này.");
        } finally {
            setIsSuggesting(false);
        }
    };

    // --- FILTERED LIST ---
    const filteredNotes = notes.filter(n => {
        const matchDate = filterDate ? n.date === filterDate : true;
        const matchType = filterType !== 'all' ? n.type === filterType : true;
        const matchClass = filterClass !== 'all' ? n.classId === filterClass : true;
        return matchDate && matchType && matchClass;
    });

    const getNoteTypeInfo = (type: string) => NOTE_TYPES.find(t => t.type === type) || NOTE_TYPES[5];

    // Helper to format date display YYYY-MM-DD -> DD/MM/YYYY
    const formatDateDisplay = (isoDate: string) => {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${d}/${m}/${y}`;
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            
            {/* Header / Toolbar */}
            <div className="bg-white p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <StickyNote size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Ghi chú nhanh hằng ngày</h3>
                        <p className="text-xs text-slate-500">{filteredNotes.length} ghi chú hiển thị</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <div className="relative">
                        <input 
                            type="date" 
                            lang="vi"
                            value={filterDate} 
                            onChange={e => setFilterDate(e.target.value)}
                            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Calendar size={14} className="absolute left-3 top-3 text-slate-400"/>
                    </div>

                    <div className="relative">
                        <select 
                            value={filterClass} 
                            onChange={e => setFilterClass(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none max-w-[150px]"
                        >
                            <option value="all">Tất cả lớp</option>
                            {savedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <School size={14} className="absolute left-3 top-3 text-slate-400"/>
                    </div>
                    
                    <div className="relative">
                        <select 
                            value={filterType} 
                            onChange={e => setFilterType(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                            <option value="all">Tất cả loại</option>
                            {NOTE_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                        </select>
                        <Filter size={14} className="absolute left-3 top-3 text-slate-400"/>
                    </div>

                    <button 
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm whitespace-nowrap"
                    >
                        <Plus size={16} /> Ghi chú mới
                    </button>
                </div>
            </div>

            {/* Main Content: Timeline List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {savedClasses.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <School size={48} className="mb-4 opacity-20" />
                        <p className="font-bold text-slate-500">Chưa có Lớp học nào được lưu.</p>
                        <p className="text-sm mt-1">Vui lòng vào mục "Hồ sơ lớp" để lưu lớp học trước khi tạo ghi chú.</p>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <StickyNote size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Chưa có ghi chú nào cho ngày {formatDateDisplay(filterDate)}.</p>
                        <button onClick={handleOpenModal} className="mt-2 text-indigo-600 font-bold text-sm hover:underline">Tạo ghi chú mới</button>
                    </div>
                ) : (
                    <div className="space-y-3 max-w-3xl mx-auto">
                        {filteredNotes.map(note => {
                            const typeInfo = getNoteTypeInfo(note.type);
                            return (
                                <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${typeInfo.color.replace('border', '')} bg-opacity-20`}>
                                                {typeInfo.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-800 text-sm">{note.studentName}</h4>
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{note.className}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Clock size={12} />
                                                    {/* Display Date and Time */}
                                                    <span>{formatDateDisplay(note.date)}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span>{new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    <span>•</span>
                                                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${typeInfo.color}`}>
                                                        {typeInfo.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setCurrentNote(note);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="p-1.5 hover:bg-red-50 rounded text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 pl-[44px] whitespace-pre-line">{note.content}</p>
                                    
                                    {/* Footer Info */}
                                    <div className="pl-[44px] mt-2 flex gap-2">
                                        {note.severity && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${SEVERITY_LEVELS.find(s=>s.level === note.severity)?.color}`}>
                                                {SEVERITY_LEVELS.find(s=>s.level === note.severity)?.label}
                                            </span>
                                        )}
                                        {note.tags?.map(tag => (
                                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90%] animate-fade-in-up">
                        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <StickyNote size={20} />
                                {currentNote.id ? 'Chỉnh sửa ghi chú' : 'Tạo ghi chú nhanh'}
                            </h3>
                            <button onClick={handleCloseModal} className="hover:bg-white/20 p-1 rounded-full transition">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                            {/* Date, Class, Student Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày</label>
                                    <input 
                                        type="date"
                                        lang="vi"
                                        value={currentNote.date}
                                        onChange={e => setCurrentNote({...currentNote, date: e.target.value})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chọn Lớp</label>
                                    <select 
                                        value={currentNote.classId}
                                        onChange={e => {
                                            setCurrentNote({...currentNote, classId: e.target.value, studentId: ''});
                                            setSuggestions([]);
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    >
                                        <option value="">-- Chọn Lớp --</option>
                                        {savedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chọn Học sinh</label>
                                    <select 
                                        value={currentNote.studentId}
                                        onChange={e => setCurrentNote({...currentNote, studentId: e.target.value})}
                                        disabled={!currentNote.classId}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        <option value="">{currentNote.classId ? "-- Chọn HS trong lớp --" : "-- Vui lòng chọn lớp trước --"}</option>
                                        {currentClassStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Loại sự việc</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {NOTE_TYPES.map(t => (
                                        <button
                                            key={t.type}
                                            onClick={() => {
                                                setCurrentNote({...currentNote, type: t.type});
                                                setSuggestions([]);
                                            }}
                                            className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all
                                            ${currentNote.type === t.type 
                                                ? `${t.color} ring-1 ring-offset-1` 
                                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            {t.icon}
                                            <span className="mt-1">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Nội dung chi tiết</label>
                                    <button 
                                        onClick={handleGetSuggestions}
                                        disabled={!currentNote.studentId || isSuggesting}
                                        className="text-xs text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-2 py-0.5 rounded transition"
                                    >
                                        <Sparkles size={12} />
                                        {isSuggesting ? 'Đang tạo...' : 'Gợi ý nhanh AI'}
                                    </button>
                                </div>
                                
                                {suggestions.length > 0 && (
                                    <div className="mb-2 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {suggestions.map((s, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => setCurrentNote({...currentNote, content: s})}
                                                className="shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg border border-indigo-100 hover:bg-indigo-100 transition text-left max-w-[200px] truncate"
                                                title={s}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <textarea 
                                    value={currentNote.content}
                                    onChange={e => setCurrentNote({...currentNote, content: e.target.value})}
                                    placeholder="Mô tả sự việc..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                />
                            </div>

                            {/* Severity & Actions */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mức độ</label>
                                    <select 
                                        value={currentNote.severity}
                                        onChange={e => setCurrentNote({...currentNote, severity: e.target.value as NoteSeverity})}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    >
                                        {SEVERITY_LEVELS.map(l => <option key={l.level} value={l.level}>{l.label}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1 flex items-end">
                                     <div className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold gap-2 cursor-not-allowed" title="Tính năng đang phát triển">
                                        <Mic size={14} /> Ghi âm (Sắp ra mắt)
                                     </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                            <button 
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition text-sm"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleSaveNote}
                                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition text-sm shadow-md"
                            >
                                Lưu ghi chú
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyQuickNotes;
