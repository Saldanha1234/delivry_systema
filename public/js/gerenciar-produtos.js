/**
 * SISTEMA DE GERENCIAMENTO DE CARDÁPIO - ARQUITETURA DINÂMICA
 * Integração de Lógica CRUD existente com Novo Layout de Modais e Categorias
 */

let imagemBase64 = ""; 
let categoriasGlobais = [];
let produtosGlobais = [];

// --- INICIALIZAÇÃO E MONTAGEM DO PALCO NO ADMIN.EJS ---
document.addEventListener('DOMContentLoaded', () => {
    renderizarEstruturaBase();
    carregarDadosIniciais();
});

function renderizarEstruturaBase() {
    const container = document.getElementById('container-gerenciar');
    if (!container) return;

    container.innerHTML = `
        <div class="header-gerenciar">
            <div class="controles-topo">
                <button id="btn-menu-categorias" class="btn-categoria-main" onclick="toggleMenuLateral()">
                    <i class="fas fa-bars"></i> Categorias
                </button>
                <div class="busca-container">
                    <button class="btn-search-icon" onclick="toggleBusca()"><i class="fas fa-search"></i></button>
                    <input type="text" id="input-busca" placeholder="Buscar produto..." oninput="filtrarProdutos(this.value)" class="hidden">
                </div>
            </div>
            
            <div id="menu-lateral-categorias" class="menu-suspenso hidden">
                <button onclick="salvarCategoria()"><i class="fas fa-plus"></i> Adicionar Categoria</button>
                <button onclick="toggleTodasCategorias(false)"><i class="fas fa-chevron-up"></i> Fechar todas</button>
                <button onclick="toggleTodasCategorias(true)"><i class="fas fa-chevron-down"></i> Abrir todas</button>
                <hr>
                <div class="stats-menu">
                    <span id="qtd-cats">0</span> Categorias / <span id="qtd-prods">0</span> Produtos
                </div>
            </div>
        </div>

        <div id="lista-categorias-main" class="corpo-categorias"></div>

        <div id="modal-produto" class="modal-fullscreen hidden">
            <div class="modal-header">
                <button onclick="fecharModalProduto()"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h2 id="titulo-modal-produto">Novo Produto</h2>
                <button class="btn-salvar-topo" onclick="enviarProduto()">SALVAR</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="p-id">
                <div class="grid-edicao">
                    <div class="col-esquerda">
                        <label>Nome do Produto</label>
                        <input type="text" id="p-nome" placeholder="Ex: Pizza Calabresa">
                        
                        <label>Descrição</label>
                        <textarea id="p-desc" placeholder="Detalhes do produto..."></textarea>
                        
                        <div class="row-preco">
                            <div>
                                <label>Preço (R$)</label>
                                <input type="number" id="p-preco" step="0.01">
                            </div>
                            <div>
                                <label>Status</label>
                                <select id="p-status">
                                    <option value="disponivel">Disponível</option>
                                    <option value="fora-estoque">Fora de Estoque</option>
                                </select>
                            </div>
                        </div>

                        <button class="btn-add-desconto" onclick="toggleCampoDesconto()">
                            <i class="fas fa-tag"></i> + Desconto
                        </button>
                        <div id="area-desconto" class="hidden">
                            <label>Valor com Desconto (R$)</label>
                            <input type="number" id="p-desconto" step="0.01" placeholder="Ex: 25.00">
                        </div>

                        <hr>
                        <button class="btn-abrir-modificadores" onclick="abrirModalModificadores()">
                            <i class="fas fa-plus-circle"></i> Adicionar modificador
                        </button>
                    </div>

                    <div class="col-direita">
                        <div class="upload-foto" onclick="document.getElementById('p-file').click()">
                            <img id="p-preview" src="img/placeholder.png">
                            <input type="file" id="p-file" hidden onchange="converterImagem()">
                            <input type="hidden" id="p-img-data">
                            <span>Alterar Foto</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="modal-modificadores" class="modal-fullscreen hidden" style="z-index: 1001;">
            <div class="modal-header">
                <button onclick="fecharModalModificadores()"><i class="fas fa-times"></i> Fechar</button>
                <h2>Modificadores</h2>
                <button class="btn-salvar-topo" onclick="salvarNovoModificador()">CRIAR CATEGORIA</button>
            </div>
            <div id="lista-modificadores-categorias" class="modal-body">
                </div>
        </div>
    `;
}

