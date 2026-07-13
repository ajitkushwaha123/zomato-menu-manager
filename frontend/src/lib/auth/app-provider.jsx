import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AuthProvider({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    useEffect(() => {
        const cookie = localStorage.getItem("zomato_cookie");
        if (!cookie && pathname !== "/login") {
            router.replace("/login");
        }
        if (cookie && pathname === "/login") {
            router.replace("/");
        }
    }, [pathname, router]);

    return children;
}