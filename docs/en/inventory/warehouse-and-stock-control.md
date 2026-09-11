# Warehouse Management & Stock Controls

## Overview
The Warehouse and Distribution subsystem provides full visibility and control over multi-warehouse storage, inter-facility stock transfers, inventory variances, and immutable audit ledgers.

---

## 1. Multi-Warehouse Hierarchy
- **Legal Entity (Company):** Warehouses belong to specific companies under a tenant.
- **Branches:** Warehouses can be associated with specific operational branches (e.g. Riyadh Central WH under Branch Riyadh HQ).
- **Storage Locations:** Each warehouse contains one or multiple bin/shelf locations (e.g., `DEFAULT`, `BIN-01`, `COLD-STORE`).

---

## 2. Inter-Warehouse Stock Transfers

When transferring stock between two warehouses within the same legal company:
1. **Source Warehouse ($W_1$):**
   - Stock is issued at $W_1$'s prevailing moving weighted-average cost.
   - An immutable `transfer_out` movement is recorded.
2. **Destination Warehouse ($W_2$):**
   - Stock is received at the identical unit cost from $W_1$, updating $W_2$'s moving-average cost.
   - An immutable `transfer_in` movement is recorded.
3. **Valuation Invariant:**
   - Because the transfer is internal between facilities of the same legal entity, total inventory value in Account `1300` remains identical. No revenue or artificial intercompany gain/loss is generated.

---

## 3. Stock Adjustments & Physical Inventory Counts

Discrepancies between physical counts and system balances are booked via **Stock Adjustments**:

### A. Positive Adjustment (Inventory Gain)
- **Physical Reason:** Excess discovered during cycle count, surplus recovery.
- **Stock Movement:** Type `adjustment`, direction `in`.
- **GL Effect:**
  - **DR 1300 Merchandise Inventory**
  - **CR 5900 Inventory Variance & Adjustments**

### B. Negative Adjustment (Inventory Shrinkage / Damage)
- **Physical Reason:** Broken item, expired product, physical shrinkage.
- **Stock Movement:** Type `adjustment`, direction `out` (issued at existing average cost).
- **GL Effect:**
  - **DR 5900 Inventory Variance & Adjustments**
  - **CR 1300 Merchandise Inventory**

---

## 4. Immutable Stock Movement Ledger
Every physical inventory transition creates an append-only, immutable `StockMovement` entry capturing:
- Unique movement number (`SM-IN-...` / `SM-OUT-...`)
- Movement type (`receipt`, `issue`, `transfer_in`, `transfer_out`, `adjustment`)
- Exact quantity and unit cost
- Pre-movement and post-movement on-hand quantities
- Pre-movement and post-movement moving-average unit costs
- Polymorphic reference to source document (`GoodsReceipt`, `StockTransfer`, `StockAdjustment`, `Invoice`)
- Linked General Ledger `journal_entry_id`.
