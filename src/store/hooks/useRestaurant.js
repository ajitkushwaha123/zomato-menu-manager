import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/services/auth";

export const RESTAURANT_QUERY_KEY = ["restaurant"];

export default function useRestaurant() {
    const query = useQuery({
        queryKey: RESTAURANT_QUERY_KEY,
        queryFn: AuthService.getAllRestaurant,
        retry: false,
    });

    return {
        restaurants: query.data,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    };
}