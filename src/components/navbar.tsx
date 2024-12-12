'use client'

import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  useDisclosure,
  Stack,
  Link,
} from '@chakra-ui/react'
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdClose } from 'react-icons/md';
import { useSession } from 'next-auth/react'
import { signOut } from "next-auth/react";

import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { Avatar } from './ui/avatar';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from './ui/menu';


interface NavLink {
  label: string,
  href: string
}

const Links: NavLink[] = [
  {
    label: "Kalender",
    href: "/#calendar"
  },
  {
    label: "Boka lokal",
    href: "/create"
  },
  {
    label: "Information",
    href: "/information"
  }
]

const NavLink = ({
    navlink
}: {
    navlink: NavLink
}) => {
  return (
    <Box
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: "gray.200"
      }}
      asChild
    >
      <Link href={navlink.href}>
        {navlink.label}
      </Link>
    </Box>
  )
}

export default function Navbar() {
  const { open, onOpen, onClose } = useDisclosure()
  const session_use = useSession();
  const isSignedIn = session_use.data !== null;

  const [session_get, setSession] = useState<Session>();

  useEffect(() => {
    (async () => {
      const curSession = await getSession();
      if (!curSession) {
        return;
      }

      setSession(curSession);
    })()
  }, []);

  return (
    <>
      <Box px={4} bg="gray.100">
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            variant="subtle"
            size={'md'}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={open ? onClose : onOpen}
          >
            {open ? <MdClose /> : <GiHamburgerMenu />}
          </IconButton>
          <HStack gap={8} alignItems={'center'}>
            <Box>
              <Box
                asChild
                px={2}
                py={1}
                rounded={'md'}
                _hover={{
                  textDecoration: 'none',
                  bg: "gray.200"
                }}
              >
                <Link href="/" fontWeight="bold">
                  Lokalbokning
                </Link>
              </Box>
            </Box>
            <HStack as={'nav'} gap={4} display={{ base: 'none', md: 'flex' }}>
              {Links.map((link) => (
                <NavLink
                    key={link.label}
                    navlink={link}
                ></NavLink>
              ))}
            </HStack>
          </HStack>

          {isSignedIn ? (
            <Flex alignItems={'center'}>
              <MenuRoot>
                <MenuTrigger
                  asChild
                  rounded="full"
                  focusRing="outside"
                >
                  <Button
                    variant={'plain'}
                    cursor={'pointer'}
                    padding="0"
                  >
                    <Avatar
                      size={'sm'}
                      src={session_get?.user.image} 
                    />
                  </Button>
                </MenuTrigger>
                <MenuContent>
                  <MenuItem asChild value="profile">
                    <Link href="/profile" >Profil</Link>
                  </MenuItem>
                  {/* <MenuDivider /> */}
                  <MenuItem onClick={() => signOut()} color="red.500" value="signout">Logga ut</MenuItem>
                </MenuContent>
              </MenuRoot>
            </Flex>
          ) : <></>}
        </Flex>

        {open ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} gap={4}>
              {Links.map((link) => (
                <NavLink
                    key={link.label}
                    navlink={link}
                ></NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>
    </>
  )
}