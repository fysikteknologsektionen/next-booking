"use client";

import { Heading, Icon } from '@chakra-ui/react'
import { Text, Grid, GridItem, Center, Button, Circle, HStack, VStack, Spinner, IconButton } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
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

    const [isOpen, setOpen] = useState(false);
    const [activeReservation, setActiveReservation] = useState<Reservation>()

    const closeAndRefresh = () => {
        setOpen(false);
        setActiveReservation(undefined);

        // Force a refresh of the calendar
        setMonth(getCurrentMonth(month));
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
                    <ArrowBackIcon />
                </IconButton>
                <Text>{getNameOfMonth(props.month)} {props.month.getFullYear()}</Text>
                <IconButton variant="subtle" aria-label='Next month' onClick={nextMonth}>
                    <ArrowForwardIcon />
                </IconButton>
            </HStack>

            <Button
                variant="subtle"
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
                            <CalendarNumber isMarked={isToday(day, today)}>
                                {day}
                            </CalendarNumber>

                            <ReservationsList
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
                                    <ChevronDownIcon /> Adminåtgärder
                                </Button>
                            </MenuTrigger>
                            <MenuContent portalRef={menuRef}>
                                {activeReservation.status === Status.PENDING && (
                                    <MenuItem value="approve" closeOnSelect={false} disabled={disabledMenuButtons.accept} onClick={acceptActiveReservation} icon={disabledMenuButtons.accept ? <Spinner /> : <CheckIcon />}>Godkänn</MenuItem>
                                )}
                                {activeReservation.status === Status.PENDING && (
                                    <MenuItem value="deny" closeOnSelect={false} disabled={disabledMenuButtons.deny} onClick={denyActiveReservation} icon={disabledMenuButtons.deny ? <Spinner /> : <CloseIcon />}>Neka</MenuItem>
                                )}
                                <MenuItem value="delete" closeOnSelect={false} disabled={disabledMenuButtons.delete} onClick={deleteActiveReservation} icon={disabledMenuButtons.delete ? <Spinner /> : <DeleteIcon />}>Ta bort</MenuItem>
                                <MenuItem value="edit" disabled={disabledMenuButtons.edit} onClick={editActiveReservation} icon={<EditIcon />}>Redigera</MenuItem>
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
}: ReservationsListProps) {
    const venues = useVenueStore((state) => state.venues);

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

                    return (
                        <Tag
                            onClick={onclick}
                            width="100%"
                            size="lg"
                            fontWeight="bold"
                            bg={venueColor}
                            boxShadow="none"
                            color="white"
                            opacity={reservation.status === Status.PENDING ? 0.5 : 1}
                            key={index}
                        >
                            <Text truncate>
                                {getVenueLabel(venues, reservation.venueId)}
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