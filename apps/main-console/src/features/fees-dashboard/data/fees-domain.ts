/**
 * Fees domain (packages/db) — how entities relate.
 *
 * fee_slabs
 *   Master catalog (name, defaultRate, sequence). NOT caste/category amounts.
 *
 * fee_categories
 *   Reservation / concession category (General, SC, EWS, …).
 *
 * fee_groups
 *   fee_category + fee_slab + validityType (SEMESTER | ACADEMIC_YEAR | …).
 *   Used when mapping students to payable groups per promotion.
 *
 * fee_structures
 *   Payable template for AY + program_course + class (semester) + shift.
 *   Components: fee_structure_components = fee_head × fee_slab × amount.
 *   Installments: fee_structure_installments.
 *   isPublished, start/end, onlineStart/onlineEnd control structure lifecycle.
 *
 * fee_group_promotion_mappings
 *   Links fee_group ↔ promotion (program batch semester row).
 *
 * fee_student_mappings
 *   Student ↔ fee_structure ↔ fee_group_promotion_mapping (+ FULL | INSTALLMENT).
 *
 * academic_activities + academic_activity_scopes
 *   Operational rules (e.g. master "Semester Fee Payment"): per stream/class
 *   startDate, endDate, isEnabled. Student portal shows fee cards only when
 *   a matching scope is open — independent of fee_structures table FK.
 */

export const SEMESTER_FEE_PAYMENT_MASTER_NAME = "semester fee payment";
