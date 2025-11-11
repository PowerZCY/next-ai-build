#!/usr/bin/env zsh

# ==============================================
# 6. 复制补丁文件到临时目录
# ==============================================
FUMADOCS_BUILD_DIR="/Users/funeye/IdeaProjects/fumadocs/packages/ui/dist/components/layout"
DEP_NAME="fumadocs-ui"
# 注意修改版本号‼️⁉️❗❗
PATCH_VERSION="16.0.9"
MONO_REPO_ROOT="/Users/funeye/IdeaProjects/next-ai-build"
PATCH_DIR="${MONO_REPO_ROOT}/node_modules/.pnpm_patches/${DEP_NAME}@${PATCH_VERSION}"
TARGET_DIR="${PATCH_DIR}/dist/components/layout"
REQUIRED_FILES=("toc-clerk.d.ts" "toc-clerk.d.ts.map" "toc-clerk.js")

# 回到monorepo根目录
cd ${MONO_REPO_ROOT}

# 先清理之前的补丁
rm -rf "${PATCH_DIR}"

# 再开始打补丁
pnpm patch '${DEP_NAME}@${PATCH_VERSION}' --edit-dir

# 复制补丁文件
for file in "${REQUIRED_FILES[@]}"; do
  cp "${FUMADOCS_BUILD_DIR}/${file}" "${TARGET_DIR}/" || {
    echo "错误：复制 ${file} 失败"
    exit 1
  }
  echo "${file} 补丁文件已复制"
done
echo "✅ 所有补丁文件已从${FUMADOCS_BUILD_DIR}/复制到${TARGET_DIR}/"

echo "请手动提交补丁:  pnpm patch-commit  ${PATCH_DIR}"