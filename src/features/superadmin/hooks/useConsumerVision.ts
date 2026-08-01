import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { consumerVisionApi } from "../api/consumer-vision.api";
import type { ConsumerMediaFilters, ConsumerSourcesFilters } from "../api/consumer-vision.types";

/** Cross-user consumer camera source registry (Sentrix Console). */
export function useConsumerSources(filters: ConsumerSourcesFilters) {
  return useQuery({
    queryKey: ["superadmin", "consumer-vision", "sources", filters],
    queryFn: () => consumerVisionApi.sources(filters),
    placeholderData: keepPreviousData,
  });
}

/** Cross-user consumer evidence uploads (Sentrix Console). */
export function useConsumerMedia(filters: ConsumerMediaFilters) {
  return useQuery({
    queryKey: ["superadmin", "consumer-vision", "media", filters],
    queryFn: () => consumerVisionApi.media(filters),
    placeholderData: keepPreviousData,
  });
}
