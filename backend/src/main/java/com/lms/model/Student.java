package com.lms.model;

import jakarta.persistence.*;

@Entity
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Integer age;
    private String grade;
    private Integer marks;
    private String department;

    public Student() {}

    public Student(String name, Integer age, String grade, Integer marks, String department) {
        this.name = name;
        this.age = age;
        this.grade = grade;
        this.marks = marks;
        this.department = department;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public Integer getMarks() { return marks; }
    public void setMarks(Integer marks) { this.marks = marks; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
