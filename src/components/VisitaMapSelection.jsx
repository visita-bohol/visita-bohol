import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

// Reuse helper for icons
const createChurchIcon = (church, isSelected, isPicked) => {
    // Default Colors
    let markerColor = church.Diocese === 'Tagbilaran' ? '#2563eb' : '#f59e0b';
    let content = '<i class="fas fa-church text-[12px]"></i>';
    let borderColor = 'white';
    let opacity = '1';

    // Grey out if already picked
    if (isPicked) {
        markerColor = '#9ca3af'; // gray-400
        borderColor = '#d1d5db'; // gray-300
        opacity = '0.7'; // More visible than 0.5
    }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full" 
                 style="background-color: ${markerColor}; border: 2px solid ${borderColor}; color: white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; opacity: ${opacity}">
                ${content}
            </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });
};

function MapRefresher({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 15);
    }, [center, zoom, map]);
    return null;
}

export default function VisitaMapSelection({ churches, onSelect, onClose, onBack, currentStep, selectedIds }) {
    const { location, getLocation, loading: geoLoading } = useGeolocation();
    const [selectedChurch, setSelectedChurch] = useState(null);
    const [activeCenter, setActiveCenter] = useState([9.85, 124.15]); // Default Bohol
    const [activeZoom, setActiveZoom] = useState(10);
    const [isLocating, setIsLocating] = useState(false);

    // Initial location check
    useEffect(() => {
        if (!location && !geoLoading) {
            getLocation();
        }
    }, [location, geoLoading, getLocation]);

    useEffect(() => {
        if (location && isLocating) {
            setActiveCenter([location.latitude, location.longitude]);
            setActiveZoom(15);
            setIsLocating(false);
        }
    }, [location, isLocating]);

    const handleLocate = () => {
        setIsLocating(true);
        if (!location) getLocation();
    };

    const handleChurchClick = (church) => {
        // Robust check with string comparison
        const takenIndex = selectedIds ? selectedIds.findIndex(id => id && String(id) === String(church.id)) : -1;

        // If it is taken AND it is NOT the current step we are editing, do nothing
        if (takenIndex !== -1 && takenIndex !== currentStep) {
            return; // Don't allow selection of already-picked churches
        }

        setSelectedChurch(church);
        setActiveCenter(church.Coords);
        setActiveZoom(16);
    };

    const confirmSelection = () => {
        if (selectedChurch) {
            onSelect(selectedChurch.id);
        }
    };

    return (
        <div className="fixed inset-0 z-[6000] bg-white flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-40 w-full px-4 pt-4 pb-3 bg-gradient-to-b from-white/95 to-blue-50/95 backdrop-blur-md border-b border-white/80 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] transition-all">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onBack || onClose}
                        className="flex items-center gap-2 text-gray-600 active:text-blue-600 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 group-active:border-blue-200 flex items-center justify-center shadow-sm transition-colors">
                            <i className="fas fa-arrow-left text-xs group-active:text-blue-600"></i>
                        </div>
                        <span className="text-xs font-bold group-active:text-blue-600">Back</span>
                    </button>

                    <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block mb-0.5">
                            Step {currentStep + 1} of 7
                        </span>
                        <h2 className="text-base font-black text-gray-900 leading-none">
                            Choose {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][currentStep]}
                        </h2>
                    </div>

                    <div className="w-16 flex justify-end">
                        <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 rounded-lg shadow-sm">
                            {selectedIds ? selectedIds.filter(id => id).length : 0}/7
                        </span>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={activeCenter}
                    zoom={activeZoom}
                    className="h-full w-full"
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {location && (
                        <CircleMarker
                            center={[location.latitude, location.longitude]}
                            radius={7}
                            pathOptions={{ color: 'white', fillColor: '#2563eb', fillOpacity: 0.8, weight: 3 }}
                        />
                    )}

                    {churches.map(church => {
                        // Check if this church is already picked (in any step)
                        const isPicked = selectedIds && selectedIds.some(id => id && String(id) === String(church.id));

                        return (
                            <Marker
                                key={church.id}
                                position={church.Coords}
                                icon={createChurchIcon(church, selectedChurch?.id === church.id, isPicked)}
                                eventHandlers={{
                                    click: () => handleChurchClick(church)
                                }}
                            />
                        );
                    })}

                    <MapRefresher center={activeCenter} zoom={activeZoom} />
                </MapContainer>

                {/* Backdrop for selection */}
                <div
                    onClick={() => setSelectedChurch(null)}
                    className={`absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[450] transition-opacity duration-300 ${selectedChurch ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />

                {/* Main-Map Style Selection Sheet */}
                <div
                    className={`absolute bottom-0 left-0 right-0 bg-white z-[500] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] max-h-[70vh]`}
                    style={{
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        transform: selectedChurch ? 'translateY(0)' : 'translateY(100.1%)'
                    }}
                >
                    {/* Handle */}
                    <div className="pt-3 pb-2 cursor-pointer flex-shrink-0" onClick={() => setSelectedChurch(null)}>
                        <div className="w-12 h-1.5 bg-gray-200/80 rounded-full mx-auto"></div>
                    </div>

                    <div className="px-5 pt-2 pb-8 overflow-y-auto no-scrollbar">
                        {selectedChurch && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{selectedChurch.Name}</h2>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-500 font-semibold flex items-center gap-1.5">
                                            <i className="fas fa-map-marker-alt text-blue-500"></i> {selectedChurch.Location}
                                        </p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-tight ${selectedChurch.Diocese === 'Tagbilaran' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {selectedChurch.Diocese}
                                        </span>
                                    </div>
                                </div>

                                {/* History Section */}
                                <div>
                                    <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-3">History</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                                        {selectedChurch.History}
                                    </p>
                                </div>

                                {/* Patronal Fiesta Section */}
                                <div className="flex items-center gap-4 bg-gray-50/80 p-5 rounded-[24px] border border-gray-100">
                                    <div className="w-11 h-11 bg-white text-blue-600 rounded-[18px] flex items-center justify-center shadow-sm flex-shrink-0 border border-white">
                                        <i className="fas fa-calendar-day text-lg"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-1">Patronal Fiesta</p>
                                        <p className="text-[15px] text-gray-900 font-black">{selectedChurch.Fiesta}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={confirmSelection}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <span>Select this Church</span>
                                    <i className="fas fa-check-circle"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
