import { useVenueStore } from "@/lib/venueStore";
import { getReservationsClient } from "@/server/api/getreservations";
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, Card, CardBody, CardHeader, Center, Heading, IconButton, Menu, MenuButton, MenuItem, MenuList, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Tag, Text, useDisclosure } from "@chakra-ui/react";
import { Recurring, Reservation, Status, Venue } from "@prisma/client";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import styles from "@/components/adminReservationsList.module.css";
import { CheckIcon, CloseIcon, DeleteIcon, DragHandleIcon, EditIcon, HamburgerIcon } from "@chakra-ui/icons";
import { approveReservationClient } from "@/server/api/approveReservation";
import { formatDate, formatTimeInterval, getNameOfMonth, getRecurringLabel, getReservationTypeLabel, getStatusLabel, getVenueColor } from "@/lib/helper";
import { useRouter } from "next/navigation";
import { denyReservationClient } from "@/server/api/denyReservation";
import { getUsersClient } from "@/server/api/getUsers";
import { deleteReservationClient } from "@/server/api/deleteReservation";

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

    const pendingReservations = reservations.filter(r => r.status === Status.PENDING);
    const handledReservations = reservations.filter(r => r.status !== Status.PENDING);

    return (
        <div>
            <Heading>Hantera bokningar</Heading>
            <br />

            <Tabs variant='enclosed'>
                <TabList>
                    <Tab>Väntar</Tab>
                    <Tab>Redan hanterade</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
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
                    </TabPanel>

                    <TabPanel>
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
                    </TabPanel>
                </TabPanels>
            </Tabs>
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
    useEffect(() => {
        (async () => {
            if (!reservation.editorId) {
                setEditor(reservation.clientName);
                return;
            }

            const users = await getUsersClient(undefined, undefined) as any[];
            const editor = users.find(a => a.id == reservation.editorId);
            const editorName = editor?.name ?? "???";
            setEditor(editorName);
        })()
    }, [reservation]);

    const {
        isOpen: isConfirmDeleteOpen,
        onOpen: openConfirmDelete,
        onClose: closeConfirmDelete
    } = useDisclosure()
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <Card>
            <div className={styles.item}>
                <Tag
                    width="100%"
                    height="fit-content"
                    bg={getVenueColor(reservation.venueId)}
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
                        <Button isLoading={disabled} isDisabled={disabled} colorScheme="green" onClick={() => approve()} className={styles.approveButton}>
                            <span className={styles.long}>Godkänn</span>
                            <CheckIcon className={styles.short} />
                        </Button>
                        <IconButton isLoading={disabled} isDisabled={disabled} aria-label="Neka bokning" title="Neka bokning" icon={<CloseIcon />} onClick={() => deny()} colorScheme="red"></IconButton>
                    </>
                ) : (
                    <>
                        <Button isDisabled={true} colorScheme={status === Status.ACCEPTED ? "green" : "red"} gridColumn="span 2">
                            {getStatusLabel(status)}
                        </Button>
                        {/* Add empty element to make sure everything is aligned as an element is missing here */}
                        <span style={{ display: "none" }}></span>
                    </>
                )}

                <Menu>
                    <MenuButton as={IconButton}>
                        <HamburgerIcon />
                    </MenuButton>
                    <MenuList>
                        <MenuItem isDisabled={disabled} onClick={edit} icon={<EditIcon />}>Ändra bokning</MenuItem>
                        <MenuItem isDisabled={disabled} onClick={openConfirmDelete} icon={<DeleteIcon />}>Ta bort bokning</MenuItem>
                    </MenuList>
                </Menu>
            </div>

            <AlertDialog
                isOpen={isConfirmDeleteOpen}
                leastDestructiveRef={cancelRef}
                onClose={closeConfirmDelete}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Ta bort bokning
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Är du säker? Inget mejl skickas till bokaren.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                        <Button isDisabled={disabled} ref={cancelRef} onClick={closeConfirmDelete}>
                            Avbryt
                        </Button>
                        <Button isDisabled={disabled} colorScheme='red' onClick={async () => {
                            await remove();
                            closeConfirmDelete();
                        }} ml={3}>
                            Ta bort
                        </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Card>
    )
}