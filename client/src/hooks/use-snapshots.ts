import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { SnapshotResponse } from "@shared/schema";

export function useSnapshot(chain: string) {
  return useQuery({
    queryKey: [api.snapshots.getLatest.path, chain],
    queryFn: async () => {
      const url = buildUrl(api.snapshots.getLatest.path, { chain });
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`No data available for ${chain}`);
        }
        throw new Error('Failed to fetch snapshot data');
      }
      
      const data = await res.json();
      // Using the Zod schema from the API definition to parse/validate would be ideal here
      // api.snapshots.getLatest.responses[200].parse(data);
      return data as SnapshotResponse;
    },
    // Auto-refresh every 10 seconds as per requirements
    refetchInterval: 10000, 
    // Keep data fresh for 5 seconds to prevent immediate refetch on mount if recently fetched
    staleTime: 5000,
  });
}
