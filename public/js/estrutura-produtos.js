/**
 * CONFIGURAÇÃO GLOBAL DE MONTAGEM
 * Este arquivo define as regras de como os produtos do tipo "montar" (como Açaí) 
 * devem se comportar no sistema.
 */

const ConfigEstrutura = {
    // Categorias de itens que geralmente não alteram o preço (inclusos no valor base)
    categorias: [
        {
            id: "coberturas",
            nome: "Coberturas",
            descricao: "Escolha até 2 opções",
            limite: 2,
            opcoes: [
                "Amora", "Caramelo", "Chocolate", "Leite condensado", 
                "Maracujá", "Mel", "Menta", "Morango"
            ]
        },
        {
            id: "frutas",
            nome: "Frutas",
            descricao: "Escolha até 2 opções",
            limite: 2,
            opcoes: [
                "Abacaxi", "Banana", "Kiwi", "Manga", "Morango", "Uva"
            ]
        },
        {
            id: "complementos",
            nome: "Complementos",
            descricao: "Escolha até 4 opções",
            limite: 4,
            opcoes: [
                "Amendoim", "Aveia", "Castanha", "Chocoball", 
                "Confete", "Granola", "Leite em pó", "Ovomaltine", "Paçoca"
            ]
        }
    ],

    // Itens Adicionais que SOMAM ao valor total do produto
    turbinar: [
        { id: "t1", nome: "Nutella", preco: 5.00 },
        { id: "t2", nome: "Bis (3 un)", preco: 3.00 },
        { id: "t3", nome: "KitKat", preco: 4.50 },
        { id: "t4", nome: "Bola de Sorvete", preco: 4.00 },
        { id: "t5", nome: "Creme de Ninho", preco: 3.50 },
        { id: "t6", nome: "Creme de Morango", preco: 3.50 }
    ],

    // Configurações de interface (opcional para o sistema de cores do front)
    configuracoes: {
        corDestaque: "#FF385C",
        permitirExcederLimite: false, // Se true, poderia cobrar por item extra
        exibirPrecoTurbinar: true
    }
};

/**
 * LÓGICA AUXILIAR (Opcional)
 * Útil para calcular o preço no front-end de forma rápida
 */
function obterPrecoAdicional(nomeItem) {
    const item = ConfigEstrutura.turbinar.find(i => i.nome === nomeItem);
    return item ? item.preco : 0;
}

// Exportação para Node.js (se for usar no server.js)
if (typeof module !== 'undefined') {
    module.exports = { ConfigEstrutura, obterPrecoAdicional };
}