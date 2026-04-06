/**
 * LÓGICA DE GERENCIAMENTO DE PRODUTOS
 * Este arquivo contém as funções de Criar, Editar e Excluir itens do cardápio.
 */

// A variável imagemBase64 já está declarada no admin.ejs, 
// mas garantimos que ela seja manipulada corretamente aqui.

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
    
    // Rola a tela para o formulário suavemente
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