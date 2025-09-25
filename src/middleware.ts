import { withAuth } from "next-auth/middleware"

// middleware is applied to all routes, use conditionals to select

export default withAuth(
  function middleware (req) {
  },
  {
    callbacks: {
      // Redirect to the login page when the user is not
      // logged in and doesn't have the correct permissions
      
      authorized: ({ req, token }) => {
        const isAdmin = token ? token.role === "ADMIN" : false;
        const isManager = token ? (token.role === "MANAGER" || token.role === "ADMIN") : false;

        if (req.nextUrl.pathname.startsWith('/api/admin')) {
          return isAdmin;
        }
        else if (req.nextUrl.pathname.startsWith('/api/manager')) {
          return isManager;
        }
        else if (req.nextUrl.pathname.startsWith('/api/update')) {
          return isManager;
        }
        else if (req.nextUrl.pathname.startsWith('/api/approve')) {
          return isManager;
        }
        else if (req.nextUrl.pathname.startsWith('/api/deny')) {
          return isManager;
        }
        else if (req.nextUrl.pathname.startsWith('/api/skip')) {
          return isManager;
        }
        else if (req.nextUrl.pathname.startsWith('/api/delete')) {
          return isManager;
        }
        else if (req.nextUrl.pathname.startsWith('/api/create-multiple')) {
          return isManager;
        }
        else if (req.nextUrl.pathname.startsWith('/multi-create')) {
          return isManager;
        }

        return true;
      }
    }
  }
)