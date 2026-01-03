import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

// Reuse helper for icons
const createChurchIcon = (church, isSelected, isTaken) => {
    // Default Colors
    let markerColor = church.Diocese === 'Tagbilaran' ? '#2563eb' : '#f59e0b';
    let content = '<i class="fas fa-church text-[12px]"></i>';
    let borderColor = 'white';

    // Grey out if taken by another step
    if (isTaken) {
        markerColor = '#9ca3af'; // gray-400
        borderColor = '#d1d5db'; // gray-300
    }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full" 
                 style="background-color: ${markerColor}; border: 2px solid ${borderColor}; color: white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; opacity: ${isTaken ? '0.5' : '1'}">
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
                        // Robust check with string comparison
                        const takenIndex = selectedIds ? selectedIds.findIndex(id => id && String(id) === String(church.id)) : -1;

                        // Show as grey if already picked (in any step)
                        const isTaken = takenIndex !== -1;

                        return (
                            <Marker
                                key={church.id}
                                position={church.Coords}
                                icon={createChurchIcon(church, selectedChurch?.id === church.id, isTaken)}
                                eventHandlers={{
                                    click: () => handleChurchClick(church)
                                }}
                            />
                        );
                    })}

                    <MapRefresher center={activeCenter} zoom={activeZoom} />
                </MapContainer>

                {/* Floating GPS Button */}
                <button
                    onClick={handleLocate}
                    className="absolute top-4 right-4 z-[400] w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center text-blue-600 active:scale-95 transition-transform"
                >
                    <i className={`fas ${geoLoading && isLocating ? 'fa-spinner fa-spin' : 'fa-location-dot'} text-lg`}></i>
                </button>

                {/* Simplified Selection Modal - Bottom Card */}
                {selectedChurch && (
                    <div className="absolute bottom-6 left-4 right-4 z-[500] animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-4">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md ${selectedChurch.Diocese === 'Tagbilaran' ? 'bg-blue-600 shadow-blue-200' : 'bg-amber-500 shadow-amber-200'}`}>
                                    <i className="fas fa-church text-xl"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{selectedChurch.Name}</h3>
                                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                                        <i className="fas fa-location-dot text-gray-400"></i> {selectedChurch.Location}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selectedChurch.Diocese === 'Tagbilaran' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {selectedChurch.Diocese === 'Tagbilaran' ? 'Diocese of Tagbilaran' : 'Diocese of Talibon'}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={confirmSelection}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span>Select this Church</span>
                                <i className="fas fa-check-circle"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
