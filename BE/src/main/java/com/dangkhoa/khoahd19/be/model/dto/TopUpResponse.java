package com.dangkhoa.khoahd19.be.model.dto;

public record TopUpResponse(
        String txnId,
        long amount,
        String paymentUrl
) {
}
