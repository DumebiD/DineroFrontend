import { createBrowserRouter, RouterProvider } from "react-router-dom"
import appRoutes from "./routes/Routes"

const router = createBrowserRouter(appRoutes)

export function App() {
  return (
    <RouterProvider router={router}/>
  )
}

export default App
