# Error Modal Quick Reference

## Error Types & Visual Guide

### 🌐 Network Error (`type: 'network'`)
**Color:** Blue • **Icon:** WiFi Off
```javascript
showError(createNetworkError());
// or with custom message:
showError(createNetworkError('Your entry is saved locally.'));
// with retry:
showError(createNetworkError('Connection lost.'), () => retryFunction());
```

**Default Message:**
> **Can't Connect Right Now**
> 
> Your entry is saved locally, but we can't sync it to the cloud right now.
> 
> • Check your WiFi or cellular connection  
> • Try again in a few seconds  
> • Your entry is safe on this device

---

### 🔒 Auth Error (`type: 'auth'`)
**Color:** Amber • **Icon:** Lock
```javascript
showError(createAuthError(error.code));
```

**Auto-maps these Firebase error codes:**
| Code | Title | Message |
|------|-------|---------|
| `auth/wrong-password` | Password Incorrect | The password you entered doesn't match our records. |
| `auth/user-not-found` | Account Not Found | No account exists with this email address. |
| `auth/too-many-requests` | Too Many Attempts | For your security, we've temporarily locked this account. |
| `auth/invalid-email` | Invalid Email | The email address format is incorrect. |
| `auth/email-already-in-use` | Email Already Registered | An account with this email already exists. |
| `auth/weak-password` | Weak Password | Your password needs to be stronger. |
| `auth/requires-recent-login` | Session Expired | For your security, please log in again. |
| `auth/network-request-failed` | Connection Problem | We couldn't reach the authentication server. |

---

### 🚫 Permission Error (`type: 'permission'`)
**Color:** Red • **Icon:** User X
```javascript
showError(createPermissionError());
```

**Default Message:**
> **Permission Denied**
> 
> You don't have permission to access this data.
> 
> • Make sure you're logged in  
> • Check your account permissions  
> • Try logging out and back in

---

### ⏰ Rate Limit Error (`type: 'rate-limit'`)
**Color:** Orange • **Icon:** Clock
```javascript
showError(createRateLimitError(15)); // 15 minutes
```

**Default Message:**
> **Please Slow Down**
> 
> You've made too many attempts. Please wait 15 minutes before trying again.
> 
> • Take a 15-minute break  
> • This helps keep your account secure  
> • Contact support if you need immediate help

---

### 💾 Storage Error (`type: 'storage'`)
**Color:** Purple • **Icon:** Hard Drive
```javascript
showError(createStorageError());
```

**Default Message:**
> **Storage Running Low**
> 
> Your device is running out of storage space.
> 
> • Export your entries as PDF to save them  
> • Free up space on your device  
> • Then try again

---

### ✏️ Validation Error (`type: 'validation'`)
**Color:** Gray • **Icon:** Alert Circle
```javascript
showError(createValidationError('Name', 'is required'));
showError(createValidationError('Password', 'must be at least 6 characters'));
```

**Message Format:**
> **Please Check Your Input**
> 
> [Field] [requirement]
> 
> • Fix the issue and try again  
> • Contact support if you need help

**Examples:**
- "Name is required. Please enter your name."
- "Password must be at least 6 characters long."
- "Email does not match your account email."

---

### ⚠️ Generic Error (`type: 'generic'`)
**Color:** Gray • **Icon:** Alert Circle
```javascript
showError(createGenericError());
// with custom message:
showError(createGenericError('Save Failed', 'We couldn\'t save your entry.'));
```

**Default Message:**
> **Something Went Wrong**
> 
> We encountered an unexpected error. Your data is safe.
> 
> • Try again in a moment  
> • Contact support if this keeps happening  
> • Include details about what you were doing

---

## Custom Errors

### Full Control
```javascript
showError({
  type: 'generic',  // or any type above
  title: 'Custom Title',
  message: 'Detailed explanation of what happened.',
  actions: [
    'Step 1: Try this first',
    'Step 2: If that doesn\'t work, try this',
    'Step 3: Finally, contact support'
  ],
  canRetry: true,      // Show "Try Again" button
  canDismiss: true     // Show close (X) button and "Close" button
});
```

