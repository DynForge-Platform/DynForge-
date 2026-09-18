# DynForge EXE101 – Chức Năng Đã Triển Khai

## Phân Công Nhóm
- **K1 (DangKhoa)**: MentorProfile model + repo, MentorService, MentorController, DataSeeder, luồng booking/escrow, ví điện tử, scheduler, toàn bộ kết nối frontend
- **K2**: Lớp chung (ApiResponse, exceptions, enums) + User model + UserRepository

---

## Backend

### K2 – Lớp Chung

#### `ApiResponse<T>` · `model/dto/ApiResponse.java`
Wrapper response chung cho tất cả API endpoint.
```
record ApiResponse<T>(boolean success, String message, T data)
  static ok(T data)
  static ok(String message, T data)
  static error(String message)
```

#### Exceptions · `exception/`
| Class | Kế Thừa | HTTP |
|---|---|---|
| `BadRequestException` | RuntimeException | 400 |
| `ResourceNotFoundException` | RuntimeException | 404 |
| `ErrorResponse` | — (record) | — |
| `GlobalExceptionHandler` | @RestControllerAdvice | xử lý 6 loại lỗi |

Các trường của `ErrorResponse`: `timestamp`, `status`, `error`, `message`, `fieldErrors`

`GlobalExceptionHandler` ánh xạ:
- `ResourceNotFoundException` → 404
- `BadRequestException` → 400
- `BadCredentialsException` → 401
- `AccessDeniedException` → 403
- `MethodArgumentNotValidException` → 400 kèm lỗi từng trường
- `ConstraintViolationException` → 400
- `Exception` → 500

#### Enums · `model/enums/`
| Enum | Giá Trị |
|---|---|
| `Role` | MENTEE, MENTOR, ADMIN |
| `UserStatus` | ACTIVE, SUSPENDED |
| `BookingStatus` | PENDING_PAYMENT, ESCROW_HELD, ACCEPTED, TAUGHT, COMPLETED, DISPUTED, REFUNDED, CANCELLED |
| `BookingFormat` | ONE_ON_ONE, GROUP |
| `VerificationStatus` | PENDING, APPROVED, REJECTED |
| `TransactionType` | TOPUP, PAYMENT, PAYOUT, REFUND, COMMISSION, WITHDRAWAL |
| `EscrowStatus` | HELD, RELEASED, REFUNDED |
| `TransactionStatus` | PENDING, COMPLETED, FAILED |

#### Entity `User` · `model/entity/User.java`
MongoDB document. Các trường: `id`, `fullName`, `email`, `phone`, `passwordHash`, `Set<Role> roles`, `studentId`, `major`, `year`, `avatarUrl`, `long walletBalance`, `UserStatus status`, `Instant createdAt`

#### `UserRepository` · `repository/UserRepository.java`
```
findByEmail(String email)
existsByEmail(String email)
```

---

### K1 – Hồ Sơ Mentor

#### Entity `MentorProfile` · `model/entity/MentorProfile.java`
MongoDB document liên kết với User qua `@Field(targetType = OBJECT_ID) ObjectId userId`.
Các trường: `id`, `userId`, `title`, `bio`, `major`, `university`, `teachingRole`, `List<Course> courses`, `List<String> skills`, `List<String> languages`, `List<String> formats` (mặc định: ["Online","Offline"]), `Map<String,List<String>> availability`, `boolean verified`, `double ratingAvg`, `int ratingCount`, `int sessionsCount`

**`major` + `teachingRole`** khớp đúng options của bộ lọc bên mentee (MentorListing) — mentor tự chọn khi đăng ký, nên filter Major/Teaching role hoạt động đúng.

#### `Course` · `model/entity/Course.java`
Nhúng trực tiếp (không có @Document). Các trường: `code`, `name`, `grade`, `ratePrivate`, `rateGroup`

#### `MentorRepository` · `repository/MentorRepository.java`
```
findByUserId(ObjectId userId)
findByVerifiedTrue()
findByVerifiedTrueAndCourses_Code(String code)
findByVerified(boolean verified)
findByVerifiedAndCourses_Code(boolean verified, String courseCode)
```

#### `MentorProfileResponse` · `model/dto/MentorProfileResponse.java`
DTO trả về từ tất cả endpoint mentor. Bao gồm dữ liệu user được làm phẳng: `fullName`, `avatarUrl`, cùng toàn bộ trường profile — trong đó có `List<String> formats` (hình thức dạy: Online/Offline).

#### `MentorService` · `service/MentorService.java`
```
listMentors(String course, String format, Boolean verified)
    – lọc theo: mã môn học (query DB), hình thức dạy (in-memory), trạng thái xác minh (mặc định: true)
getById(String id)              – tìm theo mentor profile id
getOwnProfile(User user)        – dành cho mentor đang đăng nhập
upsertOwnProfile(User, request) – tạo mới hoặc cập nhật profile (bao gồm cả formats)
```

#### `MentorController` · `controller/MentorController.java`
| Method | Đường Dẫn | Xác Thực | Mô Tả |
|---|---|---|---|
| GET | `/api/mentors` | Công khai | Danh sách mentor; hỗ trợ `?course=`, `?format=`, `?verified=` |
| GET | `/api/mentors/me` | MENTOR | Xem profile của chính mình |
| PUT | `/api/mentors/me` | MENTOR | Tạo hoặc cập nhật profile |
| GET | `/api/mentors/{id}` | Công khai | Lấy mentor theo profile ID |

**Query params của `GET /api/mentors`:**
- `?course=MAL301` — lọc theo mã môn học (query DB)
- `?format=Online` hoặc `?format=Offline` — lọc theo hình thức dạy (in-memory)
- `?verified=false` — bao gồm cả mentor chưa xác minh (mặc định chỉ trả `verified=true`)
- Có thể kết hợp: `?course=PRJ301&format=Online`

---

### K1 – Xác Thực (Auth)

#### `AuthService` · `service/AuthService.java`
```
register(RegisterRequest) → AuthResponse   – tạo User, cấp JWT + refresh token
login(LoginRequest)       → AuthResponse   – xác thực thông tin, cấp token
refresh(RefreshRequest)   → AuthResponse   – xoay vòng refresh token
logout(RefreshRequest)                     – thu hồi refresh token
```

#### `AuthController` · `controller/AuthController.java`
| Method | Đường Dẫn | Mô Tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập, trả về access + refresh token |
| POST | `/api/auth/google` | **Đăng nhập Google** (`{ idToken }` từ Google Identity Services; tự tạo tài khoản MENTEE lần đầu) |
| GET | `/api/auth/google/config` | Trả `{ clientId }` cho FE render nút Google (rỗng = chưa cấu hình) |
| POST | `/api/auth/refresh` | Xoay vòng refresh token |
| POST | `/api/auth/logout` | Thu hồi refresh token |
| POST | `/api/auth/forgot-password` | Gửi OTP đặt lại mật khẩu (`{ email }`) |
| POST | `/api/auth/verify-otp` | Xác thực OTP (`{ email, otp }`) |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu (`{ email, otp, newPassword }`) |

#### Bảo Mật · `security/`
- `JwtService` – tạo và xác thực JWT (thư viện JJWT)
- `JwtAuthenticationFilter` – đọc header `Authorization: Bearer`, nạp vào SecurityContext
- `UserPrincipal` – bọc entity `User` cho Spring Security
- `CustomUserDetailsService` – tải user theo email phục vụ xác thực