// --- LÓGICA DE DADOS (DATABASE FETCH) ---

async function carregarDadosIniciais() {
    try {
        const [resCat, resProd] = await Promise.all([
            fetch('/get-categorias'),
            fetch('/get-produtos') // Ajuste se a rota for diferente
        ]);
        
        categoriasGlobais = await resCat.json();
        produtosGlobais = await resProd.json();
        
        renderizarListaCategorias();
        atualizarContadores();
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    }
}

function renderizarListaCategorias() {
    const lista = document.getElementById('lista-categorias-main');
    lista.innerHTML = categoriasGlobais.map(cat => `
        <div class="card-categoria" id="cat-${cat._id}">
            <div class="header-cat">
                <div class="nome-cat-edit">
                    <input type="text" value="${cat.nome}" onchange="editarNomeCategoria('${cat._id}', this.value)">
                    <span class="badge-qtd">${contarProdutos(cat.nome)}</span>
                </div>
                <div class="acoes-cat">
                    <button onclick="menuAcoesCat('${cat._id}')"><i class="fas fa-ellipsis-v"></i></button>
                    <button onclick="toggleCollapse('${cat._id}')"><i class="fas fa-chevron-down" id="seta-${cat._id}"></i></button>
                </div>
            </div>
            <div id="conteudo-cat-${cat._id}" class="lista-produtos hidden">
                <button class="btn-add-produto-item" onclick="abrirNovoProduto('${cat.nome}')">
                    <i class="fas fa-plus"></i> Produto
                </button>
                ${renderizarProdutosDaCategoria(cat.nome)}
            </div>
        </div>
    `).join('');
}

function renderizarProdutosDaCategoria(catNome) {
    const filtrados = produtosGlobais.filter(p => p.categoria === catNome);
    return filtrados.map(p => `
        <div class="item-produto-linha">
            <div class="info-principal" onclick="prepararEdicaoProduto('${p._id}')">
                <img src="${p.img || 'img/placeholder.png'}">
                <div class="txts">
                    <span class="nome">${p.nome}</span>
                    <span class="preco">R$ ${p.preco}</span>
                </div>
            </div>
            <button class="btn-opcoes-prod"><i class="fas fa-ellipsis-v"></i></button>
        </div>
    `).join('');
}

// --- FUNÇÕES DE PRODUTO (CRUD) ---

function abrirNovoProduto(categoriaPai) {
    limparFormProduto();
    document.getElementById('p-id').value = "";
    document.getElementById('titulo-modal-produto').innerText = "Novo Produto em " + categoriaPai;
    // Define a categoria automaticamente ao criar
    const selectCat = document.createElement('input'); 
    selectCat.type = "hidden"; selectCat.id = "p-cat"; selectCat.value = categoriaPai;
    document.getElementById('modal-produto').appendChild(selectCat);
    
    document.getElementById('modal-produto').classList.remove('hidden');
}

async function enviarProduto() {
    const id = document.getElementById('p-id').value;
    const dados = {
        nome: document.getElementById('p-nome').value,
        preco: document.getElementById('p-preco').value,
        categoria: document.getElementById('p-cat').value,
        desc: document.getElementById('p-desc').value,
        img: imagemBase64 || document.getElementById('p-img-data').value,
        desconto: document.getElementById('p-desconto').value,
        disponivel: document.getElementById('p-status').value === 'disponivel'
    };

    const url = id ? `/edit-produto/${id}` : '/add-produto';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });

    if(res.ok) location.reload();
}

