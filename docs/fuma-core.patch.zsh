#!/usr/bin/env zsh

# ==============================================
# 1. 构建Fumadocs源项目
# ==============================================
FUMA_CORE_BASE_DIR="/Users/funeye/IdeaProjects/fumadocs/packages/core"
FUMADOCS_CORE_BUILD_DIR="${FUMA_CORE_BASE_DIR}/dist"

cd "${FUMADOCS_CORE_BUILD_DIR}" || {
  echo "错误：Fumadocs-core源目录${FUMADOCS_CORE_BUILD_DIR}不存在"
  exit 1
}
pnpm build || {
  echo "错误：Fumadocs-core源目录${FUMADOCS_CORE_BUILD_DIR}构建失败"
  exit 1
}
echo "\n=== ✅ 构建Fumadocs-core源项目 ==="

# ==============================================
# 2. 验证源产物
# ==============================================
REQUIRED_CORE_FILES=("toc.d.ts" "toc.js")

for file in "${REQUIRED_CORE_FILES[@]}"; do
  if [ ! -f "${FUMADOCS_CORE_BUILD_DIR}/${file}" ]; then
    echo "错误：缺失必要补丁文件 ${file}"
    exit 1
  fi
done

echo "\n=== ✅ 所有补丁文件已就绪 ==="

# ==============================================
# 3. 版本号安全审查
# ==============================================
DEP_NAME="fumadocs-core"
DDAAS_DEPEND_PACKAGE_FILE="/Users/funeye/IdeaProjects/next-ai-build/apps/ddaas/node_modules/${DEP_NAME}/package.json"

if [ ! -f "${DDAAS_DEPEND_PACKAGE_FILE}" ]; then
  echo "错误：子项目中未找到 ${DDAAS_DEPEND_PACKAGE_FILE}"
  exit 1
fi
PATCH_VERSION=$(cat "${DDAAS_DEPEND_PACKAGE_FILE}" | jq -r '.version')
DEP_FULL_NAME="${DEP_NAME}@${PATCH_VERSION}"


MONO_REPO_ROOT="/Users/funeye/IdeaProjects/next-ai-build"
PATCH_DIR="${MONO_REPO_ROOT}/node_modules/.pnpm_patches/${DEP_FULL_NAME}"
TARGET_DIR="${PATCH_DIR}/dist"

# 1. 检查 MONO_REPO_ROOT 是否存在（避免基础路径无效）
if [ ! -d "${MONO_REPO_ROOT}" ]; then
  echo "错误：MONO_REPO_ROOT 不存在或不是目录：${MONO_REPO_ROOT}"
  exit 1
fi

# 2. 检查 DEP_FULL_NAME 是否已定义（避免补丁目录路径不完整）
if [ -z "${DEP_FULL_NAME:-}" ]; then
  echo "错误：DEP_FULL_NAME 未定义（需指定依赖名，如 'fumadocs-core@16.0.9'）"
  exit 1
fi

# 3. 检查 PATCH_DIR 是否在 node_modules/.pnpm_patches 内（限制删除范围）
if [[ "${PATCH_DIR}" != "${MONO_REPO_ROOT}/node_modules/.pnpm_patches/"* ]]; then
  echo "错误：PATCH_DIR 不在预期的补丁目录内，可能存在路径风险：${PATCH_DIR}"
  exit 1
fi

# 4. 检查 PATCH_DIR 存在且为目录（避免删除不存在的路径或文件）
if [ ! -d "${PATCH_DIR}" ]; then
  echo "提示：PATCH_DIR 不存在，无需清理：${PATCH_DIR}"
  # 此处可选择 exit 0 或继续执行（视需求而定）
  # exit 0
fi

echo "\n=== ✅ 获取版本号: ${DEP_FULL_NAME}, 目录审查OK==="

# ==============================================
# 4. 打补丁准备工作
# ==============================================
# 回到 monorepo 根目录
cd "${MONO_REPO_ROOT}" || {
  echo "错误：无法进入 MONO_REPO_ROOT 目录"
  exit 1
}

# 先清理之前的补丁（仅在通过所有安全检查后执行）
echo ">>>>>>将清理补丁目录: '${PATCH_DIR}'"
# 回到monorepo根目录
rm -rf "${PATCH_DIR}"

# 确认删除结果
if [ -d "${PATCH_DIR}" ]; then
  echo "警告：补丁目录删除失败，可能存在权限问题"
else
  echo "补丁目录已成功清理"
fi


# 先清理之前的补丁
echo "\n=== ✅ 打补丁准备工作完成==="

# ==============================================
# 5. 打补丁文件
# ==============================================
echo ">>>>>>将运行pnpm patch "${DEP_FULL_NAME}" --edit-dir"
# 回到monorepo根目录
cd ${MONO_REPO_ROOT}
pnpm patch ${DEP_FULL_NAME} --edit-dir

for file in "${REQUIRED_CORE_FILES[@]}"; do
  cp "${FUMADOCS_CORE_BUILD_DIR}/${file}" "${TARGET_DIR}/" || {
    echo "错误：复制 ${file} 失败"
    exit 1
  }
  echo "${file} 补丁文件已复制"
done


echo "✅ 所有补丁文件已从${FUMADOCS_CORE_BUILD_DIR}/复制到${TARGET_DIR}/"
echo "\n=== ✅ 补丁文件覆写完成==="

# ==============================================
# 5. 提交补丁文件
# ==============================================
echo ">>>>>>将提交补丁:  pnpm patch-commit  ${PATCH_DIR}"

pnpm patch-commit  ${PATCH_DIR}

echo "\n=== ✅ 补丁${DEP_FULL_NAME}已应用==="