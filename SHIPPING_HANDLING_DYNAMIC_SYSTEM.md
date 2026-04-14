# Shipping and Handling Dynamic System ✅

## Overview
The Shipping and Handling percentage configured by admin in Platform Settings is now fully dynamic and applies across the entire system.

## How It Works

### 1. Admin Configuration
**Location**: Admin Panel → Platform Settings → Other Charges

**Field**: Shipping and Handling (%)
- Range: 0-100%
- Default: 0% (FREE shipping)
- Stored in: Firebase `adminProfiles/{adminUid}.defaultShippingHandlingPercent`

### 2. Calculation Method

The shipping charge is calculated in two parts:

#### A. Base Shipping Cost
Calculated by `calculateShippingEstimate()` based on:
- **Pincode zone** (Metro vs Non-Metro)
- **Weight** (default 0.5kg per item)
- **Item count**

**Formula**:
```javascript
baseShipping = (baseRate + (weight * perKgRate) + ((itemCount - 1) * perItemRate)) * zoneMultiplier

Where:
- baseRate = ₹40
- perKgRate = ₹20/kg
- perItemRate = ₹10/item (after first)
- zoneMultiplier = 1.0 (metro) or 1.2 (non-metro)
```

#### B. Handling Charge (Admin Configured)
Applied as percentage of cart subtotal:

```javascript
handlingCharge = (cartSubtotal * shippingHandlingPercent) / 100
```

#### C. Final Shipping Charge
```javascript
finalShippingCharge = baseShipping + handlingCharge
```

### 3. Example Calculations

#### Example 1: 0% Handling (FREE Shipping)
```
Admin Setting: 0%
Cart Subtotal: ₹1,000
Base Shipping: ₹80
Handling Charge: ₹1,000 × 0% = ₹0
Final Shipping: ₹80 + ₹0 = ₹80
```

#### Example 2: 5% Handling
```
Admin Setting: 5%
Cart Subtotal: ₹1,000
Base Shipping: ₹80
Handling Charge: ₹1,000 × 5% = ₹50
Final Shipping: ₹80 + ₹50 = ₹130
```

#### Example 3: 10% Handling
```
Admin Setting: 10%
Cart Subtotal: ₹2,500
Base Shipping: ₹100
Handling Charge: ₹2,500 × 10% = ₹250
Final Shipping: ₹100 + ₹250 = ₹350
```

## Implementation Details

### Backend

#### 1. Admin Config Service
**File**: `backend/src/shared/services/adminConfigService.js`

```javascript
{
  defaultShippingHandlingPercent: adminProfile.defaultShippingHandlingPercent ?? 0,
  // ... other config
}
```

- Loads from Firebase
- Cached for 30 minutes
- Invalidated on admin update

#### 2. Shipping Estimate Controller
**File**: `backend/src/modules/shipping/controllers/shippingEstimateController.js`

**Endpoint**: `POST /shipping/estimate`

**Process**:
1. Get admin config (with shipping handling %)
2. Calculate base shipping from pincode/weight
3. Calculate cart subtotal
4. Apply handling percentage
5. Return final shipping charge with breakdown

**Response**:
```json
{
  "success": true,
  "shippingCharge": 130,
  "estimatedDeliveryDays": "2-4 days",
  "courierName": "Standard Delivery",
  "breakdown": {
    "baseShipping": 80,
    "handlingPercent": 5,
    "handlingCharge": 50,
    "total": 130
  }
}
```

#### 3. Admin Profile Controller
**File**: `backend/src/modules/admin/controllers/adminProfileController.js`

**Endpoint**: `PUT /admin/profile`

**Validation**:
- Must be between 0-100%
- Saved to Firebase
- Cache invalidated immediately

### Frontend

#### 1. Platform Settings Tab
**File**: `frontend/src/modules/admin/components/PlatformSettingsTab.jsx`

**Features**:
- Edit/Save/Cancel buttons
- Real-time validation (0-100%)
- Shows "FREE shipping" when 0%
- Shows percentage when > 0%

**UI**:
```
Other Charges
├── Shipping and Handling (%)
│   ├── Input: [5.0] %
│   └── Label: "— 5% applied at checkout"
└── [Edit] [Save] [Cancel]
```

#### 2. Checkout Page
**File**: `frontend/src/modules/marketplace/pages/Checkout.jsx`

**Process**:
1. User enters shipping address
2. Frontend calls `/shipping/estimate` with:
   - Shipping address (pincode)
   - Cart items
   - Total weight
3. Backend calculates with admin's handling %
4. Frontend displays final shipping charge
5. Included in order total

#### 3. Order Summary
**File**: `frontend/src/modules/marketplace/components/Checkout/CheckoutOrderSummary.jsx`

**Display**:
```
Order Summary
├── Product Total: ₹1,000
├── Platform Fee: ₹35
├── Service GST: ₹6.30
├── Shipping: ₹130  ← Includes handling charge
└── Total: ₹1,171.30
```

## Where It's Applied

### ✅ 1. Checkout Shipping Estimation
- User enters address
- System calculates shipping with handling %
- Displays in order summary

### ✅ 2. Order Placement
- Shipping charge passed to backend
- Stored in order document
- Used for invoice generation

