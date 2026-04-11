/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS (UI AVANÇADA)
 */

let imagemBase64 = ""; 

// --- LÓGICA DE PRODUTOS (MANTIDA ORIGINAL) ---

function converterImagem() {
    const file = document.getElementById('p-file').files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        imagemBase64 = reader.result;
        document.getElementById('p-img-data').value = reader.result;
    }
    if (file) reader.readAsDataURL(file);
}

async function salvarProduto() {
    const id = document.getElementById('p-id').value;
    const dados = {
        nome: document.getElementById('p-nome').value,
        preco: document.getElementById('p-preco').value,
        categoria: document.getElementById('p-cat').value,
        desc: document.getElementById('p-desc').value,
        img: imagemBase64 || document.getElementById('p-img-data').value
    };

    const url = id ? `/edit-produto/${id}` : '/add-produto';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(dados)
        });

        if(res.ok) {
            location.reload();
        } else {
            alert("Erro ao salvar produto.");
        }
    } catch (err) {
        console.error("Erro na requisição:", err);
    }
}

function prepararEdicao(p) {
    // Agora o formulário/modal deve estar visível para editar
    document.getElementById('form-title').innerText = "📝 Editando: " + p.nome;
    document.getElementById('p-id').value = p._id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-cat').value = p.categoria;
    document.getElementById('p-desc').value = p.desc || "";
    document.getElementById('p-img-data').value = p.img;
    document.getElementById('btn-submit').innerText = "ATUALIZAR";
    
    // Se você usa modal do Bootstrap ou similar, abra-o aqui:
    // $('#seuModal').modal('show');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluirProduto(id) {
    if(confirm("Deseja realmente excluir este item?")) {
        const res = await fetch(`/delete-produto/${id}`, { method: 'DELETE' });
        if(res.ok) {
            location.reload();
        } else {
            alert("Erro ao excluir produto.");
        }
    }
}

// --- NOVA INTERFACE ORGANIZADA POR CATEGORIAS ---

/**
 * Esta função substitui a lista gigante por uma lista de categorias colapsáveis.
 * Ela deve ser chamada no DOMContentLoaded ou após carregar produtos e categorias.
 */
async function renderizarInterfaceAgrupada() {
    const container = document.getElementById('lista-categorias');
    if (!container) return;

    try {
        const resCat = await fetch('/get-categorias');
        const categorias = await resCat.json();
        
        const resProd = await fetch('/get-produtos'); // Supondo que você tenha essa rota
        const produtos = await resProd.json();

        container.innerHTML = ""; // Limpa a lista

        categorias.forEach(cat => {
            const produtosDaCat = produtos.filter(p => p.categoria === cat.nome);
            
            const divCat = document.createElement('div');
            divCat.className = 'categoria-group mb-2';
            divCat.innerHTML = `
                <div class="cat-header" style="display: flex; align-items: center; background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 5px; cursor: pointer;">
                    
                    <div class="dropdown" style="margin-right: 15px;">
                        <span onclick="toggleMenuCat(event, '${cat._id}')" style="cursor:pointer; font-weight:bold;">⋮</span>
                        <div id="menu-${cat._id}" class="menu-cat-options" style="display:none; position:absolute; background:white; border:1px solid #ccc; z-index:10; box-shadow: 2px 2px 5px rgba(0,0,0,0.1);">
                            <div style="padding: 5px 10px; color: red;" onclick="excluirCategoria('${cat._id}')">Excluir</div>
                            <div style="padding: 5px 10px;" onclick="duplicarCategoria('${cat._id}', '${cat.nome}')">Duplicar</div>
                        </div>
                    </div>

                    <input type="text" value="${cat.nome}" 
                        style="border:none; background:transparent; font-weight:bold; flex-grow:1;" 
                        onblur="salvarNomeCategoria('${cat._id}', this.value)"
                        onclick="event.stopPropagation()">

                    <span class="seta-cat" onclick="toggleConteudo(this)" style="transition: 0.3s; padding: 0 10px;">▲</span>
                </div>

                <div class="cat-content" style="display:none; padding: 15px; border: 1px solid #eee; border-top:none;">
                    <div class="lista-produtos-interna">
                        ${produtosDaCat.map(p => `
                            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0f0f0; padding: 8px 0;">
                                <span>${p.nome} - R$ ${p.preco}</span>
                                <div>
                                    <button onclick="prepararEdicao(${JSON.stringify(p).replace(/"/g, '&quot;')})">Editar</button>
                                    <button onclick="excluirProduto('${p._id}')" style="color:red">Sair</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn-sucesso" style="margin-top:10px; width:100%;" onclick="abrirModalCriarNoCat('${cat.nome}')">+ CRIAR PRODUTO</button>
                </div>
            `;
            container.appendChild(divCat);
        });

    } catch (err) {
        console.error("Erro ao montar interface:", err);
    }
}

// --- FUNÇÕES AUXILIARES DA NOVA INTERFACE ---

function toggleConteudo(seta) {
    const content = seta.closest('.categoria-group').querySelector('.cat-content');
    if (content.style.display === "none") {
        content.style.display = "block";
        seta.style.transform = "rotate(180deg)";
    } else {
        content.style.display = "none";
        seta.style.transform = "rotate(0deg)";
    }
}

function toggleMenuCat(event, id) {
    event.stopPropagation();
    const menu = document.getElementById(`menu-${id}`);
    menu.style.display = menu.style.display === "none" ? "block" : "none";
}

async function salvarNomeCategoria(id, novoNome) {
    if (!novoNome) return;
    try {
        await fetch(`/edit-categoria/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nome: novoNome })
        });
        carregarCategorias(); // Atualiza os selects
    } catch (err) { console.error(err); }
}

function abrirModalCriarNoCat(nomeCat) {
    document.getElementById('p-id').value = ""; // Limpa ID (novo produto)
    document.getElementById('p-cat').value = nomeCat; // Seta a categoria automaticamente
    document.getElementById('form-title').innerText = "Novo Produto em: " + nomeCat;
    // Aqui você chama a função para mostrar seu modal ou rola até o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function duplicarCategoria(id, nome) {
    const novoNome = nome + " (Cópia)";
    try {
        await fetch('/add-categoria', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nome: novoNome })
        });
        location.reload();
    } catch (err) { console.error(err); }
}

// --- LÓGICA DE CATEGORIAS (ADAPTADA) ---

async function salvarCategoria() {
    const id = document.getElementById('cat-id').value;
    const nome = document.getElementById('cat-nome').value || "Nova Categoria";

    const url = id ? `/edit-categoria/${id}` : '/add-categoria';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nome })
        });

        if (res.ok) {
            location.reload();
        }
    } catch (err) { console.error(err); }
}

async function excluirCategoria(id) {
    if (confirm("Excluir categoria e seus vínculos?")) {
        try {
            const res = await fetch(`/delete-categoria/${id}`, { method: 'DELETE' });
            if (res.ok) location.reload();
        } catch (err) { console.error(err); }
    }
}

async function carregarCategorias() {
    // Esta função agora foca apenas em atualizar os SELECTS de produtos
    try {
        const res = await fetch('/get-categorias');
        const categoriasDoBanco = await res.json();
        const selectProduto = document.getElementById('p-cat');
        
        if (selectProduto) {
            selectProduto.innerHTML = '<option value="">Selecione uma Categoria</option>';
            categoriasDoBanco.forEach(c => {
                selectProduto.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
            });
        }
    } catch (error) { console.error(error); }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
    renderizarInterfaceAgrupada();
});