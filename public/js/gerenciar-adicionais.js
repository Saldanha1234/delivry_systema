/**
 * SISTEMA DE GERENCIAMENTO DE ADICIONAIS
 * Localização: js/gerenciador-adicionais.js
 */

// Simulação de Banco de Dados (Integre com seu arquivo de DB real)
let categoriasAdicionais = [];
let produtosCadastrados = [
    { id: 1, nome: "Hambúrguer Artesanal" },
    { id: 2, nome: "Pizza Família" }
];

// --- ELEMENTOS DA INTERFACE ---
const containerGeral = document.createElement('div');
containerGeral.className = 'painel-adicionais-container';

// Estilização Básica (Pode mover para um arquivo .css)
const styles = `
    .painel-adicionais-container { font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f4f7f6; }
    .btn-principal { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .categoria-card { background: white; margin-top: 15px; border-radius: 8px; border-left: 5px solid #27ae60; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; cursor: pointer; }
    .categoria-acoes { position: relative; }
    .menu-dot { cursor: pointer; font-size: 20px; padding: 0 10px; }
    .dropdown-menu { position: absolute; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; display: none; z-index: 10; }
    .dropdown-menu.show { display: block; }
    .dropdown-item { padding: 10px 15px; cursor: pointer; transition: 0.3s; }
    .dropdown-item:hover { background: #f0f0f0; }
    .adicionais-lista { padding: 15px; background: #fafafa; border-top: 1px solid #eee; display: none; }
    .adicional-item { display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee; }
    .modal-full { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 999; display: none; padding: 40px; box-sizing: border-box; }
    .valor-riscado { text-decoration: line-through; color: red; font-size: 0.9em; }
    .valor-atual { color: green; font-weight: bold; }
`;

// Inserir estilos no Head
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- FUNÇÕES DE LÓGICA ---

function criarCategoria() {
    const nome = prompt("Digite o nome da Categoria Adicional:");
    if (!nome) return;

    const novaCategoria = {
        id: Date.now(),
        nome: nome,
        status: 'opcional', // obrigatório ou opcional
        produtosVinculados: [],
        adicionais: [],
        aberta: false
    };

    categoriasAdicionais.push(novaCategoria);
    renderizar();
}

function toggleCategoria(id) {
    const cat = categoriasAdicionais.find(c => c.id === id);
    if (cat) cat.aberta = !cat.aberta;
    renderizar();
}

function adicionarAdicional(catId) {
    const nome = prompt("Nome do Adicional:");
    if (!nome) return;
    
    const cat = categoriasAdicionais.find(c => c.id === catId);
    cat.adicionais.push({
        id: Date.now(),
        nome: nome,
        valor: 0,
        status: 'disponivel',
        desconto: 0
    });
    renderizar();
}

// --- RENDERIZAÇÃO ---

function renderizar() {
    containerGeral.innerHTML = `
        <button class="btn-principal" onclick="criarCategoria()">+ Criar Categoria Adicional</button>
        <div id="lista-categorias"></div>
    `;

    const lista = containerGeral.querySelector('#lista-categorias');

    categoriasAdicionais.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'categoria-card';
        div.innerHTML = `
            <div class="categoria-header">
                <div onclick="toggleCategoria(${cat.id})">
                    <span>${cat.aberta ? '▼' : '▲'}</span>
                    <strong>${cat.nome}</strong> 
                    <small>(${cat.status})</small>
                </div>
                <div class="categoria-acoes">
                    <span class="menu-dot" onclick="this.nextElementSibling.classList.toggle('show')">⋮</span>
                    <div class="dropdown-menu">
                        <div class="dropdown-item" onclick="abrirModalEditarCat(${cat.id})">Editar</div>
                        <div class="dropdown-item" onclick="duplicarCat(${cat.id})">Duplicar</div>
                        <div class="dropdown-item" style="color:red" onclick="excluirCat(${cat.id})">Excluir</div>
                    </div>
                </div>
            </div>
            <div class="adicionais-lista" style="display: ${cat.aberta ? 'block' : 'none'}">
                <button onclick="adicionarAdicional(${cat.id})">+ Criar Adicional</button>
                <div class="itens-adicionais-container">
                    ${cat.adicionais.map(ad => `
                        <div class="adicional-item">
                            <span>${ad.nome} - ${ad.status === 'indisponivel' ? '(Indisponível)' : 'R$ ' + (ad.valor - ad.desconto)}</span>
                            <span onclick="abrirModalEditarAdicional(${cat.id}, ${ad.id})" style="cursor:pointer">⋮</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        lista.appendChild(div);
    });

    document.body.appendChild(containerGeral);
}

// --- MODAIS (EXEMPLO DE ESTRUTURA) ---

window.abrirModalEditarAdicional = function(catId, adId) {
    const cat = categoriasAdicionais.find(c => c.id === catId);
    const ad = cat.adicionais.find(a => a.id === adId);

    // Criação do Modal Full Screen dinâmico
    const modal = document.createElement('div');
    modal.className = 'modal-full';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <h2>Editar Adicional: ${ad.nome}</h2>
        <label>Nome:</label> <input type="text" id="edit-ad-nome" value="${ad.nome}"><br><br>
        <label>Valor Bruto:</label> <input type="number" id="edit-ad-valor" value="${ad.valor}"><br><br>
        <label>Desconto:</label> <input type="number" id="edit-ad-desc" value="${ad.desconto}"><br><br>
        <label>Status:</label>
        <select id="edit-ad-status">
            <option value="disponivel" ${ad.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
            <option value="indisponivel" ${ad.status === 'indisponivel' ? 'selected' : ''}>Indisponível</option>
        </select>
        <br><br>
        <button class="btn-principal" onclick="salvarAdicional(${catId}, ${adId})">Salvar Alterações</button>
        <button onclick="this.parentElement.remove()">Fechar</button>
    `;
    document.body.appendChild(modal);
};

// Inicialização
renderizar();