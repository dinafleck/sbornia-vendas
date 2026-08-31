package com.sbornia.imposto;

import com.sbornia.domain.Categoria;
import com.sbornia.domain.Produto;
import com.sbornia.domain.Usuario;

import java.math.BigDecimal;

public class DescontoDependentesCalculadoraImposto implements CalculadoraImposto {

    private static final int DEPENDENTES_MINIMO_DESCONTO = 3;
    private static final BigDecimal FATOR_DESCONTO = new BigDecimal("0.5");

    private final CalculadoraImposto delegate;

    public DescontoDependentesCalculadoraImposto(CalculadoraImposto delegate) {
        this.delegate = delegate;
    }

    @Override
    public BigDecimal calcular(Usuario usuario, Produto produto, BigDecimal valorBase) {
        BigDecimal imposto = delegate.calcular(usuario, produto, valorBase);

        boolean temDesconto = usuario.getNumeroDependentes() > DEPENDENTES_MINIMO_DESCONTO
                && produto.getCategoria() != Categoria.BEBIDA_ALCOOLICA;

        return temDesconto ? imposto.multiply(FATOR_DESCONTO) : imposto;
    }
}
