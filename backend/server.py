

@api_router.put("/admin/settings")
async def admin_save_settings(input: SettingsUpdate, user: dict = Depends(get_current_admin)):
    data = {k: v for k, v in input.model_dump().items() if v is not None}
    for key in ("colorPaper", "colorBeige", "colorInk", "colorGold", "colorRose"):
        if key in data and not COLOR_RE.match(data[key]):
            raise HTTPException(status_code=400, detail=f"Cor inválida em {key}.")
    if "pricePix" in data and data["pricePix"] < 0:
        raise HTTPException(status_code=400, detail="Preço inválido.")
    if "priceCard" in data and data["priceCard"] < 0:
        raise HTTPException(status_code=400, detail="Preço inválido.")
    if "capacity" in data and not 0 <= data["capacity"] <= 1000:
        raise HTTPException(status_code=400, detail="Capacidade inválida.")
    if "installments" in data and not 1 <= data["installments"] <= 12:
        raise HTTPException(status_code=400, detail="Parcelamento inválido.")
    if data:
        await db.site_settings.update_one({}, {"$set": data}, upsert=True)
        if "capacity" in data:
            pass  # contador de vagas continua atômico contra a nova capacidade
    return await current_settings()


# ---------- Seed + eventos ----------

async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@draligia.com").lower()
    password = os.environ.get("ADMIN_PASSWORD")
    if not password:
        raise RuntimeError("ADMIN_PASSWORD não definido: configure a variável de ambiente antes de iniciar.")
    existing = await db.users.find_one({"email": email})
    if existing is None:
        await db.users.insert_one({
            "user_id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hash_password(password),
            "name": "Administradora",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin semeado com sucesso.")
    elif not verify_password(password, existing["password_hash"]):
        await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})
        logger.info("Hash da senha do admin atualizado.")


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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


from fastapi.responses import JSONResponse  # noqa: E402

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
