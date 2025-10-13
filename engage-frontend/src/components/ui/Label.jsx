export default function Label({ className = "", children, ...props }) {
  return (
    <label className={"mb-1 block text-sm font-medium text-slate-700 " + className} {...props}>
      {children}
    </label>
  );
}
