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