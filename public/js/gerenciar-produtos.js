/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS - COM GESTÃO DE ADICIONAIS INDEPENDENTE
 */

let imagemBase64 = ""; 
let listaProdutosLocal = []; 
let listaAdicionaisGlobal = []; // Novo: Armazena o banco de adicionais

// --- 0. INJEÇÃO DE CSS ---
const styles = `
    .painel-duplo-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; max-width: 1400px; margin: 10px auto; font-family: sans-serif; }
    @media (max-width: 900px) { .painel-duplo-layout { grid-template-columns: 1fr; } }

    .painel-unico-admin { background: var(--bg); padding: 15px; border-radius: 8px; border: 1px solid var(--border-color); }
    .header-painel { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .btn-add-principal { background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
    
    /* Banco de Adicionais Lateral */
    .coluna-adicionais-fixa { background: var(--white); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color); position: sticky; top: 10px; height: fit-content; }
    .adicional-item-banco { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; font-size: 0.9em; }
    .btn-del-mini { color: #e74c3c; border: none; background: none; cursor: pointer; font-weight: bold; }

    /* Estilos de Cardápio Originais */
    .item-categoria-container { background: var(--white); margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid var(--border-color); overflow: hidden; }
    .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid var(--border-color); }
    .cat-info { display: flex; align-items: center; cursor: pointer; flex-grow: 1; }
    .seta { margin-right: 15px; font-weight: bold; transition: 0.3s; color: var(--primary); }
    .cat-nome { font-weight: bold; font-size: 1.1em; color: var(--text-main); }
    
    .produtos-lista { padding: 10px 15px; background: var(--chat-bg); border-top: 1px solid var(--border-color); }
    .btn-add-produto { width: 100%; padding: 12px; margin-bottom: 15px; border: 2px dashed var(--border-color); background: var(--white); cursor: pointer; border-radius: 6px; color: var(--text-main); font-weight: bold; }
    
    .produto-linha { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color); background: var(--white); margin-bottom: 8px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .prod-img-min { width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 15px; background: #eee; }
    
    /* Modal e Checkboxes */
    .modal-fullscreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--white); z-index: 10000; overflow-y: auto; color: var(--text-main); }
    .modal-content header { display: flex; justify-content: space-between; align-items: center; padding: 15px 25px; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; background: var(--white); z-index: 10; }
    .grid-vinculo-adicionais { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-top: 15px; }
    .checkbox-card { border: 1px solid var(--border-color); padding: 10px; border-radius: 6px; display: flex; align-items: center; gap: 10px; cursor: pointer; background: #f9f9f9; }

    /* Dropdown original */
    .dropdown { position: relative; display: inline-block; }
    .dropdown-content { display: none; position: absolute; right: 0; top: 100%; background: white; min-width: 150px; box-shadow: 0 8px 16px rgba(0,0,0,0.2); z-index: 999; border-radius: 6px; border: 1px solid #ddd; }
    .dropdown-content.show { display: block; }
    .dropdown-content a { color: #333; padding: 12px 16px; text-decoration: none; display: block; font-size: 14px; border-bottom: 1px solid #eee; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// --- 1. RENDERIZAÇÃO INICIAL ---

window.renderizarPainelCategorias = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="painel-duplo-layout" onclick="fecharTodosDropdowns(event)">
            
            <div class="painel-unico-admin">
                <div class="header-painel">
                    <h3 style="margin:0;">Gerenciar Cardápio</h3>
                    <button class="btn-add-principal" onclick="criarNovaCategoria()">+ Categoria</button>
                </div>
                <div id="lista-hierarquica">
                    <p style="text-align:center; padding:20px; color:#888;">Carregando...</p>
                </div>
            </div>

            <div class="coluna-adicionais-fixa">
                <h3 style="margin-top:0;">✨ Banco de Adicionais</h3>
                <p style="font-size:0.8rem; color:#888; margin-bottom:15px;">Cadastre aqui os itens extras que podem ser usados nos produtos.</p>
                
                <div style="display:grid; gap:8px; margin-bottom:20px; background:#f0f0f0; padding:10px; border-radius:6px;">
                    <input type="text" id="banco-add-nome" placeholder="Nome (Ex: Bacon)" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
                    <div style="display:flex; gap:5px;">
                        <input type="number" id="banco-add-preco" placeholder="R$ 0.00" step="0.01" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:4px;">
                        <button onclick="salvarNovoAdicionalNoBanco()" style="background:var(--dark); color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">CRIAR</button>
                    </div>
                </div>

                <div id="lista-banco-adicionais-global" style="max-height:500px; overflow-y:auto;">
                    </div>
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
                        <img id="p-preview" src="" style="width: 150px; height: 150px; object-fit: cover; border-radius:12px; margin-bottom:15px; display:none; margin-left:auto; margin-right:auto;">
                        <input type="file" id="p-file" accept="image/*" onchange="converterImagem()" style="display:none;">
                        <label for="p-file" style="cursor:pointer; color:var(--info); font-weight:bold; display:block;">📷 Alterar Foto</label>
                    </div>

                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-weight:bold; margin-bottom:5px;">Nome do Item</label>
                        <input type="text" id="p-nome" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc;">
                    </div>

                    <div style="margin-bottom:15px;">
                        <label style="display:block; font-weight:bold; margin-bottom:5px;">Descrição</label>
                        <textarea id="p-desc" rows="2" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc;"></textarea>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label style="display:block; font-weight:bold;">Preço Base (R$)</label>
                            <input type="number" id="p-preco" step="0.01" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc;">
                        </div>
                        <div>
                            <label style="display:block; font-weight:bold;">Preço Promo (Opcional)</label>
                            <input type="number" id="p-desconto" step="0.01" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc;">
                        </div>
                    </div>

                    <div style="margin-bottom:20px;">
                        <label style="display:block; font-weight:bold; margin-bottom:5px;">Status</label>
                        <select id="p-status" style="width:100%; padding:10px; border-radius:6px;">
                            <option value="disponivel">✅ Disponível</option>
                            <option value="indisponivel">❌ Indisponível</option>
                        </select>
                    </div>

                    <div style="background: var(--bg); padding: 20px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong>Ativar Adicionais neste produto?</strong>
                            <input type="checkbox" id="p-modificador" onchange="togglePainelVinculo()">
                        </div>
                        
                        <div id="area-vinculo-adicionais" style="display:none; margin-top:15px; border-top:1px solid #ddd; padding-top:10px;">
                            <p style="font-size:0.85em; color:#666;">Marque abaixo os itens que o cliente pode adicionar:</p>
                            <div id="grid-checkboxes-adicionais" class="grid-vinculo-adicionais">
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    carregarDadosCompletos();
};

// --- 2. GESTÃO DO BANCO DE ADICIONAIS (CRUD PRÓPRIO) ---

async function renderizarBancoAdicionais() {
    const res = await fetch('/get-adicionais');
    listaAdicionaisGlobal = await res.json();
    
    const container = document.getElementById('lista-banco-adicionais-global');
    if(!container) return;

    container.innerHTML = listaAdicionaisGlobal.map(ad => `
        <div class="adicional-item-banco">
            <span><strong>${ad.nome}</strong> (+ R$ ${parseFloat(ad.preco).toFixed(2)})</span>
            <button class="btn-del-mini" onclick="excluirAdicionalDoBanco('${ad._id}')">✕</button>
        </div>
    `).join('') || '<p style="text-align:center; color:#999; font-size:0.8em;">Nenhum adicional criado.</p>';
}

window.salvarNovoAdicionalNoBanco = async function() {
    const nome = document.getElementById('banco-add-nome').value;
    const preco = document.getElementById('banco-add-preco').value;

    if(!nome) return alert("Digite o nome do adicional!");

    const res = await fetch('/add-adicional-banco', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome, preco: preco || 0 })
    });

    if(res.ok) {
        document.getElementById('banco-add-nome').value = "";
        document.getElementById('banco-add-preco').value = "";
        renderizarBancoAdicionais();
    }
};

window.excluirAdicionalDoBanco = async function(id) {
    if(confirm("Excluir este adicional do banco de dados? Ele não aparecerá mais para novos vínculos.")) {
        await fetch(`/delete-adicional-banco/${id}`, { method: 'DELETE' });
        renderizarBancoAdicionais();
    }
};

// --- 3. LÓGICA DE CARDÁPIO E PRODUTOS ---

async function carregarDadosCompletos() {
    try {
        const [resCat, resProd] = await Promise.all([
            fetch('/get-categorias'),
            fetch('/get-produtos')
        ]);
        
        const categorias = await resCat.json();
        const produtos = await resProd.json();
        listaProdutosLocal = produtos;

        renderizarBancoAdicionais(); // Carrega o banco lateral

        const listaContainer = document.getElementById('lista-hierarquica');
        if(!listaContainer) return;
        listaContainer.innerHTML = "";

        const fixasNomes = ["Promoção", "Mais Comprados"];
        fixasNomes.forEach(nome => renderizarItemCategoria({ nome, fixa: true, _id: nome }, produtos));

        categorias.forEach(cat => {
            if (!fixasNomes.includes(cat.nome) && cat.nome !== "Todos" && cat.nome !== "Defina um nome") {
                renderizarItemCategoria(cat, produtos);
            }
        });
    } catch (err) { 
        console.error(err);
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
                <button onclick="menuClique(event)" style="border:none; background:none; font-size:20px; cursor:pointer;">⋮</button>
                <div class="dropdown-content">
                    <a href="javascript:void(0)" onclick="confirmarExclusaoCat('${cat._id}', '${cat.fixa}')" style="color:red;">Excluir Categoria</a>
                </div>
            </div>
        </div>
        <div class="produtos-lista" id="lista-prod-${cat.nome}" style="display:none;">
            <button class="btn-add-produto" onclick="abrirCriarProduto('${cat.nome}')">+ Novo em ${cat.nome}</button>
            <div id="itens-prod-${cat.nome}">
                ${produtosDaCat.map(p => `
                    <div class="produto-linha" onclick="prepararEdicao('${p._id}')">
                        <div style="display:flex; align-items:center;">
                            <img src="${p.img || ''}" class="prod-img-min" onerror="this.src='https://placehold.co/100x100?text=Sem+Foto'">
                            <div>
                                <div class="prod-nome-txt">${p.nome}</div>
                                <div class="prod-preco-txt">R$ ${parseFloat(p.preco).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button onclick="menuClique(event)" style="border:none; background:none; cursor:pointer; padding:10px;">⋮</button>
                            <div class="dropdown-content">
                                <a href="javascript:void(0)" onclick="excluirProduto('${p._id}')">Excluir</a>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    lista.appendChild(div);
}