---

### K1 – Account Settings & Quên Mật Khẩu

#### `UserService` · `service/UserService.java`
```
updateProfile(User, UpdateProfileRequest)   – cập nhật hồ sơ (fullName, phone, studentId, major, year, avatarUrl)
changePassword(User, ChangePasswordRequest) – đổi mật khẩu; xác minh mật khẩu cũ, thu hồi toàn bộ refresh token
```

#### `UserController` · `controller/UserController.java`
| Method | Đường Dẫn | Xác Thực | Mô Tả |
|---|---|---|---|
| GET | `/api/users/me` | Đăng nhập | Thông tin tài khoản hiện tại |
| PUT | `/api/users/me` | Đăng nhập | Cập nhật hồ sơ cá nhân |
| POST | `/api/users/me/password` | Đăng nhập | Đổi mật khẩu (`{ currentPassword, newPassword }`) |

#### Luồng Quên Mật Khẩu (OTP) · `service/PasswordResetService.java`
Entity `PasswordResetToken` (`email`, `otp` 6 số, `verified`, `expiresAt`, `createdAt`), lưu ở collection `password_reset_tokens`.
```
forgotPassword(req)   – sinh OTP 6 số, xoá OTP cũ, lưu mới (hết hạn 10 phút); luôn báo thành công (không lộ email tồn tại)
verifyOtp(req)        – kiểm tra OTP đúng + chưa hết hạn → set verified=true
resetPassword(req)    – yêu cầu OTP đã verified; đổi mật khẩu, xoá OTP, thu hồi toàn bộ refresh token
```
**Gửi OTP qua email thật:** `MailService` (spring-boot-starter-mail, Gmail SMTP) gửi email HTML chứa OTP. Cấu hình `spring.mail.username` + `spring.mail.password` (Gmail App Password) trong `application.properties`; **bỏ trống username → fallback ghi OTP ra log** như trước (chế độ dev). Config `app.otp.expiration-ms=600000` (10 phút).

**Đăng nhập Google (thật):** FE load Google Identity Services, render nút Google chính chủ → nhận ID token → `POST /api/auth/google`. BE `GoogleTokenVerifier` xác minh token qua `https://oauth2.googleapis.com/tokeninfo` (kiểm tra `aud` khớp `google.client-id`, `email_verified`), `AuthService.loginWithGoogle` tìm user theo email hoặc **tự tạo tài khoản MENTEE** (mật khẩu ngẫu nhiên — đặt lại qua forgot-password nếu muốn đăng nhập thường), chặn tài khoản SUSPENDED, trả JWT như login thường. FE lấy `clientId` từ `GET /api/auth/google/config` nên chỉ cần cấu hình một chỗ (`google.client-id` trong `application.properties`); chưa cấu hình → nút hiển thị thông báo hướng dẫn.

---

### K1 – Booking & Escrow

#### Entity `Booking` · `model/entity/Booking.java`
Các trường: `id`, `menteeId`, `mentorId`, `courseCode`, `format (BookingFormat)`, `startAt`, `durationMin`, `price`, `commissionRate`, `status (BookingStatus)`, `escrowTxnId`, `createdAt`, `acceptedAt`, `taughtAt`

#### `BookingService` · `service/BookingService.java`
```
create(User mentee, BookingRequest)  – tạo booking ở trạng thái PENDING_PAYMENT
listMine(User)                       – trả về tất cả booking của user (với tư cách mentee hoặc mentor)
listMentorSchedule(User)             – lịch mentor: chỉ booking mà user là mentor, sắp xếp theo startAt tăng dần
getMentorEarnings(User)              – tổng hợp thu nhập mentor (xem MentorEarningsResponse)
getById(User, String id)             – trả về booking nếu user là bên tham gia
cancel(User, String id)              – hủy nếu đang ở PENDING_PAYMENT / ESCROW_HELD
```

#### `EscrowService` · `service/EscrowService.java`
```
pay(User mentee, String bookingId)           – trừ ví, tạo EscrowTransaction (HELD), status → ESCROW_HELD
accept(User mentor, String bookingId)        – mentor chấp nhận request, status ESCROW_HELD → ACCEPTED
decline(User mentor, String bookingId)       – mentor từ chối request → hoàn tiền mentee, status → REFUNDED
markTaught(User mentor, String bookingId)    – mentor báo đã dạy xong (từ ESCROW_HELD hoặc ACCEPTED), status → TAUGHT
confirmAndRelease(User mentee, String id)    – mentee xác nhận, giải phóng escrow cho mentor, status → COMPLETED
dispute(User mentee, String id)             – mở tranh chấp, status → DISPUTED
resolveDispute(String id, boolean release)   – ADMIN giải quyết: chuyển cho mentor hoặc hoàn tiền mentee
```

#### `MentorEarningsResponse` DTO · `model/dto/MentorEarningsResponse.java`
Tổng hợp thu nhập cho mentor console, tính từ EscrowTransaction + Booking:
- `availableBalance` – số dư có thể rút (ví mentor)
- `pendingClearance` – tổng payout đang giữ trong escrow (HELD), chưa giải phóng
- `totalEarned` – tổng thu nhập ròng từ escrow đã RELEASED
- `totalCommissionPaid` – tổng hoa hồng nền tảng đã trừ
- `completedSessions` – số buổi đã COMPLETED
- `upcomingSessions` – số buổi ESCROW_HELD/ACCEPTED/TAUGHT (chưa hoàn tất)

#### `BookingAutoConfirmScheduler` · `scheduler/BookingAutoConfirmScheduler.java`
Chạy mỗi giờ. Tìm tất cả booking `TAUGHT` mà `startAt + duration + 24 giờ < now` và tự động gọi `confirmAndRelease` (hoàn tất không cần thao tác thủ công).

#### `BookingController` · `controller/BookingController.java`
| Method | Đường Dẫn | Xác Thực | Mô Tả |
|---|---|---|---|
| POST | `/api/bookings` | MENTEE | Tạo booking |
| GET | `/api/bookings/mine` | Bất kỳ | Danh sách booking của mình |
| GET | `/api/bookings/mentor` | MENTOR | **Lịch mentor** — booking mà user là mentor, sắp xếp theo ngày |
| GET | `/api/bookings/earnings` | MENTOR | **Thu nhập mentor** — trả về `MentorEarningsResponse` |
| GET | `/api/bookings/{id}` | Bên tham gia | Xem chi tiết booking |
| POST | `/api/bookings/{id}/pay` | MENTEE | Thanh toán vào escrow |
| PATCH | `/api/bookings/{id}/cancel` | MENTEE | Hủy (trước khi thanh toán) |
| PATCH | `/api/bookings/{id}/accept` | MENTOR | **Chấp nhận request** (ESCROW_HELD → ACCEPTED) |
| PATCH | `/api/bookings/{id}/decline` | MENTOR | **Từ chối request** → hoàn tiền mentee (→ REFUNDED) |
| PATCH | `/api/bookings/{id}/mark-taught` | MENTOR | Đánh dấu đã dạy xong |
| PATCH | `/api/bookings/{id}/confirm` | MENTEE | Xác nhận và giải phóng thanh toán |
| PATCH | `/api/bookings/{id}/dispute` | MENTEE | Mở tranh chấp (`{ issueType, reason }` — lưu vào Booking) |
| PATCH | `/api/bookings/{id}/resolve` | ADMIN | Giải quyết tranh chấp (`{ "releaseToMentor": true/false }`) |

