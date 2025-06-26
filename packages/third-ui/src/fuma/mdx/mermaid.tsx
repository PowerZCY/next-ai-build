'use client';

import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui';
import type { MermaidConfig } from 'mermaid';
import { useTheme } from 'next-themes';
import { useEffect, useId, useState } from 'react';

interface MermaidProps {
  chart: string;
  title?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;
}
 
export function Mermaid({ chart, title, watermarkEnabled, watermarkText }: MermaidProps) {
  const id = useId();
  const [svg, setSvg] = useState('');
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    let isMounted = true;
    void renderChart();
 
    async function renderChart() {
      const mermaidConfig: MermaidConfig = {
        startOnLoad: false,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeCSS: 'margin: 1.5rem auto 0;',
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      };
 
      const { default: mermaid } = await import('mermaid');
 
      try {
        mermaid.initialize(mermaidConfig);
        const { svg } = await mermaid.render(
          id.replaceAll(':', ''),
          chart.replaceAll('\\n', '\n')
        );
        let svgWithWatermark = svg;
        if (watermarkEnabled && watermarkText) {
          svgWithWatermark = addWatermarkToSvg(svg, watermarkText);
        }
        if (isMounted) setSvg(svgWithWatermark);
      } catch (error) {
        console.error('Error while rendering mermaid', error);
      }
    }
    return () => {
      isMounted = false;
      setSvg('');
    };
  }, [chart, id, resolvedTheme, watermarkEnabled, watermarkText]);
 
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      {title && (
        <div
          className="mt-2 flex items-center justify-center text-center text-[13px] font-italic text-[#AC62FD]"
        >
          <icons.Mmd className='mr-1 h-4 w-4' />
          <span>{title}</span>
        </div>
      )}
    </div>
  );
}

function addWatermarkToSvg(svg: string, watermark: string) {
  const watermarkText = `
    <text
      x="100%"
      y="98%"
      text-anchor="end"
      font-size="12"
      font-style="italic"
      fill="#AC62FD"
      opacity="0.40"
      class="pointer-events-none"
      dx="-8"
      dy="-4"
    >${watermark}</text>
  `;
  return svg.replace('</svg>', `${watermarkText}</svg>`);
}