// This file contains generic helper functions that
// are nice to have access to from time to time

import { Recurring, ReservationType, Role, Status, Venue } from "@prisma/client";
import { DateTime } from "luxon";
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

// Checks if string is a valid date
// FIXME: Needs more careful consideration
export const validateDateString = (dateString: string) => {
    return new Date(dateString).toString() !== "Invalid Date";
}

export const validateLocalDateString = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(.0{1,3})?)?Z?$/;
    return regex.test(dateString);
}

export const localDateStringToUTCDate = (dateString: string) => {
    const dt = DateTime.fromISO(dateString, { zone: "Europe/Stockholm" });
    const d = dt.toJSDate();
    return d;
}

export const validateVenueId = (venueId: string) => {
    return parseInt(venueId) % 1 === 0;
}

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
    const month = date.getMonth();
    if (isNaN(month)) {
        return "[Month name of invalid date]";
    }
    return MONTH_NAMES[month];
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

export function dateToInputUTC(date: Date, useTime = true): string {
    const year = date.getUTCFullYear().toString().padStart(4, "0");
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");

    if (useTime) {
        const hours = date.getUTCHours().toString().padStart(2, "0");
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");

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
export const formatTime = (date: Date, displaySwedishTime = true) => {
    if (displaySwedishTime) {
        date = offsetLocalTimezoneToSweden(date);
    }

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

export function dateToTimeInputUTC(date: Date): string {
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

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

export const formatDateShort = (date: Date, today = new Date(), displaySwedishTime = true) => {
    if (displaySwedishTime) {
        date = offsetLocalTimezoneToSweden(date);
        today = offsetLocalTimezoneToSweden(today);
    }
    
    const day = date.getDate();
    const month = getNameOfMonth(date).toLocaleLowerCase();
    const year = date.getFullYear();

    if (year === today.getFullYear()) {
        return `${day} ${month}`;
    }

    return `${day} ${month} ${year}`;
}

// Checks if two dates have the same year, month and day
const isSameDay = (a: Date, b: Date) => {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

// All local methods (getDate, getMonth, etc) of the returned date
// object will be in swedish time. The UTC methods
// (valueOf, getUTCDate, getUTCMonth, etc) will be incorrect
const offsetLocalTimezoneToSweden = (date: Date) => {
    date = new Date(date);

    const userTimezoneOffset = date.getTimezoneOffset();
    const swedenDate = DateTime.local(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1, // Month is 1-indexed in luxon but not in JS Date
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds(),
        { zone: "Europe/Stockholm" }
    );
    const swedenTimezoneOffset = swedenDate.offset;
    date.setMinutes(date.getMinutes() + userTimezoneOffset + swedenTimezoneOffset);

    return date;
}

// Get as a short as possible string representation of a time interval
export const formatTimeInterval = (from: Date, to: Date, displaySwedishTime = true): string => {
    const today = new Date();

    if (isSameDay(from, to)) {
        return `${formatDateShort(from, today, displaySwedishTime)} ${formatTime(from, displaySwedishTime)} - ${formatTime(to, displaySwedishTime)}`;
    }

    return `${formatDateShort(from, today, displaySwedishTime)} ${formatTime(from, displaySwedishTime)} - ${formatDateShort(to, today, displaySwedishTime)} ${formatTime(to, displaySwedishTime)}`;
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

    return `${roundedHours}:${roundedMinutes}`;
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
        "hotmail.com",
        "hotmail.se",
        "outlook.com",
    ]

    const parts = mail.split("@");
    if (parts.length !== 2) {
        // No need to warn the user since the browser will stop them
        return true;
    }

    const ending = parts[1];

    if (mailEndings.includes(ending)) {
        return true;
    }
    
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

export const getUserEmail = (session: Session | undefined | null): string | undefined => {
    if (!session) {
        return undefined;
    }

    return session.user.email;
}

export const getUserName = (session: Session | undefined | null): string | undefined => {
    if (!session) {
        return undefined;
    }

    return session.user.name;
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

export const reservationTypeLabelToEnum = (label: string) => {
    for (const [key, value] of Object.entries(reservationTypeLabels)) {
        if (label === value) {
            return key;
        }
    }

    return null;
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

export const recurringLabelToEnum = (label: string) => {
    for (const [key, value] of Object.entries(recurringLabels)) {
        if (label === value) {
            return key;
        }
    }

    return null;
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

export const statusLabelToEnum = (label: string) => {
    for (const [key, value] of Object.entries(statusLabels)) {
        if (label === value) {
            return key;
        }
    }

    return null;
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

export const venueLabelToId = (venues: Venue[], label: string) => {
    const venue = venues.find(v => v.name === label);
    if (!venue) {
        return null;
    }

    return venue.id;
}

// Non-negative modulo
export const mod = (x: number, n: number) => {
    return ((x % n) + n) % n;
};