---

### K1 – Ví Điện Tử

#### Entity `WalletTransaction` · `model/entity/WalletTransaction.java`
Các trường: `id`, `userId`, `type (TransactionType)`, `amount`, `status (TransactionStatus)`, `reference`, `createdAt`

#### `WalletService` · `service/WalletService.java`
```
getWallet(User)                – trả về số dư hiện tại + lịch sử giao dịch gần đây
topUp(User, TopUpRequest)      – tạo giao dịch PENDING + tạo link thanh toán PayOS, trả về checkoutUrl thật
confirmPayosPayment(User, orderCode) – sau khi PayOS redirect về, xác minh trạng thái với PayOS → cộng ví (idempotent)
withdraw(User, WithdrawRequest) – payout mentor: trừ ví ngay, ghi giao dịch WITHDRAWAL (COMPLETED)
handleWebhook(WebhookRequest)  – (legacy) callback cổng thanh toán mock
```

`WithdrawRequest`: `amount` (tối thiểu 50.000), `bankName`, `bankAccount`.

#### `PayOsClient` · `service/PayOsClient.java`
Client REST gọi thẳng PayOS (không dùng SDK), ký `HMAC-SHA256` bằng checksum-key:
- `createPaymentLink(orderCode, amount, description, returnUrl, cancelUrl)` → `POST /v2/payment-requests`, trả checkoutUrl
- `getPaymentStatus(orderCode)` → `GET /v2/payment-requests/{orderCode}`, trả PAID/PENDING/CANCELLED/EXPIRED

Config trong `application.properties`: `payos.client-id`, `payos.api-key`, `payos.checksum-key`, `app.frontend.base-url`.

#### `WalletController` · `controller/WalletController.java`
| Method | Đường Dẫn | Xác Thực | Mô Tả |
|---|---|---|---|
| GET | `/api/wallet` | Bất kỳ | Xem số dư và lịch sử giao dịch |
| POST | `/api/wallet/topup` | Bất kỳ | Tạo link PayOS, trả về **checkoutUrl** để redirect |
| POST | `/api/wallet/payos-confirm?orderCode=` | Đăng nhập | Xác nhận sau khi PayOS redirect về → cộng ví |
| POST | `/api/wallet/withdraw` | MENTOR | **Rút tiền/payout** — trừ ví, ghi giao dịch WITHDRAWAL |
| POST | `/api/wallet/webhook` | Header secret | (legacy) callback mock |

**Luồng nạp tiền PayOS:** FE bấm "Pay" → `POST /topup` → redirect tới `checkoutUrl` của PayOS → user thanh toán → PayOS redirect về `/dashboard/wallet?orderCode=..&status=PAID` → FE gọi `POST /payos-confirm` → BE xác minh với PayOS → cộng ví.

---

### K1 – Xác Minh Mentor (KYC)

#### Entity `VerificationRequest` · `model/entity/VerificationRequest.java`
MongoDB document. Các trường: `id`, `userId (ObjectId)`, `course`, `claimedGrade` (A hoặc A+), `transcriptUrl`, `status (VerificationStatus)`, `reviewedBy (ObjectId)`, `reviewedAt`, `note`, `createdAt`

#### `VerificationRepository` · `repository/VerificationRepository.java`
```
findByStatus(VerificationStatus)
findByUserId(ObjectId userId)
```

#### `VerificationResponse` DTO · `model/dto/VerificationResponse.java`
Bao gồm thông tin user được làm phẳng: `userName`, `avatarUrl` (lấy từ User qua VerificationMapper).

#### `VerificationMapper` · `mapper/VerificationMapper.java`
Inject `UserRepository` để làm phẳng `fullName` và `avatarUrl` vào response.

#### `VerificationService` · `service/VerificationService.java`
```
submit(User, VerificationRequestDto)     – tạo yêu cầu mới (PENDING)
getMine(User)                            – lấy danh sách yêu cầu của mentor hiện tại
list(VerificationStatus)                 – danh sách tất cả; lọc theo status nếu truyền
decide(User reviewer, String id, ...)    – APPROVED → set verified=true trên MentorProfile; REJECTED → lưu note
```

#### `VerificationController` · `controller/VerificationController.java`
| Method | Đường Dẫn | Xác Thực | Mô Tả |
|---|---|---|---|
| POST | `/api/verifications` | Đăng nhập | Nộp yêu cầu xác minh (`course`, `claimedGrade`, `transcriptUrl`) |
| GET | `/api/verifications/mine` | Đăng nhập | Danh sách yêu cầu của mentor hiện tại |
| GET | `/api/verifications` | ADMIN | Danh sách tất cả; `?status=PENDING/APPROVED/REJECTED` để lọc |
| POST | `/api/verifications/{id}/decision` | ADMIN | Duyệt/từ chối (`{ "status": "APPROVED"/"REJECTED", "note": "..." }`) |

**Khi APPROVED:** `MentorProfile.verified` được tự động set thành `true`.

---

### K1 – Frontend: Luồng Xác Minh Mentor

#### `verificationService.ts` · `FE/src/app/services/verificationService.ts`
```
submitVerification(payload)          – POST /api/verifications
listMyVerifications()                – GET /api/verifications/mine
listVerifications(status?)           – GET /api/verifications
decideVerification(id, status, note) – POST /api/verifications/{id}/decision
```

#### Luồng "Become a Mentor → Apply → Success"
- **`BecomeMentor.tsx`** — trang marketing (benefits, requirements, các bước, FAQ, ước tính thu nhập). Nút **Apply now** nay context-aware: mentor đã đăng nhập → `/mentor/verification`; còn lại → `/register?apply=mentor`.
- **`Register`** (`Auth.tsx`) — đọc `?apply=mentor` để chọn sẵn vai trò Mentor; sau khi đăng ký mentor thành công → chuyển thẳng tới `/mentor/verification` (form apply).
- **`TeacherVerification.tsx`** — Mentor Apply (form upload) + Application success (xem dưới).

#### `TeacherVerification.tsx` · `FE/src/app/pages/teacher/TeacherVerification.tsx`
- Load `GET /api/verifications/mine` + `GET /api/mentors/me` khi mount (prefill courses/title/bio nếu đã có)
- **Đăng ký NHIỀU môn:** editor thêm/xoá từng môn (code, name, grade A/A+, giá 1-on-1, giá group) + skills/languages + upload tài liệu
- **Submit tạo cả MentorProfile:** gọi `PUT /api/mentors/me` (lưu toàn bộ courses → **mentee thấy được**) rồi `POST /api/verifications` (môn đại diện cho admin duyệt)
- **Mentor đã APPROVED:** vẫn hiện editor để thêm/sửa môn, nút "Save courses" chỉ gọi `PUT /api/mentors/me` (giữ verified=true)
- `StepProgress` + banner PENDING/APPROVED/REJECTED

