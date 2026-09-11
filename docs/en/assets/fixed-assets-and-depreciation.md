# Fixed Assets Register & Depreciation Engine

## Overview
The Fixed Assets module maintains capital asset inventories, tracks historical acquisition costs, and executes automated monthly straight-line depreciation with strict salvage value clamping and balanced General Ledger postings.

---

## 1. Asset Categories & Configuration
Asset categories (`asset_categories`) define the default accounting profiles and useful life:
- **Useful Life:** Configured in months (e.g., 48 months for IT equipment, 60 months for office furniture).
- **Default General Ledger Accounts:**
  - **Asset Account:** Code `1500 Fixed Assets - Equipment & Tech`
  - **Accumulated Depreciation (Contra-Asset):** Code `1590 Accumulated Depreciation`
  - **Depreciation Expense Account:** Code `5300 Depreciation Expense`

---

## 2. Straight-Line Depreciation Engine
Fixed assets (`fixed_assets`) track:
- `acquisition_cost`: Historical purchase cost.
- `salvage_value`: Estimated residual scrap value.
- `useful_life_months`: Lifespan in months.
- `accumulated_depreciation`: Total depreciation recognized to date.
- `net_book_value`: Current carrying value:
  $$\text{Net Book Value} = \text{Acquisition Cost} - \text{Accumulated Depreciation}$$

### Monthly Depreciation Calculation & Clamping Invariant
$$\text{Base Depreciable Amount} = \text{Acquisition Cost} - \text{Salvage Value}$$
$$\text{Standard Monthly} = \frac{\text{Base Depreciable Amount}}{\text{Useful Life Months}}$$
$$\text{Remaining Depreciable} = \text{Net Book Value} - \text{Salvage Value}$$
$$\text{Monthly Depreciation} = \min(\text{Standard Monthly}, \text{Remaining Depreciable})$$

**Invariants:**
- An asset's Net Book Value will **never** dip below its configured `salvage_value`.
- When $\text{Net Book Value} \le \text{Salvage Value}$, the asset status automatically transitions to `fully_depreciated`.

---

## 3. General Ledger Posting
When executing an Asset Depreciation Run (`DEP-YYYY-MM`):
- **Debit:** `5300 Depreciation Expense` (operating depreciation expense)
- **Credit:** `1590 Accumulated Depreciation` (credit contra-asset offsetting fixed asset balance)
- Creates detailed audit records in `asset_depreciation_entries` linked to the central `JournalEntry`.
