/**
 * GERENCIAR PRODUTOS.JS - VERSÃO RESTAURADA E COMPLETA (2026)
 * Sistema de listagem automática e criação de produtos recuperado.
 */

// Variáveis Globais de Controle
let imagemBase64 = ""; 
let listaProdutosLocal = [];

// --- 0. INJEÇÃO DE CSS (Interface Organizada) ---
const styles = `
    .painel-unico-admin { font-family: sans-serif; max-width: 800px; margin: 20px auto; background: #f4f4f4; padding: 15px; border-radius: 8px; }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-add-principal { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    
    .item-categoria-container { background: white; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; border-bottom: 1px solid #eee; }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; color: #666; }
    .cat-nome { font-weight: bold; font-size: 1.1em; color: #333; }
    
    .produtos-lista { padding: 10px 15px; background: #fafafa; border-top: 1px solid #eee; }
    .btn-add-produto { width: 100%; padding: 10px; margin-bottom: 10px; border: 2px dashed #ddd; background: #fff; cursor: pointer; border-radius: 6px; color: #666; font-weight: bold; }
    .btn-add-produto:hover { background: #f0f0f0; border-color: #bbb; }
    
    .produto-linha { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 4px; cursor: pointer; transition: 0.2s; }
    .produto-linha:hover { background: #f9f9f9; }
    .prod-info-wrapper { display: flex; align-items: center; flex-grow: 1; }
    .prod-img-min { width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 12px; background: #eee; border: 1px solid #ddd; }
    .prod-txt-container { display: flex; flex-direction: column; }
    .prod-nome-txt { font-weight: bold; color: #333; }
    .prod-preco-txt { font-size: 0.95em; color: #28a745; font-weight: bold; margin-top: 2px; }

    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { 
        display: none; 
        position: absolute; 
        right: 0; 
        top: 100%; 
        background: white; 
        min-width: 160px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
        z-index: 1000; 
        border-radius: 8px; 
        border: 1px solid #eee;
        overflow: hidden;
    }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: #333; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #f5f5f5; }
    .dropdown-content a:hover { background: #f8f9fa; color: #007bff; }

    /* Modal Fullscreen */
    .modal-fullscreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 10000; overflow-y: auto; display: none; }
    .modal-content header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white; z-index: 10; }
    .modal-body { padding: 20px; max-width: 600px; margin: 0 auto; }
    .upload-area { text-align: center; margin-bottom: 25px; border: 2px dashed #ddd; padding: 20px; border-radius: 12px; background: #fcfcfc; }
    .input-group { margin-bottom: 18px; }
    .input-group label { display: block; margin-bottom: 6px; font-weight: bold; color: #444; }
    .input-group input, .input-group textarea, .input-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
    .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    
    .switch { position: relative; display: inline-block; width: 46px; height: 24px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #28a745; }
    input:checked + .slider:before { transform: translateX(22px); }
    .toggle-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid #eee; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 1. RENDERIZAÇÃO E INICIALIZAÇÃO ---

window.renderizarPainelCategorias = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="painel-unico-admin" onclick="fecharTodosDropdowns(event)">
            <div class="header-painel">
                <h3>Gerenciar Itens</h3>
                <button class="btn-add-principal" onclick="criarNovaCategoria()">+ Categoria</button>
            </div>
            <div id="lista-hierarquica"></div>
        </div>

        <div id="modal-produto" class="modal-fullscreen">
            <div class="modal-content">
                <header>
                    <button onclick="fecharModal()" style="border:none; background:none; font-size:22px; cursor:pointer;">✕</button>
                    <span id="modal-titulo" style="font-weight:bold; font-size:1.2em;">Novo Produto</span>
                    <button class="btn-salvar-modal" onclick="salvarProduto()" style="background:#007bff; color:white; border:none; padding:10px 25px; border-radius:8px; cursor:pointer; font-weight:bold;">SALVAR</button>
                </header>
                
                <div class="modal-body">
                    <input type="hidden" id="p-id">
                    <input type="hidden" id="p-img-data">
                    <input type="hidden" id="p-categoria-origem">

                    <div class="upload-area">
                        <img id="p-preview" src="" style="width: 180px; height: 180px; object-fit: cover; border-radius:12px; margin-bottom:15px; display:none; border: 1px solid #ddd;">
                        <input type="file" id="p-file" accept="image/*" onchange="converterImagem()" style="display:none;">
                        <label for="p-file" style="cursor:pointer; color:#007bff; font-weight:bold; display:block; padding:10px;">📷 Alterar Foto do Produto</label>
                    </div>

                    <div class="input-group">
                        <label>Nome do Produto</label>
                        <input type="text" id="p-nome" placeholder="Ex: X-Salada Especial">
                    </div>

                    <div class="input-group">
                        <label>Descrição / Ingredientes</label>
                        <textarea id="p-desc" rows="3" placeholder="Pão, hambúrguer, alface..."></textarea>
                    </div>

                    <div class="input-row">
                        <div class="input-group">
                            <label>Preço de Venda (R$)</label>
                            <input type="number" id="p-preco" step="0.01" placeholder="0,00">
                        </div>
                        <div class="input-group">
                            <label>Disponibilidade</label>
                            <select id="p-status">
                                <option value="disponivel">Disponível</option>
                                <option value="indisponivel">Pausado / Esgotado</option>
                            </select>
                        </div>
                    </div>

                    <div class="toggle-item">
                        <span>🏷️ Preço Promocional (R$)</span>
                        <input type="number" id="p-desconto" style="width:130px; padding:10px; border-radius:8px; border:1px solid #ddd;" placeholder="Opcional">
                    </div>

                    <div class="toggle-item">
                        <div>
                            <strong>Adicionais e Modificadores</strong><br>
                            <small style="color:#666;">Permitir que o cliente escolha extras</small>
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
    window.carregarDadosCompletos();
};

// --- 2. LÓGICA DE DADOS (Categorias Automáticas Restauradas) ---

window.carregarDadosCompletos = async function() {
    try {
        const [resCat, resProd] = await Promise.all([
            fetch('/get-categorias'),
            fetch('/get-produtos')
        ]);

        const categorias = await resCat.json();
        const produtos = await resProd.json();
        listaProdutosLocal = produtos;

        const lista = document.getElementById('lista-hierarquica');
        if (!lista) return;
        lista.innerHTML = "";

        // RECUPERAÇÃO: Sistema de categorias fixas originais
        const fixasNomes = ["Promoção", "Mais Comprados"];
        
        // 1. Renderiza as Fixas primeiro
        fixasNomes.forEach(nome => {
            renderizarItemCategoria({ nome, fixa: true, _id: nome }, produtos);
        });

        // 2. Renderiza as demais categorias do banco
        categorias.forEach(cat => {
            if (!fixasNomes.includes(cat.nome) && cat.nome !== "Todos" && cat.nome !== "Defina um nome") {
                renderizarItemCategoria(cat, produtos);
            }
        });

    } catch (err) { 
        console.error("Erro ao carregar dados:", err); 
    }
};

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
                <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer; padding:5px 10px;">⋮</button>
                <div class="dropdown-content">
                    <a href="javascript:void(0)" onclick="confirmarExclusaoCat('${cat._id}', '${cat.fixa}')">Excluir Categoria</a>
                </div>
            </div>
        </div>
        <div class="produtos-lista" id="lista-prod-${cat.nome}" style="display:none;">
            <button class="btn-add-produto" onclick="abrirCriarProduto('${cat.nome}')">+ Novo Produto em ${cat.nome}</button>
            <div id="itens-prod-${cat.nome}">
                ${produtosDaCat.map(p => `
                    <div class="produto-linha" onclick="prepararEdicao('${p._id}')">
                        <div class="prod-info-wrapper">
                            <img src="${p.img || ''}" class="prod-img-min" onerror="this.style.display='none'">
                            <div class="prod-txt-container">
                                <span class="prod-nome-txt">${p.nome || 'Produto sem nome'}</span>
                                <span class="prod-preco-txt">R$ ${parseFloat(p.preco || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer; padding:5px;">⋮</button>
                            <div class="dropdown-content">
                                <a href="javascript:void(0)" onclick="excluirProduto('${p._id}')">Remover</a>
                                <a href="javascript:void(0)" onclick="duplicarProduto('${p._id}')">Duplicar</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    lista.appendChild(div);
}

// --- 3. INTERAÇÕES E UI ---

window.menuClique = function(e) {
    e.stopPropagation();
    const jaAberto = e.target.nextElementSibling.classList.contains('show');
    fecharTodosDropdowns();
    if (!jaAberto) e.target.nextElementSibling.classList.add('show');
};

window.fecharTodosDropdowns = function() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
};

