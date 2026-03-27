# 📋 Đặc Tả Dự Án: Web Quản Lý Sự Kiện

## 1. Tổng Quan Dự Án

**Tên dự án:** Event Management System  
**Mục tiêu:** Xây dựng ứng dụng web quản lý sự kiện cho phép tổ chức, đăng ký và theo dõi các sự kiện.  
**Ngôn ngữ:** Java 17+  
**Framework:** Spring Boot 3.x  
**Database:** MongoDB  
**Frontend:** Thymeleaf (server-side rendering)  
**Xác thực:** Spring Security + Session  

---

## 2. Tech Stack Chi Tiết

| Thành phần | Công nghệ |
|---|---|
| Backend | Spring Boot 3.x, Java 17+ |
| Database | MongoDB (Spring Data MongoDB) |
| Frontend | Thymeleaf + Bootstrap 5 |
| Security | Spring Security (Form Login + Session) |
| Build tool | Maven |
| Template engine | Thymeleaf + Thymeleaf Security Extras |
| File upload | Spring Multipart (banner/image) |
| Validation | Spring Validation (jakarta.validation) |

---

## 3. Cấu Trúc Thư Mục Dự Án

```
event-management/
├── src/
│   ├── main/
│   │   ├── java/com/example/eventmanagement/
│   │   │   ├── EventManagementApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── MongoConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── EventController.java
│   │   │   │   ├── RegistrationController.java
│   │   │   │   ├── AdminController.java
│   │   │   │   └── DashboardController.java
│   │   │   ├── model/
│   │   │   │   ├── User.java
│   │   │   │   ├── Event.java
│   │   │   │   ├── Registration.java
│   │   │   │   └── enums/
│   │   │   │       ├── Role.java
│   │   │   │       └── EventStatus.java
│   │   │   ├── repository/
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── EventRepository.java
│   │   │   │   └── RegistrationRepository.java
│   │   │   ├── service/
│   │   │   │   ├── UserService.java
│   │   │   │   ├── EventService.java
│   │   │   │   ├── RegistrationService.java
│   │   │   │   ├── FileStorageService.java
│   │   │   │   └── impl/
│   │   │   │       ├── UserServiceImpl.java
│   │   │   │       ├── EventServiceImpl.java
│   │   │   │       └── RegistrationServiceImpl.java
│   │   │   ├── dto/
│   │   │   │   ├── EventDto.java
│   │   │   │   ├── UserDto.java
│   │   │   │   └── RegistrationDto.java
│   │   │   └── exception/
│   │   │       ├── GlobalExceptionHandler.java
│   │   │       ├── EventNotFoundException.java
│   │   │       └── CapacityExceededException.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/
│   │       │   ├── css/
│   │       │   ├── js/
│   │       │   └── uploads/          ← lưu ảnh banner
│   │       └── templates/
│   │           ├── layout/
│   │           │   └── base.html
│   │           ├── auth/
│   │           │   ├── login.html
│   │           │   └── register.html
│   │           ├── events/
│   │           │   ├── list.html
│   │           │   ├── detail.html
│   │           │   ├── form.html
│   │           │   └── my-events.html
│   │           ├── admin/
│   │           │   ├── dashboard.html
│   │           │   ├── users.html
│   │           │   └── reports.html
│   │           └── dashboard/
│   │               └── organizer.html
├── pom.xml
└── README.md
```

---

## 4. Data Model (MongoDB Documents)

