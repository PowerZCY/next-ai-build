#!/bin/bash

# 默认：./git-stat.sh
# 指定路径：./git-stat.sh -p /path/to/your/project
# 指定天数：./git-stat.sh -d 10
# 同时指定：./git-stat.sh -p /path/to/your/project -d 30
# 默认配置文件
CONFIG_FILE="projects.conf"
DAYS=7
SCAN_PATHS=()

# 解析参数
while getopts "p:d:" opt; do
  case $opt in
    p) SCAN_PATHS=("$OPTARG") ;;
    d) DAYS="$OPTARG" ;;
    *) echo "Usage: $0 [-p <path>] [-d <days>]"; exit 1 ;;
  esac
done

# 如果未指定路径，则读取配置文件
if [ ${#SCAN_PATHS[@]} -eq 0 ]; then
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "配置文件 $CONFIG_FILE 不存在"
    exit 1
  fi
  SCAN_PATHS=()
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    SCAN_PATHS+=("$line")
  done < "$CONFIG_FILE"
fi

# 临时文件
TMP_MSGS=$(mktemp)
LOG_FILE="mywork-latest-${DAYS}-days.log"
> "$LOG_FILE"

for REPO in "${SCAN_PATHS[@]}"; do
  if [ ! -d "$REPO/.git" ]; then
    echo "目录 $REPO 不是一个Git仓库，跳过"
    continue
  fi
  echo "==== $REPO ====" >> "$LOG_FILE"
  git -C "$REPO" log --since="$DAYS days ago" --pretty=format:"%ad %s" --date=short >> "$LOG_FILE"
  echo >> "$LOG_FILE"
done

echo "----------------------"
echo "统计结束，日志已写入 $LOG_FILE"
echo "----------------------"

rm "$TMP_MSGS"