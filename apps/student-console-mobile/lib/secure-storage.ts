import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const REFRESH_TOKEN_KEY = "student_refresh_token";

/**
 * Get refresh token from storage.
 * Uses AsyncStorage on all platforms for reliability - SecureStore can fail
 * on some native devices/simulators and prevent refresh from being initiated.
 */
export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function deleteRefreshToken(): Promise<void> {
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}
