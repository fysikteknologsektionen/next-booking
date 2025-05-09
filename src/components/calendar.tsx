"use client";

import styles from "./calendar.module.css";
import { Heading, Icon, Link } from '@chakra-ui/react'
import { Text, Grid, GridItem, Center, Button, Circle, HStack, VStack, Spinner, IconButton } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Recurring, Reservation, Status } from "@prisma/client";
import { getReservationsClient } from "@/server/api/getreservations";
import { MdClose, MdCheck } from 'react-icons/md';
import { RiDeleteBin5Fill } from 'react-icons/ri';
import { FiEdit } from 'react-icons/fi';
import { FaArrowLeft, FaArrowRight, FaChevronDown } from 'react-icons/fa';
import { useVenueStore } from "@/lib/venueStore";
import { daysInMonth, DAY_NAMES, formatTimeInterval, getCurrentMonth, getNameOfMonth, getRecurringLabel, getReservationTypeLabel, getVenueColor, getVenueLabel, isManager, getUserEmail, getUserName } from "@/lib/helper";
import { approveReservationClient } from "@/server/api/approveReservation";
import { denyReservationClient } from "@/server/api/denyReservation";
import { getSession } from "next-auth/react";
import { deleteReservationClient } from "@/server/api/deleteReservation";
import { Session } from "next-auth";
import { MdAccessTime, MdInsertInvitation, MdNotes, MdOutlinePeople } from "react-icons/md";
import { Tag } from './ui/tag';
import {
    DialogActionTrigger,
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
} from "@/components/ui/dialog";
import { MenuContent, MenuRoot, MenuTrigger, MenuItem } from './ui/menu';
import { IoAddCircleSharp, IoReload } from 'react-icons/io5';
import { useSearchParams } from "next/navigation";

export default function Calendar() {
    const searchParams = useSearchParams()
    const searchMonth = searchParams.get("month");

    const [month, setMonth] = useState(getCurrentMonth())

    useEffect(() => {
        if (!searchMonth) {
            return;
        }

        const d = new Date(searchMonth);
        d.setUTCDate(1);
        d.setUTCHours(0, 0, 0, 0);
        setMonth(d);
    }, [searchMonth])

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

    const [isOpen, setOpen] = useState(false);
    const [activeReservation, setActiveReservation] = useState<Reservation>()

    const refresh = () => {
        // Force a refresh of the calendar
        setMonth(getCurrentMonth(month));
    }

    const closeAndRefresh = () => {
        setOpen(false);
        setActiveReservation(undefined);

        refresh();
    }

    return (
        <>
            <div id="calendar" style={{
                maxWidth: "800px",
            }}>
                <CalendarActionHeader
                    month={month}
                    setMonth={setMonth}
                    isLoading={isLoading}
                    refresh={refresh}
                />

                <CalendarDaysHeader />

                <CalendarBody
                    month={month}
                    reservations={reservations}
                    setActiveReservation={setActiveReservation}
                    onOpen={() => setOpen(true)}
                />
            </div>

            <CalendarDetailsModal
                isOpen={isOpen}
                setOpen={setOpen}
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
    refresh: () => void;
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
                <IconButton variant="subtle" aria-label='Previous month' onClick={prevMonth}>
                    <FaArrowLeft />
                </IconButton>
                <Text>{getNameOfMonth(props.month)} {props.month.getFullYear()}</Text>
                <IconButton variant="subtle" aria-label='Next month' onClick={nextMonth}>
                    <FaArrowRight />
                </IconButton>
            </HStack>

            <Button
                variant="subtle"
                onClick={viewCurrentMonth}
                position="absolute"
                left="0"
                top="0"
            >Idag</Button>

            <HStack position="absolute" right="0" gap="1rem">
                {props.isLoading && (
                    <Spinner></Spinner>
                )}

                <IconButton
                    variant="subtle"
                    onClick={props.refresh}
                    title="Refresh calendar"
                >
                    <IoReload />
                </IconButton>
            </HStack>
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
                    <GridItem key={name} bg="white" paddingLeft="0.25rem">
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

    const [expandedDay, setExpandedDay] = useState(-1);
    useEffect(() => {
        setExpandedDay(-1);
    }, [ month ]);

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
                const isExpanded = expandedDay === day;

                const startTime = new Date(month);
                startTime.setUTCDate(day);
                startTime.setUTCHours(17, 0, 0, 0);
                const searchParams = new URLSearchParams();
                searchParams.append("startTime", startTime.toISOString());
                searchParams.append("clientEmail", getUserEmail(session) ?? "");
                searchParams.append("clientName", getUserName(session) ?? "");
                const createUrlString = "/create?" + searchParams.toString();

                return (
                    <GridItem
                        // The calendar header always start on mondays but
                        // most month don't start on a monday. Offset the first day
                        // in the grid to account for this
                        gridColumnStart={index === 0 ? firstDayOffset : undefined}
                        key={month.toISOString() + "@" + day}
                        bg="white"
                        padding="0.25rem"
                        paddingTop="calc(0.25rem + 35px)"
                        minHeight="136px"
                        position="relative"
                        className={styles.calendarSquare}
                    >
                        <div style={isExpanded ? {
                            position: "absolute",
                            top: "0",
                            left: "-0.5rem",
                            right: "-0.5rem",
                            padding: "0.75rem",
                            paddingTop: "calc(0.25rem + 35px)",
                            borderRadius: "16px",
                            zIndex: "1",
                            background: "inherit",
                            boxShadow: "0 0 15px 0 rgba(0, 0, 0, 0.25)",
                        } : undefined}>
                            <CalendarNumber
                                isMarked={isToday(day, today)}
                                createUrl={createUrlString}
                            >
                                {day}
                            </CalendarNumber>

                            <ReservationsList
                                showDesc={_isManager}
                                reservations={reservations}
                                day={day}
                                setActiveReservation={setActiveReservation}
                                onOpen={onOpen}
                                month={month}
                                isExpanded={isExpanded}
                                setExpanded={(newValue) => {
                                    if (newValue) {
                                        setExpandedDay(day);
                                    }
                                    else {
                                        setExpandedDay(-1);
                                    }
                                }}
                            ></ReservationsList>
                        </div>
                    </GridItem>
                )
            })}
        </Grid>
    )
}

