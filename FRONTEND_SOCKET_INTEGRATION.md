# Frontend Integration Guide - Library Sockets

This guide provides code examples for integrating the new socket events into your React/Next.js frontend applications.

---

## Quick Start Example

### Basic Socket Setup (Global)

```typescript
// services/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (userId: string) => {
  socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:8080", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("✓ Socket connected");
    socket?.emit("authenticate", userId);
  });

  socket.on("disconnect", () => {
    console.log("✗ Socket disconnected");
  });

  return socket;
};

export const getSocket = () => socket;
```

---

## Example 1: Racks Page Component

### Subscribe/Unsubscribe Pattern

```typescript
// pages/library/racks.tsx
import React, { useEffect, useState } from 'react';
import { getSocket } from '@/services/socket';

interface Rack {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface RackUpdate {
  id: string;
  type: 'library_rack_update';
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  actorName: string;
  rackId: number;
  rackName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export const RacksPage = () => {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = getSocket();

  // Fetch initial data
  useEffect(() => {
    fetchRacks();
  }, []);

  // Subscribe to socket updates
  useEffect(() => {
    if (!socket) return;

    // Subscribe to rack updates
    socket.emit('subscribe_library_racks');

    // Listen for updates
    socket.on('library_rack_update', handleRackUpdate);

    // Cleanup: Unsubscribe on unmount
    return () => {
      socket.emit('unsubscribe_library_racks');
      socket.off('library_rack_update', handleRackUpdate);
    };
  }, [socket, racks]);

  const fetchRacks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/library/racks?page=1&limit=15');
      const data = await response.json();
      setRacks(data.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch racks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRackUpdate = (update: RackUpdate) => {
    console.log(`📢 Rack update received:`, update.message);

    switch (update.action) {
      case 'CREATED':
        // Add new rack to list
        // (Optional: Refetch instead of manual add)
        fetchRacks();
        showNotification(`${update.actorName} added rack "${update.rackName}"`);
        break;

      case 'UPDATED':
        // Update existing rack
        setRacks(
          racks.map((rack) =>
            rack.id === update.rackId ? { ...rack, name: update.rackName } : rack
          )
        );
        showNotification(`${update.actorName} updated rack "${update.rackName}"`);
        break;

      case 'DELETED':
        // Remove rack from list
        setRacks(racks.filter((rack) => rack.id !== update.rackId));
        showNotification(`${update.actorName} deleted rack "${update.rackName}"`);
        break;
    }
  };

  const showNotification = (message: string) => {
    // Use your toast/notification library
    // toast.info(message);
    console.log('🔔', message);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1>Library Racks</h1>
      <RacksList racks={racks} onRefresh={fetchRacks} />
    </div>
  );
};
```

---

## Example 2: Custom Hook for Socket Subscriptions

### Reusable Hook Pattern

```typescript
// hooks/useLibrarySocket.ts
import { useEffect, useCallback } from "react";
import { getSocket } from "@/services/socket";

export type LibraryEntityType = "racks" | "shelves" | "status" | "articles" | "document_types";

interface LibraryUpdate {
  id: string;
  type: string;
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  [key: string]: unknown;
  message: string;
  updatedAt: string;
}

export const useLibrarySocket = (
  entityType: LibraryEntityType,
  onUpdate: (update: LibraryUpdate) => void,
) => {
  const socket = getSocket();

  const subscribeEventName = `subscribe_library_${entityType}`;
  const unsubscribeEventName = `unsubscribe_library_${entityType}`;
  const updateEventName = `library_${entityType.slice(0, -1)}_update`;

  useEffect(() => {
    if (!socket) return;

    // Subscribe
    socket.emit(subscribeEventName);

    // Listen for updates
    socket.on(updateEventName, onUpdate);

    console.log(`✓ Subscribed to ${entityType} updates`);

    // Cleanup
    return () => {
      socket.emit(unsubscribeEventName);
      socket.off(updateEventName, onUpdate);
      console.log(`✗ Unsubscribed from ${entityType} updates`);
    };
  }, [socket, subscribeEventName, unsubscribeEventName, updateEventName, onUpdate]);
};
```

### Using the Custom Hook

