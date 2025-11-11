import pandas as pd
import sys

# Read the Excel file
df = pd.read_excel('data-1762839867816.xlsx', engine='openpyxl', nrows=100)

print(f'Total rows: {len(df)}')
print(f'Total columns: {len(df.columns)}')

# Check NULL counts for key columns
key_cols = ['ABC_Id', 'UID', 'Top_Four_Subject_1', 'Top_Four_Marks_Obt_1', 
            'Others_Subject_1', 'Last_Exam_YOP', 'Last_Exam_Board', 'Admission_Mode']

print('\n=== NULL Counts ===')
for col in key_cols:
    if col in df.columns:
        null_count = df[col].isnull().sum()
        print(f'{col}: {null_count} NULLs out of {len(df)}')
        # Show sample values
        sample = df[col].head(3).tolist()
        print(f'  Sample: {sample}')

# Check for string "NULL" values
print('\n=== String "NULL" values ===')
for col in key_cols:
    if col in df.columns:
        string_null_count = (df[col].astype(str) == 'NULL').sum()
        if string_null_count > 0:
            print(f'{col}: {string_null_count} string "NULL" values')

# Check Last_Exam_YOP specifically
if 'Last_Exam_YOP' in df.columns:
    print('\n=== Last_Exam_YOP Analysis ===')
    print('Unique values (first 10):')
    print(df['Last_Exam_YOP'].value_counts().head(10))

