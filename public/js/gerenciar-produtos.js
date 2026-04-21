/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS - VERSÃO ATUALIZADA
 * Cores Ajustadas: Tema Dark (Preto e Roxo) para Dashboard
 */

let imagemBase64 = ""; 
let listaProdutosLocal = []; 

// --- 0. INJEÇÃO DE CSS (ESTABILIZADO PARA DASHBOARD) ---
const styles = `
    .painel-unico-admin { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 20px auto; background: #000000; padding: 15px; border-radius: 8px; color: #ffffff; }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    
    /* Botão Principal Roxo */
    .btn-add-principal { background: #8a2be2; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; transition: 0.3s; }
    .btn-add-principal:hover { background: #7b1fa2; transform: scale(1.02); }
    
    /* Containers de Categoria */
    .item-categoria-container { background: #1a1a1a; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); position: relative; border: 1px solid #333; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #1a1a1a; border-bottom: 1px solid #333; border-radius: 5px 5px 0 0; }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; color: #a855f7; }
    .cat-nome { font-weight: bold; font-size: 1.1em; color: #ffffff; }
    
    /* Lista de Produtos */
    .produtos-lista { padding: 10px 15px; background: #121212; border-top: 1px solid #333; }
    .btn-add-produto { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px dashed #8a2be2; background: transparent; color: #a855f7; cursor: pointer; border-radius: 4px; font-weight: bold; transition: 0.3s; }
    .btn-add-produto:hover { background: rgba(138, 43, 226, 0.1); }
    
    /* Linha do Produto Individual */
    .produto-linha { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #222; background: #1e1e1e; margin-bottom: 5px; border-radius: 4px; cursor: pointer; transition: 0.2s; }
    .produto-linha:hover { background: #252525; }
    .prod-info-wrapper { display: flex; align-items: center; flex-grow: 1; }
    .prod-img-min { width: 45px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; background: #333; border: 1px solid #444; }
    .prod-txt-container { display: flex; flex-direction: column; }
    .prod-nome-txt { font-weight: bold; color: #ffffff; }
    .prod-preco-txt { font-size: 0.9em; color: #a855f7; font-weight: bold; }

    /* Dropdowns Dark */
    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { 
        display: none; 
        position: absolute; 
        right: 0; 
        top: 100%; 
        background: #252525; 
        min-width: 150px; 
        box-shadow: 0 8px 16px rgba(0,0,0,0.6); 
        z-index: 9999; 
        border-radius: 4px; 
        border: 1px solid #444;
    }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: #eeeeee; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #333; }
    .dropdown-content a:last-child { border-bottom: none; }
    .dropdown-content a:hover { background: #333333; color: #ff4d4d; }

    /* Modal Fullscreen Dark */
    .modal-fullscreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000000; z-index: 10000; overflow-y: auto; color: #ffffff; }
    .modal-content header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #333; position: sticky; top: 0; background: #1a1a1a; }
    .modal-body { padding: 20px; max-width: 600px; margin: 0 auto; }
    .upload-area { text-align: center; margin-bottom: 20px; border: 2px dashed #444; padding: 20px; border-radius: 10px; background: #121212; }
    .input-group { margin-bottom: 15px; }
    .input-group label { display: block; margin-bottom: 5px; font-weight: bold; color: #bbbbbb; }
    .input-group input, .input-group textarea, .input-group select { width: 100%; padding: 12px; border: 1px solid #333; border-radius: 5px; box-sizing: border-box; background: #1e1e1e; color: white; }
    .input-group input:focus { border-color: #8a2be2; outline: none; }
    
    /* Toggle e Sliders */
    .toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid #333; color: #ffffff; }
    
    /* Custom Scrollbar */
    .modal-fullscreen::-webkit-scrollbar { width: 8px; }
    .modal-fullscreen::-webkit-scrollbar-track { background: #000; }
    .modal-fullscreen::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    .modal-fullscreen::-webkit-scrollbar-thumb:hover { background: #8a2be2; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 1. RENDERIZAÇÃO DO PAINEL PRINCIPAL ---

function renderizarPainelCategorias(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="painel-unico-admin" onclick="fecharTodosDropdowns(event)">
            <div class="header-painel">
                <h3 style="color: #a855f7;">Gerenciar Itens</h3>
                <button class="btn-add-principal" onclick="criarNovaCategoria()">+ Adicionar Categoria</button>
            </div>
            <div id="lista-hierarquica"></div>
        </div>

        <div id="modal-produto" class="modal-fullscreen" style="display:none;">
            <div class="modal-content">
                <header>
                    <button onclick="fecharModal()" style="border:none; background:none; font-size:18px; cursor:pointer; color: #ffffff;">← Voltar</button>
                    <span id="modal-titulo" style="font-weight:bold; color: #a855f7;">Editar Produto</span>
                    <button class="btn-salvar-modal" onclick="salvarProduto()" style="background:#8a2be2; color:white; border:none; padding:8px 20px; border-radius:5px; cursor:pointer; font-weight: bold;">SALVAR</button>
                </header>
                
                <div class="modal-body">
                    <input type="hidden" id="p-id">
                    <input type="hidden" id="p-img-data">
                    <input type="hidden" id="p-categoria-origem">

                    <div class="upload-area">
                        <img id="p-preview" src="" style="width: 150px; height: 150px; object-fit: cover; border-radius:10px; margin-bottom:10px; display:none; border: 2px solid #8a2be2;">
                        <input type="file" id="p-file" accept="image/*" onchange="converterImagem()" style="display:none;">
                        <label for="p-file" style="cursor:pointer; color:#a855f7; font-weight:bold;">📷 Selecionar Foto</label>
                    </div>

                    <div class="input-group">
                        <label>Nome do Produto</label>
                        <input type="text" id="p-nome" placeholder="Ex: Pizza Calabresa">
                    </div>

                    <div class="input-group">
                        <label>Descrição</label>
                        <textarea id="p-desc" rows="3" placeholder="Detalhes do produto..."></textarea>
                    </div>

                    <div class="input-row">
                        <div class="input-group">
                            <label>Preço (R$)</label>
                            <input type="number" id="p-preco" step="0.01">
                        </div>
                        <div class="input-group">
                            <label>Disponibilidade</label>
                            <select id="p-status">
                                <option value="disponivel">Disponível</option>
                                <option value="indisponivel">Indisponível</option>
                            </select>
                        </div>
                    </div>

                    <div class="toggle-item">
                        <span>🏷️ Preço com Desconto (R$)</span>
                        <input type="number" id="p-desconto" style="width:120px; padding:8px; background: #1e1e1e; color: white; border: 1px solid #333; border-radius: 5px;" placeholder="Ex: 25.00">
                    </div>
                </div>
            </div>
        </div>
    `;
    carregarDadosCompletos();
}

