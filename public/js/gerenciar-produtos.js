/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS - VERSÃO DINÂMICA COM ADICIONAIS
 */

let imagemBase64 = ""; 
let listaProdutosLocal = [];
let listaCategoriasProdutos = [];
let listaCategoriasAdicionais = [];

// --- 0. CSS ATUALIZADO (Incluindo Adicionais e Modais Dinâmicos) ---
const styles = `
    .painel-unico-admin { font-family: sans-serif; max-width: 800px; margin: 20px auto; background: #f4f4f4; padding: 15px; border-radius: 8px; }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px; background: #fff; border-radius: 5px; }
    .btn-add-principal { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .btn-add-adicional-cat { background: #6f42c1; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    
    .item-categoria-container { background: white; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; overflow: hidden; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; border-bottom: 1px solid #eee; }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; }
    .cat-nome { font-weight: bold; font-size: 1.1em; }
    
    .conteudo-lista { padding: 10px 15px; background: #fafafa; border-top: 1px solid #eee; }
    .btn-acao-interna { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px dashed #ccc; background: #fff; cursor: pointer; border-radius: 4px; font-weight: bold; }
    
    /* Linha de Produto/Adicional */
    .item-linha { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 4px; }
    .item-info-wrapper { display: flex; align-items: center; flex-grow: 1; }
    .prod-img-min { width: 45px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; background: #eee; }
    .item-txt-container { display: flex; flex-direction: column; }
    .item-nome-txt { font-weight: bold; }
    .item-preco-txt { font-size: 0.9em; color: #28a745; font-weight: bold; }
    .item-status-tag { font-size: 0.7em; padding: 2px 5px; border-radius: 3px; margin-top: 3px; width: fit-content; }
    .tag-indisponivel { background: #ff4d4d; color: white; }

    /* Dropdown */
    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { display: none; position: absolute; right: 0; top: 100%; background: white; min-width: 150px; box-shadow: 0 8px 16px rgba(0,0,0,0.3); z-index: 999; border-radius: 4px; border: 1px solid #ddd; }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: black; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #eee; cursor: pointer; }
    .dropdown-content a:hover { background: #f1f1f1; }

    /* Modais Fullscreen */
    .modal-fullscreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 10000; overflow-y: auto; display: none; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white; z-index: 10; }
    .modal-body { padding: 20px; max-width: 600px; margin: 0 auto; }
    
    /* Vínculo de Produtos no Modal */
    .tree-categoria { margin-top: 15px; border: 1px solid #eee; border-radius: 5px; padding: 10px; }
    .tree-produto { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #f9f9f9; }
    .btn-vinculo { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; background: #fff; cursor: pointer; font-weight: bold; }
    .btn-vinculo.adicionado { background: #28a745; color: white; border-color: #28a745; }
    .txt-adicionado { color: #28a745; font-size: 0.8em; font-weight: bold; margin-left: 10px; }

    /* Estilos de Switch e Inputs */
    .input-group { margin-bottom: 15px; }
    .input-group label { display: block; margin-bottom: 5px; font-weight: bold; }
    .input-group input, .input-group select, .input-group textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
    .switch { position: relative; display: inline-block; width: 50px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #28a745; }
    input:checked + .slider:before { transform: translateX(26px); }
    .flex-row { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid #eee; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 1. RENDERIZAÇÃO E CARREGAMENTO ---

function renderizarPainelCategorias(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="painel-unico-admin" onclick="fecharTodosDropdowns(event)">
            <div class="header-painel">
                <h3>Categorias de Produtos</h3>
                <button class="btn-add-principal" onclick="criarNovaCategoriaProd()">+ Categoria Produtos</button>
            </div>
            <div id="lista-categorias-produtos"></div>

            <hr style="margin: 40px 0; border: 1px solid #ddd;">

            <div class="header-painel">
                <h3>Categorias de Adicionais</h3>
                <button class="btn-add-adicional-cat" onclick="criarNovaCategoriaAdicional()">+ Categoria Adicionais</button>
            </div>
            <div id="lista-categorias-adicionais"></div>
        </div>

        <div id="modal-produto" class="modal-fullscreen">
            <div class="modal-header">
                <button onclick="fecharModal('modal-produto')">← Voltar</button>
                <span id="titulo-modal-produto" style="font-weight:bold;">Produto</span>
                <button onclick="salvarProduto()" style="background:#007bff; color:white; border:none; padding:8px 20px; border-radius:5px; cursor:pointer;">SALVAR</button>
            </div>
            <div class="modal-body" id="body-modal-produto">
                </div>
        </div>

        <div id="modal-cat-adicional" class="modal-fullscreen">
            <div class="modal-header">
                <button onclick="fecharModal('modal-cat-adicional')">← Voltar</button>
                <span style="font-weight:bold;">Configurar Categoria de Adicional</span>
                <button onclick="salvarCatAdicional()" style="background:#6f42c1; color:white; border:none; padding:8px 20px; border-radius:5px; cursor:pointer;">SALVAR</button>
            </div>
            <div class="modal-body" id="body-modal-cat-adicional">
                </div>
        </div>

        <div id="modal-item-adicional" class="modal-fullscreen">
            <div class="modal-header">
                <button onclick="fecharModal('modal-item-adicional')">← Voltar</button>
                <span style="font-weight:bold;">Adicional</span>
                <button onclick="salvarItemAdicional()" style="background:#28a745; color:white; border:none; padding:8px 20px; border-radius:5px; cursor:pointer;">SALVAR</button>
            </div>
            <div class="modal-body" id="body-modal-item-adicional">
                </div>
        </div>
    `;
    carregarTudo();
}

