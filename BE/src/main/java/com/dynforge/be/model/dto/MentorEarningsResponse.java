package com.dynforge.be.model.dto;

public record MentorEarningsResponse(
        /** Withdrawable balance currently in the mentor's wallet. */
        long availableBalance,
        /** Sum of mentor payouts still held in escrow (not yet released). */
        long pendingClearance,
        /** Lifetime net earnings from released escrows. */
        long totalEarned,
        /** Lifetime platform commission deducted from released escrows. */
        long totalCommissionPaid,
        /** Number of COMPLETED sessions taught. */
        long completedSessions,
        /** Sessions paid/accepted/taught but not yet completed. */
        long upcomingSessions
) {
}
