package com.printease.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DocumentImageRepository extends JpaRepository<DocumentImage, String> {

    List<DocumentImage> findByParentImageId(String parentImageId);

    List<DocumentImage> findByExpiresAtBeforeAndExpiresAtIsNotNull(LocalDateTime dateTime);
}
