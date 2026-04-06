/**
 * CONFIGURAÇÃO GLOBAL DE MONTAGEM - VERSÃO PRO
 * Esta estrutura permite controle individual de quantidade e busca dinâmica.
 */

const ConfigEstrutura = {
    // Categorias de itens (Geralmente com limite de escolhas)
    categorias: [
        {
            id: "coberturas",
            nome: "Coberturas",
            descricao: "Escolha até 2 opções inclusas",
            limite: 2,
            obrigatorio: false,
            opcoes: [
                { id: "cob_1", nome: "Amora", preco: 0, qtd: 0 },
                { id: "cob_2", nome: "Caramelo", preco: 0, qtd: 0 },
                { id: "cob_3", nome: "Chocolate", preco: 0, qtd: 0 },
                { id: "cob_4", nome: "Leite condensado", preco: 0, qtd: 0 },
                { id: "cob_5", nome: "Maracujá", preco: 0, qtd: 0 },
                { id: "cob_6", nome: "Mel", preco: 0, qtd: 0 },
                { id: "cob_7", nome: "Menta", preco: 0, qtd: 0 },
                { id: "cob_8", nome: "Morango", preco: 0, qtd: 0 }
            ]
        },
        {
            id: "frutas",
            nome: "Frutas",
            descricao: "Escolha até 2 opções",
            limite: 2,
            obrigatorio: false,
            opcoes: [
                { id: "fru_1", nome: "Abacaxi", preco: 0, qtd: 0 },
                { id: "fru_2", nome: "Banana", preco: 0, qtd: 0 },
                { id: "fru_3", nome: "Kiwi", preco: 0, qtd: 0 },
                { id: "fru_4", nome: "Manga", preco: 0, qtd: 0 },
                { id: "fru_5", nome: "Morango", preco: 0, qtd: 0 },
                { id: "fru_6", nome: "Uva", preco: 0, qtd: 0 }
            ]
        },
        {
            id: "complementos",
            nome: "Complementos",
            descricao: "Escolha até 4 opções",
            limite: 4,
            obrigatorio: false,
            opcoes: [
                { id: "comp_1", nome: "Amendoim", preco: 0, qtd: 0 },
                { id: "comp_2", nome: "Aveia", preco: 0, qtd: 0 },
                { id: "comp_3", nome: "Castanha", preco: 0, qtd: 0 },
                { id: "comp_4", nome: "Chocoball", preco: 0, qtd: 0 },
                { id: "comp_5", nome: "Confete", preco: 0, qtd: 0 },
                { id: "comp_6", nome: "Granola", preco: 0, qtd: 0 },
                { id: "comp_7", nome: "Leite em pó", preco: 0, qtd: 0 },
                { id: "comp_8", nome: "Ovomaltine", preco: 0, qtd: 0 },
                { id: "comp_9", nome: "Paçoca", preco: 0, qtd: 0 }
            ]
        },
        {
            id: "turbinar",
            nome: "Turbinar seu Açaí",
            descricao: "Adicionais pagos (Sem limite)",
            limite: 99,
            obrigatorio: false,
            opcoes: [
                { id: "t1", nome: "Nutella", preco: 5.00, qtd: 0 },
                { id: "t2", nome: "Bis (3 un)", preco: 3.00, qtd: 0 },
                { id: "t3", nome: "KitKat", preco: 4.50, qtd: 0 },
                { id: "t4", nome: "Bola de Sorvete", preco: 4.00, qtd: 0 },
                { id: "t5", nome: "Creme de Ninho", preco: 3.50, qtd: 0 },
                { id: "t6", nome: "Creme de Morango", preco: 3.50, qtd: 0 }
            ]
        }
    ],

    configuracoes: {
        corDestaque: "#FF385C",
        textoBotaoAdicionar: "Adicionar ao Carrinho",
        placeholderBusca: "Pesquisar adicional..."
    }
};

/**
 * FUNÇÕES DE UTILIDADE - MANTIDAS INTEGRALMENTE
 */

function adicionarQtd(categoriaId, opcaoId) {
    const categoria = ConfigEstrutura.categorias.find(c => c.id === categoriaId);
    if (!categoria) return false;

    const totalAtualNaCategoria = categoria.opcoes.reduce((acc, curr) => acc + curr.qtd, 0);
    const opcao = categoria.opcoes.find(o => o.id === opcaoId);

    if (opcao && totalAtualNaCategoria < categoria.limite) {
        opcao.qtd++;
        return true;
    }
    return false;
}

function removerQtd(categoriaId, opcaoId) {
    const categoria = ConfigEstrutura.categorias.find(c => c.id === categoriaId);
    if (!categoria) return false;

    const opcao = categoria.opcoes.find(o => o.id === opcaoId);
    if (opcao && opcao.qtd > 0) {
        opcao.qtd--;
        return true;
    }
    return false;
}

function resetarMontagem() {
    ConfigEstrutura.categorias.forEach(cat => {
        cat.opcoes.forEach(opt => opt.qtd = 0);
    });
}

function obterItensSelecionados() {
    let selecionados = [];
    ConfigEstrutura.categorias.forEach(cat => {
        const itensFiltrados = cat.opcoes.filter(opt => opt.qtd > 0);
        if (itensFiltrados.length > 0) {
            selecionados.push({
                categoriaId: cat.id,
                categoriaNome: cat.nome,
                itens: itensFiltrados.map(i => ({ 
                    id: i.id, 
                    nome: i.nome, 
                    qtd: i.qtd, 
                    preco: i.preco 
                }))
            });
        }
    });
    return selecionados;
}

// Exportação universal corrigida
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ConfigEstrutura, 
        adicionarQtd, 
        removerQtd, 
        resetarMontagem, 
        obterItensSelecionados 
    };
} else {
    window.ConfigEstrutura = ConfigEstrutura;
    window.adicionarQtd = adicionarQtd;
    window.removerQtd = removerQtd;
    window.resetarMontagem = resetarMontagem;
    window.obterItensSelecionados = obterItensSelecionados;
}