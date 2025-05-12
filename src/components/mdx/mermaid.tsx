'use client';
 
import { useEffect, useId, useRef, useState } from 'react';
import type { MermaidConfig } from 'mermaid';
import { useTheme } from 'next-themes';
import { watermark as watermarkConfig } from '@/lib/appConfig';
 
export function Mermaid({ chart, title }: { chart: string; title?: string }) {
  const id = useId();
  const [svg, setSvg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null!);
  const { resolvedTheme } = useTheme();
 
  useEffect(() => {
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
          // strip invalid characters for `id` attribute
          id.replaceAll(':', ''),
          chart.replaceAll('\\n', '\n'),
          containerRef.current,
        );
        let svgWithWatermark = svg;
        if (watermarkConfig.enabled && watermarkConfig.text) {
          svgWithWatermark = addWatermarkToSvg(svg, watermarkConfig.text);
        }
        setSvg(svgWithWatermark);
      } catch (error) {
        console.error('Error while rendering mermaid', error);
      }
    }
  }, [chart, id, resolvedTheme]);
 
  return (
    <div>
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} />
      {title && (
        <div
          style={{
            color: '#AC62FD',
            textAlign: 'center',
            fontSize: '13px',
            fontStyle: 'italic',
            marginTop: '0.5em',
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
}

function addWatermarkToSvg(svg: string, watermark: string) {
  const watermarkText = `\n    <text
      x="99%"
      y="98%"
      text-anchor="end"
      font-size="12"
      font-style="italic"
      fill="#AC62FD"
      opacity="0.40"
      pointer-events="none"
    >${watermark}</text>\n  `;
  return svg.replace('</svg>', `${watermarkText}</svg>`);
}