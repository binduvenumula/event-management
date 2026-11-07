// Placeholder VFSTR logo (shield with a "V"). To use a real logo, drop /public/logo.png and
// replace the <svg> below with: <img src="/logo.png" alt="VFSTR" className={className} />
export default function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="VFSTR logo">
      <path d="M32 3 6 13v18c0 15 11 26 26 30 15-4 26-15 26-30V13z" fill="#0B3C8C" />
      <path d="M32 7 10 15.5V31c0 12.5 9.3 22 22 25.7C44.7 53 54 43.5 54 31V15.5z" fill="#1D4ED8" />
      <path d="M20 21h8l4 14 4-14h8L36 45h-8z" fill="#fff" />
    </svg>
  );
}
