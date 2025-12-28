# 🔄 Firebase Remote Config Setup for Update Mechanism

## Overview

The app now has a version checking mechanism using Firebase Remote Config. This allows you to:
- **Force users to update** for critical security patches
- **Recommend updates** for new features without blocking the app
- **Customize update messages** remotely without releasing a new version

---

## ✅ What's Implemented

### 1. Version Check Utility
- **File:** `src/utils/versionCheck.js`
- **Features:**
  - Semantic version comparison (1.0.0 vs 1.0.1)
  - Fetches remote config from Firebase
  - Determines if update is required or recommended
  - Logs analytics events for monitoring

### 2. Update Modal UI
- **Location:** `src/App.jsx`
- **Features:**
  - Blocking modal for required updates
  - Dismissible modal for recommended updates
  - Deep link to App Store (needs App Store ID)
  - Dark mode support
  - Accessibility labels

### 3. Automatic Checks
- **Triggers:**
  - When user logs in
  - Every hour while app is open
- **Non-blocking:** If Remote Config fails, app continues normally

---

## 🚀 Firebase Console Setup

### Step 1: Enable Remote Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **one-sentence-9a5ee**
3. In the left sidebar, click **Remote Config**
4. Click **"Create configuration"** if this is your first time

### Step 2: Add Configuration Parameters

Create these 4 parameters:

#### Parameter 1: `ios_min_version`
```
Key: ios_min_version
Default value: 1.0.0
Value type: String
Description: Minimum version required to use the app
```

#### Parameter 2: `ios_recommended_version`
```
Key: ios_recommended_version
Default value: 1.0.0
Value type: String
Description: Latest version with new features
```

#### Parameter 3: `force_update`
```
Key: force_update
Default value: false
Value type: String (not Boolean - use "true" or "false")
Description: Whether to force all users to update
```

#### Parameter 4: `update_message`
```
Key: update_message
Default value: A new version of the app is available with improvements and bug fixes.
Value type: String
Description: Message shown to users in the update modal
```

### Step 3: Publish Configuration

1. Click **"Publish changes"** in the top right
2. Add a description: "Initial version config setup"
3. Click **"Publish"**

---

## 📱 How It Works

### Normal Operation (No Update Needed)
```
Current Version: 1.0.0
Min Version: 1.0.0
Recommended Version: 1.0.0
→ No modal shown, app works normally
```

### Recommended Update
```
Current Version: 1.0.0
Min Version: 1.0.0
Recommended Version: 1.1.0
→ Dismissible modal shown
→ User can click "Remind Me Later"
```

### Required Update (Critical)
```
Current Version: 1.0.0
Min Version: 1.0.1
→ Blocking modal shown
→ User MUST update to continue
→ "Remind Me Later" button hidden
```

---

## 🔧 When to Update Remote Config

### Scenario 1: New Feature Release (Optional Update)
**Example:** You release version 1.1.0 with new features

1. Go to Remote Config in Firebase Console
2. Edit `ios_recommended_version` → Change to `1.1.0`
3. Edit `update_message` → "New features available! Update to see what's new."
4. Keep `ios_min_version` at `1.0.0`
5. Keep `force_update` at `false`
6. Publish changes

**Result:** Users see a dismissible prompt suggesting they update.

---

### Scenario 2: Critical Bug Fix (Required Update)
**Example:** You discover a data loss bug in version 1.0.0

1. Release version 1.0.1 with the fix to App Store
2. Go to Remote Config in Firebase Console
3. Edit `ios_min_version` → Change to `1.0.1`
4. Edit `update_message` → "Critical update required. Please update immediately."
5. Keep `force_update` at `false` (min_version handles this)
6. Publish changes

**Result:** Users on 1.0.0 CANNOT use the app until they update.

---

### Scenario 3: Emergency Force Update
**Example:** Security vulnerability found, need everyone to update NOW

1. Edit `force_update` → Change to `true`
2. Edit `update_message` → "Security update required. Please update now."
3. Optionally update `ios_min_version` if you have a new version ready
4. Publish changes

**Result:** ALL users see a blocking update modal immediately.

---

## 🧪 Testing the Update Mechanism

### Test Required Update

1. In Firebase Console Remote Config, set:
   ```
   ios_min_version: 1.0.1
   update_message: "Test: Required update"
   ```
2. Publish changes
3. Open the app (current version is 1.0.0)
4. You should see a blocking modal
5. **Important:** Change it back to `1.0.0` after testing!

### Test Recommended Update

1. In Firebase Console Remote Config, set:
   ```
   ios_recommended_version: 1.1.0
   update_message: "Test: Recommended update"
   ios_min_version: 1.0.0
   ```
2. Publish changes
3. Open the app
4. You should see a dismissible modal
5. Click "Remind Me Later" - modal closes
6. Change back to `1.0.0` after testing

### Test Force Update

