DeskPilot – Enterprise Service Desk Management System

DeskPilot is a web-based Enterprise Service Desk Management System designed to simplify IT support operations. It allows employees to raise support tickets, agents to manage assigned tickets, and administrators to oversee ticket activities and user accounts.

Features

    User Authentication: Secure login and registration using JWT authentication.

    Ticket Management: Create, view, and manage support tickets.

    Ticket Assignment: Administrators can assign tickets to agents.

    Role-Based Access: Separate access for USER, AGENT, and ADMIN roles.

    Ticket Status Management: Track tickets through different statuses.

    Priority Management: Manage tickets based on their priority.

    User Management: Administrators can create and manage team members.

    Database Integration: Store user and ticket information in MySQL.

Technology Stack

    Backend

    Java 21

    Spring Boot 4.1.1

    Spring Security

    Spring Data JPA

    Hibernate

    REST APIs

    Maven

    JWT Authentication

Frontend

    HTML

    CSS

    JavaScript

Database

    MySQL

    Development Tools

    Eclipse IDE

    MySQL Workbench

    Git

    GitHub

User Roles

    Role   Permissions

    USER::   Create tickets, view own tickets, and update eligible tickets

    AGENT:  View assigned tickets and update ticket status and priority

    ADMIN:  Manage all tickets, assign tickets, manage users, and delete tickets

Project Structure

    DeskPilot/
    ├── src/
    │   └── main/
    │       ├── java/
    │       │   └── com/shaik/deskpilot/
    │       │       ├── config/
    │       │       ├── controller/
    │       │       ├── dto/
    │       │       ├── entity/
    │       │       ├── exception/
    │       │       ├── repository/
    │       │       ├── security/
    │       │       ├── service/
    │       │       └── DeskpilotApplication.java
    │       └── resources/
    │           ├── static/
    │           │   ├── index.html
    │           │   ├── style.css
    │           │   └── script.js
    │           └── application.properties
    ├── .gitignore
    ├── pom.xml
    └── README.md


  Prerequisites

  Make sure you have installed:

        Java JDK 21
    
        MySQL Server

        Maven (or use the included Maven Wrapper)

        Git


Setup and Installation

1. Clone the repository

        git clone https://github.com/Shaik-24/DeskPilot.git

2. Navigate to the project directory

        cd DeskPilot

3. Create the MySQL database

        CREATE DATABASE deskpilot_db;

4. Configure database and JWT settings

        Update src/main/resources/application.properties with your local MySQL credentials and JWT secret.

Example:

    spring.application.name=deskpilot
  
    spring.datasource.url=jdbc:mysql://localhost:3306/deskpilot_db
    spring.datasource.username=YOUR_DB_USERNAME
    spring.datasource.password=YOUR_DB_PASSWORD

    spring.jpa.hibernate.ddl-auto=update
    spring.jpa.show-sql=true
    spring.jpa.properties.hibernate.format_sql=true

    app.jwt.secret=${JWT_SECRET}
    app.jwt.expiration-ms=86400000

  Set JWT_SECRET to a secure Base64-encoded secret of sufficient length before starting the application.

5. Run the application

On Windows:

    mvnw.cmd spring-boot:run

Alternatively, use:

    mvn spring-boot:run
    

Future Enhancements

    Email notifications for ticket updates

    Ticket activity history

    Dashboard analytics and reports

    Advanced search and filtering

    Improved ticket tracking


Author

Shaik Adil

GitHub: Shaik-24

DeskPilot – Simplifying IT Service Management.
