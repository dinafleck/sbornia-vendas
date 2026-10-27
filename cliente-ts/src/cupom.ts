import type { Produto, Usuario, Venda } from "./tipos.js";

const LARGURA = 48;

const moeda = (valor: number): string =>
    valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const linha = (caractere = "-"): string => caractere.repeat(LARGURA);

const centro = (texto: string): string => {
    const espacos = Math.max(0, Math.floor((LARGURA - texto.length) / 2));
    return " ".repeat(espacos) + texto;
};

const esquerdaDireita = (esquerda: string, direita: string): string => {
    const espacos = Math.max(1, LARGURA - esquerda.length - direita.length);
    return esquerda + " ".repeat(espacos) + direita;
};

const formatarData = (iso: string): string => {
    const data = new Date(iso);
    return Number.isNaN(data.getTime()) ? iso : data.toLocaleString("pt-BR");
};

export function imprimirCupom(venda: Venda): string {
    const saida: string[] = [];
    saida.push(linha("="));
    saida.push(centro("SUPERFÍCIE COMERCIAL DA SBØRNIA"));
    saida.push(centro("CUPOM DE VENDA"));
    saida.push(linha("="));
    saida.push(`Venda nº ${venda.id}   ${formatarData(venda.dataHora)}`);
    saida.push(`Cliente: ${venda.usuario.nome} (id ${venda.usuario.id})`);
    saida.push(`Idade: ${venda.usuario.idade}   Dependentes: ${venda.usuario.numeroDependentes}`);
    saida.push(linha());

    let somaBase = 0;
    let somaImposto = 0;
    for (const item of venda.itens) {
        const base = item.precoUnitario * item.quantidade;
        somaBase += base;
        somaImposto += item.valorImposto;
        const percentual = base > 0 ? (item.valorImposto / base) * 100 : 0;

        saida.push(`${item.produto.codigo}  ${item.produto.descricao}`);
        saida.push(`  [${item.produto.categoria}]`);
        saida.push(esquerdaDireita(`  ${item.quantidade} x ${moeda(item.precoUnitario)}`, moeda(base)));
        saida.push(esquerdaDireita(`  Imposto (${percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`, moeda(item.valorImposto)));
        saida.push(esquerdaDireita("  Total do item", moeda(item.valorTotal)));
    }

    saida.push(linha());
    saida.push(esquerdaDireita("Subtotal (sem impostos)", moeda(somaBase)));
    saida.push(esquerdaDireita("Impostos", moeda(somaImposto)));
    saida.push(esquerdaDireita("TOTAL A PAGAR", moeda(venda.valorTotal)));
    saida.push(linha("="));
    return saida.join("\n");
}

export function imprimirProdutos(produtos: Produto[]): string {
    if (produtos.length === 0) return "Nenhum produto cadastrado.";
    const saida = [linha(), "PRODUTOS CADASTRADOS", linha()];
    for (const p of produtos) {
        saida.push(`${p.codigo}  ${p.descricao}`);
        saida.push(`  ${p.categoria}  R$ ${moeda(p.precoUnitario)}  estoque: ${p.quantidadeEstoque}`);
    }
    saida.push(linha());
    return saida.join("\n");
}

export function imprimirUsuarios(usuarios: Usuario[]): string {
    if (usuarios.length === 0) return "Nenhum usuário cadastrado.";
    const saida = [linha(), "USUÁRIOS CADASTRADOS", linha()];
    for (const u of usuarios) {
        saida.push(`${u.id}  ${u.nome}  (${u.idade} anos, ${u.numeroDependentes} dependentes)`);
    }
    saida.push(linha());
    return saida.join("\n");
}