async function prepararEdicaoProduto(id) {
    const p = produtosGlobais.find(item => item._id === id);
    if(!p) return;

    document.getElementById('p-id').value = p._id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-desc').value = p.desc || "";
    document.getElementById('p-preview').src = p.img || "img/placeholder.png";
    document.getElementById('p-img-data').value = p.img;
    
    // Lógica de Desconto
    if(p.desconto) {
        document.getElementById('area-desconto').classList.remove('hidden');
        document.getElementById('p-desconto').value = p.desconto;
    }

    document.getElementById('modal-produto').classList.remove('hidden');
}

// --- SISTEMA DE MODIFICADORES (LÓGICA PEDIDA) ---

function abrirModalModificadores() {
    document.getElementById('modal-modificadores').classList.remove('hidden');
}

function salvarNovoModificador() {
    const container = document.getElementById('lista-modificadores-categorias');
    const idUnico = Date.now();
    
    const htmlCatMod = `
        <div class="card-modificador" id="mod-cat-${idUnico}">
            <div class="header-mod-flex">
                <button onclick="toggleCollapseMod('${idUnico}')"><i class="fas fa-chevron-down"></i></button>
                <input type="text" placeholder="Nome da Categoria (Ex: Escolha o Molho)">
                <div class="acoes">
                    <button><i class="fas fa-ellipsis-v"></i></button>
                </div>
            </div>
            
            <div id="body-mod-${idUnico}" class="body-mod hidden">
                <div class="config-mod-row">
                    <button class="btn-associar" onclick="abrirModalAssociar('${idUnico}')">Associar/Desassociar</button>
                    <select id="condicao-${idUnico}">
                        <option value="obrigatorio">Obrigatório</option>
                        <option value="opcional">Opcional</option>
                    </select>
                </div>

                <div class="selecao-qtd">
                    <label>Nessa categoria pode selecionar:</label>
                    <select onchange="toggleMinMax('${idUnico}', this.value)">
                        <option value="apenas-um">Apenas um Adicional</option>
                        <option value="varios">Vários</option>
                    </select>
                    <div id="min-max-${idUnico}" class="hidden">
                        Min: <input type="number" class="small-input" value="1">
                        Max: <input type="number" class="small-input" value="1">
                    </div>
                </div>

                <hr>
                <div id="itens-adicionais-${idUnico}">
                    </div>
                <button class="btn-novo-item-mod" onclick="addLinhaAdicional('${idUnico}')">+ Adicionar Modificador</button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', htmlCatMod);
}

// --- AUXILIARES DE UI ---

function converterImagem() {
    const file = document.getElementById('p-file').files[0];
    const reader = new FileReader();
    reader.onloadend = () => { 
        imagemBase64 = reader.result; 
        document.getElementById('p-preview').src = reader.result; 
    }
    if (file) reader.readAsDataURL(file);
}

function toggleCollapse(id) {
    const content = document.getElementById(`conteudo-cat-${id}`);
    const seta = document.getElementById(`seta-${id}`);
    content.classList.toggle('hidden');
    seta.classList.toggle('fa-chevron-up');
}

function toggleMenuLateral() {
    document.getElementById('menu-lateral-categorias').classList.toggle('hidden');
}

function fecharModalProduto() {
    document.getElementById('modal-produto').classList.add('hidden');
}

function fecharModalModificadores() {
    document.getElementById('modal-modificadores').classList.add('hidden');
}

function toggleCampoDesconto() {
    document.getElementById('area-desconto').classList.toggle('hidden');
}

function atualizarContadores() {
    document.getElementById('qtd-cats').innerText = categoriasGlobais.length;
    document.getElementById('qtd-prods').innerText = produtosGlobais.length;
}

function contarProdutos(catNome) {
    return produtosGlobais.filter(p => p.categoria === catNome).length;
}

function limparFormProduto() {
    document.getElementById('p-nome').value = "";
    document.getElementById('p-preco').value = "";
    document.getElementById('p-desc').value = "";
    document.getElementById('p-preview').src = "img/placeholder.png";
    imagemBase64 = "";
}