# Mermaid render API containerRef could cause render error

## What problem will this feature address?

When using the official Mermaid integration example from the Fumadocs documentation ([see here](https://fumadocs.dev/docs/ui/markdown/mermaid#setup)), I encountered a runtime error in the following scenario:

- When a Mermaid diagram is rendered inside a Tab component (e.g., using Tabs to switch between different diagrams or code blocks), the initial render works fine.
- However, after switching away from the Mermaid tab and then switching back, the following error occurs:

```
TypeError: Cannot read properties of null (reading 'firstChild')
    at Object.render (mermaid.core.mjs:1021:23)
```

My mdx source code like this:
````mdx
<Tabs groupId="mermaid" items={[ "example", "@keywords"]}>
  <Tab value="example">
    <Mermaid
    title="人生路径图·By 李笑来"
    chart="
    flowchart LR
    id1[(Database)]-->id2(Stop)
    "/> 
  </Tab>

  ```txt title="触发关键词" tab="@keywords"   
  @mdxmermaid  生成mdx图标Mermaid
  ```
</Tabs>
````

I have checked related issues, such as [#1662](https://github.com/fuma-nama/fumadocs/issues/1662), but this is not the same problem.

## Describe the solution you'd like

- The root cause is that the official example passes `containerRef.current` as the third argument to `mermaid.render`. In React, when components are unmounted/remounted (as with Tab switching), the referenced DOM node may be null or in an inconsistent state, leading to errors when Mermaid tries to manipulate it directly.
- [The official recommended](https://mermaid.js.org/config/usage.html#api-usage) solution is to **not pass the container as the third argument** to `mermaid.render`. Instead, only pass the `id` and `chart` string, and then set the returned SVG string via `dangerouslySetInnerHTML`. This approach avoids direct DOM manipulation by Mermaid and is more compatible with React's lifecycle.

**Here is a correct usage example:**

```tsx
'use client';
import { useEffect, useId, useState } from 'react';
import type { MermaidConfig } from 'mermaid';
import { useTheme } from 'next-themes';

export function Mermaid({ chart, title }: { chart: string; title?: string }) {
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
        if (isMounted) setSvg(svg);
      } catch (error) {
        console.error('Error while rendering mermaid', error);
      }
    }
    return () => {
      isMounted = false;
      setSvg('');
    };
  }, [chart, id, resolvedTheme]);

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      {title && <div>{title}</div>}
    </div>
  );
}
```

This pattern ensures Mermaid does not directly manipulate the DOM, and works reliably with React's component lifecycle, including inside Tabs.



## References
- [Fumadocs Mermaid integration guide](https://fumadocs.dev/docs/ui/markdown/mermaid#setup)
- [Related issue #1662](https://github.com/fuma-nama/fumadocs/issues/1662)
- [Mermaid official API usage](https://mermaid.js.org/config/usage.html#api-usage)
