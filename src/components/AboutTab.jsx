export default function AboutTab() {
    return (
        <div id="tab-about" className="tab-content h-full overflow-y-auto px-4 pt-6 pb-32 bg-gray-50 no-scrollbar">
            <div className="max-w-md mx-auto space-y-6">
                {/* App Header */}
                <div className="text-center pt-10 pb-4">
                    <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-100">
                        <i className="fas fa-church text-white text-3xl"></i>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1 italic">Visita Bohol</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Version 1.0.0 • Pilgrimage Edition</p>
                </div>

                {/* Report Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-blue-50">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 text-[15px] uppercase tracking-tight">Report Inaccuracies</h3>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide leading-none mt-1">Help us improve our records</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-6 leading-relaxed font-medium">
                        If you notice incorrect mass schedules, feast dates, or other church details, please let us know immediately through our support email.
                    </p>
                    <a href="mailto:feedback.visitabohol@gmail.com"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-blue-100 active:scale-95 transition-all uppercase tracking-widest">
                        <i className="fas fa-envelope"></i> Contact Support
                    </a>
                </div>

                {/* Info Card */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-blue-50">
                    <h3 className="font-black text-gray-900 text-[15px] mb-4 uppercase tracking-tight">About Project</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6">
                        Visita Bohol is your complete spiritual companion for visiting churches across the island. We provide verified mass schedules, historical insights, and a guided pilgrimage experience for devotees.
                    </p>

                    <div className="pt-5 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            <i className="fas fa-code"></i>
                            <span>Developed for Bohol Parishes</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                            <i className="fas fa-check text-green-500 text-[10px]"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
