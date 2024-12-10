import { useVenueStore } from "@/lib/venueStore";
import { getReservationsClient } from "@/server/api/getreservations";
import { Card, Heading, IconButton, Spinner, Stack, Tabs, Text, useDisclosure } from "@chakra-ui/react";
import { Recurring, Reservation, Status } from "@prisma/client";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import styles from "@/components/adminReservationsList.module.css";
import { CheckIcon, CloseIcon, DeleteIcon, EditIcon, HamburgerIcon } from "@chakra-ui/icons";
import { approveReservationClient } from "@/server/api/approveReservation";
import { formatDate, formatTimeInterval, getRecurringLabel, getReservationTypeLabel, getStatusLabel, getVenueColor } from "@/lib/helper";
import { denyReservationClient } from "@/server/api/denyReservation";
import { getUsersClient } from "@/server/api/getUsers";
import { deleteReservationClient } from "@/server/api/deleteReservation";
import { Button } from "./ui/button";
import { MenuContent, MenuRoot, MenuTrigger, MenuItem } from "./ui/menu";
import { Tag } from "./ui/tag";
import { DialogActionTrigger, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog";

export default function AdminReservationsList() {
    const [isLoading, setLoading] = useState(false);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    useEffect(() => {
        (async () => {
            const startTime = new Date();
            const endTime = new Date();
            startTime.setDate(endTime.getDate() - 365);
            endTime.setDate(endTime.getDate() + 365);

            setLoading(true)
            const res = await getReservationsClient(startTime, endTime, undefined, true);

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
            parsedReservations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            setReservations(parsedReservations);
            setLoading(false)
        })();
    }, []);

    const pendingReservations = reservations.filter(r => r.status === Status.PENDING).slice(0, 3);
    const handledReservations = reservations.filter(r => r.status !== Status.PENDING).slice(0, 3);

    return (
        <div>
            <Heading as="h2" size="3xl" fontWeight="bold">Hantera bokningar</Heading>
            <br />

            <Tabs.Root defaultValue="waiting" variant={"enclosed"}>
                <Tabs.List>
                    <Tabs.Trigger value="waiting">
                        Väntar
                    </Tabs.Trigger>
                    <Tabs.Trigger value="done">
                        Redan hanterade
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="waiting">
                    <div className={styles.reservations}>
                        <div className={[
                            styles.item,
                            styles.header
                        ].join(" ")}>
                            <span>Lokal</span>
                            <span>Bokningsinfo</span>
                            <span>Datum</span>

                            <span></span>
                            <span style={{ textAlign: "right" }}>
                                {isLoading && (
                                    <Spinner></Spinner>
                                )}
                            </span>
                        </div>

                        {pendingReservations.map((reservation, index) => {
                            return (
                                <ReservationItem
                                    reservation={reservation}
                                    setReservations={setReservations}
                                    key={reservation.id}
                                    isPending={true}
                                />
                            );
                        })}

                        {pendingReservations.length === 0 && (
                            <Text color="gray.500">Inga nya bokningar</Text>
                        )}
                    </div>
                </Tabs.Content>
                <Tabs.Content value="done">
                    <div className={styles.reservations}>
                        <div className={[
                            styles.item,
                            styles.header
                        ].join(" ")}>
                            <span>Lokal</span>
                            <span>Bokningsinfo</span>
                            <span>Datum</span>

                            <span></span>
                            <span style={{ textAlign: "right" }}>
                                {isLoading && (
                                    <Spinner></Spinner>
                                )}
                            </span>
                        </div>

                        {handledReservations.map((reservation, index) => {
                            return (
                                <ReservationItem
                                    reservation={reservation}
                                    setReservations={setReservations}
                                    key={reservation.id}
                                    isPending={false}
                                />
                            );
                        })}
                    </div>
                </Tabs.Content>
            </Tabs.Root>
        </div>
    )
}

function ReservationItem({
    reservation,
    setReservations,
    isPending,
}: {
    reservation: Reservation,
    setReservations: Dispatch<SetStateAction<Reservation[]>>,
    isPending: boolean,
}) {
    const venues = useVenueStore((state) => state.venues);
    const getVenue = (venueId: number | null) => {
        return venues.find(v => v.id === venueId);
    };
    const getVenueName = (venueId: number | null) => {
        const venue = getVenue(venueId);

        if (!venue) {
            return `[Unknown Venue: ${venueId}]`;
        }

        return venue.name;
    }

    const renderTime = (reservation: Reservation) => {
        return <span>{formatTimeInterval(reservation.startTime, reservation.endTime)}</span>
    }

    const [disabled, setDisabled] = useState(false);
    const [overrideStatus, setStatus] = useState<Status>(Status.PENDING);

    const approve = async () => {
        setDisabled(true);
        setStatus(Status.PENDING);

        const res = await approveReservationClient(reservation.id);

        if (!res || !res.ok) {
            setDisabled(false);
        }
        else {
            const { updatedReservation, affectedReservations } = await res.json();

            // Make sure that overlapping reservations, that the server auto-denied,
            // will be shown as denied in the UI
            setReservations(oldReservations => {
                return oldReservations.map(currentReservation => {
                    if (currentReservation === reservation) {
                        return {
                            ...currentReservation,
                            status: Status.ACCEPTED
                        };
                    }

                    const affectedReservation = affectedReservations.find((r: Reservation) => r.id === currentReservation.id);
                    if (!affectedReservation) {
                        return { ...currentReservation };
                    }

                    return {
                        ...currentReservation,
                        status: Status.DENIED
                    };
                })
            });

            setStatus(Status.ACCEPTED);
        }
    }

    const deny = async () => {
        setDisabled(true);
        setStatus(Status.PENDING);

        const res = await denyReservationClient(reservation.id);
        //console.log(res);

        if (!res || !res.ok) {
            setDisabled(false);
        }
        else {
            setStatus(Status.DENIED);
        }
    }

    const edit = async () => {
        window.location.href = `/update?reservationID=${reservation.id}`; // router, I hardly know her
    }

    const remove = async () => {
        if (disabled) {
            return;
        }
        setDisabled(true);

        const res = await deleteReservationClient(reservation.id);
        if (res && res.ok) {
            setReservations(o => o.filter(r => r !== reservation));
        }
        else {
            console.error("Error removing!");
        }

        setDisabled(false);
    };

    const status = overrideStatus === Status.PENDING ? reservation.status : overrideStatus;

    const [editor, setEditor] = useState<string>("");
    // useEffect(() => {
    //     (async () => {
    //         if (!reservation.editorId) {
    //             setEditor(reservation.clientName);
    //             return;
    //         }

    //         const users = await getUsersClient(undefined, undefined) as any[];
    //         const editor = users.find(a => a.id == reservation.editorId);
    //         const editorName = editor?.name ?? "???";
    //         setEditor(editorName);
    //     })()
    // }, [reservation]);

    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    return (
        <Card.Root>
            <div className={styles.item}>
                <Tag
                    width="100%"
                    height="fit-content"
                    size="lg"
                    fontWeight="bold"
                    bg={getVenueColor(reservation.venueId)}
                    boxShadow="none"
                    color="white"
                >
                    <Text>{getVenueName(reservation.venueId)}</Text>
                </Tag>
                <Stack>
                    {reservation.clientCommittee == null ? (
                        <Text fontWeight="bold">{reservation.clientName} ({reservation.clientEmail})</Text>
                    ) : (
                        <Text>
                            <Text as="span" fontWeight="bold">{reservation.clientName} ({reservation.clientEmail})</Text> åt <Text as="span" fontStyle="italic" fontWeight="bold">{reservation.clientCommittee}</Text>
                        </Text>
                    )}
                    <Text>{getReservationTypeLabel(reservation.type)}</Text>
                    <span>{reservation.clientDescription}</span>

                    <Text as="i" fontSize="sm" color="gray.500">Ändrad av {editor} ({formatDate(reservation.updatedAt)})</Text>
                    <Text as="i" fontSize="sm" color="gray.500">Skapad {formatDate(reservation.createdAt)}</Text>
                </Stack>

                <div>
                    {renderTime(reservation)}
                    {reservation.recurring !== Recurring.NEVER && <Text>
                        Stående bokning: Återkommer {getRecurringLabel(reservation.recurring).toLocaleLowerCase()}
                    </Text>}
                </div>

                {status === Status.PENDING ? (
                    <>
                        <Button loading={disabled} disabled={disabled} colorPalette="green" onClick={() => approve()} className={styles.approveButton}>
                            <span className={styles.long}>Godkänn</span>
                            <CheckIcon className={styles.short} />
                        </Button>
                        <Button as={IconButton} loading={disabled} disabled={disabled} aria-label="Neka bokning" title="Neka bokning" onClick={() => deny()} colorPalette="red">
                            <CloseIcon />
                        </Button>
                    </>
                ) : (
                    <>
                        <Button disabled={true} colorPalette={status === Status.ACCEPTED ? "green" : "red"} gridColumn="span 2">
                            {getStatusLabel(status)}
                        </Button>
                        {/* Add empty element to make sure everything is aligned as an element is missing here */}
                        <span style={{ display: "none" }}></span>
                    </>
                )}

                <MenuRoot>
                    <MenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <HamburgerIcon />
                        </Button>
                    </MenuTrigger>
                    <MenuContent>
                        <MenuItem value="edit" disabled={disabled} onClick={edit} icon={<EditIcon />}>Ändra bokning</MenuItem>
                        <MenuItem value="delete" disabled={disabled} onClick={() => setConfirmDeleteOpen(true)} icon={<DeleteIcon />}>Ta bort bokning</MenuItem>
                    </MenuContent>
                </MenuRoot>
            </div>

            <DialogRoot role="alertdialog" open={isConfirmDeleteOpen} onOpenChange={(e: any) => setConfirmDeleteOpen(e.open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ta bort bokning</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        Är du säker? Inget mejl skickas till bokaren.
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button>Avbryt</Button>
                        </DialogActionTrigger>
                        <Button disabled={disabled} variant="ghost" colorPalette='red' onClick={async () => {
                            await remove();
                            setConfirmDeleteOpen(false);
                        }} ml={3}>
                            Ta bort
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </Card.Root>
    )
}