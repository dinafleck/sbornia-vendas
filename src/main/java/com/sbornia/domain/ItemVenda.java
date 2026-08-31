package com.sbornia.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

@Entity
@Table(name = "item_venda")
public class ItemVenda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(optional = false)
    @JoinColumn(name = "venda_id")
    private Venda venda;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "produto_codigo")
    private Produto produto;

    @NotNull
    @Positive
    private Integer quantidade;

    @NotNull
    @Positive
    private BigDecimal precoUnitario;

    @NotNull
    @PositiveOrZero
    private BigDecimal valorImposto;

    @NotNull
    @PositiveOrZero
    private BigDecimal valorTotal;

    public ItemVenda() {
    }

    public ItemVenda(Produto produto, Integer quantidade, BigDecimal precoUnitario, BigDecimal valorImposto, BigDecimal valorTotal) {
        this.produto = produto;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
        this.valorImposto = valorImposto;
        this.valorTotal = valorTotal;
    }

    public Long getId() {
        return id;
    }

    public Venda getVenda() {
        return venda;
    }

    public void setVenda(Venda venda) {
        this.venda = venda;
    }

    public Produto getProduto() {
        return produto;
    }

    public Integer getQuantidade() {
        return quantidade;
    }

    public BigDecimal getPrecoUnitario() {
        return precoUnitario;
    }

    public BigDecimal getValorImposto() {
        return valorImposto;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }
}
