"use client";

import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Heading,
    Icon,
} from '@chakra-ui/react'
import { Text, Grid, GridItem, Center, Button, Circle, HStack, VStack, Tag, Spinner, IconButton, useDisclosure } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Recurring, Reservation, Status } from "@prisma/client";
import { getReservationsClient } from "@/server/api/getreservations";
import { ArrowBackIcon, ArrowForwardIcon, CheckIcon, ChevronDownIcon, CloseIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { useVenueStore } from "@/lib/venueStore";
import { daysInMonth, DAY_NAMES, formatTimeInterval, getCurrentMonth, getNameOfMonth, getRecurringLabel, getReservationTypeLabel, getVenueColor, getVenueLabel, isManager } from "@/lib/helper";
import { approveReservationClient } from "@/server/api/approveReservation";
import { denyReservationClient } from "@/server/api/denyReservation";
import { getSession } from "next-auth/react";
import { deleteReservationClient } from "@/server/api/deleteReservation";
import { Session } from "next-auth";
import { MdAccessTime, MdInsertInvitation, MdNotes, MdOutlinePeople } from "react-icons/md";

export default function Calendar() {
    const [month, setMonth] = useState(getCurrentMonth())

    const [isLoading, setLoading] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    useEffect(() => {
        (async () => {
            setLoading(true)

            const r = await getReservations(month);
            setReservations(r);

            setLoading(false)
        })();
    }, [ month ]);

    const { isOpen, onOpen, onClose } = useDisclosure()
    const [activeReservation, setActiveReservation] = useState<Reservation>()

    const closeAndRefresh = () => {
        onClose();
        setActiveReservation(undefined);

        // Force a refresh of the calendar
        setMonth(getCurrentMonth(month));
    }

    return (
        <>
            <div style={{
                maxWidth: "800px",
            }}>
                <CalendarActionHeader
                    month={month}
                    setMonth={setMonth}
                    isLoading={isLoading}
                />

                <CalendarDaysHeader />

                <CalendarBody
                    month={month}
                    reservations={reservations}
                    setActiveReservation={setActiveReservation}
                    onOpen={onOpen}
                />
            </div>

            <CalendarDetailsModal
                isOpen={isOpen}
                onClose={onClose}
                reservation={activeReservation}
                closeAndRefresh={closeAndRefresh}
            />
        </>
    )
}

interface CalendarActionHeaderProps {
    month: Date;
    setMonth: Dispatch<SetStateAction<Date>>;
    isLoading: boolean;
}

function CalendarActionHeader(props: CalendarActionHeaderProps) {
    const prevMonth = () => {
        const date = new Date(props.month);
        date.setUTCMonth(date.getMonth() - 1)
        props.setMonth(date)
    }

    const nextMonth = () => {
        const date = new Date(props.month);
        date.setUTCMonth(date.getMonth() + 1)
        props.setMonth(date)
    }

    const viewCurrentMonth = () => {
        const date = getCurrentMonth();
        props.setMonth(date);
    }

    return (
        <Center
            borderBottom="1px solid black"
            position="relative"
            paddingBottom="0.5rem"
        >
            <HStack gap="1rem">
                <IconButton aria-label='Previous month' icon={<ArrowBackIcon />} onClick={prevMonth} />
                <Text>{getNameOfMonth(props.month)} {props.month.getFullYear()}</Text>
                <IconButton aria-label='Next month' icon={<ArrowForwardIcon />} onClick={nextMonth} />
            </HStack>

            <Button
                onClick={viewCurrentMonth}
                position="absolute"
                left="0"
                top="0"
            >Idag</Button>

            {props.isLoading && (
                <Spinner
                    position="absolute"
                    right="1rem"
                ></Spinner>
            )}
        </Center>
    )
}

function CalendarDaysHeader() {
    return (
        <Grid
            templateColumns={"repeat(7, minmax(0, 1fr))"}
            gap="1px"
            bg="gray.200"
            border="1px"
            borderColor="gray.200"
            borderTop="none"
            borderBottom="1px solid black"
        >
            {DAY_NAMES.map((name, index) => {
                return (
                    <GridItem key={index} bg="white" paddingLeft="0.25rem">
                        <Text as="b">{name}</Text>
                    </GridItem>
                )
            })}
        </Grid>
    )
}

interface CalendarBodyProps {
    month: Date;
    reservations: Reservation[];
    setActiveReservation: Dispatch<SetStateAction<Reservation | undefined>>;
    onOpen: () => void;
}

function CalendarBody({
    month,
    reservations,
    setActiveReservation,
    onOpen
}: CalendarBodyProps) {
    const today = new Date();

    const firstDayOffset = (month.getDay() - 1 + 7) % 7 + 1;
    const nrDays = daysInMonth(month);
    const days = Array.from({length: nrDays}, (_, i) => i + 1);

    const isToday = (day: number, today: Date) => {
        return (
            today.getUTCFullYear() === month.getUTCFullYear() &&
            today.getMonth() === month.getMonth() &&
            today.getDate() === day
        );
    }

    return (
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
                    <GridItem
                        // The calendar header always start on mondays but
                        // most month don't start on a monday. Offset the first day
                        // in the grid to account for this
                        gridColumnStart={index === 0 ? firstDayOffset : undefined}
                        key={index}
                        bg="white"
                        padding="0.25rem"
                        paddingTop="calc(0.25rem + 35px)"
                        minHeight="136px"
                        position="relative"
                    >
                        <CalendarNumber isMarked={isToday(day, today)}>
                            {day}
                        </CalendarNumber>

                        <ReservationsList
                            reservations={reservations}
                            day={day}
                            setActiveReservation={setActiveReservation}
                            onOpen={onOpen}
                            month={month}
                        ></ReservationsList>
                    </GridItem>
                )
            })}
        </Grid>
    )
}

