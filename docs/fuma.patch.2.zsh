#!/usr/bin/env zsh

# ==============================================
# 6. 复制补丁文件到临时目录
# ==============================================
FUMADOCS_BUILD_DIR="/Users/funeye/IdeaProjects/fumadocs/packages/ui/dist/components/layout"
TARGET_DIR="/Users/funeye/IdeaProjects/next-ai-build/node_modules/.pnpm_patches/fumadocs-ui@16.0.9/dist/components/layout"
REQUIRED_FILES=("toc-clerk.d.ts" "toc-clerk.d.ts.map" "toc-clerk.js")
PATCH_DIR="/Users/funeye/IdeaProjects/next-ai-build/node_modules/.pnpm_patches/fumadocs-ui"
# 注意修改版本号‼️⁉️❗❗
PATCH_VERSION="16.0.9"

for file in "${REQUIRED_FILES[@]}"; do
  cp "${FUMADOCS_BUILD_DIR}/${file}" "${TARGET_DIR}/" || {
    echo "错误：复制 ${file} 失败"
    exit 1
  }
  echo "${file} 补丁文件已复制"
done
echo "✅ 所有补丁文件已从${FUMADOCS_BUILD_DIR}/复制到${TARGET_DIR}/"

echo "请手动提交补丁:  pnpm patch-commit  /Users/funeye/IdeaProjects/next-ai-build/node_modules/.pnpm_patches/fumadocs-ui@16.0.9"