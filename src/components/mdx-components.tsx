import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Mermaid } from '@/components/mdx/mermaid';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Callout } from 'fumadocs-ui/components/callout';
import { File, Folder, Files } from 'fumadocs-ui/components/files';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { globalLucideIcons } from '@/components/global-icon';
import type { MDXComponents } from 'mdx/types';

import { globalLucideIcons as icons } from '@/components/global-icon';

// 创建一个语言标识符到图标组件的映射
const languageToIconMap: Record<string, React.ReactNode> = {
  css: <icons.CSS />,
  csv: <icons.CSV />,
  html: <icons.Html />,
  java: <icons.Java />,
  json: <icons.Json />,
  log: <icons.Log />,
  mdx: <icons.MarkdownX />,
  scheme: <icons.Scheme />,
  xml: <icons.XML />,
  yaml: <icons.Yaml />,
};

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

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: (props) => {
      let lang: string | undefined;
      const title = props.title as string | undefined;

      if (title) {
        // 尝试从 title="filename.lang" 中提取 lang
        // 例如 "shiki.yaml" -> "yaml"
        // 例如 "my-code.js" -> "js"
        const titleParts = title.split('.');
        if (titleParts.length > 1) {
          const extension = titleParts.pop()?.toLowerCase();
          if (extension) {
            lang = extension;
            // 可选：如果扩展名和 Shiki 语言标识符不完全一致，可以在这里加一个映射
            //例如：if (lang === 'ts') lang = 'typescript';
          }
        }
      }

      // 如果从 title 未能提取，可以尝试备选方案，比如 className (尽管当前 props 中 className 没包含语言)
      // if (!lang && props.className && typeof props.className === 'string') {
      //   const classMatch = props.className.match(/language-(\w+)/);
      //   if (classMatch && classMatch[1]) {
      //     lang = classMatch[1];
      //   }
      // }

      console.log(`Determined lang from title: ${lang}`); // 调试日志

      let customIcon;
      if (lang && languageToIconMap[lang]) { // 直接使用 lang (已经是小写)
        customIcon = languageToIconMap[lang];
        console.log(`Applied custom icon for ${lang}`);
      } else if (lang) {
        console.log(`No custom icon found in map for language: "${lang}". Shiki default will be used.`);
      } else {
        console.log('Language could not be determined from title. Shiki default icon will be used.');
      }

      // {...props} 包含 Shiki 注入的 title 和 icon (SVG 字符串)
      // 我们只在 customIcon 有实际值时才通过 { icon: customIcon } 来覆盖
      // 如果 customIcon 是 undefined, 则 icon 属性不会被这个条件展开添加，
      // CodeBlock 就会使用 props.icon (Shiki 默认图标)
      return (
        <CodeBlock
          keepBackground
          {...props} // 扩展原始 props，这会包含 Shiki 的 props.icon
          {...(customIcon && { icon: customIcon })} // 仅当 customIcon 有值时才添加/覆盖 icon 属性
        >
          <Pre>{props.children}</Pre>
        </CodeBlock>
      );
    },
    // 全局处理图片放大
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: (props) => <ImageZoom {...(props as any)} />,
    ...fumadocsUiComponents,
    ...customUiComponents,
    // 从项目统一icon库中使用
    ...globalLucideIcons,
    ...components,
  };
}

// export a `useMDXComponents()` that returns MDX components
export const useMDXComponents = getMDXComponents;