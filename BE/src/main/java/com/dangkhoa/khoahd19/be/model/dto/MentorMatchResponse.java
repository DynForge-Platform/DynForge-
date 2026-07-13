package com.dangkhoa.khoahd19.be.model.dto;

import java.util.List;

/**
 * AI mentor recommendations for a mentee's request.
 *
 * @param advice  human-readable guidance (Vietnamese, may contain line breaks)
 * @param matches recommended mentors, each linkable to its profile
 */
public record MentorMatchResponse(String advice, List<Item> matches) {

    /**
     * @param mentorId mentor profile id (route {@code /mentors/{id}})
     */
    public record Item(String mentorId, String name, String reason) {}
}
