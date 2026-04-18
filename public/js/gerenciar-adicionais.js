/**
 * SISTEMA DE GERENCIAMENTO DE ADICIONAIS - CLIENT-SIDE
 * Conectado ao server.js (MongoDB)
 */

{
    let categoriasAdicionais = [];
    let produtosDoBanco = [];

    const containerGeral = document.createElement('div');
    containerGeral.className = 'painel-adicionais-container';

    // Estilos protegidos para não conflitar com gerenciar-produtos.js
    const styleSheetAd = document.createElement("style");
    styleSheetAd.innerText = `
        .painel-adicionais-container { font-family: 'Segoe UI', sans-serif; padding: 20px; }
        .btn-principal-ad { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 15px; }
        .categoria-card { background: white; margin-top: 15px; border-radius: 8px; border-left: 5px solid #27ae60; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; cursor: pointer; }
        .categoria-acoes { position: relative; }
        .menu-dot-ad { cursor: pointer; font-size: 20px; padding: 0 10px; font-weight: bold; }
        .dropdown-menu-ad { position: absolute; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; display: none; z-index: 100; min-width: 140px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .dropdown-menu-ad.show { display: block; }
        .dropdown-item-ad { padding: 10px 15px; cursor: pointer; font-size: 14px; color: #333; }
        .dropdown-item-ad:hover { background: #f0f0f0; }
        .adicionais-lista { padding: 15px; background: #fafafa; border-top: 1px solid #eee; }
        .adicional-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; align-items: center; }
        .modal-full-ad { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; padding: 40px; box-sizing: border-box; overflow-y: auto; }
        .prod-vinculo-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
        .btn-vinc { border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; min-width: 100px; }
        .btn-add-vinc { background: #27ae60; color: white; }
        .btn-rem-vinc { background: #e74c3c; color: white; }
    `;
    document.head.appendChild(styleSheetAd);

    // --- FUNÇÃO PARA CARREGAR DADOS DO SEU SERVER.JS ---
    async function carregarDados() {
        try {
            const [resAds, resProds] = await Promise.all([
                fetch('/get-adicionais'),
                fetch('/get-produtos')
            ]);
            categoriasAdicionais = await resAds.json();
            produtosDoBanco = await resProds.json();
            window.renderizarPainelAdicionais();
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        }
    }

    // --- LÓGICA DE CATEGORIA ---
    window.criarCategoriaAdicional = async function() {
        const nome = prompt("Nome da Categoria Adicional:");
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
            <div style="max-width: 800px; margin: auto;">
                <h2>Configurar Categoria: ${cat.nome}</h2>
                <hr>
                <div style="margin-top: 20px;">
                    <label><b>Nome da Categoria:</b></label><br>
                    <input type="text" id="edit-cat-nome" value="${cat.nome}" style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:4px;">
                </div>
                <div style="margin-top: 20px;">
                    <label><b>Obrigatoriedade:</b></label><br>
                    <select id="edit-cat-status" style="width:100%; padding:10px; margin-top:5px; border:1px solid #ccc; border-radius:4px;">
                        <option value="opcional" ${cat.status === 'opcional' ? 'selected' : ''}>Opcional</option>
                        <option value="obrigatorio" ${cat.status === 'obrigatorio' ? 'selected' : ''}>Obrigatório</option>
                    </select>
                </div>

                <h3 style="margin-top: 30px;">Vincular a Produtos (Lista do Banco)</h3>
                <div style="border: 1px solid #ddd; padding: 10px; max-height: 300px; overflow-y: auto; background: #fff;">
                    ${produtosDoBanco.map(prod => {
                        const estaVinculado = cat.produtosVinculados.includes(prod._id);
                        return `
                            <div class="prod-vinculo-item">
                                <span>${prod.nome}</span>
                                <button class="btn-vinc ${estaVinculado ? 'btn-rem-vinc' : 'btn-add-vinc'}" 
                                    onclick="toggleVinculoReal('${cat._id}', '${prod._id}', ${estaVinculado})">
                                    ${estaVinculado ? '− Remover' : '+ Adicionar'}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="margin-top: 30px; display: flex; gap: 10px;">
                    <button class="btn-principal-ad" onclick="salvarCatNoBanco('${cat._id}')">Salvar Alterações</button>
                    <button class="btn-principal-ad" style="background:#999" onclick="this.parentElement.parentElement.parentElement.remove()">Fechar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.toggleVinculoReal = function(catId, prodId, jaVinculado) {
        const cat = categoriasAdicionais.find(c => c._id === catId);
        if (jaVinculado) {
            cat.produtosVinculados = cat.produtosVinculados.filter(id => id !== prodId);
        } else {
            cat.produtosVinculados.push(prodId);
        }
        // Recarrega o modal para atualizar os botões
        const modal = document.querySelector('.modal-full-ad');
        if (modal) { modal.remove(); window.abrirModalEditarCat(catId); }
    };

    window.salvarCatNoBanco = async function(id) {
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

    window.excluirCatAd = async function(id) {
        if (!confirm("Deseja excluir esta categoria e todos os adicionais dela?")) return;
        await fetch(`/delete-categoria-adicional/${id}`, { method: 'DELETE' });
        carregarDados();
    };

    // --- LÓGICA DE ITENS (ADICIONAIS) ---
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

    // --- RENDERIZAÇÃO ---
    window.renderizarPainelAdicionais = function(containerId = 'container-gerenciador-adicionais') {
        const target = document.getElementById(containerId);
        if (!target) return;
        target.innerHTML = '';

        containerGeral.innerHTML = `
            <button class="btn-principal-ad" onclick="criarCategoriaAdicional()">+ Criar Categoria Adicional</button>
            <div id="lista-categorias-ad"></div>
        `;

        const lista = containerGeral.querySelector('#lista-categorias-ad');

        categoriasAdicionais.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'categoria-card';
            div.innerHTML = `
                <div class="categoria-header" onclick="toggleDisplayAd('${cat._id}')">
                    <div>
                        <span id="seta-${cat._id}">▲</span>
                        <strong>${cat.nome}</strong> 
                        <small>(${cat.status})</small>
                    </div>
                    <div class="categoria-acoes" onclick="event.stopPropagation()">
                        <span class="menu-dot-ad" onclick="toggleDropdownAd('${cat._id}')">⋮</span>
                        <div id="drop-${cat._id}" class="dropdown-menu-ad">
                            <div class="dropdown-item-ad" onclick="abrirModalEditarCat('${cat._id}')">Editar</div>
                            <div class="dropdown-item-ad" style="color:red" onclick="excluirCatAd('${cat._id}')">Excluir</div>
                        </div>
                    </div>
                </div>
                <div id="lista-itens-${cat._id}" class="adicionais-lista" style="display: none">
                    <button onclick="adicionarItemAdicional('${cat._id}')">+ Criar Adicional</button>
                    <div style="margin-top:10px;">
                        ${cat.adicionais.map(ad => `
                            <div class="adicional-item">
                                <span>${ad.nome} - R$ ${ad.valor}</span>
                                <div class="categoria-acoes">
                                    <span class="menu-dot-ad" onclick="toggleDropdownAd('${ad._id || Math.random()}')">⋮</span>
                                    <div class="dropdown-menu-ad">
                                        <div class="dropdown-item-ad">Editar</div>
                                        <div class="dropdown-item-ad" style="color:red">Excluir</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });
        target.appendChild(containerGeral);
    };

    // Funções auxiliares de interface
    window.toggleDisplayAd = function(id) {
        const el = document.getElementById(`lista-itens-${id}`);
        const seta = document.getElementById(`seta-${id}`);
        const isHidden = el.style.display === 'none';
        el.style.display = isHidden ? 'block' : 'none';
        seta.innerText = isHidden ? '▼' : '▲';
    };

    window.toggleDropdownAd = function(id) {
        event.stopPropagation();
        document.querySelectorAll('.dropdown-menu-ad').forEach(d => d.classList.remove('show'));
        const drop = event.target.nextElementSibling;
        if (drop) drop.classList.toggle('show');
    };

    window.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-menu-ad').forEach(d => d.classList.remove('show'));
    });

    // Início
    carregarDados();
}