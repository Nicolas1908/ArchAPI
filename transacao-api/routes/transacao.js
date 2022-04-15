const express = require('express');
const { dbo } = require('../db/mongodb');
const router = express.Router();
const { v4: uuidv4, validate } = require('uuid');
const cache = require('../redis/redis');

router.post('/', (req, res, next) => {
    const id = uuidv4();
    dbo.connect(async err => {
        if (err) { return res.status(500).send({ error: err }) }
        const collection = dbo.db("archBank").collection("controleFinanceiro");
        await collection.insertOne({ id, transacoes: [] },
            (err, db_response) => {
                if (err) { return res.status(500).send({ error: err }) }
                res.status(201).send(
                    {
                        id,
                        mensagem: 'Conta criada com sucesso!',
                        request: {
                            tipo: 'POST',
                            descricao: 'Retorna o status da criação de conta',
                        }
                    });
            });
    });
});

router.patch('/:id', (req, res, next) => {
    const conta_corrente = req.params.id;
    let valor = req.body.valor;
    const data_atual = new Date();
    const data_atual_formatada = (data_atual.getDate() +
        "/" + (data_atual.getMonth() + 1) +
        "/" + data_atual.getFullYear() +
        " " + data_atual.getHours() +
        ":" + data_atual.getMinutes() +
        ":" + data_atual.getSeconds());

    const data = data_atual_formatada;
    const tipo = req.body.tipo;

    // Validações
    const checkPreco = typeof valor === 'number' && !isNaN(valor) && valor >= 0.01;
    const validarUUID = validate(conta_corrente);

    if (!validarUUID) {
        return res.status(400).send({ error: 'ID inválido!' });
    }

    if (!checkPreco) {
        return res.status(400).send({ error: 'Valor inválido!' });
    }

    valor = valor.toFixed(2);

    if (tipo === 'debito') {
        valor = valor * -1;
    } else if (tipo !== 'credito') {
        return res.status(400).send({ error: 'Tipo de transação inválido!' });
    }


    dbo.connect(async err => {
        if (err) { return res.status(500).send({ error: err }) }
        const collection = dbo.db("archBank").collection("controleFinanceiro");
        await collection.updateOne({ id: conta_corrente }, { $push: { transacoes: { valor, data, tipo } } },
            async (err, db_response) => {
                if (err) { return res.status(500).send({ error: err }) }

                const getMongoData = await collection.findOne({ id: conta_corrente });

                if (!getMongoData) {
                    return res.status(404).send({ error: 'Conta não encontrada!' });
                }

                const transacoes = getMongoData.transacoes;

                const verifica_cache = await cache.get(conta_corrente);

                if (verifica_cache) {
                    cache.del(conta_corrente);
                }

                cache.set(conta_corrente, transacoes);

                res.status(200).send({
                    mensagem: 'Transação realizada com sucesso!',
                    request: {
                        tipo: 'PATCH',
                        descricao: 'Retorna o status da transação',
                    }
                });
            });
    })
});

module.exports = router;