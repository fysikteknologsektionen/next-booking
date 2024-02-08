'use client'

import {
  Box,
  Flex,
  Avatar,
  HStack,
  Text,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { useSession } from 'next-auth/react'
import { signIn, signOut } from "next-auth/react";

import { useVenueStore } from '@/lib/venueStore'
import { getVenuesClient } from '@/server/api/getvenues';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useState, useEffect } from 'react';


interface NavLink {
    label: string,
    href: string
}

interface Props {
  navlink: React.ReactNode,
}

const Links: NavLink[] = [
  {
    label: "Kalender",
    href: "/"
  },
  {
    label: "Boka lokal",
    href: "/create-reservation"
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
      as="a"
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
      href={navlink.href}>
      {navlink.label}
    </Box>
  )
}

export default function Navbar() {
  const colorMode = useColorModeValue('gray.200', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure()
  const session = useSession();
  const isSignedIn = session.data !== null;


  const setVenues = useVenueStore((state) => state.setVenues);
  const [session_, setSession] = useState<Session>();

  useEffect(() => {
    (async () => {
      const venues = await getVenuesClient();
      setVenues(venues);
    })()
  }, [ setVenues ]);

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
      <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Box>
              <Box
                as="a"
                px={2}
                py={1}
                rounded={'md'}
                _hover={{
                  textDecoration: 'none',
                  bg: useColorModeValue('gray.200', 'gray.700'),
                }}
                href="/">
                  <Text as="b">
                    Lokalbokning
                  </Text>
              </Box>
            </Box>
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
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
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}>
                  <Avatar
                    size={'sm'}
                    src={session_?.user.image}
                  />
                </MenuButton>
                <MenuList>
                  <MenuItem as="a" href="/profile">Profil</MenuItem>
                  <MenuDivider />
                  <MenuItem onClick={() => signOut()} color="red.500">Logga ut</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          ) : (
            <Box
              as="button"
              px={2}
              py={1}
              rounded={'md'}
              _hover={{
                textDecoration: 'none',
                bg: colorMode,
              }}
              onClick={() => signIn()}  
            >
              Logga in
            </Box>
          )}
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
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