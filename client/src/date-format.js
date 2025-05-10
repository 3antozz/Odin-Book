import { format, differenceInSeconds, differenceInMinutes, differenceInHours, isToday, isYesterday, isThisYear, differenceInDays } from "date-fns"

export const formatDate = (date) => {
    return format(new Date(date), 'PP, H:mm');
}

export const formatDateWithoutTime = (date) => {
    return format(new Date(date), 'PP');
}

export const formatDateWithoutTimeAndDay = (date) => {
    return format(new Date(date), 'MMMM y');
}

export const formatNumber = (num) => {
    if (num === 0) return 0;
    if(!num) return;
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    } else {
      return num.toString();
    }
}

export const formatCommentDate = (date) => {
  const now = new Date();

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return 'now';

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;

  const hours = differenceInHours(now, date);
  if (hours <= 24 && isToday(date)) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = differenceInDays(now, date);
  if (days < 1) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days <= 6) return `${days}d`;

  if (isThisYear(date)) {
    return format(date, 'MMMM d'); 
  } else {
    return format(date, 'MMMM d, yyyy');
  }
}

export function formatPostDate(date) {
  const now = new Date();

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return 'Now';

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h`;

  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'H:mm')}`;
  }

  if (isThisYear(date)) {
    return `${format(date, 'd MMMM')} at ${format(date, 'H:mm')}`;
  }

  return `${format(date, 'd MMMM, yyyy')} at ${format(date, 'H:mm')}`;
}