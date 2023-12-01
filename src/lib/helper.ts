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
export function dateToTimeInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
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

const venueColors = [
    "black",
    "orange.500",
    "purple.500",
    "blue.500",
    "yellow.900",
    "red.400",
    "green.400",
];

export const getVenueColor = (venueId: number | null) => {
    if (!venueId) {
        return "black";
    }

    return venueColors[venueId % venueColors.length];
}

export function isMailSpelledCorrectly(mail: string): boolean {
    const mailEndings = [
        "chalmers.se",
        "student.chalmers.se",
        "ftek.se",
        "gu.se",
        "gmail.com",
        "f-spexet.se",
        "lists.chalmers.se",
        "kfkb.se",
    ]

    const parts = mail.split("@");
    if (parts.length !== 2) {
        // No need to warn the user since the browser will stop them
        return true;
    }

    const ending = parts[1];
    
    for (const checkEnding of mailEndings) {
        const s = similarity(ending, checkEnding);
        // If the endings almost match, the mail is probably misspelled
        if (s >= 0.75 && s <= 0.9999) {
            return false;
        }
    }

    return true;
}

function similarity(s1: string, s2: string) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function editDistance(s1: string, s2: string) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  
    const costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
      
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }