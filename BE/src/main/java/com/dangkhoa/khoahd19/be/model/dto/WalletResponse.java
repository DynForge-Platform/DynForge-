package com.dangkhoa.khoahd19.be.model.dto;

import java.util.List;

public record WalletResponse(
        long balance,
        List<TransactionResponse> transactions
) {
}
