/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS - CORRIGIDO
 */

let imagemBase64 = ""; 
let listaProdutosLocal = []; 

// --- 0. INJEÇÃO DE CSS (Executa ao carregar o script) ---
const styles = `
    .painel-unico-admin { font-family: sans-serif; max-width: 100%; margin: 10px auto; background: var(--bg); padding: 15px; border-radius: 8px; }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-add-principal { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    
    .item-categoria-container { background: var(--white); margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; border: 1px solid var(--border-color); overflow: hidden; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--white); border-bottom: 1px solid var(--border-color); }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; color: var(--primary); }
    .cat-nome { font-weight: bold; font-size: 1.1em; color: var(--text-main); }
    
    .produtos-lista { padding: 10px 15px; background: var(--chat-bg); border-top: 1px solid var(--border-color); }
    .btn-add-produto { width: 100%; padding: 12px; margin-bottom: 15px; border: 2px dashed var(--border-color); background: var(--white); cursor: pointer; border-radius: 6px; color: var(--text-main); font-weight: bold; }
    
    .produto-linha { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color); background: var(--white); margin-bottom: 8px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .produto-linha:hover { transform: scale(1.01); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .prod-info-wrapper { display: flex; align-items: center; flex-grow: 1; }
    .prod-img-min { width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 15px; background: #eee; }
    .prod-txt-container { display: flex; flex-direction: column; }
    .prod-nome-txt { font-weight: bold; color: var(--text-main); }
    .prod-preco-txt { font-size: 0.9em; color: #2ecc71; font-weight: bold; }

    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { 
        display: none; 
        position: absolute; 
        right: 0; 
        top: 100%; 
        background: white; 
        min-width: 150px; 
        box-shadow: 0 8px 16px rgba(0,0,0,0.2); 
        z-index: 999; 
        border-radius: 6px; 
        border: 1px solid #ddd;
    }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: #333; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #eee; }
    .dropdown-content a:hover { background: #f8f9fa; }

    .modal-fullscreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--white); z-index: 10000; overflow-y: auto; color: var(--text-main); }
    .modal-content header { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; background: var(--white); z-index: 10; }
    .modal-body { padding: 20px; max-width: 600px; margin: 0 auto; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 1. RENDERIZAÇÃO E EXPOSIÇÃO GLOBAL ---

window.renderizarPainelCategorias = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Container não encontrado:", containerId);
        return;
    }

    container.innerHTML = `
        <div class="painel-unico-admin" onclick="fecharTodosDropdowns(event)">
            <div class="header-painel">
                <h3 style="margin:0;">Gerenciar Cardápio</h3>
                <button class="btn-add-principal" onclick="criarNovaCategoria()">+ Categoria</button>
            </div>
            <div id="lista-hierarquica">
                <p style="text-align:center; padding:20px; color:#888;">Carregando categorias e produtos...</p>
            </div>
        </div>

        <div id="modal-produto" class="modal-fullscreen" style="display:none;">
            <div class="modal-content">
                <header>
                    <button onclick="fecharModal()" style="border:none; background:none; font-size:1.5rem; cursor:pointer; color:var(--text-main);">✕</button>
                    <span id="modal-titulo" style="font-weight:900; text-transform:uppercase;">Editar Produto</span>
                    <button onclick="salvarProduto()" style="background:var(--success); color:white; border:none; padding:10px 25px; border-radius:6px; cursor:pointer; font-weight:bold;">SALVAR</button>
                </header>
                
                <div class="modal-body">
                    <input type="hidden" id="p-id">
                    <input type="hidden" id="p-img-data">
                    <input type="hidden" id="p-categoria-origem">

                    <div class="upload-area" style="text-align: center; padding: 20px; border: 2px dashed var(--border-color); border-radius: 12px; margin-bottom: 20px;">
                        <img id="p-preview" src="" style="width: 180px; height: 180px; object-fit: cover; border-radius:12px; margin-bottom:15px; display:none; margin-left:auto; margin-right:auto;">
                        <input type="file" id="p-file" accept="image/*" onchange="converterImagem()" style="display:none;">
                        <label for="p-file" style="cursor:pointer; color:var(--info); font-weight:bold; display:block;">📷 Alterar Foto do Produto</label>
                    </div>

                    <div class="input-group">
                        <label>Nome do Item</label>
                        <input type="text" id="p-nome" placeholder="Ex: X-Salada Especial">
                    </div>

                    <div class="input-group">
                        <label>Descrição / Ingredientes</label>
                        <textarea id="p-desc" rows="3" placeholder="Pão, carne 180g, queijo..."></textarea>
                    </div>

                    <div class="input-row">
                        <div class="input-group">
                            <label>Preço Base (R$)</label>
                            <input type="number" id="p-preco" step="0.01">
                        </div>
                        <div class="input-group">
                            <label>Status</label>
                            <select id="p-status">
                                <option value="disponivel">✅ Disponível</option>
                                <option value="indisponivel">❌ Indisponível</option>
                            </select>
                        </div>
                    </div>

                    <div class="toggle-item">
                        <span>🏷️ Preço Promocional (Opcional)</span>
                        <input type="number" id="p-desconto" style="width:120px; padding:8px;" placeholder="0.00">
                    </div>

                    <div class="toggle-item" style="margin-top:20px; padding-top:20px;">
                        <div>
                            <strong>Permitir Adicionais?</strong><br>
                            <small style="color:#888;">Habilita a escolha de extras pelo cliente</small>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="p-modificador" onchange="togglePainelAdicionais()">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div id="area-adicionais" style="display:none; background: var(--bg); padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <label style="font-weight:bold; display:block; margin-bottom:10px;">Lista de Extras/Adicionais</label>
                        <div id="lista-adicionais-editavel"></div>
                        <button type="button" class="btn-novo-adicional" onclick="adicionarLinhaAdicional()" style="background:var(--dark); color:white; border:none; padding:10px; border-radius:6px; width:100%; cursor:pointer; margin-top:10px;">+ Adicionar Opção</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    carregarDadosCompletos();
};

