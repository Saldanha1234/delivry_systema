/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS - VERSÃO CORRIGIDA
 */

let imagemBase64 = ""; 

// --- 0. INJEÇÃO DE CSS (Interface Aprimorada) ---
const styles = `
    .painel-unico-admin { font-family: sans-serif; max-width: 800px; margin: 20px auto; background: #f4f4f4; padding: 15px; border-radius: 8px; }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-add-principal { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    
    .item-categoria-container { background: white; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; border-bottom: 1px solid #eee; }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; }
    .cat-nome { font-weight: bold; font-size: 1.1em; outline: none; }
    
    .produtos-lista { padding: 10px 15px; background: #fafafa; border-top: 1px solid #eee; }
    .btn-add-produto { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px dashed #28a745; background: #fff; color: #28a745; cursor: pointer; border-radius: 4px; font-weight: bold; }
    
    /* Produto Estilizado com Imagem ao Lado */
    .produto-linha { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 4px; cursor: pointer; }
    .prod-main-info { display: flex; align-items: center; flex-grow: 1; }
    .prod-img-mini { width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 12px; background: #eee; }
    .prod-detalhes { display: flex; flex-direction: column; }
    .prod-nome { font-weight: bold; font-size: 14px; }
    .prod-preco { color: #28a745; font-size: 13px; font-weight: bold; }

    /* Dropdown - CORRIGIDO: Abre no Clique e não some atrás de nada */
    .dropdown { position: relative; }
    .dropdown-content { 
        display: none; 
        position: absolute; 
        right: 0; 
        top: 30px; 
        background: white; 
        min-width: 160px; 
        box-shadow: 0 8px 16px rgba(0,0,0,0.3); 
        z-index: 9999; /* Garante que fique acima de tudo */
        border-radius: 4px; 
        border: 1px solid #ddd;
    }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: #333; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #eee; }
    .dropdown-content a:last-child { border-bottom: none; }
    .dropdown-content a:hover { background: #f8f9fa; color: #000; }

    /* Modal Fullscreen */
    .modal-fullscreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 10000; overflow-y: auto; }
    .modal-content header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white; z-index: 10; }
    .modal-body { padding: 20px; max-width: 600px; margin: 0 auto; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 1. RENDERIZAÇÃO E LOGICA DE DADOS ---

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
                    <button onclick="salvarProduto()" style="background:#28a745; color:white; border:none; padding:8px 20px; border-radius:5px; cursor:pointer;">SALVAR</button>
                </header>
                <div class="modal-body">
                    <input type="hidden" id="p-id">
                    <input type="hidden" id="p-img-data">
                    <input type="hidden" id="p-categoria-origem">

                    <div class="upload-area" style="text-align:center; border:2px dashed #ccc; padding:20px; border-radius:10px; margin-bottom:20px;">
                        <img id="p-preview" src="" style="width: 150px; height: 150px; object-fit: cover; border-radius:10px; margin-bottom:10px; display:none; margin: 0 auto;">
                        <input type="file" id="p-file" accept="image/*" onchange="converterImagem()" style="display:none;">
                        <label for="p-file" style="cursor:pointer; color:#28a745; font-weight:bold; display:block;">📷 Selecionar Foto</label>
                    </div>

                    <div class="input-group">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">Nome do Produto</label>
                        <input type="text" id="p-nome" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;">
                    </div><br>

                    <div class="input-group">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">Descrição</label>
                        <textarea id="p-desc" rows="3" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;"></textarea>
                    </div><br>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div>
                            <label style="font-weight:bold;">Preço (R$)</label>
                            <input type="number" id="p-preco" step="0.01" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:5px;">
                        </div>
                        <div>
                            <label style="font-weight:bold;">Status</label>
                            <select id="p-status" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:5px;">
                                <option value="disponivel">Disponível</option>
                                <option value="indisponivel">Indisponível</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    carregarDadosCompletos();
}

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

        // Categorias Fixas (Sempre aparecem no topo)
        const fixas = ["Promoção", "Mais Comprados"];
        fixas.forEach(nome => renderizarItemCategoria({ nome, fixa: true }, produtos));

        // Categorias Dinâmicas (Apenas as criadas, sem o "Todos")
        categorias.forEach(cat => {
            if (!fixas.includes(cat.nome) && cat.nome !== "Todos") {
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
                <button onclick="toggleDropdown(event)" style="border:none; background:none; font-size:22px; cursor:pointer; padding:5px;">⋮</button>
                <div class="dropdown-content">
                    ${!cat.fixa ? `<a href="#" onclick="excluirCategoria('${cat._id}')">❌ Excluir Categoria</a>` : ''}
                    <a href="#" onclick="criarNovoProduto('${cat.nome}')">➕ Adicionar Produto</a>
                </div>
            </div>
        </div>
        <div class="produtos-lista" id="lista-prod-${cat.nome}" style="display:none;">
            <div id="itens-prod-${cat.nome}">
                ${produtosDaCat.map(p => `
                    <div class="produto-linha" onclick="abrirEdicaoProduto('${p._id}', '${JSON.stringify(p).replace(/'/g, "&apos;")}')">
                        <div class="prod-main-info">
                            <img src="${p.img || ''}" class="prod-img-mini" onerror="this.style.display='none'">
                            <div class="prod-detalhes">
                                <span class="prod-nome">${p.nome || 'Sem nome'}</span>
                                <span class="prod-preco">R$ ${parseFloat(p.preco || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button onclick="toggleDropdown(event)" style="border:none; background:none; font-size:18px; cursor:pointer;">⋮</button>
                            <div class="dropdown-content">
                                <a href="#" onclick="excluirProduto('${p._id}')">❌ Excluir</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="btn-add-produto" onclick="criarNovoProduto('${cat.nome}')">+ Adicionar Produto em ${cat.nome}</button>
        </div>
    `;
    lista.appendChild(div);
}

// --- 2. CONTROLES DE INTERFACE ---

function toggleDropdown(e) {
    e.stopPropagation();
    const content = e.target.nextElementSibling;
    const jaAberto = content.classList.contains('show');
    fecharTodosDropdowns();
    if (!jaAberto) content.classList.add('show');
}

function fecharTodosDropdowns(e) {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
}

function toggleExpandir(catNome) {
    const lista = document.getElementById(`lista-prod-${catNome}`);
    const seta = document.getElementById(`seta-${catNome}`);
    const isHidden = lista.style.display === "none";
    lista.style.display = isHidden ? "block" : "none";
    seta.innerHTML = isHidden ? "▼" : "▲";
}

// --- 3. LOGICA DE PRODUTOS ---

function criarNovoProduto(categoria) {
    imagemBase64 = "";
    document.getElementById('p-id').value = "";
    document.getElementById('p-nome').value = "";
    document.getElementById('p-desc').value = "";
    document.getElementById('p-preco').value = "";
    document.getElementById('p-categoria-origem').value = categoria;
    document.getElementById('p-preview').style.display = "none";
    document.getElementById('modal-titulo').innerText = "Novo Produto em " + categoria;
    document.getElementById('modal-produto').style.display = "block";
}

function abrirEdicaoProduto(id, pJson) {
    const p = JSON.parse(pJson);
    document.getElementById('p-id').value = id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-desc').value = p.desc;
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-categoria-origem').value = p.categoria;
    document.getElementById('p-img-data').value = p.img || "";
    
    if(p.img) {
        document.getElementById('p-preview').src = p.img;
        document.getElementById('p-preview').style.display = "block";
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
        categoria: document.getElementById('p-categoria-origem').value,
        img: imagemBase64 || document.getElementById('p-img-data').value
    };

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
}

async function criarNovaCategoria() {
    const nome = prompt("Nome da nova categoria:");
    if(!nome) return;
    const res = await fetch('/add-categoria', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome })
    });
    if(res.ok) carregarDadosCompletos();
}

async function excluirProduto(id) {
    if(!confirm("Deseja excluir este produto?")) return;
    await fetch(`/delete-produto/${id}`, { method: 'DELETE' });
    carregarDadosCompletos();
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
    };
    if (file) reader.readAsDataURL(file);
}

// Inicializar ao clicar fora
window.onclick = function(event) {
    if (!event.target.matches('button')) fecharTodosDropdowns();
}