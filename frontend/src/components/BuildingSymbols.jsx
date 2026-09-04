import React from "react";

// Reusable pool of coded SVG building shapes per faction — no external
// image files, loads instantly. Swap a <symbol> for an <image> later
// if you source/generate real art; everything else stays the same.

export default function BuildingSymbols() {
  return (
    <>
      {/* FIRE POOL */}
      <symbol id="fire-building-0" viewBox="0 0 40 60">
        <rect x="8" y="20" width="24" height="40" />
        <polygon points="8,20 20,4 32,20" />
      </symbol>
      <symbol id="fire-building-1" viewBox="0 0 40 60">
        <rect x="10" y="30" width="20" height="30" />
        <circle cx="20" cy="20" r="10" />
      </symbol>
      <symbol id="fire-building-2" viewBox="0 0 40 60">
        <rect x="14" y="10" width="12" height="50" />
        <rect x="6" y="40" width="10" height="20" />
        <rect x="24" y="40" width="10" height="20" />
      </symbol>
      <symbol id="fire-building-3" viewBox="0 0 40 60">
        <rect x="12" y="34" width="16" height="26" />
        <rect x="8" y="22" width="24" height="12" />
        <rect x="4" y="10" width="32" height="12" />
      </symbol>
      <symbol id="fire-building-4" viewBox="0 0 40 60">
        <rect x="6" y="26" width="12" height="34" />
        <rect x="22" y="14" width="12" height="46" />
        <line x1="28" y1="14" x2="28" y2="4" strokeWidth="2" stroke="currentColor" />
        <circle cx="28" cy="4" r="2" />
      </symbol>
      <symbol id="fire-building-5" viewBox="0 0 40 60">
        <rect x="10" y="18" width="20" height="42" />
        <rect x="14" y="6" width="12" height="12" />
      </symbol>

      {/* WATER POOL */}
      <symbol id="water-building-0" viewBox="0 0 40 60">
        <rect x="8" y="22" width="24" height="38" />
        <ellipse cx="20" cy="16" rx="12" ry="8" />
      </symbol>
      <symbol id="water-building-1" viewBox="0 0 40 60">
        <rect x="12" y="28" width="16" height="32" />
        <rect x="6" y="10" width="28" height="18" rx="8" />
      </symbol>
      <symbol id="water-building-2" viewBox="0 0 40 60">
        <rect x="16" y="8" width="8" height="52" />
        <rect x="6" y="38" width="10" height="22" />
        <rect x="24" y="38" width="10" height="22" />
      </symbol>
      <symbol id="water-building-3" viewBox="0 0 40 60">
        <rect x="10" y="36" width="20" height="24" />
        <rect x="6" y="24" width="28" height="12" />
        <rect x="2" y="12" width="36" height="12" />
      </symbol>
      <symbol id="water-building-4" viewBox="0 0 40 60">
        <rect x="6" y="24" width="12" height="36" />
        <rect x="22" y="12" width="12" height="48" />
        <circle cx="28" cy="8" r="4" />
      </symbol>
      <symbol id="water-building-5" viewBox="0 0 40 60">
        <rect x="10" y="20" width="20" height="40" />
        <polygon points="10,20 20,8 30,20" />
      </symbol>
    </>
  );
}