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
@EqualsAndHashCode(of = "chapterId")
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int chapterId;
    private String chapterName;
    private double weightage;

    @ManyToOne
    @JoinColumn(name = "sheet_id")
    private Sheet sheet;

    @OneToMany(mappedBy = "chapter",cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Resource>  resources = new ArrayList<>();



}
