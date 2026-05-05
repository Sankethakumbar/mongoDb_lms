package com.lms.model;

public class Lesson {
    private String id; 
    private String title;
    private String moduleTitle;
    private String category; // CURRICULUM or PRACTICE
    private String content;
    private String solution; // Optional: The correct query for practice challenges

    public Lesson() {}

    public Lesson(String id, String title, String moduleTitle, String category, String content, String solution) {
        this.id = id;
        this.title = title;
        this.moduleTitle = moduleTitle;
        this.category = category;
        this.content = content;
        this.solution = solution;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getModuleTitle() { return moduleTitle; }
    public void setModuleTitle(String moduleTitle) { this.moduleTitle = moduleTitle; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getSolution() { return solution; }
    public void setSolution(String solution) { this.solution = solution; }
}
