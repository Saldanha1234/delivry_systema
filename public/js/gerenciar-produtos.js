/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS
 * Este arquivo contém as funções de Criar, Editar e Excluir itens do cardápio e Categorias.
 */

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

// --- NOVA LÓGICA DE CATEGORIAS DINÂMICAS ---

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
        carregarCategorias(); // Atualiza a lista e o select
    } else {
        alert("Erro ao salvar categoria.");
    }
}

async function carregarCategorias() {
    try {
        const res = await fetch('/get-categorias');
        let categorias = await res.json();

        // 1. Atualiza a lista de gerenciamento no Admin (se existir o elemento)
        const lista = document.getElementById('lista-categorias');
        if (lista) {
            lista.innerHTML = categorias.map(c => `
                <div class="item-categoria-linha">
                    <span>${c.nome}</span>
                    <div>
                        <button class="btn-edit" onclick="prepararEdicaoCategoria('${c._id}', '${c.nome}')">editar</button>
                        <button class="btn-delete" onclick="excluirCategoria('${c._id}')">excluir</button>
                    </div>
                </div>
            `).join('');
        }

        // 2. Atualiza o <select> de categorias no formulário de produtos
        const selectProduto = document.getElementById('p-cat');
        if (selectProduto) {
            const valorAtual = selectProduto.value;
            selectProduto.innerHTML = '<option value="">Selecione uma Categoria</option>';
            
            // Injeta as categorias vindas do servidor
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
    document.getElementById('cat-nome').focus();
    // Muda o texto do botão se necessário para indicar edição
}

async function excluirCategoria(id) {
    if (confirm("Ao excluir a categoria, os produtos vinculados a ela podem ficar sem categoria no cardápio. Continuar?")) {
        const res = await fetch(`/delete-categoria/${id}`, { method: 'DELETE' });
        if (res.ok) carregarCategorias();
    }
}

// Inicializa as categorias ao carregar a página do Admin
document.addEventListener('DOMContentLoaded', carregarCategorias);