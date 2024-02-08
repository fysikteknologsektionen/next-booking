"use client"

import Image from "next/image";
import { VStack, StackDivider } from "@chakra-ui/react";

export default function Home() {
    return (
        <VStack divider={<StackDivider borderColor={"gray.400"} borderWidth={2}/>}>
            <Image src={"/AlwaysHasBeenSpaghetti.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/byebye.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/DPWait.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/push-to-main.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/workflow.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/avoidance.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/anakin-padme.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/big-plans.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/launch-party.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/uno-push.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/zerodays.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/boka.ftek.png"} alt={"spaghetti"} width={640} height={640}/>
            <Image src={"/overworked.png"} alt={"spaghetti"} width={640} height={640}/>
        </VStack>
    );
}