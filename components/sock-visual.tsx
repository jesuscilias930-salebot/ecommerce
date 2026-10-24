"use client";
import { useId } from "react";
import type { Original } from "@/lib/product-catalog";

/** Ilustración de referencia cuando el producto no tiene fotos. */
export function SockVisual({ product }: { product: Original }) {
  const id = useId().replaceAll(":", "");
  const dark = /negro|caballero/i.test(product.name),
    cartoon = /caricatura/i.test(product.name);
  const color = dark ? "#344a43" : cartoon ? "#e4bfbb" : "#fffef8";
  return (
    <svg
      viewBox="0 0 300 210"
      role="img"
      aria-label={`Ilustración de referencia: ${product.name}`}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop stopColor={color} />
          <stop offset="1" stopColor={dark ? "#172e26" : "#d8d9cf"} />
        </linearGradient>
      </defs>
      <ellipse cx="153" cy="186" rx="79" ry="9" fill="#183c32" opacity=".08" />
      {[0, 1].map((i) => (
        <g
          key={i}
          transform={`translate(${i ? 53 : 0} ${i ? -8 : 6}) rotate(${i ? 12 : -12} 130 105)`}
          opacity={i ? 1 : 0.8}
        >
          <path
            d="M100 32h53v87q0 11 10 16l24 13q15 10 3 24-9 11-25 4l-53-26q-12-6-12-22Z"
            fill={`url(#${id})`}
            stroke="#183c32"
            strokeOpacity=".16"
          />
          <path
            d="M101 38h51M101 45h51M101 52h51"
            stroke={dark ? "#92ae9d" : "#bbc4b8"}
            strokeWidth="2"
            opacity=".65"
          />
          {cartoon ? (
            [75, 106].map((y) => (
              <g key={y} transform={`translate(125 ${y})`}>
                <circle r="10" fill={dark ? "#dfd89d" : "#f7efdc"} />
                <circle cx="-3" cy="-1" r="1.5" fill="#183c32" />
                <circle cx="3" cy="-1" r="1.5" fill="#183c32" />
                <path
                  d="M-4 4q4 4 8 0"
                  fill="none"
                  stroke="#183c32"
                  strokeWidth="1.5"
                />
              </g>
            ))
          ) : (
            <path
              d="M101 62h51M101 69h51"
              stroke={dark ? "#dce8a0" : "#3b6652"}
              strokeWidth="4"
            />
          )}
          <path
            d="M157 141q-10 8-8 18"
            stroke={dark ? "#91ab96" : "#b0bdae"}
            strokeWidth="2"
            fill="none"
            opacity=".5"
          />
        </g>
      ))}
    </svg>
  );
}
