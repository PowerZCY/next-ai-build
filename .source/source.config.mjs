// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import { fileGenerator, remarkDocGen, remarkInstall } from "fumadocs-docgen";
import { remarkTypeScriptToJavaScript } from "fumadocs-docgen/remark-ts2js";
import { remarkSteps } from "fumadocs-core/mdx-plugins";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { remarkAutoTypeTable } from "fumadocs-typescript";
var remarkInstallOptions = {
  persist: {
    id: "package-manager"
  }
};
var docs = defineDocs({
  dir: "src/mdx"
});
var source_config_default = defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkSteps,
      remarkMath,
      remarkAutoTypeTable,
      [remarkInstall, remarkInstallOptions],
      [remarkDocGen, { generators: [fileGenerator()] }],
      remarkTypeScriptToJavaScript
    ],
    // Place it at first, it should be executed before the syntax highlighter
    rehypePlugins: (v) => [rehypeKatex, ...v]
  }
});
export {
  source_config_default as default,
  docs
};
