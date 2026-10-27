import * as readline from "node:readline";
import { ErroApi, SborniaApi } from "./api.js";
import { imprimirCupom, imprimirProdutos, imprimirUsuarios } from "./cupom.js";
import { CATEGORIAS, type Categoria, type ItemVendaRequest } from "./tipos.js";

class Teclado {
    private readonly fila: string[] = [];
    private readonly esperando: ((linha: string | null) => void)[] = [];
    private fechado = false;

    constructor() {
        const rl = readline.createInterface({ input: process.stdin });
        rl.on("line", (linha) => {
            const quemEspera = this.esperando.shift();
            if (quemEspera) quemEspera(linha);
            else this.fila.push(linha);
        });
        rl.on("close", () => {
            this.fechado = true;
            this.esperando.splice(0).forEach((resolver) => resolver(null));
        });
    }

    async ler(prompt: string): Promise<string> {
        process.stdout.write(prompt);
        const linha =
            this.fila.length > 0
                ? this.fila.shift()!
                : this.fechado
                    ? null
                    : await new Promise<string | null>((resolver) => this.esperando.push(resolver));
        if (linha === null) {
            console.log("\nFim da entrada. Encerrando terminal.");
            process.exit(0);
        }
        if (!process.stdin.isTTY) console.log(linha); // ecoa a entrada redirecionada
        return linha.trim();
    }

    async lerInteiro(prompt: string, minimo = 0): Promise<number> {
        for (;;) {
            const valor = Number(await this.ler(prompt));
            if (Number.isInteger(valor) && valor >= minimo) return valor;
            console.log(`  Valor inválido. Informe um número inteiro >= ${minimo}.`);
        }
    }

    async lerDecimal(prompt: string): Promise<number> {
        for (;;) {
            const valor = Number((await this.ler(prompt)).replace(",", "."));
            if (Number.isFinite(valor) && valor > 0) return valor;
            console.log("  Valor inválido. Informe um número maior que zero (ex.: 12,50).");
        }
    }
}

const api = new SborniaApi();
const teclado = new Teclado();

async function registrarVenda(): Promise<void> {
    const usuarioId = await teclado.lerInteiro("Identificador do usuário: ", 1);
    const usuario = await api.buscarUsuario(usuarioId);
    console.log(`  Cliente: ${usuario.nome} (${usuario.idade} anos, ${usuario.numeroDependentes} dependentes)`);

    const itens: ItemVendaRequest[] = [];
    console.log("Leia o código de barras de cada produto. Deixe em branco para encerrar a compra.");
    for (;;) {
        const codigo = await teclado.ler("Código do produto: ");
        if (codigo === "") break;
        try {
            const produto = await api.buscarProduto(codigo);
            console.log(`  ${produto.descricao} - R$ ${produto.precoUnitario.toFixed(2)} (estoque: ${produto.quantidadeEstoque})`);
        } catch (erro) {
            if (erro instanceof ErroApi && erro.status === 404) {
                console.log("  Produto não encontrado. Leia o código novamente.");
                continue;
            }
            throw erro;
        }
        const quantidade = await teclado.lerInteiro("Quantidade: ", 1);
        itens.push({ produtoCodigo: codigo, quantidade });
    }

    if (itens.length === 0) {
        console.log("Compra cancelada: nenhum item informado.");
        return;
    }

    const venda = await api.registrarVenda({ usuarioId, itens });
    console.log("\n" + imprimirCupom(venda));
}

async function consultarVenda(): Promise<void> {
    const id = await teclado.lerInteiro("Número da venda: ", 1);
    console.log("\n" + imprimirCupom(await api.buscarVenda(id)));
}

async function cadastrarProduto(): Promise<void> {
    const codigo = await teclado.ler("Código: ");
    const descricao = await teclado.ler("Descrição: ");
    const quantidadeEstoque = await teclado.lerInteiro("Quantidade em estoque: ");
    const precoUnitario = await teclado.lerDecimal("Preço unitário: ");
    CATEGORIAS.forEach((c, i) => console.log(`  ${i + 1} - ${c}`));
    const indice = await teclado.lerInteiro("Categoria: ", 1);
    const categoria: Categoria = CATEGORIAS[Math.min(indice, CATEGORIAS.length) - 1];

    const produto = await api.cadastrarProduto({ codigo, descricao, quantidadeEstoque, precoUnitario, categoria });
    console.log(`Produto ${produto.codigo} cadastrado.`);
}

async function cadastrarUsuario(): Promise<void> {
    const nome = await teclado.ler("Nome: ");
    const dataNascimento = await teclado.ler("Data de nascimento (AAAA-MM-DD): ");
    const numeroDependentes = await teclado.lerInteiro("Número de dependentes: ");
    const usuario = await api.cadastrarUsuario({ nome, dataNascimento, numeroDependentes });
    console.log(`Usuário cadastrado com identificador ${usuario.id}.`);
}

const MENU = `
========== TERMINAL DE VENDAS - SBØRNIA ==========
1 - Registrar venda
2 - Consultar venda
3 - Listar produtos
4 - Cadastrar produto
5 - Listar usuários
6 - Cadastrar usuário
0 - Sair
==================================================`;

async function main(): Promise<void> {
    for (;;) {
        console.log(MENU);
        const opcao = await teclado.ler("Opção: ");
        try {
            switch (opcao) {
                case "1": await registrarVenda(); break;
                case "2": await consultarVenda(); break;
                case "3": console.log(imprimirProdutos(await api.listarProdutos())); break;
                case "4": await cadastrarProduto(); break;
                case "5": console.log(imprimirUsuarios(await api.listarUsuarios())); break;
                case "6": await cadastrarUsuario(); break;
                case "0": console.log("Terminal encerrado."); process.exit(0);
                default: console.log("Opção inválida.");
            }
        } catch (erro) {
            if (erro instanceof ErroApi) console.log(`*** ERRO (${erro.status || "conexão"}): ${erro.message}`);
            else throw erro;
        }
    }
}

main();
