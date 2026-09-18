export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
