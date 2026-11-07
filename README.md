# 🚀 DeskPilot – Enterprise Service Desk Management System

<p align="center">
  A role-based IT service desk application built with Java, Spring Boot, Spring Security, JWT, and MySQL.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-orange?logo=openjdk" />
  <img src="https://img.shields.io/badge/Spring%20Boot-4.1.1-brightgreen?logo=springboot" />
  <img src="https://img.shields.io/badge/Spring%20Security-Enabled-green?logo=springsecurity" />
  <img src="https://img.shields.io/badge/Database-MySQL-blue?logo=mysql" />
  <img src="https://img.shields.io/badge/Authentication-JWT-black" />
</p>

## 📌 Overview

**DeskPilot** is a web-based Enterprise Service Desk Management System designed to simplify and organize IT support operations.

The application provides a centralized platform where employees can raise support tickets, support agents can manage assigned issues, and administrators can oversee ticket activities and user accounts.

It uses **role-based access control (RBAC)** to provide different permissions for Users, Agents, and Administrators, along with JWT-based authentication to secure API requests.

## ✨ Key Features

- 🔐 **Secure Authentication** – User registration and login using JWT authentication.
- 🎫 **Ticket Management** – Create, view, and manage IT support tickets.
- 👥 **Role-Based Access Control** – Separate permissions for USER, AGENT, and ADMIN.
- 📌 **Ticket Assignment** – Administrators can assign tickets to support agents.
- 🔄 **Ticket Status Management** – Manage ticket progress through different statuses.
- ⚡ **Priority Management** – Organize support tickets based on priority.
- 👤 **User Management** – Administrators can create privileged accounts.
- 🗄️ **Database Integration** – Store user and ticket information in MySQL.
- 🔒 **Password Encryption** – Protect user passwords using BCrypt.
- 🌐 **REST API Integration** – Connect the frontend with the Spring Boot backend.

## 🛠️ Technologies Used

### Backend
- Java 21
- Spring Boot 4.1.1
- Spring Security
- Spring Data JPA
- Hibernate ORM
- RESTful APIs
- JSON Web Token (JWT)
- BCrypt Password Encoder
- Maven

### Frontend
- HTML5
- CSS3
- JavaScript

### Database
- MySQL

### Development Tools
- Eclipse IDE
- MySQL Workbench
- Postman
- Git
- GitHub

## 🏗️ Application Architecture

DeskPilot follows a layered architecture that separates frontend interaction, business logic, security, and database operations.

```text
          USER / ADMIN / AGENT
                   |
                   v
          FRONTEND (HTML/CSS/JS)
                   |
             HTTP Requests
                   |
                   v
          SPRING BOOT BACKEND
                   |
          SPRING SECURITY + JWT
                   |
                   v
             CONTROLLERS
                   |
                   v
               SERVICES
                   |
                   v
              REPOSITORIES
                   |
                   v
             SPRING DATA JPA
                   |
                   v
                MYSQL
```

**Request Flow:**

1. The user interacts with the web application.
2. JavaScript sends HTTP requests to the backend using the Fetch API.
3. Spring Security processes incoming requests and validates JWT authentication where required.
4. Controllers receive requests and call the appropriate service methods.
5. Services handle business logic and access control.
6. Repositories communicate with the database through Spring Data JPA.
7. MySQL stores or retrieves the requested information.
8. The backend returns a JSON response to the frontend.
9. JavaScript updates the interface based on the response.

## 👥 User Roles and Permissions

| Role | Permissions |
|---|---|
| USER | Register, log in, create tickets, view own tickets, and update eligible tickets. |
| AGENT | View assigned tickets and update ticket status and priority. |
| ADMIN | View and manage tickets, assign tickets to agents, manage users, and delete tickets. |

### Role-Based Access Control

DeskPilot uses Spring Security to restrict access based on user roles.

- **USER:** Can access their own support requests.
- **AGENT:** Can work on tickets assigned to them.
- **ADMIN:** Has administrative access to ticket and user management operations.

Public registration creates USER accounts. Privileged AGENT and ADMIN accounts are created through an administrator-authorized endpoint.

## 🔐 Authentication and Security

Security is implemented using Spring Security and JSON Web Tokens.

**Authentication Flow:**

1. A user submits their email and password.
2. The backend verifies the submitted credentials.
3. BCrypt checks the password against the stored password hash.
4. After successful authentication, a JWT is generated.
5. The frontend uses the token in subsequent authenticated API requests.
6. The JWT authentication filter validates the token and establishes the authenticated user's security context.
7. Spring Security checks authorization before allowing protected operations.

**Security Components:**

| Component | Purpose |
|---|---|
| Spring Security | Secures backend endpoints. |
| JWT | Provides token-based authentication. |
| JwtService | Generates and validates JWT tokens. |
| JwtAuthenticationFilter | Extracts and validates JWT tokens from requests. |
| CustomUserDetailsService | Loads user details and authorities. |
| BCryptPasswordEncoder | Hashes passwords securely. |
| SecurityConfig | Defines authentication and authorization rules. |

