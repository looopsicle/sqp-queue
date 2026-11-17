"use client";

import React, { useMemo } from "react";
import QRCode from "qrcode";

interface QrMatrixSvgProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export function QrMatrixSvg({
  value,
  size = 220,
  fgColor = "#183F2A",
  bgColor = "#FFFFFF",
  className = "",
}: QrMatrixSvgProps) {
  const { modules, moduleCount } = useMemo(() => {
    const qr = QRCode.create(value || "https://scientiasquarepark.com", {
      errorCorrectionLevel: "M",
    });
    return {
      modules: qr.modules,
      moduleCount: qr.modules.size,
    };
  }, [value]);

  const quiet = 3;
  const viewBoxSize = moduleCount + quiet * 2;

  const rects: React.ReactNode[] = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (modules.get(r, c)) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c + quiet}
            y={r + quiet}
            width={1}
            height={1}
            fill={fgColor}
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      shapeRendering="crispEdges"
      className={className}
      aria-label={`QR Code ${value}`}
    >
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
      {rects}
    </svg>
  );
}
