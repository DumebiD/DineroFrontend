import { createBrowserRouter, RouterProvider } from "react-router-dom"
import appRoutes from "./routes/Routes"
import { Toaster } from "./components/ui/toast"
import AuthProvider from "./context/auth/AuthProvider"

const router = createBrowserRouter(appRoutes)

export function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </>
  )
}

export default App
