import { useEffect, useRef, useState } from 'react';

export default function BottomSheet({ isOpen, church, nearbyChurches, isVisited, onClose, SpecialHeader, onToggleVisited, onVisitaComplete, onResetPilgrimage, onEdit }) {
    const sheetRef = useRef(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStart = useRef(0);
    const [activeChurch, setActiveChurch] = useState(church);

    const isResetView = SpecialHeader && SpecialHeader.text === 'Reset Journey';
    const isStation = SpecialHeader && SpecialHeader.text.includes('STATION');
    const isSpecialPrayer = SpecialHeader && (SpecialHeader.text === 'VISITA IGLESIA' || SpecialHeader.text === 'PILGRIMAGE COMPLETE' || isResetView);

    useEffect(() => {
        if (church) {
            setActiveChurch(church);
        }
    }, [church]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setDragOffset(0);
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
        // Disable swipe dismissal for prayer/station views to prevent accidental closure
        if (isStation || isSpecialPrayer) return;

        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStart.current;

        if (deltaY < 0) {
            setDragOffset(deltaY * 0.15); // Stiff resistance for upward drag
        } else {
            setDragOffset(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (isStation || isSpecialPrayer) {
            setIsDragging(false);
            setDragOffset(0);
            return;
        }
        setIsDragging(false);
        if (dragOffset > 50) { // Reduced threshold for better sensitivity
            onClose();
        } else {
            setDragOffset(0);
        }
    };

    if (!activeChurch && !isOpen) return null;
    const currentChurch = activeChurch || church;
    if (!currentChurch) return null;

    const stationMatch = isStation ? SpecialHeader.text.match(/STATION (\d+)/) : null;
    const stationNumber = stationMatch ? parseInt(stationMatch[1]) : null;

    const dioceseColor = currentChurch.Diocese === 'Tagbilaran' ? 'bg-blue-100 text-blue-800' :
        currentChurch.Diocese === 'Talibon' ? 'bg-amber-100 text-amber-800' :
            'bg-gray-100 text-gray-800';

    const handleFacebookLink = () => {
        if (currentChurch.Facebook) {
            window.open(`https://facebook.com/${currentChurch.Facebook.replace('@', '')}`, '_blank');
        }
    };

    const renderMassTimes = () => {
        if (!currentChurch.Mass) return <p className="text-sm text-gray-500">Schedule not available</p>;
        const sections = currentChurch.Mass.split('|').map(s => s.trim());
        return (
            <div className="flex flex-wrap gap-2">
                {sections.map((section, sIdx) => {
                    const parts = section.split(',').map(p => p.trim());
                    if (parts.length === 0) return null;
                    const dayInfo = parts[0].split(':')[0];
                    const firstTime = parts[0].split(':').slice(1).join(':').trim();
                    return (
                        <div key={sIdx} className="contents">
                            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase">{dayInfo}</div>
                            <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold">{firstTime}</div>
                            {parts.slice(1).map((time, tIdx) => (
                                <div key={tIdx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold">{time}</div>
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[1500] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`fixed bottom-0 left-0 right-0 bg-white z-[2000] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]`}
                style={{
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    transform: isOpen ? `translateY(${dragOffset}px)` : 'translateY(100.1%)',
                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Fixed Header/Handle */}
                {!(isStation || isSpecialPrayer) && (
                    <div onClick={onClose} className="pt-3 pb-2 cursor-pointer flex-shrink-0">
                        <div className="w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto"></div>
                    </div>
                )}

                {(isStation || isSpecialPrayer) && <div className="pt-6 flex-shrink-0"></div>}

                {/* Scrollable Content Area */}
                <div className="overflow-y-auto flex-1 px-5 no-scrollbar">
                    {isStation || isSpecialPrayer ? (
                        <div className="pt-4 pb-6">
                            {isResetView ? (
                                <div className="text-center">
                                    <div className="mb-6">
                                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                                            <i className="fas fa-redo-alt text-white text-2xl"></i>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900">Reset Journey?</h2>
                                        <p className="text-xs text-red-600 font-bold uppercase tracking-wider mt-1">Warning: Permanent Action</p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-2">
                                        <p className="text-gray-600 leading-relaxed text-sm text-center font-medium">
                                            This will clear your 7 selected churches and reset all station progress. This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-blue-600 shadow-blue-200 shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <i className={`${SpecialHeader?.icon || 'fas fa-book-open'} text-white text-2xl`}></i>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                            {SpecialHeader?.text === 'VISITA IGLESIA' ? 'Begin Your Pilgrimage' : currentChurch.Name}
                                        </h2>
                                        {isStation && (
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3">
                                                Prayer {stationNumber} of 7
                                            </p>
                                        )}
                                        {isSpecialPrayer && SpecialHeader.text !== 'Reset Journey' && (
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
                                                {SpecialHeader.text === 'VISITA IGLESIA' ? 'Before Visiting the Church' : SpecialHeader.text}
                                            </p>
                                        )}
                                    </div>

                                    {SpecialHeader?.text === 'VISITA IGLESIA' ? (
                                        <div className="space-y-6 mb-4">
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-3">Tips</p>
                                                <ul className="space-y-3">
                                                    {['Dress modestly and respectfully.', 'Arrive a few minutes early.', 'Silence your phone.', 'Be respectful of those praying.', 'Follow posted rules.'].map((tip, idx) => (
                                                        <li key={idx} className="flex items-start gap-3 text-xs font-bold text-gray-600">
                                                            <i className="fas fa-check text-[10px] mt-0.5 text-blue-500"></i>
                                                            <span>{tip}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-3">Guides</p>
                                                <ul className="space-y-3">
                                                    {['Check church schedule.', 'Learn basic church etiquette.', 'Ask politely if photos are allowed.', 'Sit/stand when others do.'].map((guide, idx) => (
                                                        <li key={idx} className="flex items-start gap-3 text-xs font-bold text-gray-600">
                                                            <i className="fas fa-chevron-right text-[10px] mt-0.5 text-blue-500"></i>
                                                            <span>{guide}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50/50 rounded-[32px] p-6 mb-4 border border-blue-50/50 shadow-inner">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                                                {currentChurch.History}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="pt-2 pb-8">
                            <div className="flex justify-between items-start gap-3 mb-6">
                                <div className="flex-1 min-w-0">
                                    {SpecialHeader && (
                                        <div className={`text-[10px] font-black ${SpecialHeader.color} mb-1 flex items-center gap-1 uppercase tracking-wider`}>
                                            <i className={SpecialHeader.icon}></i> {SpecialHeader.text}
                                        </div>
                                    )}
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{currentChurch.Name}</h2>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <p className="text-sm text-gray-500 font-semibold flex items-center gap-1.5">
                                            <i className="fas fa-map-marker-alt text-blue-500"></i> {currentChurch.Location}
                                        </p>
                                        <span className={`text-[10px] ${dioceseColor} px-2 py-0.5 rounded-lg font-bold uppercase tracking-tight`}>{currentChurch.Diocese}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-3">History</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">{currentChurch.History}</p>
                                </div>

                                {currentChurch.Mass ? (
                                    <div>
                                        <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-3">Mass Schedule</h3>
                                        {renderMassTimes()}
                                        {currentChurch.Facebook && (
                                            <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400 font-semibold">
                                                <i className="fab fa-facebook text-blue-600"></i>
                                                <button onClick={handleFacebookLink} className="text-blue-600 hover:underline">{currentChurch.Facebook}</button>
                                                <span>• Verified Schedule</span>
                                            </div>
                                        )}
                                    </div>
                                ) : currentChurch.Facebook ? (
                                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                                <i className="fab fa-facebook text-blue-600 text-lg"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-gray-800 mb-1">Check Mass Schedule</p>
                                                <button onClick={handleFacebookLink} className="text-[13px] text-blue-600 hover:underline font-bold break-all text-left block w-full">{currentChurch.Facebook}</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex items-center gap-4 bg-gray-50/80 p-5 rounded-[24px] border border-gray-100">
                                    <div className="w-11 h-11 bg-white text-blue-600 rounded-[18px] flex items-center justify-center shadow-sm flex-shrink-0 border border-white">
                                        <i className="fas fa-calendar-day text-lg"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-1">Patronal Fiesta</p>
                                        <p className="text-[15px] text-gray-900 font-black">{currentChurch.Fiesta}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fixed Action Footer */}
                <div className="p-5 pb-8 border-t border-gray-50 bg-white/95 backdrop-blur-md flex-shrink-0">
                    {isResetView ? (
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 bg-white text-gray-600 border border-blue-100 py-4 rounded-2xl font-black transition-all text-sm hover:border-blue-600 hover:bg-blue-50/10 hover:shadow-md hover:shadow-blue-100 active:border-blue-600 active:bg-blue-50/10 mb-0.5">
                                Cancel
                            </button>
                            <button onClick={onResetPilgrimage} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-200 active:scale-95 transition-all text-sm">
                                <i className="fas fa-trash-alt mr-2"></i> Reset
                            </button>
                        </div>
                    ) : isStation || isSpecialPrayer ? (
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 bg-white text-gray-600 border border-blue-100 py-4 rounded-2xl font-black text-sm transition-all hover:border-blue-600 hover:bg-blue-50/10 hover:shadow-md hover:shadow-blue-100 active:border-blue-600 active:bg-blue-50/10 mb-0.5">
                                Close
                            </button>
                            {isStation && onVisitaComplete && (
                                <button
                                    onClick={() => onVisitaComplete(stationNumber)}
                                    className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all"
                                >
                                    <i className="fas fa-check-circle mr-2"></i> Complete
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentChurch.Coords[0]},${currentChurch.Coords[1]}`, '_blank')} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all">
                                    <i className="fas fa-directions"></i> Get Directions
                                </button>
                                <button
                                    onClick={onEdit}
                                    className="px-5 bg-white text-blue-600 border border-blue-100 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:border-blue-600 hover:bg-blue-50/10 hover:shadow-md hover:shadow-blue-100 active:border-blue-600 active:bg-blue-50/10"
                                >
                                    <i className="fas fa-pen-to-square"></i> Suggest Edit
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Inaccurate details? Tap suggest</p>

                            {nearbyChurches && nearbyChurches.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-gray-100/80">
                                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-4">Other Nearby Churches</h3>
                                    <div className="space-y-2">
                                        {nearbyChurches.map(c => (
                                            <div key={c.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-blue-600 hover:bg-blue-50/10 hover:shadow-md hover:shadow-blue-100 active:border-blue-600 active:bg-blue-50/10 relative overflow-hidden">
                                                <div className="min-w-0 pr-4">
                                                    <h4 className="font-bold text-gray-800 text-xs truncate mb-0.5">{c.Name}</h4>
                                                    <p className="text-[10px] text-gray-500 font-medium truncate">{c.Location}</p>
                                                </div>
                                                <div className="flex-shrink-0 text-blue-600 font-bold text-xs">
                                                    {c.distance.toFixed(1)} km
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
