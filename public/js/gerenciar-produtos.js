/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS - VERSÃO CORRIGIDA
 */

let imagemBase64 = ""; 

// --- 0. INJEÇÃO DE CSS (Ajustes de Dropdown e Layout de Produto) ---
const styles = `
    .painel-unico-admin { font-family: sans-serif; max-width: 800px; margin: 20px auto; background: #f4f4f4; padding: 15px; border-radius: 8px; }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-add-principal { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
    
    .item-categoria-container { background: white; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; border-bottom: 1px solid #eee; }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; }
    .cat-nome { font-weight: bold; font-size: 1.1em; outline: none; }
    
    .produtos-lista { padding: 10px 15px; background: #fafafa; border-top: 1px solid #eee; }
    .btn-add-produto { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px dashed #ccc; background: #fff; cursor: pointer; border-radius: 4px; }
    
    /* Layout do Produto: Foto + Nome + Preço */
    .produto-linha { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 4px; cursor: pointer; }
    .prod-info-wrapper { display: flex; align-items: center; flex-grow: 1; }
    .prod-img-min { width: 45px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; background: #eee; }
    .prod-txt-container { display: flex; flex-direction: column; }
    .prod-nome-txt { font-weight: bold; }
    .prod-preco-txt { font-size: 0.9em; color: #28a745; font-weight: bold; }

    /* Dropdown de Opções (Clique para abrir e Flutuante) */
    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { 
        display: none; 
        position: absolute; 
        right: 0; 
        top: 100%; 
        background: white; 
        min-width: 150px; 
        box-shadow: 0 8px 16px rgba(0,0,0,0.3); 
        z-index: 9999; 
        border-radius: 4px; 
        border: 1px solid #ddd;
    }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: black; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #eee; }
    .dropdown-content a:last-child { border-bottom: none; }
    .dropdown-content a:hover { background: #f1f1f1; }

    /* Modal Fullscreen (Original mantido) */
    .modal-fullscreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 10000; overflow-y: auto; }
    .modal-content header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white; }
    .modal-body { padding: 20px; max-width: 600px; margin: 0 auto; }
    .upload-area { text-align: center; margin-bottom: 20px; border: 2px dashed #ddd; padding: 20px; border-radius: 10px; }
    .input-group { margin-bottom: 15px; }
    .input-group label { display: block; margin-bottom: 5px; font-weight: bold; }
    .input-group input, .input-group textarea, .input-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box; }
    .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    
    .switch { position: relative; display: inline-block; width: 50px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #28a745; }
    input:checked + .slider:before { transform: translateX(26px); }
    .toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid #eee; }
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
                <h3>Gerenciar Itens</h3>
                <button class="btn-add-principal" onclick="criarNovaCategoria()">+ Adicionar Categoria</button>
            </div>
            <div id="lista-hierarquica"></div>
        </div>

        <div id="modal-produto" class="modal-fullscreen" style="display:none;">
            <div class="modal-content">
                <header>
                    <button onclick="fecharModal()" style="border:none; background:none; font-size:18px; cursor:pointer;">← Voltar</button>
                    <span id="modal-titulo" style="font-weight:bold;">Editar Produto</span>
                    <button class="btn-salvar-modal" onclick="salvarProduto()" style="background:#007bff; color:white; border:none; padding:8px 20px; border-radius:5px; cursor:pointer;">SALVAR</button>
                </header>
                
                <div class="modal-body">
                    <input type="hidden" id="p-id">
                    <input type="hidden" id="p-img-data">
                    <input type="hidden" id="p-categoria-origem">

                    <div class="upload-area">
                        <img id="p-preview" src="" style="width: 150px; height: 150px; object-fit: cover; border-radius:10px; margin-bottom:10px; display:none;">
                        <input type="file" id="p-file" accept="image/*" onchange="converterImagem()" style="display:none;">
                        <label for="p-file" style="cursor:pointer; color:#007bff; font-weight:bold;">📷 Selecionar Foto</label>
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
                        <input type="number" id="p-desconto" style="width:120px; padding:8px;" placeholder="Ex: 25.00">
                    </div>

                    <div class="toggle-item">
                        <div>
                            <strong>Adicionar Modificadores</strong><br>
                            <small style="color:#666;">Ativar acompanhamentos e extras</small>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="p-modificador">
                            <span class="slider"></span>
                        </label>
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

        const lista = document.getElementById('lista-hierarquica');
        lista.innerHTML = "";

        // Categorias Fixas (Agora com menu ⋮)
        const fixasNomes = ["Promoção", "Mais Comprados"];
        fixasNomes.forEach(nome => {
            renderizarItemCategoria({ nome, fixa: true, _id: nome }, produtos);
        });

        // Categorias Dinâmicas (Ignora o "Todos" e nomes vazios)
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
                <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer;">⋮</button>
                <div class="dropdown-content">
                    <a href="#" onclick="confirmarExclusaoCat('${cat._id}', '${cat.fixa}')">Excluir</a>
                    <a href="#" onclick="duplicarCategoria('${cat._id}')">Duplicar</a>
                </div>
            </div>
        </div>
        <div class="produtos-lista" id="lista-prod-${cat.nome}" style="display:none;">
            <button class="btn-add-produto" onclick="abrirCriarProduto('${cat.nome}')">+ Criar Produto em ${cat.nome}</button>
            <div id="itens-prod-${cat.nome}">
                ${produtosDaCat.map(p => `
                    <div class="produto-linha" onclick="abrirEdicaoProduto('${p._id}', '${JSON.stringify(p).replace(/'/g, "&apos;")}')">
                        <div class="prod-info-wrapper">
                            <img src="${p.img || ''}" class="prod-img-min" onerror="this.style.display='none'">
                            <div class="prod-txt-container">
                                <span class="prod-nome-txt">${p.nome || 'Sem nome'}</span>
                                <span class="prod-preco-txt">R$ ${parseFloat(p.preco || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer;">⋮</button>
                            <div class="dropdown-content">
                                <a href="#" onclick="excluirProduto('${p._id}')">Excluir</a>
                                <a href="#" onclick="duplicarProduto('${p._id}')">Duplicar</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    lista.appendChild(div);
}

// --- 3. LÓGICA DE INTERAÇÃO (Dropdown e Expandir) ---

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

// --- 4. LÓGICA DE PRODUTOS (Original Mantida) ---

function abrirCriarProduto(catNome) {
    imagemBase64 = "";
    document.getElementById('p-id').value = "";
    document.getElementById('p-img-data').value = "";
    document.getElementById('p-nome').value = "";
    document.getElementById('p-desc').value = "";
    document.getElementById('p-preco').value = "";
    document.getElementById('p-desconto').value = "";
    document.getElementById('p-modificador').checked = false;
    document.getElementById('p-categoria-origem').value = catNome;
    document.getElementById('p-preview').style.display = "none";
    document.getElementById('modal-titulo').innerText = "Novo Produto";
    document.getElementById('modal-produto').style.display = "block";
}

function abrirEdicaoProduto(id, pJson) {
    const p = JSON.parse(pJson);
    document.getElementById('p-id').value = id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-desc').value = p.desc;
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-status').value = p.status || "disponivel";
    document.getElementById('p-desconto').value = p.desconto || "";
    document.getElementById('p-modificador').checked = p.modificadoresAtivos || false;
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
        modificadoresAtivos: document.getElementById('p-modificador').checked,
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
    if(fixa === "true") {
        alert("Categorias fixas não podem ser excluídas.");
        return;
    }
    if(confirm("Excluir esta categoria?")) {
        // fetch('/delete-categoria/' + id, { method: 'DELETE' }).then(() => carregarDadosCompletos());
    }
}

// Fecha dropdowns se clicar fora
window.onclick = function(event) {
    if (!event.target.matches('button')) fecharTodosDropdowns();
}