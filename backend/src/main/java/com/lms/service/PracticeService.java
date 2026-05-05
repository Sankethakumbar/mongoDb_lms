package com.lms.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.PracticeQuestion;
import com.lms.repository.PracticeQuestionRepository;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.BasicQuery;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@SuppressWarnings({"unchecked", "null"})
public class PracticeService {

    @Autowired
    private PracticeQuestionRepository questionRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<PracticeQuestion> getAllQuestions() {
        return questionRepository.findAll();
    }

    public Optional<PracticeQuestion> getQuestionById(Long id) {
        return questionRepository.findById(id);
    }

    public Map<String, Object> evaluateSubmission(Map<String, Object> submission) throws Exception {
        Long questionId = Long.valueOf(submission.get("questionId").toString());
        String operation = submission.get("operation").toString();
        String collection = submission.get("collection").toString();
        
        PracticeQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // Security check
        if (!operation.equals("find") && !operation.equals("aggregate")) {
            throw new RuntimeException("Security Error: Only find and aggregate operations are allowed.");
        }

        List<Document> actualResults = new ArrayList<>();

        try {
            if (operation.equals("find")) {
                Map<String, Object> filter = (Map<String, Object>) submission.get("filter");
                String filterJson = objectMapper.writeValueAsString(filter != null ? filter : new HashMap<>());
                BasicQuery query = new BasicQuery(filterJson);
                actualResults = mongoTemplate.find(query, Document.class, collection);
            } else if (operation.equals("aggregate")) {
                List<Map<String, Object>> pipeline = (List<Map<String, Object>>) submission.get("pipeline");
                // Convert maps to Documents for aggregation
                List<Document> pipelineDocs = new ArrayList<>();
                for (Map<String, Object> stage : pipeline) {
                    pipelineDocs.add(new Document(stage));
                }
                actualResults = mongoTemplate.getCollection(collection)
                        .aggregate(pipelineDocs)
                        .into(new ArrayList<>());
            }
        } catch (org.springframework.dao.DataAccessResourceFailureException | com.mongodb.MongoTimeoutException e) {
            throw new RuntimeException("CRITICAL: MongoDB Service is offline. Please start MongoDB on port 27017 to enable practice features.");
        } catch (Exception e) {
            throw new RuntimeException("Query Error: " + e.getMessage());
        }

        // Clean results (remove _id for comparison if needed, or just compare values)
        List<Map<String, Object>> actualList = new ArrayList<>();
        for (Document doc : actualResults) {
            Map<String, Object> map = new HashMap<>(doc);
            map.remove("_id"); // Standard practice to ignore MongoDB ObjectIds in comparison
            actualList.add(map);
        }

        // Parse expected output
        List<Map<String, Object>> expectedList = objectMapper.readValue(
                question.getExpectedOutput(), 
                objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
        );

        boolean isMatch = compareResults(actualList, expectedList);

        Map<String, Object> response = new HashMap<>();
        response.put("status", isMatch ? "PASS" : "FAIL");
        response.put("actual", actualList);
        response.put("expected", expectedList);
        return response;
    }

    private boolean compareResults(List<Map<String, Object>> actual, List<Map<String, Object>> expected) {
        if (actual.size() != expected.size()) return false;
        
        // Deep sort or compare ignoring order
        // For simplicity, we'll convert both to sorted string representations or use a multiset-like comparison
        try {
            String s1 = objectMapper.writeValueAsString(sortList(actual));
            String s2 = objectMapper.writeValueAsString(sortList(expected));
            return s1.equals(s2);
        } catch (Exception e) {
            return false;
        }
    }

    private List<Map<String, Object>> sortList(List<Map<String, Object>> list) {
        List<Map<String, Object>> sorted = new ArrayList<>(list);
        Collections.sort(sorted, (m1, m2) -> {
            try {
                return objectMapper.writeValueAsString(new TreeMap<>(m1))
                        .compareTo(objectMapper.writeValueAsString(new TreeMap<>(m2)));
            } catch (Exception e) {
                return 0;
            }
        });
        return sorted;
    }
}
