import prisma from "../lib/prisma";
import { Role } from '@prisma/client';

// ------ Users ------
// Gets users sorted by name. Used on the server
export async function getUsersServer() {
    const users = await prisma.user.findMany();
    return users.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
}

// Gets users, may be specified by a search string and/or role. Used on the client
export async function getUsersClient(searchWord?: string, searchRole?: Role) {
    const params = new URLSearchParams();
    if (searchWord) params.append('word', searchWord.toLowerCase());
    if (searchRole) params.append('role', searchRole.toLowerCase());

    // Send the request
    const res = await fetch("/api/users?" + params);
    if (!res.ok) {
        console.error('Failed to fetch data');
        return null;
    }
    
    return res.json();
}