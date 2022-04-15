const express = require('express');
const { dbo } = require('../db/mongodb');
const router = express.Router();
const { validate } = require('uuid');
const cache = require('../redis/redis');

router.get('/:id', async (req, res, next) => {
    const conta_corrente = req.params.id;
    let extrato_cache = await cache.get(conta_corrente);
    let saldo = 0;

    // Validações
    const validarUUID = validate(conta_corrente);

    if (!validarUUID) {
        return res.status(400).send({ error: 'ID inválido!' });
    }

    if (!extrato_cache) {
        dbo.connect(err => {
            if (err) { return res.status(500).send({ error: err }) }
            const collection = dbo.db("archBank").collection("controleFinanceiro");

            collection.findOne({ id: conta_corrente }, async (err, result) => {
                if (err) { return res.status(500).send({ error: err }) }

                extrato_cache = result.transacoes;
                await cache.set(conta_corrente, extrato_cache);
                const cache_atualizado = await cache.get(conta_corrente);

                for (transacao in cache_atualizado) {
                    if (cache_atualizado[transacao].tipo == "credito") {
                        saldo += ((Number.parseFloat(cache_atualizado[transacao].valor)).toFixed(2));
                    } else {
                        saldo -= ((Number.parseFloat(cache_atualizado[transacao].valor)).toFixed(2));
                    }
                }

                return res.status(200).send({
                    mensagem: "Extrato carregado com sucesso!",
                    conta: {
                        saldo,
                        extrato_cache,
                    },
                    request: {
                        tipo: 'GET',
                        descricao: 'Retorna o extrato financeiro da conta',
                    }
                })
            });
        })
    } else {
        for (transacao in extrato_cache) {
            if (extrato_cache[transacao].tipo == "credito") {
                saldo += ((Number.parseFloat(extrato_cache[transacao].valor)).toFixed(2));
            } else {
                saldo -= ((Number.parseFloat(extrato_cache[transacao].valor)).toFixed(2));
            }
        }

        return res.status(200).send({
            mensagem: "Extrato carregado com sucesso!",
            conta: {
                saldo,
                extrato_cache,
            },
            request: {
                tipo: 'GET',
                descricao: 'Retorna o extrato financeiro da conta',
            }
        })
    }
});

module.exports = router;