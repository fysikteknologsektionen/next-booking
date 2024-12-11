#!/bin/python3

import os.path
import sys
import csv
from datetime import datetime, timedelta

BOOKINGS_FILE = "" if len(sys.argv) < 2 else sys.argv[1]
SEED_FILE = "./prisma/seed.ts"

bookings = []
if os.path.isfile(BOOKINGS_FILE):
    with open (BOOKINGS_FILE, newline='', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter=',', quotechar='"')
        next(reader)
        header = list(next(reader))

        for row in reader:
            if row[1] != '':
                year = int(''.join(row[1][2:4]))
                month = int(''.join(row[1][5:7]))
                if ((year == 24 and month >= 11) or (year >= 25)): # and int(''.join(row[1][5:7])) >= 11:
                    bookings.append(row)

    def dateSort(e):
        return e[1]

    bookings.sort(key=dateSort)

with open(SEED_FILE, "w", encoding='utf-8') as file:
    file.write("// This file is generated by parse-bookings.py\n\n")
    file.write("import { PrismaClient, ReservationType, Status } from '@prisma/client'\n\n")
    file.write("const prisma = new PrismaClient()\n\n")
    file.write("async function main() {")

    # Venues
    file.write("""
    // Venues
    await prisma.venue.upsert({
        where: {id: 1},
        update: {},
        create: {
            name: "Focus bardel",
            description: "Den norra halvan med sofforna."
        }
    })

    await prisma.venue.upsert({
        where: {id: 2},
        update: {},
        create: {
            name: "Focus mittendel",
            description: "Den mellersta delen med bord och stolar."
        }
    })

    await prisma.venue.upsert({
        where: {id: 3},
        update: {},
        create: {
            name: "Focus studiedel",
            description: "Tidigare kallad Hilbert."
        }
    })\n\n""")

    # Bookings
    file.write("""
    // Bookings
    let peek;
    \n""")

    for i, booking in enumerate(bookings):
        create_time = datetime.strftime(datetime.now(), '%Y-%m-%dT%H:00')
        if booking[0] != "":
            create_time = booking[0][:16].replace(' ', 'T').replace('.', ':')

        venue = 1
        if booking[2] == "Focus mittendel":
            venue = 2
        elif booking[2] == "Hilbert":
            venue = 3

        start = 8
        end = 12
        booking_end = booking[1]
        if "17" in booking[3]:
            start = end
            end = 17
        elif "Bok" in booking[3]:
            start = 17
            end = 8 if "Ann" in booking[8] or booking[8] == '' else int(booking[8][0:2])
            if end >= 0 and end <= 17:
                date = datetime.strptime(booking_end, '%Y-%m-%d')
                date += timedelta(days=1)
                booking_end = datetime.strftime(date, '%Y-%m-%d')

        typ = "OTHER"
        typ_name = booking[7].upper()
        if "PREP" in typ_name:
            typ = "PREPARATION"
        elif "PUB" in typ_name:
            typ = "PUB"
        elif "TACK" in typ_name or "SITT" in typ_name:
            typ = "SITTING"
        elif "FÖREST" in typ_name or "SPEX" in typ_name and not "SPEXKVÄLL" in typ_name:
            typ = "PERFORMANCE"
        elif "FÖRB" in typ_name:
            typ = "PREPARATION"

        status = "PENDING"
        if "God" in booking[9]:
            status ="ACCEPTED"
        elif "Nek" in booking[9]:
            status = "DENIED"

        file.write(f"""
    peek = await prisma.reservation.findFirst({{
        where: {{
            clientName: "{booking[4]}",
            clientEmail: "{booking[6]}",""")
        if booking[5] != '':
            file.write(f"""
            clientCommittee: "{booking[5]}",""")
        file.write(f"""
            clientDescription: "{booking[7]}",
            date: new Date("{booking[1]}"),
            startTime: new Date("{booking[1]}T{start:02d}:00"),
            endTime: new Date("{booking_end}T{end:02d}:00"),
            type: "{typ}",
            venue: {{
                id: {venue},
            }}
        }}
    }});
    if (!peek) {{
        await prisma.reservation.create({{
            data: {{
                clientName: "{booking[4]}",
                clientEmail: "{booking[6]}",""")
        if booking[5] != '':
            file.write(f"""
                clientCommittee: "{booking[5]}",""")
        file.write(f"""
                clientDescription: "{booking[7]}",
                createdAt: new Date("{create_time}"),
                date: new Date("{booking[1]}"),
                startTime: new Date("{booking[1]}T{start:02d}:00"),
                endTime: new Date("{booking_end}T{end:02d}:00"),
                type: "{typ}",
                status: "{status}",
                venue: {{
                    connect: {{id: {venue}}},
                }}
            }},
        }})
    }}\n""")

    file.write("""
}

main().then(async () => {
        await prisma.$disconnect()
    }).catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })\n""")
