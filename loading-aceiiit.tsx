// --- Component --- (components/ui/loading-aceiiit.tsx)
import React from "react";

type Part = { d: string; color: string; group: 1 | 2 | 3 | 4 };

// Traced from the AceIIIT logo. viewBox is cropped tight to the wordmark.
// group = draw order (1: "Ace", 2: "III", 3: "T", 4: splash)
const PARTS: Part[] = [
  // A (outer + counter)
  { d: "M132 623L152 383H238L260 623H216L211 585H186L178 623Z M187 545H207L197 425Z", color: "#000", group: 1 },
  // c
  { d: "M335 413C300 413 275 440 275 480V560C275 600 300 625 335 625C370 625 395 605 395 580V545H350V570C350 580 342 585 335 585C328 585 322 580 322 570V470C322 460 328 455 335 455C342 455 350 460 350 470V490H395V460C395 430 370 413 335 413Z", color: "#000", group: 1 },
  // e (outer + counter)
  { d: "M475 413C440 413 415 435 415 470V570C415 605 440 625 475 625C510 625 535 605 535 575V545H490V570C490 580 484 585 475 585C466 585 462 580 462 570V505H535V470C535 435 510 413 475 413Z M462 500V465C462 458 468 453 475 453C482 453 488 458 488 465V500Z", color: "#000", group: 1 },
  // I I I
  { d: "M555 383H607V623H555Z", color: "#C8982D", group: 2 },
  { d: "M618 383H663V623H618Z", color: "#C8982D", group: 2 },
  { d: "M683 383H727V623H683Z", color: "#C8982D", group: 2 },
  // T
  { d: "M742 383H847V425H820V623H770V425H742Z", color: "#C8982D", group: 3 },
  // red splash
  { d: "M800 335C820 322 860 305 900 292C925 292 940 305 938 318C930 340 925 360 920 385C915 405 910 425 898 440H888C888 420 885 410 880 400L868 360C860 350 850 345 830 342C815 342 805 340 800 335Z", color: "#E23B3B", group: 4 },
];

const LoadingAceIIIT: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="110 250 880 400"
        className="aceiiit w-[220px] stroke-[6px]"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Loading"
      >
        {PARTS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            pathLength={1}
            className={`part g${p.group}`}
            stroke={p.color}
            fill={p.color}
            fillRule="evenodd"
          />
        ))}
      </svg>

      <style jsx>{`
        .part {
          --pathlength: 1;
          stroke-dashoffset: var(--pathlength);
          stroke-dasharray: 0 var(--pathlength);
          fill-opacity: 0;
        }
        .g1 { animation: loader1 8s cubic-bezier(0.5, 0.1, 0.5, 1) infinite both; }
        .g2 { animation: loader2 8s cubic-bezier(0.5, 0.1, 0.5, 1) infinite both; }
        .g3 { animation: loader3 8s cubic-bezier(0.5, 0.1, 0.5, 1) infinite both; }
        .g4 { animation: loader4 8s cubic-bezier(0.5, 0.1, 0.5, 1) infinite both; }

        /* Same shape as the bottle keyframes: hold empty, draw, hold drawn until loop.
           Each group starts later so the logo is drawn left to right. */
        @keyframes loader1 {
          0% { stroke-dashoffset: 1; stroke-dasharray: 0 1; fill-opacity: 0; }
          45% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 0; }
          60%, 100% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 1; }
        }
        @keyframes loader2 {
          0%, 20% { stroke-dashoffset: 1; stroke-dasharray: 0 1; fill-opacity: 0; }
          60% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 0; }
          72%, 100% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 1; }
        }
        @keyframes loader3 {
          0%, 40% { stroke-dashoffset: 1; stroke-dasharray: 0 1; fill-opacity: 0; }
          75% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 0; }
          84%, 100% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 1; }
        }
        @keyframes loader4 {
          0%, 60% { stroke-dashoffset: 1; stroke-dasharray: 0 1; fill-opacity: 0; }
          90% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 0; }
          96%, 100% { stroke-dashoffset: 0; stroke-dasharray: 1 0; fill-opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .part { animation: none; stroke-dasharray: 1 0; stroke-dashoffset: 0; fill-opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingAceIIIT;

// --- Demo ---
// import LoadingAceIIIT from "@/components/ui/loading-aceiiit";
// export default function DemoOne() {
//   return <LoadingAceIIIT />;
// }
