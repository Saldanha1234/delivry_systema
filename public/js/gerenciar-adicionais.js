/**
 * SISTEMA DE GERENCIAMENTO DE ADICIONAIS - CLIENT-SIDE
 * Versão Corrigida: Categorias e Adicionais funcionando de forma independente.
 */

{
    let categoriasAdicionais = [];
    let produtosDoBanco = [];

    const containerGeral = document.createElement('div');
    containerGeral.className = 'painel-adicionais-container';

    const styleSheetAd = document.createElement("style");
    styleSheetAd.innerText = `
        .painel-adicionais-container { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; }
        .btn-principal-ad { background: #670da3; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 20px; transition: 0.3s; box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3); }
        .btn-principal-ad:hover { background: #5a0c9c; transform: translateY(-2px); }
        
        .categoria-card { background: white; margin-top: 15px; border-radius: 10px; border-left: 6px solid #670da3; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: visible; position: relative; }
        .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; cursor: pointer; }
        
        .categoria-acoes { position: relative; display: flex; align-items: center; z-index: 100; }
        .menu-dot-ad { cursor: pointer; font-size: 24px; padding: 5px 12px; color: #111010; transition: 0.2s; border-radius: 50%; }
        .menu-dot-ad:hover { background: #111010; color: #670da3; }
        
        .dropdown-menu-ad { position: absolute; right: 0; top: 100%; background: white; border: 1px solid #111010; border-radius: 8px; display: none; z-index: 1000; min-width: 180px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
        .dropdown-menu-ad.show { display: block; }
        .dropdown-item-ad { padding: 12px 16px; cursor: pointer; font-size: 14px; border-bottom: 1px solid #111010; transition: 0.2s; text-align: left; }
        .dropdown-item-ad:hover { background: #111010; color: #670da3; }
        
        .adicionais-lista { padding: 20px; background: #111010; border-top: 1px solid #670da3; border-radius: 0 0 10px 10px; }
        
        .btn-novo-item-ad { background: #111010; color: #670da3; border: 2px dashed #670da3; padding: 12px; width: 100%; border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 20px; transition: 0.3s; }
        .btn-novo-item-ad:hover { background: #111010; }

        .adicional-item { display: flex; justify-content: space-between; padding: 15px; background: white; margin-bottom: 10px; border-radius: 8px; border: 1px solid #111010; align-items: center; position: relative; }
        .item-indisponivel { opacity: 0.5; background: #111010; cursor: not-allowed; }
        .badge-indisponivel { background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px; }
        
        .preco-bruto { text-decoration: line-through; color: #670da3; font-size: 13px; margin-right: 8px; }
        .preco-final { color: #111010; font-weight: bold; font-size: 15px; }

        .modal-full-ad { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-content-ad { width: 95%; max-width: 550px; background: white; padding: 35px; border-radius: 15px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .form-group-ad { margin-bottom: 20px; }
        .form-group-ad label { font-weight: 600; display: block; margin-bottom: 8px; color: #670da3; }
        .form-group-ad input, .form-group-ad select { width: 100%; padding: 14px; border: 1px solid rgba(0,0,0,0.6); border-radius: 8px; font-size: 15px; }
    `;
    document.head.appendChild(styleSheetAd);

    async function carregarDados() {
        try {
            const [resAds, resProds] = await Promise.all([
                fetch('/get-adicionais'),
                fetch('/get-produtos')
            ]);
            categoriasAdicionais = await resAds.json();
            produtosDoBanco = await resProds.json();
            window.renderizarPainelAdicionais();
        } catch (err) { console.error("Erro ao carregar:", err); }
    }

    // --- LÓGICA DE CATEGORIAS (CORRIGIDA) ---
    window.abrirModalEditarCat = function(id) {
        const cat = categoriasAdicionais.find(c => c._id === id);
        const modal = document.createElement('div');
        modal.className = 'modal-full-ad';
        modal.innerHTML = `
            <div class="modal-content-ad">
                <h2>⚙️ Configurar Categoria: ${cat.nome}</h2>
                <div class="form-group-ad">
                    <label>Nome da Categoria</label>
                    <input type="text" id="edit-cat-nome" value="${cat.nome}">
                </div>
                <div class="form-group-ad">
                    <label>Tipo de Seleção</label>
                    <select id="edit-cat-status">
                        <option value="opcional" ${cat.status === 'opcional' ? 'selected' : ''}>Opcional</option>
                        <option value="obrigatorio" ${cat.status === 'obrigatorio' ? 'selected' : ''}>Obrigatório</option>
                    </select>
                </div>
                <h3>Vincular a Produtos</h3>
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid rgba(0,0,0,0.6); padding: 10px; border-radius:8px;">
                    ${produtosDoBanco.map(prod => {
                        const vinculado = cat.produtosVinculados.includes(prod._id);
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(0,0,0,0.6);">
                                <span>${prod.nome}</span>
                                <button class="btn-principal-ad" style="padding:5px 10px; margin:0; background:${vinculado ? '#e74c3c' : '#27ae60'}" 
                                    onclick="vincularProdutoLocal('${cat._id}', '${prod._id}', ${vinculado})">
                                    ${vinculado ? 'Remover' : 'Adicionar'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top:25px; display:flex; gap:10px;">
                    <button class="btn-principal-ad" style="flex:1" onclick="salvarCategoriaLocal('${cat._id}')">Salvar</button>
                    <button class="btn-principal-ad" style="background:#888; flex:1" onclick="this.closest('.modal-full-ad').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.vincularProdutoLocal = function(catId, prodId, jaVinc) {
        const cat = categoriasAdicionais.find(c => c._id === catId);
        if (jaVinc) cat.produtosVinculados = cat.produtosVinculados.filter(id => id !== prodId);
        else cat.produtosVinculados.push(prodId);
        document.querySelector('.modal-full-ad').remove();
        window.abrirModalEditarCat(catId);
    };

    window.salvarCategoriaLocal = async function(id) {
        const cat = categoriasAdicionais.find(c => c._id === id);
        cat.nome = document.getElementById('edit-cat-nome').value;
        cat.status = document.getElementById('edit-cat-status').value;
        await fetch(`/edit-categoria-adicional/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        document.querySelector('.modal-full-ad').remove();
        carregarDados();
    };

    // --- LÓGICA DE ITENS ADICIONAIS ---
    window.abrirModalEditarItem = function(catId, index) {
        const cat = categoriasAdicionais.find(c => c._id === catId);
        const item = cat.adicionais[index];
        const modal = document.createElement('div');
        modal.className = 'modal-full-ad';
        modal.innerHTML = `
            <div class="modal-content-ad">
                <h2>📝 Editar Adicional: ${item.nome}</h2>
                <div class="form-group-ad">
                    <label>Nome do Adicional</label>
                    <input type="text" id="edit-item-nome" value="${item.nome}">
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                    <div class="form-group-ad">
                        <label>Preço Bruto (R$)</label>
                        <input type="number" step="0.01" id="edit-item-valor" value="${item.valor}">
                    </div>
                    <div class="form-group-ad">
                        <label>Com Desconto (R$)</label>
                        <input type="number" step="0.01" id="edit-item-desc" value="${item.desconto || item.valor}">
                    </div>
                </div>
                <div class="form-group-ad">
                    <label>Status</label>
                    <select id="edit-item-status">
                        <option value="disponivel" ${item.status === 'disponivel' ? 'selected' : ''}>✅ Disponível</option>
                        <option value="indisponivel" ${item.status === 'indisponivel' ? 'selected' : ''}>❌ Indisponível</option>
                    </select>
                </div>
                <div style="margin-top:25px; display:flex; gap:10px;">
                    <button class="btn-principal-ad" style="flex:1" onclick="salvarItemLocal('${catId}', ${index})">Atualizar</button>
                    <button class="btn-principal-ad" style="background:#888; flex:1" onclick="this.closest('.modal-full-ad').remove()">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.salvarItemLocal = async function(catId, index) {
        const cat = categoriasAdicionais.find(c => c._id === catId);
        const item = cat.adicionais[index];
        item.nome = document.getElementById('edit-item-nome').value;
        item.valor = parseFloat(document.getElementById('edit-item-valor').value);
        item.desconto = parseFloat(document.getElementById('edit-item-desc').value);
        item.status = document.getElementById('edit-item-status').value;

        await fetch(`/edit-categoria-adicional/${catId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        document.querySelector('.modal-full-ad').remove();
        carregarDados();
    };

    // --- RENDERIZAÇÃO ---
    window.renderizarPainelAdicionais = function(contId = 'container-gerenciador-adicionais') {
        const target = document.getElementById(contId);
        if (!target) return;
        target.innerHTML = `<button class="btn-principal-ad" onclick="criarCategoriaAdicional()">+ Nova Categoria de Adicionais</button>
                            <div id="lista-ads-montada"></div>`;
        
        const lista = target.querySelector('#lista-ads-montada');
        categoriasAdicionais.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'categoria-card';
            card.innerHTML = `
                <div class="categoria-header" onclick="toggleAdLista('${cat._id}')">
                    <div>
                        <strong>${cat.nome}</strong> 
                        <span style="color:#27ae60; margin-left:10px; font-size:12px; border:1px solid #27ae60; padding:2px 6px; border-radius:4px;">${cat.status.toUpperCase()}</span>
                    </div>
                    <div class="categoria-acoes" onclick="event.stopPropagation()">
                        <span class="menu-dot-ad" onclick="showDropAd(event)">⋮</span>
                        <div class="dropdown-menu-ad">
                            <div class="dropdown-item-ad" onclick="abrirModalEditarCat('${cat._id}')">⚙️ Configurar Categoria</div>
                            <div class="dropdown-item-ad" style="color:#e74c3c" onclick="excluirCatReal('${cat._id}')">🗑️ Excluir Categoria</div>
                        </div>
                    </div>
                </div>
                <div id="box-${cat._id}" class="adicionais-lista" style="display:none">
                    <button class="btn-novo-item-ad" onclick="adicionarItemAdicional('${cat._id}')">+ Novo item em ${cat.nome}</button>
                    ${cat.adicionais.map((ad, idx) => {
                        const temDesconto = ad.desconto && ad.desconto < ad.valor;
                        const indisponivel = ad.status === 'indisponivel';
                        return `
                            <div class="adicional-item ${indisponivel ? 'item-indisponivel' : ''}">
                                <div>
                                    <span style="font-weight:600">${ad.nome}</span>
                                    ${indisponivel ? '<span class="badge-indisponivel">INDISPONÍVEL</span>' : ''}
                                    <div style="margin-top:4px;">
                                        ${temDesconto ? `<span class="preco-bruto">R$ ${ad.valor.toFixed(2)}</span>` : ''}
                                        <span class="preco-final">R$ ${(temDesconto ? ad.desconto : ad.valor).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div class="categoria-acoes" onclick="event.stopPropagation()">
                                    <span class="menu-dot-ad" onclick="showDropAd(event)">⋮</span>
                                    <div class="dropdown-menu-ad">
                                        <div class="dropdown-item-ad" onclick="abrirModalEditarItem('${cat._id}', ${idx})">✏️ Editar Item</div>
                                        <div class="dropdown-item-ad" style="color:#e74c3c" onclick="removerItemReal('${cat._id}', ${idx})">🗑️ Remover</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            lista.appendChild(card);
        });
    };

    // --- AUXILIARES ---
    window.showDropAd = e => {
        e.stopPropagation();
        const menu = e.target.nextElementSibling;
        const jaAberto = menu.classList.contains('show');
        document.querySelectorAll('.dropdown-menu-ad').forEach(d => d.classList.remove('show'));
        if (!jaAberto) menu.classList.add('show');
    };

    window.toggleAdLista = id => {
        const el = document.getElementById(`box-${id}`);
        if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    };

    window.criarCategoriaAdicional = async function() {
        const nome = prompt("Nome da Categoria:");
        if (!nome) return;
        await fetch('/add-categoria-adicional', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, status: 'opcional', produtosVinculados: [], adicionais: [] })
        });
        carregarDados();
    };

    window.adicionarItemAdicional = async function(catId) {
        const nome = prompt("Nome do Item:");
        if (!nome) return;
        const cat = categoriasAdicionais.find(c => c._id === catId);
        cat.adicionais.push({ nome, valor: 0, desconto: 0, status: 'disponivel' });
        await fetch(`/edit-categoria-adicional/${catId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        carregarDados();
    };

    window.removerItemReal = async (catId, idx) => {
        if(!confirm("Remover este item?")) return;
        const cat = categoriasAdicionais.find(c => c._id === catId);
        cat.adicionais.splice(idx, 1);
        await fetch(`/edit-categoria-adicional/${catId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        carregarDados();
    };

    window.excluirCatReal = async id => {
        if(!confirm("Excluir categoria?")) return;
        await fetch(`/delete-categoria-adicional/${id}`, { method: 'DELETE' });
        carregarDados();
    };

    window.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu-ad').forEach(d => d.classList.remove('show'));
    });

    carregarDados();
}