import { useVenueStore } from "@/lib/venueStore";
import { getReservationsClient } from "@/server/api/getreservations";
import { Box, Card, Center, createListCollection, Heading, HStack, IconButton, Input, Spinner, Stack, Tabs, Text, Field, Link } from "@chakra-ui/react";
import { Recurring, Reservation, Status, User, Venue } from "@prisma/client";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import styles from "@/components/adminPanel.module.css";
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdClose, MdCheck } from 'react-icons/md';
import { RiDeleteBin5Fill } from 'react-icons/ri';
import { FiEdit } from 'react-icons/fi';
import { approveReservationClient } from "@/server/api/approveReservation";
import { formatDate, formatTimeInterval, getRecurringLabel, getReservationTypeLabel, getStatusLabel, getVenueColor, getVenueLabel } from "@/lib/helper";
import { denyReservationClient } from "@/server/api/denyReservation";
import { getUsersClient } from "@/server/api/getUsers";
import { deleteReservationClient } from "@/server/api/deleteReservation";
import { Button } from "./ui/button";
import { MenuContent, MenuRoot, MenuTrigger, MenuItem } from "./ui/menu";
import { Tag } from "./ui/tag";
import { DialogActionTrigger, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle } from "./ui/dialog";
import {
    PaginationItems,
    PaginationNextTrigger,
    PaginationPageText,
    PaginationPrevTrigger,
    PaginationRoot,
} from "@/components/ui/pagination";
import {
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from "@/components/ui/select";
import { InputGroup } from "./ui/input-group";
import { LuSearch } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { Checkbox } from "./ui/checkbox";
import { toaster } from "./ui/toaster";

export default function AdminPanel() {
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

    const [users, setUsers] = useState<User[]>([]);
    useEffect(() => {
        (async () => {
            const users = await getUsersClient(undefined, undefined) as User[];
            setUsers(users);
        })();
    }, []);

    return (
        <div>
            <hr />
            <br />

            <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Boka flera lokaler</Heading>
            <Text>Verktyg för att boka flera lokaler samtidigt finns <Link href="/multi-create">här</Link>.</Text>
            <br />

            <Heading as="h2" size="3xl" fontWeight="bold" marginBottom="0.5em">Hantera bokningar</Heading>
            <Tabs.Root defaultValue="waiting" variant={"enclosed"}>
                <Tabs.List>
                    <Tabs.Trigger value="waiting">
                        Väntar {pendingReservations.length > 0 && <Box bg="red.500" color="white" fontWeight="bold" borderRadius="100px" padding="0.1em 0.5em">{pendingReservations.length}</Box>}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="done">
                        Redan hanterade
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="waiting">
                    <ReservationList
                        reservations={pendingReservations}
                        setReservations={setReservations}
                        users={users}
                        isLoading={isLoading}
                    />
                </Tabs.Content>
                <Tabs.Content value="done">
                    <ReservationList
                        reservations={handledReservations}
                        setReservations={setReservations}
                        users={users}
                        isLoading={isLoading}
                    />
                </Tabs.Content>
            </Tabs.Root>
        </div>
    )
}

interface ReservationListProps {
    reservations: Reservation[];
    setReservations: Dispatch<SetStateAction<Reservation[]>>;
    isLoading: boolean;
    users: User[]
}

enum OrderBy {
    START_TIME_NEW,
    START_TIME_OLD,
    CREATED_TIME_NEW,
    CREATED_TIME_OLD
}

enum ShowFilter {
    ALL,
    ONLY_OVERLAPPING,
    AFTER_TODAY
}

function ReservationList(props: ReservationListProps) {
    const venues = useVenueStore((state) => state.venues);
    
    const orderByList = createListCollection({
        items: [
            { label: "Starttid - Främst", value: OrderBy[OrderBy.START_TIME_NEW] },
            { label: "Starttid - Sist", value: OrderBy[OrderBy.START_TIME_OLD] },
            { label: "Skapad - Äldst", value: OrderBy[OrderBy.CREATED_TIME_NEW] },
            { label: "Skapad - Nyast", value: OrderBy[OrderBy.CREATED_TIME_OLD] }
        ],
    });

    const showList = createListCollection({
        items: [
            { label: "Visa alla", value: ShowFilter[ShowFilter.ALL] },
            { label: "Göm försenade", value: ShowFilter[ShowFilter.AFTER_TODAY] },
            { label: "Endast överlappande", value: ShowFilter[ShowFilter.ONLY_OVERLAPPING] },
        ],
    });

    const [inputSmall, setInputSmall] = useState(false);
    const [inputShow, setInputShow] = useState([ showList.items[0].value ]);
    const [inputOrderBy, setInputOrderBy] = useState([ orderByList.items[0].value ]);
    // const [inputOrderBy, setInputOrderBy] = useState([ orderByList.items[3].value ]);
    const [inputSearch, setInputSearch] = useState("");

    const show = ShowFilter[inputShow[0] as keyof typeof ShowFilter];
    const orderBy = OrderBy[inputOrderBy[0] as keyof typeof OrderBy];

    const filteredReservations = props.reservations
        .filter(reservation => {
            if (show === ShowFilter.ALL) {
                return true;
            }

            if (show === ShowFilter.AFTER_TODAY && reservation.startTime.valueOf() < new Date().valueOf()) {
                return false;
            }

            if (reservation.status === Status.DENIED) {
                return false;
            }

            for (const otherReservation of props.reservations) {
                if (otherReservation === reservation) {
                    continue;
                }

                if (otherReservation.status === Status.DENIED) {
                    continue;
                }

                if (reservation.venueId !== otherReservation.venueId) {
                    continue;
                }

                if (otherReservation.startTime.valueOf() < reservation.endTime.valueOf() && otherReservation.endTime.valueOf() > reservation.startTime.valueOf()) {
                    return true;
                }
            }

            return false;
        })
        .filter(searchFilter(venues, inputSearch))
        .sort((a, b) => {
            if (orderBy === OrderBy.START_TIME_NEW || orderBy === OrderBy.START_TIME_OLD) {
                return a.startTime.valueOf() - b.startTime.valueOf();
            }
            else if (orderBy === OrderBy.CREATED_TIME_NEW || orderBy === OrderBy.CREATED_TIME_OLD) {
                return a.createdAt.valueOf() - b.createdAt.valueOf();
            }
            return 0;
        });

    if (orderBy === OrderBy.START_TIME_OLD || orderBy === OrderBy.CREATED_TIME_OLD) {
        filteredReservations.reverse();
    }

    const reservationsPerPage = 10;
    const totalReservations = filteredReservations.length;
    const [page, setPage] = useState(1);
    const startRange = (page - 1) * reservationsPerPage;
    const endRange = startRange + reservationsPerPage;
    const visibleReservations = filteredReservations.slice(startRange, endRange);

    const isFiltering = (
        show !== ShowFilter.ALL ||
        inputSearch !== ""
    );

    return (
        <>
            <Card.Root>
                <Card.Body>
                    <HStack justifyContent="space-between">
                        <HStack>
                            <SelectRoot
                                collection={showList}
                                value={inputShow}
                                width="150px"
                                onValueChange={(e) => setInputShow(e.value)}
                            >
                                <SelectLabel>Visa</SelectLabel>
                                <SelectTrigger>
                                    <SelectValueText placeholder="Välj vad som ska visas" />
                                </SelectTrigger>
                                <SelectContent>
                                    {showList.items.map((item: any) => (
                                        <SelectItem item={item} key={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>

                            <SelectRoot
                                collection={orderByList}
                                value={inputOrderBy}
                                width="150px"
                                onValueChange={(e) => setInputOrderBy(e.value)}
                            >
                                <SelectLabel>Sortera efter</SelectLabel>
                                <SelectTrigger>
                                    <SelectValueText placeholder="Sortera efter" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orderByList.items.map((item: any) => (
                                        <SelectItem item={item} key={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </SelectRoot>

                            <Field.Root
                                width="150px"
                            >
                                <Field.Label>Kompakt</Field.Label>
                                <Checkbox
                                    height="35px"
                                    checked={inputSmall}
                                    onCheckedChange={(e: any) => setInputSmall(!!e.checked)}
                                />
                            </Field.Root>
                        </HStack>

                        <Field.Root
                            width="100%"
                            maxWidth="300px"
                        >
                            <Field.Label>Sök</Field.Label>
                            <InputGroup width="100%" startElement={<LuSearch />}>
                                <Input
                                    value={inputSearch}
                                    onChange={(e) => {
                                        setInputSearch(e.currentTarget.value)
                                    }}
                                    placeholder="Sök efter namn, lokal, datum, m.m"
                                />
                            </InputGroup>
                        </Field.Root>
                    </HStack>

                    {isFiltering && (
                        <Text fontSize="sm" color="gray.500">Visar {filteredReservations.length}/{props.reservations.length} bokningar</Text>
                    )}
                </Card.Body>
            </Card.Root>
            <br />

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
                        {props.isLoading && (
                            <Spinner></Spinner>
                        )}
                    </span>
                </div>

                {visibleReservations.map((reservation) => {
                    return (
                        <ReservationItem
                            reservation={reservation}
                            setReservations={props.setReservations}
                            users={props.users}
                            key={reservation.id}
                            small={inputSmall}
                        />
                    );
                })}

                {props.reservations.length === 0 && (
                    <Center padding="2rem">
                        <Text color="gray.500">Inga nya bokningar</Text>
                    </Center>
                )}
            </div>

            {props.reservations.length > 0 && (
                <PaginationRoot
                    count={totalReservations}
                    pageSize={reservationsPerPage}
                    page={page}
                    onPageChange={(e: any) => setPage(e.page)}
                >
                    <HStack padding="1rem" justifyContent="center">
                        <PaginationPrevTrigger />
                        <PaginationItems />
                        <PaginationNextTrigger />
                    </HStack>
                </PaginationRoot>
            )}
        </>
    )
}

function ReservationItem({
    reservation,
    setReservations,
    users,
    small
}: {
    reservation: Reservation,
    setReservations: Dispatch<SetStateAction<Reservation[]>>,
    users: User[],
    small: boolean
}) {
    const router = useRouter();
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
            toaster.create({
                title: res ? res.statusText : "Okänt fel!",
                type: "error",
                duration: 7000
            });
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
            toaster.create({
                title: res ? res.statusText : "Okänt fel!",
                type: "error",
                duration: 7000
            });
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
            toaster.create({
                title: res ? res.statusText : "Okänt fel!",
                type: "error",
                duration: 7000
            });
            console.error("Error removing!");
        }

        setDisabled(false);
    };

    const viewInCalendar = () => {
        const month = new Date(reservation.startTime);
        router.push("/?month=" + month.toISOString() + "#calendar");
    }

    const status = overrideStatus === Status.PENDING ? reservation.status : overrideStatus;

    const [editor, setEditor] = useState<string>("");
    useEffect(() => {
        (async () => {
            if (!reservation.editorId) {
                setEditor(reservation.clientName);
                return;
            }

            const editor = users.find(u => u.id == reservation.editorId);
            const editorName = editor?.name ?? "???";
            setEditor(editorName);
        })()
    }, [reservation, users]);

    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const renderVenue = () => {
        if (small) {
            return (
                <Box
                    borderRadius="6px"
                    width="6px"
                    height="100%"
                    bg={getVenueColor(reservation.venueId)}
                ></Box>
            )
        }

        return (
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
        )
    }

    const renderBookingInfo = () => {
        if (small) {
            return (
                <Stack gap="0">
                    {reservation.clientCommittee == null ? (
                        <Text fontWeight="bold">{reservation.clientName}</Text>
                    ) : (
                        <Text>
                            <Text as="span" fontWeight="bold">{reservation.clientName}</Text> (<Text as="span" fontStyle="italic" fontWeight="bold">{reservation.clientCommittee}</Text>)
                        </Text>
                    )}
                    <span>{reservation.clientDescription}</span>
                </Stack>
            )
        }

        return (
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
        );
    };

    const renderTimeColumn = () => {
        if (small) {
            return (
                <div>
                    {renderTime(reservation)}
                    {reservation.recurring !== Recurring.NEVER && <Text>
                        {getRecurringLabel(reservation.recurring).toLocaleLowerCase()}
                    </Text>}
                </div>
            )
        }

        return (
            <div>
                {renderTime(reservation)}
                {reservation.recurring !== Recurring.NEVER && <Text>
                    Stående bokning: Återkommer {getRecurringLabel(reservation.recurring).toLocaleLowerCase()}
                </Text>}
            </div>
        )
    };

    return (
        <Card.Root>
            <div className={`${styles.item} ${small ? styles.small : ""}`}>
                {renderVenue()}
                {renderBookingInfo()}
                {renderTimeColumn()}

                {status === Status.PENDING ? (
                    <>
                        <Button loading={disabled} disabled={disabled} colorPalette="green" onClick={() => approve()} className={styles.approveButton}>
                            <span className={styles.long}>Godkänn</span>
                            <MdCheck className={styles.short} />
                        </Button>
                        <Button as={IconButton} loading={disabled} disabled={disabled} aria-label="Neka bokning" title="Neka bokning" onClick={() => deny()} colorPalette="red">
                            <MdClose />
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
                            <GiHamburgerMenu />
                        </Button>
                    </MenuTrigger>
                    <MenuContent>
                        <MenuItem value="edit" disabled={disabled} onClick={edit}><FiEdit /> Redigera</MenuItem>
                        <MenuItem value="delete" disabled={disabled} onClick={() => setConfirmDeleteOpen(true)}><RiDeleteBin5Fill /> Ta bort</MenuItem>
                        <MenuItem value="showInCalendar" disabled={disabled} onClick={viewInCalendar}><LuSearch /> Visa i kalendern</MenuItem>
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

function searchFilter(venues: Venue[], search: string) {
    search = search.trim().toLocaleLowerCase();

    const matchesSearch = (t: string) => t.toLocaleLowerCase().indexOf(search) !== -1;

    const dateMatches = (date: Date) => {
        // Fix date sometimes being a string
        date = new Date(date);

        return (
            matchesSearch(date.toISOString()) ||
            matchesSearch(date.toLocaleDateString()) ||
            matchesSearch(date.toString())
        );
    }
    
    return function (reservation: Reservation) {
        if (search === "") {
            return true;
        }

        const recurringUntilMatches = reservation.recurringUntil ?
            dateMatches(reservation.recurringUntil) :
            false;
        
        const committeeMatches = reservation.clientCommittee ?
            matchesSearch(reservation.clientCommittee) :
            false;
        
        const recurringMatches = matchesSearch(getRecurringLabel(reservation.recurring));
        const statusMatches = matchesSearch(getStatusLabel(reservation.status));
        const venueMatches = matchesSearch(getVenueLabel(venues, reservation.venueId));
        const typeMatches = matchesSearch(getReservationTypeLabel(reservation.type));
        const intervalMatches = matchesSearch(formatTimeInterval(reservation.startTime, reservation.endTime));
        
        return (
            committeeMatches ||
            matchesSearch(reservation.clientDescription) ||
            matchesSearch(reservation.clientEmail) ||
            matchesSearch(reservation.clientName) ||
            dateMatches(reservation.createdAt) ||
            dateMatches(reservation.updatedAt) ||
            dateMatches(reservation.date) ||
            dateMatches(reservation.startTime) ||
            dateMatches(reservation.endTime) ||
            intervalMatches ||
            recurringMatches ||
            recurringUntilMatches ||
            statusMatches ||
            venueMatches ||
            typeMatches
        );
    }
}