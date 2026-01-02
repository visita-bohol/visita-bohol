import { useEffect, useRef, useState, useMemo } from 'react';
import { calculateDistance } from '../utils/helpers';

export default function BottomSheet({ isOpen, church, allChurches, userLocation, isVisited, onClose, SpecialHeader, onToggleVisited, onVisitaComplete, onResetPilgrimage }) {
    const sheetRef = useRef(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStart = useRef(0);
    const [activeChurch, setActiveChurch] = useState(church);

    // Sync active church when prop changes
    useEffect(() => {
        if (church) {
            setActiveChurch(church);
        }
    }, [church]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setDragOffset(0);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Derived values (Safe even if church is null)
    const currentChurch = activeChurch || church;
    const isResetView = SpecialHeader && SpecialHeader.text === 'Reset Journey';
    const isStation = SpecialHeader && SpecialHeader.text && SpecialHeader.text.includes('STATION');
    const isSpecialPrayer = SpecialHeader && (SpecialHeader.text === 'VISITA IGLESIA' || SpecialHeader.text === 'PILGRIMAGE COMPLETE' || isResetView);
    const isLocked = isStation || (SpecialHeader && SpecialHeader.text === 'VISITA IGLESIA');

    const nearbyChurches = useMemo(() => {
        if (!userLocation || !allChurches || !currentChurch || !userLocation.latitude) return [];
        return allChurches
            .filter(c => c && c.id !== currentChurch.id && c.Coords && c.Coords.length >= 2)
            .map(c => ({
                ...c,
                dist: calculateDistance(userLocation.latitude, userLocation.longitude, c.Coords[0], c.Coords[1])
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);
    }, [allChurches, userLocation, currentChurch, isOpen]);

    const handleTouchStart = (e) => {
        touchStart.current = e.touches[0].clientY;
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (isLocked) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStart.current;
        if (deltaY < 0) {
            setDragOffset(deltaY * 0.15);
        } else {
            setDragOffset(deltaY);
        }
    };

    const handleTouchEnd = () => {
        if (isLocked) {
            setIsDragging(false);
            setDragOffset(0);
            return;
        }
        setIsDragging(false);
        if (dragOffset > 100) {
            onClose();
        } else {
            setDragOffset(0);
        }
    };

    const handleFacebookLink = () => {
        if (currentChurch && currentChurch.Facebook) {
            window.open(`https://facebook.com/${currentChurch.Facebook.replace('@', '')}`, '_blank');
        }
    };

    // Render logic separation
    const renderMassTimes = () => {
        if (!currentChurch || !currentChurch.Mass) return <p className="text-sm text-gray-500">Schedule not available</p>;
        const sections = currentChurch.Mass.split('|').map(s => s.trim());
        return (
            <div className="flex flex-wrap gap-2">
                {sections.map((section, sIdx) => {
                    const parts = section.split(',').map(p => p.trim());
                    if (parts.length === 0) return null;
                    const dayInfo = parts[0].split(':')[0];
                    const times = parts[0].split(':').slice(1).join(':').trim();
                    const otherTimes = parts.slice(1);

                    return (
                        <div key={sIdx} className="contents">
                            <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase">{dayInfo}</div>
                            {times && <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold">{times}</div>}
                            {otherTimes.map((time, tIdx) => (
                                <div key={tIdx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold">{time}</div>
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    };

    // If neither open nor having content, render nothing
    if (!isOpen && !currentChurch) return null;

    // Safety check for critical render logic
    if (!currentChurch) return null;

    const stationMatch = isStation ? SpecialHeader.text.match(/STATION (\d+)/) : null;
    const stationNumber = stationMatch ? parseInt(stationMatch[1]) : null;

    const dioceseColor = currentChurch.Diocese === 'Tagbilaran' ? 'bg-blue-100 text-blue-800' :
        currentChurch.Diocese === 'Talibon' ? 'bg-amber-100 text-amber-800' :
            'bg-gray-100 text-gray-800';

    return (
        <>
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[1500] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

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
                <div className="w-full flex justify-center pt-3 pb-2 flex-shrink-0">
                    {!isLocked && <div className="w-12 h-1.5 bg-gray-200 rounded-full" />}
                    {isLocked && <div className="h-1.5" />}
                </div>

                <div className="flex-1 overflow-y-auto px-6 no-scrollbar">
                    {isSpecialPrayer ? (
                        <div className="pt-2 pb-10">
                            <div className="text-center mb-8 pt-4">
                                <div className={`w-16 h-16 ${isResetView ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm border border-white`}>
                                    <i className={SpecialHeader?.icon || 'fas fa-book-open'}></i>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-1">{currentChurch.Name}</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{SpecialHeader?.text}</p>
                            </div>

                            <div className="prose prose-sm max-w-none">
                                {((currentChurch && currentChurch.History) || "This station provides guidance for your pilgrimage journey. Explore the details below to prepare for your visit.").split('\n\n').map((para, pIdx) => (
                                    <p key={pIdx} className="text-sm text-gray-600 leading-relaxed font-medium mb-4 whitespace-pre-wrap italic">{para}</p>
                                ))}
                            </div>

                            {isResetView && (
                                <div className="mt-8 p-6 bg-red-50 rounded-[32px] border border-red-100 flex items-start gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm flex-shrink-0">
                                        <i className="fas fa-triangle-exclamation"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-red-900 mb-1 leading-none uppercase tracking-tight">Warning</p>
                                        <p className="text-xs text-red-600 font-medium leading-relaxed">This will erase your 7-church itinerary and all prayers marked as done across all stations.</p>
                                    </div>
                                </div>
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

                                {nearbyChurches.length > 0 && (
                                    <div className="mt-8 mb-4">
                                        <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-4">Other Nearby Churches</h3>
                                        <div className="space-y-3">
                                            {nearbyChurches.map(nb => (
                                                <div key={nb.id} onClick={() => setActiveChurch(nb)} className="bg-gray-50/50 border border-gray-100/50 rounded-2xl p-4 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-pointer hover:bg-white hover:border-blue-100 transition-all active:scale-[0.98]">
                                                    <div className="min-w-0 pr-4">
                                                        <p className="text-sm font-black text-gray-900 truncate">{nb.Name}</p>
                                                        <p className="text-[11px] text-gray-500 font-semibold truncate">{nb.Location}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-black text-blue-600">{nb.dist.toFixed(1)} km</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 pb-8 border-t border-gray-50 bg-white/95 backdrop-blur-md flex-shrink-0">
                    {isResetView ? (
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black active:scale-95 transition-all text-sm">Cancel</button>
                            <button onClick={onResetPilgrimage} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-200 active:scale-95 transition-all text-sm">
                                <i className="fas fa-trash-alt mr-2"></i> Reset
                            </button>
                        </div>
                    ) : isStation || isSpecialPrayer ? (
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all">Close</button>
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
                                {currentChurch.Coords && (
                                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${currentChurch.Coords[0]},${currentChurch.Coords[1]}`, '_blank')} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-[13px] font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all">
                                        <i className="fas fa-directions"></i> Get Directions
                                    </button>
                                )}
                                <a
                                    href={`mailto:feedback.visitabohol@gmail.com?subject=Suggested%20Edit%20for%20${encodeURIComponent(currentChurch.Name)}`}
                                    className="px-5 bg-blue-50 text-blue-600 border border-blue-100 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-50 active:scale-95 transition-all"
                                >
                                    <i className="fas fa-pen-to-square"></i> Suggest Edit
                                </a>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Inaccurate details? Tap suggest</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
