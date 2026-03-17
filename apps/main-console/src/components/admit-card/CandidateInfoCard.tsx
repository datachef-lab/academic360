import React from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import type { AdmitCardCandidate } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  candidate: AdmitCardCandidate;
  alreadyDistributed: boolean;
  isUserInactive: boolean;
  collectionDate: string | null;
  distributedByName: string | null;
  distributedByUserImage: string | null;
  venueOfExamination: string | null;
  roomName: string | null;
  seatNumber: string | null;
  isDownloadingOrDistributing?: boolean;
  onDownload: () => void;
}

export const CandidateInfoCard: React.FC<Props> = ({
  candidate,
  alreadyDistributed,
  isUserInactive,
  collectionDate,
  distributedByName,
  distributedByUserImage,
  roomName,
  seatNumber,
  isDownloadingOrDistributing,
  onDownload,
}) => {
  const isDisabled = alreadyDistributed || isUserInactive || isDownloadingOrDistributing;

  const formatCollectionDate = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Student Avatar */}
            <Avatar className="w-16 h-16 border-2 border-purple-300 shadow-md">
              <AvatarImage
                src={`${import.meta.env.VITE_STUDENT_PROFILE_URL}/Student_Image_${candidate.uid}.jpg`}
                alt={candidate.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white font-bold text-lg">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Name, Appear Type and Exam */}
            <div>
              <CardTitle className="flex items-center flex-wrap gap-2">
                <span className="text-2xl font-bold text-slate-900">{candidate.name}</span>
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                  🎓 APPEAR TYPE | <span className="font-bold">REGULAR 🎓</span>
                </Badge>
              </CardTitle>
              {candidate.examName && (
                <p className="text-sm text-slate-600 mt-1">{candidate.examName}</p>
              )}
              {(roomName || seatNumber) && (
                <p className="text-xs text-slate-600 mt-1 font-bold">
                  <span className="text-slate-700 font-bold">Venue of Examination</span>{" "}
                  <span className="text-slate-600 font-bold">:-</span>{" "}
                  <span className="text-slate-700">
                    Room Number: {roomName || "—"} <span className="text-slate-400">&bull;</span>{" "}
                    Seat Number: {seatNumber || "—"}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {alreadyDistributed ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Distributed
            </Badge>
          ) : isUserInactive ? (
            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              Inactive User
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Candidate Details - Single row, horizontal scroll on small screens */}
        <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 mb-8 scrollbar-thin">
          {/* 1. Name
          <div className="flex-shrink-0 min-w-[140px] border-l-4 border-l-purple-500 bg-purple-50 p-4 rounded-r-lg">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Name</p>
            <p className="text-base font-bold text-slate-900 truncate" title={candidate.name}>{candidate.name}</p>
          </div> */}

          {/* 2. UID */}
          {candidate.uid && (
            <div className="flex-shrink-0 min-w-[120px] border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded-r-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                UID
              </p>
              <p className="text-base font-mono font-bold text-slate-900">{candidate.uid}</p>
            </div>
          )}

          {/* 3. Roll Number */}
          {candidate.rollNumber && (
            <div className="flex-shrink-0 min-w-[120px] border-l-4 border-l-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Roll Number
              </p>
              <p className="text-base font-bold text-slate-900">{candidate.rollNumber}</p>
            </div>
          )}

          {/* 4. RFID Number
              {candidate.rfid && (
            <div className="flex-shrink-0 min-w-[120px] border-l-4 border-l-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">RFID Number</p>
              <p className="text-base font-bold text-slate-900">{candidate.rfid}</p>
            </div>
          )} */}

          {/* 4. Registration Number */}
          <div className="flex-shrink-0 min-w-[120px] border-l-4 border-l-cyan-500 bg-cyan-50 p-4 rounded-r-lg">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Registration No
            </p>
            <p className="text-base font-mono font-bold text-slate-900">
              {candidate.registrationNumber ?? "N/A"}
            </p>
          </div>

          {/* 5. Program */}
          {candidate.programCourse && (
            <div className="flex-shrink-0 min-w-[120px] border-l-4 border-l-emerald-500 bg-emerald-50 p-4 rounded-r-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Program
              </p>
              <p
                className="text-base font-bold text-slate-900 truncate"
                title={candidate.programCourse}
              >
                {candidate.programCourse}
              </p>
            </div>
          )}

          {/* 6. Semester */}
          {candidate.semester && (
            <div className="flex-shrink-0 min-w-[120px] border-l-4 border-l-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Semester
              </p>
              <p className="text-base font-bold text-slate-900">{candidate.semester}</p>
            </div>
          )}

          {/* 7. Shift */}
          {candidate.shift && (
            <div className="flex-shrink-0 min-w-[120px] border-l-4 border-l-orange-500 bg-orange-50 p-4 rounded-r-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Shift
              </p>
              <p className="text-base font-bold text-slate-900">{candidate.shift}</p>
            </div>
          )}

          {/* 7. Exam
          {candidate.examName && (
            <div className="flex-shrink-0 min-w-[180px] border-l-4 border-l-violet-500 bg-violet-50 p-4 rounded-r-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Exam</p>
              <p className="text-base font-bold text-slate-900 truncate" title={candidate.examName}>{candidate.examName}</p>
            </div>
          )} */}
        </div>

        {/* Collection Date & Downloaded by */}
        {(collectionDate || distributedByName) && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-4">
            {distributedByUserImage != null || distributedByName ? (
              <Avatar className="h-10 w-10 border-2 border-amber-300 flex-shrink-0">
                <AvatarImage
                  src={distributedByUserImage ?? undefined}
                  alt={distributedByName ?? "User"}
                />
                <AvatarFallback className="bg-amber-200 text-amber-900 text-sm font-semibold">
                  {distributedByName
                    ? distributedByName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "—"}
                </AvatarFallback>
              </Avatar>
            ) : null}
            <div className="flex-1 min-w-0">
              {collectionDate && (
                <>
                  <p className="text-sm font-semibold text-amber-900">Date of Collection</p>
                  <p className="text-base font-medium text-amber-900 mt-1">
                    {formatCollectionDate(collectionDate)}
                  </p>
                </>
              )}
              {distributedByName && (
                <p className="text-sm text-amber-900 mt-2">
                  Admit Card Saved By : <span className="font-semibold">{distributedByName}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Inactive User Message */}
        {isUserInactive && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">User Inactive</p>
              <p className="text-sm text-red-800 mt-1">
                This student user is inactive. Admit card cannot be distributed.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          <Button onClick={onDownload} disabled={isDisabled} size="lg" className="px-8">
            {alreadyDistributed ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Admit card status saved
              </>
            ) : isDownloadingOrDistributing ? (
              <>
                <div className="animate-spin mr-2">
                  <svg
                    className="w-4 h-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                Processing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
