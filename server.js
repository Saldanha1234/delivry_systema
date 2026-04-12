const express = require('express');
const path = require('path');
const http = require('http'); 
const { Server } = require('socket.io'); 
const mongoose = require('mongoose');
require('dotenv').config(); 

// Importação da configuração de adicionais
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
    manutencao: { type: Boolean, default: false },
    nomeSite: { type: String, default: 'Meu Delivery' },
    fusoHorario: { type: String, default: 'America/Sao_Paulo' },
    agenda: { type: Array, default: [] },
    whatsapp: { type: String, default: '' },
    taxaEntrega: { type: Number, default: 0 },
    tempoEntrega: { type: String, default: '30-50' },
    cidadeAtiva: { type: Boolean, default: false },
    cidadeNome: { type: String, default: '' },
    cidadeEstado: { type: String, default: '' },
    cidadePais: { type: String, default: 'Brasil' }
});
const Config = mongoose.model('Config', ConfigSchema);

const CategoriaSchema = new mongoose.Schema({
    nome: { type: String, required: true }
});
const Categoria = mongoose.model('Categoria', CategoriaSchema);

const ProdutoSchema = new mongoose.Schema({
    nome: String,
    preco: Number,
    img: String,
    desc: String,
    categoria: String,
    desconto: { type: Number, default: null },
    status: { type: String, default: 'disponivel' },
    modificadoresAtivos: { type: Boolean, default: false }
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
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
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

// NOVO SCHEMA PARA VALOR MENSAL
const VendaMensalSchema = new mongoose.Schema({
    mesAno: String, // Formato "MM/YYYY"
    totalAcumulado: { type: Number, default: 0 }
});
const VendaMensal = mongoose.model('VendaMensal', VendaMensalSchema);

// --- SISTEMA DE LIMPEZA E ACUMULADO MENSAL (VIRADA DO DIA) ---
setInterval(async () => {
    const agora = new Date();
    const horaBrasilia = agora.getUTCHours() - 3;
    const horaTratada = horaBrasilia < 0 ? horaBrasilia + 24 : horaBrasilia;

    if (horaTratada === 0) {
        try {
            // 1. Calcular total do dia antes de deletar
            const pedidosDoDia = await Pedido.find({ status: { $in: ['Finalizado', 'Concluído'] } });
            const totalDia = pedidosDoDia.reduce((acc, p) => acc + (p.total || 0), 0);

            // 2. Identificar Mês/Ano atual para o acumulador
            const mesAnoAtual = (agora.getMonth() + 1).toString().padStart(2, '0') + '/' + agora.getFullYear();

            // 3. Atualizar ou Criar o registro mensal
            await VendaMensal.findOneAndUpdate(
                { mesAno: mesAnoAtual },
                { $inc: { totalAcumulado: totalDia } },
                { upsert: true }
            );

            // 4. Faxina original
            await Pedido.deleteMany({ status: { $in: ['Finalizado', 'Cancelado', 'Concluído'] } });
            const pedidosAtivos = await Pedido.find().distinct('id');
            const stringIdsAtivos = pedidosAtivos.map(id => id.toString());
            await Mensagem.deleteMany({ pedidoId: { $nin: stringIdsAtivos } });
            
            console.log(`♻️ Faxina e Acúmulo de Vendas (${mesAnoAtual}) concluídos. Total hoje: R$ ${totalDia}`);
        } catch (err) {
            console.error("❌ Erro na limpeza/acumulado:", err);
        }
    }
}, 3600000); 

// --- CONFIGURAÇÕES DO EXPRESS ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '15mb' })); 
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// --- LÓGICA DE HORÁRIO ---
const checarAberta = async () => {
    try {
        const config = await Config.findOne({ chave: 'global' });
        if (!config) return false;
        if (config.manutencao === true) return false; 

        const fuso = config.fusoHorario || 'America/Sao_Paulo';
        const agora = new Date();
        const dataLocal = new Date(agora.toLocaleString("en-US", { timeZone: fuso }));
        
        const diaSemana = dataLocal.getDay(); 
        const horaAtual = dataLocal.getHours().toString().padStart(2, '0') + ':' + 
                        dataLocal.getMinutes().toString().padStart(2, '0');

        const agendaHoje = config.agenda && config.agenda[diaSemana];

        if (agendaHoje && agendaHoje.aberto === true) {
            const { inicio, fim } = agendaHoje;
            if (fim < inicio) {
                if (horaAtual >= inicio || horaAtual < fim) return true;
            } else {
                if (horaAtual >= inicio && horaAtual < fim) return true;
            }
        }
    } catch (e) { return false; }
    return false; 
};

app.use(async (req, res, next) => {
    try {
        const config = await Config.findOne({ chave: 'global' });
        res.locals.estaAberto = await checarAberta();
        res.locals.nomeSite = config ? config.nomeSite : "Meu Delivery";
        next();
    } catch (err) {
        res.locals.estaAberto = false;
        res.locals.nomeSite = "Meu Delivery";
        next();
    }
});

// --- ROTAS DE VENDAS MENSAL ---
app.get('/get-vendas-mensal', async (req, res) => {
    try {
        const vendas = await VendaMensal.find().sort({ _id: -1 });
        res.json(vendas);
    } catch (err) { res.status(500).json([]); }
});

// --- ROTAS DE CATEGORIAS E PRODUTOS (MANTIDAS) ---

app.get('/get-categorias', async (req, res) => {
    try { const categorias = await Categoria.find(); res.json(categorias); } catch (err) { res.status(500).json([]); }
});

app.post('/add-categoria', async (req, res) => {
    try { const novaCat = new Categoria(req.body); await novaCat.save(); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false }); }
});

