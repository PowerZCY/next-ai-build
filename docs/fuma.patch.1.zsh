#!/usr/bin/env zsh

# ==============================================
# 配置路径（子项目 apps/ddaas 内）
# ==============================================
FUMADOCS_BUILD_DIR="/Users/funeye/IdeaProjects/fumadocs/packages/ui/dist/components/layout"
DDAAS_DIR="/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas"
DEP_NAME="fumadocs-ui"
REQUIRED_FILES=("toc-clerk.d.ts" "toc-clerk.d.ts.map" "toc-clerk.js")

# ==============================================
# 2. 构建Fumadocs源项目
# ==============================================
echo "\n=== 构建Fumadocs源项目 ==="
cd "/Users/funeye/IdeaProjects/fumadocs/packages/ui" || {
  echo "错误：Fumadocs源目录不存在"
  exit 1
}
pnpm build || {
  echo "错误：Fumadocs构建失败"
  exit 1
}

# ==============================================
# 3. 验证源产物
# ==============================================
echo "\n=== 验证补丁文件完整性 ==="
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "${FUMADOCS_BUILD_DIR}/${file}" ]; then
    echo "错误：缺失必要补丁文件 ${file}"
    exit 1
  fi
done
echo "✅ 所有补丁文件准备就绪"

# ==============================================
# 4. 获取版本号
# ==============================================
echo "\n=== 获取版本号 ==="
TARGET_DEP_PACKAGE="${DDAAS_DIR}/node_modules/${DEP_NAME}/package.json"
if [ ! -f "${TARGET_DEP_PACKAGE}" ]; then
  echo "错误：子项目中未找到 ${DEP_NAME}"
  exit 1
fi
DEP_VERSION=$(cat "${TARGET_DEP_PACKAGE}" | jq -r '.version')
DEP_FULL_NAME="${DEP_NAME}@${DEP_VERSION}"
echo "✅ 版本：${DEP_FULL_NAME}"

echo "请运行 pnpm patch "${DEP_FULL_NAME}" --edit-dir"