// --- 4. EDIÇÃO E VÍNCULO ---

window.togglePainelVinculo = function() {
    const isChecked = document.getElementById('p-modificador').checked;
    document.getElementById('area-vinculo-adicionais').style.display = isChecked ? 'block' : 'none';
};

window.prepararEdicao = function(id) {
    const produto = listaProdutosLocal.find(item => item._id === id);
    if(!produto) return;

    imagemBase64 = "";
    document.getElementById('p-id').value = id;
    document.getElementById('p-nome').value = produto.nome || "";
    document.getElementById('p-desc').value = produto.desc || "";
    document.getElementById('p-preco').value = produto.preco || "";
    document.getElementById('p-status').value = produto.status || "disponivel";
    document.getElementById('p-desconto').value = produto.desconto || "";
    document.getElementById('p-categoria-origem').value = produto.categoria;
    document.getElementById('p-img-data').value = produto.img || "";

    // Foto Preview
    const preview = document.getElementById('p-preview');
    if(produto.img) { preview.src = produto.img; preview.style.display = "block"; } 
    else { preview.style.display = "none"; }

    // Logica de Adicionais (Checkboxes)
    const isModAtivo = produto.modificadoresAtivos === true;
    document.getElementById('p-modificador').checked = isModAtivo;
    window.togglePainelVinculo();

    const gridCheckboxes = document.getElementById('grid-checkboxes-adicionais');
    gridCheckboxes.innerHTML = listaAdicionaisGlobal.map(adBanco => {
        const jaVinculado = (produto.adicionais || []).some(pa => pa.nome === adBanco.nome);
        return `
            <label class="checkbox-card">
                <input type="checkbox" class="check-vinculo" 
                       data-nome="${adBanco.nome}" 
                       data-preco="${adBanco.preco}" 
                       ${jaVinculado ? 'checked' : ''}>
                <div>
                    <strong>${adBanco.nome}</strong><br>
                    <small>+ R$ ${adBanco.preco}</small>
                </div>
            </label>
        `;
    }).join('');

    document.getElementById('modal-titulo').innerText = "Editar Produto";
    document.getElementById('modal-produto').style.display = "block";
};

