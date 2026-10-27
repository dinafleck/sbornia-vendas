import { ErroApi, SborniaApi } from "./api.js";
import { imprimirCupom } from "./cupom.js";
import type { Categoria, ItemVendaRequest, Produto, Usuario } from "./tipos.js";

const api = new SborniaApi();

const ALIQUOTAS: Record<Categoria, number> = {
    ALIMENTICIO: 0.05,
    AUTOMOTIVO: 0.3,
    BEBIDA_ALCOOLICA: 1.0,
    OUTROS: 0.17,
};

/** Regras do enunciado, itens i a vi, calculadas do lado do cliente para conferência. */
function impostoEsperado(usuario: Usuario, produto: Produto, quantidade: number): number {
    const base = produto.precoUnitario * quantidade;
    let imposto = base * ALIQUOTAS[produto.categoria];
    const bebida = produto.categoria === "BEBIDA_ALCOOLICA";
    if (usuario.idade > 60 && !bebida) imposto = 0;
    if (usuario.numeroDependentes > 3 && !bebida) imposto *= 0.5;
    return imposto;
}

function nascidoHa(anos: number): string {
    const data = new Date();
    data.setFullYear(data.getFullYear() - anos);
    data.setMonth(data.getMonth() - 1); // garante que o aniversário deste ano já passou
    return data.toISOString().slice(0, 10);
}

const PRODUTOS: Produto[] = [
    { codigo: "7891000100103", descricao: "Arroz 5kg", quantidadeEstoque: 100, precoUnitario: 20.0, categoria: "ALIMENTICIO" },
    { codigo: "7891000200204", descricao: "Óleo de motor 1L", quantidadeEstoque: 50, precoUnitario: 40.0, categoria: "AUTOMOTIVO" },
    { codigo: "7891000300305", descricao: "Vinho tinto 750ml", quantidadeEstoque: 30, precoUnitario: 50.0, categoria: "BEBIDA_ALCOOLICA" },
    { codigo: "7891000400406", descricao: "Caderno 200 folhas", quantidadeEstoque: 80, precoUnitario: 10.0, categoria: "OUTROS" },
];

let falhas = 0;

async function venda(titulo: string, usuario: Usuario, itens: ItemVendaRequest[]): Promise<void> {
    console.log(`\n### ${titulo}`);
    const resultado = await api.registrarVenda({ usuarioId: usuario.id, itens });
    console.log(imprimirCupom(resultado));

    for (const item of resultado.itens) {
        const esperado = impostoEsperado(usuario, item.produto, item.quantidade);
        const ok = Math.abs(esperado - item.valorImposto) < 0.005;
        if (!ok) falhas++;
        console.log(
            `  ${ok ? "OK  " : "FALHA"} ${item.produto.descricao}: imposto esperado ${esperado.toFixed(2)}, ` +
            `recebido ${item.valorImposto.toFixed(2)}`,
        );
    }
}

async function erroEsperado(titulo: string, statusEsperado: number, acao: () => Promise<unknown>): Promise<void> {
    console.log(`\n### ${titulo}`);
    try {
        await acao();
        falhas++;
        console.log(`  FALHA: a requisição deveria ter retornado HTTP ${statusEsperado}.`);
    } catch (erro) {
        if (!(erro instanceof ErroApi)) throw erro;
        const ok = erro.status === statusEsperado;
        if (!ok) falhas++;
        console.log(`  ${ok ? "OK  " : "FALHA"} HTTP ${erro.status}: ${erro.message}`);
    }
}

async function main(): Promise<void> {
    console.log("Cadastrando produtos (POST /produtos)...");
    for (const p of PRODUTOS) await api.cadastrarProduto(p);
    const [arroz, oleo, vinho, caderno] = PRODUTOS.map((p) => p.codigo);

    console.log("Cadastrando usuários (POST /usuarios)...");
    const adulto = await api.cadastrarUsuario({ nome: "Kraunus Sang", dataNascimento: nascidoHa(35), numeroDependentes: 1 });
    const idoso = await api.cadastrarUsuario({ nome: "Pletskaya Kraunus", dataNascimento: nascidoHa(70), numeroDependentes: 0 });
    const familia = await api.cadastrarUsuario({ nome: "Maestro Pletskaya", dataNascimento: nascidoHa(40), numeroDependentes: 4 });
    const idosoFamilia = await api.cadastrarUsuario({ nome: "Vó Sbørnia", dataNascimento: nascidoHa(65), numeroDependentes: 5 });

    console.log(`Usuários disponíveis (GET /usuarios): ${(await api.listarUsuarios()).length}`);
    console.log(`Produtos disponíveis (GET /produtos): ${(await api.listarProdutos()).length}`);

    await venda("Regras i a iv: adulto sem benefícios compra uma unidade de cada categoria", adulto, [
        { produtoCodigo: arroz, quantidade: 1 },
        { produtoCodigo: oleo, quantidade: 1 },
        { produtoCodigo: vinho, quantidade: 1 },
        { produtoCodigo: caderno, quantidade: 1 },
    ]);

    await venda("Regra v: maior de 60 anos não paga imposto, exceto bebida alcoólica", idoso, [
        { produtoCodigo: arroz, quantidade: 2 },
        { produtoCodigo: vinho, quantidade: 1 },
    ]);

    await venda("Regra vi: mais de 3 dependentes tem 50% de desconto no imposto, exceto bebida", familia, [
        { produtoCodigo: oleo, quantidade: 2 },
        { produtoCodigo: caderno, quantidade: 3 },
        { produtoCodigo: vinho, quantidade: 1 },
    ]);

    await venda("Regras v e vi juntas: idoso com 5 dependentes", idosoFamilia, [
        { produtoCodigo: caderno, quantidade: 1 },
        { produtoCodigo: vinho, quantidade: 1 },
    ]);

    const primeira = await api.buscarVenda(1).catch(() => null);
    if (primeira) console.log(`\nConsulta GET /vendas/1: total ${primeira.valorTotal.toFixed(2)}`);

    await erroEsperado("Validação: estoque insuficiente", 400, () =>
        api.registrarVenda({ usuarioId: adulto.id, itens: [{ produtoCodigo: vinho, quantidade: 9999 }] }),
    );
    await erroEsperado("Validação: usuário inexistente", 404, () =>
        api.registrarVenda({ usuarioId: 999999, itens: [{ produtoCodigo: arroz, quantidade: 1 }] }),
    );
    await erroEsperado("Validação: produto inexistente", 404, () => api.buscarProduto("0000000000000"));
    await erroEsperado("Validação: dados inválidos de usuário", 400, () =>
        api.cadastrarUsuario({ nome: "", dataNascimento: "2999-01-01", numeroDependentes: -1 }),
    );

    console.log(falhas === 0 ? "\nTodas as verificações passaram." : `\n${falhas} verificação(ões) falharam.`);
    process.exitCode = falhas === 0 ? 0 : 1;
}

main().catch((erro) => {
    console.error(erro instanceof ErroApi ? `ERRO (${erro.status || "conexão"}): ${erro.message}` : erro);
    process.exitCode = 1;
});
