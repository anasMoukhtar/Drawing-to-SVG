"use client";

import type { FC } from 'react';

interface SVGPreviewProps {
  svgData: string | null;
  className?: string;
}

const SVGPreview: FC<SVGPreviewProps> = ({ svgData, className }) => {
  if (!svgData) {
    return null;
  }

  // Sanitize SVG data - basic check for <script> tags
  // A more robust solution would use a proper sanitizer library if inputs were less trusted.
  // For AI-generated output, this level might be acceptable.
  const cleanSvgData = svgData.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');


  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanSvgData }}
      aria-label="SVG Preview"
      role="img"
    />
  );
};

export default SVGPreview;
