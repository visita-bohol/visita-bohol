export default function ChurchCard({ church, isVisited, onClick, onViewOnMap }) {
    const isTagbilaran = church.Diocese === 'Tagbilaran';
    const iconBg = isTagbilaran ? 'bg-blue-600' : 'bg-amber-500';
    const SundayMass = church.Mass ? church.Mass.split('|')[0].replace('Sun:', '').trim() : 'Schedule varies';

    return (
        <div
            className="rounded-2xl p-5 border border-blue-50/50 shadow-sm active:scale-98 transition-all hover:border-blue-200 relative overflow-hidden group cursor-pointer"
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-blue-50/30 backdrop-blur-sm -z-10"></div>

            <div className="flex items-start gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-full ${iconBg} text-white flex items-center justify-center flex-shrink-0 font-black text-lg relative z-10 border-4 border-white shadow-md`}>
                    <i className="fas fa-church text-base"></i>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg truncate">{church.Name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                <span><i className={`fas fa-location-dot ${isTagbilaran ? 'text-blue-500' : 'text-amber-500'}`}></i> {church.Location}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className={`${isTagbilaran ? 'text-blue-600' : 'text-amber-600'} font-semibold`}><i className="fas fa-calendar-alt text-[10px] mr-1"></i>{church.Fiesta}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sunday Mass</p>
                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                            <i className={`fas fa-clock ${isTagbilaran ? 'text-blue-400' : 'text-amber-400'}`}></i>
                            <span className="truncate">{SundayMass}</span>
                        </p>
                    </div>

                    <div className="mt-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onViewOnMap) onViewOnMap();
                            }}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl text-[11px] font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all"
                        >
                            <i className="fas fa-map-pin mr-1"></i> View Church Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
