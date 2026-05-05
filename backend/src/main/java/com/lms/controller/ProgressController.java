package com.lms.controller;

import com.lms.model.UserProgress;
import com.lms.repository.UserProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    @Autowired
    private UserProgressRepository progressRepository;

    @GetMapping("/{email}")
    public List<String> getCompletedLessons(@PathVariable String email) {
        return progressRepository.findByUserEmail(email).stream()
                .filter(UserProgress::isCompleted)
                .map(UserProgress::getLessonId)
                .collect(Collectors.toList());
    }

    @PostMapping("/complete")
    public UserProgress completeLesson(@RequestBody UserProgress request) {
        UserProgress progress = progressRepository
                .findByUserEmailAndLessonId(request.getUserEmail(), request.getLessonId())
                .orElse(request);
        progress.setCompleted(true);
        return progressRepository.save(progress);
    }
}
