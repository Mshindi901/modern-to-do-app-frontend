export default function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
    ghost: 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
