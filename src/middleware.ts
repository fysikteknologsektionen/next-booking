import { withAuth } from "next-auth/middleware"

// middleware is applied to all routes, use conditionals to select

export default withAuth(
  function middleware (req) {
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/api/admin')) {
            return token ? token.role === "ADMIN" : false;
        } else if (req.nextUrl.pathname.startsWith('/api/manager')) {
            return token ? (token.role === "MANAGER" || token.role === "ADMIN") : false;
        } else if (req.nextUrl.pathname.startsWith('/update-reservation')) {
            return token ? (token.role === "MANAGER" || token.role === "ADMIN") : false;
        }
        return true;
      }
    }
  }
)