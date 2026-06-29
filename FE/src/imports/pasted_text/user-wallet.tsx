Redesign and complete the Gradora platform with full role-based pages and working routes.

PROJECT
Gradora is a university tutoring and mentorship booking website. Students can find tutors/mentors, book sessions, pay safely through escrow, manage sessions, wallet, disputes, and profile. Tutors/teachers can manage their teaching schedule, earnings, profile, verification, and sessions. Admin can manage users, mentors, transactions, commissions, disputes, and platform revenue.

VERY IMPORTANT
The current project has missing routes causing 404 errors, especially:
- /dashboard/wallet
- /dashboard/disputes
- /dashboard/profile

Create these missing pages and make sure all navigation links point to existing pages. Do not leave any dashboard route unfinished.

Also create clear role separation:
1. USER / STUDENT / MENTEE
2. TEACHER / TUTOR / MENTOR
3. ADMIN

Use the same visual design system as the existing Gradora style:
- Premium academic SaaS
- Clean blue and white interface
- Modern cards
- Rounded corners
- Soft shadows
- Light blue background
- Professional university mentoring platform
- Trust-first design
- Consistent typography, spacing, button styles, table styles, sidebars, and status badges

Keep the Gradora identity but make it more polished and production-ready.

GLOBAL DESIGN SYSTEM
Use a consistent design system:
- Primary color: deep royal blue
- Background: very light blue / off-white
- Card background: white
- Border: soft blue-gray
- Success: green
- Warning: amber
- Error: red
- Text: dark navy / charcoal
- Font: Inter or Plus Jakarta Sans
- Border radius: 12–20px
- Buttons: consistent primary, secondary, outline, disabled
- Cards: soft shadow + subtle border
- Tables: clean, readable, with status badges
- Layout: 1440px desktop, 12-column grid
- Dashboard layout: sidebar + top bar + main content

ROUTE STRUCTURE

PUBLIC ROUTES
Create or polish these pages:
- /
- /find-mentors
- /mentor/:id
- /mentor/:id/calendar
- /order-summary
- /payment
- /resources
- /about
- /become-a-mentor
- /login
- /register

USER DASHBOARD ROUTES
Create a full student dashboard area:
- /dashboard
- /dashboard/sessions
- /dashboard/wallet
- /dashboard/disputes
- /dashboard/profile
- /dashboard/settings

TEACHER DASHBOARD ROUTES
Create a full teacher/tutor dashboard area:
- /teacher/dashboard
- /teacher/sessions
- /teacher/calendar
- /teacher/availability
- /teacher/earnings
- /teacher/wallet
- /teacher/disputes
- /teacher/profile
- /teacher/verification
- /teacher/settings

ADMIN DASHBOARD ROUTES
Create a full admin panel:
- /admin/dashboard
- /admin/users
- /admin/mentors
- /admin/mentor-verification
- /admin/transactions
- /admin/commission-revenue
- /admin/payouts
- /admin/disputes
- /admin/resources
- /admin/reports
- /admin/settings
- /admin/audit-logs

ERROR ROUTES
Create proper error states:
- /404
- Generic Error Boundary page
- Empty state page
- Permission denied page

Do not show the default “Unexpected Application Error” message. Replace it with a polished Gradora error page.

ROLE-BASED NAVIGATION

USER / STUDENT SIDEBAR
Sidebar items:
- My Sessions
- Wallet / Transactions
- Disputes / Complaints
- Profile
- Settings

USER TOP BAR
Show:
- Gradora logo
- Main nav: Find Mentors, Resources, About
- User name
- Avatar dropdown

TEACHER SIDEBAR
Sidebar items:
- Teaching Dashboard
- My Sessions
- Calendar
- Availability
- Earnings
- Wallet / Payouts
- Disputes
- Profile
- Verification
- Settings

TEACHER TOP BAR
Show:
- Gradora logo
- Main nav: Find Students, Resources, Help
- Teacher name
- Verification badge if verified
- Avatar dropdown

ADMIN SIDEBAR
Sidebar items:
- Dashboard
- Users
- Mentors
- Mentor Verification
- Transactions
- Commission / Revenue
- Payouts
- Disputes
- Resources
- Reports
- Settings
- Audit Logs
- Logout

ADMIN TOP BAR
Show:
- Search
- Notifications
- Admin profile
- System status indicator

PAGE DETAILS

1. USER DASHBOARD HOME — /dashboard
Create a student dashboard overview.

Content:
- Welcome message: “Welcome back, Huynh Dang Khoa”
- Summary cards:
  - Upcoming Sessions
  - Completed Sessions
  - Hours Learned
  - Wallet Balance
- Next upcoming session card
- Recent transactions
- Recommended mentors
- Open disputes if any
- CTA: Find a New Mentor

Make it feel clear and useful, not empty.

2. USER MY SESSIONS — /dashboard/sessions
Create a session management page.

Content:
- Page title: My Sessions
- Subtitle: “Track your tutoring sessions — upcoming, completed, cancelled, and in escrow.”
- Summary cards:
  - Upcoming
  - In Escrow
  - Completed
  - Cancelled
