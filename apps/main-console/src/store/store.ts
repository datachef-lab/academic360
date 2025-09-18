import { configureStore } from "@reduxjs/toolkit";
import academicYearReducer from "./slices/academicYearSlice";

// Configure the Redux store
export const store = configureStore({
  reducer: {
    academicYear: academicYearReducer,
    // Add other reducers here as needed
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== "production",
  // Add middleware if needed
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializable check
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
