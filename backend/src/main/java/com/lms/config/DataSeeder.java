package com.lms.config;

import com.lms.model.Employee;
import com.lms.model.Student;
import com.lms.repository.EmployeeRepository;
import com.lms.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private StudentRepository studentRepository;
    @Autowired private EmployeeRepository employeeRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Refreshing database content...");
        
        // Clear all
        studentRepository.deleteAll();
        employeeRepository.deleteAll();

        // Seed Mock MongoDB Data
        seedMockData();

        System.out.println("Database seeding completed!");
    }

    @SuppressWarnings("null")
    private void seedMockData() {
        studentRepository.saveAll(List.of(
            new Student("Alice Johnson", 20, "A", 92, "Computer Science"),
            new Student("Bob Smith", 22, "B", 78, "Physics"),
            new Student("Charlie Brown", 21, "A", 88, "Mathematics"),
            new Student("Diana Prince", 23, "C", 65, "History"),
            new Student("Ethan Hunt", 20, "B", 82, "Computer Science")
        ));

        employeeRepository.saveAll(List.of(
            new Employee("John Doe", "Engineer", 85000.0, "IT"),
            new Employee("Jane Roe", "Manager", 95000.0, "HR"),
            new Employee("Bill Gates", "Developer", 120000.0, "IT"),
            new Employee("Steve Jobs", "Designer", 110000.0, "Creative")
        ));
    }
}
