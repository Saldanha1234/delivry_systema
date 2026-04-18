/**
 * SISTEMA DE GERENCIAMENTO DE ADICIONAIS - COMPLETO E CORRIGIDO
 * Conectado ao server.js (MongoDB)
 */

{
    let categoriasAdicionais = [];
    let produtosDoBanco = [];

    const containerGeral = document.createElement('div');
    containerGeral.className = 'painel-adicionais-container';

    // ESTILOS ATUALIZADOS E MELHORADOS
    const styleSheetAd = document.createElement("style");
    styleSheetAd.innerText = `
        .painel-adicionais-container { font-family: 'Segoe UI', sans-serif; padding: 20px; }
        .btn-principal-ad { background: #27ae60; color: white; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 20px; transition: 0.3s; }
        .btn-principal-ad:hover { background: #219150; }
        
        .categoria-card { background: white; margin-top: 15px; border-radius: 8px; border-left: 5px solid #27ae60; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow: hidden; }
        .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; cursor: pointer; background: #fff; }
        .categoria-header:hover { background: #fefefe; }
        
        .menu-dot-ad { cursor: pointer; font-size: 22px; padding: 5px 10px; color: #777; transition: 0.2s; position: relative; z-index: 10; }
        .menu-dot-ad:hover { color: #000; }
        
        .dropdown-menu-ad { position: absolute; right: 10px; background: white; border: 1px solid #ddd; border-radius: 6px; display: none; z-index: 1000; min-width: 150px; box-shadow: 0 8px 15px rgba(0,0,0,0.1); }
        .dropdown-menu-ad.show { display: block; }
        .dropdown-item-ad { padding: 12px 15px; cursor: pointer; font-size: 14px; color: #333; border-bottom: 1px solid #eee; text-align: left; }
        .dropdown-item-ad:last-child { border-bottom: none; }
        .dropdown-item-ad:hover { background: #f8f9fa; color: #27ae60; }
        
        .adicionais-lista { padding: 20px; background: #f4f7f6; border-top: 1px solid #eee; }
        
        .btn-novo-item-ad { 
            background: #fff; color: #27ae60; border: 2px dashed #27ae60; 
            padding: 10px; width: 100%; border-radius: 6px; cursor: pointer; 
            font-weight: bold; margin-bottom: 15px; transition: 0.3s;
        }
        .btn-novo-item-ad:hover { background: #27ae60; color: #fff; }

        .adicional-item { 
            display: flex; justify-content: space-between; padding: 12px 15px; 
            background: white; margin-bottom: 8px; border-radius: 6px; 
            border: 1px solid #e0e0e0; align-items: center; position: relative;
        }
        
        .modal-full-ad { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; padding: 40px; box-sizing: border-box; overflow-y: auto; display: flex; align-items: center; justify-content: center; }
        .modal-content-ad { width: 100%; max-width: 600px; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        
        .form-group-ad { margin-bottom: 15px; }
        .form-group-ad label { font-weight: bold; display: block; margin-bottom: 5px; color: #444; }
        .form-group-ad input, .form-group-ad select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
        
        .btn-vinc { border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; transition: 0.2s; }
        .btn-add-vinc { background: #e8f5e9; color: #2e7d32; }
        .btn-rem-vinc { background: #ffebee; color: #c62828; }
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
        } catch (err) { console.error("Erro ao carregar banco:", err); }
    }

    // --- CATEGORIAS ---
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

    window.abrirModalEditarCat = function(id) {
        const cat = categoriasAdicionais.find(c => c._id === id);
        const modal = document.createElement('div');
        modal.className = 'modal-full-ad';
        modal.innerHTML = `
            <div class="modal-content-ad">
                <h2>⚙️ Configurar Categoria</h2>
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
                <div style="max-height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px;">
                    ${produtosDoBanco.map(prod => {
                        const vinculado = cat.produtosVinculados.includes(prod._id);
                        return `
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #f9f9f9;">
                                <span>${prod.nome}</span>
                                <button class="btn-vinc ${vinculado ? 'btn-rem-vinc' : 'btn-add-vinc'}" onclick="vincReal('${cat._id}', '${prod._id}', ${vinculado})">
                                    ${vinculado ? 'Remover' : 'Adicionar'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top:25px;">
                    <button class="btn-principal-ad" onclick="salvarCat('${cat._id}')">Salvar</button>
                    <button class="btn-principal-ad" style="background:#ccc" onclick="this.closest('.modal-full-ad').remove()">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.vincReal = function(catId, prodId, jaVinc) {
        const cat = categoriasAdicionais.find(c => c._id === catId);
        if (jaVinc) cat.produtosVinculados = cat.produtosVinculados.filter(id => id !== prodId);
        else cat.produtosVinculados.push(prodId);
        document.querySelector('.modal-full-ad').remove();
        window.abrirModalEditarCat(catId);
    };

    window.salvarCat = async function(id) {
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

    // --- ITENS (ADICIONAIS) ---
    window.adicionarItemAdicional = async function(catId) {
        const nome = prompt("Nome do Adicional:");
        if (!nome) return;
        const cat = categoriasAdicionais.find(c => c._id === catId);
        cat.adicionais.push({ nome, valor: 0, desconto: 0, status: 'disponivel' });
        await fetch(`/edit-categoria-adicional/${catId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        carregarDados();
    };

    window.abrirModalEditarItem = function(catId, index) {
        const cat = categoriasAdicionais.find(c => c._id === catId);
        const item = cat.adicionais[index];
        const modal = document.createElement('div');
        modal.className = 'modal-full-ad';
        modal.innerHTML = `
            <div class="modal-content-ad">
                <h2>📝 Editar Adicional</h2>
                <div class="form-group-ad">
                    <label>Nome do Item</label>
                    <input type="text" id="edit-item-nome" value="${item.nome}">
                </div>
                <div class="form-group-ad">
                    <label>Preço (R$)</label>
                    <input type="number" step="0.01" id="edit-item-valor" value="${item.valor}">
                </div>
                <div style="margin-top:25px;">
                    <button class="btn-principal-ad" onclick="salvarItemReal('${catId}', ${index})">Atualizar Item</button>
                    <button class="btn-principal-ad" style="background:#ccc" onclick="this.closest('.modal-full-ad').remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.salvarItemReal = async function(catId, index) {
        const cat = categoriasAdicionais.find(c => c._id === catId);
        cat.adicionais[index].nome = document.getElementById('edit-item-nome').value;
        cat.adicionais[index].valor = parseFloat(document.getElementById('edit-item-valor').value);
        
        await fetch(`/edit-categoria-adicional/${catId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        document.querySelector('.modal-full-ad').remove();
        carregarDados();
    };

    window.removerItemReal = async function(catId, index) {
        if(!confirm("Remover este adicional?")) return;
        const cat = categoriasAdicionais.find(c => c._id === catId);
        cat.adicionais.splice(index, 1);
        await fetch(`/edit-categoria-adicional/${catId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        carregarDados();
    };

    // --- RENDER ---
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
                    <div><strong>${cat.nome}</strong> <small style="color:#27ae60">(${cat.status})</small></div>
                    <div class="categoria-acoes" onclick="event.stopPropagation()">
                        <span class="menu-dot-ad" onclick="showDropAd(event)">⋮</span>
                        <div class="dropdown-menu-ad">
                            <div class="dropdown-item-ad" onclick="abrirModalEditarCat('${cat._id}')">Editar Categoria</div>
                            <div class="dropdown-item-ad" style="color:red" onclick="excluirCatReal('${cat._id}')">Excluir</div>
                        </div>
                    </div>
                </div>
                <div id="box-${cat._id}" class="adicionais-lista" style="display:none">
                    <button class="btn-novo-item-ad" onclick="adicionarItemAdicional('${cat._id}')">+ Criar Novo Adicional em ${cat.nome}</button>
                    ${cat.adicionais.map((ad, idx) => `
                        <div class="adicional-item">
                            <span>${ad.nome} <b style="margin-left:10px; color:#27ae60">R$ ${ad.valor.toFixed(2)}</b></span>
                            <div class="categoria-acoes" onclick="event.stopPropagation()">
                                <span class="menu-dot-ad" onclick="showDropAd(event)">⋮</span>
                                <div class="dropdown-menu-ad">
                                    <div class="dropdown-item-ad" onclick="abrirModalEditarItem('${cat._id}', ${idx})">Editar Item</div>
                                    <div class="dropdown-item-ad" style="color:red" onclick="removerItemReal('${cat._id}', ${idx})">Remover</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            lista.appendChild(card);
        });
    };

    window.toggleAdLista = id => {
        const el = document.getElementById(`box-${id}`);
        if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    };

    window.showDropAd = e => {
        e.stopPropagation();
        const menu = e.target.nextElementSibling;
        const estaAberto = menu.classList.contains('show');
        
        document.querySelectorAll('.dropdown-menu-ad').forEach(d => d.classList.remove('show'));
        
        if (!estaAberto) {
            menu.classList.add('show');
        }
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