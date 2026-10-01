@app.on_event("startup")
async def startup():
    logger.info("STARTUP: iniciado")

    logger.info(
        "STARTUP: variaveis obrigatorias presentes: "
        "MONGO_URL=%s DB_NAME=%s JWT_SECRET=%s ADMIN_PASSWORD=%s EMAIL_FROM_NAME=%s",
        bool(os.environ.get("MONGO_URL")),
        bool(os.environ.get("DB_NAME")),
        bool(os.environ.get("JWT_SECRET")),
        bool(os.environ.get("ADMIN_PASSWORD")),
        bool(os.environ.get("EMAIL_FROM_NAME")),
    )

    try:
        logger.info("STARTUP: criando indices do MongoDB")

        await db.users.create_index("email", unique=True)
        await db.login_attempts.create_index("identifier")
        await db.registrations.create_index("id")
        await db.registrations.create_index("registration_code")
        await db.payments.create_index("order_nsu", unique=True)
        await db.payments.create_index("transaction_nsu")
        await db.tickets.create_index("qr_token", unique=True)
        await db.tickets.create_index("registration_id")

        logger.info("STARTUP: indices criados")

        logger.info("STARTUP: inicializando contadores")

        await db.counters.update_one(
            {"_id": "confirmed_sales"},
            {"$setOnInsert": {"count": 0}},
            upsert=True,
        )

        await db.counters.update_one(
            {"_id": "registration_code"},
            {"$setOnInsert": {"count": 0}},
            upsert=True,
        )

        logger.info("STARTUP: contadores inicializados")

        logger.info("STARTUP: executando seed_admin")

        await seed_admin()

        logger.info("STARTUP: concluido com sucesso")

    except Exception:
        logger.exception(
            "STARTUP: FALHA durante a inicializacao da aplicacao"
        )
        raise
