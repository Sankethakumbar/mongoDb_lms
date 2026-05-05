package com.lms.config;

import com.lms.model.Employee;
import com.lms.model.Student;
import com.lms.repository.EmployeeRepository;
import com.lms.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private StudentRepository studentRepository;
    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private com.lms.repository.PracticeQuestionRepository practiceQuestionRepository;
    @Autowired private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    @Override
    @SuppressWarnings("null")
    public void run(String... args) throws Exception {
        System.out.println("Refreshing database content...");
        
        // Clear all MySQL
        studentRepository.deleteAll();
        employeeRepository.deleteAll();
        practiceQuestionRepository.deleteAll();

        // Seed MySQL Data (Fast)
        seedMockData();
        seedPracticeQuestions();

        // Clear and Seed MongoDB (May block if DB is down)
        try {
            mongoTemplate.getCollection("students").drop();
            seedMongoDB();
            System.out.println("✅ MongoDB practice data seeded.");
        } catch (Exception e) {
            System.err.println("❌ MongoDB connection failed: Practice challenges requiring real MongoDB will not work. Please ensure MongoDB is running on port 27017.");
        }

        System.out.println("Database seeding completed!");
    }

    private void seedMongoDB() {
        mongoTemplate.save(new org.bson.Document(Map.of("name", "Alice Johnson", "age", 20, "grade", "A", "marks", 92, "department", "CS")), "students");
        mongoTemplate.save(new org.bson.Document(Map.of("name", "Bob Smith", "age", 22, "grade", "B", "marks", 70, "department", "Physics")), "students");
        mongoTemplate.save(new org.bson.Document(Map.of("name", "Charlie Brown", "age", 21, "grade", "A", "marks", 50, "department", "Mathematics")), "students");
        mongoTemplate.save(new org.bson.Document(Map.of("name", "John", "age", 25, "grade", "B", "marks", 85, "department", "CS")), "students");
    }

    @SuppressWarnings("null")
    private void seedMockData() {
        studentRepository.saveAll(List.of(
            new Student("Alice Johnson", 20, "A", 92, "Computer Science"),
            new Student("Bob Smith", 22, "B", 70, "Physics"),
            new Student("Charlie Brown", 21, "A", 50, "Mathematics")
        ));

        employeeRepository.saveAll(List.of(
            new Employee("John Doe", "Engineer", 85000.0, "IT"),
            new Employee("Jane Roe", "Manager", 95000.0, "HR")
        ));
    }

    @SuppressWarnings("null")
    private void seedPracticeQuestions() {
        practiceQuestionRepository.saveAll(List.of(
            // EASY
            new com.lms.model.PracticeQuestion(
                "Show all students", 
                "In this introductory challenge, your task is to retrieve the complete dataset from the <code>students</code> collection. This will help you verify that you can connect to the database and view all available student records without any filters.", 
                "easy", 
                "students", 
                "db.students.find({})", 
                "[{\"name\":\"Alice Johnson\",\"marks\":92},{\"name\":\"Bob Smith\",\"marks\":70},{\"name\":\"Charlie Brown\",\"marks\":50},{\"name\":\"John\",\"marks\":85}]",
                "db.students.find({})"
            ),
            new com.lms.model.PracticeQuestion(
                "Find High Achievers", 
                "The administration needs a list of students who have performed exceptionally well. Write a query to find all students who have scored <strong>more than 60 marks</strong>. Ensure you use the correct comparison operator to filter the results.", 
                "easy", 
                "students", 
                "db.students.find({\n  marks: { $gt: 0 }\n})", 
                "[{\"name\":\"Alice Johnson\",\"marks\":92},{\"name\":\"Bob Smith\",\"marks\":70},{\"name\":\"John\",\"marks\":85}]",
                "db.students.find({ marks: { $gt: 60 } })"
            ),
            new com.lms.model.PracticeQuestion(
                "CS Department Lookup", 
                "The Computer Science department is organizing a seminar. Retrieve all students who belong to the <strong>'CS'</strong> department. This challenge tests your ability to perform exact string matching on fields.", 
                "easy", 
                "students", 
                "db.students.find({\n  department: \"\"\n})", 
                "[{\"name\":\"Alice Johnson\",\"department\":\"CS\"},{\"name\":\"John\",\"department\":\"CS\"}]",
                "db.students.find({ department: 'CS' })"
            ),
            
            // MEDIUM
            new com.lms.model.PracticeQuestion(
                "Marks Range Query", 
                "Find students whose marks fall within a specific range. You need to retrieve students who scored <strong>greater than 60 AND less than 80</strong>. This requires combining multiple comparison operators within a single field filter.", 
                "medium", 
                "students", 
                "db.students.find({\n  marks: { }\n})", 
                "[{\"name\":\"Bob Smith\",\"marks\":70}]",
                "db.students.find({ marks: { $gt: 60, $lt: 80 } })"
            ),
            
            // HARD
            new com.lms.model.PracticeQuestion(
                "Department Statistics", 
                "Using the Aggregation Pipeline, calculate the total number of students in each department. You should group the documents by the <code>department</code> field and use the <code>$sum</code> accumulator to get the count for each group.", 
                "hard", 
                "students", 
                "db.students.aggregate([\n  { $group: { } }\n])", 
                "[{\"_id\":\"CS\",\"count\":2},{\"_id\":\"Physics\",\"count\":1},{\"_id\":\"Mathematics\",\"count\":1}]",
                "db.students.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }])"
            )
        ));
    }
}