### 4.1 User
```java
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String fullName;
    private String email;           // unique, dùng để login
    private String password;        // BCrypt encoded
    private Role role;              // ADMIN | ORGANIZER | ATTENDEE
    private boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 4.2 Event
```java
@Document(collection = "events")
public class Event {
    @Id
    private String id;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private EventStatus status;     // DRAFT | PUBLISHED | CANCELLED
    private int maxCapacity;        // giới hạn số người tham dự (0 = không giới hạn)
    private int currentAttendees;   // đếm số đã đăng ký
    private List<String> tags;      // danh mục / tag
    private String bannerImagePath; // đường dẫn ảnh banner
    private String organizerId;     // ref đến User.id
    private String organizerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 4.3 Registration
```java
@Document(collection = "registrations")
public class Registration {
    @Id
    private String id;
    private String eventId;         // ref đến Event.id
    private String userId;          // ref đến User.id
    private String userFullName;
    private String userEmail;
    private LocalDateTime registeredAt;
    private String status;          // CONFIRMED | CANCELLED
}
```

### 4.4 Enums
```java
public enum Role {
    ADMIN, ORGANIZER, ATTENDEE
}

public enum EventStatus {
    DRAFT, PUBLISHED, CANCELLED
}
```

---

## 5. Phân Quyền & Bảo Mật

### Roles
| Role | Mô tả |
|---|---|
| **GUEST** | Chưa đăng nhập. Chỉ xem danh sách & chi tiết sự kiện PUBLISHED |
| **ATTENDEE** | Đăng nhập. Xem + đăng ký tham dự sự kiện PUBLISHED |
| **ORGANIZER** | Tạo, sửa, xóa sự kiện của mình. Xem danh sách người đăng ký sự kiện của mình |
| **ADMIN** | Toàn quyền: quản lý user, quản lý tất cả sự kiện, xem báo cáo |

### Phân quyền URL (SecurityConfig)
```
GET  /                      → PUBLIC (tất cả)
GET  /events                → PUBLIC
GET  /events/{id}           → PUBLIC
GET  /auth/login            → PUBLIC
POST /auth/login            → PUBLIC
GET  /auth/register         → PUBLIC
POST /auth/register         → PUBLIC

POST /events/{id}/register  → ATTENDEE
GET  /my-registrations      → ATTENDEE

GET  /organizer/**          → ORGANIZER
POST /events/create         → ORGANIZER
PUT  /events/{id}/edit      → ORGANIZER (chỉ sự kiện của mình)
DELETE /events/{id}         → ORGANIZER (chỉ sự kiện của mình)

GET  /admin/**              → ADMIN
```

### Spring Security Config
- Form login với custom login page `/auth/login`
- Session-based authentication
- BCryptPasswordEncoder cho mật khẩu
- Remember-me có thể bật tùy chọn
- CSRF enabled (mặc định với Thymeleaf)

---

## 6. Tính Năng Chi Tiết

### 6.1 Quản Lý Sự Kiện (CRUD)

**Danh sách sự kiện (Public)**
- Hiển thị tất cả sự kiện có status = PUBLISHED
- Lọc theo tag/danh mục
- Lọc theo ngày (sắp diễn ra / đã qua)
- Tìm kiếm theo tên sự kiện
- Phân trang (mỗi trang 9 sự kiện, dạng card)
- Hiển thị: banner, tên, ngày, địa điểm, số chỗ còn lại

**Chi tiết sự kiện (Public)**
- Toàn bộ thông tin sự kiện
- Số chỗ còn lại = maxCapacity - currentAttendees
- Nút "Đăng ký tham dự" (chỉ hiện nếu ATTENDEE đã login và còn chỗ)
- Nếu GUEST → redirect đến login khi bấm đăng ký

**Tạo sự kiện (ORGANIZER)**
- Form nhập: title, description, location, startDate, endDate
- Upload banner image (jpg/png, tối đa 5MB)
- Chọn tags (input dạng tag/chip)
- Đặt maxCapacity (số nguyên dương, 0 = unlimited)
- Chọn status: DRAFT (lưu nháp) hoặc PUBLISHED (công khai ngay)
- Validate: endDate phải sau startDate

**Sửa sự kiện (ORGANIZER - chỉ sự kiện của mình)**
- Tương tự form tạo, pre-fill dữ liệu cũ
- Không cho sửa nếu status = CANCELLED
- Nếu đã có người đăng ký, không cho giảm maxCapacity xuống dưới currentAttendees

**Xóa / Hủy sự kiện (ORGANIZER)**
- Không xóa vật lý nếu đã có người đăng ký → chuyển status = CANCELLED
- Xóa vật lý chỉ khi chưa có ai đăng ký

**Sự kiện của tôi (ORGANIZER)**
- Danh sách sự kiện do mình tạo (tất cả status)
- Có thể lọc theo status
- Xem danh sách người đã đăng ký từng sự kiện

### 6.2 Đăng Ký Tham Gia Sự Kiện

**Đăng ký (ATTENDEE)**
- POST `/events/{id}/register`
- Kiểm tra: sự kiện còn chỗ không (currentAttendees < maxCapacity hoặc maxCapacity = 0)
- Kiểm tra: user chưa đăng ký sự kiện này trước đó
- Tạo Registration document, tăng currentAttendees của Event
- Hiển thị thông báo thành công

**Hủy đăng ký (ATTENDEE)**
- POST `/registrations/{id}/cancel`
- Chuyển Registration.status = CANCELLED
- Giảm currentAttendees của Event

**Danh sách đăng ký của tôi (ATTENDEE)**
- GET `/my-registrations`
- Hiển thị sự kiện đã đăng ký, trạng thái, nút hủy

### 6.3 Quản Lý Người Dùng (ADMIN)

- Danh sách tất cả user (phân trang)
- Tìm kiếm theo email/tên
- Lọc theo role
- Kích hoạt / vô hiệu hóa tài khoản (enabled = true/false)
- Đổi role của user
- Xem thông tin chi tiết user

### 6.4 Thống Kê & Báo Cáo (ADMIN)

**Dashboard Admin**
- Tổng số sự kiện (theo từng status)
- Tổng số user (theo từng role)
- Tổng số lượt đăng ký
- Top 5 sự kiện có nhiều người đăng ký nhất
- Biểu đồ sự kiện theo tháng (dùng Chart.js inline)

**Báo cáo chi tiết**
- Xuất danh sách đăng ký của một sự kiện (hiển thị dạng bảng)
- Thống kê theo khoảng thời gian

---

## 7. Giao Diện (Thymeleaf Templates)

### Layout chung (`layout/base.html`)
- Navbar responsive (Bootstrap 5)
- Hiển thị tên user đang đăng nhập + role
- Menu điều hướng thay đổi theo role (dùng `sec:authorize`)
- Footer

### Màu sắc & Style
- Theme: Bootstrap 5 mặc định, có thể dùng màu chủ đạo xanh dương (#0d6efd)
- Dùng Bootstrap Icons hoặc Font Awesome

### Các trang cần có
| Trang | URL | Role |
|---|---|---|
| Trang chủ / Danh sách sự kiện | `/` hoặc `/events` | ALL |
| Chi tiết sự kiện | `/events/{id}` | ALL |
| Đăng nhập | `/auth/login` | GUEST |
| Đăng ký tài khoản | `/auth/register` | GUEST |
| Tạo/Sửa sự kiện | `/events/create`, `/events/{id}/edit` | ORGANIZER |
| Sự kiện của tôi | `/organizer/my-events` | ORGANIZER |
| Đăng ký của tôi | `/my-registrations` | ATTENDEE |
| Dashboard Admin | `/admin/dashboard` | ADMIN |
| Quản lý User | `/admin/users` | ADMIN |
| Báo cáo | `/admin/reports` | ADMIN |

---

## 8. Cấu Hình `application.properties`

```properties
# MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/eventdb

# Server
server.port=8080

# Session
server.servlet.session.timeout=30m

# File upload
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=5MB
spring.servlet.multipart.max-request-size=10MB

# Upload directory
app.upload.dir=src/main/resources/static/uploads/

# Thymeleaf
spring.thymeleaf.cache=false
```

---

## 9. Dependencies `pom.xml`

```xml
<dependencies>
    <!-- Spring Boot Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Thymeleaf -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>

    <!-- Thymeleaf Security Extras (sec:authorize) -->
    <dependency>
        <groupId>org.thymeleaf.extras</groupId>
        <artifactId>thymeleaf-extras-springsecurity6</artifactId>
    </dependency>

    <!-- Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- MongoDB -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-mongodb</artifactId>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- DevTools -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
        <scope>runtime</scope>
        <optional>true</optional>
    </dependency>

    <!-- Test -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## 10. Luồng Nghiệp Vụ Quan Trọng

### Luồng Đăng Ký Tham Dự Sự Kiện
```
ATTENDEE xem chi tiết sự kiện
    → Bấm "Đăng ký tham dự"
    → POST /events/{id}/register
    → RegistrationService.register(eventId, userId)
        → Kiểm tra Event tồn tại & status = PUBLISHED
        → Kiểm tra chưa đăng ký trước đó
        → Kiểm tra còn chỗ (maxCapacity = 0 hoặc currentAttendees < maxCapacity)
        → Tạo Registration (status = CONFIRMED)
        → Tăng Event.currentAttendees += 1 (atomic update)
    → Redirect về /events/{id} với flash message thành công
```

### Luồng Tạo Sự Kiện
```
ORGANIZER vào /events/create
    → Điền form & upload banner
    → POST /events/create
    → EventService.create(eventDto, organizerId, file)
        → Validate dữ liệu
        → Lưu file ảnh vào /uploads/, lấy path
        → Tạo Event document
        → Nếu status = PUBLISHED → hiện ngay cho public
    → Redirect về /organizer/my-events
```

---

## 11. Lưu Ý Cho AI Agent Khi Implement

1. **MongoDB không có JOIN** → Khi hiển thị danh sách đăng ký, dùng organizerName đã lưu sẵn trong Event document (denormalize), không cần query riêng User.
2. **File upload** → Lưu vào `static/uploads/` và serve qua Spring MVC static resources. Tạo thư mục nếu chưa tồn tại khi app khởi động.
3. **currentAttendees** → Phải dùng `MongoTemplate` với `$inc` operator để tăng/giảm atomic, tránh race condition:
   ```java
   mongoTemplate.updateFirst(
       Query.query(Criteria.where("id").is(eventId)),
       new Update().inc("currentAttendees", 1),
       Event.class
   );
   ```
4. **UserDetailsService** → Implement để Spring Security load user từ MongoDB theo email.
5. **Thymeleaf Security** → Dùng `sec:authorize="hasRole('ADMIN')"` để ẩn/hiện menu theo role.
6. **Flash messages** → Dùng `RedirectAttributes.addFlashAttribute()` để hiển thị thông báo sau redirect.
7. **Phân trang** → Dùng `Pageable` của Spring Data MongoDB cho tất cả danh sách.
8. **CSRF** → Thymeleaf tự thêm CSRF token vào form, không cần làm thủ công.
9. **Khởi tạo ADMIN** → Tạo CommandLineRunner để seed tài khoản admin mặc định nếu chưa có.
10. **Exception handling** → `@ControllerAdvice` xử lý 404, 403, lỗi capacity, redirect về trang lỗi thân thiện.

---

## 12. Seed Data Mặc Định

Khi khởi động lần đầu, tự động tạo:

```
Admin:
  email: admin@event.com
  password: admin123
  role: ADMIN

Organizer mẫu:
  email: organizer@event.com
  password: org123
  role: ORGANIZER

Attendee mẫu:
  email: user@event.com
  password: user123
  role: ATTENDEE
```

---

## 13. Cài Đặt & Khởi Tạo MongoDB

### 13.1 Cài MongoDB (chọn 1 trong 3 cách)

#### Cách A — Docker (khuyến nghị, nhanh nhất)
```bash
# Kéo image và chạy MongoDB container
docker run -d \
  --name mongodb-event \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  -v mongodb_data:/data/db \
  mongo:7.0

# Kiểm tra container đang chạy
docker ps

# Xem logs nếu cần debug
docker logs mongodb-event
```

Nếu dùng Docker, cập nhật `application.properties`:
```properties
spring.data.mongodb.uri=mongodb://admin:admin123@localhost:27017/eventdb?authSource=admin
```

#### Cách B — Cài trực tiếp trên Windows
```
1. Tải MongoDB Community Server tại: https://www.mongodb.com/try/download/community
2. Chọn version 7.0, Platform: Windows, Package: MSI
3. Chạy file .msi, chọn "Complete" installation
4. Tick "Install MongoDB as a Service" → MongoDB tự chạy khi khởi động máy
5. (Tuỳ chọn) Tải MongoDB Compass tại: https://www.mongodb.com/products/compass
   → Compass là GUI để xem/quản lý data trực quan
6. MongoDB mặc định chạy tại: localhost:27017 (không cần username/password)
```

Dùng `application.properties` mặc định:
```properties
spring.data.mongodb.uri=mongodb://localhost:27017/eventdb
```

#### Cách C — Cài trực tiếp trên macOS
```bash
# Dùng Homebrew
brew tap mongodb/brew
brew update
brew install mongodb-community@7.0

# Khởi động MongoDB service
brew services start mongodb-community@7.0

# Kiểm tra đang chạy
brew services list
```

### 13.2 Khởi Tạo Database & Collections

MongoDB **tự động tạo database và collection** khi Spring Boot insert document đầu tiên — không cần tạo thủ công. Tuy nhiên, để tạo indexes tối ưu, AI agent cần tạo file `MongoConfig.java`:

```java
@Configuration
public class MongoConfig {

    @Bean
    public MongoCustomConversions customConversions() {
        return new MongoCustomConversions(Collections.emptyList());
    }
}
```

Và tạo `DatabaseInitializer.java` chạy khi app khởi động:

```java
@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired private MongoTemplate mongoTemplate;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Tạo indexes
        mongoTemplate.indexOps(User.class)
            .ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());

