package com.lms.model;

import jakarta.persistence.*;

@Entity
@Table(name = "practice_questions")
public class PracticeQuestion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String difficulty;
    private String collectionName;
    
    @Column(columnDefinition = "TEXT")
    private String starterQuery;
    
    @Column(columnDefinition = "TEXT")
    private String expectedOutput;
    
    @Column(columnDefinition = "TEXT")
    private String solution;

    public PracticeQuestion() {}

    public PracticeQuestion(String title, String description, String difficulty, String collectionName, String starterQuery, String expectedOutput, String solution) {
        this.title = title;
        this.description = description;
        this.difficulty = difficulty;
        this.collectionName = collectionName;
        this.starterQuery = starterQuery;
        this.expectedOutput = expectedOutput;
        this.solution = solution;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getCollectionName() { return collectionName; }
    public void setCollectionName(String collectionName) { this.collectionName = collectionName; }
    public String getStarterQuery() { return starterQuery; }
    public void setStarterQuery(String starterQuery) { this.starterQuery = starterQuery; }
    public String getExpectedOutput() { return expectedOutput; }
    public void setExpectedOutput(String expectedOutput) { this.expectedOutput = expectedOutput; }

    public String getSolution() { return solution; }
    public void setSolution(String solution) { this.solution = solution; }
}