**Sửa bug quan trọng (mentee không thấy mentor mới):** trước đây form apply chỉ tạo `VerificationRequest`, KHÔNG tạo `MentorProfile` → khi admin duyệt, `decide()` dùng `findByUserId().ifPresent()` không tìm thấy profile → mentor không bao giờ xuất hiện ở `/api/mentors`. Đã sửa:
- FE: form apply tạo MentorProfile (kèm courses) ngay lúc submit
- BE `MentorService.upsertOwnProfile`: profile mới kế thừa `verified=true` nếu mentor đã có verification APPROVED
- BE `VerificationService.decide(APPROVED)`: **upsert** — tạo profile nếu chưa có rồi set verified=true (an toàn cho mọi trạng thái)

#### `AdminVerification.tsx` · `FE/src/app/pages/admin/AdminVerification.tsx`
- Fetch tất cả yêu cầu từ `GET /api/verifications` thay vì mock data
- Bảng hiển thị: tên mentor, course, grade, transcript, ngày nộp, status
- Dialog review: ô nhập lý do từ chối + nút Approve / Reject
- Sau khi quyết định: cập nhật state tại chỗ, không cần reload trang

---

### K1 – Admin Backend (Bảng Điều Khiển Quản Trị)

Toàn bộ endpoint `/api/admin/**` yêu cầu quyền **ADMIN** (cấu hình trong `SecurityConfig`).

#### `AdminService` · `service/AdminService.java`
```
getDashboard()                       – tổng hợp số liệu toàn hệ thống
listUsers(Role role)                 – danh sách user, lọc theo vai trò nếu truyền
updateUserStatus(id, UserStatus)     – khóa/mở khóa tài khoản (ACTIVE / SUSPENDED)
listTransactions(TransactionType)    – tất cả giao dịch ví (kèm tên user), lọc theo loại
getCommissionReport()                – báo cáo hoa hồng nền tảng
```

#### `AdminController` · `controller/AdminController.java`
| Method | Đường Dẫn | Mô Tả |
|---|---|---|
| GET | `/api/admin/dashboard` | Số liệu tổng quan (xem `AdminDashboardResponse`) |
| GET | `/api/admin/users` | Danh sách tất cả user; `?role=MENTOR/MENTEE/ADMIN` để lọc |
| PATCH | `/api/admin/users/{id}/status` | Đổi trạng thái user (`{ "status": "ACTIVE"/"SUSPENDED" }`) |
| GET | `/api/admin/transactions` | Tất cả giao dịch ví; `?type=TOPUP/PAYMENT/...` để lọc |
| GET | `/api/admin/commission` | Báo cáo hoa hồng (xem `CommissionReportResponse`) |
| GET | `/api/admin/disputes` | Danh sách booking đang DISPUTED (kèm tên student/mentor) |
| GET | `/api/admin/mentors` | Tất cả mentor profiles (verified + chưa) — Mentor Management |

**Verification approve/reject** dùng chung `POST /api/verifications/{id}/decision` (ADMIN) — đã có từ phần KYC.
**Resolve dispute** dùng `PATCH /api/bookings/{id}/resolve` (ADMIN).

#### DTOs
- **`AdminDashboardResponse`**: `totalUsers`, `totalMentors`, `totalMentees`, `totalBookings`, `completedBookings`, `activeBookings` (ESCROW_HELD/ACCEPTED/TAUGHT), `disputedBookings`, `pendingVerifications`, `totalRevenue` (GMV từ escrow RELEASED), `totalCommission`, `escrowHeld`
- **`CommissionReportResponse`**: `commissionRate` (0.15), `totalCommissionEarned` (từ escrow RELEASED), `pendingCommission` (từ escrow HELD), `grossVolume`, `releasedCount`, `heldCount`
- **`AdminTransactionResponse`**: giao dịch ví + `userName` (làm phẳng từ User)
- **`UpdateUserStatusRequest`**: `status` (UserStatus)

#### Query methods mới cho Admin
- `UserRepository`: `findByRolesContaining(Role)`, `countByRolesContaining(Role)`
- `BookingRepository`: `countByStatus(BookingStatus)`, `countByStatusIn(Collection)`
- `EscrowTransactionRepository`: `findByStatus(EscrowStatus)`
- `WalletTransactionRepository`: `findAllByOrderByCreatedAtDesc()`

---

### K1 – Dispute (Tranh Chấp)

Đã triển khai trong `EscrowService` + `BookingController` (xem phần Booking & Escrow ở trên):
- **Tạo tranh chấp:** `PATCH /api/bookings/{id}/dispute` (MENTEE) — chỉ khi booking đang TAUGHT, status → DISPUTED
- **Giải quyết:** `PATCH /api/bookings/{id}/resolve` (ADMIN) — body `{ "releaseToMentor": true/false }`
  - `true` → `releaseEscrow()`: giải phóng payout cho mentor, status → COMPLETED
  - `false` → `refundEscrow()`: hoàn tiền cho mentee, status → REFUNDED

---

### K1 – Review & Cập Nhật Rating

#### Entity `Review` · `model/entity/Review.java`
MongoDB document. Các trường: `id`, `bookingId` (unique — 1 review/booking), `menteeId`, `mentorId` (userId của mentor), `courseCode`, `rating` (1–5), `comment`, `createdAt`

#### `ReviewRepository` · `repository/ReviewRepository.java`
```
existsByBookingId(ObjectId)                  – đảm bảo mỗi booking chỉ review 1 lần
findByMentorIdOrderByCreatedAtDesc(ObjectId) – danh sách review của mentor, mới nhất trước
```

#### `ReviewService` · `service/ReviewService.java`
```
create(User mentee, ReviewRequest)  – tạo review, sau đó cập nhật rating mentor
listForMentor(String mentorUserId)  – danh sách review công khai của một mentor
```
**Điều kiện tạo review:** chỉ mentee của booking, booking phải COMPLETED, mỗi booking 1 review.

**Cập nhật rating (tăng dần):** giữ nguyên baseline seed thay vì tính lại từ đầu:
```
newCount = ratingCount + 1
newAvg   = (ratingAvg * ratingCount + newRating) / newCount   (làm tròn 2 chữ số)
```
Cập nhật trực tiếp `MentorProfile.ratingAvg` và `ratingCount`.

#### `ReviewMapper` · `mapper/ReviewMapper.java`
Inject `UserRepository` để làm phẳng `menteeName` + `menteeAvatar` vào response.

#### `ReviewController` · `controller/ReviewController.java`
| Method | Đường Dẫn | Xác Thực | Mô Tả |
|---|---|---|---|
| POST | `/api/reviews` | MENTEE | Tạo review (`{ "bookingId", "rating" (1-5), "comment" }`) |
| GET | `/api/reviews?mentorId={userId}` | Công khai | Danh sách review của mentor |

---

### K1 – Dữ Liệu Mẫu · `seeder/DataSeeder.java`
`@Component`, `@Order(1)`, implements `CommandLineRunner`. Idempotent: bỏ qua nếu `khoa.tran@DynForge.vn` đã tồn tại.

Tài khoản mẫu (mật khẩu `DynForge@123` cho tất cả):