// --- 2. GESTÃO DE DADOS E LISTAGEM ---

async function carregarDadosCompletos() {
    try {
        const [resCat, resProd] = await Promise.all([
            fetch('/get-categorias'),
            fetch('/get-produtos')
        ]);

        const categorias = await resCat.json();
        const produtos = await resProd.json();
        
        listaProdutosLocal = produtos;

        const lista = document.getElementById('lista-hierarquica');
        lista.innerHTML = "";

        const fixasNomes = ["Promoção", "Mais Comprados"];
        fixasNomes.forEach(nome => {
            renderizarItemCategoria({ nome, fixa: true, _id: nome }, produtos);
        });

        categorias.forEach(cat => {
            if (!fixasNomes.includes(cat.nome) && cat.nome !== "Todos" && cat.nome !== "Defina um nome") {
                renderizarItemCategoria(cat, produtos);
            }
        });

    } catch (err) { console.error("Erro:", err); }
}

function renderizarItemCategoria(cat, todosProdutos) {
    const lista = document.getElementById('lista-hierarquica');
    const produtosDaCat = todosProdutos.filter(p => p.categoria === cat.nome);
    
    const div = document.createElement('div');
    div.className = "item-categoria-container";
    div.innerHTML = `
        <div class="categoria-header">
            <div class="cat-info" onclick="toggleExpandir('${cat.nome}')">
                <span class="seta" id="seta-${cat.nome}">▲</span>
                <span class="cat-nome">${cat.nome}</span>
            </div>
            <div class="dropdown">
                <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer; color: #888;">⋮</button>
                <div class="dropdown-content">
                    <a href="#" onclick="confirmarExclusaoCat('${cat._id}', '${cat.fixa}')">Excluir</a>
                </div>
            </div>
        </div>
        <div class="produtos-lista" id="lista-prod-${cat.nome}" style="display:none;">
            <button class="btn-add-produto" onclick="abrirCriarProduto('${cat.nome}')">+ Criar Produto em ${cat.nome}</button>
            <div id="itens-prod-${cat.nome}">
                ${produtosDaCat.map(p => `
                    <div class="produto-linha" onclick="prepararEdicao('${p._id}')">
                        <div class="prod-info-wrapper">
                            <img src="${p.img || ''}" class="prod-img-min" onerror="this.style.display='none'">
                            <div class="prod-txt-container">
                                <span class="prod-nome-txt">${p.nome || 'Sem nome'}</span>
                                <span class="prod-preco-txt">R$ ${parseFloat(p.preco || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer; color: #888;">⋮</button>
                            <div class="dropdown-content">
                                <a href="#" onclick="excluirProduto('${p._id}')">Excluir</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    lista.appendChild(div);
}

// --- 3. LÓGICA DE INTERAÇÃO ---

function menuClique(e) {
    e.stopPropagation();
    fecharTodosDropdowns();
    const content = e.target.nextElementSibling;
    content.classList.toggle('show');
}

function fecharTodosDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
}

function toggleExpandir(catNome) {
    const lista = document.getElementById(`lista-prod-${catNome}`);
    const seta = document.getElementById(`seta-${catNome}`);
    if(lista.style.display === "none") {
        lista.style.display = "block";
        seta.innerHTML = "▼";
    } else {
        lista.style.display = "none";
        seta.innerHTML = "▲";
    }
}

// --- 4. LÓGICA DE PRODUTOS ---

function prepararEdicao(id) {
    const produto = listaProdutosLocal.find(item => item._id === id);
    if(produto) {
        abrirEdicaoProduto(id, produto);
    }
}

function abrirCriarProduto(catNome) {
    imagemBase64 = "";
    document.getElementById('p-id').value = "";
    document.getElementById('p-img-data').value = "";
    document.getElementById('p-nome').value = "";
    document.getElementById('p-desc').value = "";
    document.getElementById('p-preco').value = "";
    document.getElementById('p-desconto').value = "";
    document.getElementById('p-categoria-origem').value = catNome;
    document.getElementById('p-preview').style.display = "none";
    document.getElementById('modal-titulo').innerText = "Novo Produto";
    document.getElementById('modal-produto').style.display = "block";
}

function abrirEdicaoProduto(id, p) {
    document.getElementById('p-id').value = id;
    document.getElementById('p-nome').value = p.nome || "";
    document.getElementById('p-desc').value = p.desc || "";
    document.getElementById('p-preco').value = p.preco || "";
    document.getElementById('p-status').value = p.status || "disponivel";
    document.getElementById('p-desconto').value = p.desconto || "";
    document.getElementById('p-img-data').value = p.img || "";
    document.getElementById('p-categoria-origem').value = p.categoria;
    
    if(p.img) {
        document.getElementById('p-preview').src = p.img;
        document.getElementById('p-preview').style.display = "block";
    } else {
        document.getElementById('p-preview').style.display = "none";
    }
    document.getElementById('modal-titulo').innerText = "Editar Produto";
    document.getElementById('modal-produto').style.display = "block";
}

async function salvarProduto() {
    const id = document.getElementById('p-id').value;
    const dados = {
        nome: document.getElementById('p-nome').value,
        preco: document.getElementById('p-preco').value,
        desc: document.getElementById('p-desc').value,
        status: document.getElementById('p-status').value,
        desconto: document.getElementById('p-desconto').value,
        categoria: document.getElementById('p-categoria-origem').value,
        img: imagemBase64 || document.getElementById('p-img-data').value
    };

    try {
        const url = id ? `/edit-produto/${id}` : '/add-produto';
        const res = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        if(res.ok) {
            fecharModal();
            carregarDadosCompletos();
        }
    } catch (err) { console.error(err); }
}

function fecharModal() {
    document.getElementById('modal-produto').style.display = "none";
}

function converterImagem() {
    const file = document.getElementById('p-file').files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        imagemBase64 = reader.result;
        document.getElementById('p-preview').src = reader.result;
        document.getElementById('p-preview').style.display = "block";
    }
    if (file) reader.readAsDataURL(file);
}

// --- 5. CATEGORIAS ---

async function criarNovaCategoria() {
    const nome = prompt("Nome da nova categoria:");
    if(!nome) return;
    const res = await fetch('/add-categoria', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome: nome })
    });
    if(res.ok) carregarDadosCompletos();
}

function confirmarExclusaoCat(id, fixa) {
    if(fixa === "true" || fixa === true) {
        alert("Categorias fixas não podem ser excluídas.");
        return;
    }
    if(confirm("Excluir esta categoria?")) {
        fetch('/delete-categoria/' + id, { method: 'DELETE' }).then(() => carregarDadosCompletos());
    }
}

function excluirProduto(id) {
    if(confirm("Excluir este produto?")) {
        fetch('/delete-produto/' + id, { method: 'DELETE' }).then(() => carregarDadosCompletos());
    }
}

window.onclick = function(event) {
    if (!event.target.matches('button') && !event.target.matches('.menu-dot')) fecharTodosDropdowns();
}