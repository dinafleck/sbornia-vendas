package com.sbornia.imposto;

import com.sbornia.domain.Categoria;
import com.sbornia.domain.Produto;
import com.sbornia.domain.Usuario;

import java.math.BigDecimal;

public class IsencaoIdosoCalculadoraImposto implements CalculadoraImposto {

    private static final int IDADE_MINIMA_ISENCAO = 60;

    private final CalculadoraImposto delegate;

    public IsencaoIdosoCalculadoraImposto(CalculadoraImposto delegate) {
        this.delegate = delegate;
    }

    @Override
    public BigDecimal calcular(Usuario usuario, Produto produto, BigDecimal valorBase) {
        BigDecimal imposto = delegate.calcular(usuario, produto, valorBase);

        boolean isento = usuario.getIdade() > IDADE_MINIMA_ISENCAO
                && produto.getCategoria() != Categoria.BEBIDA_ALCOOLICA;

        return isento ? BigDecimal.ZERO : imposto;
    }
}
