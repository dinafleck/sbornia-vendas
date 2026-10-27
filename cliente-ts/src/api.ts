import type { NovoUsuario, Produto, Usuario, Venda, VendaRequest } from "./tipos.js";

export class ErroApi extends Error {
    constructor(
        public readonly status: number,
        mensagem: string,
    ) {
        super(mensagem);
        this.name = "ErroApi";
    }
}

export class SborniaApi {
    constructor(private readonly baseUrl: string = process.env.SBORNIA_API_URL ?? "http://localhost:8081") {}


    listarUsuarios(): Promise<Usuario[]> {
        return this.requisitar<Usuario[]>("GET", "/usuarios");
    }

    buscarUsuario(id: number): Promise<Usuario> {
        return this.requisitar<Usuario>("GET", `/usuarios/${id}`);
    }

    cadastrarUsuario(usuario: NovoUsuario): Promise<Usuario> {
        return this.requisitar<Usuario>("POST", "/usuarios", usuario);
    }


    listarProdutos(): Promise<Produto[]> {
        return this.requisitar<Produto[]>("GET", "/produtos");
    }

    buscarProduto(codigo: string): Promise<Produto> {
        return this.requisitar<Produto>("GET", `/produtos/${encodeURIComponent(codigo)}`);
    }

    cadastrarProduto(produto: Produto): Promise<Produto> {
        return this.requisitar<Produto>("POST", "/produtos", produto);
    }


    registrarVenda(venda: VendaRequest): Promise<Venda> {
        return this.requisitar<Venda>("POST", "/vendas", venda);
    }

    buscarVenda(id: number): Promise<Venda> {
        return this.requisitar<Venda>("GET", `/vendas/${id}`);
    }

    private async requisitar<T>(metodo: "GET" | "POST", caminho: string, corpo?: unknown): Promise<T> {
        let resposta: Response;
        try {
            resposta = await fetch(this.baseUrl + caminho, {
                method: metodo,
                headers: corpo !== undefined ? { "Content-Type": "application/json" } : undefined,
                body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
            });
        } catch {
            throw new ErroApi(0, `Não foi possível conectar ao servidor em ${this.baseUrl}. O backend Java está rodando?`);
        }

        if (!resposta.ok) {
            throw new ErroApi(resposta.status, await this.extrairMensagemErro(resposta));
        }
        return (await resposta.json()) as T;
    }

    private async extrairMensagemErro(resposta: Response): Promise<string> {
        try {
            const corpo = (await resposta.json()) as { message?: string; error?: string; detail?: string };
            return corpo.message || corpo.detail || corpo.error || `HTTP ${resposta.status}`;
        } catch {
            return `HTTP ${resposta.status}`;
        }
    }
}
