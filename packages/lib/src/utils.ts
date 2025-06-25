import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string, formatter: string) {
  const fail = "";
  if (!timestamp) {
    return fail;
  }

  // 假设 gitTimestamp 是毫秒时间戳字符串
  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs)) {
     return fail;
  }

  const date = new Date(timestampMs); // 或者如果确定是秒级用 fromUnixTime(timestampSeconds)

  // 检查日期是否有效
  if (!isValid(date)) {
    return fail;
  }

  // 格式化日期
  try {
     // 'yyyy-MM-dd HH:mm:ss' 是 date-fns 的格式化模式
     return format(date, formatter);
  } catch (error) {
     // format也可能因无效日期抛错（虽然isValid应该已经捕获）
     console.error("Error formatting date:", error);
     return fail;
  }
} 