import { useEffect, useRef } from 'react';
import { formatMassTimes, getDioceseBadgeClasses } from '../utils/helpers';

export default function BottomSheet({ isOpen, church, isVisited, onClose, SpecialHeader, onToggleVisited, onVisitaComplete }) {
    const sheetRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!church) return null;

    // Detect if this is a Visita Iglesia station or prayer
    const isStation = SpecialHeader && SpecialHeader.text.includes('STATION');
    const stationMatch = isStation ? SpecialHeader.text.match(/STATION (\d+)/) : null;
    const stationNumber = stationMatch ? parseInt(stationMatch[1]) : null;
    const isSpecialPrayer = SpecialHeader && (SpecialHeader.text === 'VISITA IGLESIA' || SpecialHeader.text === 'PILGRIMAGE COMPLETE');

    const dioceseColor = church.Diocese === 'Tagbilaran' ? 'bg-blue-100 text-blue-800' :
        church.Diocese === 'Talibon' ? 'bg-amber-100 text-amber-800' :
            'bg-gray-100 text-gray-800';

    const handleGetDirections = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${church.Coords[0]},${church.Coords[1]}`, '_blank');
    };

    const handleSuggestEdit = () => {
        window.open(`mailto:feedback.visitabohol@gmail.com?subject=Suggested%20Edit%20for%20${encodeURIComponent(church.Name)}`, '_blank');
    };

    const handleFacebookLink = () => {
        if (church.Facebook) {
            window.open(`https://facebook.com/${church.Facebook.replace('@', '')}`, '_blank');
        }
    };

    // Helper to render mass sections correctly like in HTML
    const renderMassTimes = () => {
        if (!church.Mass) return <p className="text-sm text-gray-500">Schedule not available</p>;

        const sections = church.Mass.split('|').map(s => s.trim());
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
                className={`fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-[1500] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={`fixed bottom-0 left-0 right-0 bg-white z-[2000] border-t-left-radius-[24px] border-t-right-radius-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] max-h-[85vh] flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}
            >
                {/* Handle */}
                <div onClick={onClose} className="p-3 cursor-pointer flex-shrink-0">
                    <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto"></div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-5 pb-8 no-scrollbar">
                    {isStation || isSpecialPrayer ? (
                        <div id="sheet-content">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-600 shadow-blue-200 shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <i className={`${SpecialHeader?.icon || 'fas fa-book-open'} text-white text-2xl`}></i>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                    {SpecialHeader?.text === 'VISITA IGLESIA' ? 'Begin Your Pilgrimage' : church.Name}
                                </h2>
                                {isStation && (
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-3">
                                        Prayer {stationNumber} of 7
                                    </p>
                                )}
                                {isSpecialPrayer && (
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
                                        {SpecialHeader.text === 'VISITA IGLESIA' ? 'Before Visiting the Church' : SpecialHeader.text}
                                    </p>
                                )}
                            </div>

                            {SpecialHeader?.text === 'VISITA IGLESIA' ? (
                                <div className="space-y-6 mb-8">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-blue-600 tracking-[0.2em] mb-3">Tips</p>
                                        <ul className="space-y-3">
                                            {[
                                                'Dress modestly and respectfully.',
                                                'Arrive a few minutes early.',
                                                'Silence your phone before entering.',
                                                'Be respectful of people praying.',
                                                'Follow any posted rules or signs.'
                                            ].map((tip, idx) => (
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
                                            {[
                                                'Check the church schedule (mass times or visiting hours).',
                                                'Learn basic church etiquette.',
                                                'Ask politely if photos are allowed.',
                                                'Sit or stand when others do, if attending a service.'
                                            ].map((guide, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-xs font-bold text-gray-600">
                                                    <i className="fas fa-chevron-right text-[10px] mt-0.5 text-blue-500"></i>
                                                    <span>{guide}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-blue-50/50 rounded-3xl p-6 mb-8 border border-blue-50">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                                        {church.History}
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all">
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
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start gap-3 mb-5">
                                <div className="flex-1 min-w-0">
                                    {SpecialHeader && (
                                        <div className={`text-[10px] font-black ${SpecialHeader.color} mb-1 flex items-center gap-1 uppercase tracking-wider`}>
                                            <i className={SpecialHeader.icon}></i> {SpecialHeader.text}
                                        </div>
                                    )}
                                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{church.Name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs sm:text-sm text-gray-500 font-semibold flex items-center gap-1">
                                            <i className="fas fa-map-marker-alt text-blue-500"></i> {church.Location}
                                        </p>
                                        <span className={`text-xs ${dioceseColor} px-2 py-1 rounded-full font-bold`}>{church.Diocese}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 mb-8">
                                <div>
                                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2">History</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{church.History}</p>
                                </div>

                                {church.Mass ? (
                                    <div>
                                        <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-2.5">Mass Schedule</h3>
                                        {renderMassTimes()}
                                        {church.Facebook && (
                                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                                <i className="fab fa-facebook text-blue-600"></i>
                                                <button onClick={handleFacebookLink} className="text-blue-600 hover:underline font-semibold">{church.Facebook}</button>
                                                <span className="text-gray-400">• Official Schedule</span>
                                            </div>
                                        )}
                                    </div>
                                ) : church.Facebook ? (
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <i className="fab fa-facebook text-blue-600 text-lg mt-1"></i>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-700 mb-1">For Mass Schedule</p>
                                                <button onClick={handleFacebookLink} className="text-sm text-blue-600 hover:underline font-bold break-all text-left">{church.Facebook}</button>
                                                <p className="text-[10px] text-gray-500 mt-1">Visit Facebook page for current schedule</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <div className="w-9 h-9 bg-white text-gray-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                        <i className="fas fa-calendar-day text-sm"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">Patronal Fiesta</p>
                                        <p className="text-sm text-gray-900 font-bold truncate">{church.Fiesta}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-3">
                                    <button onClick={handleGetDirections} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all">
                                        <i className="fas fa-directions"></i> Get Directions
                                    </button>
                                    <button onClick={handleSuggestEdit} className="px-5 bg-blue-50 text-blue-600 border border-blue-100 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-50 active:scale-95 transition-all">
                                        <i className="fas fa-pen-to-square"></i> Suggest Edit
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 text-center font-medium">Inaccurate details? Tap suggest edit</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
