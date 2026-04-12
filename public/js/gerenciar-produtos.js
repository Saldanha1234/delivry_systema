/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E ADICIONAIS - VERSÃO EVOLUÍDA
 */

let imagemBase64 = ""; 
let listaProdutosLocal = [];
let listaAdicionaisLocal = []; // Novo armazenamento para adicionais

// --- 0. INJEÇÃO DE CSS (Ajustes de Dropdown, Layout e Abas de Navegação) ---
const styles = `
    .nav-tabs-admin { display: flex; gap: 10px; padding: 10px; background: #fff; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.1); justify-content: center; }
    .tab-btn { padding: 10px 20px; border-radius: 20px; border: 1px solid #007bff; background: transparent; color: #007bff; cursor: pointer; font-weight: bold; transition: 0.3s; }
    .tab-btn.active { background: #007bff; color: white; }

    .painel-unico-admin { font-family: sans-serif; max-width: 800px; margin: 20px auto; background: #f4f4f4; padding: 15px; border-radius: 8px; }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-add-principal { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
    
    .item-categoria-container { background: white; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #fff; border-bottom: 1px solid #eee; }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; }
    .cat-nome { font-weight: bold; font-size: 1.1em; outline: none; }
    .label-obrigatorio { font-size: 0.7em; background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 10px; color: #666; }
    .label-desconto-tag { color: #d63031; font-size: 0.75em; font-weight: bold; margin-left: 10px; }

    .produtos-lista { padding: 10px 15px; background: #fafafa; border-top: 1px solid #eee; }
    .btn-add-produto { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px dashed #ccc; background: #fff; cursor: pointer; border-radius: 4px; }
    
    .produto-linha { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; background: white; margin-bottom: 5px; border-radius: 4px; cursor: pointer; }
    .prod-info-wrapper { display: flex; align-items: center; flex-grow: 1; }
    .prod-img-min { width: 45px; height: 45px; object-fit: cover; border-radius: 4px; margin-right: 12px; background: #eee; }
    .prod-txt-container { display: flex; flex-direction: column; }
    .prod-nome-txt { font-weight: bold; }
    .prod-preco-txt { font-size: 0.9em; color: #28a745; font-weight: bold; }
    .preco-riscado { text-decoration: line-through; color: #999; font-size: 0.8em; margin-right: 5px; }

    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { 
        display: none; position: absolute; right: 0; top: 100%; background: white; min-width: 150px; 
        box-shadow: 0 8px 16px rgba(0,0,0,0.3); z-index: 9999; border-radius: 4px; border: 1px solid #ddd;
    }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: black; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #eee; }
    .dropdown-content a:hover { background: #f1f1f1; }

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

    .secao-vinculo { border: 1px solid #eee; border-radius: 8px; padding: 10px; margin-top: 10px; max-height: 250px; overflow-y: auto; }
    .item-vinculo { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #f9f9f9; font-size: 0.9em; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 1. RENDERIZAÇÃO E NAVEGAÇÃO ---

function renderizarPainelCategorias(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="nav-tabs-admin">
            <button class="tab-btn active" id="btn-tab-itens" onclick="rolarPara('secao-itens', 'btn-tab-itens')">Gerenciar Itens</button>
            <button class="tab-btn" id="btn-tab-adicionais" onclick="rolarPara('secao-adicionais', 'btn-tab-adicionais')">Configurar Adicionais</button>
        </div>

        <div id="secao-itens" class="painel-unico-admin" onclick="fecharTodosDropdowns(event)">
            <div class="header-painel">
                <h3>Gerenciar Itens do Cardápio</h3>
                <button class="btn-add-principal" onclick="criarNovaCategoria()">+ Adicionar Categoria</button>
            </div>
            <div id="lista-hierarquica-itens"></div>
        </div>

        <div id="secao-adicionais" class="painel-unico-admin" onclick="fecharTodosDropdowns(event)">
            <div class="header-painel">
                <h3>Gerenciar Adicionais</h3>
                <button class="btn-add-principal" onclick="criarNovaCategoriaAdicional()">+ Adicionar Categoria Adicional</button>
            </div>
            <div id="lista-hierarquica-adicionais"></div>
        </div>

        <div id="modal-produto" class="modal-fullscreen" style="display:none;">
            <div class="modal-content">
                <header>
                    <button onclick="fecharModal()" style="border:none; background:none; font-size:18px; cursor:pointer;">← Voltar</button>
                    <span id="modal-titulo" style="font-weight:bold;">Editar Produto</span>
                    <button class="btn-salvar-modal" onclick="salvarProduto()" style="background:#007bff; color:white; border:none; padding:8px 20px; border-radius:5px; cursor:pointer;">SALVAR</button>
                </header>
                <div class="modal-body" id="modal-body-content">
                    </div>
            </div>
        </div>
    `;
    carregarDadosCompletos();
}

