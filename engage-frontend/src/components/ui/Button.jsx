export default function Button({ as = "button", className = "", ...props }) {
  const Comp = as;
  return (
    <Comp
      className={
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition " +
        "bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed " +
        className
      }
      {...props}
    />
  );
}
