import { getUsersServer } from "@/server/api/getUsers";
import authOptions from "@/server/lib/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const role = searchParams.get('role');

    const users = await getUsersServer();

    let response;
    const session = await getServerSession(authOptions);
    
    if (session && (session.user.role === "MANAGER" || session.user.role === "ADMIN")) {
        // Filter users based on params
        const filteredUsers = users.filter((val) => {
            let include = true;
            if (word && !val.name.toLowerCase().includes(word)) include = false;
            if (role && val.role.toLowerCase() !== role) include = false;
            return include;
        });

        response = NextResponse.json(filteredUsers);
    } else {
        response =  new NextResponse('You are not authorized', {
            status: 401,
        });
    }
    

    return response;
}