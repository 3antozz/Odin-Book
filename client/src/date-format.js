import { format } from "date-fns"

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