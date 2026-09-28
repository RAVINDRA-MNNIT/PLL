package com.prolearner.all.dto;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentListResponse {

    private List<StudentListItem> students;
    private long total;
    private int currentPage;
    private int totalPages;
    private int size;
}