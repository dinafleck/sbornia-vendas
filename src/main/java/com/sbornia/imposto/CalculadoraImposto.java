package com.sbornia.imposto;

import com.sbornia.domain.Produto;
import com.sbornia.domain.Usuario;

import java.math.BigDecimal;

public interface CalculadoraImposto {

    BigDecimal calcular(Usuario usuario, Produto produto, BigDecimal valorBase);
}