| Email | Vai Trò | Ghi Chú |
|---|---|---|
| `admin@DynForge.vn` | ADMIN | — |
| `student@DynForge.vn` | MENTEE | Số dư ví 500.000₫ |
| `khoa.tran@DynForge.vn` | MENTOR | "AI/ML Lecturer · FPT University"; môn: MAL301, MAL401, NLP301; rating 4.9 |
| `linh.nguyen@DynForge.vn` | MENTOR | "Software Engineer · Alumni 2023"; môn: PRJ301, SWR302, SWT301; rating 4.8 |
| `hung.pham@DynForge.vn` | MENTOR | "Senior Student · AI Major"; môn: PRO192, MAD101, CSD201; rating 4.7 |
| `thu.le@DynForge.vn` | MENTOR | "Business Analyst · Alumni 2023"; môn: MKT101, ACC101, FIN101; rating 4.8 |
| `minh.dang@DynForge.vn` | MENTOR | "Senior Student · SE Major"; môn: PRF192, LAB211, CSD201; rating 4.6 |

---

## Frontend

### Shared UI (Layout dùng chung)
- **`components/layouts/Header.tsx`** (NavBar) — logo, nav (Find mentors / Become mentor / Resources / About), `LanguageSwitcher`, dropdown auth-aware (avatar + vai trò + link dashboard + logout), mobile menu. Ẩn/hiện nút Login/Join theo trạng thái đăng nhập.
- **`components/layouts/Footer.tsx`** — footer chung.
- **`components/layouts/PublicLayout.tsx`** — Header + `<Outlet/>` + Footer + `ScrollRestoration`.
- **`components/layouts/DashboardLayout.tsx`** — layout dashboard theo vai trò (student/teacher/admin).
  - **Đã sửa bug identity:** trước đây header dashboard hardcode "Trang Do" / "Nguyễn Thị Linh" (mock) → nay dùng `useAuth().user` (tên + avatar thật, khớp với Header landing). Ảnh mặc định theo vai trò chỉ dùng khi user không có avatar.
  - **Đã sửa Log out:** nút cũ chỉ là `<Link to="/login">` (không xoá session) → nay gọi `logout()` rồi điều hướng về `/`.
- **Design tokens** · `src/styles/` — `theme.css`, `globals.css`, `tailwind.css`, `fonts.css` (biến màu, spacing, typography dùng chung toàn app).

### Login + Register (đã nối API)
- **`Login`** (`pages/Auth.tsx`) → `loginWithCredentials` → `POST /api/auth/login`; đọc `?redirect=` để quay lại đúng trang; có link **"Forgot password?"** → `/forgot-password`.
- **`Register`** → `registerWithCredentials` → `POST /api/auth/register`.
  - **Đã sửa lỗi wiring:** frontend trước đây gửi `role` nhưng backend `RegisterRequest` nhận `asMentor` (boolean) → đăng ký mentor không được cấp quyền MENTOR. Nay `authService.registerApi` gửi `asMentor: role === 'MENTOR'`.
- Cả hai có `QuickLogin` (demo) để đăng nhập nhanh theo vai trò không cần JWT.

### Quên Mật Khẩu (OTP) + Account Settings (đã nối API)

#### `ForgotPassword.tsx` · `pages/ForgotPassword.tsx` — route `/forgot-password`
Luồng 3 bước với step indicator:
1. Nhập email → `POST /api/auth/forgot-password` (`authService.forgotPassword`)
2. Nhập OTP 6 số → `POST /api/auth/verify-otp` (`verifyOtp`) — có nút "Resend code"
3. Đặt mật khẩu mới (+ confirm) → `POST /api/auth/reset-password` (`resetPassword`) → màn hình success → về `/login`
> OTP được gửi qua **email thật** khi đã cấu hình Gmail SMTP (`spring.mail.username/password`); chưa cấu hình thì ghi ra log.

#### `userService.ts` · `services/userService.ts`
```
getMe()                                  – GET /api/users/me
updateProfile(payload)                   – PUT /api/users/me
changePassword(current, new)             – POST /api/users/me/password
```

#### `DashboardProfile.tsx` — Account settings (user)
- Fetch `GET /api/users/me` khi mount; sửa fullName / phone / studentId / major / year / avatarUrl → `PUT /api/users/me`
- Email hiển thị read-only (không đổi được — là định danh đăng nhập)
- Dialog **Change password** → `POST /api/users/me/password` (xác minh mật khẩu cũ, khớp confirm)
- Sau khi lưu gọi `refreshUser()` để cập nhật tên/avatar trên Header

#### `TeacherProfile.tsx` — Account settings (mentor)
- Fetch `GET /api/mentors/me` + `GET /api/users/me`; sửa display name/avatar (user), headline→`title`, about→`bio`, skills, languages
- Lưu: `PUT /api/users/me` (name/avatar) + `PUT /api/mentors/me` (title/bio/skills/languages) — **giữ nguyên** courses/availability/formats đã fetch để không bị xoá
- Courses hiển thị read-only; preview strip hiển thị rating/sessions thật

#### `AuthContext.refreshUser()`
Re-fetch `GET /api/users/me`, dựng lại `AuthUser`, cập nhật localStorage + state — dùng sau khi đổi profile để Header đồng bộ tên/avatar.

### Admin Console (Frontend đã nối API)

#### `adminService.ts` · `services/adminService.ts`
```
getAdminDashboard()              – GET /api/admin/dashboard
listAdminUsers(role?)            – GET /api/admin/users
updateUserStatus(id, status)     – PATCH /api/admin/users/{id}/status
listAdminTransactions(type?)     – GET /api/admin/transactions
getCommissionReport()            – GET /api/admin/commission
listAdminDisputes()              – GET /api/admin/disputes
resolveDispute(bookingId, release) – PATCH /api/bookings/{id}/resolve
```

| Trang | File | Nối API |
|---|---|---|
| **Dashboard** | `admin/AdminOverview.tsx` | KPIs từ `/admin/dashboard`; recent txns từ `/admin/transactions`; pending verifications từ `/verifications?status=PENDING`; biểu đồ dựng từ giao dịch PAYMENT |
| **Transactions** | `admin/AdminTransactions.tsx` | `/admin/transactions` + filter theo type + search |
| **Commission** | `AdminDashboard.tsx` | `/admin/commission` (rate, GMV, commission earned/pending, released/held) + txns |
| **Verification** | `admin/AdminVerification.tsx` | `/verifications` + approve/reject (đã làm ở phần KYC) |
| **Disputes** | `admin/AdminDisputes.tsx` | `/admin/disputes` + dialog Refund student / Release to mentor → `/bookings/{id}/resolve` |
| **Users** | `admin/AdminUsers.tsx` | `/admin/users` + search/filter role + Suspend/Reactivate → `/admin/users/{id}/status` |

**Backend bổ sung cho Disputes:** `GET /api/admin/disputes` (`AdminDisputeResponse` — booking DISPUTED kèm tên student/mentor), `BookingRepository.findByStatus`.

### React Shell · router, axios, auth, route guards

#### `App.tsx` — Router
`createBrowserRouter` với 4 nhóm: Public, Student dashboard, Mentor portal, Admin portal + Auth + 404. Mỗi nhóm dashboard được bọc bởi guard theo vai trò (xem dưới).

