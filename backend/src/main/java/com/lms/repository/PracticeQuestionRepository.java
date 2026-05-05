package com.lms.repository;

import com.lms.model.PracticeQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PracticeQuestionRepository extends JpaRepository<PracticeQuestion, Long> {
}
