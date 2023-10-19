"use client";

import styles from "calendar.module.css";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Heading,
} from '@chakra-ui/react'
import { Text, Grid, GridItem, Center, Button, Circle, HStack, Box, VStack, Tag, Spinner, IconButton, useDisclosure } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Reservation } from "@prisma/client";
import { getReservationsClient } from "@/server/api/getreservations";
import { ArrowBackIcon, ArrowForwardIcon } from "@chakra-ui/icons";
import { useVenueStore } from "@/lib/venueStore";

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
    const venues = useVenueStore((state) => state.venues);

    const today = new Date();
    const [month, setMonth] = useState(getCurrentMonth())
    const firstDayOffset = (month.getDay() - 1 + 7) % 7 + 1;
    const nrDays = daysInMonth(month);
    const days = Array.from({length: nrDays}, (_, i) => i + 1)

    const [isLoading, setLoading] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    useEffect(() => {
        (async () => {
            const startTime = month;
            const endTime = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            setLoading(true)
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
            setLoading(false)
        })();
    }, [ month ]);

    const { isOpen, onOpen, onClose } = useDisclosure()
    const [activeReservation, setActiveReservation] = useState<Reservation>()

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

    const renderReservations = (day: number) => {
        if (!reservations) {
            return;
        }

        const viewMax = 3;
        const todaysReservtions = reservations.filter(r => isToday(day, r.startTime));
        const leftOut = todaysReservtions.length - viewMax;

        return (
            <>
                <VStack gap="0.25rem">
                    {todaysReservtions.slice(0, viewMax).map((reservation, index) => {
                        const onclick = () => {
                            setActiveReservation(reservation);
                            onOpen();
                        }

                        return (
                            <Tag onClick={onclick} width="100%" bg="red" key={index}>
                                <Text isTruncated>
                                    {venues.find(v => v.id === reservation.venueId)?.name ?? reservation.venueId}
                                </Text>
                            </Tag>
                        )
                    })}
                </VStack>

                {leftOut > 0 && (
                    <span>+ {leftOut} till</span>
                )}
            </>
        )
    }

    return (
        <>
            <div style={{
                maxWidth: "800px"
            }}>
                <Center
                    borderBottom="1px solid black"
                    position="relative"
                    paddingBottom="0.5rem"
                >
                    <HStack gap="1rem">
                        <IconButton aria-label='Previous month' icon={<ArrowBackIcon />} onClick={prevMonth} />
                        <Text>{getNameOfMonth(month)} {month.getFullYear()}</Text>
                        <IconButton aria-label='Next month' icon={<ArrowForwardIcon />} onClick={nextMonth} />
                    </HStack>

                    <Button
                        onClick={viewCurrentMonth}
                        position="absolute"
                        left="0"
                        top="0"
                    >Jdag</Button>

                    {isLoading && (
                        <Spinner
                            position="absolute"
                            right="1rem"
                        ></Spinner>
                    )}
                </Center>

                <Grid
                    templateColumns={"repeat(7, minmax(0, 1fr))"}
                    gap="1px"
                    bg="gray.200"
                    borderBottom="1px solid black"
                >
                    {dayNames.map((name, index) => {
                        return (
                            <GridItem key={index} bg="white" paddingLeft="0.25rem">
                                <Text as="b">{name}</Text>
                            </GridItem>
                        )
                    })}
                </Grid>

                <Grid
                    templateColumns={"repeat(7, minmax(0, 1fr))"}
                    gridAutoRows="1fr"
                    gap="1px"
                    bg="gray.200"
                >
                    {days.map((day, index) => {
                        return (
                            <GridItem gridColumnStart={index === 0 ? firstDayOffset : undefined} key={index} bg="white" padding="0.25rem" minHeight="136px">
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

                                {renderReservations(day)}

                            </GridItem>
                        )
                    })}
                </Grid>
            </div>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                <ModalHeader>Bokning</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {activeReservation && (
                        <>
                            <Text>{activeReservation.clientName} ({activeReservation.clientEmail}) har bokat <i>{venues.find(v => v.id === activeReservation.venueId)?.name ?? activeReservation.venueId}</i></Text>
                            <br />

                            <Text as="b">Beskrivning</Text>
                            <Text>{activeReservation.clientDescription}</Text>
                            <br />

                            <Text as="b">Tid</Text>
                            <Text>Från {activeReservation.startTime.toLocaleString()}</Text>
                            <Text>Till {activeReservation.endTime.toLocaleString()}</Text>
                        </>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme='blue' mr={3} onClick={onClose}>
                    Close
                    </Button>
                    {/* <Button variant='ghost'>Secondary Action</Button> */}
                </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}