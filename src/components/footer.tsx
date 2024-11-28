'use client'

import { Link } from "@chakra-ui/react";
import Image from "next/image";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={{
            backgroundColor: "hsl(0, 0%, 10%)",
            color: "hsl(0, 0%, 60%)",
            padding: "3rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            margin: "0px",
            marginTop: "auto"
        }}>
            <Image width="200" height="200" src="https://ftek.se/wp-content/themes/ftek-theme/images/fantomen.svg" alt="Fantomen"></Image>
            <span>Underhåll och utveckling: <Link color="hsl(0, 0%, 80%)" href="https://ftek.se/spidera/">Spidera</Link></span>
            <span><Link color="hsl(0, 0%, 80%)" href="https://ftek.se/kontakt/">Kontakt</Link> | <Link color="hsl(0, 0%, 80%)" href="https://ftek.se/integritetspolicy/">Integritetspolicy</Link> | <Link color="hsl(0, 0%, 80%)" href="https://ftek.se/support">Support</Link></span>
            <span>&copy; {year} Fysikteknologsektionen</span>
        </footer>
    )
}