# Perpetual Moving Weighted-Average Inventory Valuation

## Overview
The system implements a **Perpetual Moving Weighted-Average Costing Engine** for storable merchandise inventory. Under perpetual moving-average costing, the cost per unit of each inventory item is recomputed dynamically every time a new receipt is posted to the warehouse subledger.

Issues, sales, transfers, and outbound deductions consume stock at the prevailing moving-average unit cost without mutating the unit cost.

---

## 1. Valuation Mathematics

### A. Inbound Receipt (Cost Recalculation)
When new inventory quantity $Q_{\text{in}}$ is received at an acquisition unit cost of $C_{\text{in}}$:

$$V_{\text{new}} = V_{\text{old}} + (Q_{\text{in}} \times C_{\text{in}})$$

$$Q_{\text{new}} = Q_{\text{old}} + Q_{\text{in}}$$

$$C_{\text{new}} = \frac{V_{\text{new}}}{Q_{\text{new}}}$$

Where:
- $Q_{\text{old}}$: Previous quantity on hand in warehouse
- $C_{\text{old}}$: Previous moving-average cost per unit
- $V_{\text{old}} = Q_{\text{old}} \times C_{\text{old}}$: Previous total valuation
- $Q_{\text{new}}$: New quantity on hand
- $C_{\text{new}}$: Newly established moving-average cost per unit

### B. Outbound Issue (Cost Preservation)
When stock $Q_{\text{out}}$ is issued from the warehouse:
- The unit cost applied to the issue is the prevailing moving-average unit cost: $C_{\text{issue}} = C_{\text{old}}$.
- Total cost deducted: $V_{\text{out}} = Q_{\text{out}} \times C_{\text{old}}$.
- Remaining quantity: $Q_{\text{new}} = Q_{\text{old}} - Q_{\text{out}}$.
- Remaining total value: $V_{\text{new}} = Q_{\text{new}} \times C_{\text{old}}$.
- **Crucial Invariant:** Unit moving-average cost $C$ remains completely unchanged upon issue.

---

## 2. Numeric Precision & Non-Negative Invariant

1. **Exact 6-Decimal Precision:**
   All quantities, unit costs, and valuations are persisted as `NUMERIC(24,6)` and computed using PHP `bcmath` functions (`bcadd`, `bcsub`, `bcmul`, `bcdiv`, `bccomp`) to eliminate IEEE-754 floating-point rounding drifts.

2. **Strict Non-Negative Stock Invariant:**
   Negative inventory levels distort moving-average mathematics and violate GAAP/IFRS perpetual inventory rules.
   - **Database Layer:** Protected by PostgreSQL check constraints:
     ```sql
     ALTER TABLE inventory_levels ADD CONSTRAINT chk_inventory_levels_non_negative_stock CHECK (quantity_on_hand >= 0);
     ALTER TABLE inventory_levels ADD CONSTRAINT chk_inventory_levels_non_negative_reserved CHECK (quantity_reserved >= 0);
     ALTER TABLE inventory_levels ADD CONSTRAINT chk_inventory_levels_non_negative_cost CHECK (moving_average_cost >= 0);
     ```
   - **Application Layer:** `InventoryCostingEngine` checks available stock with `lockForUpdate()` and throws `InsufficientStockException` before any state transition occurs.

---

## 3. General Ledger Reconciliation

The subledger valuation is maintained in real-time and reconciles with the General Ledger Control Account `1300 Merchandise Inventory`:

$$\sum_{\text{all items}} (\text{quantity\_on\_hand} \times \text{moving\_average\_cost}) = \text{GL Account 1300 Current Balance}$$

The `InventoryValuationQuery` computes this subledger total across all warehouses and products and directly checks the balance of Account 1300, confirming zero variance in real time.