window.toggleExpandir = function(catNome) {
    const lista = document.getElementById(`lista-prod-${catNome}`);
    const seta = document.getElementById(`seta-${catNome}`);
    if(lista.style.display === "none") {
        lista.style.display = "block";
        seta.innerHTML = "▼";
    } else {
        lista.style.display = "none";
        seta.innerHTML = "▲";
    }
};

// --- 4. GESTÃO DE PRODUTOS ---

window.prepararEdicao = function(id) {
    const produto = listaProdutosLocal.find(item => item._id === id);
    if(produto) window.abrirEdicaoProduto(id, produto);
};

window.abrirCriarProduto = function(catNome) {
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
    document.getElementById('modal-titulo').innerText = `Novo Produto em ${catNome}`;
    document.getElementById('modal-produto').style.display = "block";
};

window.abrirEdicaoProduto = function(id, p) {
    document.getElementById('p-id').value = id;
    document.getElementById('p-nome').value = p.nome || "";
    document.getElementById('p-desc').value = p.desc || "";
    document.getElementById('p-preco').value = p.preco || "";
    document.getElementById('p-status').value = p.status || "disponivel";
    document.getElementById('p-desconto').value = p.desconto || "";
    document.getElementById('p-modificador').checked = p.modificadoresAtivos === true;
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
};