#### `services/api.ts` — Axios client (auto refresh)
Axios instance base URL `http://localhost:8080`:
- **Request interceptor**: gắn `Authorization: Bearer <token>` từ localStorage
- **Response interceptor**: khi nhận **401**, tự động gọi `POST /api/auth/refresh` bằng refresh token, lưu token mới, rồi **retry request gốc** (cờ `_retry` chống lặp vô hạn). Nếu refresh thất bại → xoá token + chuyển về `/login`.
- **Backend hỗ trợ:** `SecurityConfig` cấu hình `authenticationEntryPoint` trả **401** (thay vì 403 mặc định) cho request chưa xác thực/token hết hạn → interceptor mới refresh + retry được. Access token TTL = 1 giờ (`app.jwt.expiration-ms=3600000`).

#### `context/AuthContext.tsx` — AuthContext
- `user` (persist qua localStorage), `login` (demo quick-login), `loginWithCredentials`, `registerWithCredentials`, `logout`
- `roleFromBackend`: gộp roles về 1 vai trò chính (admin > mentor > mentee)
- `buildUserFromTokens` + lưu access/refresh token

#### `components/RouteGuards.tsx` — Protected / RoleRoute
```
ProtectedRoute        – yêu cầu đã đăng nhập; nếu chưa → /login?redirect=<path hiện tại>
RoleRoute({ allow })  – yêu cầu vai trò nằm trong allow; chưa đăng nhập → /login; sai vai trò → /403
```
Áp dụng trong router:
- `/dashboard/*`, `/messages` → `RoleRoute allow={['mentee','mentor']}`
- `/mentor/*` → `RoleRoute allow={['mentor']}`
- `/admin/*` → `RoleRoute allow={['admin']}`

Guard render `<Outlet/>` khi hợp lệ, bọc ngoài `DashboardLayout` tương ứng. `Login` đọc query `?redirect=` để quay lại đúng trang sau khi đăng nhập.

### Lớp Dịch Vụ API · `FE/src/app/services/`

#### `api.ts`
Axios instance với base URL `http://localhost:8080`. Interceptors:
- Request: gắn `Authorization: Bearer <token>` từ localStorage
- Response: **401 → auto refresh + retry**; refresh lỗi → chuyển về `/login`

#### `mentorService.ts`
```
listMentors(course?)         – GET /api/mentors
getMentorById(id)            – GET /api/mentors/{id}
getMyMentorProfile()         – GET /api/mentors/me (profile mentor đang đăng nhập)
isObjectId(s)                – trả về true nếu s là chuỗi hex 24 ký tự (MongoDB ObjectId)
backendToMentor(profile)     – ánh xạ MentorProfileResponse → Mentor (kiểu frontend)
```
`backendToMentor` tự điền các trường còn thiếu bằng giá trị mặc định hợp lý (university, level, formats, responseTime).

#### `bookingService.ts`
```
createBooking / payBooking / getMyBookings / getBookingById
markTaught / confirmBooking / disputeBooking / cancelBooking
getMentorSchedule()          – GET /api/bookings/mentor (lịch mentor)
getMentorEarnings()          – GET /api/bookings/earnings
acceptBooking(id) / declineBooking(id)   – PATCH accept/decline (mentor console)
```

#### `walletService.ts`
```
getWallet() / topUp(amount)
withdraw(amount, bankName, bankAccount)   – POST /api/wallet/withdraw (payout mentor)
```

### Trang Public

#### `Home.tsx` — Landing
- Hero + search module + trust badges + escrow CTA (UI có sẵn)
- **Featured mentors** nay gọi `GET /api/mentors` khi mount, ánh xạ qua `backendToMentor`, lấy 6 mentor đầu; fallback mock nếu lỗi/rỗng

#### `HowItWorks.tsx` — How It Works (mới)
- Route `/how-it-works` (public), có nav link trong Header (`T.howItWorksTitle`)
- 4 bước cho sinh viên (Tìm mentor → Đặt & ký quỹ → Học → Xác nhận & giải phóng), khối giải thích escrow, 3 bước cho mentor, CTA
- Song ngữ VI/EN theo `useLanguage().lang`; nội dung tĩnh (không gọi API)

### Các Trang Đã Kết Nối Backend

#### `MentorListing.tsx` — Find Mentors (list + filter)
Gọi `GET /api/mentors` khi mount. Fallback về dữ liệu mock nếu request lỗi hoặc trả về rỗng. Filter (môn/vai trò/giá/rating) + search + sort chạy client-side trên dữ liệu đã fetch.

#### `MentorProfile.tsx` — Mentor Profile (public)
- Nếu `id` là hex 24 ký tự (ObjectId): gọi `GET /api/mentors/{id}`, ánh xạ sang `Mentor` qua `backendToMentor`
- **Reviews nối API:** sau khi lấy profile, gọi `GET /api/reviews?mentorId={userId}` → ánh xạ qua `backendToReview`; hiển thị empty state nếu chưa có review
- Ngược lại (id nguyên): tra cứu dữ liệu mock + review mẫu (chế độ demo)

#### `reviewService.ts`
```
listMentorReviews(mentorUserId)  – GET /api/reviews?mentorId=
createReview(bookingId, rating, comment)  – POST /api/reviews
backendToReview(r)               – ánh xạ ReviewResponse → Review (kiểu ReviewCard)
```

#### `ScheduleConsultation.tsx`
- Lấy thông tin mentor từ backend nếu `id` là ObjectId; lưu `mentorProfile.userId` để gọi API booking
- Lịch dùng ngày thực tế (`new Date()`) — không hardcode tháng cố định
- Truyền `month` và `year` (không chỉ `day`) sang `OrderSummary` qua navigation state
- Trạng thái định dạng booking (`ONE_ON_ONE` | `GROUP`) là giá trị enum, không phải chuỗi đã dịch

#### `OrderSummary.tsx`
- Đọc `state.year` + `state.month` để tạo chuỗi ISO `startAt` (tránh dùng ngày quá khứ hardcode)
- Dùng `state.bookingFormat` trực tiếp làm giá trị enum cho API
- Tất cả `useState` hook khai báo trước mọi return có điều kiện (tuân thủ Rules of Hooks)
- Gọi `POST /api/bookings` rồi `POST /api/bookings/{id}/pay` theo thứ tự

#### `StudentDashboard.tsx`
- Gọi `GET /api/bookings/mine`, hiển thị session phân nhóm theo trạng thái
- **Confirm** (TAUGHT → COMPLETED) → `PATCH /bookings/{id}/confirm`; **Dispute** (TAUGHT → DISPUTED) → `PATCH /bookings/{id}/dispute`
- **Review UI** (mới): session COMPLETED → `ReviewModal` chọn sao 1–5 + comment → `POST /api/reviews` (`createReview`); xử lý lỗi "đã review" bằng toast
- States: loading spinner, `EmptyState` khi rỗng, `toast.error` khi lỗi, toast success khi thành công

#### `DashboardDisputes.tsx` — Màn hình Dispute (mentee)
- Fetch `GET /api/bookings/mine`; danh sách dispute = booking `DISPUTED` + `REFUNDED`
- **Open New Dispute**: chọn booking đang `TAUGHT` → `PATCH /bookings/{id}/dispute` → refetch
- KPIs: Open (DISPUTED) / Refunded (REFUNDED) / tổng giá trị; đủ loading/empty/error/success states

