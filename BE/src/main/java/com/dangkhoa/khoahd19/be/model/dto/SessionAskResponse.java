package com.dangkhoa.khoahd19.be.model.dto;

import java.util.List;

/** AI answer to a mentee's follow-up question about a session. */
public record SessionAskResponse(String answer, List<String> suggestedQuestions) {
    public SessionAskResponse(String answer) {
        this(answer, List.of());
    }
}
