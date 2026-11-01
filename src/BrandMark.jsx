import { useId } from 'react';

// ENGLISH MASTER logo mark: speech bubble + "E" built from bars, with a gold AI node.
export default function BrandMark({ className = '' }) {
  const gid = 'em-mark-' + useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5B86FF" />
          <stop offset="1" stopColor="#1B3BC8" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="48" rx="15" fill={`url(#${gid})`} />
      <path d="M17 49l-4 11 17-11z" fill="#1F40CF" />
      <rect x="4.6" y="4.6" width="54.8" height="46.8" rx="14.4" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.2" />
      <g fill="#fff">
        <rect x="19" y="14" width="5.2" height="30" rx="2.6" />
        <rect x="19" y="14" width="25" height="5.2" rx="2.6" />
        <rect x="19" y="26.4" width="18" height="5.2" rx="2.6" />
        <rect x="19" y="38.8" width="25" height="5.2" rx="2.6" />
      </g>
      <path d="M37 29h6" stroke="#E4C46F" strokeWidth="2" strokeLinecap="round" />
      <circle cx="46.5" cy="29" r="3.4" fill="#E4C46F" />
    </svg>
  );
}