## 🔗 REST API Endpoints

The backend exposes REST endpoints under `/api`.

### 1. Authentication APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticates a user and returns a JWT. |

### 2. User Management APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/users` | Public | Registers a new USER account. |
| GET | `/api/users/me` | Authenticated | Retrieves the logged-in user's details. |
| POST | `/api/users/admin/create` | ADMIN | Creates an AGENT or ADMIN account. |

### 3. Ticket Management APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tickets` | Creates a new support ticket. |
| GET | `/api/tickets` | Retrieves tickets according to the logged-in user's role. |
| GET | `/api/tickets/{id}` | Retrieves a ticket using its ID. |
| PUT | `/api/tickets/{id}` | Updates an existing ticket. |
| DELETE | `/api/tickets/{id}` | Deletes a ticket (ADMIN only). |
| PUT | `/api/tickets/{id}/assign` | Assigns a ticket to an agent (ADMIN only). |

**Note:** Access permissions and business rules are enforced in the backend service and security layers.

## 🗄️ Database Integration

DeskPilot uses MySQL as its relational database.

The application uses Spring Data JPA and Hibernate to map Java entity classes to database tables.

### Main Entities

**User**
- Stores user information.
- Contains name, email, password hash, and role.
- Supports USER, AGENT, and ADMIN roles.

**Ticket**
- Stores support ticket information.
- Maintains ticket details, ownership, assignment, status, and priority.

### Database Configuration

The application connects to MySQL using Spring Boot datasource properties.

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/deskpilot_db
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

JWT configuration is supplied through an environment variable:

```properties
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=86400000
```

## 📂 Project Structure

```text
DeskPilot/
│
├── src/
│   └── main/
│       ├── java/
│       │   └── com/shaik/deskpilot/
│       │       │
│       │       ├── config/
│       │       │   └── SecurityConfig.java
│       │       │
│       │       ├── controller/
│       │       │   ├── AuthController.java
│       │       │   ├── TicketController.java
│       │       │   └── UserController.java
│       │       │
│       │       ├── dto/
│       │       │   ├── LoginRequest.java
│       │       │   ├── LoginResponse.java
│       │       │   └── UserResponse.java
│       │       │
│       │       ├── entity/
│       │       │   ├── User.java
│       │       │   └── Ticket.java
│       │       │
│       │       ├── exception/
│       │       │
│       │       ├── repository/
│       │       │   ├── UserRepository.java
│       │       │   └── TicketRepository.java
│       │       │
│       │       ├── security/
│       │       │   ├── JwtAuthenticationFilter.java
│       │       │   ├── JwtService.java
│       │       │   └── CustomUserDetailsService.java
│       │       │
│       │       ├── service/
│       │       │   ├── AuthService.java
│       │       │   ├── TicketService.java
│       │       │   └── UserService.java
│       │       │
│       │       └── DeskpilotApplication.java
│       │
│       └── resources/
│           ├── static/
│           │   ├── index.html
│           │   ├── style.css
│           │   └── script.js
│           │
│           └── application.properties
│
├── .gitignore
├── pom.xml
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following are installed:

- Java JDK 21
- MySQL Server
- Maven (or use the included Maven Wrapper)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Shaik-24/DeskPilot.git
```

### 2. Navigate to the Project Directory

```bash
cd DeskPilot
```

### 3. Create the MySQL Database

Open MySQL Workbench or your MySQL command line and execute:

```sql
CREATE DATABASE deskpilot_db;
```

### 4. Configure Application Properties

Open:

`src/main/resources/application.properties`

Configure your MySQL credentials and provide a secure Base64-encoded JWT secret through the `JWT_SECRET` environment variable.

Do not commit real database passwords or JWT secrets to GitHub.

### 5. Run the Application

**Windows:**

```bash
mvnw.cmd spring-boot:run
```

**Alternatively:**

```bash
mvn spring-boot:run
```

### 6. Access the Application

Open your browser and navigate to:

```text
http://localhost:8080
```

## 🎯 Learning Outcomes

Working on DeskPilot helped strengthen my understanding of:

- Java programming and Object-Oriented Programming.
- Spring Boot application development.
- REST API development and HTTP methods.
- Spring Security and JWT authentication.
- Role-Based Access Control.
- Password hashing using BCrypt.
- Spring Data JPA and Hibernate.
- MySQL database integration.
- Layered application architecture.
- Frontend and backend integration using JavaScript Fetch API.
- Git and GitHub version control.

## 🚀 Future Enhancements

- Email notifications for ticket updates.
- Ticket activity history and audit logs.
- Dashboard analytics and reports.
- Advanced ticket search and filtering.
- File attachments for support requests.
- Improved ticket tracking and reporting.

## 👨‍💻 Author

**Shaik Adil**

Java Developer | Spring Boot | REST APIs | MySQL | SQL

- GitHub: [Shaik-24](https://github.com/Shaik-24)
- Project Repository: [DeskPilot](https://github.com/Shaik-24/DeskPilot)

---

<p align="center">
  <b>DeskPilot – Simplifying IT Service Management.</b>
</p>