        mongoTemplate.indexOps(Event.class)
            .ensureIndex(new Index().on("status", Sort.Direction.ASC));
        mongoTemplate.indexOps(Event.class)
            .ensureIndex(new Index().on("organizerId", Sort.Direction.ASC));

        mongoTemplate.indexOps(Registration.class)
            .ensureIndex(new Index().on("eventId", Sort.Direction.ASC));
        mongoTemplate.indexOps(Registration.class)
            .ensureIndex(new Index().on("userId", Sort.Direction.ASC));
        mongoTemplate.indexOps(Registration.class)
            .ensureIndex(new Index()
                .on("eventId", Sort.Direction.ASC)
                .on("userId", Sort.Direction.ASC)
                .unique()); // Mỗi user chỉ đăng ký 1 lần / sự kiện

        // Seed tài khoản mặc định nếu chưa có
        seedDefaultUsers();
    }

    private void seedDefaultUsers() {
        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(
                buildUser("Admin", "admin@event.com", "admin123", Role.ADMIN),
                buildUser("Organizer Demo", "organizer@event.com", "org123", Role.ORGANIZER),
                buildUser("User Demo", "user@event.com", "user123", Role.ATTENDEE)
            ));
            System.out.println("✅ Seed data created successfully!");
        }
    }

    private User buildUser(String name, String email, String rawPassword, Role role) {
        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(rawPassword));
        u.setRole(role);
        u.setEnabled(true);
        u.setCreatedAt(LocalDateTime.now());
        return u;
    }
}
```

### 13.3 Kiểm Tra Kết Nối

Sau khi chạy app, kiểm tra log Spring Boot có dòng:
```
INFO  o.s.d.mongodb.core.MongoTemplate - Connected to MongoDB at localhost:27017
```

Hoặc mở MongoDB Compass → kết nối `mongodb://localhost:27017` → thấy database `eventdb` với 3 collections: `users`, `events`, `registrations`.

