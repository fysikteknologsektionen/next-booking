import { Icon, Text } from "@chakra-ui/react";
import { MdMenuBook } from "react-icons/md";
import styles from "./documentLink.module.css";

interface DocumentLinkProps {
    href: string;
    name: string;
    target?: string;
}

export default function DocumentLink(props: DocumentLinkProps) {
    const target = props.target ?? "_blank";
        
    return (
        <a href={props.href} target={target} className={styles.a}>
            <Icon fontSize="1.5em">
                <MdMenuBook></MdMenuBook>
            </Icon>
            <Text>{props.name}</Text>
        </a>
    )
}