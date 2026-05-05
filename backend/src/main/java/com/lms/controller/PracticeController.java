package com.lms.controller;

import com.lms.model.PracticeQuestion;
import com.lms.service.PracticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    @Autowired
    private PracticeService practiceService;

    @GetMapping("/questions")
    public List<PracticeQuestion> getAllQuestions() {
        return practiceService.getAllQuestions();
    }

    @GetMapping("/question/{id}")
    public ResponseEntity<PracticeQuestion> getQuestionById(@PathVariable Long id) {
        return practiceService.getQuestionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitSolution(@RequestBody Map<String, Object> submission) {
        try {
            Map<String, Object> result = practiceService.evaluateSubmission(submission);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", e.getMessage()
            ));
        }
    }
}
