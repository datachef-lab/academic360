import { useMutation, useQuery } from "@tanstack/react-query";
import {
  searchCandidate as searchCandidateApi,
  distributeAdmitCard as distributeAdmitCardApi,
} from "@/services/admit-card.service";
import type { AdmitCardSearchResponse } from "@/types/exams/admit-card";

export const useSearchCandidate = (searchTerm: string) => {
  return useQuery<AdmitCardSearchResponse>({
    queryKey: ["admit-card-search", searchTerm],
    enabled: false,
    queryFn: () =>
      searchCandidateApi({
        searchTerm,
      }),
  });
};

export const useDistributeAdmitCard = () => {
  return useMutation({
    mutationFn: async (params: { examCandidateId: number }) => {
      const response = await distributeAdmitCardApi({
        examCandidateId: params.examCandidateId,
      });
      return response;
    },
  });
};