interface CalendarNumberProps {
    children: React.ReactNode;
    isMarked: boolean;
}

function CalendarNumber(props: CalendarNumberProps) {
    return (
        <Center
            position="absolute"
            top="5px"
            left="5px"
            width="30px"
            height="30px"
        >
            {props.isMarked ? (
                <Circle
                    bg="blue.500"
                    size="30px"
                    fontWeight="bold"
                    color="white"
                >
                    {props.children}
                </Circle>
            ) : (
                <Text>{props.children}</Text>
            )}
        </Center>
    )
}

interface CalendarDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservation: Reservation | undefined;
    closeAndRefresh: () => void;
}

function CalendarDetailsModal({
    isOpen,
    onClose,
    reservation: activeReservation,
    closeAndRefresh,
}: CalendarDetailsModalProps) {
    const venues = useVenueStore((state) => state.venues);

    // useSession() doesn't seem to work
    // const session = useSession().data;
    // const _isManager = isManager(session);
    const [session, setSession] = useState<Session>();
    useEffect(() => {
        (async () => {
            const currentSession = await getSession();
            if (!currentSession) {
                return;
            }

            setSession(currentSession);
        })()
    }, []);
    const _isManager = isManager(session);

    const [disabledMenuButtons, setDisabledMenuButtons] = useState({
        accept: false,
        deny: false,
        delete: false,
        edit: false
    });

    // Enable all action-buttons again when opening another reservation
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
            closeAndRefresh();
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
            closeAndRefresh();
        }

        setDisabledMenuButtons(d => ({ ...d, deny: false }));
    }

    const deleteActiveReservation = async () => {
        if (!activeReservation) {
            return;
        }
        setDisabledMenuButtons(d => ({ ...d, delete: true }));

        const res = await deleteReservationClient(activeReservation.id);

        if (res && res.ok) {
            console.log("Borttagen");
            closeAndRefresh();
        }

        setDisabledMenuButtons(d => ({ ...d, delete: false }));
    }

    const editActiveReservation = () => {
        if (!activeReservation) {
            return;
        }

        window.location.href = `/update?reservationID=${activeReservation.id}`;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
            <ModalHeader>Bokning</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
                {activeReservation && (
                    <>
                        <Heading size="xl">{getVenueLabel(venues, activeReservation.venueId)}</Heading>

                        <div style={{
                            marginTop: "2rem",
                            display: "grid",
                            gridTemplateColumns: "min-content auto",
                            gap: "1rem",
                        }}>
                            <Icon fontSize="1.25rem">
                                <MdOutlinePeople />
                            </Icon>
                            {activeReservation.clientCommittee == null ? (
                                <Text>{activeReservation.clientName} ({activeReservation.clientEmail})</Text>
                            ) : (
                                <Text>
                                    <Text as="span">{activeReservation.clientName} ({activeReservation.clientEmail})</Text> åt <Text as="span" fontStyle="italic">{activeReservation.clientCommittee}</Text>
                                </Text>
                            )}
                            
                            <Icon fontSize="1.25rem">
                                <MdInsertInvitation />
                            </Icon>
                            <Text>{getReservationTypeLabel(activeReservation.type)}</Text>

                            <Icon fontSize="1.25rem">
                                <MdAccessTime />
                            </Icon>
                            <Text>{formatTimeInterval(
                                activeReservation.startTime,
                                activeReservation.endTime
                            )} {activeReservation.recurring !== Recurring.NEVER && (
                                <Text>Stående bokning: Återkommer {getRecurringLabel(activeReservation.recurring).toLocaleLowerCase()}</Text>
                            )}</Text>

                            <Icon fontSize="1.25rem">
                                <MdNotes />
                            </Icon>
                            <Text>{activeReservation.clientDescription}</Text>
                        </div>

                        {activeReservation.status === Status.PENDING && (
                            <>
                                <br />
                                <Text color="yellow.500">Denna bokningen väntar på godkännande</Text>
                            </>
                        )}

                        {activeReservation.status === Status.DENIED && (
                            <>
                                <br />
                                <Text color="red.500">Denna bokningen blev nekad</Text>
                            </>
                        )}
                    </>
                )}
            </ModalBody>

            <ModalFooter>
                <HStack>
                    {activeReservation && _isManager && (
                        <Menu>
                            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                Adminåtgärder
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
    )
}

interface ReservationsListProps {
    reservations: Reservation[],
    day: number,
    setActiveReservation: Dispatch<SetStateAction<Reservation | undefined>>,
    onOpen: () => void,
    month: Date
}

// Template for the ui chips showing the
// reservations in the calendar
function ReservationsList({
    reservations,
    day,
    setActiveReservation,
    onOpen,
    month
}: ReservationsListProps) {
    const venues = useVenueStore((state) => state.venues);
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

        // Only show reservation on the first booked day
        return (
            reservation.startTime.valueOf() >= calendarDayFrom.valueOf() &&
            reservation.startTime.valueOf() < calendarDayTo.valueOf()
        );

        // Show reservation for all booked days
        // return (
        //     reservation.startTime.valueOf() <= calendarDayTo.valueOf() &&
        //     reservation.endTime.valueOf() >= calendarDayFrom.valueOf()
        // );
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
                                {getVenueLabel(venues, reservation.venueId)}
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

async function getReservations(month: Date) {
    const startTime = month;
    const endTime = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    
    const res = await getReservationsClient(startTime, endTime);

    // Repair all date objects
    const parsedReservations: Reservation[] = res.map((r: any) => {
        return {
            ...r,
            date: new Date(r.date),
            startTime: new Date(r.startTime),
            endTime: new Date(r.endTime),
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
        };
    });

    return parsedReservations;
}