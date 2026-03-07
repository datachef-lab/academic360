# Schedule Exam – Flow & Validation Scenarios

This document lists all scenarios, validations, and conditions for the **Schedule Exam** page (Create New Group / Select Existing Group) and the **Schedule Exam** button.

---

## 1. Page structure and visibility

| Section                                     | When it is shown                                                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Top filters**                             | Always (Academic Year, Affiliation, Regulation, Exam Type, Semester, Shifts, Program Courses, Subject Category). |
| **Exam Group Selection**                    | When **Exam Type**, **Semester**, and **Program Courses** are selected.                                          |
| **Subject / Component / Papers / Schedule** | When Exam Type, Semester, Program Courses, **Shifts**, and **Subject Categories** are selected.                  |
| **Duplicate exam warning**                  | When duplicate exam check runs and finds a duplicate (same exam configuration).                                  |
| **Schedule Exam button**                    | Same as “Subject / Component / Papers / Schedule” (bottom of that section).                                      |

---

## 2. Exam group mode: “Create New Group”

### 2.1 Visibility and inputs

- **Exam Group Name**: Textarea (can be auto-filled from filters).
- **Exam Commencement Date**: Date picker.
- Uniqueness check runs **only after both** name (non-empty) and date are set (debounce 500 ms).

### 2.2 Scenarios – Create New Group

| #   | Scenario                                 | Name             | Date    | What happens                                                                                                                                                                                           |
| --- | ---------------------------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Neither set                              | Empty/whitespace | Not set | No API call. No duplicate state. Schedule button can still be disabled for other reasons.                                                                                                              |
| 2   | Only name                                | Non-empty        | Not set | No uniqueness API call. Duplicate state cleared. Validation runs only after date is set.                                                                                                               |
| 3   | Only date                                | Empty/whitespace | Set     | No uniqueness API call. Duplicate state cleared.                                                                                                                                                       |
| 4   | Both set, unique                         | Non-empty        | Set     | After 500 ms: `GET /api/exam-groups/validate-unique?name=...&examCommencementDate=...`. `isUnique: true` → no duplicate. Schedule button not disabled by exam-group validation.                        |
| 5   | Both set, duplicate                      | Non-empty        | Set     | After 500 ms: same API. `isUnique: false` → `duplicateExamGroupId` set. Red message under date. **Schedule Exam button disabled** until user changes name/date or switches to “Select Existing Group”. |
| 6   | API error                                | Non-empty        | Set     | Uniqueness API fails → `examGroupUniqueError` set, amber message. `duplicateExamGroupId` cleared. Button not disabled by duplicate state (but may be by other conditions).                             |
| 7   | User clears date after duplicate         | Non-empty        | Cleared | Uniqueness effect stops (date missing). Duplicate state cleared. No duplicate message.                                                                                                                 |
| 8   | User switches to “Select Existing Group” | Any              | Any     | Uniqueness state cleared. No uniqueness API. User must select an existing group to enable submit (see Section 3).                                                                                      |

### 2.3 Frontend validations on submit (Create New Group)

On **Schedule Exam** click, mutation runs these checks in order:

| Check                    | Error if failed                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name empty               | "Please enter an exam group name"                                                                                                                  |
| Date not set             | "Please select an exam commencement date for the new group"                                                                                        |
| Uniqueness still loading | "Please wait while we verify the exam group name and date"                                                                                         |
| Duplicate name+date      | "An exam group with the same name and commencement date already exists (ID: X). Please select the existing group or choose a different name/date." |

(Other validations – subject papers, student count, duplicate exam – are in Section 5.)

### 2.4 Backend validations (Create New Group)

- **Validate-unique API**
  - `GET /api/exam-groups/validate-unique?name=...&examCommencementDate=...`
  - Both `name` and `examCommencementDate` required (400 if missing).
  - Uses **name + date** (case-insensitive name, normalized date).
  - Returns `isUnique` and `existingExamGroupId`.

- **Create exam (POST)**
  - Body must have `examGroup` with `name` and `examCommencementDate`.
  - If creating new group (no `selectedExistingGroupId`):
    - Normalize name and date.
    - Look up existing group by **name + examCommencementDate**.
    - If found → throw: exam group with that name and commencement date already exists (ID: …).
    - If not found → insert new group with that name and date.
  - DB unique index on `(name, examCommencementDate)` also prevents duplicates.

---

## 3. Exam group mode: “Select Existing Group”

### 3.1 Visibility and inputs

- **Filter by Date** (optional): Filters the list of existing groups.
- **Available Exam Groups**: List loaded from `GET /api/exam-groups?...` (with filters). User must select one.

### 3.2 Scenarios – Select Existing Group

| #   | Scenario                     | What happens                                                                                                       |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | No group selected            | Schedule Exam button disabled (exam group validation). Submit error: "Please select an existing exam group".       |
| 2   | One group selected           | `selectedExistingGroupId` set. Schedule Exam not disabled by exam-group validation (other conditions still apply). |
| 3   | Filter by date, no groups    | List empty. User must clear filter or pick another date to see groups.                                             |
| 4   | Switch to “Create New Group” | Selection cleared. Uniqueness logic applies again when name+date set.                                              |