---

## 14. Chi Tiết Frontend (Thymeleaf Templates)

### 14.1 Dependencies Frontend (CDN — không cần npm/build tool)

Thêm vào `<head>` của `layout/base.html`:
```html
<!-- Bootstrap 5.3 CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<!-- Bootstrap Icons -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<!-- Chart.js (dùng cho trang thống kê) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- Bootstrap 5.3 JS Bundle (bao gồm Popper) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
```

### 14.2 Layout Base (`templates/layout/base.html`)

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org"
      xmlns:sec="http://www.thymeleaf.org/extras/spring-security"
      th:fragment="layout(title, content)">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title th:replace="${title}">Event Management</title>
    <!-- CDN links ở đây -->
    <link th:href="@{/css/custom.css}" rel="stylesheet">
</head>
<body>

<!-- NAVBAR -->
<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
        <a class="navbar-brand fw-bold" th:href="@{/}">
            <i class="bi bi-calendar-event"></i> EventHub
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link" th:href="@{/events}">
                        <i class="bi bi-grid"></i> Sự kiện
                    </a>
                </li>
                <!-- Chỉ ORGANIZER thấy -->
                <li class="nav-item" sec:authorize="hasRole('ORGANIZER')">
                    <a class="nav-link" th:href="@{/organizer/my-events}">
                        <i class="bi bi-calendar-plus"></i> Sự kiện của tôi
                    </a>
                </li>
                <!-- Chỉ ATTENDEE thấy -->
                <li class="nav-item" sec:authorize="hasRole('ATTENDEE')">
                    <a class="nav-link" th:href="@{/my-registrations}">
                        <i class="bi bi-bookmark-check"></i> Đã đăng ký
                    </a>
                </li>
                <!-- Chỉ ADMIN thấy -->
                <li class="nav-item dropdown" sec:authorize="hasRole('ADMIN')">
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                        <i class="bi bi-shield-check"></i> Quản trị
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" th:href="@{/admin/dashboard}">Dashboard</a></li>
                        <li><a class="dropdown-item" th:href="@{/admin/users}">Quản lý User</a></li>
                        <li><a class="dropdown-item" th:href="@{/admin/reports}">Báo cáo</a></li>
                    </ul>
                </li>
            </ul>

            <!-- User info & logout -->
            <ul class="navbar-nav ms-auto">
                <li class="nav-item" sec:authorize="isAnonymous()">
                    <a class="nav-link" th:href="@{/auth/login}">Đăng nhập</a>
                </li>
                <li class="nav-item" sec:authorize="isAnonymous()">
                    <a class="btn btn-outline-light btn-sm ms-2" th:href="@{/auth/register}">Đăng ký</a>
                </li>
                <li class="nav-item dropdown" sec:authorize="isAuthenticated()">
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle"></i>
                        <span sec:authentication="name">User</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <form th:action="@{/auth/logout}" method="post">
                                <button class="dropdown-item text-danger" type="submit">
                                    <i class="bi bi-box-arrow-right"></i> Đăng xuất
                                </button>
                            </form>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>

