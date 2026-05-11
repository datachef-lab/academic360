# Socket Implementation Analysis - Library Management Masters

## Current State Analysis

### Socket.IO Setup

- **Location**: `apps/backend/src/app.ts`
- **Service**: `apps/backend/src/services/socketService.ts`
- **Status**: ✅ Already configured and operational
- **CORS Origins**: Main console (5173), Student console (3000, 3008), Staging/Production domains

### Existing Socket Implementations for Library Module

Already implemented sockets for:

1. ✅ **Library Entry/Exit** - `sendLibraryEntryExitUpdate()`
2. ✅ **Library Journals** - `sendLibraryJournalUpdate()`
3. ✅ **Library Copy Details** - `sendLibraryCopyDetailsUpdate()`
4. ✅ **Library Books** - `sendLibraryBookUpdate()`
5. ✅ **Library Book Circulation** - `sendLibraryBookCirculationUpdate()`

### Missing Socket Implementations (To Be Added)

Need to implement sockets for the following lib management masters:

1. ❌ **Racks** - Currently NO socket support
2. ❌ **Shelves** - Currently NO socket support
3. ❌ **Status** - Currently NO socket support
4. ❌ **Articles** - Currently NO socket support
5. ❌ **Document Type** - Currently NO socket support

---

## Architecture Overview

### Socket Service Pattern (socketService.ts)

#### 1. **Interface Definition**

For each entity, a TypeScript interface defines the update payload:

```typescript
export interface LibraryJournalUpdate {
  id: string;
  type: "library_journal_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  journalId: number;
  journalTitle: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}
```

#### 2. **Subscribe/Unsubscribe Event Listeners**

Defined in `setupListeners()` method:

```typescript
socket.on("subscribe_library_journal", () => {
  socket.join("library_journal_page");
});

socket.on("unsubscribe_library_journal", () => {
  socket.leave("library_journal_page");
});
```

#### 3. **Update Emission Methods**

Send updates to subscribed clients:

```typescript
sendLibraryJournalUpdate(payload: {...}) {
  const update: LibraryJournalUpdate = { ... };
  this.io.to("library_journal_page").emit("library_journal_update", update);
}
```

### Controller Pattern

Controllers emit socket events after successful operations:

```typescript
// Create
const id = await createJournal(input);
socketService.sendLibraryJournalUpdate({
  action: "CREATED",
  actorName: journalActorName(req),
  journalId: id,
  journalTitle: input.title.trim(),
  meta: { journalId: id },
});

// Update
await updateJournal(id, input);
socketService.sendLibraryJournalUpdate({
  action: "UPDATED",
  actorName: journalActorName(req),
  journalId: id,
  journalTitle: input.title.trim(),
});

// Delete
await deleteJournal(id);
socketService.sendLibraryJournalUpdate({
  action: "DELETED",
  actorName: journalActorName(req),
  journalId: id,
  journalTitle: title,
});
```

---

## Implementation Plan

### Phase 1: Socket Service Updates (socketService.ts)

#### Add 5 New Interfaces:

1. **LibraryRackUpdate** - For rack CRUD operations
2. **LibraryShelfUpdate** - For shelf CRUD operations
3. **LibraryStatusUpdate** - For status CRUD operations
4. **LibraryArticleUpdate** - For article CRUD operations
5. **LibraryDocumentTypeUpdate** - For document type CRUD operations

#### Add Subscribe/Unsubscribe Listeners:

For each entity (5 pairs):

- `subscribe_library_racks` / `unsubscribe_library_racks`
- `subscribe_library_shelves` / `unsubscribe_library_shelves`
- `subscribe_library_status` / `unsubscribe_library_status`
- `subscribe_library_articles` / `unsubscribe_library_articles`
- `subscribe_library_document_types` / `unsubscribe_library_document_types`

#### Add 5 Emit Methods:

- `sendLibraryRackUpdate()`
- `sendLibraryShelfUpdate()`
- `sendLibraryStatusUpdate()`
- `sendLibraryArticleUpdate()`
- `sendLibraryDocumentTypeUpdate()`

### Phase 2: Controller Updates

Update controllers to emit socket events on CRUD operations:

1. **[rack.controller.ts](apps/backend/src/features/library/controllers/rack.controller.ts)**
   - Import: `import { socketService } from "@/services/socketService.js";`
   - Add helper: `const rackActorName = (req: Request): string => { ... }`
   - Update: createRackController, updateRackController, deleteRackController

2. **[shelf.controller.ts](apps/backend/src/features/library/controllers/shelf.controller.ts)**
   - Import: `import { socketService } from "@/services/socketService.js";`
   - Add helper: `const shelfActorName = (req: Request): string => { ... }`
   - Update: createShelfController, updateShelfController, deleteShelfController

