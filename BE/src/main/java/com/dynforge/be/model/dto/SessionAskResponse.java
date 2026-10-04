package com.dynforge.be.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** AI answer to a mentee's follow-up question about a session. */
public record SessionAskResponse(
        String answer,
        List<String> suggestedQuestions,
        @JsonProperty("isDemo") boolean isDemo
) {
    public SessionAskResponse(String answer, List<String> suggestedQuestions) {
        this(answer, suggestedQuestions, false);
    }

    public SessionAskResponse(String answer) {
        this(answer, List.of(), false);
    }
}
