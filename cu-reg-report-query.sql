-- CU REGISTRATION REPORT QUERY
-- Fixed column references for promotions table (_fk suffix)

WITH latest_promotion AS (
    SELECT
        p.*,
        ROW_NUMBER() OVER (
            PARTITION BY p.student_id_fk
            ORDER BY COALESCE(p.date_of_joining, p.created_at) DESC NULLS LAST, p.id DESC
        ) AS rn
    FROM promotions AS p
),
promotion_current AS (
    SELECT *
    FROM latest_promotion
    WHERE rn = 1
),
latest_academic_info AS (
    SELECT
        a.*,
        ROW_NUMBER() OVER (
            PARTITION BY a.student_id_fk
            ORDER BY COALESCE(a.updated_at, a.created_at) DESC NULLS LAST, a.id DESC
        ) AS rn
    FROM admission_academic_info AS a
),
academic_info_selected AS (
    SELECT *
    FROM latest_academic_info
    WHERE rn = 1
),
family_with_names AS (
    SELECT
        fd.user_id_fk AS user_id,
        MAX(fd.annual_income_id_fk) AS annual_income_id,
        MAX(pr.name) FILTER (WHERE pr.type = 'FATHER')   AS father_name,
        MAX(pr.name) FILTER (WHERE pr.type = 'MOTHER')   AS mother_name,
        MAX(pr.name) FILTER (WHERE pr.type = 'GUARDIAN') AS guardian_name
    FROM family_details AS fd
    LEFT JOIN person AS pr
        ON pr.family_id_fk = fd.id
    GROUP BY fd.user_id_fk
),
address_residential AS (
    SELECT
        a.personal_details_id_fk AS personal_details_id,
        a.address_line,
        a.pincode,
        a.locality_type,
        c.name AS country_name,
        s.name AS state_name,
        ROW_NUMBER() OVER (
            PARTITION BY a.personal_details_id_fk
            ORDER BY COALESCE(a.updated_at, a.created_at) DESC NULLS LAST, a.id DESC
        ) AS rn
    FROM address AS a
    LEFT JOIN countries AS c ON c.id = a.country_id_fk
    LEFT JOIN states AS s    ON s.id = a.state_id_fk
    WHERE a.type = 'RESIDENTIAL'
),
address_mailing AS (
    SELECT
        a.personal_details_id_fk AS personal_details_id,
        a.address_line,
        a.pincode,
        c.name AS country_name,
        s.name AS state_name,
        ROW_NUMBER() OVER (
            PARTITION BY a.personal_details_id_fk
            ORDER BY COALESCE(a.updated_at, a.created_at) DESC NULLS LAST, a.id DESC
        ) AS rn
    FROM address AS a
    LEFT JOIN countries AS c ON c.id = a.country_id_fk
    LEFT JOIN states AS s    ON s.id = a.state_id_fk
    WHERE a.type = 'MAILING'
),
student_subjects_raw AS (
    SELECT
        sss.student_id_fk AS student_id,
        UPPER(COALESCE(st.code, ''))       AS subject_type_code,
        UPPER(COALESCE(ssm.label, ''))     AS label_upper,
        COALESCE(ssm.label, '')            AS label,
        subj.code                          AS subject_code,
        subj.name                          AS subject_name,
        ROW_NUMBER() OVER (
            PARTITION BY sss.student_id_fk, sss.subject_selection_meta_id_fk
            ORDER BY sss.version DESC, sss.created_at DESC NULLS LAST, sss.id DESC
        ) AS rn
    FROM student_subject_selections AS sss
    JOIN subject_selection_meta AS ssm
      ON ssm.id = sss.subject_selection_meta_id_fk
    LEFT JOIN subject_types AS st
      ON st.id = ssm.subject_type_id_fk
    LEFT JOIN subjects AS subj
      ON subj.id = sss.subject_id_fk
    WHERE sss.is_active = TRUE
),
student_subjects_latest AS (
    SELECT student_id, subject_type_code, label_upper, label, subject_code, subject_name
    FROM student_subjects_raw
    WHERE rn = 1
),
student_subjects_pivot AS (
    SELECT
        student_id,
        MAX(subject_code) FILTER (WHERE subject_type_code IN ('DSCC','CORE','MAJOR')) AS dscc_core,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MN'  AND label_upper LIKE 'MINOR 1%') AS minor1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MN'  AND label_upper LIKE 'MINOR 2%') AS minor2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MN'  AND label_upper LIKE 'MINOR 3%') AS minor3,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MN'  AND label_upper LIKE 'MINOR 4%') AS minor4,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND (label_upper LIKE 'AEC 1%' OR label_upper LIKE 'AEC (SEMESTER I%')) AS aec1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND label_upper LIKE 'AEC 2%')   AS aec2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND (
            label_upper LIKE 'AEC 3%' OR 
            label_upper LIKE 'AEC3%' OR 
            label_upper LIKE 'AEC (SEMESTER III%' OR
            label_upper LIKE 'AEC (SEMESTER III & IV%'
        )) AS aec3,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC' AND (
            label_upper LIKE 'AEC 4%' OR 
            label_upper LIKE 'AEC4%' OR
            label_upper LIKE 'AEC (SEMESTER V%'
        )) AS aec4,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'IDC' AND label_upper LIKE 'IDC 1%')   AS idc1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'IDC' AND label_upper LIKE 'IDC 2%')   AS idc2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'IDC' AND label_upper LIKE 'IDC 3%')   AS idc3,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND label_upper LIKE 'MDC 1%')   AS mdc1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND label_upper LIKE 'MDC 2%')   AS mdc2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND label_upper LIKE 'MDC 3%')   AS mdc3,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND label_upper LIKE 'SEC 1%')   AS sec1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND label_upper LIKE 'SEC 2%')   AS sec2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'CVAC' OR label_upper LIKE 'CVAC%')     AS cvac
    FROM student_subjects_latest
    GROUP BY student_id
),
program_papers AS (
    SELECT
        p.programe_course_id_fk AS program_course_id,
        UPPER(st.code)          AS subject_type_code,
        UPPER(cls.name)         AS class_name,
        subj.code               AS subject_code,
        subj.name               AS subject_name,
        ROW_NUMBER() OVER (
            PARTITION BY p.programe_course_id_fk, st.code, cls.name
            ORDER BY p.sequence NULLS LAST, p.id
        ) AS rn
    FROM papers AS p
    JOIN subject_types AS st ON st.id  = p.subject_type_id_fk
    JOIN subjects      AS subj ON subj.id = p.subject_id_fk
    JOIN classes       AS cls  ON cls.id  = p.class_id_fk
    WHERE p.is_active = TRUE
),
program_papers_first AS (
    SELECT program_course_id, subject_type_code, class_name, subject_code, subject_name
    FROM program_papers
    WHERE rn = 1
),
paper_pivot AS (
    SELECT
        program_course_id,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'DSCC' AND class_name LIKE 'SEMESTER I%')  AS dscc_sem1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MN'   AND class_name LIKE 'SEMESTER I%')  AS mn_sem1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MN'   AND class_name LIKE 'SEMESTER II%') AS mn_sem2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MN'   AND class_name LIKE 'SEMESTER III%')AS mn_sem3,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC'  AND class_name LIKE 'SEMESTER I%')  AS aec_sem1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC'  AND class_name LIKE 'SEMESTER II%') AS aec_sem2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'AEC'  AND class_name LIKE 'SEMESTER III%')AS aec_sem3,
        MAX(subject_code) FILTER (WHERE subject_type_code IN ('IDC','MDC') AND class_name LIKE 'SEMESTER I%') AS idc_sem1,
        MAX(subject_code) FILTER (WHERE subject_type_code IN ('IDC','MDC') AND class_name LIKE 'SEMESTER II%')AS idc_sem2,
        MAX(subject_code) FILTER (WHERE subject_type_code IN ('IDC','MDC') AND class_name LIKE 'SEMESTER III%')AS idc_sem3,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND class_name LIKE 'SEMESTER I%')  AS mdc_sem1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND class_name LIKE 'SEMESTER II%') AS mdc_sem2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'MDC' AND class_name LIKE 'SEMESTER III%')AS mdc_sem3,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND class_name LIKE 'SEMESTER I%')  AS sec_sem1,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'SEC' AND class_name LIKE 'SEMESTER II%') AS sec_sem2,
        MAX(subject_code) FILTER (WHERE subject_type_code = 'CVAC'AND class_name LIKE 'SEMESTER II%') AS cvac_sem2
    FROM program_papers_first
    GROUP BY program_course_id
),
student_context AS (
    SELECT
        cr.cu_registration_application_number          AS form_number,
        std.id                                          AS student_id,
        std.user_id_fk                                  AS user_id,
        std.program_course_id_fk                        AS program_course_id,
        std.uid,
        std.apaar_id,
        std.belongs_to_ews,
        std.handicapped,
        u.name                                          AS student_name,
        u.phone                                         AS mobile_number,
        pd.id                                           AS personal_details_id,
        pd.email,
        pd.aadhaar_card_number                          AS aadhaar_card_number,
        pd.date_of_birth,
        pd.gender,
        pd.disability                                   AS disability,
        rlg.name                                        AS religion_name,
        ct.name                                         AS category_name,
        nl.code                                         AS nationality_code,
        nl.name                                         AS nationality_name,
        dc.code                                         AS disability_code,
        promo.date_of_joining,
        promo.shift_id_fk                               AS shift_id,
        promo.class_id_fk                               AS class_id,
        promo.promotion_status_id_fk,
        sh.name                                         AS shift_name,
        sess.id                                         AS session_id,
        sess.name                                       AS session_name,
        ay.year                                         AS session_year,
        aai.id                                          AS academic_info_id,
        aai.board_id_fk,
        bd.name                                         AS board_name,
        bd.code                                         AS board_code,
        aai.other_board,
        aai.roll_number                                 AS board_roll_number,
        aai.year_of_passing,
        aai.subject_studied,
        aai.cu_registration_number,
        pc.university_code                              AS university_code,
        pc.duration,
        crs.name                                        AS course_name,
        str.name                                        AS stream_name,
        ps.name                                         AS admission_mode
    FROM cu_registration_correction_requests AS cr
    JOIN students AS std        ON std.id       = cr.student_id_fk
    JOIN users    AS u          ON u.id         = std.user_id_fk
    LEFT JOIN personal_details AS pd   ON pd.user_id_fk = u.id
    LEFT JOIN religion         AS rlg  ON rlg.id        = pd.religion_id_fk
    LEFT JOIN categories       AS ct   ON ct.id         = pd.category_id_fk
    LEFT JOIN nationality      AS nl   ON nl.id         = pd.nationality_id_fk
    LEFT JOIN disability_codes AS dc   ON dc.id         = pd.disablity_code_id_fk
    LEFT JOIN promotion_current AS promo ON promo.student_id_fk = std.id
    LEFT JOIN shifts   AS sh   ON sh.id     = promo.shift_id_fk
    LEFT JOIN sessions AS sess ON sess.id   = promo.session_id_fk
    LEFT JOIN academic_years AS ay ON ay.id = sess.academic_id_fk
    LEFT JOIN promotion_status AS ps ON ps.id = promo.promotion_status_id_fk
    LEFT JOIN academic_info_selected AS aai ON aai.student_id_fk = std.id
    LEFT JOIN boards AS bd ON bd.id = aai.board_id_fk
    LEFT JOIN program_courses AS pc ON pc.id = std.program_course_id_fk
    LEFT JOIN courses        AS crs ON crs.id = pc.course_id_fk
    LEFT JOIN streams        AS str ON str.id = pc.stream_id_fk
    WHERE cr.cu_registration_application_number IS NOT NULL
),
combined_subjects AS (
    SELECT
        sc.student_id,
        sc.stream_name,
        COALESCE(sp.dscc_core, pp.dscc_sem1, sc.course_name) AS core_major,
        COALESCE(sp.minor1, pp.mn_sem1)                      AS minor1,
        COALESCE(sp.minor2, pp.mn_sem2, pp.mn_sem3)          AS minor2,
        COALESCE(sp.minor3, pp.mn_sem3)                      AS minor3,
        COALESCE(sp.cvac,  pp.cvac_sem2)                     AS cvac,
        COALESCE(sp.aec1,  pp.aec_sem1)                      AS aec1,
        COALESCE(sp.aec2,  pp.aec_sem2)                      AS aec2,
        -- AEC3: only from student selections, if not present then empty
        sp.aec3                                              AS aec3,
        COALESCE(sp.idc1,  pp.idc_sem1)                      AS idc1,
        COALESCE(sp.idc2,  pp.idc_sem2)                      AS idc2,
        COALESCE(sp.idc3,  pp.idc_sem3)                      AS idc3,
        -- MDC: Only from papers table (contains subject_id). For BA/BSC (non-commerce) = empty, For BCOM (commerce) = from papers if exists
        CASE 
            WHEN sc.stream_name ILIKE 'Commerce%' THEN pp.mdc_sem1
            ELSE NULL
        END                                                  AS mdc1,
        CASE 
            WHEN sc.stream_name ILIKE 'Commerce%' THEN pp.mdc_sem2
            ELSE NULL
        END                                                  AS mdc2,
        CASE 
            WHEN sc.stream_name ILIKE 'Commerce%' THEN pp.mdc_sem3
            ELSE NULL
        END                                                  AS mdc3,
        -- SEC: Only from papers table (contains subject_id), if exists display otherwise empty
        pp.sec_sem1                                         AS sec1,
        pp.sec_sem2                                         AS sec2
    FROM student_context AS sc
    LEFT JOIN student_subjects_pivot AS sp ON sp.student_id      = sc.student_id
    LEFT JOIN paper_pivot           AS pp ON pp.program_course_id = sc.program_course_id
),
marks_base AS (
    SELECT
        aai.student_id_fk AS student_id,
        bsn.name          AS subject_name,
        COALESCE(bs.full_marks_theory, 0) + COALESCE(bs.full_marks_practical, 0) AS full_marks,
        COALESCE(sas.total_marks,
                 COALESCE(sas.theory_marks, 0) + COALESCE(sas.practical_marks, 0)) AS obtained_marks
    FROM student_academic_subjects AS sas
    JOIN academic_info_selected AS aai ON aai.id = sas.admission_academic_info_id_fk
    LEFT JOIN board_subjects      AS bs  ON bs.id  = sas.board_subject_id_fk
    LEFT JOIN board_subject_names AS bsn ON bsn.id = bs.board_subject_name_id_fk
),
marks_ranked AS (
    SELECT
        mb.*,
        CASE
            WHEN mb.full_marks > 0 THEN ROUND(((mb.obtained_marks * 100.0) / mb.full_marks)::numeric, 2)
            ELSE NULL
        END AS percentage,
        ROW_NUMBER() OVER (
            PARTITION BY mb.student_id
            ORDER BY mb.obtained_marks DESC, mb.full_marks DESC, mb.subject_name
        ) AS seq
    FROM marks_base AS mb
),
top_four_pivot AS (
    SELECT
        student_id,
        MAX(subject_name)  FILTER (WHERE seq = 1) AS subject_1,
        MAX(subject_name)  FILTER (WHERE seq = 2) AS subject_2,
        MAX(subject_name)  FILTER (WHERE seq = 3) AS subject_3,
        MAX(subject_name)  FILTER (WHERE seq = 4) AS subject_4,
        MAX(full_marks)    FILTER (WHERE seq = 1) AS full_marks_1,
        MAX(full_marks)    FILTER (WHERE seq = 2) AS full_marks_2,
        MAX(full_marks)    FILTER (WHERE seq = 3) AS full_marks_3,
        MAX(full_marks)    FILTER (WHERE seq = 4) AS full_marks_4,
        MAX(obtained_marks)FILTER (WHERE seq = 1) AS marks_obt_1,
        MAX(obtained_marks)FILTER (WHERE seq = 2) AS marks_obt_2,
        MAX(obtained_marks)FILTER (WHERE seq = 3) AS marks_obt_3,
        MAX(obtained_marks)FILTER (WHERE seq = 4) AS marks_obt_4,
        MAX(percentage)    FILTER (WHERE seq = 1) AS pct_1,
        MAX(percentage)    FILTER (WHERE seq = 2) AS pct_2,
        MAX(percentage)    FILTER (WHERE seq = 3) AS pct_3,
        MAX(percentage)    FILTER (WHERE seq = 4) AS pct_4,
        SUM(full_marks)    FILTER (WHERE seq <= 4) AS total_full,
        SUM(obtained_marks)FILTER (WHERE seq <= 4) AS total_obt,
        CASE
            WHEN SUM(full_marks) FILTER (WHERE seq <= 4) > 0
            THEN ROUND(
                ((SUM(obtained_marks) FILTER (WHERE seq <= 4) * 100.0) /
                NULLIF(SUM(full_marks) FILTER (WHERE seq <= 4), 0))::numeric, 2
            )
            ELSE NULL
        END AS total_pct
    FROM marks_ranked
    GROUP BY student_id
),
others_ranked AS (
    SELECT
        mr.student_id,
        mr.subject_name,
        mr.full_marks,
        mr.obtained_marks,
        mr.percentage,
        (mr.seq - 4) AS ord
    FROM marks_ranked AS mr
    WHERE mr.seq > 4 AND mr.seq <= 8
),
others_pivot AS (
    SELECT
        student_id,
        MAX(subject_name)  FILTER (WHERE ord = 1) AS subject_1,
        MAX(subject_name)  FILTER (WHERE ord = 2) AS subject_2,
        MAX(subject_name)  FILTER (WHERE ord = 3) AS subject_3,
        MAX(subject_name)  FILTER (WHERE ord = 4) AS subject_4,
        MAX(full_marks)    FILTER (WHERE ord = 1) AS full_marks_1,
        MAX(full_marks)    FILTER (WHERE ord = 2) AS full_marks_2,
        MAX(full_marks)    FILTER (WHERE ord = 3) AS full_marks_3,
        MAX(full_marks)    FILTER (WHERE ord = 4) AS full_marks_4,
        MAX(obtained_marks)FILTER (WHERE ord = 1) AS marks_obt_1,
        MAX(obtained_marks)FILTER (WHERE ord = 2) AS marks_obt_2,
        MAX(obtained_marks)FILTER (WHERE ord = 3) AS marks_obt_3,
        MAX(obtained_marks)FILTER (WHERE ord = 4) AS marks_obt_4,
        MAX(percentage)    FILTER (WHERE ord = 1) AS pct_1,
        MAX(percentage)    FILTER (WHERE ord = 2) AS pct_2,
        MAX(percentage)    FILTER (WHERE ord = 3) AS pct_3,
        MAX(percentage)    FILTER (WHERE ord = 4) AS pct_4
    FROM others_ranked
    GROUP BY student_id
)
SELECT
    sc.form_number                                   AS "Form_Number",
    sc.aadhaar_card_number                           AS "Aadhar_Number",
    sc.cu_registration_number                        AS "CU_Reg_Number",
    '017'                                            AS "College_Name",
    COALESCE(sc.university_code, sc.course_name)     AS "Course_Name",
    TO_CHAR(sc.date_of_joining, 'DD/MM/YYYY')        AS "Date_of_Admission",
    sc.session_year                                  AS "Session_of_Admission",
    'No'                                             AS "Non_Formal_Education",
    sc.student_name                                  AS "Student_Name",
    fam.father_name                                  AS "Father_Name",
    fam.mother_name                                  AS "Mother_Name",
    fam.guardian_name                                AS "Guardian_Name",
    TO_CHAR(sc.date_of_birth, 'DD/MM/YYYY')          AS "Date_of_Birth",
    CASE
        WHEN sc.gender::text ILIKE 'MALE'   THEN 'M'
        WHEN sc.gender::text ILIKE 'FEMALE' THEN 'F'
        WHEN sc.gender::text ILIKE 'OTHER'  THEN 'O'
        ELSE NULL
    END                                               AS "Gender",
    sc.religion_name                                  AS "Religion",
    sc.category_name                                  AS "Category",
    COALESCE(sc.nationality_code::text, sc.nationality_name) AS "Nationality",
    CASE
        WHEN sc.handicapped OR sc.disability IS NOT NULL THEN 'Y'
        ELSE 'N'
    END                                               AS "Differently_Abled",
    sc.disability_code                                AS "Disability_Code",
    NULL                                              AS "Disability_Percentage",
    sc.mobile_number                                  AS "Contact_Mobile_Number",
    sc.email                                          AS "Email_Id",
    'N'                                               AS "BPL",
    CASE
        WHEN sc.belongs_to_ews IS TRUE  THEN 'Y'
        WHEN sc.belongs_to_ews IS FALSE THEN 'N'
        ELSE NULL
    END                                               AS "EWS",
    ai.range                                          AS "Family_Income",
    res.locality_type                                 AS "Locality_Type",
    res.address_line                                  AS "Present_Address",
    res.pincode                                       AS "Present_Pin",
    res.state_name                                    AS "Present_State",
    res.country_name                                  AS "Present_Country",
    mail.address_line                                 AS "Permanent_Address",
    mail.pincode                                      AS "Permanent_Pin",
    mail.state_name                                   AS "Permanent_State",
    mail.country_name                                 AS "Permanent_Country",
    COALESCE(cs.core_major, sc.course_name)           AS "BA_BSC_BMUS_CVOC_Hons_Core_Major_Subject",
    cs.minor1                                         AS "BA_BSC_BMUS_CVOC_Hons_1st_Minor_Subject",
    cs.minor2                                         AS "BA_BSC_BMUS_CVOC_Hons_2nd_Minor_Subject",
    cs.cvac                                           AS "BA_BSC_BMUS_CVOC_Hons_CVAC",
    cs.aec1                                           AS "BA_BSC_BMUS_CVOC_Hons_AEC",
    cs.idc1                                           AS "BA_BSC_BMUS_CVOC_Hons_IDC_1",
    cs.idc2                                           AS "BA_BSC_BMUS_CVOC_Hons_IDC_2",
    cs.idc3                                           AS "BA_BSC_BMUS_CVOC_Hons_IDC_3",
    NULL                                              AS "BA_BSC_MDC_Core_Subject_1",
    NULL                                              AS "BA_BSC_MDC_Core_Subject_2",
    NULL                                              AS "BA_BSC_MDC_Minor_Subject",
    NULL                                              AS "BA_BSC_MDC_SEC_1",
    NULL                                              AS "BA_BSC_MDC_SEC_2",
    NULL                                              AS "BA_BSC_MDC_CVAC",
    NULL                                              AS "BA_BSC_MDC_AEC",
    NULL                                              AS "BA_BSC_MDC_IDC_1",
    NULL                                              AS "BA_BSC_MDC_IDC_2",
    NULL                                              AS "BA_BSC_MDC_IDC_3",
    CASE WHEN sc.stream_name ILIKE 'Commerce%' AND sc.course_name ILIKE '%Hon%' THEN COALESCE(cs.minor1, cs.mdc1) END AS "BCOM_Hons_Minor",
    CASE WHEN sc.stream_name ILIKE 'Commerce%' AND sc.course_name ILIKE '%Hon%' THEN cs.cvac END                  AS "BCOM_Hons_CVAC",
    CASE WHEN sc.stream_name ILIKE 'Commerce%' AND sc.course_name ILIKE '%Hon%' THEN cs.aec1 END                  AS "BCOM_Hons_AEC",
    CASE WHEN sc.stream_name ILIKE 'Commerce%' AND sc.duration = 3 THEN COALESCE(cs.minor1, cs.mdc1) END         AS "BCOM_3_Year_Minor",
    CASE WHEN sc.stream_name ILIKE 'Commerce%' AND sc.duration = 3 THEN cs.cvac END                              AS "BCOM_3_Year_CVAC",
    CASE WHEN sc.stream_name ILIKE 'Commerce%' AND sc.duration = 3 THEN COALESCE(cs.aec1, cs.aec2) END           AS "BCOM_3_Year_AEC",
    CASE
        WHEN sc.board_code IN ('WBCHSE','ICSE','CBSE','NIOS')
            THEN COALESCE(sc.board_name, sc.other_board)
        ELSE NULL
    END                                               AS "Non_Migrating_Board",
    CASE
        WHEN sc.board_code IS NULL THEN sc.other_board
        WHEN sc.board_code NOT IN ('WBCHSE','ICSE','CBSE','NIOS') THEN sc.board_name
        ELSE NULL
    END                                               AS "Migrating_Board",
    COALESCE(sc.subject_studied, sc.board_name)        AS "Last_Exam_Name",
    COALESCE(sc.board_name, sc.other_board)            AS "Last_Exam_Board",
    sc.board_roll_number                               AS "Last_Exam_Roll",
    sc.year_of_passing                                 AS "Last_Exam_YOP",
    tf.subject_1                                       AS "Top_Four_Subject_1",
    tf.subject_2                                       AS "Top_Four_Subject_2",
    tf.subject_3                                       AS "Top_Four_Subject_3",
    tf.subject_4                                       AS "Top_Four_Subject_4",
    tf.full_marks_1                                    AS "Top_Four_Full_Marks_1",
    tf.full_marks_2                                    AS "Top_Four_Full_Marks_2",
    tf.full_marks_3                                    AS "Top_Four_Full_Marks_3",
    tf.full_marks_4                                    AS "Top_Four_Full_Marks_4",
    tf.marks_obt_1                                     AS "Top_Four_Marks_Obt_1",
    tf.marks_obt_2                                     AS "Top_Four_Marks_Obt_2",
    tf.marks_obt_3                                     AS "Top_Four_Marks_Obt_3",
    tf.marks_obt_4                                     AS "Top_Four_Marks_Obt_4",
    tf.pct_1                                           AS "Top_Four_Marks_Prcntg_1",
    tf.pct_2                                           AS "Top_Four_Marks_Prcntg_2",
    tf.pct_3                                           AS "Top_Four_Marks_Prcntg_3",
    tf.pct_4                                           AS "Top_Four_Marks_Prcntg_4",
    tf.total_full                                      AS "Total_of_Top_Four_Full_Marks",
    tf.total_obt                                       AS "Total_of_Top_Four_Marks_Obtained",
    tf.total_pct                                       AS "Total_of_Top_Four_Marks_Percentage",
    ot.subject_1                                       AS "Others_Subject_1",
    ot.subject_2                                       AS "Others_Subject_2",
    ot.subject_3                                       AS "Others_Subject_3",
    ot.subject_4                                       AS "Others_Subject_4",
    ot.full_marks_1                                    AS "Others_Full_Marks_1",
    ot.full_marks_2                                    AS "Others_Full_Marks_2",
    ot.full_marks_3                                    AS "Others_Full_Marks_3",
    ot.full_marks_4                                    AS "Others_Full_Marks_4",
    ot.marks_obt_1                                     AS "Others_Marks_Obt_1",
    ot.marks_obt_2                                     AS "Others_Marks_Obt_2",
    ot.marks_obt_3                                     AS "Others_Marks_Obt_3",
    ot.marks_obt_4                                     AS "Others_Marks_Obt_4",
    ot.pct_1                                           AS "Others_Marks_Prcntg_1",
    ot.pct_2                                           AS "Others_Marks_Prcntg_2",
    ot.pct_3                                           AS "Others_Marks_Prcntg_3",
    ot.pct_4                                           AS "Others_Marks_Prcntg_4",
    COALESCE(sc.admission_mode, 'REGULAR')             AS "Admission_Mode",
    sc.apaar_id                                        AS "ABC_Id",
    sc.uid                                             AS "UID",
    NULL                                               AS "Unnamed: 102",
    NULL                                               AS "Unnamed: 103",
    NULL                                               AS "Unnamed: 104",
    NULL                                               AS "Unnamed: 105",
    NULL                                               AS "Unnamed: 106",
    NULL                                               AS "Unnamed: 107",
    NULL                                               AS "Unnamed: 108"
FROM student_context          AS sc
LEFT JOIN family_with_names   AS fam  ON fam.user_id          = sc.user_id
LEFT JOIN annual_incomes      AS ai   ON ai.id                = fam.annual_income_id
LEFT JOIN address_residential AS res  ON res.personal_details_id = sc.personal_details_id AND res.rn = 1
LEFT JOIN address_mailing     AS mail ON mail.personal_details_id = sc.personal_details_id AND mail.rn = 1
LEFT JOIN combined_subjects   AS cs   ON cs.student_id        = sc.student_id
LEFT JOIN top_four_pivot      AS tf   ON tf.student_id        = sc.student_id
LEFT JOIN others_pivot        AS ot   ON ot.student_id        = sc.student_id
ORDER BY sc.form_number;