#### `TeacherAvailability.tsx` — Lịch rảnh (data thật)
- Load `availability` + `formats` từ `GET /api/mentors/me`; lưu qua `PUT /api/mentors/me` (giữ nguyên các field khác)
- Lưới tuần map ngày ngắn (Mon) ↔ tên đầy đủ (Monday) khớp backend

#### `TeacherCalendar.tsx` — Lịch (data thật)
- Ngày thực tế (không hardcode); booking thật từ `GET /api/bookings/mentor`; ngày "available" lấy từ `availability` của mentor
- **Chọn ngày** → hiện các buổi dạy trong ngày, hoặc "Không có lịch dạy trong ngày này" nếu trống
- **Upcoming sessions** = booking sắp tới thật (gần nhất trước), bấm vào → dẫn tới `/mentor/sessions`

> `BookingResponse` nay kèm `menteeName` + `mentorName` (BookingMapper tra cứu User) → calendar/sessions hiển thị đúng tên người.

#### `TeacherSessions.tsx`
- Fetch từ `GET /api/bookings/mentor` (chỉ booking của mentor)
- Tab **Requests** (ESCROW_HELD): nút **Accept** / **Decline** gọi API accept/decline
- Tab **Accepted**: nút Mark done / Join; tab Taught/Completed: View; Disputed: Respond
- Phản hồi lỗi qua `toast.error()` khi fetch thất bại

---

### Mentor Console (Frontend đã nối API)

#### `TeacherDashboard.tsx` — Dashboard
- KPIs lấy từ `GET /api/bookings/earnings`: upcoming, completed, net earnings; rating từ `GET /api/mentors/me`
- **Upcoming schedule**: booking ACCEPTED/TAUGHT từ `GET /api/bookings/mentor`
- **Pending requests**: booking ESCROW_HELD, nút Accept/Decline gọi API tại chỗ
- Badge "verified" hiển thị theo `MentorProfile.verified`

#### `TeacherSessions.tsx` — Requests & Schedule
- Xem mục trên; là nơi mentor xử lý accept/decline và theo dõi toàn bộ lịch dạy

#### `TeacherEarnings.tsx` — Earnings & Payout
- KPIs từ `GET /api/bookings/earnings`: totalEarned, pendingClearance, availableBalance, totalCommissionPaid
- **Withdraw**: modal nhập số tiền + ngân hàng + số tài khoản → `POST /api/wallet/withdraw`
- **Session payouts**: giao dịch type `PAYOUT` từ `GET /api/wallet`
- **Withdrawal history**: giao dịch type `WITHDRAWAL`
- Biểu đồ thu nhập 6 tháng dựng từ giao dịch PAYOUT thật (gom nhóm theo tháng)

---

### K1 – Academic Resources (dữ liệu thật)
- **`Resource`** entity (`resources`): type, title, description, source, university, subject, level, **url**
- **`ResourceController`**: `GET /api/resources` (công khai)
- **`ResourceSeeder`** (`@Order(2)`): seed sẵn 8 tài nguyên (PDF/Article/Video/Template) với URL thật nếu collection rỗng
- FE `resourceService.listResources()`; `Resources.tsx` fetch từ API; **ResourceCard** nút Read/Download/Watch mở `resource.url` (`window.open`)

---

### K1 – Nhắn Tin (Messaging, dữ liệu thật)

#### Backend
- **`Message`** entity (`messages`): `senderId`, `recipientId`, `content`, `read`, `createdAt`
- **`MessageRepository`**: `findBySenderIdAndRecipientId`, `findBySenderIdOrRecipientId`
- **`MessageService`**:
  ```
  send(sender, {recipientId, content})   – gửi tin nhắn
  getConversation(me, otherUserId)       – lấy toàn bộ thread + đánh dấu đã đọc; trả kèm thông tin người kia
  listConversations(me)                  – danh sách hội thoại (người gần nhất trước) + lastMessage + unreadCount
  ```
- **`MessageController`** (yêu cầu đăng nhập):
  | Method | Đường Dẫn | Mô Tả |
  |---|---|---|
  | GET | `/api/messages/conversations` | Danh sách hội thoại |
  | GET | `/api/messages/{otherUserId}` | Thread với 1 người (đánh dấu đã đọc) |
  | POST | `/api/messages` | Gửi tin (`{ recipientId, content }`) |

#### Frontend
- **`messageService.ts`**: `listConversations`, `getConversation`, `sendMessage`
- **`Messages.tsx`** (dùng chung mentee/mentor): danh sách hội thoại + khung chat, **polling** (hội thoại 5s, thread mở 3s) cho cảm giác trò chuyện trực tiếp; bong bóng trái/phải theo `mine`; auto-scroll; đánh dấu đã đọc khi mở
- **`MentorProfile.tsx`**: nút "Message" mở `/messages/{mentorUserId}` để bắt đầu hội thoại với mentor

---

### K1 – Phòng Học Trực Tuyến + Ghi Hình (bằng chứng tranh chấp)

#### Phòng meet riêng theo booking
- **`MeetRoomOverlay.tsx`** nhúng **Jitsi Meet** với phòng `DynForge-{bookingId}` → mentee và mentor vào **cùng một phòng** (video/audio thật, miễn phí, không cần key)
- Cả StudentDashboard, TeacherSessions, TeacherDashboard đều dùng chung component này khi bấm **Join** (chỉ join được khi booking ACCEPTED)

#### Ghi hình buổi học
- Nút **Record session** dùng `getDisplayMedia` + `MediaRecorder` (webm) → khi dừng, upload lên `POST /api/recordings` (multipart)
- Backend `RecordingService` lưu file vào thư mục `app.recordings.dir` (mặc định `./recordings`) + metadata trong Mongo (`recordings`)
- Chỉ **participant** của booking (hoặc admin) mới upload được

#### Admin xem bằng chứng
- **`AdminRecordings.tsx`** (route `/admin/recordings`, nav "Recordings") — liệt kê tất cả bản ghi từ `GET /api/admin/recordings`; **Play** (mở blob) / **Download**
- Stream file: `GET /api/recordings/{id}/file`

| Method | Đường Dẫn | Xác Thực | Mô Tả |
|---|---|---|---|
| POST | `/api/recordings` | Participant | Upload bản ghi (multipart: `bookingId`, `file`) |
| GET | `/api/recordings/{id}/file` | Đăng nhập | Tải/xem file bản ghi |
| GET | `/api/admin/recordings` | ADMIN | Danh sách bản ghi (bằng chứng) |

Config: `spring.servlet.multipart.max-file-size=500MB`.

---

## Tóm Tắt Luồng Booking

```
Sinh viên đặt lịch  → POST /api/bookings              → PENDING_PAYMENT
Sinh viên thanh toán → POST /api/bookings/{id}/pay    → ESCROW_HELD  (trừ ví, tạo escrow)
Mentor chấp nhận    → PATCH /api/bookings/{id}/accept  → ACCEPTED     (tùy chọn)
  HOẶC Mentor từ chối → PATCH /api/bookings/{id}/decline → REFUNDED  (hoàn tiền mentee)
Mentor dạy xong     → PATCH /api/bookings/{id}/mark-taught → TAUGHT   (từ ESCROW_HELD hoặc ACCEPTED)
Sinh viên xác nhận  → PATCH /api/bookings/{id}/confirm → COMPLETED  (giải phóng escrow cho mentor)
  HOẶC
Tự động xác nhận (24 giờ sau buổi học)               → COMPLETED
  HOẶC
Sinh viên khiếu nại → PATCH /api/bookings/{id}/dispute → DISPUTED
Admin giải quyết    → PATCH /api/bookings/{id}/resolve → COMPLETED hoặc REFUNDED
```

