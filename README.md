# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/cab66f49-9386-4853-b3a0-88e8fb898fef

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/cab66f49-9386-4853-b3a0-88e8fb898fef) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/cab66f49-9386-4853-b3a0-88e8fb898fef) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 🔥 Firebase Setup

This CRM uses **Firebase** for backend services (Firestore, Authentication, Storage, Cloud Functions).

### Prerequisites

1. **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/)
2. **Node.js**: Version 18+ (check with `node --version`)

### Step-by-Step Setup

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "CRM Planejamento Financeiro")
4. Disable Google Analytics (optional)
5. Click "Create project"

#### 2. Enable Firebase Services

**Enable Firestore Database:**
1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select "Start in test mode" (we'll add security rules later)
4. Choose your location (e.g., `southamerica-east1` for São Paulo)
5. Click "Enable"

**Enable Authentication:**
1. Go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. Click "Save"

**Enable Storage:**
1. Go to **Build > Storage**
2. Click "Get started"
3. Start in test mode
4. Click "Done"

#### 3. Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ > Project settings
2. Scroll down to "Your apps"
3. Click the **Web icon** (</>)
4. Register your app (name: "CRM Web App")
5. Copy the `firebaseConfig` object

#### 4. Configure Environment Variables

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Fill in the Firebase credentials from step 3:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### 5. Install Firebase CLI (for Cloud Functions)

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Functions
- ✅ Storage
- ✅ Hosting (optional)

#### 6. Deploy Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || request.auth.uid == userId;
    }

    match /contacts/{contactId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isAuthenticated();
    }

    match /deals/{dealId} {
      allow read, create: if isAuthenticated();
      allow update, delete: if isAuthenticated();
    }

    match /workflows/{workflowId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

#### 7. Create Composite Indexes

**Firestore Indexes** (`firestore.indexes.json`):
```json
{
  "indexes": [
    {
      "collectionGroup": "contacts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "deals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "pipelineId", "order": "ASCENDING" },
        { "fieldPath": "stageId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

#### 8. Run the Project

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Troubleshooting

**Error: Missing Firebase configuration**
- Make sure `.env` file exists and contains all required variables
- Restart the dev server after creating `.env`

**Error: Permission denied**
- Check if Firestore security rules are deployed
- Verify user is authenticated
- Check user role in Firestore `users` collection

**Error: Network request failed**
- Check internet connection
- Verify Firebase project is active
- Check Firebase quota limits (free tier has limits)

### Architecture Documentation

For detailed information about the system architecture, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture
- [WORKFLOWS.md](./WORKFLOWS.md) - Workflow engine documentation (coming soon)
- [API.md](./API.md) - API documentation (coming soon)

### Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **State Management**: TanStack Query
- **Backend**: Firebase (Firestore + Functions)
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Routing**: React Router DOM