1. Set `force_update: true`
2. Publish
3. Open app
4. Should see blocking modal
5. **IMPORTANT:** Set back to `false` immediately!

---

## ⚠️ Important Notes

### 1. Update App Store ID

The update URL currently has a placeholder:
```javascript
updateUrl: 'itms-apps://itunes.apple.com/app/id[YOUR_APP_ID]'
```

**After App Store submission**, update `src/utils/versionCheck.js`:
```javascript
updateUrl: 'itms-apps://itunes.apple.com/app/id1234567890' // Replace with real ID
```

### 2. Coordinate Updates

**CRITICAL:** Always ensure the new version is **live on the App Store** BEFORE setting `ios_min_version` in Remote Config.

**Bad sequence:**
1. Set `ios_min_version: 1.0.1` in Remote Config
2. Submit version 1.0.1 to App Store (still in review)
3. ❌ All users are locked out waiting for approval!

**Good sequence:**
1. Submit version 1.0.1 to App Store
2. Wait for App Store approval
3. Confirm version 1.0.1 is live
4. Then update `ios_min_version: 1.0.1` in Remote Config

### 3. Remote Config Caching

- Config is cached for **1 hour** by default
- Users may not see changes immediately
- For urgent updates, wait 1-2 hours after publishing Remote Config

### 4. Version Number Format

- Must use semantic versioning: `MAJOR.MINOR.PATCH`
- Examples: `1.0.0`, `1.0.1`, `1.1.0`, `2.0.0`
- Don't use: `1.0`, `v1.0.0`, `1.0.0-beta`

---

## 📊 Monitoring

### Analytics Events

The app logs these events to Firebase Analytics:

```javascript
event: 'update_check'
parameters: {
  required: true/false,
  recommended: true/false,
  current_version: "1.0.0",
  min_version: "1.0.1",
  recommended_version: "1.1.0"
}
```

**Use this to:**
- Track how many users see update prompts
- Identify users on old versions
- Monitor update adoption rates

### Check Remote Config Status

1. Go to Firebase Console → Remote Config
2. Click on any parameter
3. See "Last fetch time" for each user

---

## 🎯 Best Practices

### 1. Version Naming Strategy
```
1.0.0 - Initial release
1.0.1 - Bug fixes
1.1.0 - New features
2.0.0 - Breaking changes
```

### 2. Update Message Examples

**Bug Fix:**
```
"We fixed a bug that was causing issues. Please update to ensure everything works smoothly."
```

**New Features:**
```
"New features available! Update to discover what's new in this version."
```

**Security:**
```
"Important security update. Please update immediately to keep your data safe."
```

**Critical:**
```
"Critical update required. This version fixes a major issue affecting data integrity."
```

### 3. Gradual Rollout (Advanced)

Firebase Remote Config supports **conditions** for gradual rollouts:

1. Create condition: "10% of users"
2. Set `ios_recommended_version: 1.1.0` for 10%
3. Monitor analytics for issues
4. Increase to 50%, then 100%

---

## 🔍 Troubleshooting

### Problem: Users not seeing update prompt

**Checks:**
1. Has Remote Config been published?
2. Has 1 hour passed since last fetch?
3. Is user logged in? (check only runs for authenticated users)
4. Check browser console for errors

### Problem: Update URL not working

**Solution:** 
1. Verify App Store ID is correct
2. On iOS, use `itms-apps://` scheme
3. Test URL: `itms-apps://itunes.apple.com/app/id1234567890`

### Problem: Modal showing incorrectly

**Debug:**
1. Check current version in `package.json`
2. Check Remote Config values in Firebase Console
3. Clear app cache and localStorage
4. Check console logs for version comparison results

---

## 📝 Checklist Before App Store Submission

- [ ] Remote Config enabled in Firebase Console
- [ ] All 4 parameters created with correct default values
- [ ] Configuration published
- [ ] Update mechanism tested with mock values
- [ ] App Store ID placeholder noted for post-submission update
- [ ] Team knows how to update Remote Config in emergency
- [ ] Analytics events verified in Firebase Console

---

## 🚨 Emergency Procedures

### If You Need to Lock Out All Users Immediately

1. Go to Firebase Console → Remote Config
2. Set `force_update: true`
3. Set `update_message: [Your message]`
4. Click **"Publish changes"**
5. Wait 1-2 hours for all users to fetch new config

### If You Published Wrong Config

1. Click **"Rollback"** in Remote Config
2. Select previous version
3. Publish immediately

---

## ✅ Issue #8 Complete

**Status:** ✅ **IMPLEMENTED**

- Version check utility created
- Update modal UI added
- Firebase Remote Config integrated
- Analytics logging included
- Documentation complete

**Next Steps:**
1. Test locally with mock Remote Config values
2. Set up Remote Config in Firebase Console
3. After App Store approval, update App Store ID in code
4. Monitor analytics for update prompts

---

**Questions?** Review Firebase Remote Config docs: https://firebase.google.com/docs/remote-config
