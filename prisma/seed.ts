import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// More or less copied from https://www.prisma.io/docs/guides/migrate/seed-database
async function main() {

    const exampleVenue1 = await prisma.venue.upsert({
        where: {id: 1},
        update: {},
        create: {
            name:"Example room 1",
            description:"First room to test the database",
            managers: {},
            timeslots: {},
            reservations:{
                create: [
                    {
                        clientName: "Client1",
                        clientEmail: "client1@example.com",
                        clientDescription: "Unnecessary information",
                        date: new Date(2023, 9, 17),
                        startTime: new Date(2023, 9, 17, 14, 18),  // 2023-09-17,14:18:00
                        endTime: new Date(2023, 9, 17, 22, 55),
                    },
                    {
                        clientName: "Client2",
                        clientEmail: "client2@example.com",
                        clientDescription: "Lack of information",
                        date: new Date(2023, 11, 17),
                        startTime: new Date(2023, 11, 17, 14, 18),  // 2023-09-17,14:18:00
                        endTime: new Date(2023, 11, 17, 22, 55),
                    }
                ]
            }
        }
    })

    const exampleVenue2 = await prisma.venue.upsert({
        where: {id: 2},
        update: {},
        create: {
            name:"Example room 2",
            description:"Second room to test the database",
            managers: {},
            timeslots: {},
            reservations:{
                create: [
                    {
                        clientName: "Client1",
                        clientEmail: "client1@example.com",
                        clientDescription: "Information",
                        date: new Date(2023, 9, 17),
                        startTime: new Date(2023, 9, 17, 14, 18),  // 2023-09-17,14:18:00
                        endTime: new Date(2023, 9, 17, 22, 55),
                    },
                    {
                        clientName: "Client3",
                        clientEmail: "client3@example.com",
                        clientDescription: "Other information",
                        date: new Date(2023, 9, 18),
                        startTime: new Date(2023, 9, 18, 15, 15),  // 2023-09-17,14:18:00
                        endTime: new Date(2023, 9, 18, 12, 34),
                    }
                ]
            }
        }
    })
}
main()

  .then(async () => {

    await prisma.$disconnect()

  })

  .catch(async (e) => {

    console.error(e)

    await prisma.$disconnect()

    process.exit(1)

  })