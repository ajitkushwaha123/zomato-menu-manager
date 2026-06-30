import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/services/auth";

export const USER_QUERY_KEY = ["user"];

export default function useUser() {
    const query = useQuery({
        queryKey: USER_QUERY_KEY,
        queryFn: AuthService.getProfile,
        retry: false,
    });

    return {
        user: query.data,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}