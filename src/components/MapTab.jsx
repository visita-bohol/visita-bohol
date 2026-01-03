import { MapContainer, TileLayer, Marker, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/helpers';
import AddChurchModal from './AddChurchModal';

function MapRefresher({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 15);
    }, [center, zoom, map]);
    return null;
}

const MapClickHandler = ({ isAddMode, onMapClick }) => {
    useMapEvents({
        click(e) {
            if (isAddMode) {
                onMapClick(e.latlng);
            }
        },
    });
    const map = useMap();
    useEffect(() => {
        if (isAddMode) {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = '';
        }
    }, [isAddMode, map]);
    return null;
};

export default function MapTab({ churches, visitedChurches, onChurchClick, initialFocusChurch }) {
    const { location, getLocation, loading: geoLoading } = useGeolocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [dioceseFilter, setDioceseFilter] = useState('All');
    const [activeCenter, setActiveCenter] = useState(initialFocusChurch ? initialFocusChurch.Coords : [9.85, 124.15]);
    const [activeZoom, setActiveZoom] = useState(initialFocusChurch ? 16 : 10);
    const [isLocating, setIsLocating] = useState(false);
    const [isFindingNearest, setIsFindingNearest] = useState(false);

    // Add Missing Church State
    const [isAddMode, setIsAddMode] = useState(false);
    const [tempCoordinate, setTempCoordinate] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (initialFocusChurch) {
            setActiveCenter(initialFocusChurch.Coords);
            setActiveZoom(16);
        }
    }, [initialFocusChurch]);

    const performNearestSearch = (loc) => {
        const churchesWithDistance = churches.map(church => ({
            ...church,
            distance: calculateDistance(loc.latitude, loc.longitude, church.Coords[0], church.Coords[1])
        }));
        const nearest = churchesWithDistance.sort((a, b) => a.distance - b.distance).slice(0, 3);
        const nearestChurch = nearest[0];
        setActiveCenter(nearestChurch.Coords);
        setActiveZoom(16);
        onChurchClick(nearestChurch, {
            text: `Nearest Church · ${nearestChurch.distance.toFixed(1)} km away`,
            icon: 'fas fa-compass',
            color: 'text-green-600'
        });
    };

    useEffect(() => {
        if (location && !geoLoading) {
            if (isLocating) {
                setActiveCenter([location.latitude, location.longitude]);
                setActiveZoom(15);
                setIsLocating(false);
            }
            if (isFindingNearest) {
                performNearestSearch(location);
                setIsFindingNearest(false);
            }
        }
    }, [location, geoLoading, isLocating, isFindingNearest]);

    const handleLocate = () => {
        setIsFindingNearest(false);
        setIsLocating(true);
        getLocation();
    };

    const enableAddMode = () => {
        setIsAddMode(true);
        setTempCoordinate(null);
        // Clear search or filters if needed, or leave them
    };

    const handleMapClick = (latlng) => {
        setTempCoordinate(latlng);
        setIsAddMode(false);
        // Small delay to show the pin before opening modal? Optional.
        setTimeout(() => setShowAddModal(true), 300);
    };

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

    const createTempIcon = () => L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 animate-bounce" style="border: 2px solid white; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                            <i class="fas fa-map-pin text-sm"></i>
                        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    const findNearest = () => {
        if (!location) {
            setIsLocating(false);
            setIsFindingNearest(true);
            getLocation();
            return;
        }
        performNearestSearch(location);
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
                    <button onClick={handleLocate} id="locate-btn" className="floating-action-btn">
                        <i className={`fas ${geoLoading && isLocating ? 'fa-spinner fa-spin' : 'fa-location-arrow'} text-lg`}></i>
                    </button>
                    <button onClick={findNearest} id="nearest-btn" className="floating-action-btn" title="Find Nearest Church">
                        <i className={`fas ${geoLoading && isFindingNearest ? 'fa-spinner fa-spin' : 'fa-compass'} text-lg`}></i>
                    </button>
                    <button onClick={enableAddMode} id="add-btn" className={`floating-action-btn ${isAddMode ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-400' : 'text-amber-500 bg-amber-100 border-amber-200'}`} title="Add Missing Church">
                        <i className="fas fa-map-pin text-lg"></i>
                    </button>
                </div>

                {/* Diocese Filter Pills */}
                <div className="diocese-filter-container">
                    <button onClick={() => setDioceseFilter('All')} className={`diocese-pill ${dioceseFilter === 'All' ? 'active' : ''}`}>All</button>
                    <button onClick={() => setDioceseFilter('Tagbilaran')} className={`diocese-pill ${dioceseFilter === 'Tagbilaran' ? 'active' : ''}`}>Diocese of Tagbilaran</button>
                    <button onClick={() => setDioceseFilter('Talibon')} className={`diocese-pill ${dioceseFilter === 'Talibon' ? 'active' : ''}`}>Diocese of Talibon</button>
                </div>
            </div>

            {/* Instruction Overlay (Styled like Toast) */}
            {isAddMode && (
                <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[3000] pointer-events-none flex flex-col gap-2 items-center w-full max-w-[90%] animate-in fade-in slide-in-from-top-4">
                    <div className="bg-gray-900/95 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-xl backdrop-blur-sm flex items-center gap-2 border border-white/10 pointer-events-auto">
                        <i className="fas fa-map-pin text-amber-400 animate-bounce"></i>
                        <span>Tap location on map</span>
                        <button onClick={() => setIsAddMode(false)} className="ml-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                            <i className="fas fa-times text-xs"></i>
                        </button>
                    </div>
                </div>
            )}

            <MapContainer
                center={activeCenter}
                zoom={activeZoom}
                className="h-full w-full"
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler isAddMode={isAddMode} onMapClick={handleMapClick} />

                {filteredChurches.map((church) => (
                    <Marker
                        key={church.id}
                        position={church.Coords}
                        icon={createChurchIcon(church)}
                        eventHandlers={{
                            click: () => {
                                if (!isAddMode) {
                                    setActiveCenter(church.Coords);
                                    setActiveZoom(16);
                                    onChurchClick(church);
                                }
                            }
                        }}
                    />
                ))}

                {location && (
                    <CircleMarker
                        center={[location.latitude, location.longitude]}
                        radius={7}
                        pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 0.8, weight: 3 }}
                    />
                )}

                {tempCoordinate && (
                    <Marker position={tempCoordinate} icon={createTempIcon()} />
                )}

                <MapRefresher center={activeCenter} zoom={activeZoom} />
            </MapContainer>

            <AddChurchModal
                isOpen={showAddModal}
                onClose={() => { setShowAddModal(false); setTempCoordinate(null); }}
                coordinates={tempCoordinate}
            />

            {/* Map Legend */}
            <div className="absolute bottom-6 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 z-[400] text-[10px] font-bold space-y-2">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white shadow-sm"></span>
                    <span className="text-blue-700">Diocese of Tagbilaran</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white shadow-sm"></span>
                    <span className="text-amber-700">Diocese of Talibon</span>
                </div>
            </div>
        </div>
    );
}
