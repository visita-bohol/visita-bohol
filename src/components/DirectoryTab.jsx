import { useState, useMemo, useRef } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { MONTHS, calculateDistance } from '../utils/helpers';
import ChurchCard from './ChurchCard';

export default function DirectoryTab({ churches, visitedChurches, onChurchClick }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dioceseFilter, setDioceseFilter] = useState('All');
    const { location, getLocation, loading: geoLoading } = useGeolocation();
    const fiestaContainerRef = useRef(null);

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
        <div id="tab-directory" className="tab-content h-full overflow-y-auto px-4 pt-0 pb-20 bg-gray-50 no-scrollbar">
            {/* EXACT HTML STRUCTURE FROM USER */}
            <div className="header-ui-container inline-header" id="top-ui" style={{ display: 'flex' }}>
                <div className="flex gap-2">
                    <div className="search-input-wrapper flex-1">
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

            <div className="px-4 pb-32 max-w-[1400px] mx-auto">
                {/* Fiestas this Month Section */}
                {currentMonthChurches.length > 0 && (
                    <div className="mb-8 relative overflow-hidden px-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600/60 flex items-center gap-2">
                                <i className="fas fa-star text-amber-500"></i> Fiestas this Month
                            </h2>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                                {MONTHS[currentMonth]}
                            </span>
                        </div>

                        <div className="flex overflow-x-auto gap-4 pb-4 -mx-1 px-1 snap-x no-scrollbar scroll-smooth">
                            {currentMonthChurches.map(church => {
                                const isTagbilaran = church.Diocese === 'Tagbilaran';
                                const iconBg = isTagbilaran ? 'bg-blue-600' : 'bg-amber-500';
                                return (
                                    <div
                                        key={church.id}
                                        className="rounded-3xl p-5 border border-blue-50 shadow-sm active:scale-95 transition-all w-[300px] flex-shrink-0 snap-start bg-white relative overflow-hidden"
                                        onClick={() => onChurchClick(church)}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 ${iconBg} text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                <i className="fas fa-church text-xl"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-gray-900 text-[15px] leading-tight truncate mb-1 uppercase tracking-tight">{church.Name}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 truncate flex items-center gap-1.5 uppercase tracking-wide mb-3">
                                                    <i className={`fas fa-location-dot ${isTagbilaran ? 'text-blue-500' : 'text-amber-500'}`}></i> {church.Location}
                                                </p>

                                                <div className="pt-3 border-t border-gray-100">
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter leading-none">{church.Fiesta}</p>
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
                <div className="mb-4 px-2">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-300">Discover All Churches</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                    {filteredChurches.map(church => (
                        <ChurchCard
                            key={church.id}
                            church={church}
                            isVisited={visitedChurches.includes(church.id)}
                            onClick={() => onChurchClick(church)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
