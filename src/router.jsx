import { createBrowserRouter } from "react-router";
import { Login } from "./Login.jsx";
import  App from "./App.jsx";

export const router = createBrowserRouter([
    {path: "/Login", component: <Login />},
    {path: "/App", component: <App />},
]);