<!-- FLASH MESSAGES -->
<div class="container mt-3">
    <div th:if="${successMessage}" class="alert alert-success alert-dismissible fade show" role="alert">
        <i class="bi bi-check-circle"></i> <span th:text="${successMessage}"></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    <div th:if="${errorMessage}" class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-triangle"></i> <span th:text="${errorMessage}"></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
</div>

<!-- MAIN CONTENT -->
<main class="container my-4" th:replace="${content}">
    <!-- Nội dung trang sẽ được inject vào đây -->
</main>

<!-- FOOTER -->
<footer class="bg-dark text-white text-center py-3 mt-5">
    <small>© 2025 EventHub. All rights reserved.</small>
</footer>

</body>
</html>
```

### 14.3 Trang Danh Sách Sự Kiện (`templates/events/list.html`)

Yêu cầu giao diện:
- Grid layout 3 cột (col-md-4), mỗi card có:
  - Ảnh banner (fallback nếu không có ảnh)
  - Badge status (PUBLISHED = xanh lá)
  - Tên sự kiện (font-weight bold)
  - Icon 📅 ngày giờ, 📍 địa điểm
  - Badge tags (dùng `<span class="badge bg-secondary">`)
  - Progress bar số chỗ còn lại (nếu có maxCapacity)
  - Nút "Xem chi tiết" → `/events/{id}`
- Thanh tìm kiếm + bộ lọc tag ở trên cùng
- Phân trang Bootstrap ở dưới

```html
<!-- Ví dụ card sự kiện -->
<div class="card h-100 shadow-sm">
    <img th:src="${event.bannerImagePath != null ? '/uploads/' + event.bannerImagePath : '/images/default-banner.jpg'}"
         class="card-img-top" style="height: 180px; object-fit: cover;" alt="Banner">
    <div class="card-body d-flex flex-column">
        <div class="mb-2">
            <span th:each="tag : ${event.tags}" class="badge bg-secondary me-1" th:text="${tag}"></span>
        </div>
        <h5 class="card-title" th:text="${event.title}"></h5>
        <p class="text-muted small mb-1">
            <i class="bi bi-calendar3"></i>
            <span th:text="${#temporals.format(event.startDate, 'dd/MM/yyyy HH:mm')}"></span>
        </p>
        <p class="text-muted small mb-2">
            <i class="bi bi-geo-alt"></i>
            <span th:text="${event.location}"></span>
        </p>
        <!-- Progress bar chỗ còn lại -->
        <div th:if="${event.maxCapacity > 0}" class="mb-2">
            <small th:text="${event.maxCapacity - event.currentAttendees} + ' chỗ còn lại'"></small>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-success" role="progressbar"
                     th:style="'width: ' + (100 - (event.currentAttendees * 100 / event.maxCapacity)) + '%'">
                </div>
            </div>
        </div>
        <a th:href="@{/events/{id}(id=${event.id})}" class="btn btn-primary btn-sm mt-auto">
            Xem chi tiết <i class="bi bi-arrow-right"></i>
        </a>
    </div>
