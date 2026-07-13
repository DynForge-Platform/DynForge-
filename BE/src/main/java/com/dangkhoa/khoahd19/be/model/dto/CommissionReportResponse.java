package com.dangkhoa.khoahd19.be.model.dto;

public record CommissionReportResponse(
        /** Platform commission rate applied to bookings (e.g. 0.15). */
        double commissionRate,
        /** Commission collected from released escrows. */
        long totalCommissionEarned,
        /** Commission still pending in held escrows. */
        long pendingCommission,
        /** Gross transaction volume of released escrows. */
        long grossVolume,
        long releasedCount,
        long heldCount
) {
}
