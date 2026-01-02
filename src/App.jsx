import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import BottomNavigation from './components/BottomNavigation';
import MapTab from './components/MapTab';
import DirectoryTab from './components/DirectoryTab';
import VisitaTab from './components/VisitaTab';
import AboutTab from './components/AboutTab';
import BottomSheet from './components/BottomSheet';
import ToastContainer from './components/ToastContainer';
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
    const [specialHeader, setSpecialHeader] = useState(null);
    const [visitaProgress, setVisitaProgress] = useLocalStorage('visitaProgress', []);
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
                        onVisitChurch={toggleVisited}
                        onChurchClick={(c, h) => openSheet(c, h, false)}
                        setHideNav={setHideNav}
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
                onVisitaComplete={(idx) => {
                    if (!visitaProgress.includes(idx)) {
                        setVisitaProgress(prev => [...prev, idx]);
                    }
                    closeSheet();
                }}
            />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}

export default App;
