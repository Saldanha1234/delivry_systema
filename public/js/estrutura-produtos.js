// Estrutura global de adicionais para produtos do tipo "montar"
const ConfigEstrutura = {
    categorias: [
        {
            id: "coberturas",
            nome: "Coberturas",
            limite: 2,
            opcoes: ["Amora", "Caramelo", "Chocolate", "Leite condensado", "Maracujá", "Mel", "Menta", "Morango"]
        },
        {
            id: "frutas",
            nome: "Frutas",
            limite: 2,
            opcoes: ["Abacaxi", "Banana", "Kiwi", "Manga", "Morango", "Uva"]
        },
        {
            id: "complementos",
            nome: "Complementos",
            limite: 4,
            opcoes: ["Amendoim", "Aveia", "Castanha", "Chocoball", "Confete", "Granola", "Leite em pó", "Ovomaltine", "Paçoca"]
        }
    ],
    turbinar: [
        { nome: "Nutella", preco: 5.00 },
        { nome: "Bis (3 un)", preco: 3.00 },
        { nome: "KitKat", preco: 4.50 },
        { nome: "Bola de Sorvete", preco: 4.00 }
    ]
};