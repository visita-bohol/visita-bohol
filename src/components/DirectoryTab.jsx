import { useState, useMemo, useRef, useEffect } from 'react';
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
        }).sort((a, b) => {
            if (a.FiestaMonth !== b.FiestaMonth) return a.FiestaMonth - b.FiestaMonth;
            const getDay = (str) => {
                const match = str.match(/\d+/);
                return match ? parseInt(match[0]) : 0;
            };
            return getDay(a.Fiesta) - getDay(b.Fiesta);
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
            {/* Premium Header - Matches Visita Selection Layout */}
            <div className="sticky top-0 z-40 w-[100vw] -ml-4 -mr-4 mb-[20px] px-4 pt-4 pb-3 bg-gradient-to-b from-white/95 to-blue-50/95 backdrop-blur-md border-b border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition-all">
                {/* Top Row: Action & Title */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={findNearest}
                        className="flex items-center gap-2 text-gray-600 active:text-blue-600 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 group-active:border-blue-200 flex items-center justify-center shadow-sm transition-colors">
                            <i className="fas fa-location-crosshairs text-xs group-active:text-blue-600"></i>
                        </div>
                        <span className="text-xs font-bold group-active:text-blue-600">Near Me</span>
                    </button>

                    <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-0.5">Browse Parishes</span>
                        <h2 className="text-base font-black text-gray-900 leading-none">Church Directory</h2>
                    </div>

                    <div className="w-16 flex justify-end">
                        <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-lg shadow-sm">
                            {filteredChurches.length}
                        </span>
                    </div>
                </div>

                {/* Middle Row: Diocese Filters (Styled like steps) */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-4">
                    {['All', 'Tagbilaran', 'Talibon'].map((diocese, idx) => {
                        const isActive = dioceseFilter === diocese;
                        const label = diocese === 'All' ? 'All Parishes' : `Diocese of ${diocese}`;
                        return (
                            <div
                                key={diocese}
                                onClick={() => setDioceseFilter(diocese)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border flex-shrink-0 transition-all cursor-pointer ${isActive
                                    ? 'border-blue-600 shadow-md bg-white'
                                    : 'bg-white border-blue-100 shadow-sm hover:border-blue-300 hover:bg-blue-50/60'
                                    }`}
                            >
                                <span className={`text-[10px] font-bold whitespace-nowrap mr-1 ${isActive ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {label}
                                </span>
                                {isActive && <i className="fas fa-check text-[9px] text-blue-600"></i>}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Row: Search Bar */}
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
                </div>
            </div>

            <div className="pb-32 mx-auto">
                {/* Fiestas this Month Section */}
                {currentMonthChurches.length > 0 && (
                    <div className="mb-6 relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-[11px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                                <i className="fas fa-star text-amber-500"></i> Fiestas this Month
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="bg-blue-600 text-white text-[9px] px-2 py-1 rounded-full font-bold uppercase shadow-sm">
                                    {MONTHS[currentMonth]}
                                </span>
                                <div className="hidden md:flex gap-2">
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
                            </div>
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
                                        className="fiesta-card-horizontal rounded-2xl p-4 border border-gray-100 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-50/10 hover:shadow-md hover:shadow-blue-100 active:border-blue-600 active:bg-blue-50/10 relative overflow-hidden flex-shrink-0 snap-start bg-white"
                                        onClick={() => onChurchClick(church)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-sm -z-10"></div>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-full ${iconBg} text-white flex items-center justify-center flex-shrink-0 font-black text-lg relative z-10 border-4 border-white shadow-md ${iconShadow}`}>
                                                <i className="fas fa-church text-base"></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-base leading-tight truncate mb-1">
                                                    {church.Name}
                                                </h3>
                                                <div className="flex items-start justify-between gap-2 overflow-hidden mb-2">
                                                    <span className="text-[10px] font-semibold text-gray-500 truncate flex items-center gap-2">
                                                        <span><i className={`fas fa-location-dot ${isTagbilaran ? 'text-blue-500' : 'text-amber-500'}`}></i> {church.Location}</span>
                                                    </span>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <span className={`${isTagbilaran ? 'text-blue-600' : 'text-amber-600'} font-bold text-[10px]`}>
                                                            <i className="fas fa-calendar-alt text-[9px] mr-1"></i>{church.Fiesta}
                                                        </span>
                                                    </div>
                                                </div>

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
