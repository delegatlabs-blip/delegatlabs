import os
import sys
import asyncio
import logging
from urllib.parse import urlparse
import psycopg2
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migrate")

def ensure_database_exists():
    try:
        url = settings.sync_database_url
        parsed = urlparse(url)
        db_name = parsed.path.lstrip('/')
        if not db_name or db_name == 'postgres':
            return

        # Connect to postgres system database to create target database if needed
        user = parsed.username
        password = parsed.password
        host = parsed.hostname or 'localhost'
        port = parsed.port or 5432

        conn = psycopg2.connect(
            dbname='postgres',
            user=user,
            password=password,
            host=host,
            port=port
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        exists = cur.fetchone()
        if not exists:
            logger.info(f"🔨 Creating database \"{db_name}\"...")
            cur.execute(f'CREATE DATABASE "{db_name}"')
            logger.info(f"✅ Database \"{db_name}\" created successfully")
        cur.close()
        conn.close()
    except Exception as e:
        logger.warning(f"Could not auto-create database (proceeding assuming it exists): {e}")

def run_migrations():
    ensure_database_exists()
    conn = psycopg2.connect(settings.sync_database_url)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    conn.commit()

    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
    if not os.path.exists(migrations_dir):
        logger.warning("No migrations directory found")
        return

    files = sorted([f for f in os.listdir(migrations_dir) if f.endswith(".sql")])

    for file in files:
        version = file.replace(".sql", "")
        cur.execute("SELECT version FROM schema_migrations WHERE version = %s", (version,))
        if cur.fetchone():
            logger.info(f"⏭  Skipping {version} (already applied)")
            continue

        logger.info(f"⚡ Applying migration: {version}")
        file_path = os.path.join(migrations_dir, file)
        with open(file_path, "r", encoding="utf-8") as f:
            sql = f.read()

        try:
            cur.execute(sql)
            cur.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (version,))
            conn.commit()
            logger.info(f"✅ Migration {version} applied")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Migration {version} failed: {e}")
            raise e

    cur.close()
    conn.close()
    logger.info("🎉 All migrations complete")

if __name__ == "__main__":
    run_migrations()
