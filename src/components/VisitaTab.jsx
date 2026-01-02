import { useState, useMemo, useEffect, useRef } from 'react';
import Sortable from 'sortablejs';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateDistance } from '../utils/helpers';

export default function VisitaTab({ churches, prayers, visitedChurches, visitaProgress, setVisitaProgress, visitaChurches, setVisitaChurches, onVisitChurch, onChurchClick, setHideNav }) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tempChurches, setTempChurches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const sortableRef = useRef(null);

    // Sync hideNav with parent - only hide during final review
    useEffect(() => {
        if (setHideNav) setHideNav(isReviewing);
    }, [isReviewing, setHideNav]);

    // Handle reordering
    useEffect(() => {
        if (isReviewing && sortableRef.current) {
            const el = sortableRef.current;
            const sortable = new Sortable(el, {
                animation: 250,
                handle: '.drag-handle',
                ghostClass: 'opacity-50',
                chosenClass: 'bg-blue-50/50',
                onEnd: (evt) => {
                    setTempChurches(prev => {
                        const newTemp = [...prev];
                        const [movedItem] = newTemp.splice(evt.oldIndex, 1);
                        newTemp.splice(evt.newIndex, 0, movedItem);
                        return newTemp;
                    });
                }
            });
            return () => sortable.destroy();
        }
    }, [isReviewing, tempChurches.length]); // Re-init if length changes, though it shouldn't here

    const completedCount = useMemo(() => {
        if (!visitaProgress) return 0;
        return visitaProgress.filter(p => p >= 1 && p <= 7).length;
    }, [visitaProgress]);

    const startSelection = () => {
        setIsSelecting(true);
        setIsReviewing(false);
        setCurrentStep(0);
        setTempChurches(visitaChurches && visitaChurches.length > 0 ? [...visitaChurches] : Array(7).fill(null));
    };

    const confirmSelection = () => {
        if (tempChurches.filter(id => id).length === 7) {
            setIsReviewing(true);
        }
    };

    const finalConfirm = () => {
        setVisitaChurches(tempChurches);
        setIsSelecting(false);
        setIsReviewing(false);
    };

    const editStep = (idx) => {
        setCurrentStep(idx);
        setIsReviewing(false);
    };

    const resetVisita = () => {
        onChurchClick({
            Name: 'Reset Journey?',
            id: 'reset_journey',
            History: 'Are you sure you want to reset your entire pilgrimage itinerary and progress? This will clear all 7 selected churches and your prayer status. This action cannot be undone.',
            Coords: [0, 0],
            Diocese: 'System'
        }, { text: 'Reset Journey', icon: 'fas fa-redo-alt', color: 'bg-red-600' });
    };

    const unmarkStation = (idx) => {
        setVisitaProgress(prev => prev.filter(p => p !== idx));
    };

    const autoSelectRoute = () => {
        const firstSelectedIdx = tempChurches.findIndex(id => id !== null);
        if (firstSelectedIdx === -1) return;

        const startChurchId = tempChurches[firstSelectedIdx];
        const startChurch = churches.find(c => c.id === startChurchId);
        if (!startChurch || !startChurch.Coords) return;

        let selected = [startChurchId];
        let currentCoords = startChurch.Coords;

        // Iteratively find the nearest unselected church
        while (selected.length < 7) {
            let nearest = null;
            let minDistance = Infinity;

            churches.forEach(church => {
                if (!selected.includes(church.id) && church.Coords) {
                    const dist = calculateDistance(
                        currentCoords[0], currentCoords[1],
                        church.Coords[0], church.Coords[1]
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearest = church;
                    }
                }
            });

            if (nearest) {
                selected.push(nearest.id);
                currentCoords = nearest.Coords;
            } else {
                break;
            }
        }

        // Fill tempChurches with the new route
        const newRoute = [...selected];
        while (newRoute.length < 7) newRoute.push(null);
        setTempChurches(newRoute);
        setCurrentStep(0); // View the whole route
    };

    // --- LOADING / ERROR SAFETY ---
    if (!churches || churches.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8 text-center bg-gray-50">
                <div className="animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
            </div>
        );
    }

    // --- REVIEW UI ---
    if (isReviewing) {
        return (
            <div id="tab-visita" className="tab-content h-full overflow-y-auto px-4 pt-0 pb-20 bg-gray-50 active no-scrollbar">
                <div id="visita-content">
                    <div className="sticky top-0 z-40 w-[100vw] -ml-4 -mr-4 mb-[10px] px-4 pt-4 pb-3 bg-gradient-to-b from-white/95 to-blue-50/95 backdrop-blur-md border-b border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setIsReviewing(false)} className="flex items-center gap-2 text-gray-600 active:text-blue-600 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 group-active:border-blue-200 flex items-center justify-center shadow-sm transition-colors">
                                    <i className="fas fa-arrow-left text-xs group-active:text-blue-600"></i>
                                </div>
                                <span className="text-xs font-bold group-active:text-blue-600">Back</span>
                            </button>

                            <div className="text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-0.5">Review Selection</span>
                                <h2 className="text-base font-black text-gray-900 leading-none">Your Itinerary</h2>
                            </div>

                            <div className="w-16 flex justify-end">
                                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-lg shadow-sm">7/7</span>
                            </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-2">
                            {tempChurches.map((id, idx) => {
                                const church = churches.find(c => c.id === id);
                                return (
                                    <div key={idx} className="flex items-center gap-2 bg-white/60 pl-3 pr-4 py-2 rounded-xl border border-blue-100 flex-shrink-0">
                                        <span className="bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{idx + 1}</span>
                                        <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">{church?.Name || 'Church'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div ref={sortableRef} className="space-y-3 pt-2">
                        {tempChurches.map((id, idx) => {
                            const church = churches.find(c => c.id === id);
                            return (
                                <div key={idx} className="bg-white p-4 rounded-3xl border border-blue-50 shadow-sm flex items-center gap-4 group active:scale-[0.98] transition-all">
                                    <div className="drag-handle cursor-grab active:cursor-grabbing w-8 h-8 flex items-center justify-center text-gray-300 hover:text-blue-400 transition-colors">
                                        <i className="fas fa-grip-vertical"></i>
                                    </div>
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{church?.Name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{church?.Location}</p>
                                    </div>
                                    <button onClick={() => editStep(idx)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                                        <i className="fas fa-pen text-[10px]"></i>
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 flex flex-col gap-3 backdrop-blur-xl bg-white/90">
                        <button
                            onClick={finalConfirm}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <span>Start Journey</span>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                        <button onClick={() => setIsReviewing(false)} className="w-full text-gray-500 font-bold text-sm py-2">
                            Back to Selection
                        </button>
                    </div>
                </div>
            </div >
        );
    }

    // --- SELECTION UI ---
    if (isSelecting) {
        const stepNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
        const stepName = stepNames[currentStep] || "Church";

        const filtered = churches.filter(c =>
            c.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.Location.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.Name.localeCompare(b.Name));

        const filledCount = tempChurches.filter(id => id).length;

        return (
            <div id="tab-visita" className="tab-content h-full overflow-y-auto px-4 pt-0 pb-20 bg-gray-50 active no-scrollbar">
                <div id="visita-content">
                    <div className="sticky top-0 z-40 w-[100vw] -ml-4 -mr-4 mb-[10px] px-4 pt-4 pb-3 bg-gradient-to-b from-white/95 to-blue-50/95 backdrop-blur-md border-b border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setIsSelecting(false)} className="flex items-center gap-2 text-gray-600 active:text-blue-600 transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 group-active:border-blue-200 flex items-center justify-center shadow-sm transition-colors">
                                    <i className="fas fa-arrow-left text-xs group-active:text-blue-600"></i>
                                </div>
                                <span className="text-xs font-bold group-active:text-blue-600">Back</span>
                            </button>

                            <div className="text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-0.5">Step {currentStep + 1} of 7</span>
                                <h2 className="text-base font-black text-gray-900 leading-none">Choose {stepName}</h2>
                            </div>

                            <div className="w-16 flex justify-end">
                                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-lg shadow-sm">{filledCount}/7</span>
                            </div>
                        </div>

                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
                            {tempChurches.map((id, idx) => {
                                const church = churches.find(c => c.id === id);
                                if (id && idx !== currentStep) {
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setCurrentStep(idx)}
                                            className="flex items-center gap-2 bg-white pl-3 pr-4 py-2 rounded-2xl border shadow-sm flex-shrink-0 cursor-pointer transition-all border-blue-100 hover:border-blue-300 hover:bg-blue-50/60"
                                        >
                                            <span className="bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{idx + 1}</span>
                                            <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap mr-1 max-w-[80px] truncate">{church?.Name || 'Church'}</span>
                                            <i className="fas fa-pen text-[9px] text-gray-400"></i>
                                        </div>
                                    );
                                } else if (idx === currentStep) {
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 bg-white/60 pl-3 pr-4 py-2 rounded-2xl border flex-shrink-0 transition-all border-blue-600 shadow-md bg-white cursor-pointer hover:border-blue-300 hover:shadow-sm"
                                        >
                                            <span className="bg-gray-200 text-gray-500 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{idx + 1}</span>
                                            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mr-1">{id ? 'Change' : 'Select'}</span>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 bg-white/60 pl-3 pr-4 py-2 rounded-2xl border flex-shrink-0 transition-all border-dashed border-gray-300 opacity-50"
                                        >
                                            <span className="bg-gray-200 text-gray-500 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{idx + 1}</span>
                                            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mr-1">Select</span>
                                        </div>
                                    );
                                }
                            })}
                        </div>

                        <div className="flex gap-2">
                            <div className="search-input-wrapper flex-1 !h-12 !rounded-xl !shadow-sm !border-blue-100/50 !bg-white">
                                <i className="fas fa-search text-gray-400 text-sm"></i>
                                <input
                                    type="text"
                                    placeholder="Search churches..."
                                    className="!ml-3 !text-sm !font-semibold placeholder-gray-400 text-gray-800 bg-transparent w-full outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={autoSelectRoute}
                                disabled={!tempChurches.some(id => id)}
                                className={`floating-action-btn !h-12 !w-12 !rounded-xl !shadow-sm !border !border-blue-100/50 active:!scale-95 transition-all relative ${tempChurches.some(id => id) ? 'bg-blue-600 !text-white !border-blue-600 shadow-blue-100' : 'bg-white !text-blue-600 opacity-60'}`}
                                title="Auto-select nearest route"
                            >
                                <i className="fas fa-map-marked-alt text-lg"></i>
                                {tempChurches.some(id => id) && !tempChurches.every(id => id) && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-400"></span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div id="church-selection-list" className="space-y-2 mb-28 pt-2 px-0">
                        {filtered.map(church => {
                            const isPicked = tempChurches.includes(church.id);
                            const isCurrentSlot = tempChurches[currentStep] === church.id;
                            const markerColor = church.Diocese === 'Tagbilaran' ? 'bg-blue-600' : 'bg-amber-500';
                            const iconShadow = church.Diocese === 'Tagbilaran' ? 'shadow-blue-200' : 'shadow-amber-200';

                            if (isPicked && !isCurrentSlot) {
                                return (
                                    <div key={church.id} className="opacity-40 pointer-events-none p-4 bg-gray-100/50 rounded-2xl border border-gray-200 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${markerColor} text-white flex items-center justify-center flex-shrink-0 grayscale opacity-50`}>
                                            <i className="fas fa-check text-xs"></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-500 text-sm">{church.Name}</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">PICKED</p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={church.id}
                                    onClick={() => {
                                        const newTemp = [...tempChurches];
                                        newTemp[currentStep] = church.id;
                                        setTempChurches(newTemp);

                                        const isComplete = newTemp.filter(id => id).length === 7;
                                        if (isComplete) {
                                            setIsReviewing(true);
                                        } else if (currentStep < 6) {
                                            setCurrentStep(currentStep + 1);
                                        }
                                    }}
                                    className={`church-select-item rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.98] ${isCurrentSlot ? 'border-blue-600 bg-blue-50/40' : 'border-white bg-white'}`}
                                >
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className={`w-10 h-10 rounded-full ${markerColor} text-white flex items-center justify-center flex-shrink-0 font-black text-sm relative z-10 border-2 border-white shadow-sm ${iconShadow}`}>
                                            <i className="fas fa-church"></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-bold text-gray-900 text-sm truncate">{church.Name}</h3>
                                                {isCurrentSlot && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">SELECTED</span>}
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                <i className={`fas fa-location-dot ${church.Diocese === 'Tagbilaran' ? 'text-blue-500' : 'text-amber-500'} text-[10px]`}></i> {church.Location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        );
    }

    // --- MAIN VISITA UI ---
    if (!visitaChurches || visitaChurches.length === 0) {
        return (
            <div id="tab-visita" className="tab-content h-full overflow-y-auto px-4 pt-0 pb-20 bg-gray-50 active flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200">
                    <i className="fas fa-cross text-white text-3xl"></i>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-3">Visita Iglesia</h1>
                <p className="text-sm text-center text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                    Select 7 churches for your Visita Iglesia journey. Pray at each station and track your pilgrimage progress.
                </p>
                <button
                    onClick={startSelection}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-95 transition-transform"
                >
                    <i className="fas fa-plus-circle mr-2"></i> Select 7 Churches
                </button>
            </div>
        );
    }

    return (
        <div id="tab-visita" className="tab-content h-full overflow-y-auto px-4 pt-0 pb-20 bg-gray-50 active no-scrollbar relative">
            <div className="sticky top-0 z-40 w-[100vw] -ml-4 -mr-4 mb-[10px] px-4 pt-4 pb-3 backdrop-blur-md border-b border-white/80 shadow-[0_4px_6px_-10px_rgba(0,0,0,0.02)]" style={{ background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(239, 246, 255, 0.95))' }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-route text-blue-600"></i>
                        <span className="font-black text-[11px] text-gray-900 uppercase tracking-widest px-1">Pilgrimage Progress</span>
                        <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-lg shadow-sm">{completedCount}/7</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={resetVisita} className="text-red-600 text-xs font-bold px-2 py-1 flex items-center gap-1 transition-all active:scale-90">
                            <i className="fas fa-redo"></i> Reset
                        </button>
                    </div>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-blue-600 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${(completedCount / 7) * 100}%` }}></div>
                </div>
            </div>

            <div className="px-0 space-y-4 pt-0">
                <div className="mb-6 bg-blue-600 rounded-[28px] p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fas fa-info-circle text-6xl"></i></div>
                    <h3 className="font-black text-xl mb-2 leading-tight">Begin Your Pilgrimage</h3>
                    <p className="text-blue-100 text-xs mb-8">Follow these tips and guides for a meaningful visiting experience.</p>

                    <button
                        onClick={() => {
                            onChurchClick({
                                Name: 'Begin Your Pilgrimage',
                                id: 'opening',
                                Coords: [9.85, 124.1],
                                Diocese: 'Instruction',
                                History: 'Welcome to your spiritual journey! Here are some helpful tips for your Visita Iglesia:\n\n1. Prepare your heart with an opening prayer at the first station.\n2. Spend at least 10-15 minutes in quiet reflection at each church.\n3. Follow the designated route to avoid unnecessary travel.\n4. You can track each station by tapping "Complete" after your prayer.'
                            }, { text: 'VISITA IGLESIA', icon: 'fas fa-info-circle', color: 'text-blue-600' });
                        }}
                        className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span>View</span>
                    </button>
                </div>

                {visitaChurches.map((id, index) => {
                    const church = churches.find(c => c.id === id);
                    if (!church) return null;

                    const isDone = visitaProgress && visitaProgress.includes(index + 1);
                    const prayerIdx = index + 1;
                    const markerColor = church.Diocese === 'Tagbilaran' ? 'bg-blue-600' : 'bg-amber-500';

                    return (
                        <div key={index} className="bg-white rounded-[28px] border border-blue-50/50 shadow-sm overflow-hidden group">
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full ${isDone ? 'bg-green-500' : markerColor} text-white flex items-center justify-center text-lg font-black shadow-lg transition-colors border-4 border-white`}>
                                        {isDone ? <i className="fas fa-check"></i> : index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Station {index + 1}</span>
                                        </div>
                                        <h4 className="font-black text-gray-900 text-base truncate leading-tight mb-1">{church.Name}</h4>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{church.Location}</p>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${church.Coords[0]},${church.Coords[1]}`, '_blank')}
                                                className="flex-1 bg-white/80 text-blue-600 py-2.5 rounded-xl text-[11px] font-bold border border-blue-50 active:scale-95 transition-all shadow-sm"
                                            >
                                                <i className="fas fa-location-arrow mr-1"></i> Directions
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const p = prayers && prayers[prayerIdx];
                                                    if (p) {
                                                        onChurchClick({ ...church, Name: p.title, History: p.prayer }, { text: `STATION ${prayerIdx}`, icon: 'fas fa-book-open', color: 'text-blue-600' });
                                                    }
                                                }}
                                                className="flex-1 bg-blue-600 text-white shadow-lg shadow-blue-200 py-2.5 rounded-xl text-[11px] font-bold active:scale-95 transition-all"
                                            >
                                                <i className="fas fa-praying-hands mr-1"></i> Start
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
