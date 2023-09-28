"use client";

import styles from "calendar.module.css";
import { Text, Grid, GridItem, Center, Button, Circle, HStack, Box, VStack, Tag } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Reservation } from "@prisma/client";
import { getReservationsClient } from "@/lib/fetching";

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

const dayNames = [
    "Mån",
    "Tis",
    "Ons",
    "Tors",
    "Fre",
    "Lör",
    "Sön"
];

const getNameOfMonth = (date: Date) => {
    return monthNames[date.getMonth()];
}

const getCurrentMonth = () => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

const daysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return new Date(year, month, 0).getDate();
}

export default function Calendar() {
    const today = new Date();
    const [month, setMonth] = useState(getCurrentMonth())
    const firstDayOffset = (month.getDay() - 1 + 7) % 7 + 1;
    const nrDays = daysInMonth(month);
    const days = Array.from({length: nrDays}, (_, i) => i + 1)

    const [reservations, setReservations] = useState<Reservation[]>([]);
    useEffect(() => {
        (async () => {
            const startTime = month;
            const endTime = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const res = await getReservationsClient(startTime, endTime);
            
            const parsedReservations: Reservation[] = res.map((r: any) => {
                return {
                    ...r,
                    date: new Date(r.date),
                    startTime: new Date(r.startTime),
                    endTime: new Date(r.endTime),
                    createdAt: new Date(r.createdAt),
                    updatedAt: new Date(r.updatedAt)
                };
            })
            setReservations(parsedReservations);
        })();
    }, [ month ]);

    const prevMonth = () => {
        const date = new Date(month);
        date.setUTCMonth(date.getMonth() - 1)
        setMonth(date)
    }

    const nextMonth = () => {
        const date = new Date(month);
        date.setUTCMonth(date.getMonth() + 1)
        setMonth(date)
    }

    const viewCurrentMonth = () => {
        const date = getCurrentMonth();
        setMonth(date);
    }

    const isToday = (day: number, today: Date) => {
        return (
            today.getUTCFullYear() === month.getUTCFullYear() &&
            today.getMonth() === month.getMonth() &&
            today.getDate() === day
        );
    }

    return (
        <div>
            <Center border="1px solid black" position="relative">
                <HStack gap="1rem">
                    <Button onClick={prevMonth}>Prev</Button>
                    <Text>{getNameOfMonth(month)} {month.getFullYear()}</Text>
                    <Button onClick={nextMonth}>Next</Button>
                </HStack>

                <Button
                    onClick={viewCurrentMonth}
                    position="absolute"
                    left="0"
                    top="0"
                >Today</Button>
            </Center>

            <Grid templateColumns={"repeat(7, 1fr)"} gap="1px" bg="gray">
                {dayNames.map((name, index) => {
                    return (
                        <GridItem key={index} bg="white" paddingLeft="0.25rem">
                            <Text as="b">{name}</Text>
                        </GridItem>
                    )
                })}

                {days.map((day, index) => {
                    return (
                        <GridItem gridColumnStart={index === 0 ? firstDayOffset : undefined} key={index} aspectRatio="1 / 1" bg="white" padding="0.25rem">
                            {isToday(day, today) ? (
                                <Circle
                                    bg="blue.500"
                                    size="30px"
                                    fontWeight="bold"
                                    color="white"
                                >
                                    {day}
                                </Circle>
                            ) : (
                                day
                            )}

                            {reservations && (
                                <VStack width="100%" gap="0.25rem">
                                    {reservations.filter(r => isToday(day, r.startTime)).map((reservation, index) => {
                                        return (
                                            <Tag width="100%" bg="red" key={index}>
                                                <Text isTruncated>
                                                    {reservation.clientName}
                                                </Text>
                                            </Tag>
                                        )
                                    })}
                                </VStack>
                            )}

                        </GridItem>
                    )
                })}
            </Grid>
        </div>
    )
}