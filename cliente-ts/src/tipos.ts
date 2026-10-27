export type Categoria = "ALIMENTICIO" | "AUTOMOTIVO" | "BEBIDA_ALCOOLICA" | "OUTROS";

export const CATEGORIAS: Categoria[] = ["ALIMENTICIO", "AUTOMOTIVO", "BEBIDA_ALCOOLICA", "OUTROS"];

export interface Produto {
    codigo: string;
    descricao: string;
    quantidadeEstoque: number;
    precoUnitario: number;
    categoria: Categoria;
}

export interface NovoUsuario {
    nome: string;
    /** Formato ISO: AAAA-MM-DD */
    dataNascimento: string;
    numeroDependentes: number;
}

export interface Usuario extends NovoUsuario {
    id: number;
    idade: number;
}

export interface ItemVendaRequest {
    produtoCodigo: string;
    quantidade: number;
}

export interface VendaRequest {
    usuarioId: number;
    itens: ItemVendaRequest[];
}

export interface ItemVenda {
    id: number;
    produto: Produto;
    quantidade: number;
    precoUnitario: number;
    valorImposto: number;
    valorTotal: number;
}

export interface Venda {
    id: number;
    usuario: Usuario;
    itens: ItemVenda[];
    dataHora: string;
    valorTotal: number;
}
