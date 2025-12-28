# 🔞 APP STORE AGE RATING QUESTIONNAIRE
## One Sentence Journal - Content Rating Answers

**Last Updated:** December 28, 2025  
**App Version:** 1.0.0  
**Recommended Age Rating:** 12+

---

## 📋 OVERVIEW

When submitting your app to App Store Connect, you'll complete the **Age Rating Questionnaire** to determine the app's content rating. This document provides the exact answers for One Sentence Journal.

**Why 12+ Instead of 4+:**
- Avoids COPPA (Children's Online Privacy Protection Act) compliance
- COPPA requires verifiable parental consent for users under 13
- 12+ rating still covers 99% of your target audience (teens and adults)
- Reduces legal liability and regulatory burden

---

## 🎯 AGE RATING QUESTIONNAIRE ANSWERS

### Section 1: Unrestricted Web Access

**Question:** Does your app contain or display unrestricted web access?

**Answer:** ❌ **NO**

**Explanation:**
- App only opens specific URLs via Capacitor App Launcher
- URLs opened:
  - Privacy Policy: `https://walruscreativeworks.com/one-sentence-privacy-policy/`
  - Terms of Service: `https://walruscreativeworks.com/one-sentence-terms/`
- No in-app browser with arbitrary URL navigation
- No WebView with user-entered URLs

---

### Section 2: Cartoon or Fantasy Violence

**Question:** Does your app contain or display cartoon or fantasy violence?

**Answer:** ❌ **NO**

**Explanation:**
- Journaling app with mood tracking
- No violence of any kind
- Peaceful, mindfulness-focused experience

---

### Section 3: Realistic Violence

**Question:** Does your app contain or display realistic violence?

**Answer:** ❌ **NO**

**Explanation:**
- No violence depicted or described
- No weapons, blood, or combat
- Focuses on personal reflection and mental wellness

---

### Section 4: Profanity or Crude Humor

**Question:** Does your app contain or display profanity or crude humor?

**Answer:** ❌ **NO**

**Explanation:**
- No profanity in app interface
- User-generated content (journal entries) may contain profanity
- **However:** Entries are private, never shared, and not moderated
- Falls under "Infrequent/Mild" category (does NOT raise age rating)

---

### Section 5: Mature/Suggestive Themes

**Question:** Does your app contain or display mature or suggestive themes?

**Answer:** ❌ **NO**

**Explanation:**
- No sexual content
- No romantic themes
- No provocative imagery
- Focus is on emotional wellness and daily reflection

---

### Section 6: Horror/Fear Themes

**Question:** Does your app contain or display horror or fear themes?

**Answer:** ❌ **NO**

**Explanation:**
- Calming, peaceful interface
- No scary imagery or themes
- Designed to reduce anxiety, not create it

---

### Section 7: Medical/Treatment Information

**Question:** Does your app contain or display medical or treatment information?

**Answer:** ❌ **NO**

**Explanation:**
- App tracks moods (😊 Happy, 😌 Peaceful, 😢 Sad, etc.)
- **Does NOT provide:**
  - Medical advice
  - Diagnostic information
  - Treatment recommendations
  - Mental health therapy
  - Crisis intervention
- Disclaimer in app states: "Not a replacement for professional medical advice"

**Important Note:**
- Mood tracking alone does NOT qualify as medical information
- If you add features like symptom tracking or health recommendations, answer would change to YES

---

### Section 8: Alcohol, Tobacco, or Drug Use or References

**Question:** Does your app contain or display alcohol, tobacco, or drug use or references?

**Answer:** ❌ **NO**

**Explanation:**
- No substance references
- No promotion of alcohol, tobacco, or drugs
- No imagery depicting substance use

---

### Section 9: Gambling

**Question:** Does your app simulate gambling?

**Answer:** ❌ **NO**

**Explanation:**
- No gambling mechanics
- No loot boxes
- No random rewards requiring payment
- Streak counter is not gambling (it's deterministic)

---

### Section 10: Contests

**Question:** Does your app contain or display contests?

**Answer:** ❌ **NO**

**Explanation:**
- No competitions
- No leaderboards
- No user-vs-user comparison
- Personal journaling is a solo experience

---

### Section 11: Sexual Content or Nudity

**Question:** Does your app contain or display sexual content or nudity?

**Answer:** ❌ **NO**

**Explanation:**
- No nudity
- No sexual imagery
- No romantic content
- Family-friendly interface

---

### Section 12: User Generated Content

**Question:** Does your app allow users to create or view user-generated content that can be viewed by others?

**Answer:** ❌ **NO**

**Explanation:**
- Journal entries ARE user-generated content
- **However:** Entries are **100% private**
- No social features
- No sharing mechanism
- No public profiles
- No way for other users to see your entries

**Important:** If entries were private BUT viewable by others, answer would be YES and would require:
- Content moderation system
- Reporting mechanism
- Terms prohibiting inappropriate content

---

### Section 13: Location Services

**Question:** Does your app use location services?

**Answer:** ❌ **NO**

**Explanation:**
- No GPS tracking
- No location data collection
- No map features
- No location-based reminders

**Info.plist Confirmation:**
- No `NSLocationWhenInUseUsageDescription` key
- No `NSLocationAlwaysUsageDescription` key
- No location permissions requested

---

### Section 14: Unrestricted Internet Access

**Question:** Does your app use unrestricted internet access?

**Answer:** ⚠️ **YES** (but controlled)

**Explanation:**
- App connects to Firebase (Firestore, Authentication)
- Required for:
  - Cloud sync of journal entries
  - User authentication (Google Sign-In, Email/Password)
  - Crash reporting (if enabled)
  - Analytics (if enabled)
- **However:** All connections are to known, trusted endpoints
- No user-entered URLs
- No unrestricted web browsing

**This does NOT raise the age rating** because:
- Connections are programmatic (not user-initiated)
- No access to arbitrary websites
- No browser functionality

---

## 🎯 FINAL AGE RATING DETERMINATION

Based on the answers above, Apple will calculate your age rating.

### Expected Result: **12+**

**Rationale:**
- No mature content of any kind
- User-generated content is private (not shared)
- Internet access is controlled (Firebase only)
- No violence, profanity, or sexual content in app interface

### Alternative: **4+** (NOT Recommended)

**If you set age rating to 4+:**
- ✅ Technically accurate (no mature content)
- ❌ Triggers COPPA compliance for users under 13
- ❌ Requires verifiable parental consent mechanism
- ❌ Increased legal liability
- ❌ More complex privacy policy

**COPPA Requirements (if 4+):**
```
For users under 13, you MUST:
1. Obtain verifiable parental consent BEFORE collecting any data
2. Provide clear notice to parents about data collection
3. Allow parents to review/delete their child's data
4. Not condition app use on collecting more data than necessary
5. Not show behavioral advertising to children
6. Delete children's data when no longer needed
7. Have reasonable security measures
```

**Recommendation:** Set age rating to **12+** to avoid COPPA entirely.

---

## 📱 APP STORE CONNECT SUBMISSION PROCESS

### Step 1: General App Information

When creating your app in App Store Connect:

1. Go to **App Store Connect** → **My Apps** → **+ (Add New App)**
2. Fill in basic info:
   - **Platform:** iOS
   - **Name:** One Sentence - Daily Journal & Mood Tracker
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.walruscreativeworks.onesentence
   - **SKU:** onesentence-ios-001

### Step 2: Version Information

1. Click on **App Information** (left sidebar)
2. Scroll to **Age Rating**
3. Click **Edit**

### Step 3: Complete Questionnaire

Answer each question exactly as documented above in this file.

### Step 4: Review Rating

After completing the questionnaire, Apple will show your age rating:

```
Your app's age rating: 12+

Age rating reasons:
• Infrequent/Mild Profanity or Crude Humor
  (because user-generated content may contain profanity)
```

**Accept this rating.**

### Step 5: Save Changes

Click **Save** in the top-right corner.

---

## 🔄 UPDATING AGE RATING

### When to Update

You must update the age rating if you:
- Add social features (users can view others' content)
- Add location tracking
- Add gambling mechanics
- Add advertisements (especially if targeted to children)
- Add in-app purchases (loot boxes, random rewards)
- Add health/medical advice features

### How to Update

1. App Store Connect → Your App → App Information → Age Rating
2. Click **Edit**
3. Answer updated questionnaire
4. Submit updated rating with your next app version

---

## 📊 CATEGORY SELECTION

In addition to age rating, you must select app categories:

### Primary Category: **Lifestyle**

**Rationale:**
- Personal journaling falls under Lifestyle
- Focuses on daily habits and self-improvement
- Not medical (no treatment/diagnosis)

**LSApplicationCategoryType in Info.plist:**
```xml
<key>LSApplicationCategoryType</key>
<string>public.app-category.lifestyle</string>
```

### Secondary Category: **Health & Fitness** (Optional)

**Rationale:**
- Mood tracking relates to mental wellness
- Self-reflection is part of mental health routine
- Not classified as a medical app

**Considerations:**
- Health & Fitness category has higher visibility
- May attract users searching for wellness apps
- Does NOT trigger medical app review (no FDA regulation)

---

## 🛡️ PRIVACY LABELS (RELATED)

While completing age rating, you'll also complete **App Privacy** labels:

### Data Collected

**Contact Info:**
- ✅ Email address (for authentication)
- **Linked to user:** YES
- **Used for tracking:** NO

**User Content:**
- ✅ Other User Content (journal entries)
- **Linked to user:** YES
- **Used for tracking:** NO

**Identifiers:**
- ✅ User ID (Firebase UID)
- **Linked to user:** YES
- **Used for tracking:** NO

### Data Not Collected

- ❌ Location data
- ❌ Browsing history
- ❌ Search history
- ❌ Contacts
- ❌ Photos
- ❌ Health data (mood emojis don't count as HealthKit data)
- ❌ Financial data
- ❌ Purchase history

---

## ⚠️ COMMON MISTAKES TO AVOID

### Mistake #1: Setting Age to 4+
**Problem:** Triggers COPPA compliance  
**Solution:** Use 12+ or 13+

### Mistake #2: Saying "NO" to User-Generated Content
**Problem:** Apple may reject if they find UGC during review  
**Solution:** Answer YES, but clarify content is private

### Mistake #3: Forgetting to Update Rating After Adding Features
**Problem:** App may be removed from App Store  
**Solution:** Review age rating questionnaire with each major update

### Mistake #4: Confusing Mood Tracking with Medical Information
**Problem:** Thinking mood emojis = medical app  
**Solution:** Mood tracking WITHOUT advice/diagnosis is NOT medical

### Mistake #5: Not Preparing for COPPA (if choosing 4+)
**Problem:** Legal violations, FTC fines up to $43,280 per violation  
**Solution:** Use 12+ rating to avoid COPPA entirely

---

## 📞 QUESTIONS & SUPPORT

### If Apple Requests Clarification

Sometimes App Review will ask for clarification on age rating answers.

**Common Questions:**

**Q: "Your app contains user-generated content. How do you moderate it?"**

**A:** "Journal entries in One Sentence Journal are 100% private and never shared with other users. Each user can only view their own entries. Since content is not shared publicly, moderation is not required. There are no social features, no comments, no profiles, and no way for users to communicate with each other."

---

**Q: "Your app tracks moods. Is this a medical app?"**

**A:** "One Sentence Journal tracks daily moods using emoji selections (Happy, Sad, Peaceful, etc.) for personal reflection purposes only. The app:
- Does NOT provide medical advice
- Does NOT diagnose conditions  
- Does NOT recommend treatments
- Does NOT integrate with HealthKit
- Does NOT claim therapeutic benefits

We include a disclaimer: 'This app is not a replacement for professional medical advice, diagnosis, or treatment. If you are experiencing a mental health crisis, please contact 988 (Suicide & Crisis Lifeline) or 911.'"

---

**Q: "Why did you choose 12+ instead of 4+?"**

**A:** "We selected 12+ to:
1. Avoid COPPA compliance requirements for users under 13
2. Target our core audience (teenagers and adults)
3. Reduce legal liability related to children's data privacy
4. Simplify our privacy policy and data handling practices

While the app contains no mature content, this rating decision is based on regulatory compliance rather than content restrictions."

---

## ✅ PRE-SUBMISSION CHECKLIST

Before submitting, verify:

- [x] **LSApplicationCategoryType** added to Info.plist (`public.app-category.lifestyle`)
- [ ] Age rating questionnaire completed in App Store Connect
- [ ] Age rating set to **12+** (recommended)
- [ ] Privacy labels completed (email, user content, user ID)
- [ ] Primary category set to **Lifestyle**
- [ ] Secondary category set to **Health & Fitness** (optional)
- [ ] App disclaimer added (if claiming health benefits)
- [ ] Terms of Service mentions age requirement (13+)
- [ ] Privacy Policy mentions age requirement (13+)

---

## 🎉 FINAL NOTES

**Age Rating: 12+**
- ✅ Covers target audience (teens and adults)
- ✅ Avoids COPPA compliance
- ✅ Simple, straightforward
- ✅ No special requirements

**Your app is ready for submission!** 🚀

When filling out the questionnaire in App Store Connect, simply refer to this document and answer each question as documented. Apple's automated system will calculate your age rating based on your answers.

**Estimated time:** 10-15 minutes to complete questionnaire

---

*Last Updated: December 28, 2025*  
*Review this document before each major app update*
