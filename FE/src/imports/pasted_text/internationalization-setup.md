Add a complete bilingual language switcher system to the Gradora web app.
PROJECT CONTEXT
Gradora is a university tutoring and mentorship booking platform. The current interface is fully in English. I want to add Vietnamese as a second language option.
The language switcher must work across the entire app:
Public pages
Student dashboard
Mentor dashboard
Admin dashboard
Booking flow
Payment flow
Wallet
Withdraw
Messages
Support
Error pages
Empty states
Forms
Buttons
Navigation
Sidebar
Tables
Status badges
Tooltips
Modals
Toast notifications
The interface must support two languages:
English
Tiếng Việt
LANGUAGE SWITCHER UI
Add a language selector in the top navigation bar.
Design:
Use a small globe icon on the left.
Show current language label:
“EN English” when English is selected
“VN Tiếng Việt” when Vietnamese is selected
The selector should look like a clean rounded pill button.
When clicked, open a dropdown menu.
Dropdown options:
EN English
VN Tiếng Việt
Show a check icon next to the currently selected language.
Use the same Gradora design system:
Light background
Soft border
Rounded corners
Subtle shadow
Blue selected state
Clear hover state
PLACEMENT
Logged-out public pages:
Place the language selector near Log In / Join Now in the header.
Logged-in student pages:
Place the language selector near the user avatar/name in the top bar.
Mentor dashboard:
Place the language selector near the mentor avatar/name in the top bar.
Admin dashboard:
Place the language selector near the admin profile / notification area.
Mobile:
Put the language selector inside the hamburger menu.
It should still show the current language clearly.
FUNCTIONAL BEHAVIOR
Create a global language state.
When the user selects “VN Tiếng Việt”:
The entire UI must switch to Vietnamese.
All visible text across all pages must change.
Navigation labels must change.
Buttons must change.
Sidebar labels must change.
Page titles must change.
Table headers must change.
Status badges must change.
Form labels and placeholders must change.
Validation messages must change.
Empty states must change.
Error pages must change.
Payment and escrow explanations must change.
Dashboard metrics labels must change.
Booking flow text must change.
Message UI labels must change.
When the user selects “EN English”:
The entire UI switches back to English.
Persist the selected language:
Keep the selected language when moving between pages.
Keep the selected language after refreshing.
Use localStorage or equivalent persistent state.
Default language: English.
IMPORTANT
Do not create two disconnected versions of the app.
Do not duplicate pages manually.
Use one design system with language variants / translation keys.
Make sure all routes support both languages.
DO NOT TRANSLATE
Do not translate:
Brand name: Gradora
User names
Mentor names
University names unless they already have official Vietnamese names
Course codes such as PRO192, MAD101, CSD201
Email addresses
Transaction IDs
Escrow IDs
URLs
TRANSLATION STYLE
Vietnamese translation must sound natural, professional, and product-ready.
Do not translate word-by-word.
Use clear Vietnamese UI language.
Examples:
Find Mentors → Tìm gia sư
Become a Mentor → Trở thành gia sư
Resources → Tài nguyên
About → Giới thiệu
Log In → Đăng nhập
Join Now → Tham gia ngay
My Sessions → Buổi học của tôi
Wallet / Transactions → Ví / Giao dịch
Disputes / Complaints → Khiếu nại / Tranh chấp
Profile → Hồ sơ
Settings → Cài đặt
Book Session → Đặt lịch học
View Profile → Xem hồ sơ
Message Mentor → Nhắn tin với gia sư
Confirm & Pay → Xác nhận & thanh toán
Contact Support → Liên hệ hỗ trợ
Withdraw Earnings → Rút tiền
Unlock Withdrawals → Mở khóa rút tiền
Payment is securely held in escrow → Khoản thanh toán đang được giữ an toàn trong ký quỹ
Page not found → Không tìm thấy trang
Permission denied → Bạn không có quyền truy cập trang này
TRANSLATION COVERAGE BY PAGE
PUBLIC HEADER
English:
Find Mentors
Become a Mentor
Resources
About
Log In
Join Now
Vietnamese:
Tìm gia sư
Trở thành gia sư
Tài nguyên
Giới thiệu
Đăng nhập
Tham gia ngay
FIND MENTORS PAGE
English:
Find trusted academic mentors
Book verified seniors, alumni, and tutors for course support, thesis guidance, research help, and career advice.
Search by course code, mentor name, major, or university
Subject
University
Academic Level
Availability
Search Mentors
Verified mentors
Real student reviews
Secure escrow payment
Course-based matching
View Profile
Message
Price per hour
Next available
Sort by
Filters
Vietnamese:
Tìm gia sư học thuật đáng tin cậy
Đặt lịch với sinh viên khóa trên, cựu sinh viên và gia sư đã xác minh để hỗ trợ môn học, luận văn, nghiên cứu và định hướng nghề nghiệp.
Tìm theo mã môn, tên gia sư, chuyên ngành hoặc trường đại học
Môn học
Trường đại học
Trình độ học thuật
Lịch trống
Tìm gia sư
Gia sư đã xác minh
Đánh giá thật từ sinh viên
Thanh toán ký quỹ an toàn
Ghép gia sư theo môn học
Xem hồ sơ
Nhắn tin
Giá mỗi giờ
Lịch trống gần nhất
Sắp xếp theo
Bộ lọc
MENTOR PROFILE PAGE
English:
About this mentor
How I can help
Courses supported
Academic strengths
Education background
Languages
Availability
Pricing
Student reviews
Mentorship impact
Book Session
Message Mentor
Vietnamese:
Về gia sư này
Tôi có thể hỗ trợ gì
Môn học hỗ trợ
Thế mạnh học thuật
Nền tảng học vấn
Ngôn ngữ
Lịch trống
Học phí
Đánh giá từ sinh viên
Hiệu quả cố vấn
Đặt lịch học
Nhắn tin với gia sư
BOOK SESSION PAGE
English:
Select session duration
Select learning mode
Select format
Online
Offline
1-on-1
Group
Custom
Morning
Afternoon
Evening
Continue to Confirm Pay
Vietnamese:
Chọn thời lượng buổi học
Chọn hình thức học
Chọn định dạng
Trực tuyến
Trực tiếp
1 kèm 1
Nhóm
Tùy chỉnh
Buổi sáng
Buổi chiều
Buổi tối
Tiếp tục đến xác nhận thanh toán
CONFIRM PAY PAGE
English:
Confirm & Pay
Session details
Session fee
Platform service fee
Voucher discount
Total amount
Payment method
Wallet balance
Bank card
Confirm & Pay
Back to Booking
Your payment is held securely by Gradora and released to the mentor only after the session is completed.
Vietnamese:
Xác nhận & thanh toán
Chi tiết buổi học
Phí buổi học
Phí dịch vụ nền tảng
Giảm giá voucher
Tổng thanh toán
Phương thức thanh toán
Số dư ví
Thẻ ngân hàng
Xác nhận & thanh toán
Quay lại đặt lịch
Khoản thanh toán của bạn được Gradora giữ an toàn và chỉ chuyển cho gia sư sau khi buổi học hoàn tất.
PAYMENT STATUS PAGE
English:
Payment completed
Held safely in escrow
Released after session completion
Payment is securely held in escrow
What happens next?
Attend your session
Mark as completed
Payment released to mentor
View My Sessions
Contact Support
Vietnamese:
Thanh toán hoàn tất
Đang giữ an toàn trong ký quỹ
Chuyển tiền sau khi buổi học hoàn tất
Khoản thanh toán đang được giữ an toàn trong ký quỹ
Tiếp theo sẽ diễn ra như thế nào?
Tham gia buổi học
Đánh dấu đã hoàn tất
Thanh toán được chuyển cho gia sư
Xem buổi học của tôi
Liên hệ hỗ trợ
STUDENT DASHBOARD
English:
My Sessions
Wallet / Transactions
Disputes / Complaints
Profile
Settings
Upcoming
In Escrow
Completed
Cancelled
Total Spent
Hours Learned
Find a New Mentor
Vietnamese:
Buổi học của tôi
Ví / Giao dịch
Khiếu nại / Tranh chấp
Hồ sơ
Cài đặt
Sắp diễn ra
Đang ký quỹ
Đã hoàn tất
Đã hủy
Tổng chi tiêu
Số giờ đã học
Tìm gia sư mới
MENTOR DASHBOARD
English:
Teaching Dashboard
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
Upcoming Sessions
Completed Sessions
Total Earnings
Available Balance
Pending Booking Requests
Update Availability
Vietnamese:
Bảng điều khiển gia sư
Buổi dạy của tôi
Lịch
Lịch trống
Tin nhắn
Thu nhập
Ví / Rút tiền
Hồ sơ
Xác minh
Tranh chấp
Cài đặt
Buổi dạy sắp tới
Buổi dạy đã hoàn tất
Tổng thu nhập
Số dư khả dụng
Yêu cầu đặt lịch đang chờ
Cập nhật lịch trống
WITHDRAW PAGE
English:
Withdraw Earnings
Available Balance
Pending Escrow Release
Total Withdrawn
Next Payout Date
Request Withdrawal
Bank Account
Withdrawal History
Processing
Completed
Failed
On Hold
Vietnamese:
Rút thu nhập
Số dư khả dụng
Đang chờ giải ngân ký quỹ
Tổng tiền đã rút
Ngày thanh toán tiếp theo
Yêu cầu rút tiền
Tài khoản ngân hàng
Lịch sử rút tiền
Đang xử lý
Hoàn tất
Thất bại
Đang tạm giữ
UNLOCK WITHDRAW PAGE
English:
Unlock Withdrawals
Withdrawals are currently locked
Complete mentor profile
Verify university email
Upload transcript or proof of expertise
Add verified bank account
Complete first paid session
Wait for escrow release
Resolve active disputes if any
Complete Verification
Add Bank Account
Contact Support
Vietnamese:
Mở khóa rút tiền
Chức năng rút tiền hiện đang bị khóa
Hoàn thiện hồ sơ gia sư
Xác minh email trường đại học
Tải lên bảng điểm hoặc minh chứng chuyên môn
Thêm tài khoản ngân hàng đã xác minh
Hoàn thành buổi dạy có thanh toán đầu tiên
Chờ giải ngân ký quỹ
Xử lý tranh chấp đang mở nếu có
Hoàn tất xác minh
Thêm tài khoản ngân hàng
Liên hệ hỗ trợ
MESSAGES
English:
Messages
Search conversations
Type a message
Send
Book Session
View Profile
Open Dispute
Contact Support
Sent
Delivered
Read
Typing
Vietnamese:
Tin nhắn
Tìm cuộc trò chuyện
Nhập tin nhắn
Gửi
Đặt lịch học
Xem hồ sơ
Mở tranh chấp
Liên hệ hỗ trợ
Đã gửi
Đã nhận
Đã xem
Đang nhập
SUPPORT PAGE
English:
Contact Support
Need help with a session, payment, dispute, or account issue?
Booking issue
Payment / escrow
Refund request
Mentor verification
Account access
Technical issue
Submit Request
Support request submitted
Vietnamese:
Liên hệ hỗ trợ
Bạn cần hỗ trợ về buổi học, thanh toán, tranh chấp hoặc tài khoản?
Vấn đề đặt lịch
Thanh toán / ký quỹ
Yêu cầu hoàn tiền
Xác minh gia sư
Truy cập tài khoản
Lỗi kỹ thuật
Gửi yêu cầu
Yêu cầu hỗ trợ đã được gửi
ADMIN DASHBOARD
English:
Dashboard
Users
Mentors
Mentor Verification
Transactions
Commission / Revenue
Payouts
Disputes
Resources
Reports
Settings
Audit Logs
Total Revenue
Platform Commission
Pending Payouts
Open Disputes
Process Payout
Vietnamese:
Tổng quan
Người dùng
Gia sư
Xác minh gia sư
Giao dịch
Hoa hồng / Doanh thu
Thanh toán cho gia sư
Tranh chấp
Tài nguyên
Báo cáo
Cài đặt
Nhật ký hoạt động
Tổng doanh thu
Hoa hồng nền tảng
Thanh toán đang chờ
Tranh chấp đang mở
Xử lý thanh toán
RESOURCES PAGE
English:
Academic Resources
Curated guides, templates, and learning resources for university students.
Article
PDF Guide
Video
Template
Read
Download
Watch
Popular this week
Featured resources
Vietnamese:
Tài nguyên học thuật
Bộ hướng dẫn, mẫu tài liệu và tài nguyên học tập được chọn lọc cho sinh viên đại học.
Bài viết
Hướng dẫn PDF
Video
Mẫu tài liệu
Đọc
Tải xuống
Xem
Phổ biến tuần này
Tài nguyên nổi bật
BECOME MENTOR PAGE
English:
Teach what you’ve mastered — earn safely with Gradora.
Become a verified mentor, help juniors succeed, and get paid securely through escrow.
Apply to Become a Mentor
Why become a Gradora mentor
How it works
Requirements
FAQ
Vietnamese:
Dạy những gì bạn đã thành thạo — nhận thu nhập an toàn cùng Gradora.
Trở thành gia sư đã xác minh, giúp sinh viên khóa dưới học tốt hơn và nhận thanh toán an toàn qua ký quỹ.
Đăng ký trở thành gia sư
Vì sao nên trở thành gia sư trên Gradora
Cách hoạt động
Điều kiện tham gia
Câu hỏi thường gặp
ERROR PAGES
English:
Page not found
The page you’re looking for doesn’t exist or may have been moved.
Go to Dashboard
Back to Home
You don’t have permission to view this page.
Vietnamese:
Không tìm thấy trang
Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
Về bảng điều khiển
Quay lại trang chủ
Bạn không có quyền truy cập trang này.
LAYOUT ADAPTATION FOR VIETNAMESE
Vietnamese text is often longer than English.
Make sure:
Buttons can expand naturally
Cards do not break
Sidebar items do not overflow
Tables remain readable
Mobile layout remains usable
Dropdown width supports “VN Tiếng Việt”
Long Vietnamese labels wrap cleanly
No text is clipped
INTERACTION STATES
Create language selector states:
Default
Hover
Open dropdown
Selected English
Selected Vietnamese
Mobile menu version
QUALITY CHECK
After implementing bilingual support, audit the whole app:
Switch to Vietnamese and check every page.
Switch back to English and check every page.
Make sure no mixed-language UI remains.
Make sure no important text stays hardcoded in English.
Make sure the selected language persists between pages.
Make sure dropdown works on desktop and mobile.
Make sure About page also supports language switching unless intentionally kept as English-only.
FINAL OUTPUT
The final app must have a complete bilingual UI system with English and Vietnamese. The language selector should look like a polished product feature, not a decorative dropdown. The whole Gradora app should feel consistent, professional, and production-ready in both languages.

