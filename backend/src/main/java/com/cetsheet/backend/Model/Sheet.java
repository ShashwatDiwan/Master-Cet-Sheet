package com.cetsheet.backend.Model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode(of = "sheetId")
public class Sheet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int sheetId;
    private String sheetName;
    private String Subject;
    private String description;
    private Integer totalChapters;
    private Integer completedChapters;

    @OneToMany(mappedBy = "sheet",cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Chapter> chapters = new ArrayList<>();
}
