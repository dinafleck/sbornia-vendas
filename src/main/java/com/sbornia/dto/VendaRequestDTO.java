package com.sbornia.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record VendaRequestDTO(
        @NotNull Long usuarioId,
        @NotEmpty @Valid List<ItemVendaRequestDTO> itens) {
}
