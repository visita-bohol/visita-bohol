export default function ToastContainer({ toasts, onRemove }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-[10000] pointer-events-none flex flex-col gap-2 items-center w-full max-w-[90%]">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className="bg-gray-900/95 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-xl backdrop-blur-sm flex items-center gap-2 border border-white/10 animate-slide-up pointer-events-auto"
                >
                    {toast.type === 'error' && <i className="fas fa-exclamation-circle text-red-400"></i>}
                    {toast.type === 'success' && <i className="fas fa-check-circle text-green-400"></i>}
                    {toast.type === 'info' && <i className="fas fa-info-circle text-blue-400"></i>}
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}
