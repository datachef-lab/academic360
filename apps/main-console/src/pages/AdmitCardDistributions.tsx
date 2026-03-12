import React, { useState } from "react";
import { Search, Loader2, List } from "lucide-react";
import { CandidateInfoCard } from "@/components/admit-card/CandidateInfoCard";
import { useToast } from "@/hooks/useToast";
import { useSearchCandidate, useDistributeAdmitCard } from "@/hooks/useAdmitCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadAdmitCardDistributionsCsv } from "@/services/admit-card.service";

const AdmitCardDistributions: React.FC = () => {
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [isDownloadingList, setIsDownloadingList] = useState(false);

  const {
    data: candidateData,
    error: searchError,
    isFetching: isSearching,
    refetch: refetchCandidate,
  } = useSearchCandidate(searchTerm);

  const distributeMutation = useDistributeAdmitCard();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({ title: "Error", description: "Please enter a search term" });
      return;
    }
    setSearchTriggered(true);
    try {
      await refetchCandidate();
    } catch (err: any) {
      if (err?.message === "NO_CANDIDATE") {
        // handled in UI
        return;
      }
      toast({ title: "Error", description: "Failed to search candidate" });
    }
  };

  const handleDownloadAndDistribute = async () => {
    if (!candidateData) return;
    const { candidate, alreadyDistributed, isUserInactive } = candidateData;
    if (alreadyDistributed || isUserInactive) return;

    try {
      await distributeMutation.mutateAsync({
        examCandidateId: candidate.id,
      });
      await refetchCandidate();
      toast({ title: "Success", description: "Admit card distributed successfully" });
    } catch (err: any) {
      const message = err?.message || "Failed to download or distribute admit card";
      toast({ title: "Error", description: message });
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setIsDownloadingList(true);
      const blob = await downloadAdmitCardDistributionsCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "admit-card-distributions.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const message = err?.message || "Failed to download admit card distributions";
      toast({ title: "Error", description: message });
    } finally {
      setIsDownloadingList(false);
    }
  };

  const renderResult = () => {
    if (!searchTriggered) return null;

    if (searchError && (searchError as any).message === "NO_CANDIDATE") {
      return (
        <Card className="mt-10 border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-l-8 border-l-amber-500">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-amber-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4v2m0 4v2M7.5 7.5a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-900">No Candidate Found</p>
                <p className="text-amber-800 mt-2">
                  No candidate matches your search criteria. Please verify the exam group or search
                  term and try again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!candidateData) return null;

    return (
      <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <CandidateInfoCard
          candidate={candidateData.candidate}
          alreadyDistributed={candidateData.alreadyDistributed}
          isUserInactive={candidateData.isUserInactive}
          collectionDate={candidateData.collectionDate}
          distributedByName={candidateData.distributedByName}
          distributedByUserImage={candidateData.distributedByUserImage ?? null}
          venueOfExamination={candidateData.venueOfExamination ?? null}
          roomName={candidateData.roomName ?? null}
          seatNumber={candidateData.seatNumber ?? null}
          onDownload={handleDownloadAndDistribute}
          isDownloadingOrDistributing={isSearching || distributeMutation.isLoading}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Header Section - title, subtitle, and download action */}
        <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admit Card Distributions
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Search students and save admit card distribution status
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadCsv}
            disabled={isDownloadingList}
            className="w-full sm:w-auto flex items-center justify-center"
          >
            {isDownloadingList ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <List className="w-4 h-4 mr-2" />
                Download Collection Report
              </>
            )}
          </Button>
        </div>

        {/* Search Card - match layout and spacing */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Search Candidate
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1">
              Enter Roll Number, Registration Number, RFID Number, or UID
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <Label htmlFor="search-term" className="text-sm sm:text-base">
                  Identifier
                </Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="search-term"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Search By Roll Number, Registration Number, RFID Number, or UID..."
                    disabled={isSearching}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchTerm.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Searching...</span>
                      <span className="sm:hidden">Searching</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {renderResult()}
      </div>
    </div>
  );
};

export default AdmitCardDistributions;
