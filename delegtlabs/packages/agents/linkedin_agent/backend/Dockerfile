FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY start.sh .
COPY .env* ./

RUN chmod +x start.sh && mkdir -p uploads

ENV PORT=8005
EXPOSE 8005

CMD ["./start.sh"]
