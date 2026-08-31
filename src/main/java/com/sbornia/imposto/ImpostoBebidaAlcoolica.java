package com.sbornia.imposto;

import com.sbornia.domain.Categoria;
import com.sbornia.domain.Produto;
import com.sbornia.domain.Usuario;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ImpostoBebidaAlcoolica implements CalculadoraImpostoStrategy {

    private static final BigDecimal ALIQUOTA = new BigDecimal("1.00");

    @Override
    public BigDecimal calcular(Usuario usuario, Produto produto, BigDecimal valorBase) {
        return valorBase.multiply(ALIQUOTA);
    }

    @Override
    public Categoria getCategoria() {
        return Categoria.BEBIDA_ALCOOLICA;
    }
}
