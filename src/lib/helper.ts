const monthNames = [
    "Jan",
    "Feb",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dec"
];

export const getNameOfMonth = (date: Date) => {
    return monthNames[date.getMonth()];
}

export function dateToInput(date: Date, useTime = true): string {
    const year = date.getFullYear().toString().padStart(4, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    if (useTime) {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    return `${year}-${month}-${day}`;
}

export function formatDuration(duration: Date) {
    const sign = Math.sign(duration.valueOf());
    const millis = Math.abs(duration.valueOf());
    const days = Math.floor(millis / 1000 / 60 / 60 / 24);
    const hours = Math.floor(millis / 1000 / 60 / 60 - days * 24);
    const minutes = Math.floor(millis / 1000 / 60 - days * 24 * 60 - hours * 60);
    
    const output: string[] = [];
    if (days > 0) {
        output.push(`${days} ${days === 1 ? "dag" : "dagar"}`);
    }

    if (hours > 0) {
        output.push(`${hours} ${hours === 1 ? "timme" : "timmar"}`);
    }

    if (minutes > 0) {
        output.push(`${minutes} ${minutes === 1 ? "minut" : "minuter"}`);
    }

    if (
        days === 0 &&
        hours === 0 &&
        minutes === 0
    ) {
        output.push("0 minuter");
    }

    return (sign < 0 ? "-" : "") + output.join(" ");
}