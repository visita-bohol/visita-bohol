import { useState, useEffect, useRef } from 'react';

export default function EditChurchModal({ isOpen, onClose, church }) {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        diocese: 'Tagbilaran',
        massSchedule: '',
        fiestaDate: '',
        fbPage: '',
        history: ''
    });

    const [activeEdits, setActiveEdits] = useState({});

    // Bottom Sheet Logic
    const sheetRef = useRef(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStart = useRef(0);

    useEffect(() => {
        if (isOpen && church) {
            document.body.style.overflow = 'hidden';
            setDragOffset(0);
            setActiveEdits({}); // Reset edits on open
            setFormData({
                name: church.Name || '',
                location: church.Location || '',
                diocese: church.Diocese || 'Tagbilaran',
                massSchedule: church.Mass || '',
                fiestaDate: church.Fiesta || '',
                fbPage: church.Facebook || '',
                history: church.History || ''
            });
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, church]);

    const handleTouchStart = (e) => {
        touchStart.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStart.current;
        if (deltaY < 0) {
            setDragOffset(deltaY * 0.15);
        } else {
            setDragOffset(deltaY);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (dragOffset > 100) {
            onClose();
        } else {
            setDragOffset(0);
        }
    };

    const toggleEdit = (field) => {
        setActiveEdits(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const isChanged = (field, originalValue) => {
        return formData[field] !== (originalValue || '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const recipient = "feedback.visitabohol@gmail.com";
        const subject = encodeURIComponent(`Suggested Edit for ${church?.Name || 'Church'}`);

        const getLine = (label, field, orig) => {
            const val = formData[field];
            const changed = isChanged(field, orig);
            return `${label}: ${val} ${changed ? '   <-- [UPDATED]' : ''}`;
        };

        const body = encodeURIComponent(`
${getLine('Name', 'name', church.Name)}
${getLine('Location', 'location', church.Location)}
Coords: ${church?.Coords ? `${church.Coords[0]}, ${church.Coords[1]}` : 'Not set'}
${getLine('Diocese', 'diocese', church.Diocese || 'Tagbilaran')}
${getLine('Mass', 'massSchedule', church.Mass)}
${getLine('Fiesta', 'fiestaDate', church.Fiesta)}
${getLine('History', 'history', church.History)}

${getLine('Facebook Page', 'fbPage', church.Facebook)}
        `);

        window.open(`mailto:${recipient}?subject=${subject}&body=${body}`);
        onClose();
    };

    if (!isOpen || !church) return null;

    const renderEditableField = (key, label, type = 'text', placeholder = '') => {
        const isEditing = activeEdits[key];
        const hasChange = isChanged(key, key === 'diocese' ? (church.Diocese || 'Tagbilaran') : (key === 'massSchedule' ? church.Mass : (key === 'fiestaDate' ? church.Fiesta : (key === 'fbPage' ? church.Facebook : church[key.charAt(0).toUpperCase() + key.slice(1)]))));

        return (
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        {label}
                        {hasChange && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-normal font-bold">Modified</span>}
                    </label>
                    <button
                        type="button"
                        onClick={() => toggleEdit(key)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${isEditing ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {isEditing ? 'Done' : <span className="flex items-center gap-1"><i className="fas fa-pencil-alt"></i> Edit</span>}
                    </button>
                </div>
                {isEditing ? (
                    type === 'textarea' ? (
                        <textarea
                            className="w-full bg-white border-2 border-blue-100 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-medium placeholder:text-gray-400 min-h-[100px] animate-in fade-in zoom-in-95 duration-200"
                            value={formData[key]}
                            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                            placeholder={placeholder}
                            autoFocus
                        />
                    ) : (
                        <input
                            className="w-full bg-white border-2 border-blue-100 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-medium placeholder:text-gray-400 animate-in fade-in zoom-in-95 duration-200"
                            value={formData[key]}
                            onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                            placeholder={placeholder}
                            autoFocus
                        />
                    )
                ) : (
                    <div className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4 text-sm font-medium text-gray-700 min-h-[50px] flex items-center">
                        {formData[key] ? (
                            <span className="break-words line-clamp-4">{formData[key]}</span>
                        ) : (
                            <span className="italic text-gray-400">No info provided</span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[5500] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`fixed bottom-0 left-0 right-0 bg-white z-[6000] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
                style={{
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    transform: isOpen ? `translateY(${dragOffset}px)` : 'translateY(100.1%)',
                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Drag Handle */}
                <div onClick={onClose} className="pt-3 pb-2 cursor-pointer flex-shrink-0">
                    <div className="w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto"></div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-0 no-scrollbar">
                    <div className="p-6 pt-2">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-600 shadow-blue-200 shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-edit text-white text-2xl"></i>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">Suggest Edit</h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{church.Name}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {renderEditableField('name', 'Church Name', 'text', 'e.g. San Isidro Labrador Parish')}

                            {renderEditableField('location', 'Location / Town', 'text', 'e.g. Tabalong, Dauis')}

                            {/* Diocese Special Handling */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        Diocese
                                        {isChanged('diocese', church.Diocese || 'Tagbilaran') && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-normal font-bold">Modified</span>}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => toggleEdit('diocese')}
                                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 ${activeEdits['diocese'] ? 'bg-blue-600 text-white shadow-blue-200 shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {activeEdits['diocese'] ? 'Done' : <span className="flex items-center gap-1"><i className="fas fa-pencil-alt"></i> Edit</span>}
                                    </button>
                                </div>
                                {activeEdits['diocese'] ? (
                                    <div className="flex flex-col gap-2 bg-white p-3 rounded-2xl border-2 border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                                        <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                                            <input
                                                type="radio"
                                                name="diocese"
                                                value="Tagbilaran"
                                                checked={formData.diocese === 'Tagbilaran'}
                                                onChange={e => setFormData({ ...formData, diocese: e.target.value })}
                                                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-bold text-gray-700">Diocese of Tagbilaran</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                                            <input
                                                type="radio"
                                                name="diocese"
                                                value="Talibon"
                                                checked={formData.diocese === 'Talibon'}
                                                onChange={e => setFormData({ ...formData, diocese: e.target.value })}
                                                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-bold text-gray-700">Diocese of Talibon</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4 text-sm font-medium text-gray-700">
                                        Diocese of {formData.diocese}
                                    </div>
                                )}
                            </div>

                            {renderEditableField('massSchedule', 'Mass Schedule', 'textarea', 'e.g. Sun: 6am, 8am, 5pm')}

                            {renderEditableField('fiestaDate', 'Fiesta Date', 'text', 'e.g. May 15')}

                            {renderEditableField('fbPage', 'Facebook Page', 'text', 'e.g. facebook.com/pageName')}

                            {renderEditableField('history', 'History', 'textarea', 'Brief history notes...')}

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest ml-1">Coordinates (Read-only)</label>
                                <div className="relative opacity-60 grayscale">
                                    <input
                                        className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 pl-10 text-sm font-bold text-gray-500 outline-none"
                                        value={church?.Coords ? `${church.Coords[0]}, ${church.Coords[1]}` : ''}
                                        readOnly
                                    />
                                    <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                </div>
                            </div>

                            <div className="pt-4 pb-8">
                                <button type="submit" className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-200">
                                    Submit Feedback
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
