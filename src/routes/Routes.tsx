import { LoginForm } from "@/pages/login-form";
import { SignupForm } from "@/pages/signup-form";
import { GuestRoute, ProtectedRoute } from "@/context/auth/RouteGuards";
import Layout from "@/layouts/Layout";
import PaymentRules from "@/pages/admin/paymentRules";
import PaymentPage from "@/pages/user";
import Payment from "@/pages/user/payment";

const appRoutes = [
    {
        id: "root",
        path: "/",
        element: <ProtectedRoute/>,
        children: [
            {index: true, element: <Payment/>},
            {path: "rules", element: <PaymentRules/>},
            {path: "payments", element: <Payment/>},
        ]
    },
    {
        // id: "root",
        element: <GuestRoute/>,
        children: [
            {path: "sign-up", element: <SignupForm/>},
            {path: "login", element: <LoginForm/>},
        ]
    },
]

export default appRoutes