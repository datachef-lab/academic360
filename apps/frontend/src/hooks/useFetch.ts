import { useEffect, useState } from "react";

type UseFetchProps<T> = {
    getFn: () => Promise<T | null>;      // fetch existing data, null if not found
    postFn: (data: T) => Promise<T>;     // create new data using default
    default: T;                          // default data to send on POST
};

export const useFetch = <T>({ getFn, postFn, default: defaultData }: UseFetchProps<T>) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            let result = await getFn();

            if (result === null || result === undefined) {
                result = await postFn(defaultData);
            }

            setData(result);
        } catch (err: unknown) {
            // optional: check if error status is 404 and post then
            setError(err as Error)
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { data, loading, error, refetch: fetchData };
};