### 3.3 Frontend validations on submit (Select Existing Group)

| Check                      | Error if failed                        |
| -------------------------- | -------------------------------------- |
| No existing group selected | "Please select an existing exam group" |

### 3.4 Backend (Select Existing Group)

- **Create exam (POST)**
  - If `selectedExistingGroupId` is sent: use that group (must exist). No name+date uniqueness check for this path.

---

## 4. Schedule Exam button – when it is disabled

The button is **disabled** if **any** of the following is true:

| #   | Condition                                                                        | Meaning                                                                                                          |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `assignExamMutation.status === "loading"`                                        | Request in progress.                                                                                             |
| 2   | `duplicateCheckResult?.isDuplicate`                                              | Another exam with same configuration already exists (class, type, program courses, shifts, subjects, schedules). |
| 3   | **Create New Group** and (`isCheckingExamGroupUnique` or `duplicateExamGroupId`) | Uniqueness check in progress or name+date duplicate.                                                             |
| 4   | `selectedSubjectPapers.length === 0`                                             | No papers added to the schedule.                                                                                 |
| 5   | Any selected paper missing full schedule                                         | For every selected paper: `schedule.date`, `schedule.startTime`, `schedule.endTime` must be set.                 |
| 6   | `canFetchStudentCount && totalStudentCount === 0`                                | Student count is available and is 0 (no eligible students).                                                      |
| 7   | `loadingStudentCount`                                                            | Student count is still loading.                                                                                  |

The button is **only shown** when: Exam Type, Semester, Program Courses, Shifts, and Subject Categories are selected (same as the section that contains it).

---

## 5. Other validations (not exam group)

### 5.1 Duplicate exam (full configuration)

- **When**: When `canCheckDuplicate` is true (academic year, exam type, semester, program courses, shifts, subject categories, subjects, and all subject schedules complete).
- **API**: `POST /api/exams/schedule/check-duplicate` with full exam DTO (no exam group id for “new” flow).
- **Result**: If duplicate → red banner “Duplicate Exam Detected” and Schedule Exam disabled.
- **On submit**: Mutation calls same check again; if duplicate, throws with message and duplicate exam ID.

### 5.2 Subject papers and schedules

- At least one subject paper must be added.
- Each must have date, start time, and end time (incomplete ones are skipped when building `examSubjects` but still disable the button).

### 5.3 Student count

- When filters and papers allow a student count fetch, count must be > 0 and not loading; otherwise button disabled.

---

## 6. End-to-end flow summary

1. **Top filters**  
   User sets Academic Year, Affiliation, Regulation, Exam Type, Semester, Shifts, Program Courses, Subject Category.

2. **Exam group**
   - **New**: Enter name + date → after both set, uniqueness check (name+date) runs (500 ms debounce). If duplicate → message + button disabled until fixed or switch to existing.
   - **Existing**: Pick one group from list (optional date filter). Must select one.

3. **Papers and schedule**  
   Add subjects, component, program courses, papers; set date/time for each paper. All must have full schedule; at least one paper.

4. **Duplicate exam**  
   Real-time check (debounced) runs when configuration is complete; if duplicate exam found → warning and button disabled.

5. **Student count**  
   Fetched when applicable; button disabled if count is 0 or loading.

6. **Submit**  
   All validations (exam group, duplicate exam, papers, schedules, student count) must pass. Backend again validates exam group (name+date for new group) and duplicate exam before creating.

---

## 7. API summary

| API                                                                                    | When / purpose                                                                                                                                            |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/exam-groups/validate-unique?name=...&examCommencementDate=...`               | After both name and date set (Create New Group). Validates name+date uniqueness.                                                                          |
| `GET /api/exam-groups?page=...&...`                                                    | When “Select Existing Group” tab active (with optional date filter). List groups.                                                                         |
| `POST /api/exams/schedule/check-duplicate`                                             | When exam configuration is complete. Full exam duplicate check.                                                                                           |
| `POST /api/exams/schedule` (FormData: dto, examGroup, selectedExistingGroupId?, file?) | On Schedule Exam. Creates exam (and new group if name+date provided and no selectedExistingGroupId). Backend enforces name+date uniqueness for new group. |

---

## 8. Quick reference – “Create New Group” vs “Select Existing Group”

| Item               | Create New Group                                    | Select Existing Group        |
| ------------------ | --------------------------------------------------- | ---------------------------- |
| Required inputs    | Name (non-empty) + Commencement date                | One group selected from list |
| Uniqueness check   | Yes, name+date, after both set                      | No                           |
| Backend create     | New row in `exam_groups` (name+date unique)         | Use existing `exam_group_id` |
| Button disabled by | Name/date missing, checking, or duplicate name+date | No group selected            |
