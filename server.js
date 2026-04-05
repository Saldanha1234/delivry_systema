const express = require('express');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 
const mongoose = require('mongoose');
require('dotenv').config(); 

// Importação da configuração de adicionais (Açaí/Montar)
// Nota: Certifique-se que o arquivo exporta { ConfigEstrutura }
const { ConfigEstrutura } = require('./public/js/estrutura-produtos');

const app = express();
const server = http.createServer(app); 
const io = new Server(server); 

// --- CONEXÃO COM O BANCO DE DATOS ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Conectado ao Banco de Dados MongoDB!"))
    .catch(err => console.error("❌ Erro ao conectar ao Banco:", err));

// --- SCHEMAS ---

const ConfigSchema = new mongoose.Schema({
    chave: { type: String, default: 'global' },
    pixProvedor: { type: String, default: 'mercadopago' },
    pixToken: String,
    pixClientId: String,
    pixClientSecret: String
});
const Config = mongoose.model('Config', ConfigSchema);

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
    itens: Array, // Aqui serão salvos os produtos com seus adicionais selecionados
    total: Number,
    status: { type: String, default: "Pendente" },
    hora: String,
    createdAt: { type: Date, default: Date.now }
});
const Pedido = mongoose.model('Pedido', PedidoSchema);

const MensagemSchema = new mongoose.Schema({
    pedidoId: String,
    usuario: String,
    texto: String,
    hora: String,
    lida: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Mensagem = mongoose.model('Mensagem', MensagemSchema);

// --- CONFIGURAÇÕES DO EXPRESS ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- LÓGICA DE HORÁRIO ---
const checarAberta = () => {
    const agora = new Date();
    const horaBrasilia = agora.getUTCHours() - 3;
    const horaTratada = horaBrasilia < 0 ? horaBrasilia + 24 : horaBrasilia;
    return horaTratada >= 20& horaTratada < 16
};

app.use((req, res, next) => {
    // Mantive como true conforme seu código original
    res.locals.estaAberto = checarAberta();
    next();
});

// --- ROTAS PRINCIPAIS ---

app.get('/', async (req, res) => {
    try {
        const produtos = await Produto.find();
        res.render('index', { produtos });
    } catch (err) { res.status(500).send("Erro ao carregar loja."); }
});

/**
 * Rota para o Front-end obter a estrutura de adicionais/modal.
 * Esta rota é crucial para que o modal de "+" e "-" funcione dinamicamente.
 */
app.get('/api/config-estrutura', (req, res) => {
    if (ConfigEstrutura) {
        res.json(ConfigEstrutura);
    } else {
        res.status(404).json({ error: "Configuração de adicionais não encontrada." });
    }
});

// ADMIN: GESTÃO
app.get('/admin', async (req, res) => {
    try {
        const produtos = await Produto.find();
        const todosOsPedidos = await Pedido.find(); 
        
        let config = await Config.findOne({ chave: 'global' });
        if (!config) config = await Config.create({ chave: 'global' });

        const mensagensNaoLidas = await Mensagem.find({ lida: false, usuario: { $ne: 'Admin' } });
        
        res.render('admin', { pedidos: todosOsPedidos, produtos, mensagensNaoLidas, config });
    } catch (err) { res.status(500).send("Erro ao carregar admin."); }
});

// OPERAÇÃO: FOCO EM COMANDAS
app.get('/operacao', async (req, res) => {
    try {
        const pedidosAtivos = await Pedido.find({ status: { $ne: 'Concluído' } }).sort({ createdAt: 1 });
        let config = await Config.findOne({ chave: 'global' });
        const produtos = await Produto.find();

        res.render('operacao', { pedidos: pedidosAtivos, config, produtos });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro interno ao carregar painel de operação.");
    }
});

// --- CONFIGURAÇÃO DO PIX ---

app.post('/update-config-pix', async (req, res) => {
    try {
        const { pixProvedor, pixToken, pixClientId, pixClientSecret } = req.body;
        await Config.findOneAndUpdate(
            { chave: 'global' },
            { pixProvedor, pixToken, pixClientId, pixClientSecret },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- GERENCIAMENTO DE PRODUTOS ---

app.post('/add-produto', async (req, res) => {
    try {
        const novoProduto = new Produto(req.body);
        await novoProduto.save();
        res.json({ success: true });
    } catch (err) { res.json({ success: false }); }
});

app.put('/edit-produto/:id', async (req, res) => {
    try {
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

// --- STATUS E PEDIDOS ---

app.get('/status/:id', async (req, res) => {
    try {
        const pedido = await Pedido.findOne({ id: req.params.id });
        if (pedido) res.render('status', { pedido });
        else res.status(404).send("Pedido não encontrado");
    } catch (err) { res.status(500).send("Erro ao buscar status."); }
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
        const { cliente, endereco, pagamento, itens, total, observacaoGeral } = req.body;
        
        // Garante que os itens (que agora contêm adicionais) sejam processados corretamente
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
        io.emit('novoPedido', novoPedido);
        res.json({ success: true, id: novoPedido.id });
    } catch (error) { 
        console.error("Erro ao salvar pedido:", error);
        res.status(500).json({ success: false }); 
    }
});

// ALTERADO: Adicionada garantia de propagação para a lógica de cancelamento
app.post('/update-status', async (req, res) => {
    const { id, novoStatus } = req.body;
    try {
        // Atualiza no banco de dados MongoDB
        await Pedido.findOneAndUpdate({ id: id }, { status: novoStatus });
        
        // Emite para TODOS os clientes conectados. 
        // O index.ejs agora escuta isso para esconder a barra amarela se for 'Cancelado'
        io.emit('statusAtualizado', { id, novoStatus });
        
        res.json({ success: true });
    } catch (err) { 
        console.error("Erro ao atualizar status:", err);
        res.status(404).json({ success: false }); 
    }
});

// --- CHAT SOCKET.IO ---

io.on('connection', (socket) => {
    socket.on('join', async (pedidoId) => {
        socket.join(pedidoId);
        const historico = await Mensagem.find({ pedidoId }).sort({ createdAt: 1 });
        socket.emit('historico', historico);
    });

    socket.on('enviarMensagem', async (data) => {
        const msg = new Mensagem({
            pedidoId: data.pedidoId,
            usuario: data.usuario, 
            texto: data.texto,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            lida: data.usuario === 'Admin' ? true : false
        });
        await msg.save();
        io.to(data.pedidoId).emit('novaMensagem', msg);
        if(data.usuario !== 'Admin') io.emit('alertaAdmin', msg);
    });

    socket.on('lerMensagens', async (pedidoId) => {
        try {
            await Mensagem.updateMany({ pedidoId, usuario: { $ne: 'Admin' } }, { lida: true });
        } catch (err) { console.error("Erro ao marcar como lidas:", err); }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 SISTEMA ONLINE NA PORTA ${PORT}`);
});