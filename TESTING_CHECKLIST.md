# Testing Checklist - CRM System

## Pre-deployment Testing Checklist

### ✅ Build & Compilation
- [x] Project builds without TypeScript errors
- [x] No console warnings during build
- [x] Bundle size is reasonable (<2MB)

### 🔐 Authentication

#### Sign Up
- [ ] Can create new account with email/password
- [ ] Email validation works
- [ ] Password strength validation works
- [ ] User document created in Firestore with correct UID
- [ ] Default role assigned correctly
- [ ] Avatar field handled correctly (undefined doesn't break)

#### Sign In
- [ ] Can login with correct credentials
- [ ] Error message shown for wrong password
- [ ] Error message shown for non-existent user
- [ ] User session persists on page refresh
- [ ] UserDoc loaded correctly after login

#### Sign Out
- [ ] Logout clears session
- [ ] Redirects to login page
- [ ] Cannot access protected routes after logout

### 👥 Contacts Module

#### Create Contact
- [ ] "Novo Contato" button opens dialog
- [ ] Form validation works (required fields)
- [ ] Can create contact with minimum fields (name, email, phone)
- [ ] Contact appears in list immediately after creation
- [ ] Toast notification shown on success
- [ ] Dialog closes after creation

#### View Contacts
- [ ] Contact list loads correctly
- [ ] Stats cards show correct numbers
- [ ] Search/filter works
- [ ] Status filter buttons work
- [ ] Lead score displays correctly
- [ ] Contact cards show all information
- [ ] Empty state shows when no contacts

### 💼 Deals Module

#### Create Pipeline
- [ ] "Criar Primeiro Pipeline" button works
- [ ] Default pipeline created with 4 stages
- [ ] Pipeline appears in pipeline selector
- [ ] Toast notification shown

#### Create Deal
- [ ] "Nova Negociação" button opens dialog
- [ ] Pipeline selection works
- [ ] Stage selection updates when pipeline changes
- [ ] Value field accepts decimal numbers
- [ ] Date picker works
- [ ] Deal appears in correct stage after creation
- [ ] Toast notification shown

#### View Deals
- [ ] Deal pipeline board loads
- [ ] Deals displayed in correct stages
- [ ] Value formatted as currency (R$)
- [ ] Stats cards show correct metrics
- [ ] Empty state shows when no deals
- [ ] Stage totals calculated correctly

### ⚡ Activities Module

#### Create Activity
- [ ] Quick task dialog opens
- [ ] Can create task with minimum fields
- [ ] Task appears in activity list
- [ ] Toast notification shown

#### View Activities
- [ ] Activity list loads
- [ ] Filters work (type, status)
- [ ] Stats cards accurate
- [ ] Empty state shown when needed

### 🔄 Workflows Module (Requires Planner Role)

#### Access Control
- [ ] Non-planner users see "Acesso Negado"
- [ ] Planner users can access workflows page
- [ ] Admin users can access workflows page

#### Create Workflow
- [ ] "Novo Workflow" navigates to builder
- [ ] Can enter workflow name and description
- [ ] Trigger type selection works
- [ ] All 7 trigger types available

#### Add Steps
- [ ] Can add delay step
- [ ] Can add send email step
- [ ] Can add create task step
- [ ] Can add update property step
- [ ] Can add other step types
- [ ] Steps appear on canvas
- [ ] Steps auto-connect

#### Configure Steps
- [ ] Click on step selects it
- [ ] "Configurar Passo" button appears
- [ ] Delay configuration dialog opens
  - [ ] Duration option works
  - [ ] Units selection works (minutes/hours/days/weeks)
  - [ ] Until date option works
  - [ ] Configuration saves
- [ ] Email configuration dialog opens
  - [ ] Subject field works
  - [ ] Body field works
  - [ ] From name field works
  - [ ] Reply-to field works with validation
  - [ ] Configuration saves
- [ ] Task configuration dialog opens
  - [ ] Title field works
  - [ ] Description field works
  - [ ] Due date field works
  - [ ] Configuration saves
- [ ] Update property configuration opens
  - [ ] Property name field works
  - [ ] Property value field works
  - [ ] Configuration saves
- [ ] Toast shown on save

#### Save Workflow
- [ ] "Salvar Rascunho" saves as draft
- [ ] "Salvar e Ativar" saves as active
- [ ] Workflow appears in workflows list
- [ ] Toast notification shown
- [ ] Redirects to workflows list
- [ ] Step configurations persisted

#### Edit Workflow
- [ ] Can open existing workflow
- [ ] Workflow data loads correctly
- [ ] Steps display on canvas
- [ ] Step configurations preserved
- [ ] Can edit and save changes

#### Manage Workflows
- [ ] List shows all workflows
- [ ] Search works
- [ ] Status badges display correctly
- [ ] Dropdown menu opens
- [ ] "Ativar" changes status to active
- [ ] "Pausar" changes status to paused
- [ ] "Arquivar" changes status to archived
- [ ] "Deletar" removes workflow (with confirmation)
- [ ] Stats update correctly

### 🎨 UI/UX

#### Dark Mode
- [ ] Theme toggle appears in navigation
- [ ] Can switch to dark mode
- [ ] Can switch to light mode
- [ ] Can switch to system preference
- [ ] Theme persists on refresh
- [ ] All pages render correctly in dark mode
- [ ] Dialogs render correctly in dark mode

#### Responsive Design
- [ ] Desktop view works (1920x1080)
- [ ] Tablet view works (768x1024)
- [ ] Mobile view works (375x667)
- [ ] Navigation adapts on mobile
- [ ] Cards stack properly on small screens

#### Navigation
- [ ] Sidebar navigation works
- [ ] Active page highlighted
- [ ] User avatar displays
- [ ] Logout button works
- [ ] All menu items accessible

### 🔒 Security

#### Firestore Rules
- [ ] Rules deployed to Firebase
- [ ] Users can only read their own contacts
- [ ] Users can only read their own deals
- [ ] Only planners can create workflows
- [ ] Only admins can delete users
- [ ] 403 errors don't occur for normal operations

#### Data Validation
- [ ] Email fields validate format
- [ ] Required fields enforce presence
- [ ] Number fields reject text
- [ ] Date fields format correctly
- [ ] Zod schemas catch invalid data

### 📊 Performance

#### Initial Load
- [ ] Page loads in < 3 seconds
- [ ] No layout shift during load
- [ ] Loading states display correctly

#### Data Fetching
- [ ] React Query caching works
- [ ] Mutations invalidate correct queries
- [ ] No unnecessary refetches
- [ ] Optimistic updates work

#### Real-time Updates
- [ ] New data appears without refresh
- [ ] Updates reflect immediately
- [ ] Deletions remove items from view

### 🐛 Error Handling

#### Network Errors
- [ ] Toast shown on network failure
- [ ] Can retry failed operations
- [ ] App doesn't crash on network loss

#### Validation Errors
- [ ] Form errors display clearly
- [ ] Error messages are helpful
- [ ] Can correct and resubmit

#### Firebase Errors
- [ ] 403 handled gracefully
- [ ] Auth errors show proper message
- [ ] Quota errors handled

## Critical Path Tests

### Happy Path: New User Journey
1. [ ] Create account
2. [ ] Create first pipeline
3. [ ] Create first contact
4. [ ] Create first deal
5. [ ] Create quick task
6. [ ] (If planner) Create first workflow
7. [ ] Switch to dark mode
8. [ ] Logout

### Happy Path: Workflow Creation
1. [ ] Login as planner
2. [ ] Navigate to workflows
3. [ ] Click "Novo Workflow"
4. [ ] Enter name and description
5. [ ] Select trigger type
6. [ ] Add 3 steps:
   - Delay (5 minutes)
   - Send Email (with subject/body)
   - Create Task (with title)
7. [ ] Configure each step
8. [ ] Save and activate
9. [ ] Verify in workflows list
10. [ ] Edit workflow
11. [ ] Add another step
12. [ ] Save changes
13. [ ] Pause workflow
14. [ ] Activate workflow

## Known Issues

### To Be Fixed
- [ ] None currently

### Won't Fix (By Design)
- Workflow execution engine not implemented (Cloud Functions required)
- Enrollment UI not implemented (structure ready)
- Some step types don't have config dialogs yet (structure ready)

## Test Environment

**Browser:** Chrome/Firefox/Safari
**Node Version:** 18+
**Firebase Project:** [Your project ID]
**Test Date:** [Date]
**Tester:** [Name]

## Notes

Add any additional observations here:

---

## Sign-off

- [ ] All critical tests passed
- [ ] No blockers found
- [ ] Ready for deployment

**Tested by:** _______________
**Date:** _______________
**Approved by:** _______________
**Date:** _______________