```typescript
// pages/library/shelves.tsx
import { useLibrarySocket } from "@/hooks/useLibrarySocket";

export const ShelvesPage = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);

  // Handle socket updates
  const handleShelfUpdate = useCallback(
    (update) => {
      console.log(`📢 Shelf update: ${update.message}`);

      if (update.action === "CREATED") {
        fetchShelves(); // Refetch to get new data
      } else if (update.action === "UPDATED") {
        setShelves(
          shelves.map((shelf) =>
            shelf.id === update.shelfId ? { ...shelf, name: update.shelfName } : shelf,
          ),
        );
      } else if (update.action === "DELETED") {
        setShelves(shelves.filter((shelf) => shelf.id !== update.shelfId));
      }
    },
    [shelves],
  );

  // Subscribe using hook
  useLibrarySocket("shelves", handleShelfUpdate);

  // ... rest of component
};
```

---

## Example 3: Real-time Form with Notifications

```typescript
// components/RackForm.tsx
import React, { useState } from 'react';
import { getSocket } from '@/services/socket';

export const RackForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const socket = getSocket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/library/racks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to create rack');

      const data = await response.json();
      console.log('✓ Rack created:', data.data);

      // Socket event will be emitted automatically by backend
      // Listen for it to confirm creation
      const handleCreationConfirm = (update: any) => {
        if (update.rackId === data.data.id) {
          console.log('✓ Creation confirmed by socket:', update.message);
          socket?.off('library_rack_update', handleCreationConfirm);
          onSuccess();
        }
      };

      socket?.on('library_rack_update', handleCreationConfirm);

      // Reset form
      setName('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Rack name"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Rack'}
      </button>
    </form>
  );
};
```

---

## Example 4: Multi-Entity Dashboard

```typescript
// pages/library/masters-dashboard.tsx
import React, { useState, useCallback } from 'react';
import { useLibrarySocket } from '@/hooks/useLibrarySocket';

type EntityType = 'racks' | 'shelves' | 'status' | 'articles' | 'document_types';

interface ActivityLog {
  timestamp: string;
  entity: EntityType;
  message: string;
  action: string;
}

export const MastersDashboard = () => {
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  // Subscribe to all library entities
  const handleEntityUpdate = useCallback((entityType: EntityType) => {
    return (update: any) => {
      const logEntry: ActivityLog = {
        timestamp: new Date().toLocaleTimeString(),
        entity: entityType,
        message: update.message,
        action: update.action,
      };

      setActivityLog((prev) => [logEntry, ...prev.slice(0, 49)]);
      console.log(`📢 ${entityType}: ${update.message}`);
    };
  }, []);

  // Subscribe to all entity types
  useLibrarySocket('racks', handleEntityUpdate('racks'));
  useLibrarySocket('shelves', handleEntityUpdate('shelves'));
  useLibrarySocket('status', handleEntityUpdate('status'));
  useLibrarySocket('articles', handleEntityUpdate('articles'));
  useLibrarySocket('document_types', handleEntityUpdate('document_types'));

  return (
    <div className="p-6">
      <h1>Library Masters Activity</h1>

      <div className="mt-4">
        <h2>Recent Activity</h2>
        <div className="space-y-2">
          {activityLog.map((log, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-100 rounded flex justify-between items-center"
            >
              <div>
                <span className="font-semibold text-blue-600">{log.entity}</span>
                <span className="text-gray-600 ml-2">{log.message}</span>
              </div>
              <div className="text-sm text-gray-500">{log.timestamp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## Example 5: With React Query/TanStack Query

```typescript
// hooks/useRacksWithSocket.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLibrarySocket } from './useLibrarySocket';

export const useRacksWithSocket = () => {
  const queryClient = useQueryClient();

  // Fetch initial data
  const query = useQuery({
    queryKey: ['library', 'racks'],
    queryFn: async () => {
      const response = await fetch('/api/library/racks?page=1&limit=15');
      const data = await response.json();
      return data.data;
    },
  });

  // Handle socket updates - invalidate query on changes
  const handleSocketUpdate = (update: any) => {
    if (update.action === 'CREATED' || update.action === 'UPDATED' || update.action === 'DELETED') {
      // Refetch racks when any change is made
      queryClient.invalidateQueries({ queryKey: ['library', 'racks'] });
    }
  };

  useLibrarySocket('racks', handleSocketUpdate);

  return query;
};

