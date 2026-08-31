package com.sbornia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ItemVendaRequestDTO(
        @NotBlank String produtoCodigo,
        @NotNull @Positive Integer quantidade) {
}
