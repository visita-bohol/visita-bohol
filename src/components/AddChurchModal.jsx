import { useState, useEffect, useRef } from 'react';

export default function AddChurchModal({ isOpen, onClose, coordinates }) {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        diocese: 'Diocese of Tagbilaran',
        massSchedule: '',
        fiestaDate: '',
        fbPage: '',
        history: ''
    });

    // Bottom Sheet Logic
    const sheetRef = useRef(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStart = useRef(0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setDragOffset(0);
            setFormData({
                name: '',
                location: '',
                diocese: 'Diocese of Tagbilaran',
                massSchedule: '',
                fiestaDate: '',
                fbPage: '',
                history: ''
            });
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleTouchStart = (e) => {
        touchStart.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStart.current;
        if (deltaY < 0) {
            setDragOffset(deltaY * 0.15); // Resistance
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const recipient = "feedback.visitabohol@gmail.com";
        const subject = encodeURIComponent("Add Missing Church Report");
        const body = encodeURIComponent(`
Name: ${formData.name}
Location: ${formData.location}
Coords: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'Not set'}
Diocese: ${formData.diocese}
Mass: ${formData.massSchedule}
Fiesta: ${formData.fiestaDate}
History: ${formData.history}

Facebook Page: ${formData.fbPage}
        `);

        window.open(`mailto:${recipient}?subject=${subject}&body=${body}`);
        onClose();
    };

    // if (!isOpen) return null; // Removed to allow for smooth exit animation

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[5500] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={`fixed bottom-0 left-0 right-0 bg-white z-[6000] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[90vh] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
                style={{
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    transform: isOpen ? `translateY(${dragOffset}px)` : 'translateY(110%)',
                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Drag Zone (Handle + Header) */}
                <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                >
                    {/* Drag Handle */}
                    <div onClick={onClose} className="pt-3 pb-2 cursor-pointer flex-shrink-0">
                        <div className="w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto"></div>
                    </div>

                    {/* Header */}
                    <div className="px-6 pt-2 pb-6 text-center">
                        <div className="w-16 h-16 bg-orange-500 shadow-orange-200 shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4 pointer-events-none">
                            <i className="fas fa-map-pin text-white text-2xl"></i>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight pointer-events-none">Add Missing Church</h2>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 pointer-events-none">Help us improve the map</p>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-0 no-scrollbar">
                    <div className="px-6 pb-6">

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Church Name</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. San Isidro Labrador Parish"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Location / Town</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Tabalong, Dauis"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Diocese</label>
                                <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                                    <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
                                        <input
                                            type="radio"
                                            name="diocese"
                                            value="Diocese of Tagbilaran"
                                            checked={formData.diocese === 'Diocese of Tagbilaran'}
                                            onChange={e => setFormData({ ...formData, diocese: e.target.value })}
                                            className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                                        />
                                        <span className="text-sm font-bold text-gray-700">Diocese of Tagbilaran</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer">
                                        <input
                                            type="radio"
                                            name="diocese"
                                            value="Diocese of Talibon"
                                            checked={formData.diocese === 'Diocese of Talibon'}
                                            onChange={e => setFormData({ ...formData, diocese: e.target.value })}
                                            className="w-5 h-5 text-orange-500 border-gray-300 focus:ring-orange-500"
                                        />
                                        <span className="text-sm font-bold text-gray-700">Diocese of Talibon</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Mass Schedule (Optional)</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400 min-h-[80px]"
                                    value={formData.massSchedule}
                                    onChange={e => setFormData({ ...formData, massSchedule: e.target.value })}
                                    placeholder="e.g. Sun: 6am, 8am, 5pm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Fiesta Date (Optional)</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                    value={formData.fiestaDate}
                                    onChange={e => setFormData({ ...formData, fiestaDate: e.target.value })}
                                    placeholder="e.g. May 15"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Facebook Page (Optional)</label>
                                <input
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400"
                                    value={formData.fbPage}
                                    onChange={e => setFormData({ ...formData, fbPage: e.target.value })}
                                    type="text"
                                    placeholder="e.g. facebook.com/pageName"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">History (Optional)</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all placeholder:font-medium placeholder:text-gray-400 min-h-[80px]"
                                    value={formData.history}
                                    onChange={e => setFormData({ ...formData, history: e.target.value })}
                                    placeholder="Brief history notes..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Coordinates</label>
                                <div className="relative">
                                    <input
                                        className="w-full bg-gray-100 border border-gray-200 rounded-2xl p-4 pl-10 text-sm font-bold text-gray-600 outline-none"
                                        value={coordinates ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` : ''}
                                        readOnly
                                    />
                                    <i className="fas fa-map-marker-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                </div>
                            </div>

                            <div className="pt-4 pb-8">
                                <button type="submit" className="w-full bg-orange-500 text-white font-black text-lg py-4 rounded-2xl hover:bg-orange-600 active:scale-95 transition-all shadow-xl shadow-orange-200">
                                    Submit Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
