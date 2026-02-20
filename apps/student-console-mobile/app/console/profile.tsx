import type { StudentDto } from "@repo/db/dtos/user";
import { useTheme } from "@/hooks/use-theme";
import { useProfile } from "@/hooks/use-profile";
import { getStudentImageUrl } from "@/lib/student-image";
import { useAuth } from "@/providers/auth-provider";
import { User } from "lucide-react-native";
import React, { useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TextInput, View } from "react-native";

function formatDate(date: Date | string | null | undefined) {
  if (date == null || date === "") return "Not Available";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ProfileField({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: { text: string; border: string };
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-1" style={{ color: theme.text, opacity: 0.8 }}>
        {label}
      </Text>
      <TextInput
        value={value || "Not Available"}
        editable={false}
        className="px-3 py-2.5 rounded-lg border text-base"
        style={{
          color: theme.text,
          borderColor: theme.border,
          backgroundColor: "transparent",
        }}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { theme, colorScheme } = useTheme();
  const { user } = useAuth();
  const { profileInfo, loading, error } = useProfile();
  const [imageError, setImageError] = useState(false);

  const student = user?.payload as StudentDto | undefined;
  const uid = student?.uid;
  const personalDetails = profileInfo?.personalDetails;
  const familyDetails = profileInfo?.familyDetails;
  const healthDetails = profileInfo?.healthDetails;

  const father = familyDetails?.members?.find((m) => m.type === "FATHER");
  const mother = familyDetails?.members?.find((m) => m.type === "MOTHER");

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={colorScheme === "dark" ? "#a5b4fc" : "#4f46e5"} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 p-6 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <Text style={{ color: "#ef4444", fontSize: 16, fontWeight: "600" }}>Error loading profile</Text>
        <Text style={{ color: theme.text, opacity: 0.7, marginTop: 8 }}>{error}</Text>
      </View>
    );
  }

  if (!profileInfo) {
    return (
      <View className="flex-1 p-6 items-center justify-center" style={{ backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontSize: 16 }}>Profile data not found</Text>
      </View>
    );
  }

  const imageUrl = getStudentImageUrl(uid);
  const showImage = imageUrl && !imageError;

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="mb-6">
        <Text style={{ color: theme.text }} className="text-2xl font-bold">
          Profile
        </Text>
        <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm mt-1">
          Manage your personal information and academic details
        </Text>
      </View>

      {/* Profile Summary Card */}
      <View
        className="rounded-xl p-6 mb-6"
        style={{
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <View className="items-center">
          <View className="relative mb-4">
            <View
              className="w-24 h-24 rounded-full overflow-hidden items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: theme.border,
              }}
            >
              {showImage ? (
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 32,
                    fontWeight: "700",
                  }}
                >
                  {(user?.name?.charAt(0) || "S").toUpperCase()}
                </Text>
              )}
            </View>
            <View className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#10b981" }}>
              <Text className="text-white text-xs font-semibold">Student</Text>
            </View>
          </View>
          <Text style={{ color: theme.text }} className="text-xl font-bold mb-1">
            {user?.name || "Not Available"}
          </Text>
          <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm mb-4">
            UID: {uid || "N/A"}
          </Text>

          <View className="w-full py-3 mb-4" style={{ borderTopWidth: 1, borderTopColor: theme.border }} />

          <View className="w-full gap-3">
            <View className="flex-row justify-between items-center">
              <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm">
                College Roll Number
              </Text>
              <Text style={{ color: theme.text }} className="font-semibold">
                {student?.classRollNumber || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm">
                Program Course
              </Text>
              <Text style={{ color: theme.text }} className="font-semibold text-right text-xs flex-1 ml-2">
                {student?.currentPromotion?.programCourse?.name || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm">
                Calcutta University Registration number
              </Text>
              <Text style={{ color: theme.text }} className="font-semibold">
                {student?.registrationNumber || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text style={{ color: theme.text, opacity: 0.7 }} className="text-sm">
                Calcutta University Roll Number
              </Text>
              <Text style={{ color: theme.text }} className="font-semibold">
                {student?.rollNumber || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Personal Information */}
      <View
        className="rounded-xl p-6"
        style={{
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <View className="flex-row items-center gap-2 mb-6">
          <User size={20} color={colorScheme === "dark" ? "#a5b4fc" : "#4f46e5"} />
          <Text style={{ color: theme.text }} className="text-lg font-semibold">
            Personal Information
          </Text>
        </View>

        <View>
          <ProfileField
            label="Application Number"
            value={profileInfo.admissionCourseDetailsDto?.appNumber || ""}
            theme={theme}
          />
          <ProfileField label="Full Name" value={user?.name || ""} theme={theme} />
          <ProfileField label="Date of Birth" value={formatDate(personalDetails?.dateOfBirth)} theme={theme} />
          <ProfileField label="Gender" value={personalDetails?.gender || ""} theme={theme} />
          <ProfileField label="Nationality" value={personalDetails?.nationality?.name || ""} theme={theme} />
          <ProfileField label="Religion" value={personalDetails?.religion?.name || ""} theme={theme} />
          <ProfileField label="Category" value={personalDetails?.category?.name || ""} theme={theme} />
          <ProfileField label="Blood Group" value={healthDetails?.bloodGroup?.type || ""} theme={theme} />
          <ProfileField label="Aadhaar Card Number" value={personalDetails?.aadhaarCardNumber || ""} theme={theme} />
          <ProfileField label="Mobile Number" value={personalDetails?.mobileNumber || ""} theme={theme} />
          <ProfileField label="WhatsApp Number" value={personalDetails?.whatsappNumber || ""} theme={theme} />
          <ProfileField label="Father's Name" value={father?.name || ""} theme={theme} />
          <ProfileField label="Mother's Name" value={mother?.name || ""} theme={theme} />
          <ProfileField label="Personal Email ID" value={student?.personalEmail || ""} theme={theme} />
          <ProfileField label="Institutional Email ID" value={user?.email || ""} theme={theme} />
        </View>
      </View>
    </ScrollView>
  );
}
