/**
 * SISTEMA DE GERENCIAMENTO DE ADICIONAIS
 * Localização: js/gerenciador-adicionais.js
 */

{
    // --- VARIÁVEIS PROTEGIDAS (Não conflitam com outros arquivos) ---
    let categoriasAdicionais = [];
    let produtosCadastrados = [
        { id: 1, nome: "Hambúrguer Artesanal" },
        { id: 2, nome: "Pizza Família" }
    ];

    const containerGeral = document.createElement('div');
    containerGeral.className = 'painel-adicionais-container';

    // Estilização com nome único para evitar conflito de CSS
    const stylesAdicionais = `
        .painel-adicionais-container { font-family: 'Segoe UI', sans-serif; padding: 20px; background: #f4f7f6; color: #333; }
        .btn-principal-ad { background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-bottom: 15px; }
        .categoria-card { background: white; margin-top: 15px; border-radius: 8px; border-left: 5px solid #27ae60; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: hidden; }
        .categoria-header { display: flex; justify-content: space-between; align-items: center; padding: 15px; cursor: pointer; }
        .categoria-header:hover { background: #f9f9f9; }
        .categoria-acoes { position: relative; }
        .menu-dot { cursor: pointer; font-size: 20px; padding: 0 10px; font-weight: bold; }
        .dropdown-menu-ad { position: absolute; right: 0; background: white; border: 1px solid #ddd; border-radius: 4px; display: none; z-index: 10; min-width: 120px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .dropdown-menu-ad.show { display: block; }
        .dropdown-item-ad { padding: 10px 15px; cursor: pointer; transition: 0.3s; font-size: 14px; }
        .dropdown-item-ad:hover { background: #f0f0f0; }
        .adicionais-lista { padding: 15px; background: #fafafa; border-top: 1px solid #eee; }
        .adicional-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; align-items: center; }
        .modal-full-ad { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; display: none; padding: 40px; box-sizing: border-box; overflow-y: auto; }
        .valor-riscado { text-decoration: line-through; color: #e74c3c; font-size: 0.9em; margin-right: 5px; }
        .valor-atual { color: #27ae60; font-weight: bold; }
    `;

    // Inserir estilos protegidos
    const styleSheetAd = document.createElement("style");
    styleSheetAd.innerText = stylesAdicionais;
    document.head.appendChild(styleSheetAd);

    // --- FUNÇÕES DE LÓGICA (Expostas via Window) ---

    window.criarCategoriaAdicional = function() {
        const nome = prompt("Digite o nome da Categoria Adicional (ex: Escolha sua Carne, Adicionais Sugeridos):");
        if (!nome) return;

        const novaCategoria = {
            id: Date.now(),
            nome: nome,
            status: 'opcional',
            produtosVinculados: [],
            adicionais: [],
            aberta: true
        };

        categoriasAdicionais.push(novaCategoria);
        window.renderizarPainelAdicionais();
    };

    window.toggleCategoriaAd = function(id) {
        const cat = categoriasAdicionais.find(c => c.id === id);
        if (cat) cat.aberta = !cat.aberta;
        window.renderizarPainelAdicionais();
    };

    window.adicionarItemAdicional = function(catId) {
        const nome = prompt("Nome do Adicional (ex: Bacon extra, Molho especial):");
        if (!nome) return;
        
        const cat = categoriasAdicionais.find(c => c.id === catId);
        cat.adicionais.push({
            id: Date.now(),
            nome: nome,
            valor: 0,
            status: 'disponivel',
            desconto: 0
        });
        window.renderizarPainelAdicionais();
    };

    window.excluirCatAd = function(id) {
        if(confirm("Deseja realmente excluir esta categoria e todos os adicionais dela?")) {
            categoriasAdicionais = categoriasAdicionais.filter(c => c.id !== id);
            window.renderizarPainelAdicionais();
        }
    };

    // --- RENDERIZAÇÃO ---

    window.renderizarPainelAdicionais = function(containerId = 'container-gerenciador-adicionais') {
        const target = document.getElementById(containerId);
        if (!target) return;

        target.innerHTML = ''; // Limpa o container original do EJS
        
        containerGeral.innerHTML = `
            <button class="btn-principal-ad" onclick="criarCategoriaAdicional()">+ Criar Categoria Adicional</button>
            <div id="lista-categorias-ad"></div>
        `;

        const lista = containerGeral.querySelector('#lista-categorias-ad');

        if (categoriasAdicionais.length === 0) {
            lista.innerHTML = `<p style="color: #888; text-align: center; padding: 20px;">Nenhuma categoria de adicional criada.</p>`;
        }

        categoriasAdicionais.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'categoria-card';
            div.innerHTML = `
                <div class="categoria-header" onclick="toggleCategoriaAd(${cat.id})">
                    <div>
                        <span style="margin-right: 10px;">${cat.aberta ? '▼' : '▶'}</span>
                        <strong>${cat.nome}</strong> 
                        <small style="background: #eee; padding: 2px 6px; border-radius: 4px; margin-left: 10px;">${cat.status.toUpperCase()}</small>
                    </div>
                    <div class="categoria-acoes" onclick="event.stopPropagation()">
                        <span class="menu-dot" onclick="this.nextElementSibling.classList.toggle('show')">⋮</span>
                        <div class="dropdown-menu-ad">
                            <div class="dropdown-item-ad" onclick="alert('Editar em breve')">Editar Nome</div>
                            <div class="dropdown-item-ad" style="color:red" onclick="excluirCatAd(${cat.id})">Excluir</div>
                        </div>
                    </div>
                </div>
                <div class="adicionais-lista" style="display: ${cat.aberta ? 'block' : 'none'}">
                    <button class="btn-principal-ad" style="background:#3498db; font-size: 12px; padding: 5px 10px;" onclick="adicionarItemAdicional(${cat.id})">+ Novo Item</button>
                    <div class="itens-adicionais-container">
                        ${cat.adicionais.length === 0 ? '<p style="font-size: 12px; color: #999;">Nenhum item nesta categoria.</p>' : ''}
                        ${cat.adicionais.map(ad => `
                            <div class="adicional-item">
                                <span>${ad.nome} <b class="valor-atual">R$ ${(ad.valor - ad.desconto).toFixed(2)}</b></span>
                                <span class="menu-dot" onclick="abrirModalEditarAdicional(${cat.id}, ${ad.id})" style="cursor:pointer">⚙️</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            lista.appendChild(div);
        });

        target.appendChild(containerGeral);
    };

    // --- MODAL DE EDIÇÃO ---

    window.abrirModalEditarAdicional = function(catId, adId) {
        const cat = categoriasAdicionais.find(c => c.id === catId);
        const ad = cat.adicionais.find(a => a.id === adId);

        const modal = document.createElement('div');
        modal.className = 'modal-full-ad';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div style="max-width: 600px; margin: auto;">
                <h2 style="border-bottom: 2px solid #27ae60; padding-bottom: 10px;">Configurar Adicional</h2>
                <p>Categoria: <b>${cat.nome}</b></p>
                
                <div style="display: grid; gap: 15px; margin-top: 20px;">
                    <div>
                        <label style="display:block; font-weight:bold;">Nome do Item:</label>
                        <input type="text" id="edit-ad-nome" value="${ad.nome}" style="width:100%; padding:10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="display:block; font-weight:bold;">Valor Bruto (R$):</label>
                            <input type="number" id="edit-ad-valor" value="${ad.valor}" step="0.01" style="width:100%; padding:10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                        <div>
                            <label style="display:block; font-weight:bold;">Desconto (R$):</label>
                            <input type="number" id="edit-ad-desc" value="${ad.desconto}" step="0.01" style="width:100%; padding:10px; border: 1px solid #ddd; border-radius: 5px;">
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-weight:bold;">Status de Disponibilidade:</label>
                        <select id="edit-ad-status" style="width:100%; padding:10px; border: 1px solid #ddd; border-radius: 5px;">
                            <option value="disponivel" ${ad.status === 'disponivel' ? 'selected' : ''}>Disponível para Venda</option>
                            <option value="indisponivel" ${ad.status === 'indisponivel' ? 'selected' : ''}>Esgotado / Ocultar</option>
                        </select>
                    </div>
                </div>

                <div style="margin-top: 30px; display: flex; gap: 10px;">
                    <button class="btn-principal-ad" onclick="salvarAlteracoesAd(${catId}, ${adId}, this.parentElement.parentElement.parentElement)">Salvar Dados</button>
                    <button class="btn-principal-ad" style="background: #95a5a6;" onclick="this.parentElement.parentElement.parentElement.remove()">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    window.salvarAlteracoesAd = function(catId, adId, modalElement) {
        const cat = categoriasAdicionais.find(c => c.id === catId);
        const ad = cat.adicionais.find(a => a.id === adId);

        ad.nome = document.getElementById('edit-ad-nome').value;
        ad.valor = parseFloat(document.getElementById('edit-ad-valor').value) || 0;
        ad.desconto = parseFloat(document.getElementById('edit-ad-desc').value) || 0;
        ad.status = document.getElementById('edit-ad-status').value;

        modalElement.remove();
        window.renderizarPainelAdicionais();
    };
}