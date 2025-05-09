"use client";

import styles from "./reservationItem.module.css";
import { FileUpload, useFileUploadContext, Card, Stack, Text, Heading, List } from "@chakra-ui/react"
import { HiUpload } from "react-icons/hi"
import Papa from 'papaparse';
import { useEffect, useState } from "react";
import { Recurring, Reservation, Status, Venue } from "@prisma/client";
import { formatDate, formatTimeInterval, getRecurringLabel, getReservationTypeLabel, getStatusLabel, getVenueColor, recurringLabelToEnum, reservationTypeLabelToEnum, statusLabelToEnum, venueLabelToId } from "@/lib/helper";
import { useVenueStore } from "@/lib/venueStore";
import { getVenuesClient } from "@/server/api/getvenues";
import { Tag } from "@/components/ui/tag";
import { Button } from "@/components/ui/button";
import { createReservationClient } from "@/server/api/createReservation";
import DocumentLink from "@/components/documentLink";
import { createMultipleReservationsClient } from "@/server/api/createMultipleReservations";
import { toaster } from "@/components/ui/toaster";

type CSVReservation = {
    'Lokal': string;
    'Bokningsansvarig': string;
    'Kommitté': string;
    'E-post': string;
    'Typ': string;
    'Beskrivning': string;
    'Från': string;
    'Till': string;
    'Stående bokning': string;
    'Stående till': string | null;
    'Status': string;
};

export default function Home() {
    const setVenues = useVenueStore((state) => state.setVenues);

    useEffect(() => {
        (async () => {
            const venues = await getVenuesClient();
            setVenues(venues);
        })()
    }, [ setVenues ]);

    return (
        <>
            <Heading marginBottom="0.5em" as="h1" size="4xl">Boka flera lokaler</Heading>
            <Text>Detta verktyg gör det enklare att boka flera lokaler samtidigt.</Text>
            <br />
            <Heading marginBottom="0.5em" as="h2" size="xl">Gör såhär:</Heading>
            <List.Root as="ol">
                <List.Item>
                    Ladda ner template-dokumentet.<br />
                    <DocumentLink href="/assets/Lokalbokning template.xlsx" name="Lokalbokning template.xlsx"></DocumentLink>
                </List.Item>
                <List.Item>Lägg till info för alla bokningar du vill göra.</List.Item>
                <List.Item>Exportera till en csv-fil.</List.Item>
                <List.Item>Ladda upp csv-filen nedan, granska så det ser korrekt ut och klicka till sist på skapa bokningar.</List.Item>
            </List.Root>
            <Text></Text>
            <br />

            <FileUpload.Root accept={["text/csv"]}>
                <FileUpload.HiddenInput />
                <FileUpload.Trigger asChild>
                    <Button variant="outline" size="sm">
                        <HiUpload /> Ladda upp .csv
                    </Button>
                </FileUpload.Trigger>
                
                <FileUpload.ItemGroup>
                    <FileUpload.Context>
                        {({ acceptedFiles }) =>
                            acceptedFiles.map((file) => (
                                <FileUpload.Item key={file.name} file={file}>
                                    <FileUpload.ItemPreview />
                                    <FileUpload.ItemName />
                                    <FileUpload.ItemSizeText />
                                    <FileUpload.ItemDeleteTrigger />
                                </FileUpload.Item>
                            ))
                        }
                    </FileUpload.Context>
                </FileUpload.ItemGroup>

                <FileUploadList />
            </FileUpload.Root>
        </>
    );
}