</div>
```

### 14.4 Trang Chi Tiết Sự Kiện (`templates/events/detail.html`)

Layout 2 cột:
- **Cột trái (col-md-8):** banner lớn, mô tả đầy đủ, thông tin tổ chức
- **Cột phải (col-md-4):** card thông tin nhanh (ngày, địa điểm, chỗ còn lại) + nút đăng ký

```html
<!-- Nút đăng ký thông minh theo role -->
<!-- Nếu chưa login -->
<a sec:authorize="isAnonymous()" th:href="@{/auth/login}" class="btn btn-primary btn-lg w-100">
    <i class="bi bi-box-arrow-in-right"></i> Đăng nhập để đăng ký
</a>

<!-- Nếu là ATTENDEE và còn chỗ và chưa đăng ký -->
<form sec:authorize="hasRole('ATTENDEE')" th:if="${!alreadyRegistered and spotsLeft > 0}"
      th:action="@{/events/{id}/register(id=${event.id})}" method="post">
    <button type="submit" class="btn btn-success btn-lg w-100">
        <i class="bi bi-calendar-check"></i> Đăng ký tham dự
    </button>
</form>

<!-- Đã đăng ký rồi -->
<div sec:authorize="hasRole('ATTENDEE')" th:if="${alreadyRegistered}"
     class="alert alert-success text-center">
    <i class="bi bi-check-circle-fill"></i> Bạn đã đăng ký sự kiện này
