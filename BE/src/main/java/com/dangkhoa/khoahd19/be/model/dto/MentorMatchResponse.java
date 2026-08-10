package com.dangkhoa.khoahd19.be.model.dto;

import java.util.List;

/**
 * AI mentor recommendations for a mentee's request.
 *
 * @param advice             human-readable guidance (Vietnamese, may contain line breaks)
 * @param matches            recommended mentors, each linkable to its profile
 * @param suggestedQuestions dynamic follow-up prompt suggestions for UX click-throughs
 */
public record MentorMatchResponse(String advice, List<Item> matches, List<String> suggestedQuestions) {

    public MentorMatchResponse(String advice, List<Item> matches) {
        this(advice, matches, List.of());
    }

    /**
     * @param mentorId mentor profile id (route {@code /mentors/{id}})
     */
    public record Item(String mentorId, String name, String reason) {}
}
