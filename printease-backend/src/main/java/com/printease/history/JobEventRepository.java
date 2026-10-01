package com.printease.history;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobEventRepository extends JpaRepository<JobEvent, Long> {

    List<JobEvent> findByJobIdOrderByCreatedAtDesc(String jobId);

    Page<JobEvent> findByJobIdOrderByCreatedAtDesc(String jobId, Pageable pageable);
}
