import { Venue } from "@prisma/client"

export default function VenueDropdown({ venues, onCheck }:{ venues:Venue[], onCheck: (id:number) => void }) {
    // Returns all venues as combined checkbox and label
    return (
        <div>
            {venues.map((venue) => {
                return (
                    <div key={venue.id}>
                        <input type="checkbox" id={"venue"+venue.id} onChange={() => onCheck(venue.id)} />
                        <label htmlFor={"venue"+venue.id}>{venue.name}</label>
                    </div> 
                );
            })}
        </div>
    )
}