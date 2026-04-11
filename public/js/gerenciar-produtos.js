/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS E CATEGORIAS
 * Este arquivo contém as funções de Criar, Editar e Excluir itens do cardápio e Categorias.
 */

let imagemBase64 = ""; // Variável global para armazenar a imagem

// --- LÓGICA DE PRODUTOS (MANTIDA ORIGINAL COM AJUSTES DE ROTA) ---

function converterImagem() {
    const file = document.getElementById('p-file').files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
        imagemBase64 = reader.result;
        document.getElementById('p-img-data').value = reader.result;
    }
    if (file) reader.readAsDataURL(file);
}

// Função para controlar a exibição do campo de regra de desconto
function toggleDescontoField() {
    const tipo = document.getElementById('p-tipo-desconto').value;
    const container = document.getElementById('container-regra-desconto');
    if (tipo === "todos" || tipo === "unico") {
        container.style.display = "block";
    } else {
        container.style.display = "none";
    }
}

async function salvarProduto() {
    const id = document.getElementById('p-id').value;
    const dados = {
        nome: document.getElementById('p-nome').value,
        preco: document.getElementById('p-preco').value,
        categoria: document.getElementById('p-cat').value,
        desc: document.getElementById('p-desc').value,
        img: imagemBase64 || document.getElementById('p-img-data').value,
        // Novos campos de desconto
        tipoDesconto: document.getElementById('p-tipo-desconto').value,
        regraDesconto: document.getElementById('p-regra-desconto').value
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
    document.getElementById('form-title').innerText = "📝 Editando: " + p.nome;
    document.getElementById('p-id').value = p._id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-preco').value = p.preco;
    document.getElementById('p-cat').value = p.categoria;
    document.getElementById('p-desc').value = p.desc || "";
    document.getElementById('p-img-data').value = p.img;
    
    // Preenchimento dos novos campos de desconto na edição
    document.getElementById('p-tipo-desconto').value = p.tipoDesconto || "nenhum";
    document.getElementById('p-regra-desconto').value = p.regraDesconto || "";
    toggleDescontoField();

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

    try {
        const res = await fetch(url, {
            method: method,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nome })
        });

        if (res.ok) {
            document.getElementById('cat-id').value = "";
            document.getElementById('cat-nome').value = "";
            const btn = document.getElementById('btn-salvar-cat');
            if(btn) btn.innerText = "CRIAR CATEGORIA";
            carregarCategorias();
        } else {
            alert("Erro ao salvar categoria.");
        }
    } catch (err) {
        console.error("Erro ao salvar categoria:", err);
    }
}

async function carregarCategorias() {
    try {
        const res = await fetch('/get-categorias');
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            console.warn("Aguardando o servidor processar as rotas de categoria...");
            return;
        }

        let categoriasDoBanco = await res.json();

        // --- LÓGICA DE CATEGORIAS FIXAS (PROMOÇÃO E DESTAQUES/MAIS VENDIDOS) ---
        const categoriasFixas = [
            { nome: "Promoção" },
            { nome: "Destaques" }
        ];

        // 1. Atualiza a lista de gerenciamento no Admin
        const lista = document.getElementById('lista-categorias');
        if (lista) {
            lista.innerHTML = categoriasDoBanco.map(c => `
                <div class="item-categoria-linha" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                    <span><strong>${c.nome}</strong></span>
                    <div>
                        <button class="btn-edit" style="padding: 4px 8px; font-size: 10px;" onclick="prepararEdicaoCategoria('${c._id}', '${c.nome}')">EDITAR</button>
                        <button class="btn-del" style="padding: 4px 8px; font-size: 10px;" onclick="excluirCategoria('${c._id}')">EXCLUIR</button>
                    </div>
                </div>
            `).join('');
        }

        // 2. Atualiza o <select> no formulário de produtos
        const selectProduto = document.getElementById('p-cat');
        if (selectProduto) {
            const valorAtual = selectProduto.value;
            selectProduto.innerHTML = '<option value="">Selecione uma Categoria</option>';
            
            categoriasFixas.forEach(f => {
                selectProduto.innerHTML += `<option value="${f.nome}">${f.nome}</option>`;
            });

            categoriasDoBanco.forEach(c => {
                selectProduto.innerHTML += `<option value="${c.nome}">${c.nome}</option>`;
            });

            if (valorAtual) selectProduto.value = valorAtual;
        }
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

function prepararEdicaoCategoria(id, nome) {
    const inputId = document.getElementById('cat-id');
    const inputNome = document.getElementById('cat-nome');
    const btn = document.getElementById('btn-salvar-cat');

    if(inputId && inputNome && btn) {
        inputId.value = id;
        inputNome.value = nome;
        btn.innerText = "ATUALIZAR CATEGORIA";
        inputNome.focus();
    }
}

async function excluirCategoria(id) {
    if (confirm("Ao excluir a categoria, os produtos vinculados a ela podem ficar sem categoria. Continuar?")) {
        try {
            const res = await fetch(`/delete-categoria/${id}`, { method: 'DELETE' });
            if (res.ok) carregarCategorias();
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
});