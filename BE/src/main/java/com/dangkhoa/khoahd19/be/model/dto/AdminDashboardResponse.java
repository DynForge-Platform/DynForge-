package com.dangkhoa.khoahd19.be.model.dto;

public record AdminDashboardResponse(
        long totalUsers,
        long totalMentors,
        long totalMentees,
        long totalBookings,
        long completedBookings,
        long activeBookings,
        long disputedBookings,
        long pendingVerifications,
        /** Gross volume of released escrows (GMV). */
        long totalRevenue,
        /** Platform commission earned from released escrows. */
        long totalCommission,
        /** Total amount currently locked in escrow (HELD). */
        long escrowHeld
) {
}
