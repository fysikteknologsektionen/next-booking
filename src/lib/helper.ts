// This file contains generic helper functions that
// are nice to have access to from time to time

import { Recurring, ReservationType, Role, Status, Venue } from "@prisma/client";
import { Session } from "next-auth";

export const MONTH_NAMES = [
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

export const DAY_NAMES = [
    "Mån",
    "Tis",
    "Ons",
    "Tors",
    "Fre",
    "Lör",
    "Sön"
];

// Returns copy of `now` with the date set to 1st of the same month
// at 00:00 in UTC timezone
export const getCurrentMonth = (now = new Date()) => {
    const date = new Date(now);
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

// Returns the number of month in the month given by `date`
export const daysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return new Date(year, month, 0).getDate();
}

// Extract shortened swedish month name from date object
export const getNameOfMonth = (date: Date) => {
    return MONTH_NAMES[date.getMonth()];
}

// Converts a date object to a valid string for use
// in the input <input type="date-time" /> if useTime is true
// or in <input type="date" /> if useTime is false
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

// Format a date using dateToInput but remove the T :)
export function formatDate(date: Date) {
    const fDate = dateToInput(date, true).split('T');
    return fDate[0] + ' ' + fDate[1];
}

// Get hours and minutes from date object and display as hh:mm
export const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
}

// Converts date object to a valid string for use in
// input <input type="time" />
export function dateToTimeInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
}

// Converts a date object (which represents a duration and NOT a date)
// to a human-readable duration string
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

// Checks if two dates have the same year, month and day
const isSameDay = (a: Date, b: Date) => {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

export const formatDateShort = (date: Date, today = new Date()) => {
    const day = date.getDate();
    const month = getNameOfMonth(date).toLocaleLowerCase();
    const year = date.getFullYear();

    if (year === today.getFullYear()) {
        return `${day} ${month}`;
    }

    return `${day} ${month} ${year}`;
}

// Get, as short as possible, a string representation of a time interval
export const formatTimeInterval = (from: Date, to: Date) => {
    if (isSameDay(from, to)) {
        return `${formatDateShort(from)} ${formatTime(from)} - ${formatTime(to)}`;
    }

    return `${formatDateShort(from)} ${formatTime(from)} - ${formatDateShort(to)} ${formatTime(to)}`;
};

/**
 * @param timeString Format: hh:mm
 */
export const closest10min = (timeString: string) => {
    const split = timeString.split(":");
    const hours = parseInt(split[0]);
    const minutes = parseInt(split[1]);

    const tenMin = 1000 * 60 * 10;
    const date = new Date(0);
    date.setUTCHours(hours);
    date.setUTCMinutes(minutes);

    const rounded = new Date(Math.round(date.getTime() / tenMin) * tenMin);
    const roundedHours = rounded.getUTCHours();
    const roundedMinutes = rounded.getUTCMinutes();

    return `${hours}:${minutes}`;
};

const venueColors = [
    "black",
    "orange.500",
    "purple.500",
    "blue.500",
    "yellow.900",
    "red.400",
    "green.400",
];

// Converts a venue id (id: integer >= 1) to a nice color
// to be used in the calendar
export const getVenueColor = (venueId: number | null) => {
    if (!venueId) {
        return "black";
    }

    return venueColors[venueId % venueColors.length];
}

// Will check the mail ending (everything after @) for potential
// misspellings using a text similarity index ranging from 0 to 1
// where 1 is same text and 0 are totally different
export function isMailSpelledCorrectly(mail: string): boolean {
    const mailEndings = [
        "chalmers.se",
        "student.chalmers.se",
        "lists.chalmers.se",
        "ftek.se",
        "kfkb.se",
        "f-spexet.se",
        "gu.se",
        "gmail.com",
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

// Admins are also managers
export const isManager = (session: Session | undefined | null): boolean => {
    return !!session && (session.user.role === Role.MANAGER || session.user.role === Role.ADMIN);
}

export const isAdmin = (session: Session | undefined | null): boolean => {
    return !!session && session.user.role === Role.ADMIN;
}

export const CHARACTER_LIMIT = {
    name: 80,
    description: 500,
    comittee: 80,
};

// Get readable label for `ReservationType`
const reservationTypeLabels = {
    [ReservationType.PREPARATION]: "Förberedelser",
    [ReservationType.SITTING]: "Sittning",
    [ReservationType.PUB]: "Pub",
    [ReservationType.PERFORMANCE]: "Föreställning",
    [ReservationType.OTHER]: "Övrig bokning",
}

export const getReservationTypeLabel = (type: ReservationType) => {
    return reservationTypeLabels[type];
}

// Get readable label for `Recurring` enum
const recurringLabels = {
    [Recurring.NEVER]: "Aldrig",
    [Recurring.WEEKLY]: "Varje vecka",
    [Recurring.MONTHLY]: "Varje månad (samma datum)",
    [Recurring.MONTHLY_SAME_DATE]: "Varje månad (samma datum)",
    [Recurring.MONTHLY_SAME_DAY]: "Varje månad (samma dag på veckan)",
}

export const getRecurringLabel = (recurring: Recurring) => {
    return recurringLabels[recurring];
}

// Get readable label for `Status` enum
const statusLabels = {
    [Status.ACCEPTED]: "Godkänd",
    [Status.DENIED]: "Nekad",
    [Status.PENDING]: "Väntar",
}

export const getStatusLabel = (status: Status) => {
    return statusLabels[status];
}

// Get venue name from id
export const getVenueLabel = (venues: Venue[], id: number | null) => {
    if (id == null) {
        return `ID is null`;
    }

    const venue = venues.find(v => v.id === id);
    const label = venue ?
        (venue?.name ?? `Lokal utan namn: ${id}`) :
        `Lokal ID: ${id}`;

    return label;
}

// Non-negative modulo
export const mod = (x: number, n: number) => {
    return ((x % n) + n) % n;
};