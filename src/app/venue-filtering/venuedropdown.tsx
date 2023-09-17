import { Venue } from "@prisma/client"

export default function VenueDropdown({ venues }:{ venues:Venue[] }) {
    // Returns all venues as combined checkbox and label
    return (
        <div>
            {venues.map((venue) => {
                return (
                    <div key={venue.id}>
                        <input type="checkbox" id={"venue"+venue.id}/>
                        <label htmlFor={"venue"+venue.id}>{venue.name}</label>
                    </div> 
                );
            })}
        </div>
    )
}