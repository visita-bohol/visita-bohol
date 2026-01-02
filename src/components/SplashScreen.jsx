export default function SplashScreen() {
    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-all duration-700">
            <div className="flex flex-col items-center text-center px-6 animate-pulse">
                <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white text-4xl shadow-2xl mb-8 shadow-blue-200">
                    <i className="fas fa-church"></i>
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2 italic">
                    Visita Bohol
                </h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] ml-1">
                    Pilgrimage Edition
                </p>
            </div>

            <div className="absolute bottom-16 flex flex-col items-center gap-3">
                <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-1/2 rounded-full animate-[loading_2s_infinite]"></div>
                </div>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Loading...</p>
            </div>

            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}
