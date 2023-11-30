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
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
} from '@chakra-ui/react'
import { Text, Grid, GridItem, Center, Button, Circle, HStack, Box, VStack, Tag, Spinner, IconButton, useDisclosure } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { $Enums, Reservation, Role, Status, Venue } from "@prisma/client";
import { getReservationsClient } from "@/server/api/getreservations";
import { ArrowBackIcon, ArrowForwardIcon, CheckIcon, ChevronDownIcon, CloseIcon, DeleteIcon, EditIcon, SpinnerIcon } from "@chakra-ui/icons";
import { useVenueStore } from "@/lib/venueStore";
import { getNameOfMonth, getVenueColor } from "@/lib/helper";
import { approveReservationClient } from "@/server/api/approveReservation";
import { denyReservationClient } from "@/server/api/denyReservation";
import { useSession } from "next-auth/react";

const dayNames = [
    "Mån",
    "Tis",
    "Ons",
    "Tors",
    "Fre",
    "Lör",
    "Sön"
];

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

function ReservationsList({
    reservations,
    day,
    setActiveReservation,
    onOpen,
    venues,
    month
}: {
    reservations: Reservation[],
    day: number,
    setActiveReservation: Dispatch<SetStateAction<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        clientName: string;
        clientEmail: string;
        clientDescription: string | null;
        date: Date;
        startTime: Date;
        endTime: Date;
        status: $Enums.Status;
        venueId: number | null;
    } | undefined>>,
    onOpen: () => void,
    venues: Venue[],
    month: Date
}) {
    const [expanded, setExpanded] = useState(false);

    const shouldViewToday = (reservation: Reservation) => {
        if (reservation.status === Status.DENIED) {
            return false;
        }

        const calendarDayFrom = new Date(month);
        calendarDayFrom.setDate(day);
        calendarDayFrom.setHours(0, 0, 0, 0);
        const calendarDayTo = new Date(month);
        calendarDayTo.setDate(day + 1);
        calendarDayTo.setHours(0, 0, 0, 0);

        return (
            reservation.startTime.valueOf() <= calendarDayTo.valueOf() &&
            reservation.endTime.valueOf() >= calendarDayFrom.valueOf()
        );
    }

    if (!reservations) {
        return <></>;
    }

    const viewMax = expanded ? Infinity : 3;
    const todaysReservations = reservations.filter(r => shouldViewToday(r));
    const leftOut = todaysReservations.length - viewMax;

    const expandReservations = () => {
        setExpanded(e => !e);
    };

    return (
        <>
            <VStack gap="0.25rem">
                {todaysReservations.slice(0, viewMax).map((reservation, index) => {
                    const onclick = () => {
                        setActiveReservation(reservation);
                        onOpen();
                    }

                    const venueColor = getVenueColor(reservation.venueId);

                    return (
                        <Tag
                            onClick={onclick}
                            width="100%"
                            bg={venueColor}
                            color="white"
                            opacity={reservation.status === Status.PENDING ? 0.5 : 1}
                            key={index}
                        >
                            <Text isTruncated>
                                {venues.find(v => v.id === reservation.venueId)?.name ?? reservation.venueId}
                            </Text>
                        </Tag>
                    )
                })}
            </VStack>

            {expanded ? (
                <Text
                    as="button"
                    onClick={expandReservations}
                >Visa färre</Text>
            ) : (
                leftOut > 0 && (
                    <Text
                        as="button"
                        onClick={expandReservations}
                    >+ {leftOut} till</Text>
                )    
            )}
        </>
    )
}

