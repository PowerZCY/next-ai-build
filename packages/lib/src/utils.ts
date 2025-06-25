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

  // Assume gitTimestamp is a millisecond timestamp string
  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs)) {
     return fail;
  }

  const date = new Date(timestampMs); // or if it is determined to be seconds, use fromUnixTime(timestampSeconds)

  // Check if the date is valid
  if (!isValid(date)) {
    return fail;
  }

  // Format the date
  try {
     // 'yyyy-MM-dd HH:mm:ss' is the date-fns formatting pattern
     return format(date, formatter);
  } catch (error) {
     // format may also throw an error due to an invalid date (although isValid should have already caught it)
     console.error("Error formatting date:", error);
     return fail;
  }
} 