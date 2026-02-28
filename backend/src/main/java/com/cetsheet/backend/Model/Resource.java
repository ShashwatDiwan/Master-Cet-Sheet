package com.cetsheet.backend.Model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int resourceId;
    private String resourceName;
    @Enumerated(EnumType.STRING)
    private ResourceType type;
    private String driveFileID;

    @ManyToOne
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private int fileId;
//    private String fileName;
//    private String fileURL;
//
//    @ManyToOne
//    @JoinColumn(name = "chapter_id")
//    private Chapter chapter;
}