// --- 2. GESTÃO DE DADOS ---

async function carregarDadosCompletos() {
    try {
        const [resCat, resProd] = await Promise.all([
            fetch('/get-categorias'),
            fetch('/get-produtos')
        ]);
        
        const categorias = await resCat.json();
        const produtos = await resProd.json();
        listaProdutosLocal = produtos;

        const listaContainer = document.getElementById('lista-hierarquica');
        if(!listaContainer) return;
        listaContainer.innerHTML = "";

        // Categorias Fixas de Sistema
        const fixasNomes = ["Promoção", "Mais Comprados"];
        fixasNomes.forEach(nome => {
            renderizarItemCategoria({ nome, fixa: true, _id: nome }, produtos);
        });

        // Categorias do Usuário
        categorias.forEach(cat => {
            if (!fixasNomes.includes(cat.nome) && cat.nome !== "Todos" && cat.nome !== "Defina um nome") {
                renderizarItemCategoria(cat, produtos);
            }
        });
    } catch (err) { 
        console.error("Erro ao carregar dados:", err); 
        const lista = document.getElementById('lista-hierarquica');
        if(lista) lista.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar cardápio. Verifique a conexão.</p>`;
    }
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
                <small style="margin-left:10px; color:#888;">(${produtosDaCat.length})</small>
            </div>
            <div class="dropdown">
                <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer; color:var(--text-main);">⋮</button>
                <div class="dropdown-content">
                    <a href="javascript:void(0)" onclick="confirmarExclusaoCat('${cat._id}', '${cat.fixa}')" style="color:red;">Excluir Categoria</a>
                </div>
            </div>
        </div>
        <div class="produtos-lista" id="lista-prod-${cat.nome}" style="display:none;">
            <button class="btn-add-produto" onclick="abrirCriarProduto('${cat.nome}')">+ Novo Produto em ${cat.nome}</button>
            <div id="itens-prod-${cat.nome}">
                ${produtosDaCat.map(p => `
                    <div class="produto-linha" onclick="prepararEdicao('${p._id}')">
                        <div class="prod-info-wrapper">
                            <img src="${p.img || ''}" class="prod-img-min" onerror="this.src='https://placehold.co/100x100?text=Sem+Foto'">
                            <div class="prod-txt-container">
                                <span class="prod-nome-txt">${p.nome || 'Sem nome'}</span>
                                <span class="prod-preco-txt">R$ ${parseFloat(p.preco || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer; padding:10px;">⋮</button>
                            <div class="dropdown-content">
                                <a href="javascript:void(0)" onclick="excluirProduto('${p._id}')">Excluir</a>
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

// --- 3. LÓGICA DE ADICIONAIS ---

window.togglePainelAdicionais = function() {
    const isChecked = document.getElementById('p-modificador').checked;
    document.getElementById('area-adicionais').style.display = isChecked ? 'block' : 'none';
};

window.adicionarLinhaAdicional = function(nome = "", preco = "") {
    const container = document.getElementById('lista-adicionais-editavel');
    const div = document.createElement('div');
    div.className = "adicional-item";
    div.style = "display: grid; grid-template-columns: 1fr 100px 40px; gap: 10px; margin-bottom: 10px;";
    div.innerHTML = `
        <input type="text" placeholder="Nome (Ex: Bacon)" value="${nome}" class="add-nome-input" style="padding:8px;">
        <input type="number" placeholder="Preço" value="${preco}" step="0.01" class="add-preco-input" style="padding:8px;">
        <button type="button" onclick="this.parentElement.remove()" style="background:none; border:none; color:red; font-size:20px; cursor:pointer;">&times;</button>
    `;
    container.appendChild(div);
};

function obterAdicionaisDaTela() {
    const nomes = document.querySelectorAll('.add-nome-input');
    const precos = document.querySelectorAll('.add-preco-input');
    const adicionais = [];
    nomes.forEach((el, i) => {
        if(el.value.trim() !== "") {
            adicionais.push({
                nome: el.value,
                preco: parseFloat(precos[i].value) || 0
            });
        }
    });
    return adicionais;
}

// --- 4. LÓGICA DE PRODUTOS ---

window.abrirCriarProduto = function(catNome) {
    imagemBase64 = "";
    document.getElementById('p-id').value = "";
    document.getElementById('p-nome').value = "";
    document.getElementById('p-desc').value = "";
    document.getElementById('p-preco').value = "";
    document.getElementById('p-desconto').value = "";
    document.getElementById('p-modificador').checked = false;
    document.getElementById('lista-adicionais-editavel').innerHTML = "";
    togglePainelAdicionais();
    document.getElementById('p-categoria-origem').value = catNome;
    document.getElementById('p-preview').style.display = "none";
    document.getElementById('modal-titulo').innerText = "Novo Produto";
    document.getElementById('modal-produto').style.display = "block";
};

window.prepararEdicao = function(id) {
    const produto = listaProdutosLocal.find(item => item._id === id);
    if(produto) {
        document.getElementById('p-id').value = id;
        document.getElementById('p-nome').value = produto.nome || "";
        document.getElementById('p-desc').value = produto.desc || "";
        document.getElementById('p-preco').value = produto.preco || "";
        document.getElementById('p-status').value = produto.status || "disponivel";
        document.getElementById('p-desconto').value = produto.desconto || "";
        
        const temMod = produto.modificadoresAtivos === true;
        document.getElementById('p-modificador').checked = temMod;
        togglePainelAdicionais();

        const container = document.getElementById('lista-adicionais-editavel');
        container.innerHTML = "";
        if(produto.adicionais && produto.adicionais.length > 0) {
            produto.adicionais.forEach(ad => adicionarLinhaAdicional(ad.nome, ad.preco));
        }

        document.getElementById('p-img-data').value = produto.img || "";
        document.getElementById('p-categoria-origem').value = produto.categoria;
        
        if(produto.img) {
            document.getElementById('p-preview').src = produto.img;
            document.getElementById('p-preview').style.display = "block";
        } else {
            document.getElementById('p-preview').style.display = "none";
        }
        document.getElementById('modal-titulo').innerText = "Editar Produto";
        document.getElementById('modal-produto').style.display = "block";
    }
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
        adicionais: obterAdicionaisDaTela(),
        categoria: document.getElementById('p-categoria-origem').value,
        img: imagemBase64 || document.getElementById('p-img-data').value
    };

    if(!dados.nome || !dados.preco) return alert("Nome e Preço são obrigatórios!");

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
};

window.excluirProduto = function(id) {
    if(confirm("Tem certeza que deseja excluir este produto?")) {
        fetch(`/delete-produto/${id}`, { method: 'DELETE' })
        .then(() => carregarDadosCompletos());
    }
};

// --- 5. UTILITÁRIOS ---

window.menuClique = function(e) {
    e.stopPropagation();
    fecharTodosDropdowns();
    const content = e.target.nextElementSibling;
    if(content) content.classList.toggle('show');
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

window.criarNovaCategoria = async function() {
    const nome = prompt("Nome da nova categoria:");
    if(!nome) return;
    const res = await fetch('/add-categoria', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome: nome })
    });
    if(res.ok) carregarDadosCompletos();
};

window.confirmarExclusaoCat = function(id, fixa) {
    if(fixa === "true" || fixa === true) {
        alert("Categorias do sistema não podem ser removidas.");
        return;
    }
    if(confirm("Excluir esta categoria e todos os produtos dela?")) {
        fetch('/delete-categoria/' + id, { method: 'DELETE' }).then(() => carregarDadosCompletos());
    }
};

// Fecha menus ao clicar fora
window.addEventListener('click', function(event) {
    if (!event.target.matches('button')) fecharTodosDropdowns();
});