interface CalendarNumberProps {
    children: React.ReactNode;
    isMarked: boolean;
    createUrl: string;
}

function CalendarNumber(props: CalendarNumberProps) {
    return (
        <Center
            position="absolute"
            top="5px"
            left="5px"
        >
            <HStack>
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
                    <Center
                        width="30px"
                        height="30px"
                    >
                        <Text>{props.children}</Text>
                    </Center>
                )}

                <Button
                    asChild
                    className={styles.bookOnCurrentDay}
                    height="unset"
                    padding="0.25em"
                    size="xs"
                    rounded="full"
                    variant="subtle"
                    title="Boka lokal denna dagen"
                >
                    <Link href={props.createUrl}>
                        <IoAddCircleSharp /> Boka
                    </Link>
                </Button>
            </HStack>
        </Center>
    )
}

interface CalendarDetailsModalProps {
    isOpen: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    reservation: Reservation | undefined;
    closeAndRefresh: () => void;
}

function CalendarDetailsModal({
    isOpen,
    setOpen,
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

    const menuRef = useRef<HTMLDivElement>(null);

    return (
        <DialogRoot lazyMount open={isOpen} onOpenChange={(e: any) => setOpen(e.open)}>
            <DialogContent ref={menuRef}>
                <DialogHeader>
                    <DialogTitle>Bokning</DialogTitle>
                </DialogHeader>
                <DialogBody>
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
                                <div>
                                    <Text>
                                        {formatTimeInterval(
                                            activeReservation.startTime,
                                            activeReservation.endTime
                                        )}
                                    </Text>
                                    <Text>
                                        {activeReservation.recurring !== Recurring.NEVER && (
                                            <>Stående bokning: Återkommer {getRecurringLabel(activeReservation.recurring).toLocaleLowerCase()}</>
                                        )}
                                    </Text>
                                </div>

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
                </DialogBody>
                <DialogFooter>
                    {activeReservation && _isManager && (
                        <MenuRoot>
                            <MenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Adminåtgärder<FaChevronDown /> 
                                </Button>
                            </MenuTrigger>
                            <MenuContent portalRef={menuRef}>
                                {activeReservation.status === Status.PENDING && (
                                    <MenuItem value="approve" closeOnSelect={false} disabled={disabledMenuButtons.accept} onClick={acceptActiveReservation}>{disabledMenuButtons.accept ? <Spinner /> : <MdCheck />}Godkänn</MenuItem>
                                )}
                                {activeReservation.status === Status.PENDING && (
                                    <MenuItem value="deny" closeOnSelect={false} disabled={disabledMenuButtons.deny} onClick={denyActiveReservation}>{disabledMenuButtons.deny ? <Spinner /> : <MdClose />}Neka</MenuItem>
                                )}
                                <MenuItem value="delete" closeOnSelect={false} disabled={disabledMenuButtons.delete} onClick={deleteActiveReservation}>{disabledMenuButtons.delete ? <Spinner /> : <RiDeleteBin5Fill />}Ta bort</MenuItem>
                                <MenuItem value="edit" disabled={disabledMenuButtons.edit} onClick={editActiveReservation}><FiEdit />Redigera</MenuItem>
                            </MenuContent>
                        </MenuRoot>
                    )}

                    <DialogActionTrigger asChild>
                        <Button>Stäng</Button>
                    </DialogActionTrigger>
                </DialogFooter>
                <DialogCloseTrigger />
            </DialogContent>
        </DialogRoot>
    )
}

interface ReservationsListProps {
    reservations: Reservation[],
    day: number,
    setActiveReservation: Dispatch<SetStateAction<Reservation | undefined>>,
    onOpen: () => void,
    month: Date,
    isExpanded: boolean,
    setExpanded: Dispatch<SetStateAction<boolean>>,
    showDesc: boolean
}

// Template for the ui chips showing the
// reservations in the calendar
function ReservationsList({
    reservations,
    day,
    setActiveReservation,
    onOpen,
    month,
    isExpanded,
    setExpanded,
    showDesc
}: ReservationsListProps) {
    const venues = useVenueStore((state) => state.venues);

    const shouldViewToday = (reservation: Reservation) => {
        if (reservation.status === Status.DENIED) {
            return false;
        }
        
        // // Only show reservation on the first booked day
        // const calendarDayFrom = new Date(month);
        // calendarDayFrom.setDate(day);
        // calendarDayFrom.setHours(0, 0, 0, 0);
        // const calendarDayTo = new Date(month);
        // calendarDayTo.setDate(day + 1);
        // calendarDayTo.setHours(0, 0, 0, 0);
        // return (
        //     reservation.startTime.valueOf() >= calendarDayFrom.valueOf() &&
        //     reservation.startTime.valueOf() < calendarDayTo.valueOf()
        // );

        // Show reservation for all booked days
        const calendarDayFrom = new Date(month);
        calendarDayFrom.setDate(day);
        // Events that close at 03:00 should not be visible on next days slot
        calendarDayFrom.setHours(4, 0, 0, 0);
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

    const viewMax = isExpanded ? Infinity : 3;
    const todaysReservations = reservations.filter(r => shouldViewToday(r));
    const leftOut = todaysReservations.length - viewMax;

    return (
        <>
            <VStack gap="0.25rem">
                {todaysReservations.slice(0, viewMax).map((reservation, index) => {
                    const onclick = () => {
                        setActiveReservation(reservation);
                        onOpen();
                    }

                    const venueColor = getVenueColor(reservation.venueId);
                    const text = showDesc ?
                        reservation.clientDescription :
                        getVenueLabel(venues, reservation.venueId)

                    return (
                        <Tag
                            onClick={onclick}
                            width="100%"
                            size="md"
                            fontWeight="bold"
                            bg={venueColor}
                            boxShadow="none"
                            color="white"
                            opacity={reservation.status === Status.PENDING ? 0.5 : 1}
                            key={index}
                        >
                            <Text truncate>
                                {text}
                            </Text>
                        </Tag>
                    )
                })}
            </VStack>

            {isExpanded ? (
                <Text
                    as="button"
                    onClick={() => setExpanded(false)}
                >Visa färre</Text>
            ) : (
                leftOut > 0 && (
                    <Text
                        as="button"
                        onClick={() => setExpanded(true)}
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

    // Sort by startTime and place pending reservations last
    parsedReservations.sort((a, b) => {
        return a.startTime.valueOf() - b.startTime.valueOf() + 1e16 * ((b.status === Status.PENDING ? 0 : 1) - (a.status === Status.PENDING ? 0 : 1));
    });

    return parsedReservations;
}