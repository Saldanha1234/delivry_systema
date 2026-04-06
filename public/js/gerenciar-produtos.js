/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS
 * Este arquivo contém as funções de Criar, Editar e Excluir itens do cardápio e Categorias.
 */

let imagemBase64 = ""; // Variável global para armazenar a imagem

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
}

function prepararEdicao(p) {
    document.getElementById('form-title').innerText = "📝 Editando: " + p.nome;
    document.getElementById('p-id').value = p._id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-cat').value = p.categoria;
    document.getElementById('p-desc').value = p.desc || "";
    document.getElementById('p-img-data').value = p.img;
    document.getElementById('btn-submit').innerText = "ATUALIZAR";
    document.getElementById('btn-cancel').style.display = "block";
    
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

function limparForm() {
    location.reload();
}

// --- NOVA LÓGICA DE CATEGORIAS DINÂMICAS (SISTEMA COMPLETO) ---

/**
 * Injeta o HTML do Painel de Criação de Categorias no Admin.
 * O admin.js deve chamar esta função passando o ID do container onde o painel deve aparecer.
 */
function renderizarPainelCategorias(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="card-gerenciamento">
            <h3>📁 Gerenciar Categorias</h3>
            <div class="form-categoria">
                <input type="hidden" id="cat-id">
                <input type="text" id="cat-nome" placeholder="Nome da Categoria (ex: Pizzas Doces)">
                <button id="btn-salvar-cat" class="btn-sucesso" onclick="salvarCategoria()">CRIAR CATEGORIA</button>
            </div>
            <div id="lista-categorias" class="lista-itens-admin">
                </div>
        </div>
    `;
    carregarCategorias();
}

async function salvarCategoria() {
    const id = document.getElementById('cat-id').value;
    const nome = document.getElementById('cat-nome').value;

    if (!nome) return alert("Digite o nome da categoria!");

    const url = id ? `/edit-categoria/${id}` : '/add-categoria';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ nome })
    });

    if (res.ok) {
        document.getElementById('cat-id').value = "";
        document.getElementById('cat-nome').value = "";
        document.getElementById('btn-salvar-cat').innerText = "CRIAR CATEGORIA";
        carregarCategorias(); 
    } else {
        alert("Erro ao salvar categoria.");
    }
}

async function carregarCategorias() {
    try {
        const res = await fetch('/get-categorias');
        let categorias = await res.json();

        // 1. Atualiza a lista de gerenciamento no Admin
        const lista = document.getElementById('lista-categorias');
        if (lista) {
            lista.innerHTML = categorias.map(c => `
                <div class="item-categoria-linha" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd;">
                    <span><strong>${c.nome}</strong></span>
                    <div>
                        <button class="btn-edit" onclick="prepararEdicaoCategoria('${c._id}', '${c.nome}')">editar</button>
                        <button class="btn-delete" onclick="excluirCategoria('${c._id}')">excluir</button>
                    </div>
                </div>
            `).join('');
        }

        // 2. Atualiza o <select> no formulário de produtos
        const selectProduto = document.getElementById('p-cat');
        if (selectProduto) {
            const valorAtual = selectProduto.value;
            selectProduto.innerHTML = '<option value="">Selecione uma Categoria</option>';
            categorias.forEach(c => {
                selectProduto.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
            });
            if (valorAtual) selectProduto.value = valorAtual;
        }
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

function prepararEdicaoCategoria(id, nome) {
    document.getElementById('cat-id').value = id;
    document.getElementById('cat-nome').value = nome;
    document.getElementById('btn-salvar-cat').innerText = "ATUALIZAR CATEGORIA";
    document.getElementById('cat-nome').focus();
}

async function excluirCategoria(id) {
    if (confirm("Ao excluir a categoria, os produtos vinculados a ela podem ficar sem categoria. Continuar?")) {
        const res = await fetch(`/delete-categoria/${id}`, { method: 'DELETE' });
        if (res.ok) carregarCategorias();
    }
}

// Inicializa ao carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
});