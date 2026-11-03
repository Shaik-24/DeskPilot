package com.shaik.deskpilot.service;

import java.util.List;
import java.util.Locale;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.shaik.deskpilot.entity.Ticket;
import com.shaik.deskpilot.entity.User;
import com.shaik.deskpilot.exception.ResourceNotFoundException;
import com.shaik.deskpilot.repository.TicketRepository;
import com.shaik.deskpilot.repository.UserRepository;

@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public TicketService(
            TicketRepository ticketRepository,
            UserRepository userRepository) {

        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    // Get currently logged-in user
    private User getLoggedInUser() {

        Authentication authentication = SecurityContextHolder
                .getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UserDetails)) {

            throw new IllegalStateException("User is not authenticated");
        }

        String email = ((UserDetails) authentication.getPrincipal())
                .getUsername();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Authenticated user not found"));
    }

    // Validate ticket status
    private String validateStatus(String status) {

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        String value = status.trim().toUpperCase(Locale.ROOT);

        if (!List.of("OPEN", "IN_PROGRESS", "RESOLVED").contains(value)) {
            throw new IllegalArgumentException("Invalid ticket status");
        }

        return value;
    }

    // Validate ticket priority
    private String validatePriority(String priority) {

        if (priority == null || priority.isBlank()) {
            throw new IllegalArgumentException("Priority is required");
        }

        String value = priority.trim().toUpperCase(Locale.ROOT);

        if (!List.of("LOW", "MEDIUM", "HIGH").contains(value)) {
            throw new IllegalArgumentException("Invalid ticket priority");
        }

        return value;
    }

    // Validate title
    private String validateTitle(String title) {

        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Ticket title is required");
        }

        String value = title.trim();

        if (value.length() > 150) {
            throw new IllegalArgumentException(
                    "Ticket title cannot exceed 150 characters");
        }

        return value;
    }

    // Validate description
    private String validateDescription(String description) {

        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException(
                    "Ticket description is required");
        }

        String value = description.trim();

        if (value.length() > 2000) {
            throw new IllegalArgumentException(
                    "Ticket description cannot exceed 2000 characters");
        }

        return value;
    }

    // Create a new ticket
    public Ticket createTicket(Ticket ticket) {

        if (ticket == null) {
            throw new IllegalArgumentException(
                    "Ticket details are required");
        }

        User user = getLoggedInUser();

        ticket.setId(null);
        ticket.setCreatedBy(user);
        ticket.setTitle(validateTitle(ticket.getTitle()));
        ticket.setDescription(validateDescription(ticket.getDescription()));
        ticket.setStatus("OPEN");

        if (ticket.getPriority() == null
                || ticket.getPriority().isBlank()) {

            ticket.setPriority("MEDIUM");

        } else {
            ticket.setPriority(validatePriority(ticket.getPriority()));
        }

        ticket.setAssignedTo(null);

        return ticketRepository.save(ticket);
    }

    // Get tickets based on user role
    public List<Ticket> getAllTickets() {

        User user = getLoggedInUser();
        String role = user.getRole();

        if ("ADMIN".equalsIgnoreCase(role)) {
            return ticketRepository.findAll();
        }

        if ("AGENT".equalsIgnoreCase(role)) {
            return ticketRepository.findByAssignedToIgnoreCase(
                    user.getEmail());
        }

        return ticketRepository.findByCreatedBy_Id(user.getId());
    }

    // Get ticket by ID
    public Ticket getTicketById(Long id) {

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ticket not found with ID: " + id));

        checkTicketAccess(ticket);

        return ticket;
    }

    // Check ticket access permissions
    private void checkTicketAccess(Ticket ticket) {

        User user = getLoggedInUser();
        String role = user.getRole();

        if ("ADMIN".equalsIgnoreCase(role)) {
            return;
        }

        if ("AGENT".equalsIgnoreCase(role)
                && ticket.getAssignedTo() != null
                && ticket.getAssignedTo().equalsIgnoreCase(user.getEmail())) {
            return;
        }

        if ("USER".equalsIgnoreCase(role)
                && ticket.getCreatedBy() != null
                && ticket.getCreatedBy().getId().equals(user.getId())) {
            return;
        }

        throw new AccessDeniedException(
                "You do not have permission to access this ticket");
    }

    // Delete ticket (Admin only, and only after resolution)
    public void deleteTicket(Long id) {

        User user = getLoggedInUser();

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new AccessDeniedException(
                    "Only admins can delete tickets");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ticket not found with ID: " + id));

        if (!"RESOLVED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException(
                    "Only resolved tickets can be deleted");
        }

        ticketRepository.delete(ticket);
    }

    // Update ticket with role-based permissions
    public Ticket updateTicket(Long id, Ticket updatedTicket) {

        if (updatedTicket == null) {
            throw new IllegalArgumentException(
                    "Ticket update details are required");
        }

        Ticket existingTicket = getTicketById(id);
        User user = getLoggedInUser();

        String role = user.getRole();

        // USER permissions
        if ("USER".equalsIgnoreCase(role)) {

            // Users can edit only OPEN tickets
            if (!"OPEN".equalsIgnoreCase(existingTicket.getStatus())) {
                throw new AccessDeniedException(
                        "You can update only tickets with OPEN status");
            }

            // Users cannot change priority
            if (updatedTicket.getPriority() != null) {
                throw new AccessDeniedException(
                        "Users cannot change ticket priority");
            }

            // Users can only change status to RESOLVED
            if (updatedTicket.getStatus() != null) {

                String requestedStatus =
                        validateStatus(updatedTicket.getStatus());

                if (!"RESOLVED".equals(requestedStatus)) {
                    throw new AccessDeniedException(
                            "Users can only mark their tickets as RESOLVED");
                }

                existingTicket.setStatus("RESOLVED");
            }

            // Update title
            if (updatedTicket.getTitle() != null) {
                existingTicket.setTitle(
                        validateTitle(updatedTicket.getTitle()));
            }

            // Update description
            if (updatedTicket.getDescription() != null) {
                existingTicket.setDescription(
                        validateDescription(updatedTicket.getDescription()));
            }

            if (updatedTicket.getTitle() == null
                    && updatedTicket.getDescription() == null
                    && updatedTicket.getStatus() == null) {

                throw new IllegalArgumentException(
                        "Please provide at least one field to update");
            }

            return ticketRepository.save(existingTicket);
        }

        // ADMIN and AGENT permissions
        if (!"ADMIN".equalsIgnoreCase(role)
                && !"AGENT".equalsIgnoreCase(role)) {

            throw new AccessDeniedException(
                    "You do not have permission to update this ticket");
        }

        if (updatedTicket.getTitle() != null) {
            existingTicket.setTitle(
                    validateTitle(updatedTicket.getTitle()));
        }

        if (updatedTicket.getDescription() != null) {
            existingTicket.setDescription(
                    validateDescription(updatedTicket.getDescription()));
        }

        if (updatedTicket.getPriority() != null) {
            existingTicket.setPriority(
                    validatePriority(updatedTicket.getPriority()));
        }

        if (updatedTicket.getStatus() != null) {
            existingTicket.setStatus(
                    validateStatus(updatedTicket.getStatus()));
        }

        return ticketRepository.save(existingTicket);
    }

    // Assign ticket to an agent (Admin only)
    public Ticket assignTicket(Long id, String assignedTo) {

        User user = getLoggedInUser();

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new AccessDeniedException(
                    "Only admins can assign tickets");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ticket not found with ID: " + id));

        if (assignedTo == null || assignedTo.isBlank()) {
            throw new IllegalArgumentException(
                    "Support agent email is required");
        }

        String email = assignedTo.trim().toLowerCase(Locale.ROOT);

        User agent = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "No registered user found with email: " + email));

        if (agent.getRole() == null
                || !"AGENT".equalsIgnoreCase(agent.getRole())) {

            throw new IllegalArgumentException(
                    "The specified user is not a support agent");
        }

        ticket.setAssignedTo(agent.getEmail());

        return ticketRepository.save(ticket);
    }
}
