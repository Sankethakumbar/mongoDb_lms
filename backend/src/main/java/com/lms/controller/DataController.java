package com.lms.controller;

import com.lms.model.Employee;
import com.lms.model.Student;
import com.lms.repository.EmployeeRepository;
import com.lms.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/data")
public class DataController {

    @Autowired private StudentRepository studentRepository;
    @Autowired private EmployeeRepository employeeRepository;

    @GetMapping("/students")
    public List<Student> getStudents() {
        return studentRepository.findAll();
    }

    @GetMapping("/employees")
    public List<Employee> getEmployees() {
        return employeeRepository.findAll();
    }
}
