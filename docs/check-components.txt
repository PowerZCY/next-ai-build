#!/bin/bash

# 处理工作目录
if [ -z "$1" ]; then
    PROJECT_DIR=$(dirname "$(cd "$(dirname "$0")" && pwd)")
    echo "⚠️ 未指定项目目录，使用脚本所在目录的父目录：$PROJECT_DIR"
else
    PROJECT_DIR="$1"
fi

UI_DIR="$PROJECT_DIR/src/components/ui"
SRC_DIR="$PROJECT_DIR/src"

# 创建临时文件存储结果
USED_COMPONENTS=$(mktemp)
UNUSED_COMPONENTS=$(mktemp)

echo "开始分析组件使用情况..."
echo "------------------------"

# 遍历所有UI组件
for component in "$UI_DIR"/*.tsx; do
    if [ -f "$component" ]; then
        component_name=$(basename "$component" .tsx)
        # 在src目录下搜索组件的引用
        usage_count=$(grep -r "from.*@/components/ui/${component_name}'" "$SRC_DIR" | wc -l)
        
        if [ "$usage_count" -eq 0 ]; then
            echo "$component_name" >> "$UNUSED_COMPONENTS"
        else
            echo "$component_name|$usage_count" >> "$USED_COMPONENTS"
            echo "组件 $component_name 的引用位置:" >> "$USED_COMPONENTS"
            grep -r "from.*@/components/ui/${component_name}'" "$SRC_DIR" | sed 's/^/  /' >> "$USED_COMPONENTS"
            echo "" >> "$USED_COMPONENTS"
        fi
    fi
done

# 输出未使用的组件
echo "未使用的组件："
echo "------------"
if [ -s "$UNUSED_COMPONENTS" ]; then
    while read -r component; do
        echo "❌ $component"
    done < "$UNUSED_COMPONENTS"
else
    echo "没有未使用的组件"
fi

echo -e "\n已使用的组件："
echo "------------"
if [ -s "$USED_COMPONENTS" ]; then
    while IFS="|" read -r component count || [ -n "$component" ]; do
        if [ -n "$count" ]; then
            echo "✅ $component ($count 处引用)"
        else
            echo "$component"
        fi
    done < "$USED_COMPONENTS"
else
    echo "没有被使用的组件"
fi

# 清理临时文件
rm "$USED_COMPONENTS" "$UNUSED_COMPONENTS"

echo -e "\n------------------------"
echo "分析完成"