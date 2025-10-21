// src/components/PageSEO.jsx
import { useLocation } from "react-router-dom";

export default function PageSEO({ title, description, keywords, canonicalPath, robots = "index,follow" }) {
  const { pathname, search } = useLocation();
  const canon = `https://engageswap.in${canonicalPath ?? pathname}`; // ignore query by default
  return (
    <>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canon} />
      {/* Social defaults (optional) */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canon} />
      <meta property="og:image" content="https://engageswap.in/web-app-manifest-512x512.png" />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content="https://engageswap.in/web-app-manifest-512x512.png" />
    </>
  );
}
