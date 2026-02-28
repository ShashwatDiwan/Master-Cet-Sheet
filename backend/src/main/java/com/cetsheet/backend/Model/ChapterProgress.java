package com.cetsheet.backend.Model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;


@Entity
@Table(name = "chapter_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","chapter_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ChapterProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private com.cetsheet.backend.Security.Model.User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id")
    private Chapter chapter;

    private boolean completed = false;
    private boolean revised = false;

}
