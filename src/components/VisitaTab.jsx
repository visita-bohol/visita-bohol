import { useState, useMemo, useEffect, useRef } from 'react';
import AppLogo from './AppLogo';
import Sortable from 'sortablejs';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useGeolocation } from '../hooks/useGeolocation';
import VisitaMapSelection from './VisitaMapSelection';

export default function VisitaTab({ churches, prayers, visitedChurches, visitaProgress, setVisitaProgress, visitaChurches, setVisitaChurches, onVisitChurch, onChurchClick, setHideNav, addToast }) {
    const { location, getLocation, loading: geoLoading } = useGeolocation();
    const [isSelecting, setIsSelecting] = useLocalStorage('visita_isSelecting', false);
    const [showMapSelection, setShowMapSelection] = useState(false);
    const [currentStep, setCurrentStep] = useLocalStorage('visita_currentStep', 0);
    const [tempChurches, setTempChurches] = useLocalStorage('visita_tempChurches', []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isReviewing, setIsReviewing] = useLocalStorage('visita_isReviewing', false);
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
    }, [isReviewing, tempChurches]);

    const completedCount = useMemo(() => visitaProgress.filter(p => p >= 1 && p <= 7).length, [visitaProgress]);

    const startSelection = () => {
        setIsSelecting(true);
        setIsReviewing(false);
        setCurrentStep(0);
        setTempChurches(visitaChurches.length > 0 ? [...visitaChurches] : Array(7).fill(null));
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
        setTempChurches([]); // Clear temp storage after confirming
    };

    const editStep = (idx) => {
        setCurrentStep(idx);
        setIsReviewing(false);
    };

    const resetVisita = () => {
        onChurchClick({ Name: 'Reset Journey?', id: 'reset_journey' }, { text: 'Reset Journey', icon: 'fas fa-redo-alt', color: 'bg-red-600' });
    };

    const unmarkStation = (idx) => {
        setVisitaProgress(prev => prev.filter(p => p !== idx));
    };

    const calculateDistance = (coords1, coords2) => {
        if (!coords1 || !coords2) return Infinity;
        const [lat1, lon1] = coords1;
        const [lat2, lon2] = coords2;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleAutoSelect = () => {
        let startCoords = null;
        let selectedIds = [];

        // Try to base it on first chosen church
        if (tempChurches[0]) {
            const startChurch = churches.find(c => c.id === tempChurches[0]);
            if (startChurch) {
                startCoords = startChurch.Coords;
                selectedIds.push(startChurch.id);
            }
        }

        // If no first church, try geolocation
        if (!startCoords) {
            if (location) {
                startCoords = [location.latitude, location.longitude];
                addToast('Auto-selecting based on your location...', 'success');
            } else {
                getLocation();
                addToast('Getting your location... Tap again in a moment!', 'info');
                return;
            }
        } else {
            addToast('Optimizing route from your first choice...', 'success');
        }

        // Nearest neighbor algorithm for "direction based" path
        let currentCoords = startCoords;
        while (selectedIds.length < 7) {
            let nearestChurch = null;
            let minDistance = Infinity;

            churches.forEach(church => {
                if (!selectedIds.includes(church.id)) {
                    const dist = calculateDistance(currentCoords, church.Coords);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestChurch = church;
                    }
                }
            });

            if (nearestChurch) {
                selectedIds.push(nearestChurch.id);
                currentCoords = nearestChurch.Coords;
            } else {
                break;
            }
        }

        if (selectedIds.length > 0) {
            // Fill remaining slots if we couldn't find 7 (unlikely)
            const finalSelection = [...selectedIds];
            while (finalSelection.length < 7) finalSelection.push(null);

            setTempChurches(finalSelection);

            if (finalSelection.filter(id => id).length === 7) {
                setTimeout(() => setIsReviewing(true), 1000);
            }
        }
    };

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
                                    <div
                                        key={id}
                                        onClick={() => editStep(idx)}
                                        className="flex items-center gap-2 bg-white pl-3 pr-4 py-2 rounded-xl border border-blue-100 shadow-sm flex-shrink-0 cursor-pointer hover:border-blue-300 hover:bg-blue-50/60 transition-all"
                                    >
                                        <span className="bg-blue-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">{idx + 1}</span>
                                        <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap mr-1 max-w-[80px] truncate">{church?.Name || 'Church'}</span>
                                        <i className="fas fa-pen text-[9px] text-gray-400"></i>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        id="itinerary-list"
                        ref={sortableRef}
                        className="space-y-4 mb-48 pt-4"
                    >
                        {tempChurches.map((id, idx) => {
                            const church = churches.find(c => c.id === id);
                            if (!church) return null;
                            const markerColor = church.Diocese === 'Tagbilaran' ? 'bg-blue-600' : 'bg-amber-500';

                            return (
                                <div key={id} className="church-select-item rounded-2xl p-3 border transition-all cursor-pointer relative overflow-hidden group border-blue-600 bg-blue-50/20 shadow-md">
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="drag-handle text-gray-300 px-1 cursor-grab active:cursor-grabbing hover:text-blue-400">
                                            <i className="fas fa-grip-vertical text-lg"></i>
                                        </div>

                                        <div className={`w-10 h-10 rounded-full ${markerColor} text-white flex items-center justify-center flex-shrink-0 font-black text-sm relative z-10 border-2 border-white shadow-sm`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0" onClick={() => editStep(idx)}>
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-bold text-gray-900 text-sm truncate">{church.Name}</h3>
                                                <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-lg shadow-sm uppercase flex items-center gap-1">
                                                    <i className="fas fa-pen text-[8px]"></i> Edit
                                                </span>
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
        const stepName = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][currentStep];
        const filtered = churches.filter(c =>
            c.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.Location.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.Name.localeCompare(b.Name));

        const filledCount = tempChurches.filter(id => id).length;

        const handleMapSelect = (churchId) => {
            const newTemp = [...tempChurches];
            newTemp[currentStep] = churchId;
            setTempChurches(newTemp);
            setSearchTerm('');
            setShowMapSelection(false);

            const isComplete = newTemp.filter(id => id).length === 7;
            if (isComplete) {
                setIsReviewing(true);
            } else {
                // Find next empty step
                const nextEmptyStep = newTemp.findIndex((id, idx) => !id && idx > currentStep);
                if (nextEmptyStep !== -1) {
                    setCurrentStep(nextEmptyStep);
                } else {
                    // No empty steps after current, find first empty from beginning
                    const firstEmpty = newTemp.findIndex(id => !id);
                    if (firstEmpty !== -1) {
                        setCurrentStep(firstEmpty);
                    }
                }
            }
        };

        return (
            <div id="tab-visita" className="tab-content h-full overflow-y-auto px-4 pt-0 pb-20 bg-gray-50 active no-scrollbar">
                {showMapSelection && (
                    <VisitaMapSelection
                        churches={churches}
                        currentStep={currentStep}
                        selectedIds={tempChurches}
                        onSelect={handleMapSelect}
                        onClose={() => setShowMapSelection(false)}
                        onBack={() => {
                            if (currentStep > 0) {
                                setCurrentStep(currentStep - 1);
                            }
                            setShowMapSelection(false);
                        }}
                    />
                )}
                <div id="visita-content">
                    <div className="sticky top-0 z-40 w-[100vw] -ml-4 -mr-4 mb-[10px] px-4 pt-4 pb-3 bg-gradient-to-b from-white/95 to-blue-50/95 backdrop-blur-md border-b border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => {
                                if (currentStep > 0) {
                                    setCurrentStep(currentStep - 1);
                                } else {
                                    setIsSelecting(false);
                                }
                            }} className="flex items-center gap-2 text-gray-600 active:text-blue-600 transition-colors group">
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
                                            className="flex items-center gap-2 bg-white pl-3 pr-4 py-2 rounded-xl border shadow-sm flex-shrink-0 cursor-pointer transition-all border-blue-100 hover:border-blue-300 hover:bg-blue-50/60"
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
                                            className="flex items-center gap-2 bg-white/60 pl-3 pr-4 py-2 rounded-xl border flex-shrink-0 transition-all border-blue-600 shadow-md bg-white cursor-pointer hover:border-blue-300 hover:shadow-sm"
                                        >
                                            <span className="bg-gray-200 text-gray-500 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{idx + 1}</span>
                                            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mr-1">{id ? (church?.Name ? 'Change' : 'Select') : 'Select'}</span>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 bg-white/60 pl-3 pr-4 py-2 rounded-xl border flex-shrink-0 transition-all border-dashed border-gray-300 opacity-50"
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
                                onClick={handleAutoSelect}
                                className={`floating-action-btn !h-12 !w-12 !rounded-xl !shadow-sm !border !border-blue-100/50 !text-blue-600 active:!scale-95 bg-white transition-all ${geoLoading ? 'animate-pulse' : ''}`}
                                title="Auto-select 7 nearest churches"
                            >
                                <i className={`${geoLoading ? 'fas fa-spinner fa-spin' : 'fa-solid fa-location-crosshairs'} text-lg`}></i>
                            </button>
                            <button
                                onClick={() => setShowMapSelection(true)}
                                className={`floating-action-btn ml-2 !h-12 !w-12 !rounded-xl !shadow-sm !border !border-blue-100/50 !text-blue-600 active:!scale-95 bg-white transition-all`}
                                title="Select via Map"
                            >
                                <i className="fas fa-map text-lg"></i>
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
                                    <div key={church.id} className="church-select-item rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden group border-gray-100 opacity-60 bg-gray-50">
                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center flex-shrink-0 font-black text-sm relative z-10 border-2 border-white shadow-sm">
                                                <i className="fas fa-check"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-bold text-gray-900 text-sm truncate text-gray-500">{church.Name}</h3>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">PICKED</span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                                                    <i className="fas fa-location-dot text-gray-400 text-[10px]"></i> {church.Location}
                                                </p>
                                            </div>
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
                                        } else {
                                            // Find next empty step
                                            const nextEmptyStep = newTemp.findIndex((id, idx) => !id && idx > currentStep);
                                            if (nextEmptyStep !== -1) {
                                                setCurrentStep(nextEmptyStep);
                                            } else {
                                                // No empty steps after current, find first empty from beginning
                                                const firstEmpty = newTemp.findIndex(id => !id);
                                                if (firstEmpty !== -1) {
                                                    setCurrentStep(firstEmpty);
                                                }
                                            }
                                        }
                                    }}
                                    className={`church-select-item rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden group shadow-sm hover:shadow-md hover:border-blue-200 active:scale-[0.98] ${isCurrentSlot ? 'border-blue-600 bg-blue-50/40' : 'border-white bg-white'
                                        }`}
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
    if (visitaChurches.length === 0) {
        return (
            <div id="tab-visita" className="tab-content h-full overflow-y-auto px-4 pt-0 pb-20 bg-gray-50 active flex flex-col items-center justify-center p-8">
                <div className="mb-8 drop-shadow-2xl text-blue-600">
                    <i className="fas fa-cross text-8xl"></i>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-3 text-center">Visita Iglesia</h1>
                <p className="text-sm text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed text-center">
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
            {/* Pilgrimage Progress Header */}
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
                {/* 1. Opening Guide */}
                <div className="mb-6 bg-blue-600 rounded-[32px] p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fas fa-info-circle text-6xl"></i></div>
                    <h3 className="font-black text-xl mb-2 leading-tight">Begin Your Pilgrimage</h3>
                    <p className="text-blue-100 text-xs mb-8">Follow these tips and guides for a meaningful visiting experience.</p>

                    <button
                        onClick={() => {
                            onChurchClick({ Name: 'Begin Your Pilgrimage', id: 'opening', Coords: [9.85, 124.1], Diocese: 'Instruction' }, { text: 'VISITA IGLESIA', icon: 'fas fa-info-circle', color: 'text-blue-600' });
                        }}
                        className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span>View</span>
                    </button>
                </div>

                {/* 2. Churches */}
                {visitaChurches.map((id, index) => {
                    const church = churches.find(c => c.id === id);
                    if (!church) return null;
                    const prayerIdx = index + 1;
                    const isDone = visitaProgress.includes(prayerIdx);

                    // Determine if this is the "Next" station
                    const firstUndoneIndex = visitaChurches.findIndex((_, idx) => !visitaProgress.includes(idx + 1));
                    const isNext = index === firstUndoneIndex;

                    if (isDone) {
                        return (
                            <div key={id} className="mb-4 relative px-0">
                                <div className="rounded-2xl p-5 border border-blue-600 bg-blue-50/10 shadow-md shadow-blue-100 active:scale-98 transition-all hover:border-blue-200 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-blue-600/5 backdrop-blur-sm -z-10"></div>
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-full ${church.Diocese === 'Tagbilaran' ? 'bg-blue-600' : 'bg-amber-500'} text-white flex items-center justify-center flex-shrink-0 font-black text-lg relative z-10 border-4 border-white shadow-md`}>
                                            <i className="fas fa-check"></i>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 text-lg truncate">{church.Name}</h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        <i className={`fas fa-location-dot ${church.Diocese === 'Tagbilaran' ? 'text-blue-500' : 'text-amber-500'}`}></i> {church.Location}
                                                    </p>
                                                </div>
                                                <span className="bg-blue-600 text-white text-[9px] px-2 py-1 rounded-full font-bold uppercase shadow-sm">Done</span>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const p = prayers[prayerIdx];
                                                        onChurchClick({ ...church, Name: p.title, History: p.prayer }, { text: `STATION ${prayerIdx}`, icon: 'fas fa-book-open', color: 'text-blue-600' });
                                                    }}
                                                    className="flex-1 bg-white text-blue-600 py-2.5 rounded-xl text-[11px] font-bold border border-blue-100 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <i className="fas fa-book-open mr-1"></i> View Prayer
                                                </button>
                                                <button
                                                    onClick={() => unmarkStation(prayerIdx)}
                                                    className="px-4 py-2.5 bg-red-50/50 text-red-500 rounded-xl text-[11px] font-bold border border-red-50 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <i className="fas fa-undo"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={id} className="mb-4 relative px-0">
                            <div className={`rounded-2xl p-5 border ${isNext ? 'border-blue-50/50' : 'border-gray-100'} shadow-sm active:scale-98 transition-all hover:border-blue-200 relative overflow-hidden`}>
                                <div className={`absolute inset-0 bg-gradient-to-br ${isNext ? 'from-blue-50/90 to-white/90' : 'from-white/95 to-blue-50/20'} backdrop-blur-sm -z-10`}></div>
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-full ${church.Diocese === 'Tagbilaran' ? 'bg-blue-600' : 'bg-amber-500'} text-white flex items-center justify-center flex-shrink-0 font-black text-lg relative z-10 border-4 border-white shadow-md ${!isNext && 'grayscale opacity-70'}`}>
                                        {prayerIdx}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-lg truncate">{church.Name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    <i className={`fas fa-location-dot ${church.Diocese === 'Tagbilaran' ? 'text-blue-500' : 'text-amber-500'}`}></i> {church.Location}
                                                </p>
                                            </div>
                                            {isNext && <span className="bg-blue-100 text-blue-600 text-[9px] px-2 py-1 rounded-full font-bold uppercase animate-pulse shadow-sm">Next</span>}
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${church.Coords[0]},${church.Coords[1]}`, '_blank')}
                                                className="flex-1 bg-white/80 text-blue-600 py-2.5 rounded-xl text-[11px] font-bold border border-blue-50 active:scale-95 transition-all shadow-sm"
                                            >
                                                <i className="fas fa-location-arrow mr-1"></i> Directions
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const p = prayers[prayerIdx];
                                                    onChurchClick({ ...church, Name: p.title, History: p.prayer }, { text: `STATION ${prayerIdx}`, icon: 'fas fa-book-open', color: 'text-blue-600' });
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

                {/* No more closing prayer block here - handled by completion modal in App.jsx */}
            </div>
        </div>
    );
}
