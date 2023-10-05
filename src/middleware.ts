import { withAuth } from "next-auth/middleware"

// middleware is applied to all routes, use conditionals to select

export default withAuth(
  function middleware (req) {
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/api/admin')) {
            if (token && token.role === "ADMIN") {
                return true;
            } else {
                return false;
            }
        } else if (req.nextUrl.pathname.startsWith('/api/manager')) {
            if (token && (token.role === "MANAGER" || token.role === "ADMIN")) {
                return true;
            } else {
                return false;
            }
        } else if (req.nextUrl.pathname.startsWith('/auth-test/manager-page')) {
            if (token && (token.role === "MANAGER" || token.role === "ADMIN")) {
                return true;
            } else {
                return false;
            }
        }
        return true;
      }
    }
  }
)