### Success Messages (Use Generic Type)
```javascript
showError({
  type: 'generic',
  title: 'Success! ✓',
  message: 'Your settings have been saved.',
  actions: [],
  canRetry: false,
  canDismiss: true
});
```

---

## Helper Functions

### Show Error
```javascript
// Basic
showError(errorObject);

// With retry function
showError(errorObject, () => retryFunction());
```

### Close Error
```javascript
closeError();  // Manually close the modal
```

### Retry Error
```javascript
retryError();  // Executes the retry function and closes modal
```

---

## Support Email Integration

Every error modal includes a **"Contact Support"** button that:
1. Opens user's default email client
2. Pre-fills support email: `hello@walruscreativeworks.com`
3. Includes diagnostic information:
   - App Version
   - Error Type
   - Error Message
   - Space for user to describe the issue

**Generated Email:**
```
To: hello@walruscreativeworks.com
Subject: One Sentence Journal - Help Request

App Version: 1.0.0
Error Type: network
Error Message: Can't connect right now

Please describe your issue:
[User types here]
```

---

## Modal Features

### Visual Design
- ✅ Beautiful card design with rounded corners and shadow
- ✅ Backdrop blur effect
- ✅ Dark mode support (automatically adapts)
- ✅ Smooth animations (fade in/out)
- ✅ Color-coded icons for each error type
- ✅ Responsive design (mobile-friendly)

### Accessibility
- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Dismissible with escape key (when canDismiss=true)
- ✅ Semantic HTML

### User Experience
- ✅ Clear, friendly language
- ✅ Actionable steps (not just "something went wrong")
- ✅ Retry functionality for recoverable errors
- ✅ Easy access to support
- ✅ Non-blocking (can dismiss when appropriate)
- ✅ Blocking when critical (when canDismiss=false)

---

## Common Patterns

### Form Validation
```javascript
if (!email) {
  showError(createValidationError('Email', 'is required'));
  return;
}

if (password.length < 6) {
  showError(createValidationError('Password', 'must be at least 6 characters'));
  return;
}
```

### Network Operations with Retry
```javascript
try {
  await saveToFirestore(data);
} catch (error) {
  if (error.code === 'unavailable') {
    showError(createNetworkError(), () => saveToFirestore(data));
  } else {
    showError(createGenericError('Save Failed', 'Please try again.'));
  }
}
```

### Authentication Errors
```javascript
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  showError(createAuthError(error.code));
}
```

### Permission Denied
```javascript
subscribeToEntries(
  userId,
  (entries) => setEntries(entries),
  (error, userMessage) => {
    if (error.code === 'permission-denied') {
      showError(createPermissionError());
      setView('auth');  // Force user to re-login
    } else {
      showError(createGenericError('Load Failed', userMessage));
    }
  }
);
```

---

## Testing Checklist

- [ ] Test each error type displays correct icon and color
- [ ] Test light mode and dark mode appearance
- [ ] Test retry button functionality
- [ ] Test support email opens with pre-filled content
- [ ] Test close button dismisses modal
- [ ] Test escape key dismisses modal (when allowed)
- [ ] Test keyboard navigation (tab through buttons)
- [ ] Test screen reader announces error content
- [ ] Test on different screen sizes
- [ ] Test error modal doesn't break app flow

---

## Files

- **Component**: `src/components/ErrorModal.jsx` (340 lines)
- **Usage**: `src/App.jsx` (21 replacements)
- **Documentation**: 
  - `ERROR_HANDLING_GUIDE.md` (comprehensive guide)
  - `ERROR_MODAL_REFERENCE.md` (this file - quick reference)

---

**Last Updated**: December 28, 2024  
**Status**: ✅ Production Ready  
**Build**: 1046KB (successful)
