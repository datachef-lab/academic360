import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../store'
import { Student } from '@/types/user/student'

export interface StudentState {
    student: Student | null
}

const initialState: StudentState = {
    student: null,
}

export const studentSlice = createSlice({
    name: 'student',
    initialState,
    reducers: {
        setStudent: (state, action: PayloadAction<Student | null>) => {
            state.student = action.payload;
        },
    },
})

// Action creators are generated for each case reducer function
export const { setStudent } = studentSlice.actions

export const selectStudent = ((state: RootState) => state.student.student);

export default studentSlice.reducer