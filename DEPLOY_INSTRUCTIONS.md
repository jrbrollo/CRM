# 🚀 Deploy Instructions

## Deploy Firestore Rules (CRITICAL - Fix 400 Errors)

The Firestore security rules are defined but NOT deployed to production.
This causes 400 errors when trying to read/write data.

### Deploy Now:

```bash
# Login to Firebase
npx firebase login

# Deploy rules and indexes
npx firebase deploy --only firestore:rules,firestore:indexes --project brauna-crm
```

### Verify Deployment:

1. Go to: https://console.firebase.google.com/project/brauna-crm/firestore/rules
2. You should see the rules from `firestore.rules` file
3. Check "Published" timestamp is recent

## Common Issues:

**Error: Not authenticated**
- Run `npx firebase login` first
- Follow browser authentication flow

**Error: No project configured**
- Add `--project brauna-crm` flag

**Error: Index already exists**
- This is OK, Firebase will skip existing indexes
- Only new indexes will be created

## After Deployment:

All CRUD operations (Create, Read, Update, Delete) will work properly.
The 400 errors will disappear.
