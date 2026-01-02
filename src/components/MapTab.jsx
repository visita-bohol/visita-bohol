import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/helpers';

function MapRefresher({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 13);
    }, [center, zoom, map]);
    return null;
}

export default function MapTab({ churches, visitedChurches, onChurchClick }) {
    const { location, getLocation, loading: geoLoading } = useGeolocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [dioceseFilter, setDioceseFilter] = useState('All');
    const [mapCenter] = useState([9.85, 124.15]);

    const filteredChurches = useMemo(() => {
        return churches.filter(church => {
            const matchesSearch = church.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                church.Location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDiocese = dioceseFilter === 'All' || church.Diocese === dioceseFilter;
            return matchesSearch && matchesDiocese;
        });
    }, [churches, searchTerm, dioceseFilter]);

    const createChurchIcon = (church) => {
        const isVisited = visitedChurches.includes(church.id);
        const markerColor = church.Diocese === 'Tagbilaran' ? '#2563eb' : '#f59e0b';

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="flex items-center justify-center w-8 h-8 rounded-full ${isVisited ? 'bg-green-500' : ''}" 
                     style="background-color: ${isVisited ? '#22c55e' : markerColor}; border: 2px solid white; color: white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);">
                    <i class="fas fa-church text-[12px]"></i>
                </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });
    };

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
        <div className="h-full w-full relative">
            {/* MATCHING EXACT HTML STRUCTURE */}
            <div className="header-ui-container floating-header" id="top-ui" style={{ display: 'flex' }}>
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

            <MapContainer
                center={mapCenter}
                zoom={10}
                className="h-full w-full"
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredChurches.map((church) => (
                    <Marker
                        key={church.id}
                        position={church.Coords}
                        icon={createChurchIcon(church)}
                        eventHandlers={{ click: () => onChurchClick(church) }}
                    />
                ))}
                {location && (
                    <CircleMarker
                        center={[location.latitude, location.longitude]}
                        radius={7}
                        pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 0.8, weight: 3 }}
                    />
                )}
                <MapRefresher />
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute bottom-6 right-4 bg-white/95 backdrop-blur-md p-4 rounded-[24px] shadow-2xl border border-gray-100 z-[400] text-[10px] font-black space-y-3 min-w-[170px]">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-50"></span>
                    <span className="text-gray-900 uppercase tracking-tighter">Diocese of Tagbilaran</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-50"></span>
                    <span className="text-gray-900 uppercase tracking-tighter">Diocese of Talibon</span>
                </div>
            </div>
        </div>
    );
}
