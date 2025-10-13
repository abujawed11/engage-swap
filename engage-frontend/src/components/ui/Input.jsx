export default function Input({ className = "", ...props }) {
  return (
    <input
      className={
        "w-full rounded-lg border px-3 py-2 text-sm outline-none " +
        "border-slate-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 " +
        className
      }
      {...props}
    />
  );
}
