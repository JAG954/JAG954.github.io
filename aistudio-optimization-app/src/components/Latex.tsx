import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export default function Latex({ math, displayMode = false, className = '' }: LatexProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        // Clean up common double-backslash issues that happen when JSON strings are sent from APIs
        const cleanedMath = math
          .replace(/\\\\/g, '\\') // Convert double backslashes to single backslash
          .trim();

        katex.render(cleanedMath, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true,
        });
      } catch (err) {
        console.error('KaTeX rendering error:', err);
        containerRef.current.textContent = math;
      }
    }
  }, [math, displayMode]);

  return <span ref={containerRef} className={`inline-block ${className}`} />;
}
