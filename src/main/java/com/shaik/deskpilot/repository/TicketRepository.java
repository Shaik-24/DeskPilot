package com.shaik.deskpilot.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shaik.deskpilot.entity.Ticket;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedBy_Id(Long userId);

    List<Ticket> findByAssignedToIgnoreCase(String assignedTo);
}
