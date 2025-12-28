# 🔐 Security Fix: Remove Firebase Credentials from Git History

## ⚠️ CRITICAL SECURITY ISSUE

Your Firebase credentials (API keys, Client IDs) are **currently accessible** in git history, even though the file is now in `.gitignore`.

**Exposed in commit:** `96a65a9` (and potentially others)

---

## 🎯 Two Options to Fix This

### Option A: Remove from Git History (Recommended) ⭐

This completely removes the sensitive file from all git history.

**⚠️ WARNING:** This rewrites git history. If others have cloned this repo, coordinate with them first.

#### Step 1: Install BFG Repo-Cleaner (Easiest Method)

```bash
# Install BFG (faster and safer than git filter-branch)
brew install bfg

# Navigate to your repo
cd /Users/caglabuyukkocsutluoglu/Documents/builds/one-sentence-journal

# Remove the file from all commits
bfg --delete-files GoogleService-Info.plist

# Clean up the history
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

#### Step 2: Force Push (⚠️ Destructive - warn team first!)

```bash
# Force push to remote (this is destructive!)
git push origin --force --all
git push origin --force --tags
```

#### Step 3: Verify the file is gone

```bash
# This should return nothing
git log --all --full-history --oneline -- "*GoogleService-Info.plist"
```

---

### Option B: Rotate Credentials (If history removal isn't possible)

If you can't rewrite history (e.g., public repo with many clones), rotate the credentials instead:

#### Step 1: Go to Firebase Console

1. Visit https://console.firebase.google.com
2. Select project: **one-sentence-9a5ee**
3. Go to **Project Settings** → **General**

#### Step 2: Remove & Re-add iOS App

1. Scroll to "Your apps" section
2. Find the iOS app (Bundle ID: `com.walruscreativeworks.onesentence`)
3. Click the **trash icon** to delete it
4. Click **"+ Add app"** → **iOS**
5. Enter the same Bundle ID: `com.walruscreativeworks.onesentence`
6. Download the new `GoogleService-Info.plist`

#### Step 3: Replace the file locally

```bash
# The file should already be in the correct location, but verify:
# ios/App/GoogleService-Info.plist (NOT committed to git)

# Verify .gitignore still excludes it:
grep "GoogleService-Info.plist" .gitignore
```

#### Step 4: Test the app

```bash
# Sync to iOS
npx cap sync ios

# Open in Xcode and test
npx cap open ios
```

---

## 🛡️ Prevention (Already Implemented ✅)

A pre-commit hook has been installed at `.git/hooks/pre-commit` that will **prevent** you from accidentally committing these files again:

```bash
# Test the hook (should fail)
git add ios/App/GoogleService-Info.plist 2>/dev/null
git commit -m "test"
# ❌ ERROR: GoogleService-Info.plist cannot be committed!
```

---

## 🔍 Current Status

### What's Protected Now:
- ✅ `.gitignore` includes Firebase config files
- ✅ Pre-commit hook prevents future commits
- ✅ GoogleService-Info.plist is NOT in current working tree

### What's Still Vulnerable:
- ⚠️ **Git history still contains the credentials** (commits 96a65a9 and earlier)
- ⚠️ Anyone who clones the repo can access: `git show 96a65a9:ios/App/GoogleService-Info.plist`

---

## 📊 Exposed Credentials (From Commit 96a65a9)

```
API_KEY: AIzaSyCJDjFhU1S8JEbH5u3WT91GZ2WvKyFsNYY
CLIENT_ID: 300506798842-mo0k6d8mmmig8dtphrtt9u5iunhnvvfv.apps.googleusercontent.com
PROJECT_ID: one-sentence-9a5ee
```

**Risk Level:** 🟡 **MEDIUM**
- These are client-side keys (less dangerous than server keys)
- Firebase Security Rules protect your database
- Still recommended to rotate for best practices

---

## ✅ Recommended Action Plan

1. **Immediate (Today):**
   - ✅ Pre-commit hook installed
   - Choose Option A or B above

2. **Within 1 Week:**
   - Clean git history (Option A) **OR**
   - Rotate credentials (Option B)

3. **Before App Store Submission:**
   - Verify credentials are rotated/removed
   - Test app with new credentials
   - Document this fix in security audit

---

## 🤔 FAQ

**Q: Is my app currently vulnerable?**  
A: The exposed keys are **client-side** Firebase keys. Your Firestore Security Rules protect the actual data. However, it's still best practice to rotate them.

**Q: Will rotating credentials break my existing users?**  
A: Yes, **temporarily**. Users will need to update to the new version with new credentials. Plan for this carefully.

**Q: Can I just ignore this?**  
A: Not recommended. Apple may flag this during App Store review if they audit your git history.

**Q: What if I can't use BFG or git filter-branch?**  
A: Use Option B (rotate credentials). It's safer than leaving old credentials in history.

---

## 📝 After Completing the Fix

Update your audit document:

```markdown
## Issue #7: RESOLVED ✅

**Date Fixed:** [Today's date]
**Method Used:** [Option A or Option B]
**Verification:** Credentials rotated and/or removed from git history
**Prevention:** Pre-commit hook installed at .git/hooks/pre-commit
```

---

**Need Help?** This is a critical security issue. If you're unsure about any step, ask before proceeding.
