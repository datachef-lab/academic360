# Real-time Tracker Feature

This feature provides real-time monitoring of subject selection progress across different program courses in the Academic360 system.

## Features

- **Real-time Updates**: Live updates via WebSocket connection when subject selections change
- **MIS Table Data**: Displays program course statistics including admitted students and subject selection completion
- **Filtering**: Filter data by academic session and class
- **Statistics Dashboard**: Visual progress indicators and completion percentages
- **Connection Status**: Real-time connection monitoring with reconnection capabilities

## Components

### Core Components

- **RealTimeTrackerPage**: Main page component that orchestrates all functionality
- **MisStatsCard**: Displays summary statistics with progress indicators
- **MisTable**: Shows detailed program course data in a table format
- **MisFiltersComponent**: Provides session and class filtering options
- **ConnectionStatus**: Shows WebSocket connection status and controls

### Hooks

- **useMisSocket**: Custom hook for managing WebSocket connections and real-time data

### Services

- **MisApiService**: Handles API calls for MIS table data

## API Integration

The feature integrates with the backend API endpoint:

- `GET /subject-selection/metrics/table` - Fetches MIS table data with optional session/class filters

## WebSocket Events

- **subscribe_mis_dashboard**: Subscribe to real-time updates for specific filters
- **unsubscribe_mis_dashboard**: Unsubscribe from updates
- **mis_table_update**: Receive real-time data updates

## Usage

```tsx
import { RealTimeTrackerPage } from "@/features/realtime-tracker";

// Use in your routing
<Route path="/realtime-tracker" element={<RealTimeTrackerPage />} />;
```

## Data Flow

1. Component mounts and establishes WebSocket connection
2. Initial data is fetched via API
3. User can apply filters (session/class)
4. WebSocket subscribes to filtered updates
5. Real-time updates are received and displayed
6. Statistics are calculated and updated automatically

## Configuration

The WebSocket connection is configured using environment variables:

- `VITE_APP_BACKEND_URL`: Backend API URL for WebSocket connection

## Dependencies

- Socket.IO client for WebSocket communication
- React Query for data fetching and caching
- Radix UI components for UI elements
- Lucide React for icons
- Tailwind CSS for styling
