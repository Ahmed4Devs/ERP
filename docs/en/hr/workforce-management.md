# Workforce & Human Resources Management

## Overview
The Human Resources (HR) subsystem in the ERP manages organizational structures, employee master records, job designations, compensation packages, and daily attendance records across multi-tenant and multi-company operations.

---

## 1. Organizational Hierarchy & Scoping
All HR entities are strictly tenant-isolated and scoped to legal entities (`Company`):
- **Departments (`departments`):** Functional divisions (e.g. IT, Operations, Finance) with optional assigned managers and hierarchical relationships.
- **Designations (`designations`):** Official job titles and role specifications (e.g. Senior Software Engineer, Operations Manager).
- **Branch Association:** Employees are associated with operational branches while maintaining legal entity reporting.

---

## 2. Employee Profile & Compensation Structure
Each employee contract defines:
- **Unique Identification:** Company-scoped `employee_number`, bilingual names (`first_name`, `last_name`, `first_name_ar`, `last_name_ar`), national ID/Iqama, contact details, and hire date.
- **Salary Components:**
  - `basic_salary`: Core contractual base salary.
  - `housing_allowance`: Monthly housing stipend.
  - `transport_allowance`: Monthly commuting stipend.
  - `other_allowances`: Specialized or executive stipends.
  - **Gross Salary:**
    $$\text{Gross Salary} = \text{Basic} + \text{Housing} + \text{Transport} + \text{Other}$$
- **Disbursement Channel:** Bank name and IBAN account number for direct electronic disbursement.

---

## 3. Attendance Tracking & Overtime
The attendance module logs daily presence and timesheets:
- **Statuses:** `present`, `absent`, `late`, `leave`, `half_day`.
- **Working Hours:** Tracks regular hours (standard 8.0 hrs) and overtime hours.
- **Overtime Valuation:** Integrated with monthly payroll calculation:
  $$\text{Hourly Rate} = \frac{\text{Basic Salary}}{240 \text{ hours}}$$
  $$\text{Overtime Amount} = \text{Hourly Rate} \times 1.5 \times \text{Overtime Hours}$$
