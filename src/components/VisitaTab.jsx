import { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function VisitaTab({ churches, prayers, visitedChurches, onVisitChurch, onChurchClick }) {
    const [visitaChurches, setVisitaChurches] = useLocalStorage('visitaChurches', []);
    const [visitaProgress, setVisitaProgress] = useLocalStorage('visitaProgress', []);
    const [isSelecting, setIsSelecting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tempChurches, setTempChurches] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const completedCount = useMemo(() => visitaProgress.filter(p => p >= 1 && p <= 7).length, [visitaProgress]);

    const startSelection = () => {
        setIsSelecting(true);
        setCurrentStep(0);
        setTempChurches(visitaChurches.length > 0 ? [...visitaChurches] : Array(7).fill(null));
    };

    const confirmSelection = () => {
        if (tempChurches.filter(id => id).length === 7) {
            setVisitaChurches(tempChurches);
            setIsSelecting(false);
        }
    };

    const resetVisita = () => {
        if (window.confirm('Reset your Visita Iglesia journey? This will clear all progress.')) {
            setVisitaChurches([]);
            setVisitaProgress([]);
        }
    };

    // --- SELECTION UI ---
    if (isSelecting) {
        const stepName = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][currentStep];
        const filtered = churches.filter(c =>
            c.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.Location.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => a.Name.localeCompare(b.Name));

        const filledCount = tempChurches.filter(id => id).length;

        return (
            <div id="tab-visita" className="tab-content h-full overflow-y-auto pt-0 pb-20 bg-gradient-to-b from-blue-50 to-white active no-scrollbar">
                <div id="visita-content">
                    <div className="sticky top-0 z-40 px-4 pt-4 pb-4 mb-2 bg-gradient-to-b from-white/95 to-blue-50/95 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_30px_-10px_rgba(37,99,235,0.1)] transition-all">
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

                            <button className="floating-action-btn !h-12 !w-12 !rounded-xl !shadow-sm !border !border-blue-100/50 !text-blue-600 active:!scale-95 bg-white">
                                <i className="fas fa-map-marked-alt text-lg"></i>
                            </button>
                        </div>
                    </div>

                    <div id="church-selection-list" className="space-y-2 mb-28 pt-2 px-4">
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
                                        if (currentStep < 6) setCurrentStep(currentStep + 1);
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

                {filledCount === 7 && (
                    <div className="fixed bottom-24 inset-x-4 z-50">
                        <button
                            onClick={confirmSelection}
                            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 active:scale-95 transition-transform uppercase tracking-widest animate-pulse"
                        >
                            Confirm Seven Churches
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // --- MAIN VISITA UI ---
    if (visitaChurches.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                <div className="w-24 h-24 bg-blue-600 rounded-[35px] flex items-center justify-center mb-8 shadow-2xl rotate-3">
                    <i className="fas fa-cross text-white text-4xl"></i>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4 italic">Visita Iglesia</h1>
                <p className="text-gray-500 text-sm mb-12 font-bold max-w-xs leading-relaxed uppercase tracking-widest px-4">
                    Select 7 churches to begin your holy week pilgrimage.
                </p>
                <button
                    onClick={startSelection}
                    className="w-full max-w-xs bg-blue-600 text-white py-5 rounded-[28px] font-black text-lg shadow-2xl active:scale-95 transition-all uppercase tracking-widest"
                >
                    Choose Churches
                </button>
            </div>
        );
    }

    return (
        <div id="tab-visita" className="h-full overflow-y-auto pt-0 pb-32 bg-gradient-to-b from-blue-50 to-white no-scrollbar">
            <div className="sticky top-0 z-50 px-4 py-5 bg-white/90 backdrop-blur-md border-b border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-route text-blue-600"></i>
                        <span className="font-black text-[11px] text-gray-900 uppercase tracking-[0.2em]">Pilgrimage</span>
                    </div>
                    <button onClick={resetVisita} className="text-red-600 text-[10px] font-bold px-3 py-1.5 bg-red-50 rounded-xl flex items-center gap-1.5 uppercase transition-all active:scale-90">
                        <i className="fas fa-redo"></i> Reset
                    </button>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Progress</span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{completedCount}/7</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-blue-600 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${(completedCount / 7) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-4 pt-6">
                {/* 1. Opening Prayer */}
                <div className="bg-blue-600 rounded-[32px] p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fas fa-cross text-6xl"></i></div>
                    <h3 className="font-black text-xl mb-1 leading-tight uppercase">Start Your Journey</h3>
                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-6 leading-tight">Opening Prayer & Guide</p>
                    <button
                        onClick={() => {
                            const p = prayers[0];
                            onChurchClick({ Name: p.title, History: p.prayer, id: 'opening', Coords: [9.85, 124.1], Diocese: 'Instruction' }, { text: 'VISITA IGLESIA', icon: 'fas fa-cross', color: 'text-blue-600' });
                            if (!visitaProgress.includes(0)) setVisitaProgress(prev => [...prev, 0]);
                        }}
                        className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                        <i className="fas fa-book-open"></i> {visitaProgress.includes(0) ? 'Read Guide' : 'Open Guide'}
                    </button>
                </div>

                {/* 2. Churches */}
                {visitaChurches.map((id, index) => {
                    const church = churches.find(c => c.id === id);
                    if (!church) return null;
                    const prayerIdx = index + 1;
                    const isDone = visitaProgress.includes(prayerIdx);
                    const markerColor = church.Diocese === 'Tagbilaran' ? 'bg-blue-600' : 'bg-amber-500';

                    return (
                        <div key={id} className={`p-5 rounded-[32px] border transition-all relative overflow-hidden ${isDone ? 'bg-white border-green-100 shadow-sm' : 'bg-white border-blue-50 shadow-sm'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-4 border-white shadow-md flex-shrink-0 ${isDone ? 'bg-green-500 text-white' : `${markerColor} text-white`}`}>
                                    {isDone ? <i className="fas fa-check"></i> : index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-gray-900 text-sm truncate uppercase mb-1">{church.Name}</h4>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-4">
                                        <i className="fas fa-location-dot"></i> {church.Location}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${church.Coords[0]},${church.Coords[1]}`, '_blank');
                                            }}
                                            className="flex-1 bg-gray-50 text-gray-600 py-3 rounded-xl text-[10px] font-bold active:scale-95 transition-all border border-gray-100 flex items-center justify-center gap-1.5 uppercase"
                                        >
                                            <i className="fas fa-paper-plane"></i> Directions
                                        </button>
                                        <button
                                            onClick={() => {
                                                const p = prayers[prayerIdx];
                                                onChurchClick({ ...church, Name: p.title, History: p.prayer }, { text: `STATION ${prayerIdx}`, icon: 'fas fa-book-open', color: 'text-blue-600' });
                                                if (!isDone) setVisitaProgress(prev => [...prev, prayerIdx]);
                                            }}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black active:scale-95 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 uppercase"
                                        >
                                            <i className="fas fa-praying-hands"></i> {isDone ? 'Read Again' : 'Start Prayer'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* 3. Closing Prayer */}
                {completedCount === 7 && (
                    <div className="bg-amber-500 rounded-[32px] p-6 text-white shadow-xl shadow-amber-100 relative overflow-hidden group mb-10">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fas fa-crown text-6xl"></i></div>
                        <h3 className="font-black text-xl mb-1 leading-tight uppercase">Final Step</h3>
                        <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest mb-6 leading-tight">Closing Prayer</p>
                        <button
                            onClick={() => {
                                const p = prayers[8];
                                onChurchClick({ Name: p.title, History: p.prayer, id: 'closing', Coords: [9.85, 124.1], Diocese: 'Final' }, { text: 'PILGRIMAGE COMPLETE', icon: 'fas fa-crown', color: 'text-amber-500' });
                                if (!visitaProgress.includes(8)) setVisitaProgress(prev => [...prev, 8]);
                            }}
                            className="w-full bg-white text-amber-600 py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                            <i className="fas fa-book-open"></i> {visitaProgress.includes(8) ? 'Read Again' : 'Confirm Completion'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
