/* =========================================
   DESKPILOT - FRONTEND APPLICATION
========================================= */

const API_BASE = "/api";

let currentUser = null;
let authToken = localStorage.getItem("deskpilot_token");
let tickets = [];
let currentTicket = null;

// =========================================
// API HELPER
// =========================================

async function apiRequest(endpoint, method = "GET", data = null) {
    const headers = {
        "Content-Type": "application/json"
    };

    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    const options = {
        method,
        headers
    };

    if (data !== null) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const responseText = await response.text();

    let result = null;

    if (responseText) {
        try {
            result = JSON.parse(responseText);
        } catch {
            result = responseText;
        }
    }

    if (!response.ok) {
        const message =
            typeof result === "object" && result !== null
                ? result.message || result.error || "Request failed"
                : result || "Request failed";

        if (response.status === 401 && authToken) {
            logout();
        }

        throw new Error(message);
    }

    return result;
}

// =========================================
// NOTIFICATIONS
// =========================================

function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");

    notification.textContent = message;
    notification.classList.remove("hidden");

    notification.style.background =
        type === "error" ? "#dc2626" : "#166534";

    setTimeout(() => {
        notification.classList.add("hidden");
    }, 3500);
}

// =========================================
// HTML SAFETY
// =========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function getDisplayValue(value) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    if (typeof value === "object") {
        return value.name || value.email || "-";
    }

    return String(value);
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function getAssignedEmail(ticket) {
    const assigned = ticket.assignedTo;

    if (!assigned) return "";

    if (typeof assigned === "string") {
        return assigned;
    }

    return assigned.email || "";
}

function getCreatedByEmail(ticket) {
    const creator = ticket.createdBy;

    if (!creator) return "";

    if (typeof creator === "string") {
        return creator;
    }

    return creator.email || "";
}

// =========================================
// AUTHENTICATION SCREEN
// =========================================

function showLoginForm() {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");
}

function showRegisterForm() {
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("loginForm").classList.add("hidden");
}

document.getElementById("showRegister").addEventListener("click", event => {
    event.preventDefault();
    showRegisterForm();
});

document.getElementById("showLogin").addEventListener("click", event => {
    event.preventDefault();
    showLoginForm();
});

// =========================================
// LOGIN
// =========================================

document.getElementById("loginFormElement").addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const result = await apiRequest("/auth/login", "POST", {
            email,
            password
        });

        if (!result || !result.token) {
            throw new Error("Login response did not contain a token.");
        }

        authToken = result.token;
        localStorage.setItem("deskpilot_token", authToken);

        currentUser = {
            id: result.userId,
            name: result.name,
            email: result.email,
            role: result.role
        };

        document.getElementById("loginFormElement").reset();

        await openApplication();

        showNotification("Welcome to DeskPilot!");

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// REGISTRATION
// =========================================

document.getElementById("registerFormElement").addEventListener("submit", async event => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    try {
        await apiRequest("/users", "POST", {
            name,
            email,
            password
        });

        document.getElementById("registerFormElement").reset();

        showLoginForm();

        document.getElementById("loginEmail").value = email;

        showNotification("Account created successfully. Please sign in.");

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// OPEN APPLICATION
// =========================================

async function openApplication() {
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("appSection").classList.remove("hidden");

    updateUserInformation();
    configureRoleAccess();

    showSection("dashboardSection");

    await loadTickets();
}

function updateUserInformation() {
    const name = currentUser?.name || "User";
    const role = currentUser?.role || "USER";

    document.getElementById("sidebarUserName").textContent = name;
    document.getElementById("sidebarUserRole").textContent = role;

    document.getElementById("sidebarAvatar").textContent =
        name.charAt(0).toUpperCase();

    document.getElementById("headerAvatar").textContent =
        name.charAt(0).toUpperCase();
}

// =========================================
// ROLE-BASED ACCESS
// =========================================

function configureRoleAccess() {
    const role = currentUser?.role;

    document.querySelectorAll(".admin-only").forEach(element => {
        element.classList.toggle("hidden", role !== "ADMIN");
    });

    document.getElementById("ticketUpdateArea")
        .classList.toggle("hidden", !["ADMIN", "AGENT"].includes(role));

    document.getElementById("ticketAssignmentArea")
        .classList.toggle("hidden", role !== "ADMIN");

    // Delete button is always hidden unless the user is ADMIN.
    document.getElementById("deleteTicketBtn")
        .classList.toggle("hidden", role !== "ADMIN");
}

// =========================================
// NAVIGATION
// =========================================

const sectionTitles = {
    dashboardSection: "Dashboard",
    ticketsSection: "All Tickets",
    createTicketSection: "Create Ticket",
    ticketDetailsSection: "Ticket Details",
    usersSection: "User Management"
};

function showSection(sectionId) {
    if (sectionId === "usersSection" && currentUser?.role !== "ADMIN") {
        showNotification(
            "You do not have permission to access this section.",
            "error"
        );
        return;
    }

    document.querySelectorAll(".content-section").forEach(section => {
        section.classList.add("hidden");
    });

    const target = document.getElementById(sectionId);

    if (!target) return;

    target.classList.remove("hidden");

    document.getElementById("pageTitle").textContent =
        sectionTitles[sectionId] || "DeskPilot";

    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.section === sectionId
        );
    });

    if (sectionId === "dashboardSection" || sectionId === "ticketsSection") {
        loadTickets();
    }
}

