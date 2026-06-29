Redesign, complete, and synchronize the Gradora web app UI with full route coverage, role-based dashboards, and consistent design system.
PROJECT CONTEXT
Gradora is a university tutoring and mentorship booking platform. Students can find verified mentors/tutors, view profiles, book sessions, pay safely through escrow, message mentors, manage wallet, open disputes, and contact support. Mentors can manage their teaching dashboard, sessions, messages, earnings, withdrawals, availability, and profile. Admin can manage users, mentors, revenue, transactions, disputes, resources, and platform settings.
The current project has some existing pages, but several pages are missing or incomplete. Audit the current Figma Make app first. For every route:
If the page already exists, keep the useful structure but polish it and synchronize the design.
If the page does not exist, create it from scratch.
Do not leave any route as 404.
Replace all default developer error screens with a polished Gradora 404 page.
Make sure every navbar link, sidebar link, breadcrumb, CTA button, and card action points to an existing page.
IMPORTANT INTERNAL ASSIGNEE NOTES
Use these names only for Figma frame/page naming or internal notes. Do not show these names to end users in the UI.
Assigned pages:
Find Mentor main interface: Phú
View Profile: Phú
Book Session: Phú
Confirm Pay: Phú
Resources: Phú
Become Mentor: Vương
About: keep unchanged
Mentor Dashboard: check if it exists; if missing, create it; if existing, polish and sync design
GLOBAL DESIGN DIRECTION
Keep the current Gradora identity but make it more professional, premium, and production-ready.
Style:
Premium academic SaaS marketplace
Trust-first tutoring platform
Clean, modern, blue-white interface
Spacious layout
Soft card shadows
Rounded corners
Consistent typography
Clear navigation
Stripe-like payment trust
Calendly-like booking flow
Notion-like clarity
Airbnb-like mentor discovery
Do not make it look like a basic student prototype. The final UI should feel like a real startup product.
DESIGN SYSTEM
Use one consistent design system across all pages.
Colors:
Primary: deep royal blue
Secondary: navy
Background: very light blue / off-white
Cards: white
Borders: soft blue-gray
Success: green
Warning: amber
Error: red
Rating: amber/yellow
Disabled: soft gray
Typography:
Use Inter, Plus Jakarta Sans, or Sora
Use one type system only
Avoid decorative or pixel fonts
Headings should be bold and modern
Body text must be readable
Spacing:
Use an 8px spacing system
Keep layouts aligned to a 12-column grid
Main desktop width: 1440px
Max content width: 1180–1240px
Dashboard pages use sidebar + main content
Components to standardize:
Header
Footer
Dashboard sidebar
Mentor card
Profile card
Booking calendar
Time slot button
Search bar
Filter chips
Dropdown
Form input
Primary button
Secondary button
Outline button
Status badge
KPI card
Wallet card
Transaction table
Message bubble
Empty state
Error state
Modal
Toast notification
ROLE STRUCTURE
Create and maintain three clear roles:
USER / STUDENT / MENTEE
User-facing label: Student
Routes:
/dashboard
/dashboard/sessions
/dashboard/wallet
/dashboard/disputes
/dashboard/profile
/dashboard/settings
/messages
/messages/:mentorId
/support/contact
MENTOR / TUTOR / TEACHER
User-facing label: Mentor or Tutor
System route may use mentor.
Routes:
/mentor/dashboard
/mentor/sessions
/mentor/calendar
/mentor/availability
/mentor/messages
/mentor/earnings
/mentor/wallet
/mentor/withdraw
/mentor/unlock-withdraw
/mentor/profile
/mentor/verification
/mentor/settings
ADMIN
Routes:
/admin/dashboard
/admin/users
/admin/mentors
/admin/mentor-verification
/admin/transactions
/admin/commission-revenue
/admin/payouts
/admin/disputes
/admin/resources
/admin/reports
/admin/settings
/admin/audit-logs
PUBLIC ROUTES
Create or polish these routes:
/
/find-mentors
/mentor/:id
/mentor/:id/book
/mentor/:id/calendar
/order-summary
/confirm-pay
/payment-status
/resources
/become-a-mentor
/about
/login
/register
/support/contact
ABOUT PAGE
Keep About page unchanged unless there is a serious visual inconsistency. Do not redesign the content structure of About. Only adjust minor spacing, navbar, footer, or typography if needed for consistency.
PAGE 1 — FIND MENTORS MAIN INTERFACE
Internal assignee: Phú
Route: /find-mentors
Create a polished mentor discovery page.
Page purpose:
Students search and filter mentors by course, university, major, subject, rating, price, and availability.
Hero/search area:
Page title: “Find trusted academic mentors”
Subtitle: “Book verified seniors, alumni, and tutors for course support, thesis guidance, research help, and career advice.”
Large search bar with placeholder: “Search by course code, mentor name, major, or university”
Dropdown filters:
Subject
University
Academic Level
Availability
Primary CTA: “Search Mentors”
Trust badges:
Verified mentors
Real student reviews
Secure escrow payment
Course-based matching
Mentor list:
Each mentor card must include:
Avatar
Name
Verification badge
Role: Senior Student / Alumni Mentor / Lecturer / Research Advisor
University
Major
Course tags
Rating
Number of reviews
Sessions completed
Price per hour
Next available time
CTA: View Profile
Secondary action: Message
Filters:
University
Subject
Course code
Academic level
Learning mode
Online / offline
Price range
Rating
Availability
Language
Add:
Sorting dropdown
Pagination
Empty state
Loading skeleton state
PAGE 2 — VIEW PROFILE
Internal assignee: Phú
Route: /mentor/:id
Create a strong mentor profile page.
Top section:
Large mentor avatar
Name
Verified badge
Role
University
Major / academic background
Rating
Reviews
Sessions completed
Response time
Price per hour
CTA: Book Session
Secondary CTA: Message Mentor
Main content:
About this mentor
How I can help
Courses supported
Academic strengths
Education background
Languages
Availability preview
Pricing
Student reviews
Mentorship impact
Right sidebar:
Price per hour
Next available slot
Session formats
Learning modes
Escrow protection badge
CTA: Book Session
CTA: Message
Make the profile feel credible and safe. It should help users decide quickly whether to book.
PAGE 3 — BOOK SESSION
Internal assignee: Phú
Route: /mentor/:id/book
Create a premium booking page similar to Calendly but adapted to Gradora.
Left sidebar:
Mentor summary card
Avatar
Name
Role
Rating
Course expertise
Price per hour
Escrow protection note
Main booking area:
Select session duration:
30 min
45 min
60 min
90 min
Custom
Select learning mode:
1-on-1
Group
Custom
Select format:
Online
Offline
Calendar month view
Available dates
Time slots grouped by:
Morning
Afternoon
Evening
Selected date and time highlighted clearly
Bottom summary:
Selected mentor
Date
Time
Duration
Format
Estimated price
CTA: Continue to Confirm Pay
Make unavailable dates muted.
Make selected states obvious.
Do not clutter the calendar.
PAGE 4 — CONFIRM PAY
Internal assignee: Phú
Route: /confirm-pay
Create the final checkout confirmation page before payment.
Content:
Breadcrumb: Book Session > Confirm Pay
Page title: Confirm & Pay
Mentor summary card
Session details:
Session type
Course
Date
Time
Duration
Learning mode
Format
Price breakdown:
Session fee
Platform service fee
Voucher discount
Total amount
Escrow explanation:
“Your payment is held securely by Gradora and released to the mentor only after the session is completed.”
Payment method selector:
Wallet balance
Bank card
Online payment placeholder
Terms checkbox:
“I agree to Gradora’s booking, cancellation, and escrow policy.”
CTA: Confirm & Pay
Secondary CTA: Back to Booking
Important data consistency:
If time is 01:00 PM – 02:30 PM, duration must be 90 minutes.
Do not show 180 minutes for a 90-minute session.
Use one currency format consistently.
Default currency: VND.
Examples:
80.000₫ / hour
120.000₫
9.000₫ voucher discount
PAGE 5 — PAYMENT STATUS
Route: /payment-status
Create a trust-building escrow payment status page.
Progress indicator:
Payment completed
Held safely in escrow
Released after session completion
Main card:
Success icon
Title: “Payment is securely held in escrow”
Amount
Escrow ID
Mentor
Session date
Session time
Payment method
Status: In Escrow
Next steps:
Attend your session
Mark as completed
Payment released to mentor
Protection card:
Funds are held until session completion
Student can open a dispute if there is an issue
Gradora reviews disputes fairly
Mentor receives payment after confirmation
Buttons:
View My Sessions
Message Mentor
Contact Support
PAGE 6 — CONTACT SUPPORT
Route: /support/contact
Create a professional support page.
Purpose:
Students and mentors can contact Gradora support for booking, payment, dispute, verification, or technical issues.
Layout:
Page title: Contact Support
Subtitle: “Need help with a session, payment, dispute, or account issue? Our support team is here to help.”
Support category cards:
Booking issue
Payment / escrow
Refund request
Mentor verification
Account access
Technical issue
Contact form:
Full name
Email
Role: Student / Mentor
Issue category
Related session ID
Message
Upload attachment
CTA: Submit Request
Right sidebar:
Average response time
Support hours
Email placeholder
Help center link
FAQ accordion:
When will my payment be released?
How do refunds work?
How do I open a dispute?
How do I verify my mentor account?
Also create success state after submitting:
“Support request submitted”
Ticket ID
CTA: View My Disputes / Back to Dashboard
PAGE 7 — UI MESSAGE MENTOR
Routes:
/messages
/messages/:mentorId
/mentor/messages
Create a complete messaging interface.
Student messaging UI:
Left conversation list
Search conversations
Mentor avatar
Last message
Unread count
Session label if related to booking
Main chat area
Mentor profile mini-card on right
Message input
Attachment button
Send button
Quick actions:
Book Session
View Profile
Contact Support
Open Dispute
Mentor messaging UI:
Student list
Session context
Quick action:
Accept booking
Suggest time
Send resource
View student profile
Message states:
Sent
Delivered
Read
Typing
Empty state
Blocked / dispute state
Design:
Clean chat bubbles
Very readable
Not too colorful
Consistent with Gradora dashboard
PAGE 8 — RÚT TIỀN / WITHDRAW
Routes:
/mentor/withdraw
/mentor/wallet
Create the mentor withdrawal interface.
Purpose:
Mentors can withdraw available earnings after sessions are completed and escrow is released.
Content:
Page title: Withdraw Earnings
Subtitle: “Withdraw your available mentor earnings safely to your verified bank account.”
KPI cards:
Available Balance
Pending Escrow Release
Total Withdrawn
Next Payout Date
Withdrawal form:
Amount
Bank account
Payout method
Note
CTA: Request Withdrawal
Bank account card:
Bank name
Account holder
Account number masked
Verification status
Edit bank account
Withdrawal rules card:
Minimum withdrawal amount
Processing time
Platform fee if any
Dispute hold explanation
Withdrawal history table:
Date
Amount
Method
Status
Transaction ID
Action
Status badges:
Processing
Completed
Failed
Cancelled
On Hold
PAGE 9 — UNLOCK WITHDRAW
Route: /mentor/unlock-withdraw
Create a page for mentors who cannot withdraw yet.
Purpose:
Explain why withdrawal is locked and what mentor must complete to unlock payouts.
Main state:
Page title: Unlock Withdrawals
Status card:
“Withdrawals are currently locked”
Reason examples:
Mentor verification incomplete
Bank account not verified
No completed sessions yet
Active dispute under review
Escrow has not been released yet
Checklist:
Complete mentor profile
Verify university email
Upload transcript or proof of expertise
Add verified bank account
Complete first paid session
Wait for escrow release
Resolve active disputes if any
Each checklist item should show:
Completed
In progress
Required
Blocked
CTA buttons:
Complete Verification
Add Bank Account
View Sessions
Contact Support
Design:
Clear, calm, not scary
Explain the process simply
Use progress indicator
Use green check icons for completed steps
Use amber for pending steps
Use red only for blocked issues
PAGE 10 — BECOME MENTOR
Internal assignee: Vương
Route: /become-a-mentor
Create or polish this page.
Hero:
Headline: “Teach what you’ve mastered — earn safely with Gradora.”
Subtitle: “Become a verified mentor, help juniors succeed, and get paid securely through escrow.”
CTA: Apply to Become a Mentor
Sections:
Why become a Gradora mentor
How much you can earn
How escrow protects mentors
Requirements
How it works
FAQ
Benefits:
Flexible income
Guaranteed payment after completed sessions
Build your academic reputation
Help juniors
Real student reviews
Verified mentor profile
Requirements:
Active university student, alumni, lecturer, or qualified tutor
Strong grade or experience in selected subjects
Proof of expertise
University email recommended
Short verification process
How it works:
Submit application
Get verified
Set profile and availability
Accept sessions
Get paid safely
PAGE 11 — RESOURCES
Internal assignee: Phú
Route: /resources
Create or polish the resources library.
Purpose:
Students can browse academic guides, templates, articles, videos, and PDF resources.
Layout:
Page title: Academic Resources
Subtitle: “Curated guides, templates, and learning resources for university students.”
Search bar
Filter sidebar:
University
Subject
Content type
Academic level
Resource cards:
Type badge: Article / PDF Guide / Video / Template
Title
Short description
Source
University
Reading time or file type
Action: Read / Download / Watch
Add:
Featured resources
Popular this week
Empty state
Pagination
Saved resources state
Keep the design clean and academic.
PAGE 12 — MENTOR DASHBOARD
Route: /mentor/dashboard
Check if this page exists.
If it exists, polish it and synchronize it with the full Gradora design system.
If it does not exist, create it from scratch.
Purpose:
Mentors manage teaching activity, upcoming sessions, earnings, messages, reviews, verification, and availability.
Layout:
Mentor dashboard sidebar
Top bar with mentor name, avatar, verification badge, notifications
Main content area
Sidebar:
Dashboard
My Sessions
Calendar
Availability
Messages
Earnings
Wallet / Withdraw
Profile
Verification
Disputes
Settings
Main dashboard content:
Welcome message
Verification status card
KPI cards:
Upcoming Sessions
Completed Sessions
Total Earnings
Available Balance
Rating
Response Rate
Today’s schedule
Pending booking requests
Recent student messages
Earnings overview
Recent reviews
Profile completion checklist
CTA: Update Availability
CTA: View Withdrawals
Design:
Professional SaaS dashboard
Clear data hierarchy
Consistent table styles
Useful empty states
Mobile responsive
PAGE 13 — ERROR AND ROUTE COMPLETION
Create polished error pages.
404 page:
Title: “Page not found”
Text: “The page you’re looking for doesn’t exist or may have been moved.”
CTA: Go to Dashboard
CTA: Back to Home
CTA: Contact Support
Permission denied page:
Title: “You don’t have permission to view this page”
Text: “This page is only available for a different account role.”
CTA: Go to My Dashboard
Make sure no route shows:
“Unexpected Application Error”
“404 Not Found”
“Hey developer”
“ErrorBoundary”
“errorElement”
FINAL ROUTE AUDIT
Before finishing, check and complete these required pages:
Public:
/find-mentors
/mentor/:id
/mentor/:id/book
/confirm-pay
/payment-status
/support/contact
/messages
/messages/:mentorId
/resources
/become-a-mentor
/about
Student:
/dashboard
/dashboard/sessions
/dashboard/wallet
/dashboard/disputes
/dashboard/profile
/dashboard/settings
Mentor:
/mentor/dashboard
/mentor/sessions
/mentor/calendar
/mentor/availability
/mentor/messages
/mentor/earnings
/mentor/wallet
/mentor/withdraw
/mentor/unlock-withdraw
/mentor/profile
/mentor/verification
/mentor/disputes
/mentor/settings
Admin:
/admin/dashboard
/admin/users
/admin/mentors
/admin/mentor-verification
/admin/transactions
/admin/commission-revenue
/admin/payouts
/admin/disputes
/admin/resources
/admin/reports
/admin/settings
/admin/audit-logs
RESPONSIVE REQUIREMENT
Create responsive versions for:
Desktop
Tablet
Mobile
Mobile:
Header becomes hamburger menu
Dashboard sidebar becomes drawer
Cards stack vertically
Tables become responsive cards
Booking calendar remains usable
Chat UI remains readable
FINAL QUALITY BAR
The final Gradora interface must look:
Complete
Consistent
Premium
Production-ready
Trustworthy
Easy to use
Not like a student prototype
Every page must share the same navigation, typography, colors, spacing, button style, card style, and status badge system.
Do not redesign the About page content. Keep About unchanged except for minor consistency fixes.

