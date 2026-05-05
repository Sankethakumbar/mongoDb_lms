package com.lms.controller;

import com.lms.model.Lesson;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final String CONTENT_PATH = "content";
    private final Pattern SOLUTION_PATTERN = Pattern.compile("<!-- solution: (.*?) -->", Pattern.DOTALL);

    @GetMapping
    public List<Lesson> getAllLessons() {
        List<Lesson> lessons = new ArrayList<>();
        File contentRoot = new File(CONTENT_PATH);

        if (!contentRoot.exists() || !contentRoot.isDirectory()) {
            return lessons;
        }

        File[] categories = contentRoot.listFiles(File::isDirectory);
        if (categories == null) return lessons;

        for (File categoryDir : categories) {
            String category = categoryDir.getName();
            File[] modules = categoryDir.listFiles(File::isDirectory);
            if (modules == null) continue;

            for (File moduleDir : modules) {
                String moduleTitle = moduleDir.getName();
                File[] lessonFiles = moduleDir.listFiles(f -> f.isFile() && f.getName().endsWith(".html"));
                if (lessonFiles == null) continue;

                for (File lessonFile : lessonFiles) {
                    try {
                        String rawContent = Files.readString(lessonFile.toPath());
                        String fileName = lessonFile.getName();
                        String title = fileName.substring(0, fileName.lastIndexOf('.'));
                        
                        // Extract solution if exists
                        String solution = null;
                        Matcher matcher = SOLUTION_PATTERN.matcher(rawContent);
                        if (matcher.find()) {
                            solution = matcher.group(1).trim();
                            // Remove the solution comment from display content
                            rawContent = rawContent.replace(matcher.group(0), "");
                        }

                        String id = category + "/" + moduleTitle + "/" + fileName;
                        lessons.add(new Lesson(id, title, moduleTitle, category, rawContent, solution));
                    } catch (Exception e) {
                        System.err.println("Failed to read lesson file: " + lessonFile.getAbsolutePath());
                    }
                }
            }
        }
        return lessons;
    }
}