function FileUploadList() {
    const fileUpload = useFileUploadContext();
    const files = fileUpload.acceptedFiles;

    const venues = useVenueStore((state) => state.venues);
    const [csvRes, setCsvRes] = useState<any[]>([]);
    const [isUploading, setUploading] = useState(false);

    useEffect(() => {
        (async () => {
            if (files.length !== 1) {
                return null;
            }
            const csvFile = files[0];
            const csvText = await csvFile.text();
        
            const parsed = Papa.parse<CSVReservation>(csvText, {
                dynamicTyping: true,
                header: true,
                skipEmptyLines: true,
            }); 

            const { data } = parsed;
            const convertedData = data.map(r => CSVReservationToReservation(venues, r));
            setCsvRes(convertedData);
        })();
    }, [files, venues]);

    const createReservations = async () => {
        if (isUploading) {
            return;
        }

        setUploading(true);
        const valid = csvRes.filter(r => r != null);
        const result = await createMultipleReservationsClient(valid);
        if (!result) {
            toaster.create({
                title: "Något gick fel! Försök igen senare eller kontakta spidera@ftek.se",
                type: "error",
                duration: 20000
            });
        }
        else {
            fileUpload.clearFiles();
            setCsvRes([]);

            toaster.create({
                title: "Bokningarna har skapats.",
                type: "success",
                duration: 5000
            });
        }
        setUploading(false);
    };

    if (csvRes.length == 0) {
        return null;
    }

    return (
        <>
            <Heading marginBottom="0.5em" as="h2" size="xl">Nya bokningar</Heading>
            {csvRes.map((res, index) => {
                if (res == null) {
                    return (
                        <div key={index}>
                            <span>Invalid reservation. Fixa felet och ladda upp filen igen.</span>
                        </div>
                    )
                }

                return (
                    <ReservationItem reservation={res} key={index}/>
                )
            })}
            
            <Text>Alla bokningar ovan kommer läggas in i kalendern. </Text>
            <Button
                disabled={csvRes.some(r => r == null)}
                loading={isUploading}
                loadingText="Skapar..."
                onClick={createReservations}
            >Skapa bokningar</Button>
        </>
    )
}

function CSVReservationToReservation(venues: Venue[], csv: CSVReservation) {
    const startTime = parseTime(csv["Från"]);
    const endTime = parseTime(csv["Till"]);
    const recurring = recurringLabelToEnum(csv["Stående bokning"]);
    const recurringUntil = parseTime(csv["Stående till"]);
    const type = reservationTypeLabelToEnum(csv["Typ"]);
    const venueId = venueLabelToId(venues, csv["Lokal"]);
    const status = statusLabelToEnum(csv["Status"]);

    const res = {
        clientCommittee: csv['Kommitté'],
        clientDescription: csv['Beskrivning'] ?? "[Saknas]",
        clientEmail: csv['E-post'],
        clientName: csv['Bokningsansvarig'],
        date: startTime,
        endTime: endTime,
        recurring: recurring,
        recurringUntil: recurringUntil,
        startTime: startTime,
        type: type,
        venueId: venueId,
        status: status,
    };

    if (
        res.clientEmail == null ||
        res.clientName == null ||
        startTime == null ||
        endTime == null ||
        recurring == null ||
        type == null ||
        venueId == null ||
        status == null
    ) {
        console.error("Invalid csv reservation", res);
        return null;
    }

    return res;
}

function parseTime(time: string | null) {
    if (!time) {
        return null;
    }

    const regex = /(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2})/;
    const m = time.match(regex);
    if (!m) {
        return null;
    }

    return m[1] + "T" + m[2];
}

function ReservationItem({
    reservation,
}: {
    reservation: Reservation
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
        return <span>{formatTimeInterval(new Date(reservation.startTime), new Date(reservation.endTime))}</span>
    }

    const status = reservation.status;
    const color = status === Status.ACCEPTED
        ? "green" :
        status === Status.DENIED ?
            "red" :
            "gray";

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
                </Stack>

                <div>
                    {renderTime(reservation)}
                    {reservation.recurring !== Recurring.NEVER && <Text>
                        Stående bokning: Återkommer {getRecurringLabel(reservation.recurring).toLocaleLowerCase()}
                    </Text>}
                </div>

                <>
                    <Button disabled={true} colorPalette={color} gridColumn="span 2">
                        {getStatusLabel(status)}
                    </Button>
                    {/* Add empty element to make sure everything is aligned as an element is missing here */}
                    <span style={{ display: "none" }}></span>
                </>
            </div>
        </Card.Root>
    )
}