// Usage in component
const MyComponent = () => {
  const { data, isLoading, error } = useRacksWithSocket();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data?.map((rack: any) => (
        <li key={rack.id}>{rack.name}</li>
      ))}
    </ul>
  );
};
```

---

## Socket Event Reference

### Subscribe Event Names

```typescript
"subscribe_library_racks";
"subscribe_library_shelves";
"subscribe_library_status";
"subscribe_library_articles";
"subscribe_library_document_types";
```

### Unsubscribe Event Names

```typescript
"unsubscribe_library_racks";
"unsubscribe_library_shelves";
"unsubscribe_library_status";
"unsubscribe_library_articles";
"unsubscribe_library_document_types";
```

### Update Event Names & Rooms

```typescript
// Racks
Event: "library_rack_update";
Room: "library_racks_page";

// Shelves
Event: "library_shelf_update";
Room: "library_shelves_page";

// Status
Event: "library_status_update";
Room: "library_status_page";

// Articles
Event: "library_article_update";
Room: "library_articles_page";

// Document Types
Event: "library_document_type_update";
Room: "library_document_types_page";
```

---

## Update Payload Structure

All updates follow this structure:

```typescript
{
  id: string;                          // Unique event ID
  type: 'library_[entity]_update';     // Event type
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  actorName: string;                   // User who made the change
  [entityId]Id: number;                // Entity ID
  [entityId]Name: string;              // Entity name
  message: string;                     // Human-readable message
  updatedAt: string;                   // ISO timestamp
  meta?: Record<string, unknown>;      // Additional data
}
```

**Example Payloads:**

```typescript
// Rack Created
{
  "id": "library_rack_1715932800000_abc123",
  "type": "library_rack_update",
  "action": "CREATED",
  "actorName": "John Doe",
  "rackId": 123,
  "rackName": "A-01",
  "message": "John Doe added rack \"A-01\"",
  "updatedAt": "2024-05-17T10:00:00.000Z"
}

// Status Updated
{
  "id": "library_status_1715932800000_def456",
  "type": "library_status_update",
  "action": "UPDATED",
  "actorName": "Jane Smith",
  "statusId": 45,
  "statusName": "On Loan",
  "message": "Jane Smith updated status \"On Loan\"",
  "updatedAt": "2024-05-17T10:05:00.000Z"
}

// Article Deleted
{
  "id": "library_article_1715932800000_ghi789",
  "type": "library_article_update",
  "action": "DELETED",
  "actorName": "Admin User",
  "articleId": 78,
  "articleName": "Magazine",
  "message": "Admin User deleted article \"Magazine\"",
  "updatedAt": "2024-05-17T10:10:00.000Z"
}
```

---

## Best Practices

### ✅ DO:

- Subscribe when component mounts
- Unsubscribe when component unmounts
- Handle all three action types (CREATED, UPDATED, DELETED)
- Show user notifications for updates
- Refetch data on create (safest approach)
- Use React Query for caching
- Add loading states
- Implement error boundaries

### ❌ DON'T:

- Keep subscriptions after unmount (causes memory leaks)
- Assume successful API call without socket confirmation
- Manually construct update messages
- Subscribe globally without proper cleanup
- Ignore socket disconnections
- Make synchronous updates without validation

---

## Testing Socket Events

### Local Testing with Socket.io Dev Tools

```bash
# Install socket.io dev tools
npm install -g @socket.io/admin-ui
```

### Test in Browser Console

```javascript
// Get socket instance
const socket = io("http://localhost:8080");

// Authenticate
socket.emit("authenticate", "123");

// Subscribe
socket.emit("subscribe_library_racks");

// Listen for events
socket.on("library_rack_update", (update) => {
  console.log("Update received:", update);
});

// Cleanup
socket.emit("unsubscribe_library_racks");
socket.disconnect();
```

---

## Troubleshooting

### Connection Issues

```typescript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
  console.error("Error code:", error.code);
  // Code: 'CORS_POLICY_VIOLATION' - Check CORS settings in app.ts
  // Code: 'AUTH_ERROR' - Check token/authentication
});
```

### Not Receiving Updates

1. Check if socket is connected: `socket.connected`
2. Verify subscribe event was emitted: `socket.emit('subscribe_library_racks')`
3. Check browser console for errors
4. Verify backend socket service is initialized
5. Check if other clients are subscribed to same room

### Memory Leaks

```typescript
useEffect(() => {
  socket.emit("subscribe_library_racks");

  return () => {
    socket.emit("unsubscribe_library_racks"); // ← Don't forget this!
    socket.off("library_rack_update"); // ← Clean up listeners
  };
}, []);
```
