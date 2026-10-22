import Layout from "@/layouts/Layout";
import PaymentRules from "@/pages/admin/paymentRules";
import PaymentPage from "@/pages/user";

const appRoutes = [
    {
        id: "root",
        path: "/",
        element: <Layout/>,
        children: [
            {index: true, element: <PaymentPage/>},
            {path: "rules", element: <PaymentRules/>}
        ]
    }
]

export default appRoutes