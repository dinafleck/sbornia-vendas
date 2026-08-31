package com.sbornia.service;

import com.sbornia.domain.ItemVenda;
import com.sbornia.domain.Produto;
import com.sbornia.domain.Usuario;
import com.sbornia.domain.Venda;
import com.sbornia.dto.ItemVendaRequestDTO;
import com.sbornia.dto.VendaRequestDTO;
import com.sbornia.imposto.CalculadoraImposto;
import com.sbornia.imposto.CalculadoraImpostoFactory;
import com.sbornia.repository.ProdutoRepository;
import com.sbornia.repository.UsuarioRepository;
import com.sbornia.repository.VendaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
public class VendaServiceImpl implements VendaService {

    private final VendaRepository vendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final CalculadoraImpostoFactory calculadoraImpostoFactory;

    public VendaServiceImpl(VendaRepository vendaRepository,
                             UsuarioRepository usuarioRepository,
                             ProdutoRepository produtoRepository,
                             CalculadoraImpostoFactory calculadoraImpostoFactory) {
        this.vendaRepository = vendaRepository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.calculadoraImpostoFactory = calculadoraImpostoFactory;
    }

    @Override
    @Transactional
    public Venda registrar(VendaRequestDTO requestDTO) {
        Usuario usuario = usuarioRepository.findById(requestDTO.usuarioId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        Venda venda = new Venda(usuario);

        for (ItemVendaRequestDTO itemDTO : requestDTO.itens()) {
            Produto produto = produtoRepository.findById(itemDTO.produtoCodigo())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado: " + itemDTO.produtoCodigo()));

            if (produto.getQuantidadeEstoque() < itemDTO.quantidade()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estoque insuficiente para o produto: " + produto.getCodigo());
            }

            BigDecimal valorBase = produto.getPrecoUnitario().multiply(BigDecimal.valueOf(itemDTO.quantidade()));

            CalculadoraImposto calculadora = calculadoraImpostoFactory.obterCalculadora(produto.getCategoria());
            BigDecimal valorImposto = calculadora.calcular(usuario, produto, valorBase);

            ItemVenda item = new ItemVenda(produto, itemDTO.quantidade(), produto.getPrecoUnitario(), valorImposto, valorBase.add(valorImposto));
            venda.adicionarItem(item);

            produto.setQuantidadeEstoque(produto.getQuantidadeEstoque() - itemDTO.quantidade());
        }

        venda.calcularValorTotal();
        return vendaRepository.save(venda);
    }

    @Override
    public Venda buscarPorId(Long id) {
        return vendaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Venda não encontrada"));
    }
}