---

## Mentor Console (Backend)

Tập hợp các endpoint phục vụ giao diện quản lý của mentor:

| Chức năng | Endpoint | Mô tả |
|---|---|---|
| **Requests accept/decline** | `PATCH /api/bookings/{id}/accept` · `/decline` | Chấp nhận (→ ACCEPTED) hoặc từ chối (→ hoàn tiền, REFUNDED) yêu cầu đã thanh toán |
| **Schedule** | `GET /api/bookings/mentor` | Lịch dạy — booking mà user là mentor, sắp xếp theo `startAt` tăng dần |
| **Earnings** | `GET /api/bookings/earnings` | Thu nhập tổng hợp: số dư khả dụng, đang chờ giải phóng, đã kiếm được, hoa hồng, số buổi |
| **Payout** | `POST /api/wallet/withdraw` | Rút tiền từ ví về tài khoản ngân hàng (ghi giao dịch WITHDRAWAL) |
| **Mark-taught** | `PATCH /api/bookings/{id}/mark-taught` | Đánh dấu buổi học đã hoàn thành (→ TAUGHT) |

**Lưu ý về bảo mật:** đã sửa `SecurityConfig` để `GET /api/verifications/mine` cho user đã đăng nhập (trước đó toàn bộ `GET /api/verifications/**` bị giới hạn chỉ ADMIN).

---

## Hạ Tầng AI — `ClaudeClient`

> **Ghi chú:** Các tính năng AI phía admin (trợ lý phân xử tranh chấp, tóm tắt buổi học, kiểm tra verification) **đã được gỡ bỏ**. AI hiện chỉ phục vụ mentee/mentor (xem các phần dưới).

### `ClaudeClient` · `service/ClaudeClient.java`
Client mỏng gọi Anthropic (Claude) Messages API — **không dùng SDK**, viết theo đúng khuôn mẫu của `PayOsClient` (Spring `RestClient`, parse response bằng `Map` vì Spring Boot 4.1 dùng Jackson 3 nên không có `JsonNode`).
- `POST https://api.anthropic.com/v1/messages`, header `x-api-key` + `anthropic-version: 2023-06-01`.
- `isConfigured()` trả về `false` khi chưa có API key → các service AI chuyển sang chế độ **demo (dữ liệu mẫu)** thay vì báo lỗi.
- `complete(systemPrompt, userPrompt, maxTokens)` trả về text đã ghép từ các block `content[]`.

### Cấu hình · `application.properties`
```
anthropic.base-url=https://api.anthropic.com
anthropic.api-key=          # <-- dán API key vào đây để bật; bỏ trống -> chế độ demo
anthropic.model=claude-opus-4-8
```

---

## Tính Năng AI Cho Mentee (Nhóm 2)

Triết lý: AI **kết nối mentee tới đúng mentor thật** + **làm buổi học với người thật hiệu quả hơn**, không thay thế mentor bằng bot. Cùng cơ chế demo (không cần key → bản mẫu, có key → Claude thật).

### `AiMenteeService` · `service/AiMenteeService.java`
Một service, hai tính năng; controller mới `AiController` (`@RequestMapping("/api/ai")`, mọi user đã đăng nhập).

**#1 — AI tư vấn chọn mentor (matchmaker)**
- `matchMentors(query)`: nạp toàn bộ mentor thật (`MentorService.listAllMentors`), dựng "catalog" gắn thẻ `[M1] [M2]…` (môn, vai trò, đã xác minh, đánh giá, học phí, hình thức) rồi để Claude chọn 2-3 người + giải thích.
- Claude phải in dòng đầu `MENTORS: M1, M3` → `parseMentorTags()` map về mentor id (route `/mentors/{id}`), phần còn lại là lời tư vấn.
- Không key → `mockMatch()` chấm điểm bằng khớp từ khoá (môn/ngành/kỹ năng) + đánh giá, chọn top 3.
- Endpoint: `POST /api/ai/mentor-match` body `{query}` → `MentorMatchResponse(advice, matches[{mentorId,name,reason}])`.

**#2 — AI gia sư hậu buổi học (grounded)**
- `askAboutSession(user, bookingId, question)`: kiểm tra user là người tham gia booking (hoặc admin), gom môn học + lịch sử chat làm ngữ cảnh, để Claude trả lời **bám sát buổi học đó**; ngoài phạm vi thì gợi ý đặt thêm buổi.
- Không key → `mockAsk()` trả lời mẫu + gợi ý đặt buổi.
- Endpoint: `POST /api/ai/sessions/{bookingId}/ask` body `{question}` → `SessionAskResponse(answer)`.

### Frontend
- `services/aiService.ts`: `mentorMatch(query)`, `askSession(bookingId, question)`.
- `pages/MentorListing.tsx`: thẻ **"Tư vấn chọn gia sư bằng AI"** đầu cột kết quả — nhập nhu cầu → hiện lời tư vấn + chip mentor gợi ý (click sang hồ sơ).
- `pages/StudentDashboard.tsx`: buổi học TAUGHT/COMPLETED có nút **"AI hỏi bài"** → dialog hỏi đáp nhiều lượt bám sát buổi học.

**Trạng thái Nhóm 2:** #1 + #2 — ✅ đã triển khai (demo không cần key, tự lên Claude thật khi có key).

---

## AI Trong Phòng Học (MeetRoomOverlay)

Hai tiện ích AI ngay trong giao diện meet (`components/MeetRoomOverlay.tsx`), dùng được cho cả mentee lẫn mentor:

### #1 — Ghi chú buổi học + AI viết lại nội dung chính
- Nút **"Notes"** ở thanh điều khiển → mở panel ghi chú bên phải khung Jitsi.
- Ghi chú **tự lưu vào localStorage** theo booking (`DynForge_meet_note_{bookingId}`) — đóng tab/join lại không mất.
- Nút **"Dùng AI viết lại nội dung chính"** → `POST /api/ai/sessions/{bookingId}/rewrite-note` body `{notes}` → `NoteRewriteResponse(note)`; AI cấu trúc lại thành: Nội dung chính / Việc cần làm-bài tập / Câu hỏi còn lại. Kết quả thay thế nội dung textarea.
- BE: `AiMenteeService.rewriteNote(user, bookingId, notes)` — kiểm tra là người trong booking; không có API key → `mockNote()` sắp xếp lại ghi chú, gắn nhãn DEMO.
- FE: `aiService.rewriteNote(bookingId, notes)`.

### #2 — Pop-up AI chat trong meet
- Nút **"AI chat"** ở thanh điều khiển → pop-up chat nổi góc phải (360×420px) đè lên khung meet.
- Chat nhiều lượt với trợ lý AI, **bám sát buổi học** — tái sử dụng endpoint `POST /api/ai/sessions/{bookingId}/ask` (đã có từ Nhóm 2 #2, kèm kiểm tra participant).
- Có trạng thái "Đang suy nghĩ…", auto-scroll, bong bóng trái/phải.
