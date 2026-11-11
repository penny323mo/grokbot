# Location Flow Feature Map · 就近 (Just Around)

## Scope
Verification of the 「用我嘅位置」 (Use My Location) control, geolocation request handling, permission/error reporting, retry semantics, and default origin fallback for mobile civic wayfinding.

## Scenarios

### 1. User Gesture Initiation
- **Trigger**: Click / tap on `#btn-locate` (labelled 「用我嘅位置」).
- **Behaviour**:
  - Starts geolocation query synchronously within the user gesture handler.
  - Does not prematurely disable the button or drop user gesture activation tokens required by WebKit / iPhone Safari.
  - Displays transient reading state (`讀取緊…`, `aria-busy="true"`).

### 2. Geolocation Success (Simulated Fix)
- **Precondition**: Browser returns valid coordinates (e.g. simulated Senado Square / Macau coordinates `lat: 22.1937, lon: 113.5406` or simulated Hong Kong coordinates).
- **Behaviour**:
  - Origin coordinates updated to the returned fix.
  - Origin label updated honestly (`以你嘅實際定位為起點` / `你嘅位置`).
  - Map marker and center updated.
  - Locate button reset to idle state (`用我嘅位置`) and remains usable for subsequent manual refreshes.
  - All test artifacts explicitly label simulated fixes as simulated.

### 3. Permission Denied (Error Code 1)
- **Precondition**: `navigator.geolocation.getCurrentPosition` emits `PERMISSION_DENIED` (`code: 1`).
- **Behaviour**:
  - Displays honest Cantonese copy: `定位未獲授權，你可以重試，或用議事亭前地做起點`.
  - Does not invent system settings instructions.
  - Locate button reset to idle state (`用我嘅位置`), enabling user to retry at any time.
  - Default origin 議事亭前地 remains active or readily selectable.

### 4. Position Unavailable (Error Code 2)
- **Precondition**: `navigator.geolocation.getCurrentPosition` emits `POSITION_UNAVAILABLE` (`code: 2`).
- **Behaviour**:
  - Displays honest Cantonese copy: `暫時未能獲取位置（訊號未能定位），你可以重試，或用議事亭前地做起點`.
  - Does NOT falsely accuse the user of denying authorization.
  - Locate button reset to idle state (`用我嘅位置`), enabling user to retry.
  - Default origin 議事亭前地 remains active or selectable.

### 5. Timeout (Error Code 3)
- **Precondition**: High accuracy GPS fix times out (`code: 3`).
- **Behaviour**:
  - Attempts standard accuracy fallback or displays honest Cantonese copy: `定位逾時（訊號較弱），你可以重試，或用議事亭前地做起點`.
  - Does NOT falsely accuse the user of denying authorization.
  - Locate button reset to idle state (`用我嘅位置`), enabling user to retry.
  - Default origin 議事亭前地 remains active or selectable.

### 6. Geolocation API Missing / Insecure Context
- **Precondition**: `navigator.geolocation` undefined, null, or `window.isSecureContext === false`.
- **Behaviour**:
  - Displays honest Cantonese copy: `瀏覽器未支援定位功能，已預設用議事亭前地做起點` (or HTTPS context requirement).
  - Default origin 議事亭前地 remains active as reliable fallback.

### 7. Retry After Failure
- **Precondition**: Geolocation previously failed with code 1, 2, or 3.
- **Behaviour**:
  - User can tap `#btn-locate` again.
  - A new geolocation request is initiated.
  - If subsequent attempt succeeds, origin updates properly.

### 8. Default Origin Fallback Remains Available
- **Precondition**: Any location state (initial, failed, or moved).
- **Behaviour**:
  - 議事亭前地 (22.1937, 113.5406) is preserved as the default origin.
  - User can continue using or return to 議事亭前地 without hindrance.