async function carregarTudo() {
    try {
        const [resCatP, resProd, resCatA] = await Promise.all([
            fetch('/get-categorias'),
            fetch('/get-produtos'),
            fetch('/get-categorias-adicionais')
        ]);

        listaCategoriasProdutos = await resCatP.json();
        listaProdutosLocal = await resProd.json();
        listaCategoriasAdicionais = await resCatA.json();

        renderizarListaProdutos();
        renderizarListaAdicionais();
    } catch (err) { console.error("Erro ao carregar dados:", err); }
}

// --- 2. GESTÃO DE PRODUTOS ---

function renderizarListaProdutos() {
    const container = document.getElementById('lista-categorias-produtos');
    if(!container) return;
    container.innerHTML = "";

    listaCategoriasProdutos.forEach(cat => {
        if(cat.nome === "Todos" || cat.nome === "Defina um nome") return;
        
        const prodsDaCat = listaProdutosLocal.filter(p => p.categoria === cat.nome);
        const div = document.createElement('div');
        div.className = "item-categoria-container";
        div.innerHTML = `
            <div class="categoria-header">
                <div class="cat-info" onclick="toggleConteudo('prod-cat-${cat._id}')">
                    <span class="seta" id="seta-prod-cat-${cat._id}">▲</span>
                    <span class="cat-nome">${cat.nome}</span>
                </div>
                <div class="dropdown">
                    <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer;">⋮</button>
                    <div class="dropdown-content">
                        <a onclick="excluirCategoriaProd('${cat._id}')">Excluir</a>
                        <a onclick="duplicarCategoriaProd('${cat._id}')">Duplicar</a>
                    </div>
                </div>
            </div>
            <div class="conteudo-lista" id="prod-cat-${cat._id}" style="display:none;">
                <button class="btn-acao-interna" onclick="abrirModalProduto(null, '${cat.nome}')">+ Criar Produto em ${cat.nome}</button>
                <div id="itens-de-${cat._id}">
                    ${prodsDaCat.map(p => `
                        <div class="item-linha">
                            <div class="item-info-wrapper" onclick="abrirModalProduto('${p._id}')">
                                <img src="${p.img || ''}" class="prod-img-min" onerror="this.style.display='none'">
                                <div class="item-txt-container">
                                    <span class="item-nome-txt">${p.nome}</span>
                                    <span class="item-preco-txt">R$ ${parseFloat(p.preco).toFixed(2)}</span>
                                </div>
                            </div>
                            <div class="dropdown">
                                <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer;">⋮</button>
                                <div class="dropdown-content">
                                    <a onclick="excluirProduto('${p._id}')">Excluir</a>
                                    <a onclick="duplicarProduto('${p._id}')">Duplicar</a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirModalProduto(id = null, catNome = "") {
    const p = id ? listaProdutosLocal.find(x => x._id === id) : { nome: "", preco: "", desc: "", categoria: catNome, status: "disponivel", adicionaisAtivos: false, categoriasVinculadas: [] };
    
    document.getElementById('titulo-modal-produto').innerText = id ? "Editar Produto" : "Novo Produto";
    const body = document.getElementById('body-modal-produto');
    
    body.innerHTML = `
        <input type="hidden" id="p-id" value="${id || ''}">
        <div class="upload-area" style="text-align:center; border:2px dashed #ddd; padding:20px; border-radius:10px; margin-bottom:15px;">
            <img id="p-preview" src="${p.img || ''}" style="width:120px; height:120px; object-fit:cover; display:${p.img ? 'block' : 'none'}; margin:0 auto 10px auto; border-radius:10px;">
            <input type="file" id="p-file" accept="image/*" onchange="converterImagemProduto()" style="display:none;">
            <label for="p-file" style="cursor:pointer; color:#007bff; font-weight:bold;">📷 Selecionar Foto</label>
        </div>
        <div class="input-group">
            <label>Nome do Produto</label>
            <input type="text" id="p-nome" value="${p.nome}">
        </div>
        <div class="input-group">
            <label>Preço Base (R$)</label>
            <input type="number" id="p-preco" step="0.01" value="${p.preco}">
        </div>
        <div class="flex-row">
            <span>Usar sistema de Adicionais?</span>
            <label class="switch">
                <input type="checkbox" id="p-adicionais-toggle" ${p.adicionaisAtivos ? 'checked' : ''} onchange="toggleVisAdicionaisProd()">
                <span class="slider"></span>
            </label>
        </div>
        <div id="sessao-vinculo-adicionais" style="display:${p.adicionaisAtivos ? 'block' : 'none'}; margin-top:15px;">
            <small>Escolha as categorias de adicionais para este produto:</small>
            ${listaCategoriasAdicionais.map(ca => `
                <div class="item-linha">
                    <span>${ca.nome}</span>
                    <div class="dropdown">
                        <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer;">⋮</button>
                        <div class="dropdown-content">
                            <a onclick="vincularCatAoProduto('${p._id}', '${ca._id}', true)">Adicionar</a>
                            <a onclick="vincularCatAoProduto('${p._id}', '${ca._id}', false)">Excluir</a>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('modal-produto').style.display = "block";
}

// --- 3. GESTÃO DE CATEGORIAS DE ADICIONAIS ---

function renderizarListaAdicionais() {
    const container = document.getElementById('lista-categorias-adicionais');
    if(!container) return;
    container.innerHTML = "";

    listaCategoriasAdicionais.forEach(cat => {
        const itens = cat.itens || [];
        const div = document.createElement('div');
        div.className = "item-categoria-container";
        div.innerHTML = `
            <div class="categoria-header">
                <div class="cat-info" onclick="toggleConteudo('adic-cat-${cat._id}')">
                    <span class="seta" id="seta-adic-cat-${cat._id}">▲</span>
                    <span class="cat-nome">${cat.nome || "Nova Categoria"}</span>
                </div>
                <div class="dropdown">
                    <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer;">⋮</button>
                    <div class="dropdown-content">
                        <a onclick="excluirCatAdicional('${cat._id}')">Excluir</a>
                        <a onclick="duplicarCatAdicional('${cat._id}')">Duplicar</a>
                        <a onclick="abrirModalEdicaoCatAdicional('${cat._id}')">Editar</a>
                    </div>
                </div>
            </div>
            <div class="conteudo-lista" id="adic-cat-${cat._id}" style="display:none;">
                <button class="btn-acao-interna" style="border-color:#6f42c1; color:#6f42c1;" onclick="abrirModalItemAdicional(null, '${cat._id}')">+ Criar Adicional</button>
                <div id="itens-adicionais-de-${cat._id}">
                    ${itens.map(it => `
                        <div class="item-linha">
                            <div class="item-info-wrapper" onclick="abrirModalItemAdicional('${it.id}', '${cat._id}')">
                                <div class="item-txt-container">
                                    <span class="item-nome-txt">${it.nome}</span>
                                    <span class="item-preco-txt">R$ ${parseFloat(it.preco).toFixed(2)}</span>
                                    ${it.status === 'indisponivel' ? '<span class="item-status-tag tag-indisponivel">Indisponível</span>' : ''}
                                </div>
                            </div>
                            <div class="dropdown">
                                <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer;">⋮</button>
                                <div class="dropdown-content">
                                    <a onclick="excluirItemAdicional('${cat._id}', '${it.id}')">Excluir</a>
                                    <a onclick="duplicarItemAdicional('${cat._id}', '${it.id}')">Duplicar</a>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirModalEdicaoCatAdicional(id) {
    const cat = listaCategoriasAdicionais.find(x => x._id === id);
    const body = document.getElementById('body-modal-cat-adicional');
    
    body.innerHTML = `
        <input type="hidden" id="edit-cat-adic-id" value="${id}">
        <div class="input-group">
            <label>Nome da Categoria</label>
            <input type="text" id="edit-cat-adic-nome" value="${cat.nome || ''}">
        </div>
        <div class="input-group">
            <label>Status</label>
            <select id="edit-cat-adic-status">
                <option value="opcional" ${cat.status === 'opcional' ? 'selected' : ''}>Opcional</option>
                <option value="obrigatorio" ${cat.status === 'obrigatorio' ? 'selected' : ''}>Obrigatório</option>
            </select>
        </div>

        <div class="flex-row">
            <span>Vincular a Produtos</span>
            <label class="switch">
                <input type="checkbox" id="toggle-vincular-produtos" onchange="toggleArvoreProdutos()">
                <span class="slider"></span>
            </label>
        </div>

        <div id="arvore-produtos-vinc" style="display:none; margin-top:20px;">
            ${listaCategoriasProdutos.map(cp => `
                <div class="tree-categoria">
                    <div style="font-weight:bold; padding:5px; background:#f0f0f0; cursor:pointer;" onclick="toggleConteudo('tree-cat-${cp._id}')">📁 ${cp.nome}</div>
                    <div id="tree-cat-${cp._id}" style="display:none; padding-left:15px;">
                        ${listaProdutosLocal.filter(p => p.categoria === cp.nome).map(prod => {
                            const estaVinculado = cat.produtosVinculados?.includes(prod._id);
                            return `
                                <div class="tree-produto">
                                    <span>${prod.nome} ${estaVinculado ? '<span class="txt-adicionado" id="txt-vinc-${prod._id}">- Adicionado</span>' : '<span class="txt-adicionado" id="txt-vinc-${prod._id}" style="display:none;">- Adicionado</span>'}</span>
                                    <button class="btn-vinculo ${estaVinculado ? 'adicionado' : ''}" id="btn-vinc-${prod._id}" onclick="alternarVinculo('${prod._id}')">${estaVinculado ? '-' : '+'}</button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('modal-cat-adicional').style.display = "block";
}

function abrirModalItemAdicional(itemId = null, catId) {
    const cat = listaCategoriasAdicionais.find(x => x._id === catId);
    const item = itemId ? cat.itens.find(i => i.id === itemId) : { nome: "", preco: "", status: "disponivel", desconto: "" };

    const body = document.getElementById('body-modal-item-adicional');
    body.innerHTML = `
        <input type="hidden" id="item-adic-id" value="${itemId || ''}">
        <input type="hidden" id="item-adic-parent" value="${catId}">
        <div class="input-group">
            <label>Nome do Adicional</label>
            <input type="text" id="item-adic-nome" value="${item.nome}" placeholder="Ex: Bacon, Coca 2L...">
        </div>
        <div class="input-group">
            <label>Preço Bruto (R$)</label>
            <input type="number" id="item-adic-preco" step="0.01" value="${item.preco}">
        </div>
        <div class="input-group">
            <label>Status</label>
            <select id="item-adic-status">
                <option value="disponivel" ${item.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
                <option value="indisponivel" ${item.status === 'indisponivel' ? 'selected' : ''}>Indisponível (Acabou)</option>
            </select>
        </div>
        <div class="input-group">
            <label>Preço com Desconto (Opcional)</label>
            <input type="number" id="item-adic-desconto" step="0.01" value="${item.desconto}" placeholder="Preço final com desconto">
            <small style="color:gray;">Se preenchido, o preço bruto aparecerá riscado.</small>
        </div>
    `;
    document.getElementById('modal-item-adicional').style.display = "block";
}

// --- 4. FUNÇÕES DE AUXÍLIO E LÓGICA DE INTERAÇÃO ---

function toggleConteudo(id) {
    const div = document.getElementById(id);
    const seta = document.getElementById('seta-' + id);
    if(div.style.display === "none") {
        div.style.display = "block";
        if(seta) seta.innerText = "▼";
    } else {
        div.style.display = "none";
        if(seta) seta.innerText = "▲";
    }
}

function alternarVinculo(prodId) {
    const btn = document.getElementById('btn-vinc-' + prodId);
    const txt = document.getElementById('txt-vinc-' + prodId);
    if(btn.classList.contains('adicionado')) {
        btn.classList.remove('adicionado');
        btn.innerText = "+";
        txt.style.display = "none";
    } else {
        btn.classList.add('adicionado');
        btn.innerText = "-";
        txt.style.display = "inline";
    }
}

function toggleArvoreProdutos() {
    const check = document.getElementById('toggle-vincular-produtos');
    document.getElementById('arvore-produtos-vinc').style.display = check.checked ? "block" : "none";
}

function menuClique(e) {
    e.stopPropagation();
    fecharTodosDropdowns();
    e.target.nextElementSibling.classList.toggle('show');
}

function fecharTodosDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
}

function fecharModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.style.display = "none";
}

// --- 5. LÓGICA DE PERSISTÊNCIA (PARA O SERVER.JS) ---

async function criarNovaCategoriaAdicional() {
    const res = await fetch('/add-categoria-adicional', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome: "Nova Categoria", status: "opcional", itens: [], produtosVinculados: [] })
    });
    if(res.ok) carregarTudo();
}

async function salvarItemAdicional() {
    const catId = document.getElementById('item-adic-parent').value;
    const itemId = document.getElementById('item-adic-id').value;
    const dados = {
        id: itemId || Date.now().toString(),
        nome: document.getElementById('item-adic-nome').value,
        preco: document.getElementById('item-adic-preco').value,
        status: document.getElementById('item-adic-status').value,
        desconto: document.getElementById('item-adic-desconto').value
    };

    const res = await fetch(`/update-item-adicional/${catId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ item: dados, isNew: !itemId })
    });

    if(res.ok) {
        fecharModal('modal-item-adicional');
        carregarTudo();
    }
}

// Bloqueio de cliques externos no dropdown
window.onclick = function(event) {
    if (!event.target.matches('button')) fecharTodosDropdowns();
}

// --- EXPOSIÇÃO GLOBAL PARA O ADMIN.EJS ---
window.renderizarPainelCategorias = renderizarPainelCategorias;
window.renderizarPainelAdmin = renderizarPainelAdmin;
window.carregarTudo = carregarTudo;