3. **[status.controller.ts](apps/backend/src/features/library/controllers/status.controller.ts)**
   - Import: `import { socketService } from "@/services/socketService.js";`
   - Add helper: `const statusActorName = (req: Request): string => { ... }`
   - Update: createStatusController, updateStatusController, deleteStatusController

4. **[library-article.controller.ts](apps/backend/src/features/library/controllers/library-article.controller.ts)**
   - Import: `import { socketService } from "@/services/socketService.js";`
   - Add helper: `const articleActorName = (req: Request): string => { ... }`
   - Update: createLibraryArticleController, updateLibraryArticleController, deleteLibraryArticleController

5. **[library-document-type.controller.ts](apps/backend/src/features/library/controllers/library-document-type.controller.ts)**
   - Import: `import { socketService } from "@/services/socketService.js";`
   - Add helper: `const documentTypeActorName = (req: Request): string => { ... }`
   - Update: createLibraryDocumentTypeController, updateLibraryDocumentTypeController, deleteLibraryDocumentTypeController

---

## Room Names (Page Subscriptions)

Socket rooms follow the pattern: `library_{entity}_page`

| Entity         | Room Name                     | Event Name                     |
| -------------- | ----------------------------- | ------------------------------ |
| Journals       | `library_journal_page`        | `library_journal_update`       |
| Books          | `library_books_page`          | `library_book_update`          |
| Racks          | `library_racks_page`          | `library_rack_update`          |
| Shelves        | `library_shelves_page`        | `library_shelf_update`         |
| Status         | `library_status_page`         | `library_status_update`        |
| Articles       | `library_articles_page`       | `library_article_update`       |
| Document Types | `library_document_types_page` | `library_document_type_update` |

---

## Frontend Integration Points

Once backend is implemented, frontends need to:

1. **Subscribe to updates** on page mount:

   ```typescript
   useEffect(() => {
     socket.emit("subscribe_library_racks");
     return () => socket.emit("unsubscribe_library_racks");
   }, []);
   ```

2. **Listen for events**:

   ```typescript
   socket.on("library_rack_update", (update) => {
     console.log(update.action, update.rackId, update.message);
     // Refetch data or update UI
   });
   ```

3. **Handle all action types**: CREATED, UPDATED, DELETED

---

## Entity-Specific Details

### Racks

- **Fields**: id, name, createdAt, updatedAt
- **Actions**: CREATED, UPDATED, DELETED
- **Examples**: "John added rack 'A-01'", "Jane updated rack 'B-02'", "Admin deleted rack 'C-03'"

### Shelves

- **Fields**: id, name, createdAt, updatedAt
- **Actions**: CREATED, UPDATED, DELETED
- **Examples**: "John added shelf 'Top'", "Jane updated shelf 'Bottom'"

### Status

- **Fields**: id, name, isIssuable, issuedTo, createdAt, updatedAt
- **Actions**: CREATED, UPDATED, DELETED
- **Examples**: "John added status 'Available'", "Jane updated status 'On Loan'"

### Articles

- **Fields**: id, name, code, various boolean flags (isDocumentTypeExist, isUniqueAccessNumber, isJournal, etc.)
- **Actions**: CREATED, UPDATED, DELETED
- **Examples**: "John added article 'Book'", "Jane updated article 'Journal'"

### Document Type

- **Fields**: id, name, createdAt, updatedAt
- **Actions**: CREATED, UPDATED, DELETED
- **Examples**: "John added document type 'Textbook'", "Jane updated document type 'Reference'"

---

## Benefits

1. **Real-time Updates**: All connected clients see changes immediately
2. **Multi-user Awareness**: Users know when someone else is modifying data
3. **Consistent UI**: Prevents data inconsistencies in concurrent scenarios
4. **Better UX**: No need for manual refresh or polling
5. **Scalable Pattern**: Same pattern can be applied to other modules

---

## Files to Modify

### Backend

- ✏️ `apps/backend/src/services/socketService.ts` - Add interfaces, listeners, and methods
- ✏️ `apps/backend/src/features/library/controllers/rack.controller.ts`
- ✏️ `apps/backend/src/features/library/controllers/shelf.controller.ts`
- ✏️ `apps/backend/src/features/library/controllers/status.controller.ts`
- ✏️ `apps/backend/src/features/library/controllers/library-article.controller.ts`
- ✏️ `apps/backend/src/features/library/controllers/library-document-type.controller.ts`

### Frontend (When Ready)

- Main Console: Subscribe to updates in library management pages
- Student Console: Subscribe to library updates if needed

---

## Timeline Estimate

- **Socket Service Updates**: 30-45 minutes
- **Controller Updates**: 45-60 minutes
- **Testing**: 30-45 minutes
- **Total**: ~2-2.5 hours
