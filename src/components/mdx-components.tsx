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
import type { MDXComponents, MDXProps } from 'mdx/types';

import { globalLucideIcons as icons } from '@/components/global-icon';

// 创建一个语言标识符到图标组件的映射
const languageToIconMap: Record<string, React.ReactNode> = {
  css: <icons.CSS />,
  csv: <icons.CSV />,
  html: <icons.Html />,
  http: <icons.Http />,
  java: <icons.Java />,
  json: <icons.Json />,
  jsonc: <icons.Jsonc />,
  log: <icons.Log />,
  mdx: <icons.MarkdownX />,
  regex: <icons.Regex />,
  sql: <icons.SQL />,
  text: <icons.FileText />,
  txt: <icons.FileText />,
  plaintext: <icons.FileText />,
  scheme: <icons.Scheme />,
  xml: <icons.XML />,
  yaml: <icons.Yaml />,
  yml: <icons.Yaml />,
};

// source.config.ts 中自定义transformer:parse-code-language中调用, 搭配使用
function tryToMatchIcon(
  props: Readonly<MDXProps & { 'data-language'?: string; title?: string }>, // 明确 props 的类型
  iconMap: Record<string, React.ReactNode>
): React.ReactNode | undefined {
  let lang: string | undefined;

  // 1. 优先从 props['data-language'] 获取
  const dataLanguage = props['data-language'] as string | undefined;

  if (dataLanguage && dataLanguage.trim() !== '') {
    lang = dataLanguage.trim().toLowerCase();
  } else {
    // 2. 如果 data-language 不可用，则回退到从 title 解析
    const title = props.title as string | undefined;
    if (title) {
      const titleParts = title.split('.');
      // 确保文件名部分不是空的 (例如 ".css" 这种标题是不合法的)
      if (titleParts.length > 1 && titleParts[0] !== "") {
        const extension = titleParts.pop()?.toLowerCase();
        if (extension) {
          lang = extension;
        }
      }
    } 
  }
  let customIcon: React.ReactNode | undefined;
  if (lang && iconMap[lang]) {
    customIcon = iconMap[lang];
  }
  return customIcon;
}

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
  Pre,
  Mermaid
};

const customUiComponents = {
  
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: (props) => {
      const customIcon = tryToMatchIcon(props, languageToIconMap);
      return (
        <CodeBlock
          {...props} // 扩展原始 props (包含 Shiki 的 props.icon)
          {...(customIcon && { icon: customIcon })} // 条件性覆盖 icon
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