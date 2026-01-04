import { MONTHS } from '../utils/helpers';

export default function ChurchCard({ church, isVisited, onClick, onViewOnMap }) {
    const isTagbilaran = church.Diocese === 'Tagbilaran';
    const iconBg = isTagbilaran ? 'bg-blue-600' : 'bg-amber-500';
    const SundayMass = church.Mass ? church.Mass.split('|')[0].replace('Sun:', '').trim() : 'Schedule varies';

    return (
        <div
            className="church-select-item rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden group shadow-sm hover:border-blue-600 hover:shadow-md hover:shadow-blue-100 active:border-blue-600 active:scale-[0.98] border-white bg-white"
            onClick={onClick}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-blue-50/50 backdrop-blur-sm"></div>

            <div className="flex items-start gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-full ${iconBg} text-white flex items-center justify-center flex-shrink-0 font-black text-lg relative z-10 border-4 border-white shadow-md`}>
                    <i className="fas fa-church text-base"></i>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2 overflow-hidden mb-1">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg truncate">{church.Name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                                    <i className={`fas fa-location-dot ${isTagbilaran ? 'text-blue-500' : 'text-amber-500'}`}></i> {church.Location}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className={`${isTagbilaran ? 'text-blue-600' : 'text-amber-600'} font-bold text-xs`}><i className="fas fa-calendar-alt text-[10px] mr-1"></i>{church.Fiesta}</span>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sunday Mass</p>
                            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                <i className={`fas fa-clock ${isTagbilaran ? 'text-blue-400' : 'text-amber-400'}`}></i>
                                <span className="truncate">{SundayMass}</span>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
