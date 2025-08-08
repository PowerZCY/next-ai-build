'use client';

import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
// 注意：不使用外部对话框库，避免第三方应用构建时的 React 上下文冲突
import type { MermaidConfig } from 'mermaid';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

interface MermaidProps {
  chart: string;
  title?: string;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  /**
   * enable preview dialog by clicking the chart, default is true
   */
  enablePreview?: boolean;
}
 
export function Mermaid({ chart, title, watermarkEnabled, watermarkText, enablePreview = true }: MermaidProps) {
  const id = useId();
  const [svg, setSvg] = useState('');
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  // zoom & pan states for preview dialog
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const startTranslateRef = useRef({ x: 0, y: 0 });
  
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

  // helpers for preview zoom
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
  const resetTransform = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    // 基于中心缩放：保持缩放中心在画布中点，不引入位移
    setScale((prev) => clamp(prev + delta, 0.25, 6));
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Cmd/Ctrl + 滚轮缩放（围绕中心点），否则上下平移
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => clamp(prev + delta, 0.25, 6));
    } else {
      setTranslate((prev) => ({ x: prev.x, y: prev.y - e.deltaY }));
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPanningRef.current = true;
    startPointRef.current = { x: e.clientX, y: e.clientY };
    startTranslateRef.current = { ...translate };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, [translate]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - startPointRef.current.x;
    const dy = e.clientY - startPointRef.current.y;
    setTranslate({ x: startTranslateRef.current.x + dx, y: startTranslateRef.current.y + dy });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isPanningRef.current = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  }, []);
 
  return (
    <div>
      <div
        className={enablePreview ? 'group relative cursor-zoom-in' : undefined}
        onClick={() => enablePreview && svg && setOpen(true)}
      >
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        {enablePreview && svg && (
          <div className="pointer-events-none absolute right-2 top-2 hidden rounded bg-black/50 px-2 py-0.5 text-[12px] text-white group-hover:block">
            Preview Chart
          </div>
        )}
      </div>
      {title && (
        <div
          className="mt-2 flex items-center justify-center text-center text-[13px] font-italic text-[#AC62FD]"
        >
          <icons.Mmd className='mr-1 h-4 w-4' />
          <span>{title}</span>
        </div>
      )}

      {/* Preview Dialog (custom minimal dialog) */}
      {enablePreview && open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : 'Mermaid Preview'}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => { setOpen(false); resetTransform(); }} />
          <div className="relative z-[1] max-w-[95vw] w-[95vw] h-[88vh] p-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-2xl overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                <icons.Mmd className="h-4 w-4" />
                <span className="truncate max-w-[50vw]">{title ?? 'Mermaid Preview'}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  aria-label="Zoom out"
                  className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600 text-[13px]"
                  onClick={() => zoomBy(-0.2)}
                >
                  －
                </button>
                <span className="mx-0.5 text-[12px] w-12 text-center select-none">{Math.round(scale * 100)}%</span>
                <button
                  aria-label="Zoom in"
                  className="flex h-6 w-6 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600 text-[13px]"
                  onClick={() => zoomBy(0.2)}
                >
                  ＋
                </button>
                <button
                  aria-label="Reset"
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded text-purple-500 hover:text-purple-600"
                  onClick={resetTransform}
                >
                  <icons.RefreshCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  aria-label="Close"
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded text-purple-500 hover:text-purple-600"
                  onClick={() => { setOpen(false); resetTransform(); }}
                >
                  <icons.X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div
              className="relative h-[calc(88vh-40px)] w-full overflow-hidden bg-white dark:bg-neutral-900"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              <div
                className="absolute left-1/2 top-1/2"
                style={{ transform: `translate(-50%, -50%) translate(${translate.x}px, ${translate.y}px)` }}
              >
                <div
                  style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
              {/* helper text */}
              <div className="pointer-events-none absolute bottom-2 right-3 rounded bg-black/40 px-2 py-1 text-xs text-white">
                Drag to pan, hold Cmd/Ctrl + scroll to zoom
              </div>
            </div>
          </div>
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