</div>

<!-- Hết chỗ -->
<div th:if="${spotsLeft == 0 and event.maxCapacity > 0}"
     class="alert alert-warning text-center">
    <i class="bi bi-exclamation-triangle"></i> Sự kiện đã đầy chỗ
</div>
```

### 14.5 Form Tạo/Sửa Sự Kiện (`templates/events/form.html`)

Các trường cần có:
- `title` — input text, required
- `description` — textarea (5 rows), required
- `location` — input text, required
- `startDate` / `endDate` — `<input type="datetime-local">`, validate endDate > startDate bằng JS
- `maxCapacity` — input number (0 = unlimited), hint text giải thích
- `tags` — input text với tag UI (dùng [Tagify](https://yaireo.github.io/tagify/) CDN hoặc input đơn giản comma-separated)
- `bannerImage` — `<input type="file" accept="image/jpeg,image/png">`, preview ảnh trước khi upload bằng JS
- `status` — radio: DRAFT / PUBLISHED

```html
<!-- Preview ảnh trước khi upload -->
<script>
document.getElementById('bannerInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('bannerPreview').src = ev.target.result;
            document.getElementById('previewBox').classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }
});
</script>
```

### 14.6 Dashboard Admin (`templates/admin/dashboard.html`)

Bố cục:
```
Row 1: 4 stat cards (tổng sự kiện | sự kiện published | tổng user | tổng đăng ký)
Row 2: Biểu đồ cột (sự kiện theo tháng) | Top 5 sự kiện nhiều người đăng ký nhất
Row 3: Bảng sự kiện mới nhất
```

Stat card mẫu:
```html
<div class="col-md-3">
    <div class="card text-white bg-primary shadow">
        <div class="card-body d-flex justify-content-between align-items-center">
            <div>
                <div class="fs-2 fw-bold" th:text="${totalEvents}">0</div>
                <div>Tổng sự kiện</div>
            </div>
            <i class="bi bi-calendar-event fs-1 opacity-50"></i>
        </div>
    </div>