window.salvarProduto = async function() {
    const id = document.getElementById('p-id').value;
    
    // Captura apenas os selecionados no momento
    const selecionados = [];
    document.querySelectorAll('.check-vinculo:checked').forEach(el => {
        selecionados.push({
            nome: el.dataset.nome,
            preco: parseFloat(el.dataset.preco) || 0
        });
    });

    const dados = {
        nome: document.getElementById('p-nome').value,
        preco: document.getElementById('p-preco').value,
        desc: document.getElementById('p-desc').value,
        status: document.getElementById('p-status').value,
        desconto: document.getElementById('p-desconto').value,
        modificadoresAtivos: document.getElementById('p-modificador').checked,
        adicionais: selecionados, // Lista vinda do banco e selecionada via checkbox
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
};

// --- 5. UTILITÁRIOS ORIGINAIS MANTIDOS ---

window.abrirCriarProduto = function(catNome) {
    imagemBase64 = "";
    document.getElementById('p-id').value = "";
    document.getElementById('p-nome').value = "";
    document.getElementById('p-desc').value = "";
    document.getElementById('p-preco').value = "";
    document.getElementById('p-desconto').value = "";
    document.getElementById('p-modificador').checked = false;
    document.getElementById('p-categoria-origem').value = catNome;
    document.getElementById('p-preview').style.display = "none";
    
    // Preenche grid de adicionais vazio para novo produto
    document.getElementById('grid-checkboxes-adicionais').innerHTML = listaAdicionaisGlobal.map(adBanco => `
        <label class="checkbox-card">
            <input type="checkbox" class="check-vinculo" data-nome="${adBanco.nome}" data-preco="${adBanco.preco}">
            <div><strong>${adBanco.nome}</strong><br><small>+ R$ ${adBanco.preco}</small></div>
        </label>
    `).join('');

    window.togglePainelVinculo();
    document.getElementById('modal-titulo').innerText = "Novo Produto";
    document.getElementById('modal-produto').style.display = "block";
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

window.fecharModal = () => document.getElementById('modal-produto').style.display = "none";

window.menuClique = function(e) {
    e.stopPropagation();
    fecharTodosDropdowns();
    const content = e.target.nextElementSibling;
    if(content) content.classList.toggle('show');
};

window.fecharTodosDropdowns = () => document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));

window.excluirProduto = function(id) {
    if(confirm("Excluir produto?")) fetch(`/delete-produto/${id}`, { method: 'DELETE' }).then(() => carregarDadosCompletos());
};

window.criarNovaCategoria = async function() {
    const nome = prompt("Nome da categoria:");
    if(nome) fetch('/add-categoria', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ nome }) }).then(() => carregarDadosCompletos());
};

window.confirmarExclusaoCat = function(id, fixa) {
    if(fixa === "true" || fixa === true) return alert("Categorias fixas não podem ser removidas.");
    if(confirm("Excluir categoria e produtos?")) fetch('/delete-categoria/' + id, { method: 'DELETE' }).then(() => carregarDadosCompletos());
};