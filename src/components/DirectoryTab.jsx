import { useState, useMemo, useRef } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { MONTHS, calculateDistance } from '../utils/helpers';
import ChurchCard from './ChurchCard';

export default function DirectoryTab({ churches, visitedChurches, onChurchClick, initialSearchTerm, onViewOnMap }) {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [dioceseFilter, setDioceseFilter] = useState('All');
    const { location, getLocation, loading: geoLoading } = useGeolocation();
    const fiestaContainerRef = useRef(null);

    // Sync init search term
    useEffect(() => {
        if (initialSearchTerm) {
            setSearchTerm(initialSearchTerm);
        }
    }, [initialSearchTerm]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const today = now.getDate();

    const filteredChurches = useMemo(() => {
        return churches.filter(church => {
            const matchesSearch =
                church.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                church.Location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDiocese = dioceseFilter === 'All' || church.Diocese === dioceseFilter;
            return matchesSearch && matchesDiocese;
        });
    }, [churches, searchTerm, dioceseFilter]);

    const currentMonthChurches = useMemo(() => {
        return filteredChurches
            .filter(c => c.FiestaMonth === currentMonth)
            .sort((a, b) => {
                const getDay = (str) => {
                    const match = str.match(/\d+/);
                    return match ? parseInt(match[0]) : 0;
                };
                const dayA = getDay(a.Fiesta);
                const dayB = getDay(b.Fiesta);
                const scoreA = dayA < today ? dayA + 100 : dayA;
                const scoreB = dayB < today ? dayB + 100 : dayB;
                return scoreA - scoreB;
            });
    }, [filteredChurches, currentMonth, today]);

    const findNearest = () => {
        if (!location) {
            getLocation();
            return;
        }

        const churchesWithDistance = churches.map(church => ({
            ...church,
            distance: calculateDistance(location.latitude, location.longitude, church.Coords[0], church.Coords[1])
        }));

        const nearest = churchesWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 3);
        const nearestChurch = nearest[0];

        onChurchClick(nearestChurch, {
            text: `Nearest Church · ${nearestChurch.distance.toFixed(1)} km away`,
            icon: 'fas fa-compass',
            color: 'text-green-600'
        });
    };

    return (
        <div id="tab-directory" className="tab-content h-full overflow-y-auto pt-0 pb-20 bg-gray-50 no-scrollbar">
            {/* EXACT HTML STRUCTURE FROM USER */}
            <div className="header-ui-container inline-header" id="top-ui" style={{ display: 'flex' }}>
                <div className="flex gap-2">
                    <div className="search-input-wrapper flex-1 min-w-0">
                        <i className="fas fa-search text-gray-400 text-sm"></i>
                        <input
                            type="text"
                            id="main-search"
                            placeholder="Search churches..."
                            autoComplete="off"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={getLocation} id="locate-btn" className="floating-action-btn">
                        <i className={`fas ${geoLoading ? 'fa-spinner fa-spin' : 'fa-location-arrow'} text-lg`}></i>
                    </button>
                    <button onClick={findNearest} id="nearest-btn" className="floating-action-btn" title="Find Nearest Church">
                        <i className="fas fa-compass text-lg"></i>
                    </button>
                </div>

                {/* Diocese Filter Pills */}
                <div className="diocese-filter-container">
                    <button onClick={() => setDioceseFilter('All')} className={`diocese-pill ${dioceseFilter === 'All' ? 'active' : ''}`}>All</button>
                    <button onClick={() => setDioceseFilter('Tagbilaran')} className={`diocese-pill ${dioceseFilter === 'Tagbilaran' ? 'active' : ''}`}>Diocese of Tagbilaran</button>
                    <button onClick={() => setDioceseFilter('Talibon')} className={`diocese-pill ${dioceseFilter === 'Talibon' ? 'active' : ''}`}>Diocese of Talibon</button>
                </div>
            </div>

            <div className="px-4 pb-32 mx-auto">
                {/* Fiestas this Month Section */}
                {currentMonthChurches.length > 0 && (
                    <div className="mb-6 relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                                <i className="fas fa-star text-amber-500"></i> Fiestas this Month
                            </h2>
                            <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ring-1 ring-blue-200">
                                {MONTHS[currentMonth]}
                            </span>
                        </div>

                        <div className="hidden md:flex gap-2 absolute top-0 right-2 z-20">
                            <button
                                onClick={() => {
                                    if (fiestaContainerRef.current) {
                                        fiestaContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                                    }
                                }}
                                className="w-7 h-7 rounded-full bg-white/80 border border-blue-200 shadow-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors backdrop-blur-sm"
                            >
                                <i className="fas fa-chevron-left text-[10px]"></i>
                            </button>
                            <button
                                onClick={() => {
                                    if (fiestaContainerRef.current) {
                                        fiestaContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                                    }
                                }}
                                className="w-7 h-7 rounded-full bg-white/80 border border-blue-200 shadow-sm flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors backdrop-blur-sm"
                            >
                                <i className="fas fa-chevron-right text-[10px]"></i>
                            </button>
                        </div>

                        <div
                            ref={fiestaContainerRef}
                            id="fiesta-container"
                            className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x no-scrollbar scroll-smooth"
                        >
                            {currentMonthChurches.map(church => {
                                const isTagbilaran = church.Diocese === 'Tagbilaran';
                                const iconBg = isTagbilaran ? 'bg-blue-600' : 'bg-amber-500';
                                const iconShadow = isTagbilaran ? 'shadow-blue-200' : 'shadow-amber-200';

                                return (
                                    <div
                                        key={church.id}
                                        className="fiesta-card-horizontal rounded-2xl p-4 border border-blue-100/50 shadow-md shadow-blue-500/5 active:scale-95 transition-all hover:border-blue-300 relative overflow-hidden flex-shrink-0 snap-start"
                                        onClick={() => onChurchClick(church)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-sm -z-10"></div>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 ${iconBg} text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${iconShadow}`}>
                                                <i className="fas fa-church text-xl"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-gray-900 text-base leading-tight truncate mb-1">
                                                    {church.Name}
                                                </h3>
                                                <p className="text-[10px] font-semibold text-gray-500 truncate flex items-center gap-2 mb-2">
                                                    <span><i className={`fas fa-location-dot ${isTagbilaran ? 'text-blue-500' : 'text-amber-500'}`}></i> {church.Location}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className={`${isTagbilaran ? 'text-blue-600' : 'text-amber-600'} font-bold`}>
                                                        <i className="fas fa-calendar-alt text-[9px] mr-1"></i>{church.Fiesta}
                                                    </span>
                                                </p>

                                                <div className="pt-2 border-t border-gray-100/50">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Sunday Mass</p>
                                                    <p className="text-[10px] font-semibold text-gray-700 flex items-center gap-1.5">
                                                        <i className={`fas fa-clock ${isTagbilaran ? 'text-blue-400' : 'text-amber-400'}`}></i>
                                                        <span className="truncate">{church.Mass || "Schedule Varies"}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Discovery Section */}
                <div className="mb-4 px-1">
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Discover All Churches</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                    {filteredChurches.map(church => (
                        <ChurchCard
                            key={church.id}
                            church={church}
                            isVisited={visitedChurches.includes(church.id)}
                            onClick={() => onChurchClick(church)}
                            onViewOnMap={() => onViewOnMap(church)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