window.salvarProduto = async function() {
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

    if(!dados.nome || !dados.preco) {
        alert("Nome e Preço são obrigatórios!");
        return;
    }

    try {
        const url = id ? `/edit-produto/${id}` : '/add-produto';
        const res = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });
        if(res.ok) {
            fecharModal();
            window.carregarDadosCompletos();
        }
    } catch (err) { console.error(err); }
};

window.fecharModal = function() {
    document.getElementById('modal-produto').style.display = "none";
};

window.converterImagem = function() {
    const file = document.getElementById('p-file').files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        imagemBase64 = reader.result;
        document.getElementById('p-preview').src = reader.result;
        document.getElementById('p-preview').style.display = "block";
    }
    if (file) reader.readAsDataURL(file);
};

// --- 5. GESTÃO DE CATEGORIAS ---

window.criarNovaCategoria = async function() {
    const nome = prompt("Nome da nova categoria:");
    if(!nome) return;
    try {
        const res = await fetch('/add-categoria', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nome: nome })
        });
        if(res.ok) window.carregarDadosCompletos();
    } catch(e) { console.error(e); }
};

window.confirmarExclusaoCat = function(id, fixa) {
    if(fixa === "true" || id === "Promoção" || id === "Mais Comprados") {
        alert("Estas categorias são automáticas do sistema e não podem ser removidas.");
        return;
    }
    if(confirm("Deseja realmente excluir esta categoria e ocultar seus produtos?")) {
        fetch('/delete-categoria/' + id, { method: 'DELETE' }).then(() => window.carregarDadosCompletos());
    }
};

window.excluirProduto = function(id) {
    if(confirm("Remover este produto permanentemente?")) {
        fetch('/delete-produto/' + id, { method: 'DELETE' }).then(() => window.carregarDadosCompletos());
    }
};

// Fecha menus ao clicar fora
window.addEventListener('click', function(e) {
    if (!e.target.matches('button')) window.fecharTodosDropdowns();
});