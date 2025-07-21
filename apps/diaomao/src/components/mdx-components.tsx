import defaultMdxComponents from "fumadocs-ui/mdx";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import {
  Mermaid,
  ImageZoom,
  TrophyCard,
  ImageGrid,
  ZiaCard,
  GradientButton,
  SiteX,
  ZiaFile,
  ZiaFolder,
} from "@third-ui/fuma/mdx";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { Callout } from "fumadocs-ui/components/callout";
import { File, Folder, Files } from "fumadocs-ui/components/files";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import type { MDXComponents, MDXProps } from "mdx/types";
import { TypeTable } from "fumadocs-ui/components/type-table";

import { globalLucideIcons as icons } from "@base-ui/components/global-icon";
import { appConfig } from "@/lib/appConfig";

// create a mapping from language identifier to icon component
const languageToIconMap: Record<string, React.ReactNode> = {
  css: <icons.CSS />,
  csv: <icons.CSV />,
  diff: <icons.Diff />,
  html: <icons.Html />,
  http: <icons.Http />,
  java: <icons.Java />,
  json: <icons.Json />,
  jsonc: <icons.SquareDashedBottomCode />,
  log: <icons.Log />,
  mdx: <icons.MDX />,
  regex: <icons.Regex />,
  sql: <icons.SQL />,
  text: <icons.Txt />,
  txt: <icons.Txt />,
  plaintext: <icons.Txt />,
  scheme: <icons.Scheme />,
  xml: <icons.XML />,
  yaml: <icons.Yaml />,
  yml: <icons.Yaml />,
};

// used in source.config.ts custom transformer:parse-code-language, used together
function tryToMatchIcon(
  props: Readonly<MDXProps & { "data-language"?: string; title?: string }>,
  iconMap: Record<string, React.ReactNode>
): React.ReactNode | undefined {
  let lang: string | undefined;

  // 1. get language from props['data-language'] first
  const dataLanguage = props["data-language"] as string | undefined;

  if (dataLanguage && dataLanguage.trim() !== "") {
    lang = dataLanguage.trim().toLowerCase();
  } else {
    // 2. if data-language is not available, fallback to parse from title
    const title = props.title as string | undefined;
    if (title) {
      const titleParts = title.split(".");
      // ensure the file name part is not empty (e.g. ".css" is not valid)
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
  Accordion,
  Accordions,
  Tab,
  Tabs,
  Pre,
  TypeTable,
};

const customUiComponents = {
  TrophyCard,
  ZiaCard,
  GradientButton,
  SiteX,
  ZiaFile,
  ZiaFolder,
};

// this is only the rendering layer, converting HAST to React components, i.e. HTML code
export function getMDXComponents(
  components?: MDXComponents,
): MDXComponents {
  return {
    ...defaultMdxComponents,
    pre: (props) => {
      const customIcon = tryToMatchIcon(props, languageToIconMap);
      return (
        <CodeBlock
          {...props} // expand original props (contains Shiki's props.icon)
          {...(customIcon && { icon: customIcon })}
        >
          <Pre>{props.children}</Pre>
        </CodeBlock>
      );
    },
    // global image zoom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    img: (props) => <ImageZoom {...(props as any)} />,
    // global Mermaid component
    Mermaid: (props) => (
      <Mermaid
        {...props}
        watermarkEnabled={appConfig.style.watermark.enabled}
        watermarkText={appConfig.style.watermark.text}
      />
    ),
    // global ImageGrid component
    ImageGrid: (props) => (
      <ImageGrid {...props} cdnBaseUrl={appConfig.style.cdnBaseUrl} />
    ),
    // global ImageZoom component
    ImageZoom: (props) => (
      <ImageZoom {...props} fallbackSrc={appConfig.style.placeHolder.image} />
    ),
    ...fumadocsUiComponents,
    ...customUiComponents,
    // use icons from the project's unified icon library
    ...icons,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
