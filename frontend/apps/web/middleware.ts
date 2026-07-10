import NextAuth from "next-auth";

import { type Session } from "@feature/auth"
import { auth } from "@feature/auth/server";


export default auth((req, res) => {
    const role = (req.auth as Session)?.user?.role;

    
})

export const config = { 
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] 
}