app.put('/edit-categoria/:id', async (req, res) => {
    try { await Categoria.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false }); }
});

app.delete('/delete-categoria/:id', async (req, res) => {
    try { await Categoria.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false }); }
});

app.get('/get-produtos', async (req, res) => {
    try { const produtos = await Produto.find(); res.json(produtos); } catch (err) { res.status(500).json([]); }
});

app.post('/add-produto', async (req, res) => {
    try { const novoProduto = new Produto(req.body); await novoProduto.save(); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false }); }
});

app.put('/edit-produto/:id', async (req, res) => {
    try { await Produto.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); } catch (err) { res.status(404).json({ success: false }); }
});

app.delete('/delete-produto/:id', async (req, res) => {
    try { await Produto.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false }); }
});

// --- ROTAS DE CONFIGURAÇÃO ---

app.post('/update-config-site', async (req, res) => {
    try {
        const { 
            manutencao, nomeSite, whatsapp, taxaEntrega, tempoEntrega,
            cidadeAtiva, cidadeNome, cidadeEstado, cidadePais 
        } = req.body;

        await Config.findOneAndUpdate(
            { chave: 'global' },
            { 
                manutencao: (manutencao === true || manutencao === 'true'), 
                nomeSite,
                whatsapp,
                taxaEntrega: parseFloat(taxaEntrega) || 0,
                tempoEntrega,
                cidadeAtiva: (cidadeAtiva === true || cidadeAtiva === 'true'),
                cidadeNome,
                cidadeEstado,
                cidadePais
            },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/update-horarios', async (req, res) => {
    try {
        const { fusoHorario, agenda } = req.body;
        await Config.findOneAndUpdate(
            { chave: 'global' },
            { fusoHorario, agenda },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

app.post('/update-config-pix', async (req, res) => {
    try {
        await Config.findOneAndUpdate({ chave: 'global' }, req.body, { upsert: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

// --- ROTAS DE PEDIDOS E TELAS ---

app.get('/', async (req, res) => {
    try {
        const produtos = await Produto.find();
        const categoriasDoBanco = await Categoria.find();
        const categoriasFixas = [{ nome: 'Promoção' }, { nome: 'Destaques' }];
        const categorias = [...categoriasFixas, ...categoriasDoBanco];

        let config = await Config.findOne({ chave: 'global' });
        if (!config) config = { nomeSite: 'Meu Delivery', agenda: [], taxaEntrega: 0, tempoEntrega: '30-50' };
        
        res.render('index', { produtos, categorias, config, estruturaAdicionais: ConfigEstrutura });
    } catch (err) { res.status(500).send("Erro interno."); }
});

app.get('/admin', async (req, res) => {
    try {
        const produtos = await Produto.find();
        const pedidos = await Pedido.find().sort({ createdAt: -1 }); 
        const categorias = await Categoria.find(); 
        const vendasMensais = await VendaMensal.find().sort({ _id: -1 }); // Adicionado para o admin
        let config = await Config.findOne({ chave: 'global' });
        if (!config) config = await Config.create({ chave: 'global' });
        res.render('admin', { pedidos, produtos, config, categorias, vendasMensais });
    } catch (err) { res.status(500).send("Erro ao carregar admin."); }
});

app.get('/operacao', async (req, res) => {
    try {
        const pedidosExibidos = await Pedido.find({ status: { $ne: 'Cancelado' } }).sort({ createdAt: 1 });
        let config = await Config.findOne({ chave: 'global' });
        const produtos = await Produto.find();
        res.render('operacao', { pedidos: pedidosExibidos, config, produtos });
    } catch (err) { res.status(500).send("Erro no painel."); }
});

app.post('/enviar-pedido', async (req, res) => {
    const aberta = await checarAberta();
    if (!aberta) return res.status(403).json({ success: false, message: "A loja está fechada agora!" });
    
    try {
        const config = await Config.findOne({ chave: 'global' });
        
        if (config && config.cidadeAtiva) {
            const enderecoCliente = (req.body.endereco || "").toLowerCase();
            const cidadeConfig = (config.cidadeNome || "").toLowerCase();
            const estadoConfig = (config.cidadeEstado || "").toLowerCase();

            const contemCidade = enderecoCliente.includes(cidadeConfig);
            const contemEstado = enderecoCliente.includes(estadoConfig);

            if (!contemCidade || !contemEstado) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Endereço Inválido! Aceitamos apenas pedidos da cidade de ${config.cidadeNome} - ${config.cidadeEstado}.` 
                });
            }
        }

        const novoPedido = new Pedido({
            ...req.body,
            id: Math.floor(Math.random() * 9000) + 1000,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        
        await novoPedido.save(); 
        io.emit('novoPedido', novoPedido);
        res.json({ success: true, id: novoPedido.id });
    } catch (error) { 
        res.status(500).json({ success: false }); 
    }
});

app.get('/api/pedido/:id', async (req, res) => {
    try {
        const pedido = await Pedido.findOne({ id: req.params.id });
        res.json({ status: pedido ? pedido.status : null });
    } catch (err) { res.json({ status: null }); }
});

app.post('/update-status', async (req, res) => {
    const { id, novoStatus } = req.body;
    try {
        await Pedido.findOneAndUpdate({ id: id }, { status: novoStatus, updatedAt: Date.now() });
        if (['Finalizado', 'Cancelado', 'Concluído'].includes(novoStatus)) {
            await Mensagem.deleteMany({ pedidoId: id.toString() });
            io.emit('pedidoEncerrado', { id }); 
        }
        io.emit('statusAtualizado', { id, novoStatus });
        res.json({ success: true });
    } catch (err) { res.status(404).json({ success: false }); }
});

app.get('/status/:id', async (req, res) => {
    try {
        const pedido = await Pedido.findOne({ id: req.params.id });
        if (pedido) res.render('status', { pedido });
        else res.status(404).send("Pedido não encontrado");
    } catch (err) { res.status(500).send("Erro."); }
});

// --- CHAT SOCKET.IO ---

io.on('connection', (socket) => {
    socket.on('join', async (pedidoId) => {
        if(!pedidoId) return;
        socket.join(pedidoId.toString());
        const historico = await Mensagem.find({ pedidoId: pedidoId.toString() }).sort({ createdAt: 1 });
        socket.emit('historico', historico);
    });

    socket.on('enviarMensagem', async (data) => {
        if(!data.pedidoId) return;
        const msg = new Mensagem({
            pedidoId: data.pedidoId.toString(),
            usuario: data.usuario, 
            texto: data.texto,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            lida: data.usuario === 'Admin'
        });
        await msg.save();
        io.to(data.pedidoId.toString()).emit('novaMensagem', msg);
        if(data.usuario !== 'Admin') io.emit('alertaAdmin', msg);
    });

    socket.on('lerMensagens', async (pedidoId) => {
        if(!pedidoId) return;
        await Mensagem.updateMany({ pedidoId: pedidoId.toString(), usuario: { $ne: 'Admin' } }, { lida: true });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🚀 SISTEMA ONLINE NA PORTA ${PORT}`);
});