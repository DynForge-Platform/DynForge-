package com.dynforge.be.model.dto;

import java.util.List;

public record WalletResponse(
        long balance,
        List<TransactionResponse> transactions
) {
}