function rolarPara(id, btnId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// --- 2. GESTÃO DE DADOS ---

async function carregarDadosCompletos() {
    try {
        const [resCat, resProd, resAdic] = await Promise.all([
            fetch('/get-categorias'),
            fetch('/get-produtos'),
            fetch('/get-adicionais') // Endpoint assumido para o novo sistema
        ]);

        const categorias = await resCat.json();
        const produtos = await resProd.json();
        const adicionais = await resAdic.json();
        
        listaProdutosLocal = produtos;
        listaAdicionaisLocal = adicionais;

        // Renderiza Itens
        const listaItens = document.getElementById('lista-hierarquica-itens');
        listaItens.innerHTML = "";
        ["Promoção", "Mais Comprados"].forEach(nome => renderizarItemCategoria({ nome, fixa: true, _id: nome }, produtos, listaItens));
        categorias.forEach(cat => {
            if (!["Promoção", "Mais Comprados", "Todos", "Defina um nome"].includes(cat.nome)) {
                renderizarItemCategoria(cat, produtos, listaItens);
            }
        });

        // Renderiza Adicionais
        const listaAdic = document.getElementById('lista-hierarquica-adicionais');
        listaAdic.innerHTML = "";
        adicionais.forEach(catAd => renderizarItemCategoriaAdicional(catAd, listaAdic));

    } catch (err) { console.error("Erro ao carregar dados:", err); }
}

// --- 3. RENDERIZAÇÃO DE CATEGORIAS (ITENS E ADICIONAIS) ---

function renderizarItemCategoria(cat, todosProdutos, container) {
    const produtosDaCat = todosProdutos.filter(p => p.categoria === cat.nome);
    const div = document.createElement('div');
    div.className = "item-categoria-container";
    div.innerHTML = `
        <div class="categoria-header">
            <div class="cat-info" onclick="toggleExpandir('itens-${cat.nome}')">
                <span class="seta" id="seta-itens-${cat.nome}">▲</span>
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
        <div class="produtos-lista" id="lista-prod-itens-${cat.nome}" style="display:none;">
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
    container.appendChild(div);
}

function renderizarItemCategoriaAdicional(catAd, container) {
    const temDesconto = catAd.itens.some(i => i.precoDesconto > 0);
    const div = document.createElement('div');
    div.className = "item-categoria-container";
    div.innerHTML = `
        <div class="categoria-header">
            <div class="cat-info" onclick="toggleExpandir('adic-${catAd._id}')">
                <span class="seta" id="seta-adic-${catAd._id}">▲</span>
                <span class="cat-nome">${catAd.nome}</span>
                <span class="label-obrigatorio">${catAd.obrigatorio ? 'OBRIGATÓRIO' : 'OPCIONAL'}</span>
                ${temDesconto ? '<span class="label-desconto-tag">🏷️ Desconto aplicado</span>' : ''}
            </div>
            <div class="dropdown">
                <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer;">⋮</button>
                <div class="dropdown-content">
                    <a href="#" onclick="abrirEditarCatAdicional('${catAd._id}')">Editar</a>
                    <a href="#" onclick="excluirCatAdicional('${catAd._id}')">Excluir</a>
                    <a href="#" onclick="duplicarCatAdicional('${catAd._id}')">Duplicar</a>
                </div>
            </div>
        </div>
        <div class="produtos-lista" id="lista-prod-adic-${catAd._id}" style="display:none;">
            <button class="btn-add-produto" onclick="abrirCriarItemAdicional('${catAd._id}')">+ Criar Adicional em ${catAd.nome}</button>
            <div id="itens-adic-${catAd._id}">
                ${catAd.itens.map(i => `
                    <div class="produto-linha" onclick="abrirEditarItemAdicional('${catAd._id}', '${i.id}')">
                        <div class="prod-info-wrapper">
                            <div class="prod-txt-container">
                                <span class="prod-nome-txt">${i.nome} ${i.status === 'indisponivel' ? '<small style="color:red">(Indisponível)</small>' : ''}</span>
                                <span class="prod-preco-txt">
                                    ${i.precoDesconto > 0 ? `<span class="preco-riscado">R$ ${i.preco.toFixed(2)}</span> R$ ${i.precoDesconto.toFixed(2)}` : `R$ ${i.preco.toFixed(2)}`}
                                </span>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer;">⋮</button>
                            <div class="dropdown-content">
                                <a href="#" onclick="excluirItemAdicional('${catAd._id}', '${i.id}')">Excluir</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    container.appendChild(div);
}

// --- 4. MODAIS E LÓGICA DE EDIÇÃO ---

function abrirEditarCatAdicional(id) {
    const cat = listaAdicionaisLocal.find(c => c._id === id);
    document.getElementById('modal-titulo').innerText = "Configurar Categoria de Adicional";
    document.getElementById('modal-body-content').innerHTML = `
        <div class="input-group">
            <label>Nome da Categoria</label>
            <input type="text" id="cat-ad-nome" value="${cat.nome}">
        </div>
        <div class="input-group">
            <label>Tipo de Seleção</label>
            <select id="cat-ad-obrigatorio">
                <option value="false" ${!cat.obrigatorio ? 'selected' : ''}>Opcional (Cliente escolhe se quiser)</option>
                <option value="true" ${cat.obrigatorio ? 'selected' : ''}>Obrigatório (Cliente deve escolher)</option>
            </select>
        </div>
        <hr>
        <div class="toggle-item">
            <strong>Vincular aos Produtos</strong>
            <label class="switch">
                <input type="checkbox" id="cat-ad-vincular-toggle" onchange="toggleListaVinculoProdutos()">
                <span class="slider"></span>
            </label>
        </div>
        <div id="container-vinculo-produtos" class="secao-vinculo" style="display:none;">
            ${listaProdutosLocal.map(p => `
                <div class="item-vinculo">
                    <span>${p.nome} <small>(${p.categoria})</small></span>
                    <button onclick="alternarVinculoAdicional('${cat._id}', '${p._id}')" 
                        style="padding:5px 10px; border-radius:5px; border:none; background:${cat.produtosVinculados?.includes(p._id) ? '#ff4757' : '#28a745'}; color:white; cursor:pointer;">
                        ${cat.produtosVinculados?.includes(p._id) ? 'Remover' : 'Adicionar'}
                    </button>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('modal-produto').style.display = "block";
    // Salvar no botão de salvar global
    document.querySelector('.btn-salvar-modal').onclick = () => salvarCategoriaAdicional(id);
}

function abrirEdicaoProduto(id, p) {
    document.getElementById('modal-titulo').innerText = "Editar Produto";
    document.getElementById('modal-body-content').innerHTML = `
        <input type="hidden" id="p-id" value="${id}">
        <input type="hidden" id="p-img-data" value="${p.img || ''}">
        <input type="hidden" id="p-categoria-origem" value="${p.categoria}">
        <div class="upload-area">
            <img id="p-preview" src="${p.img || ''}" style="width: 150px; height: 150px; object-fit: cover; border-radius:10px; margin-bottom:10px; ${p.img ? '' : 'display:none;'}">
            <input type="file" id="p-file" accept="image/*" onchange="converterImagem()" style="display:none;">
            <label for="p-file" style="cursor:pointer; color:#007bff; font-weight:bold;">📷 Selecionar Foto</label>
        </div>
        <div class="input-group">
            <label>Nome do Produto</label>
            <input type="text" id="p-nome" value="${p.nome || ''}">
        </div>
        <div class="input-group">
            <label>Descrição</label>
            <textarea id="p-desc" rows="3">${p.desc || ''}</textarea>
        </div>
        <div class="input-row">
            <div class="input-group">
                <label>Preço (R$)</label>
                <input type="number" id="p-preco" step="0.01" value="${p.preco || ''}">
            </div>
            <div class="input-group">
                <label>Disponibilidade</label>
                <select id="p-status">
                    <option value="disponivel" ${p.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
                    <option value="indisponivel" ${p.status === 'indisponivel' ? 'selected' : ''}>Indisponível</option>
                </select>
            </div>
        </div>
        <div class="toggle-item">
            <span>🏷️ Preço com Desconto (R$)</span>
            <input type="number" id="p-desconto" style="width:120px; padding:8px;" value="${p.desconto || ''}">
        </div>
        <div class="toggle-item">
            <div>
                <strong>Adicionar Modificadores</strong><br>
                <small style="color:#666;">Ativar acompanhamentos e extras</small>
            </div>
            <label class="switch">
                <input type="checkbox" id="p-modificador" ${p.modificadoresAtivos ? 'checked' : ''} onchange="toggleListagemAdicionaisNoProduto()">
                <span class="slider"></span>
            </label>
        </div>
        <div id="lista-vinculo-adicionais" class="secao-vinculo" style="display: ${p.modificadoresAtivos ? 'block' : 'none'};">
            ${listaAdicionaisLocal.map(catAd => `
                <div class="item-vinculo">
                    <span>${catAd.nome}</span>
                    <input type="checkbox" class="check-cat-ad" data-id="${catAd._id}" ${p.categoriasAdicionais?.includes(catAd._id) ? 'checked' : ''}>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('modal-produto').style.display = "block";
    document.querySelector('.btn-salvar-modal').onclick = () => salvarProduto();
}

// --- 5. FUNÇÕES AUXILIARES E ACTIONS ---

function fecharTodosDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
}

function menuClique(e) {
    e.stopPropagation();
    fecharTodosDropdowns();
    e.target.nextElementSibling.classList.toggle('show');
}

function toggleExpandir(id) {
    const lista = document.getElementById(`lista-prod-${id}`);
    const seta = document.getElementById(`seta-${id}`);
    const isHidden = lista.style.display === "none";
    lista.style.display = isHidden ? "block" : "none";
    seta.innerHTML = isHidden ? "▼" : "▲";
}

function toggleListaVinculoProdutos() {
    const container = document.getElementById('container-vinculo-produtos');
    container.style.display = document.getElementById('cat-ad-vincular-toggle').checked ? 'block' : 'none';
}

function toggleListagemAdicionaisNoProduto() {
    const container = document.getElementById('lista-vinculo-adicionais');
    container.style.display = document.getElementById('p-modificador').checked ? 'block' : 'none';
}

function fecharModal() {
    document.getElementById('modal-produto').style.display = "none";
}

// --- 6. PERSISTÊNCIA (SALVAR) ---

async function salvarProduto() {
    const id = document.getElementById('p-id').value;
    // Captura as categorias de adicionais marcadas
    const checks = document.querySelectorAll('.check-cat-ad:checked');
    const catsAdicionais = Array.from(checks).map(c => c.dataset.id);

    const dados = {
        nome: document.getElementById('p-nome').value,
        preco: document.getElementById('p-preco').value,
        desc: document.getElementById('p-desc').value,
        status: document.getElementById('p-status').value,
        desconto: document.getElementById('p-desconto').value,
        modificadoresAtivos: document.getElementById('p-modificador').checked,
        categoriasAdicionais: catsAdicionais,
        categoria: document.getElementById('p-categoria-origem').value,
        img: imagemBase64 || document.getElementById('p-img-data').value
    };

    const url = id ? `/edit-produto/${id}` : '/add-produto';
    const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });
    if(res.ok) { fecharModal(); carregarDadosCompletos(); }
}

async function salvarCategoriaAdicional(id) {
    const dados = {
        nome: document.getElementById('cat-ad-nome').value,
        obrigatorio: document.getElementById('cat-ad-obrigatorio').value === "true"
    };
    // Fetch para editar categoria de adicional...
    const res = await fetch(`/edit-categoria-adicional/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });
    if(res.ok) { fecharModal(); carregarDadosCompletos(); }
}

// Outras funções (excluir, duplicar, converter imagem) permanecem com a lógica original adaptada aos novos IDs
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

// Inicializa o painel
window.onload = () => renderizarPainelCategorias('meu-container-admin');