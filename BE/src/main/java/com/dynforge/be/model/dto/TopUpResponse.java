package com.dynforge.be.model.dto;

public record TopUpResponse(
        String txnId,
        long amount,
        String paymentUrl
) {
}
