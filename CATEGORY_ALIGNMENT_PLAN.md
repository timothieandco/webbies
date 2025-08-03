# Category Alignment Plan

## 🎯 **Target Categories** (Your Request)
1. **Necklaces** - Chain bases and necklace components
2. **Bracelets** - Bracelet chains and components  
3. **Charms** - Decorative elements, pendants, charms
4. **Keychains** - Keychain components, carabiners
5. **Earrings** - Earring components and findings
6. **Accessories** - Bag accessories and other items

## 📊 **Current Categories** (In Database)
Based on import analysis:
- `chains` (bracelet_chains: 7, necklace_chains: 1) = **8 items**
- `accessories` (bag_accessories) = **1 item**  
- `charms` (pendants) = **1 item**
- `earrings` (earring_components) = **2 items**
- `findings` (connectors) = **2 items**

**Total visible: 14 items** (but you imported 135 items!)

## 🚨 **Major Issue Identified**

Only 14 items were assigned proper categories, meaning **121 items are uncategorized**! The auto-categorization function didn't run or didn't match most titles.

## 🔧 **Solution Plan**

### Step 1: Fix Category Assignment in Database
Update the categorization logic to be more comprehensive and align with your desired categories.

### Step 2: Update Code References  
Align all category constants in the codebase.

### Step 3: Update UI Labels
Ensure the frontend uses the correct category names.

## 📋 **Implementation Steps**

1. **Run improved categorization SQL** to assign all 135 items
2. **Update category constants** in JavaScript files
3. **Verify category mapping** in data transformers
4. **Test frontend** to ensure categories display correctly

## 🎯 **Expected Final Categories**

After fixes:
- **Necklaces** (~15-25 items) - Chains, necklace bases
- **Bracelets** (~20-30 items) - Bracelet chains, extenders  
- **Charms** (~30-40 items) - Pendants, decorative charms
- **Keychains** (~20-25 items) - Carabiners, key rings
- **Earrings** (~15-20 items) - Earring components, findings
- **Accessories** (~20-25 items) - Bag accessories, miscellaneous
- **Materials** (~10-15 items) - Wire, beads, findings

Total: ~135 items properly categorized