- Tabs:
  - All
  - Upcoming
  - In Escrow
  - Completed
  - Cancelled
- Table columns:
  - Mentor
  - Course
  - Date & Time
  - Learning Mode
  - Format
  - Payment Status
  - Session Status
  - Action
- Actions:
  - View
  - Join Session
  - Mark as Completed
  - Review
  - Open Dispute

Status badges:
- Upcoming
- In Escrow
- Completed
- Cancelled
- Refunded

3. USER WALLET — /dashboard/wallet
Create this missing page.

Purpose:
Students can see balance, escrow payments, refunds, and transaction history.

Content:
- Page title: Wallet & Transactions
- Subtitle: “Manage your payments, escrow sessions, refunds, and transaction history.”
- KPI cards:
  - Available Balance
  - Held in Escrow
  - Total Spent
  - Refunded Amount
- Main wallet card:
  - Balance
  - Add Funds button
  - Withdraw button disabled for student if not applicable
- Escrow section:
  - List of active escrow payments
  - Mentor name
  - Session date
  - Amount
  - Status
  - Action: View Session
- Transaction history table:
  - Date
  - Type
  - Mentor
  - Session / Course
  - Amount
  - Payment Method
  - Status
  - Receipt action
- Filters:
  - All
  - Paid
  - Held in Escrow
  - Refunded
  - Failed

Use a trustworthy payment design, similar to Stripe but in Gradora style.

4. USER DISPUTES — /dashboard/disputes
Create this missing page.

Purpose:
Students can create and track complaints/disputes related to tutoring sessions or payments.

Content:
- Page title: Disputes & Complaints
- Subtitle: “Open and track support requests for sessions, refunds, or mentor issues.”
- CTA: Open New Dispute
- Summary cards:
  - Open Disputes
  - Under Review
  - Resolved
  - Refunded
- Dispute table:
  - Case ID
  - Session
  - Mentor
  - Issue Type
  - Created Date
  - Status
  - Action
- Status badges:
  - Open
  - Waiting for Mentor
  - Under Review
  - Resolved
  - Refunded
  - Rejected
- Empty state:
  - “No disputes yet”
  - “When something goes wrong, you can open a dispute and Gradora will review it fairly.”

Create a dispute detail card/modal:
- Case timeline
- Student reason
- Mentor response
- Evidence attachments
- Admin decision
- Refund result

5. USER PROFILE — /dashboard/profile
Create this missing page.

Purpose:
Students can manage personal information, academic profile, university email, and preferences.

Content:
- Page title: My Profile
- Profile completion progress
- Avatar upload area
- Personal information:
  - Full name
  - Email
  - University email
  - Phone number
  - University
  - Major
  - Academic level
- Learning preferences:
  - Preferred subjects
  - Preferred learning mode
  - Language
  - Online / offline preference
- Security:
  - Change password
  - Google account connection
  - Two-factor authentication placeholder
- Save Changes button

Design should be clean, form-based, and easy to scan.

6. USER SETTINGS — /dashboard/settings
Create settings page.

Sections:
- Account settings
- Notification preferences
- Payment preferences
- Privacy
- Delete account

7. TEACHER DASHBOARD HOME — /teacher/dashboard
Create a mentor/tutor overview dashboard.

Content:
- Welcome message
- Verification status card
- KPI cards:
  - Upcoming Sessions
  - Completed Sessions
  - Total Earnings
  - Rating
  - Response Rate
- Today’s schedule
- Pending student requests
- Recent reviews
- Earnings summary
- CTA: Update Availability

8. TEACHER SESSIONS — /teacher/sessions
Create teacher session management.

Content:
- Table columns:
  - Student
  - Course
  - Date & Time
  - Learning Mode
  - Format
  - Payment Status
  - Session Status
  - Action
- Actions:
  - View
  - Accept
  - Decline
  - Join Session
  - Mark Completed
  - Respond to Dispute

Tabs:
- All
- Pending
- Upcoming
- Completed
- Cancelled

9. TEACHER CALENDAR — /teacher/calendar
Create teacher calendar management page.

Content:
- Monthly calendar
- Weekly schedule
- Available / unavailable time blocks
- Session bookings
- CTA: Add Availability
- CTA: Block Time

10. TEACHER AVAILABILITY — /teacher/availability
Create availability setting page.

Content:
- Weekly availability editor
- Time slot generator
- Buffer time setting
- Max sessions per day
- Online / offline option
- Save availability button

11. TEACHER EARNINGS — /teacher/earnings
Create teacher earnings page.

Content:
- KPI cards:
  - Total Earnings
  - Pending Payout
  - Available for Withdrawal
  - Platform Fees
- Earnings chart
- Session earnings table
- Payout history
- Withdraw button

12. TEACHER WALLET — /teacher/wallet
Create teacher wallet/payout page.

Content:
- Available balance
- Pending escrow release
- Withdraw method
- Bank account card
- Payout history
- Transaction table

13. TEACHER DISPUTES — /teacher/disputes
Create teacher dispute management.

Content:
- Open disputes involving this teacher
- Student claim
- Session details
- Evidence section
- Response button
- Case status timeline