document.addEventListener("click", event => {
    const navigation = event.target.closest("[data-section]");

    if (!navigation) return;

    event.preventDefault();

    showSection(navigation.dataset.section);
});

// =========================================
// LOAD TICKETS
// =========================================

async function loadTickets() {
    try {
        const result = await apiRequest("/tickets");

        tickets = Array.isArray(result) ? result : [];

        renderDashboard();
        renderTicketsTable();

    } catch (error) {
        showNotification(error.message, "error");
    }
}

// =========================================
// DASHBOARD STATISTICS
// =========================================

function renderDashboard() {
    document.getElementById("totalTickets").textContent = tickets.length;

    document.getElementById("openTickets").textContent =
        tickets.filter(ticket => ticket.status === "OPEN").length;

    document.getElementById("progressTickets").textContent =
        tickets.filter(ticket => ticket.status === "IN_PROGRESS").length;

    document.getElementById("resolvedTickets").textContent =
        tickets.filter(ticket => ticket.status === "RESOLVED").length;

    const recentTickets = [...tickets]
        .sort((a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )
        .slice(0, 5);

    const tbody = document.getElementById("recentTicketsBody");

    if (recentTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-message">
                    No tickets available yet.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = recentTickets.map(ticket => `
        <tr>
            <td>#${escapeHTML(ticket.id)}</td>
            <td>${escapeHTML(ticket.title)}</td>
            <td>${priorityBadge(ticket.priority)}</td>
            <td>${statusBadge(ticket.status)}</td>
            <td>${formatDate(ticket.createdAt)}</td>
        </tr>
    `).join("");
}

// =========================================
// BADGES
// =========================================

function statusBadge(status) {
    const value = status || "OPEN";
    const className = value.toLowerCase().replace("_", "-");

    return `
        <span class="status-badge ${escapeHTML(className)}">
            ${escapeHTML(value.replace("_", " "))}
        </span>
    `;
}

function priorityBadge(priority) {
    const value = priority || "MEDIUM";

    return `
        <span class="priority-badge ${escapeHTML(value.toLowerCase())}">
            ${escapeHTML(value)}
        </span>
    `;
}

// =========================================
// TICKET TABLE
// =========================================

function renderTicketsTable() {
    const tbody = document.getElementById("ticketsTableBody");

    const search = document.getElementById("ticketSearch")
        .value.trim().toLowerCase();

    const status = document.getElementById("statusFilter").value;

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            String(ticket.id).includes(search) ||
            (ticket.title || "").toLowerCase().includes(search) ||
            (ticket.description || "").toLowerCase().includes(search);

        const matchesStatus = !status || ticket.status === status;

        return matchesSearch && matchesStatus;
    });

    if (filteredTickets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">
                    No tickets found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredTickets.map(ticket => `
        <tr>
            <td>#${escapeHTML(ticket.id)}</td>
            <td>${escapeHTML(ticket.title)}</td>
            <td>${priorityBadge(ticket.priority)}</td>
            <td>${statusBadge(ticket.status)}</td>
            <td>${escapeHTML(getDisplayValue(ticket.assignedTo))}</td>
            <td>${formatDate(ticket.createdAt)}</td>
            <td>
                <button
                    class="secondary-btn"
                    data-ticket-id="${escapeHTML(ticket.id)}"
                    type="button">
                    View
                </button>
            </td>
        </tr>
    `).join("");
}

document.getElementById("ticketSearch")
    .addEventListener("input", renderTicketsTable);

document.getElementById("statusFilter")
    .addEventListener("change", renderTicketsTable);

// =========================================
// CREATE TICKET
// =========================================

document.getElementById("createTicketForm").addEventListener("submit", async event => {
    event.preventDefault();

    const title = document.getElementById("ticketTitle").value.trim();
    const description = document.getElementById("ticketDescription").value.trim();
    const priority = document.getElementById("ticketPriority").value;

    try {
        await apiRequest("/tickets", "POST", {
            title,
            description,
            priority
        });

        document.getElementById("createTicketForm").reset();

        showNotification("Ticket created successfully!");

        await loadTickets();

        showSection("ticketsSection");

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// VIEW TICKET DETAILS
// =========================================

document.addEventListener("click", event => {
    const button = event.target.closest("[data-ticket-id]");

    if (!button) return;

    openTicketDetails(button.dataset.ticketId);
});

async function openTicketDetails(ticketId) {
    try {
        const ticket = await apiRequest(`/tickets/${ticketId}`);

        currentTicket = ticket;

        document.getElementById("detailTicketId").textContent =
            `#${ticket.id}`;

        document.getElementById("detailTitle").textContent =
            ticket.title || "-";

        document.getElementById("detailPriority").textContent =
            ticket.priority || "-";

        document.getElementById("detailStatus").textContent =
            (ticket.status || "OPEN").replace("_", " ");

        document.getElementById("detailStatus").className =
            `status-badge ${(ticket.status || "OPEN").toLowerCase().replace("_", "-")}`;

        document.getElementById("detailDescription").textContent =
            ticket.description || "-";

        document.getElementById("detailCreatedBy").textContent =
            getDisplayValue(ticket.createdBy);

        document.getElementById("detailAssignedTo").textContent =
            getDisplayValue(ticket.assignedTo);

        document.getElementById("updateStatus").value =
            ticket.status || "OPEN";

        document.getElementById("updatePriority").value =
            ticket.priority || "MEDIUM";

        document.getElementById("assignedAgentEmail").value =
            getAssignedEmail(ticket);

        configureRoleAccess();
        configureTicketActions(ticket);

        showSection("ticketDetailsSection");

    } catch (error) {
        showNotification(error.message, "error");
    }
}

// =========================================
// TICKET ACTION PERMISSIONS
// =========================================

function configureTicketActions(ticket) {
    const role = currentUser?.role;

    const creatorEmail = getCreatedByEmail(ticket).toLowerCase();
    const currentUserEmail = (currentUser?.email || "").toLowerCase();

    const isOwner =
        role === "USER" &&
        creatorEmail !== "" &&
        creatorEmail === currentUserEmail;

    const canEditOwnTicket =
        isOwner && ticket.status === "OPEN";

    const canUpdate =
        ["ADMIN", "AGENT"].includes(role);

    // IMPORTANT: Only ADMIN can delete tickets.
    const canDelete =
        role === "ADMIN";

    document.getElementById("ticketUpdateArea")
        .classList.toggle("hidden", !canUpdate);

    document.getElementById("ticketAssignmentArea")
        .classList.toggle("hidden", role !== "ADMIN");

    document.getElementById("deleteTicketBtn")
        .classList.toggle("hidden", !canDelete);

    document.getElementById("userTicketActions")
        .classList.toggle("hidden", !canEditOwnTicket);

    if (canEditOwnTicket) {
        document.getElementById("userEditTitle").value =
            ticket.title || "";

        document.getElementById("userEditDescription").value =
            ticket.description || "";
    }
}

// =========================================
// ADMIN / AGENT - UPDATE TICKET
// =========================================

document.getElementById("updateTicketForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentTicket) return;

    if (!["ADMIN", "AGENT"].includes(currentUser?.role)) {
        showNotification("You do not have permission to update this ticket.", "error");
        return;
    }

    const status = document.getElementById("updateStatus").value;
    const priority = document.getElementById("updatePriority").value;

    try {
        const ticketId = currentTicket.id;

        await apiRequest(`/tickets/${ticketId}`, "PUT", {
            status,
            priority
        });

        showNotification("Ticket updated successfully!");

        await loadTickets();
        await openTicketDetails(ticketId);

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// USER - EDIT OWN TICKET
// =========================================

document.getElementById("userEditTicketForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentTicket || currentUser?.role !== "USER") return;

    if (currentTicket.status !== "OPEN") {
        showNotification("Only OPEN tickets can be edited.", "error");
        return;
    }

    const title = document.getElementById("userEditTitle").value.trim();

    const description = document.getElementById("userEditDescription")
        .value.trim();

    if (!title || !description) {
        showNotification("Please enter a title and description.", "error");
        return;
    }

    try {
        const ticketId = currentTicket.id;

        await apiRequest(`/tickets/${ticketId}`, "PUT", {
            title,
            description
        });

        showNotification("Your ticket has been updated!");

        await loadTickets();
        await openTicketDetails(ticketId);

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// USER - MARK OWN TICKET AS RESOLVED
// =========================================

document.getElementById("markResolvedBtn").addEventListener("click", async () => {
    if (!currentTicket || currentUser?.role !== "USER") return;

    if (currentTicket.status !== "OPEN") {
        showNotification("Only OPEN tickets can be resolved by you.", "error");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to mark this ticket as resolved?"
    );

    if (!confirmed) return;

    try {
        const ticketId = currentTicket.id;

        await apiRequest(`/tickets/${ticketId}`, "PUT", {
            status: "RESOLVED"
        });

        showNotification("Ticket marked as resolved!");

        await loadTickets();
        await openTicketDetails(ticketId);

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// ASSIGN TICKET - ADMIN ONLY
// =========================================

document.getElementById("assignTicketForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentTicket || currentUser?.role !== "ADMIN") return;

    const assignedTo = document.getElementById("assignedAgentEmail")
        .value.trim();

    try {
        const ticketId = currentTicket.id;

        await apiRequest(`/tickets/${ticketId}/assign`, "PUT", {
            assignedTo
        });

        showNotification("Ticket assigned successfully!");

        await loadTickets();
        await openTicketDetails(ticketId);

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// DELETE TICKET - ADMIN ONLY
// =========================================

document.getElementById("deleteTicketBtn").addEventListener("click", async () => {

    // Frontend permission check.
    // Only ADMIN can delete a ticket.
    if (currentUser?.role !== "ADMIN") {
        showNotification("Only administrators can delete tickets.", "error");
        return;
    }

    if (!currentTicket) return;

    const confirmed = confirm(
        `Are you sure you want to delete ticket #${currentTicket.id}?`
    );

    if (!confirmed) return;

    try {
        const ticketId = currentTicket.id;

        await apiRequest(`/tickets/${ticketId}`, "DELETE");

        currentTicket = null;

        showNotification("Ticket deleted successfully!");

        await loadTickets();

        showSection("ticketsSection");

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// BACK TO TICKETS
// =========================================

document.getElementById("backToTicketsBtn").addEventListener("click", () => {
    showSection("ticketsSection");
});

// =========================================
// ADMIN - CREATE TEAM MEMBER
// =========================================

document.getElementById("createUserForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (currentUser?.role !== "ADMIN") {
        showNotification("Only administrators can create team members.", "error");
        return;
    }

    const name = document.getElementById("newUserName").value.trim();
    const email = document.getElementById("newUserEmail").value.trim();
    const password = document.getElementById("newUserPassword").value;
    const role = document.getElementById("newUserRole").value;

    try {
        await apiRequest("/users/admin/create", "POST", {
            name,
            email,
            password,
            role
        });

        document.getElementById("createUserForm").reset();

        showNotification("Team member created successfully!");

    } catch (error) {
        showNotification(error.message, "error");
    }
});

// =========================================
// LOGOUT
// =========================================

function logout() {
    localStorage.removeItem("deskpilot_token");

    authToken = null;
    currentUser = null;
    currentTicket = null;
    tickets = [];

    document.getElementById("appSection").classList.add("hidden");
    document.getElementById("authSection").classList.remove("hidden");

    document.getElementById("loginFormElement").reset();
    document.getElementById("registerFormElement").reset();

    showLoginForm();
}

document.getElementById("logoutBtn").addEventListener("click", logout);

// =========================================
// INITIAL APPLICATION CHECK
// =========================================

async function initializeApplication() {
    if (!authToken) {
        showLoginForm();
        return;
    }

    try {
        const user = await apiRequest("/users/me");

        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        await openApplication();

    } catch (error) {
        localStorage.removeItem("deskpilot_token");

        authToken = null;
        currentUser = null;

        showLoginForm();
    }
}

initializeApplication();