import { Text, Grid, GridItem, Center, Button } from "@chakra-ui/react";
import { useState } from "react";

const monthNames = [
    "Jan",
    "Feb",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dec"
];

const dayNames = [
    "Mån",
    "Tis",
    "Ons",
    "Tors",
    "Fre",
    "Lör",
    "Sön"
];

const getNameOfMonth = (date: Date) => {
    return monthNames[date.getMonth()];
}

const getCurrentMonth = () => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
}

const daysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return new Date(year, month, 0).getDate();
}


export default function Calendar() {
    const [month, setMonth] = useState(getCurrentMonth())
    const firstDayOffset = (month.getDay() - 1 + 7) % 7 + 1;
    const nrDays = daysInMonth(month);
    const days = Array.from({length: nrDays}, (_, i) => i + 1)

    const prevMonth = () => {
        const date = new Date(month);
        date.setUTCMonth(date.getMonth() - 1)
        setMonth(date)
    }

    const nextMonth = () => {
        const date = new Date(month);
        date.setUTCMonth(date.getMonth() + 1)
        setMonth(date)
    }

    return (
        <div>
            <Center border="1px solid black">
                <Button onClick={prevMonth}>Prev</Button>
                {getNameOfMonth(month)} {month.getFullYear()}
                <Button onClick={nextMonth}>Next</Button>
            </Center>

            <Grid templateColumns={"repeat(7, 1fr)"} gap="1px" bg="gray">
                {dayNames.map((name, index) => {
                    return (
                        <GridItem key={index} bg="white" paddingLeft="0.25rem">
                            <Text as="b">{name}</Text>
                        </GridItem>
                    )
                })}

                {days.map((day, index) => {
                    return (
                        <GridItem gridColumnStart={index === 0 ? firstDayOffset : undefined} key={index} width={100} height={100} bg="white" padding="0.25rem">
                            {day}
                        </GridItem>
                    )
                })}
            </Grid>
        </div>
    )
}