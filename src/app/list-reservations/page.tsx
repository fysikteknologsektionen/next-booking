'use client'
import { getReservationsClient } from "@/lib/fetching";
import { Reservation } from "@prisma/client";
import { useEffect, useState, useMemo } from "react";

export default function ReservationsList() {
    const [searchTerms, setSearchTerms] = useState<string[]>();
    const [reservations, setReservations] = useState<Reservation[]>();

    useEffect(() => {
        const callAsync = async () => {
            const res = await getReservationsClient();
            setReservations(res);
        }

        callAsync();
    }, []);

    const filteredReservations = useMemo(() => {
        if (!searchTerms) return reservations;

        if (reservations && reservations.length > 0) {
            const list: Reservation[] = [];

            for (const entry of reservations) {
                let count: number = 0;
                for (const searchTerm of searchTerms) {
                    for (const value of Object.values(entry)) {
                        if (!value) continue;
                        if (value == searchTerm || (typeof value === 'string' && value.includes(searchTerm)))  {
                            count += 1;
                            break;
                        }
                    }
                }

                if (count === searchTerms.length) {
                    list.push(entry);
                }
            }

            return list;
        }

        return [];
    }, [searchTerms, reservations]);

    const renderReservation = (r: Reservation) => {
        return (
            <tr key={r.id}>
                <td>{r.id}</td>
                <td>{JSON.stringify(r.createdAt)}</td>
                <td>{JSON.stringify(r.updatedAt)}</td>
                <td>{r.clientName}</td>
                <td>{r.clientEmail}</td>
                <td>{r.clientDescription}</td>
                <td>{JSON.stringify(r.date)}</td>
                <td>{JSON.stringify(r.startTime)}</td>
                <td>{JSON.stringify(r.endTime)}</td>
                <td>{r.status}</td>
                <td>{r.venueId}</td>
            </tr>
        );
    } 

    return (
        <div>
            <input type="text" placeholder="Type something..." onChange={(e) => setSearchTerms(e.target.value.split(','))}></input>
            <table style={{fontSize: '12px'}}>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Create</th>
                        <th>Update</th>
                        <th>CName</th>
                        <th>CEmail</th>
                        <th>CDesc</th>
                        <th>Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                        <th>Venue</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredReservations && filteredReservations.map((reservation: Reservation, index: number) => (
                        renderReservation(reservation)
                    ))}
                </tbody>
            </table>
        </div>
    )
}