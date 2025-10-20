export default function Button({ as = "button", className = "", variant = "primary", ...props }) {
  const Comp = as;

  // Base classes that always apply
  const baseClasses = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";

  // Variant classes (only apply if no className provided with color classes)
  const hasCustomColors = className.includes('bg-') || className.includes('text-');
  const variantClasses = !hasCustomColors && variant === "primary"
    ? "bg-teal-600 text-white hover:bg-teal-700"
    : "";

  return (
    <Comp
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    />
  );
}
