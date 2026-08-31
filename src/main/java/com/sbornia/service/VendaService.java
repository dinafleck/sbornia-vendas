package com.sbornia.service;

import com.sbornia.domain.Venda;
import com.sbornia.dto.VendaRequestDTO;

public interface VendaService {

    Venda registrar(VendaRequestDTO requestDTO);

    Venda buscarPorId(Long id);
}