</div>
```

Biểu đồ Chart.js:
```html
<canvas id="eventsByMonthChart" height="100"></canvas>
<script>
new Chart(document.getElementById('eventsByMonthChart'), {
    type: 'bar',
    data: {
        labels: /*[[${monthLabels}]]*/ [],
        datasets: [{
            label: 'Số sự kiện',
            data: /*[[${monthData}]]*/ [],
            backgroundColor: 'rgba(13, 110, 253, 0.7)'
        }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
});
</script>
```

### 14.7 File CSS Tùy Chỉnh (`static/css/custom.css`)

```css
/* Card hover effect */
.card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important;
}

/* Banner image placeholder */
.banner-placeholder {
    background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 3rem;
}

/* Stat card admin */
.stat-card {
    border-radius: 12px;
    border: none;
}

/* Tag badges */
.event-tags .badge {
    font-size: 0.75rem;
    cursor: default;
}

/* Navbar active link */
.navbar-nav .nav-link.active {
    font-weight: 600;
    border-bottom: 2px solid white;
}
```

### 14.8 Trang Đăng Nhập (`templates/auth/login.html`)

Layout: căn giữa trang, card width 400px, shadow

Bao gồm:
- Logo / tên app ở trên
- Input email + password
- Checkbox "Ghi nhớ đăng nhập"
- Nút Submit full-width
- Link "Chưa có tài khoản? Đăng ký ngay"
- Hiển thị lỗi sai mật khẩu: `th:if="${param.error}"`

---

## 15. Thứ Tự Implement Gợi Ý

1. **Cài & chạy MongoDB** → theo Mục 13.1 (dùng Docker hoặc cài thẳng)
2. **Setup project** → pom.xml, application.properties, kết nối MongoDB
3. **Models & Enums** → User, Event, Registration, Role, EventStatus
4. **Repositories** → UserRepository, EventRepository, RegistrationRepository
5. **DatabaseInitializer** → tạo indexes + seed data (Mục 13.2)
6. **Security** → SecurityConfig, CustomUserDetailsService, BCrypt
7. **Auth** → AuthController, templates login + register (Mục 14.8)
8. **Layout** → base.html với navbar phân quyền + custom.css (Mục 14.2, 14.7)
9. **Event CRUD** → EventService, EventController, list + detail + form templates (Mục 14.3–14.5)
10. **Registration** → RegistrationService, RegistrationController
11. **Admin** → AdminController, dashboard + users templates (Mục 14.6)
12. **Thống kê** → báo cáo, biểu đồ Chart.js
13. **Polish** → validation messages, flash messages, xử lý lỗi, responsive UI
