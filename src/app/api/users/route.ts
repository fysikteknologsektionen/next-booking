import { isManager } from "@/lib/helper";
import { getUsersServer } from "@/server/api/getUsers";
import authOptions from "@/server/lib/authOptions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const role = searchParams.get('role');

    const users = await getUsersServer();
    const session = await getServerSession(authOptions);

    if (!isManager(session)) {
        new NextResponse('You are not authorized', {
            status: 401,
        });
    }
    
    // Filter users based on params
    const filteredUsers = users.filter((val) => {
        let include = true;
        if (word && !val.name.toLowerCase().includes(word)) include = false;
        if (role && val.role.toLowerCase() !== role) include = false;
        return include;
    });

    return NextResponse.json(filteredUsers);
}