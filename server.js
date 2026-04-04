const express = require('express');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 
const mongoose = require('mongoose'); // Biblioteca para o Banco de Dados

const app = express();
const server = http.createServer(app); 
const io = new Server(server); 

// --- CONEXÃO COM O BANCO DE DATOS ---
// ATENÇÃO: Substitua 'SUA_URL_AQUI' pelo link que você pegou no MongoDB Atlas
const mongoURI = "SUA_URL_AQUI"; 

mongoose.connect(mongoURI)
    .then(() => console.log("✅ Conectado ao Banco de Dados MongoDB!"))
    .catch(err => console.error("❌ Erro ao conectar ao Banco:", err));

// --- SCHEMAS (ESTRUTURA DO BANCO) ---
const ProdutoSchema = new mongoose.Schema({
    nome: String,
    preco: Number,
    img: String,
    desc: String,
    categoria: String
});
const Produto = mongoose.model('Produto', ProdutoSchema);

const PedidoSchema = new mongoose.Schema({
    id: Number,
    cliente: String,
    endereco: String,
    pagamento: String,
    itens: Array,
    total: Number,
    status: { type: String, default: "Pendente" },
    hora: String,
    createdAt: { type: Date, default: Date.now }
});
const Pedido = mongoose.model('Pedido', PedidoSchema);

let suporteMensagens = []; // Chat mantido em memória (pode ser migrado depois se quiser)

// Configurações do Express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- LÓGICA DE HORÁRIO DE FUNCIONAMENTO ---
const checarAberta = () => {
    const agora = new Date();
    // Ajuste para Horário de Brasília (UTC-3) caso o servidor esteja nos EUA
    const horaBrasilia = agora.getUTCHours() - 3;
    const horaTratada = horaBrasilia < 0 ? horaBrasilia + 24 : horaBrasilia;
    
    return horaTratada >= 8 && horaTratada < 20;
};

app.use((req, res, next) => {
    res.locals.estaAberto = checarAberta();
    next();
});

// --- ROTAS PRINCIPAIS ---

app.get('/', async (req, res) => {
    try {
        const produtos = await Produto.find(); // Busca produtos do banco
        res.render('index', { produtos });
    } catch (err) { res.status(500).send("Erro ao carregar loja."); }
});

app.get('/admin', async (req, res) => {
    try {
        const pedidos = await Pedido.find().sort({ createdAt: -1 }); // Mais recentes primeiro
        const produtos = await Produto.find();
        res.render('admin', { pedidos, produtos });
    } catch (err) { res.status(500).send("Erro ao carregar admin."); }
});

// --- GERENCIAMENTO DE PRODUTOS (BANCO DE DATOS) ---

app.post('/add-produto', async (req, res) => {
    try {
        const novoProduto = new Produto(req.body);
        await novoProduto.save();
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

app.put('/edit-produto/:id', async (req, res) => {
    try {
        // No MongoDB usamos o ID interno _id para buscar e atualizar
        await Produto.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) { res.status(404).json({ success: false }); }
});

app.delete('/delete-produto/:id', async (req, res) => {
    try {
        await Produto.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

// --- STATUS E PEDIDOS (BANCO DE DATOS) ---

app.get('/status/:id', async (req, res) => {
    const pedido = await Pedido.findOne({ id: req.params.id });
    if (pedido) {
        res.render('status', { pedido });
    } else {
        res.status(404).send("Pedido não encontrado");
    }
});

app.get('/api/pedido/:id', async (req, res) => {
    const pedido = await Pedido.findOne({ id: req.params.id });
    res.json(pedido || { error: "Não encontrado" });
});

app.post('/enviar-pedido', async (req, res) => {
    if (!checarAberta()) {
        return res.status(403).json({ success: false, message: "Estamos fechados no momento!" });
    }

    try {
        const { cliente, endereco, pagamento, itens, total } = req.body;
        let itensProcessados = typeof itens === 'string' ? JSON.parse(itens) : itens;

        const novoPedido = new Pedido({
            id: Math.floor(Math.random() * 9000) + 1000,
            cliente: cliente || "Cliente Anônimo",
            endereco: endereco || "Endereço não informado",
            pagamento: pagamento || "A combinar",
            itens: Array.isArray(itensProcessados) ? itensProcessados : [],
            total: parseFloat(total) || 0,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });

        await novoPedido.save(); 
        res.json({ success: true, id: novoPedido.id });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/update-status', async (req, res) => {
    const { id, novoStatus } = req.body;
    try {
        await Pedido.findOneAndUpdate({ id: id }, { status: novoStatus });
        res.json({ success: true });
    } catch (err) { res.status(404).json({ success: false }); }
});

// CHAT (SOCKET.IO)
io.on('connection', (socket) => {
    socket.emit('historico', suporteMensagens);
    socket.on('enviarMensagem', (data) => {
        const msg = {
            usuario: data.usuario, 
            texto: data.texto,
            pedidoId: data.pedidoId,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        suporteMensagens.push(msg);
        io.emit('novaMensagem', msg); 
    });
});

// PORTA DINÂMICA PARA HOSPEDAGEM (RENDER)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 SISTEMA ONLINE NA PORTA ${PORT}`);
    console.log(`⏰ Funcionamento: 08:00 às 20:00`);
});