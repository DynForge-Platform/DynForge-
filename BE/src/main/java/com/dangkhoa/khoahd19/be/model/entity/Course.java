package com.dangkhoa.khoahd19.be.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    private String code;
    private String name;
    /** "A" or "A+" — kept as a plain string since "A+" is not a valid Java enum identifier. */
    private String grade;
    private long ratePrivate;
    private long rateGroup;
}
