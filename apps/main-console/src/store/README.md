# Redux Store Setup for Academic Year Management

This setup provides global state management for academic years using Redux Toolkit.

## Files Structure

```
src/
├── store/
│   ├── slices/
│   │   └── academicYearSlice.ts    # Academic year slice with actions and selectors
│   ├── store.ts                    # Redux store configuration
│   ├── hooks.ts                    # Typed hooks for useSelector and useDispatch
│   └── index.ts                    # Store exports
├── hooks/
│   └── useAcademicYear.ts          # Custom hook for academic year management
├── services/
│   └── academic-year.service.ts    # API service for academic year operations
└── components/
    └── academic-year/
        ├── AcademicYearSelector.tsx # Academic year selector component
        └── index.ts                # Component exports
```

## Usage Examples

### 1. Using the Custom Hook

```tsx
import { useAcademicYear } from "@/hooks/useAcademicYear";

function MyComponent() {
  const { currentAcademicYear, availableAcademicYears, loading, error, loadAcademicYears, setCurrentYear } =
    useAcademicYear();

  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Current: {currentAcademicYear?.year}</h2>
      <ul>
        {availableAcademicYears.map((year) => (
          <li key={year.id}>
            <button onClick={() => setCurrentYear(year)}>{year.year}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. Using the Academic Year Selector Component

```tsx
import { AcademicYearSelector } from "@/components/academic-year";

function MyPage() {
  const handleAcademicYearChange = (academicYear) => {
    console.log("Selected academic year:", academicYear);
  };

  return (
    <div>
      <AcademicYearSelector onAcademicYearChange={handleAcademicYearChange} className="mb-4" />
    </div>
  );
}
```

### 3. Direct Redux Usage

```tsx
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCurrentAcademicYear, selectCurrentAcademicYear } from "@/store";

function MyComponent() {
  const dispatch = useAppDispatch();
  const currentAcademicYear = useAppSelector(selectCurrentAcademicYear);

  const handleSetYear = (year) => {
    dispatch(setCurrentAcademicYear(year));
  };

  return <div>Current Year: {currentAcademicYear?.year}</div>;
}
```

## State Shape

```typescript
interface AcademicYearState {
  currentAcademicYear: AcademicYear | null;
  availableAcademicYears: AcademicYear[];
  loading: boolean;
  error: string | null;
}
```

## Available Actions

- `setCurrentAcademicYear(academicYear)` - Set the current academic year
- `setAvailableAcademicYears(academicYears)` - Set available academic years
- `setLoading(boolean)` - Set loading state
- `setError(string)` - Set error state
- `clearError()` - Clear error state
- `resetAcademicYearState()` - Reset all state to initial values

## Available Selectors

- `selectCurrentAcademicYear` - Get current academic year
- `selectAvailableAcademicYears` - Get all available academic years
- `selectAcademicYearLoading` - Get loading state
- `selectAcademicYearError` - Get error state

## API Service

The `academicYearService` provides methods to interact with the backend:

- `getAllAcademicYears()` - Fetch all academic years
- `getCurrentAcademicYear()` - Fetch current academic year
- `getAcademicYearById(id)` - Fetch academic year by ID
- `createAcademicYear(data)` - Create new academic year
- `updateAcademicYear(id, data)` - Update academic year
- `setCurrentAcademicYear(id)` - Set current academic year on backend

## Environment Variables

Make sure to set the API base URL in your environment:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Integration

The Redux Provider is already integrated in `main.tsx`. The academic year state is globally available across the entire application.