### ✅ 3. Invoice PDF
- Shows shipping charge
- Includes in total calculation
- Displayed to customer

### ✅ 4. Email Notifications
- Order confirmation email
- Shows shipping charge
- Breakdown included

### ✅ 5. Order History
- Displays shipping charge
- Shows in order details
- Consistent across views

## Update Flow

```
Admin Updates Shipping %
       ↓
Frontend sends PUT /admin/profile
       ↓
Backend validates (0-100%)
       ↓
Saves to Firebase
       ↓
Invalidates cache
       ↓
Next shipping estimate uses new %
       ↓
Applied in:
  - Checkout estimation
  - Order placement
  - Invoice generation
  - Email notifications
  - Order displays
```

## Testing Guide

### Test 1: Set to 0% (FREE Shipping)
1. Go to Platform Settings → Other Charges
2. Click "Edit"
3. Set Shipping and Handling to 0%
4. Click "Save"
5. Go to consumer checkout
6. Add items to cart
7. Enter shipping address
8. Verify: Shipping shows base cost only (no handling charge)

### Test 2: Set to 5%
1. Set Shipping and Handling to 5%
2. Save
3. Go to checkout with ₹1,000 cart
4. Verify: Shipping = Base + (₹1,000 × 5%) = Base + ₹50

### Test 3: Set to 10%
1. Set Shipping and Handling to 10%
2. Save
3. Go to checkout with ₹2,000 cart
4. Verify: Shipping = Base + (₹2,000 × 10%) = Base + ₹200

### Test 4: Database Verification
1. Update shipping %
2. Check Firebase `adminProfiles` collection
3. Verify `defaultShippingHandlingPercent` field updated
4. Check timestamp updated

### Test 5: Cache Invalidation
1. Update shipping %
2. Immediately go to checkout
3. Verify new % is applied (not cached old value)

## API Reference

### Get Admin Config
```http
GET /admin/config/public

Response:
{
  "success": true,
  "config": {
    "defaultShippingHandlingPercent": 5,
    ...
  }
}
```

### Update Shipping %
```http
PUT /admin/profile

Body:
{
  "defaultShippingHandlingPercent": 5
}

Response:
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### Estimate Shipping
```http
POST /shipping/estimate

Body:
{
  "shippingAddress": {
    "pincode": "110001"
  },
  "cartItems": [
    { "price": 500, "quantity": 2 }
  ],
  "totalWeight": 1.0
}

Response:
{
  "success": true,
  "shippingCharge": 130,
  "breakdown": {
    "baseShipping": 80,
    "handlingPercent": 5,
    "handlingCharge": 50,
    "total": 130
  }
}
```

## Key Files

### Backend
- `backend/src/modules/shipping/controllers/shippingEstimateController.js` - Shipping calculation
- `backend/src/shared/services/adminConfigService.js` - Config management
- `backend/src/modules/admin/controllers/adminProfileController.js` - Update handler

### Frontend
- `frontend/src/modules/admin/components/PlatformSettingsTab.jsx` - Admin UI
- `frontend/src/modules/marketplace/pages/Checkout.jsx` - Checkout integration
- `frontend/src/modules/marketplace/components/Checkout/CheckoutOrderSummary.jsx` - Display

## Benefits

1. **Dynamic**: Admin can change shipping % without code changes
2. **Flexible**: Can set 0% for free shipping or any % for handling
3. **Transparent**: Breakdown shown in API response
4. **Cached**: Fast performance with automatic invalidation
5. **Consistent**: Same % applied across all order flows
6. **Real-time**: Changes reflect immediately after save

## Common Scenarios

### Scenario 1: Promotional Free Shipping
```
Set: 0%
Result: Only base shipping cost charged
Use: During sales/promotions
```

### Scenario 2: Standard Handling
```
Set: 3-5%
Result: Moderate handling charge
Use: Normal operations
```

### Scenario 3: Premium Handling
```
Set: 10-15%
Result: Higher handling charge
Use: Premium packaging/insurance
```

### Scenario 4: Cost Recovery
```
Set: Based on actual costs
Result: Covers packaging/handling expenses
Use: Break-even shipping model
```

## Troubleshooting

### Issue: Changes not applying
**Solution**:
- Check browser console for errors
- Verify Firebase connection
- Check backend logs
- Clear cache and retry

### Issue: Wrong calculation
**Solution**:
- Verify admin % is saved correctly
- Check cart subtotal calculation
- Review shipping estimate API response
- Check breakdown in response

### Issue: Old % still showing
**Solution**:
- Click Refresh in Platform Settings
- Clear browser cache
- Restart backend (cache rebuilds)
- Check Firebase for latest value

## Future Enhancements

1. **Zone-based Handling**: Different % for different zones
2. **Weight-based Handling**: Different % based on weight
3. **Category-based Handling**: Different % per product category
4. **Tiered Handling**: Different % based on cart value
5. **Free Shipping Threshold**: Auto 0% above certain amount
6. **Seller-specific Handling**: Different % per seller

---

**Status**: ✅ Fully Implemented and Dynamic
**Last Updated**: April 14, 2026
**Ready for**: Production Use
