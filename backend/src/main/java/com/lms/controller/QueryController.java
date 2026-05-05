package com.lms.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/query")
public class QueryController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/run")
    public QueryResponse executeQuery(@RequestBody QueryRequest request) {
        String sql = request.getQuery().trim();
        QueryResponse response = new QueryResponse();
        
        try {
            // Very basic security: limit to SELECT queries to prevent accidental drops in this demo
            if (!sql.toUpperCase().startsWith("SELECT")) {
                response.setSuccess(false);
                response.setMessage("Security Error: Only SELECT queries are allowed in this learning environment.");
                return response;
            }

            // Execute the query
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
            response.setSuccess(true);
            response.setResults(results);
            response.setRowCount(results.size());
            response.setMessage("Query executed successfully!");

        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("SQL Error: " + e.getMessage());
        }

        return response;
    }
}

class QueryRequest {
    private String query;
    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
}

class QueryResponse {
    private boolean success;
    private String message;
    private List<Map<String, Object>> results;
    private int rowCount;

    // Getters and Setters
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public List<Map<String, Object>> getResults() { return results; }
    public void setResults(List<Map<String, Object>> results) { this.results = results; }
    public int getRowCount() { return rowCount; }
    public void setRowCount(int rowCount) { this.rowCount = rowCount; }
}
