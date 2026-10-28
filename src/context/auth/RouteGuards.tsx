import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import Layout from "@/layouts/Layout";

export function ProtectedRoute(){
    const {isAuthenticated, isLoading} = useAuth()
    const location = useLocation();
    if (isLoading) return null;
    if(!isAuthenticated) return <Navigate to="/login" replace state={{from: location}}/>
    return <Layout/>
}

export function GuestRoute(){
    const {isAuthenticated, isLoading} = useAuth()
    if (isLoading) return null;
    if (isAuthenticated) return <Navigate to="/" replace/>
    return <Outlet/>
}