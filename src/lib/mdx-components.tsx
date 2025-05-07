import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Mermaid } from '@/components/mdx/mermaid';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Callout } from 'fumadocs-ui/components/callout';
import { File, Folder, Files } from 'fumadocs-ui/components/files';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { AlbumIcon, Bitcoin, Bug, Cpu, ComponentIcon,
  DatabaseZap, 
  HousePlus, Layout, LayoutTemplate,
  Pencil, PanelsTopLeft, SquareTerminal, Server,
  Zap
  } from 'lucide-react';
import type { MDXComponents } from 'mdx/types';

// Object containing globally available Fumadocs UI components
const fumadocsUiComponents = {
  Callout,
  CodeBlock,
  File,
  Folder,
  Files,
  ImageZoom,
  Accordion,
  Accordions,
  Step,
  Steps,
  Tab,
  Tabs,
  Pre, // Often needed alongside CodeBlock
  Mermaid
};

const customUiComponents = {
  
}

// Object containing globally available Lucide icon components
// 所有的图标都要从这里导入, 并且图标会占据项目包的体积, 因此最好提前设计规划好
export const globalLucideIcons = {
  HousePlus,
  Cpu,
  AlbumIcon,
  PanelsTopLeft,
  DatabaseZap,
  SquareTerminal,
  Bitcoin, 
  Bug,
  ComponentIcon,
  Layout,
  LayoutTemplate,
  Pencil,
  Server,
  Zap
};

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // HTML `ref` attribute conflicts with `forwardRef`
    pre: ({ ref: _ref, ...props }) => (
      <CodeBlock keepBackground {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    // 全局处理图片放大
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: (props) => <ImageZoom {...(props as any)} />,
    ...fumadocsUiComponents,
    ...customUiComponents,
    ...globalLucideIcons,
    ...components,
  };
}

// export a `useMDXComponents()` that returns MDX components
export const useMDXComponents = getMDXComponents;