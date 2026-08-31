package com.sbornia.imposto;

import com.sbornia.domain.Categoria;

public interface CalculadoraImpostoStrategy extends CalculadoraImposto {

    Categoria getCategoria();
}
