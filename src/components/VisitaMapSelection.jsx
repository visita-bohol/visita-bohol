import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

// Reuse helper for icons
const createChurchIcon = (church, isSelected, takenStep) => {
    // If takenStep is defined, it means it's occupied by another step (1-based index)
    // takenStep is the NUMBER (1, 2, 3...)

    // Default Colors
    let markerColor = church.Diocese === 'Tagbilaran' ? '#2563eb' : '#f59e0b';
    let content = '<i class="fas fa-church text-[12px]"></i>';
    let borderColor = 'white';

    if (takenStep) {
        markerColor = '#f97316'; // Orange-500
        content = `<span class="font-black text-xs">${takenStep}</span>`;
    }

    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="flex items-center justify-center w-8 h-8 rounded-full" 
                 style="background-color: ${markerColor}; border: 2px solid ${borderColor}; color: white; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}">
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

export default function VisitaMapSelection({ churches, onSelect, onClose, currentStep, selectedIds }) {
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
        // Check if church is taken by another step
        const takenIndex = selectedIds ? selectedIds.indexOf(church.id) : -1;

        // If it is taken AND it is NOT the current step we are editing
        if (takenIndex !== -1 && takenIndex !== currentStep) {
            // It is taken by someone else
            // Maybe show a toast or simplified modal saying it's unavailable?
            // For now, let's just NOT select it and set selectedChurch to null (or special state)
            setSelectedChurch({ ...church, isTaken: true, takenStep: takenIndex + 1 });
            setActiveCenter(church.Coords);
            setActiveZoom(16);
            return;
        }

        setSelectedChurch(church);
        setActiveCenter(church.Coords);
        setActiveZoom(16);
    };

    const confirmSelection = () => {
        if (selectedChurch && !selectedChurch.isTaken) {
            onSelect(selectedChurch.id);
        }
    };

    return (
        <div className="fixed inset-0 z-[6000] bg-white flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200"
                    >
                        <i className="fas fa-arrow-left text-sm"></i>
                    </button>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 block">Step {currentStep + 1}</span>
                        <h2 className="text-sm font-bold text-gray-900">Select via Map</h2>
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
                        const takenIndex = selectedIds ? selectedIds.indexOf(church.id) : -1;
                        const isTaken = takenIndex !== -1 && takenIndex !== currentStep;
                        const takenStep = isTaken ? takenIndex + 1 : null;

                        return (
                            <Marker
                                key={church.id}
                                position={church.Coords}
                                icon={createChurchIcon(church, selectedChurch?.id === church.id, takenStep)}
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
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md ${selectedChurch.isTaken ? 'bg-orange-500 shadow-orange-200' : (selectedChurch.Diocese === 'Tagbilaran' ? 'bg-blue-600 shadow-blue-200' : 'bg-amber-500 shadow-amber-200')}`}>
                                    <i className={`fas ${selectedChurch.isTaken ? 'fa-ban' : 'fa-church'} text-xl`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-900 text-lg leading-tight mb-1">{selectedChurch.Name}</h3>

                                    {selectedChurch.isTaken ? (
                                        <p className="text-xs text-orange-600 font-bold flex items-center gap-1.5 mb-1">
                                            <i className="fas fa-exclamation-circle"></i> Already selected for Step {selectedChurch.takenStep}
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                                                <i className="fas fa-location-dot text-gray-400"></i> {selectedChurch.Location}
                                            </p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${selectedChurch.Diocese === 'Tagbilaran' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {selectedChurch.Diocese === 'Tagbilaran' ? 'Diocese of Tagbilaran' : 'Diocese of Talibon'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={confirmSelection}
                                disabled={selectedChurch.isTaken}
                                className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${selectedChurch.isTaken
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-blue-600 text-white shadow-blue-200 active:scale-95'
                                    }`}
                            >
                                <span>{selectedChurch.isTaken ? 'Unavailable' : 'Select this Church'}</span>
                                <i className={`fas ${selectedChurch.isTaken ? 'fa-lock' : 'fa-check-circle'}`}></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