export default function Calendar() {
    const venues = useVenueStore((state) => state.venues);

    const session = useSession().data;
    const isManager = session && (session.user.role === Role.MANAGER || session.user.role === Role.ADMIN);

    const today = new Date();
    const [month, setMonth] = useState(getCurrentMonth())
    const firstDayOffset = (month.getDay() - 1 + 7) % 7 + 1;
    const nrDays = daysInMonth(month);
    const days = Array.from({length: nrDays}, (_, i) => i + 1);

    const [isLoading, setLoading] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    useEffect(() => {
        (async () => {
            const startTime = month;
            const endTime = new Date(month.getFullYear(), month.getMonth() + 1, 1);

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
    const [disabledMenuButtons, setDisabledMenuButtons] = useState({
        accept: false,
        deny: false,
        delete: false,
        edit: false
    });

    // Enable all buttons again when opening new reservation
    useEffect(() => {
        setDisabledMenuButtons({
            accept: false,
            deny: false,
            delete: false,
            edit: false
        });
    }, [ activeReservation ])

    const acceptActiveReservation = async () => {
        if (!activeReservation) {
            return;
        }

        if (activeReservation.status !== Status.PENDING) {
            return;
        }

        setDisabledMenuButtons(d => ({ ...d, accept: true }));

        const res = await approveReservationClient(activeReservation.id);

        if (res && res.ok) {
            console.log("Godkänd");
        }

        setDisabledMenuButtons(d => ({ ...d, accept: false }));
    }

    const denyActiveReservation = async () => {
        if (!activeReservation) {
            return;
        }

        if (activeReservation.status !== Status.PENDING) {
            return;
        }

        setDisabledMenuButtons(d => ({ ...d, deny: true }));

        const res = await denyReservationClient(activeReservation.id);

        if (res && res.ok) {
            console.log("Nekad");
        }

        setDisabledMenuButtons(d => ({ ...d, deny: false }));
    }

    const deleteActiveReservation = async () => {
        // TODO: Implement this
        if (!activeReservation) {
            return;
        }
        setDisabledMenuButtons(d => ({ ...d, delete: true }));
    }

    const editActiveReservation = () => {
        if (!activeReservation) {
            return;
        }

        window.location.href = `/update-reservation?reservationID=${activeReservation.id}`;
    }

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
        return <ReservationsList
            reservations={reservations}
            day={day}
            setActiveReservation={setActiveReservation}
            onOpen={onOpen}
            venues={venues}
            month={month}
        ></ReservationsList>
    }

    return (
        <>
            <div style={{
                maxWidth: "800px",
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
                    border="1px"
                    borderColor="gray.200"
                    borderTop="none"
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
                    border="1px"
                    borderColor="gray.200"
                    borderTop="none"
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
                            {activeReservation.status === Status.PENDING && (
                                <>
                                    <Text color="yellow.500">Denna bokningen väntar på godkännande</Text>
                                    <br />
                                </>
                            )}

                            {activeReservation.status === Status.DENIED && (
                                <>
                                    <Text color="red.500">Denna bokningen blev nekad</Text>
                                    <br />
                                </>
                            )}

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
                    <HStack>
                        {activeReservation && isManager && (
                            <Menu>
                                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                    Actions
                                </MenuButton>
                                <MenuList>
                                    {activeReservation.status === Status.PENDING && (
                                        <MenuItem closeOnSelect={false} isDisabled={disabledMenuButtons.accept} onClick={acceptActiveReservation} icon={disabledMenuButtons.accept ? <Spinner /> : <CheckIcon />}>Godkänn</MenuItem>
                                    )}
                                    {activeReservation.status === Status.PENDING && (
                                        <MenuItem closeOnSelect={false} isDisabled={disabledMenuButtons.deny} onClick={denyActiveReservation} icon={disabledMenuButtons.deny ? <Spinner /> : <CloseIcon />}>Neka</MenuItem>
                                    )}
                                    <MenuItem closeOnSelect={false} isDisabled={disabledMenuButtons.delete} onClick={deleteActiveReservation} icon={disabledMenuButtons.delete ? <Spinner /> : <DeleteIcon />}>Ta bort</MenuItem>
                                    <MenuItem isDisabled={disabledMenuButtons.edit} onClick={editActiveReservation} icon={<EditIcon />}>Redigera</MenuItem>
                                </MenuList>
                            </Menu>
                        )}

                        <Button colorScheme='blue' mr={3} onClick={onClose}>
                            Stäng
                        </Button>
                    </HStack>
                </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}