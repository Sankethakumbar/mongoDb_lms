package com.lms.repository;

import com.lms.model.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    List<UserProgress> findByUserEmail(String userEmail);
    Optional<UserProgress> findByUserEmailAndLessonId(String userEmail, String lessonId);
}
