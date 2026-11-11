import { PrismaClient, Recurring } from "@prisma/client";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

const DELETE_MONTHS = 6;
const REDACT_WEEKS = 1;
const anonymizedInfo = {
    clientName: "Anonym",
    clientEmail: "",
    clientCommittee: null,
    clientDescription: "",
}

run();
setInterval(() => run(), 1000 * 60 * 60 * 24 * 7);

async function run() {
    console.log(`Removing ${DELETE_MONTHS} month old reservations...`);
    await removeReservations()
        .catch(e => {
            console.error("Failed to delete!");
            console.error(e);
        })
        .then(count => {
            console.log(`Successfully deleted ${count} reservations.`);
        });

    console.log(`Redacting ${REDACT_WEEKS} week old reservations...`);
    await redactReservations()
        .catch(e => {
            console.error("Failed to redact!");
            console.error(e);
        })
        .then(count => {
            console.log(`Successfully redacted ${count} reservations.`);
        });

    console.log("Running again in 7 days");
}

async function removeReservations() {
    let count = 0;
    const cutoffTime = DateTime.now().minus({ months: DELETE_MONTHS });

    const res = await prisma.reservation.findMany({
        where: {
            OR: [
                {
                    recurring: Recurring.NEVER,
                    endTime: {
                        lt: cutoffTime.toJSDate(),
                    },
                },
                {
                    recurring: {
                        not: Recurring.NEVER,
                    },
                    recurringUntil: {
                        lt: cutoffTime.toJSDate(),
                    },
                }
            ]
        },
        select: {
            id: true,
            endTime: true,
            recurring: true,
            recurringUntil: true,
        }
    });

    const summary = res
        .sort((a, b) => a.endTime.valueOf() - b.endTime.valueOf())
        .map(r => {
            const now = DateTime.now();
            const end = DateTime.fromJSDate(r.recurring === Recurring.NEVER ?
                r.endTime :
                r.recurringUntil
            );
            const diff = now.diff(end, ["years", "months", "days"])
            return `ID: ${r.id.toString().padStart(5, " ")}, ${end.toISO()}, ${diff.years}y ${diff.months.toString().padStart(2, " ")}m ${Math.round(diff.days).toString().padStart(2, " ")}d old, Recurring: ${r.recurring}`;
        })
        .join("\n");

    if (res.length > 0) {
        console.log("Will remove the following reservations:\n" + summary);
        console.log(`Total ${res.length} reservations`);
    }

    let status = await prisma.reservation.deleteMany({
        where: {
            recurring: Recurring.NEVER,
            endTime: {
                lt: cutoffTime.toJSDate(),
            },
        },
    });
    count += status.count;

    // Not totally correct. Recurring reservations may be kept up
    // to 1 month + {DELETE_MONTHS} months since the last reservation might not align
    // with the `recurringUntil` date.
    status = await prisma.reservation.deleteMany({
        where: {
            recurring: {
                not: Recurring.NEVER,
            },
            recurringUntil: {
                lt: cutoffTime.toJSDate(),
            },
        },
    });
    count += status.count;

    return count;
}

async function redactReservations() {
    let count = 0;
    const cutoffTime = DateTime.now().minus({ weeks: REDACT_WEEKS });

    let status = await prisma.reservation.updateMany({
        where: {
            recurring: Recurring.NEVER,
            endTime: {
                lt: cutoffTime.toJSDate(),
            },
        },
        data: {
            ...anonymizedInfo
        }
    });
    count += status.count;

    // Not totally correct. Recurring reservations may keep personal info up
    // to 1 month + {REDACT_WEEKS} weeks since the last reservation might not align
    // with the `recurringUntil` date.
    status = await prisma.reservation.updateMany({
        where: {
            recurring: {
                not: Recurring.NEVER,
            },
            recurringUntil: {
                lt: cutoffTime.toJSDate(),
            },
        },
        data: {
            ...anonymizedInfo
        }
    });
    count += status.count;

    return count;
}