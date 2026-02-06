import React from "react";
import { ScrollView, Text, View } from "react-native";
import type { StudentDto } from "@repo/db/dtos/user";

interface SubjectSelectionInstructionsProps {
  compact?: boolean;
  student?: StudentDto;
  visibleCategories?: { minor?: boolean; idc?: boolean; aec?: boolean; cvac?: boolean };
}

export default function SubjectSelectionInstructions({
  compact = false,
  student,
  visibleCategories,
}: SubjectSelectionInstructionsProps) {
  const programCourseName =
    student?.currentPromotion?.programCourse?.name || student?.programCourse?.course?.name || "";

  const normalizedName = programCourseName.toLowerCase().replace(/[.\s]/g, "");
  const isBcomProgram = normalizedName.includes("bcom");

  const content = (
    <View style={{ gap: compact ? 12 : 16 }}>
      {/* Important Warnings */}
      <View
        style={{
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#fde68a",
          backgroundColor: "#fffbeb",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400e", marginBottom: 8 }}>Important Warnings</Text>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, color: "#b45309", lineHeight: 20 }}>
            1. Ensure all required fields are completed before submission.
          </Text>
          <Text style={{ fontSize: 13, color: "#b45309", lineHeight: 20 }}>
            2. Subject selections cannot be changed after final submission.
          </Text>
          {!isBcomProgram && (
            <>
              <Text style={{ fontSize: 13, color: "#b45309", lineHeight: 20 }}>
                3. Verify that IDC subjects are different from Minor subjects.
              </Text>
              <Text style={{ fontSize: 13, color: "#b45309", lineHeight: 20 }}>
                4. Check that no IDC subject is repeated across semesters.
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Minor Subjects */}
      {visibleCategories?.minor && (
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#bfdbfe",
            backgroundColor: "#eff6ff",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#1e40af", marginBottom: 8 }}>
            Minor Subjects (MN)
          </Text>
          {isBcomProgram ? (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e40af" }}>For B.Com (H & G) Students:</Text>
              <Text style={{ fontSize: 13, color: "#1d4ed8", lineHeight: 20 }}>
                • Choose one Minor subject from Semester III through Semester VI: E-Business or Marketing.
              </Text>
              <Text style={{ fontSize: 13, color: "#1d4ed8", lineHeight: 20 }}>
                • The corresponding papers for Semester III are Fundamentals of Information System (E-Business) and
                Consumer Behaviour (Marketing).
              </Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1e40af" }}>For B.A. & B.Sc. Students:</Text>
              <Text style={{ fontSize: 13, color: "#1d4ed8", lineHeight: 20 }}>
                • Choose two distinct Minor subjects - Minor I (Studied in Semesters I & II) & Minor II (Studied in
                Semesters III & IV).
              </Text>
              <Text style={{ fontSize: 13, color: "#1d4ed8", lineHeight: 20 }}>
                • You will choose either Minor I or Minor II for Semesters V & VI respectively.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* IDC Subjects */}
      {visibleCategories?.idc && (
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#bbf7d0",
            backgroundColor: "#f0fdf4",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#166534", marginBottom: 8 }}>
            Interdisciplinary Course (IDC) Subjects
          </Text>
          {isBcomProgram ? (
            <Text style={{ fontSize: 13, fontStyle: "italic", color: "#15803d" }}>
              IDC subjects are not applicable for B.Com students.
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>For B.A. & B.Sc. Students:</Text>
              <Text style={{ fontSize: 13, color: "#15803d", lineHeight: 20 }}>
                • You must select a different IDC subject for each of the three semesters (I, II, & III).
              </Text>
              <Text style={{ fontSize: 13, color: "#15803d", lineHeight: 20 }}>
                • The three IDC subjects chosen cannot be the same as your Major or Minor subjects.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* AEC Subjects */}
      {visibleCategories?.aec && (
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#e9d5ff",
            backgroundColor: "#faf5ff",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#6b21a8", marginBottom: 8 }}>
            Ability Enhancement Compulsory Course (AEC)
          </Text>
          {isBcomProgram ? (
            <Text style={{ fontSize: 13, fontStyle: "italic", color: "#7c3aed" }}>
              AEC subjects are not applicable for B.Com students.
            </Text>
          ) : (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#6b21a8" }}>For B.A. & B.Sc. (Hons.):</Text>
              <Text style={{ fontSize: 13, color: "#7c3aed", lineHeight: 20 }}>
                • You'll study Compulsory English in Semesters I & II named as AEC 1 and AEC 2 respectively.
              </Text>
              <Text style={{ fontSize: 13, color: "#7c3aed", lineHeight: 20 }}>
                • For Semesters III & IV, you must choose one subject to study across both semesters.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* CVAC Subjects */}
      {visibleCategories?.cvac && (
        <View
          style={{
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#fed7aa",
            backgroundColor: "#fff7ed",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#9a3412", marginBottom: 8 }}>
            Common Value-Added Course (CVAC)
          </Text>
          <View style={{ gap: 8 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#9a3412", marginBottom: 4 }}>Semester I</Text>
              <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 20, marginLeft: 8 }}>
                B.Com/ B.A./B.Sc. students are required to study:
              </Text>
              <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 20, marginLeft: 16 }}>
                • Environmental Studies (ENVS)
              </Text>
              <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 20, marginLeft: 16 }}>
                • Constitutional Values
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#9a3412", marginBottom: 4 }}>Semester II</Text>
              <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 20, marginLeft: 8 }}>
                B.Com/ B.A./B.Sc. students will continue to study Environmental Studies (ENVS).
              </Text>
              <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 20, marginLeft: 8, marginTop: 4 }}>
                Additionally,
              </Text>
              <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 20, marginLeft: 16 }}>
                • B.A. students must also study Value-Oriented Life Skill Education.
              </Text>
              <Text style={{ fontSize: 13, color: "#c2410c", lineHeight: 20, marginLeft: 16 }}>
                • B.Sc. students must also choose one subject from two available CVAC options.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (compact) {
    return content;
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          padding: 8,
          borderBottomWidth: 1,
          borderBottomColor: "#f3f4f6",
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: "#fbbf24",
              justifyContent: "center",
              alignItems: "center",
            }}
          />
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>Important Notes & Guide</Text>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Essential information for subject selection</Text>
          </View>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView>
    </View>
  );
}