14. TEACHER PROFILE — /teacher/profile
Create public mentor profile editor.

Content:
- Profile preview
- Avatar
- Name
- Headline
- University
- Major
- Academic background
- Courses supported
- Hourly rate
- About me
- How I can help
- Languages
- Online/offline preference
- Save changes

15. TEACHER VERIFICATION — /teacher/verification
Create mentor verification page.

Content:
- Verification progress:
  1. Basic information
  2. University email
  3. Transcript / proof upload
  4. Interview
  5. Approved
- Upload documents card
- Verification status
- Notes from admin

16. ADMIN DASHBOARD — /admin/dashboard
Create admin overview.

Content:
- KPI cards:
  - Total Users
  - Active Mentors
  - Total Revenue
  - Platform Commission
  - Pending Payouts
  - Open Disputes
- Revenue chart
- Recent signups
- Recent transactions
- Pending mentor verifications
- Urgent disputes

17. ADMIN USERS — /admin/users
Create user management page.

Content:
- Search users
- Filter by role: User, Teacher, Admin
- User table:
  - Name
  - Email
  - Role
  - University
  - Status
  - Joined Date
  - Action
- Actions:
  - View
  - Suspend
  - Change Role

18. ADMIN MENTORS — /admin/mentors
Create mentor management page.

Content:
- Mentor list
- Verification status
- Rating
- Earnings
- Sessions
- Action

19. ADMIN MENTOR VERIFICATION — /admin/mentor-verification
Create verification approval workflow.

Content:
- Pending mentor applications
- Applicant profile
- Documents
- Transcript proof
- Course expertise
- Interview status
- Approve / Reject / Request More Info

20. ADMIN TRANSACTIONS — /admin/transactions
Create transaction management page.

Content:
- Transaction table:
  - Transaction ID
  - Student
  - Teacher
  - Session
  - Amount
  - Platform Fee
  - Escrow Status
  - Payment Status
  - Date
  - Action

21. ADMIN COMMISSION & REVENUE — /admin/commission-revenue
Create a polished finance dashboard.

Content:
- Total Revenue
- Platform Commission
- Pending Payouts
- Net Profit Estimate
- Revenue Trends chart
- Recent transactions
- Commission breakdown
- Export report button

22. ADMIN PAYOUTS — /admin/payouts
Create payout management.

Content:
- Pending payouts
- Teacher
- Amount
- Bank method
- Sessions included
- Risk status
- Action: Process Payout
- Bulk process button

23. ADMIN DISPUTES — /admin/disputes
Create admin dispute center.

Content:
- Dispute queue
- Priority
- Case ID
- Student
- Teacher
- Session
- Amount
- Reason
- Status
- Assigned admin
- Action
- Detail view with timeline and decision panel

24. ADMIN RESOURCES — /admin/resources
Create resource management page.

Content:
- Add resource
- Edit resource
- Type: Article, PDF, Video, Template
- University
- Subject
- Status
- Published / Draft

25. ADMIN REPORTS — /admin/reports
Create reporting page.

Content:
- Revenue report
- User growth
- Mentor performance
- Dispute report
- Export CSV / PDF buttons

26. ADMIN SETTINGS — /admin/settings
Create platform settings page.

Content:
- Commission percentage
- Escrow rules
- Refund policy
- Verification requirements
- Notification templates
- Payment settings

27. ADMIN AUDIT LOGS — /admin/audit-logs
Create audit logs page.

Content:
- Admin action
- Actor
- Target
- Timestamp
- IP placeholder
- Status

ERROR PAGE / 404
Replace the default developer error screen with a polished Gradora 404 page.

Content:
- Illustration or icon
- Title: “Page not found”
- Text: “The page you’re looking for doesn’t exist or hasn’t been created yet.”
- Buttons:
  - Go to Dashboard
  - Back to Home
  - Contact Support

Also create a permission denied page:
- Title: “You don’t have permission to view this page.”
- Explain role-based access.
- CTA: Go back to dashboard.

ROLE ACCESS RULES
Make the experience role-based:
- User can access /dashboard/*
- Teacher can access /teacher/*
- Admin can access /admin/*
- If wrong role accesses a route, show Permission Denied page
- Public pages are accessible to everyone

COPY STYLE
Use clear, concise, professional English.
Avoid messy text, typo mistakes, and inconsistent capitalization.
Use proper grammar.
Do not mix currencies randomly.
Use VND as the default currency for Vietnam:
Example:
- 80.000₫ / hour
- 1.250.000₫
- 9.000₫ voucher discount

IMPORTANT DATA CONSISTENCY
Fix these logic problems:
- If the time is 01:00 PM – 02:30 PM, duration must be 90 minutes.
- Do not show 180 minutes for a 90-minute session.
- Do not duplicate the same mentor card unless intentional.
- Use consistent names, dates, prices, and statuses.
- Use consistent button labels.
- Use consistent footer across pages.

FINAL QUALITY TARGET
The final design should feel like a real production-ready academic tutoring marketplace, not a student prototype.
It should be cleaner, more consistent, more complete, and more trustworthy than the current screenshots.
Make every route visually complete, especially the missing dashboard wallet, disputes, and profile pages.

