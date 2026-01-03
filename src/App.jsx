import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import BottomNavigation from './components/BottomNavigation';
import MapTab from './components/MapTab';
import DirectoryTab from './components/DirectoryTab';
import VisitaTab from './components/VisitaTab';
import AboutTab from './components/AboutTab';
import BottomSheet from './components/BottomSheet';
import ToastContainer from './components/ToastContainer';
import EditChurchModal from './components/EditChurchModal';
import { useToast } from './hooks/useToast';
import { useLocalStorage } from './hooks/useLocalStorage';

function App() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('map');
    const [churches, setChurches] = useState([]);
    const [prayers, setPrayers] = useState([]);
    const [visitedChurches, setVisitedChurches] = useLocalStorage('visitedChurches', []);
    const [selectedChurch, setSelectedChurch] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [specialHeader, setSpecialHeader] = useState(null);
    const [visitaProgress, setVisitaProgress] = useLocalStorage('visitaProgress', []);
    const [visitaChurches, setVisitaChurches] = useLocalStorage('visitaChurches', []);
    const [showCompletion, setShowCompletion] = useState(false);
    const { toasts, addToast, removeToast } = useToast();

    // Data Loading with identical timing to HTML
    useEffect(() => {
        const loadData = async () => {
            try {
                const [churchesRes, prayersRes] = await Promise.all([
                    fetch('/churches.json'),
                    fetch('/prayers.json')
                ]);

                if (!churchesRes.ok || !prayersRes.ok) throw new Error('Data fetch failed');

                const churchesData = await churchesRes.json();
                const prayersData = await prayersRes.json();

                setChurches(churchesData);
                setPrayers(prayersData);

                // Splash screen timing parity
                setTimeout(() => setLoading(false), 2000);
            } catch (error) {
                console.error('Error:', error);
                addToast('Failed to load pilgrimage data', 'error');
            }
        };

        loadData();
    }, []);

    const openSheet = (church, header = null, switchTabState = false) => {
        if (switchTabState) {
            setActiveTab('map');
            // Small delay to allow tab animation/mount before opening sheet
            setTimeout(() => {
                setSpecialHeader(header);
                setSelectedChurch(church);
                setIsSheetOpen(true);
            }, 350);
        } else {
            setSpecialHeader(header);
            setSelectedChurch(church);
            setIsSheetOpen(true);
        }
    };

    const closeSheet = () => {
        setIsSheetOpen(false);
        setTimeout(() => {
            setSelectedChurch(null);
            setSpecialHeader(null);
        }, 400);
    };

    const toggleVisited = (churchId) => {
        setVisitedChurches(prev =>
            prev.includes(churchId)
                ? prev.filter(id => id !== churchId)
                : [...prev, churchId]
        );
    };

    const [hideNav, setHideNav] = useState(false);

    if (loading) return <SplashScreen />;

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-gray-50">
            <main className="flex-1 relative overflow-hidden w-full">
                {activeTab === 'map' && (
                    <MapTab
                        churches={churches}
                        visitedChurches={visitedChurches}
                        onChurchClick={(c, h) => openSheet(c, h, false)}
                        initialFocusChurch={selectedChurch}
                    />
                )}
                {activeTab === 'directory' && (
                    <DirectoryTab
                        churches={churches}
                        visitedChurches={visitedChurches}
                        onChurchClick={(c, h) => openSheet(c, h, true)}
                    />
                )}
                {activeTab === 'visita' && (
                    <VisitaTab
                        churches={churches}
                        prayers={prayers}
                        visitedChurches={visitedChurches}
                        visitaProgress={visitaProgress}
                        setVisitaProgress={setVisitaProgress}
                        visitaChurches={visitaChurches}
                        setVisitaChurches={setVisitaChurches}
                        onVisitChurch={toggleVisited}
                        onChurchClick={(c, h) => openSheet(c, h, false)}
                        setHideNav={setHideNav}
                        addToast={addToast}
                    />
                )}
                {activeTab === 'about' && <AboutTab />}
            </main>

            {!hideNav && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}

            <BottomSheet
                isOpen={isSheetOpen}
                church={selectedChurch}
                isVisited={selectedChurch && visitedChurches.includes(selectedChurch.id)}
                onClose={closeSheet}
                SpecialHeader={specialHeader}
                onToggleVisited={() => selectedChurch && toggleVisited(selectedChurch.id)}
                onEdit={() => {
                    closeSheet();
                    // Small delay to allow sheet to close before opening edit modal
                    setTimeout(() => setShowEditModal(true), 300);
                }}
                onResetPilgrimage={() => {
                    setVisitaChurches([]);
                    setVisitaProgress([]);
                    closeSheet();
                }}
                onVisitaComplete={(idx) => {
                    if (!visitaProgress.includes(idx)) {
                        const newProgress = [...visitaProgress, idx];
                        setVisitaProgress(newProgress);

                        // Check if 7 churches completed (indices 1-7)
                        const completedCount = newProgress.filter(p => p >= 1 && p <= 7).length;
                        if (completedCount === 7 && idx >= 1 && idx <= 7) {
                            setShowCompletion(true);
                        }
                    }
                    closeSheet();
                }}
            />

            <EditChurchModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                church={selectedChurch}
            />
            {showCompletion && (
                <div id="completion-fullscreen-modal" className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md transition-all duration-500 animate-in fade-in">
                    <div className="bg-white rounded-[40px] p-2 shadow-2xl w-full max-w-sm animate-scale-in relative border border-white">
                        <button onClick={() => setShowCompletion(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90 transition-transform z-10">
                            <i className="fas fa-times text-lg"></i>
                        </button>

                        <div className="bg-white rounded-[38px] p-8 text-center relative overflow-hidden">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 ring-8 ring-blue-50 relative z-10">
                                <i className="fas fa-check text-white text-4xl"></i>
                            </div>

                            <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight relative z-10">Complete!</h2>
                            <p className="text-gray-400 font-bold mb-8 text-sm px-4 leading-relaxed relative z-10">You have successfully visited the 7 churches of your pilgrimage.</p>

                            {/* Church List Card */}
                            <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 relative z-10 text-left mb-6">
                                <p className="text-[9px] uppercase font-black text-gray-400 tracking-[0.1em] mb-4">Pilgrimage Stations</p>
                                <div className="space-y-1">
                                    {visitaChurches.map((id, i) => {
                                        const church = churches.find(c => c.id === id);
                                        return (
                                            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-100/50 last:border-0">
                                                <i className="fas fa-check text-blue-500 text-xs w-4"></i>
                                                <span className="font-bold text-gray-800 text-[11px] truncate">{church?.Name || 'Unknown Site'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button onClick={() => setShowCompletion(false)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 relative z-10">
                                <span>Done</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}

export default App;
