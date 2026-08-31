package com.sbornia.imposto;

import com.sbornia.domain.Categoria;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class CalculadoraImpostoFactory {

    private final Map<Categoria, CalculadoraImposto> calculadorasPorCategoria;

    public CalculadoraImpostoFactory(List<CalculadoraImpostoStrategy> strategies) {
        this.calculadorasPorCategoria = strategies.stream()
                .collect(Collectors.toMap(CalculadoraImpostoStrategy::getCategoria, this::decorar));
    }

    private CalculadoraImposto decorar(CalculadoraImposto strategy) {
        return new DescontoDependentesCalculadoraImposto(new IsencaoIdosoCalculadoraImposto(strategy));
    }

    public CalculadoraImposto obterCalculadora(Categoria categoria) {
        return calculadorasPorCategoria.getOrDefault(categoria, calculadorasPorCategoria.get(Categoria.OUTROS));
    }
}
