package com.dynforge.be.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * AI mentor recommendations for a mentee's request.
 *
 * @param advice             human-readable guidance (Vietnamese, may contain line breaks)
 * @param matches            recommended mentors, each linkable to its profile
 * @param suggestedQuestions dynamic follow-up prompt suggestions for UX click-throughs
 */
public record MentorMatchResponse(
        String advice,
        List<Item> matches,
        List<String> suggestedQuestions,
        @JsonProperty("isDemo") boolean isDemo
) {

    public MentorMatchResponse(String advice, List<Item> matches, List<String> suggestedQuestions) {
        this(advice, matches, suggestedQuestions, false);
    }

    public MentorMatchResponse(String advice, List<Item> matches) {
        this(advice, matches, List.of(), false);
    }

    /**
     * @param mentorId mentor profile id (route {@code /mentors/{id}})
     */
    public record Item(String mentorId, String name, String reason) {}
}
