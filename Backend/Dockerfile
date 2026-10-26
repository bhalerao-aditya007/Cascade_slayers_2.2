FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (build-essential, curl, libgomp1 for LightGBM OpenMP)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PROJECT_ROOT=/app
ENV PORT=8000
ENV MALLOC_TRIM_THRESHOLD_=65536
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV VECLIB_MAXIMUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1
ENV TORCH_NUM_THREADS=1

EXPOSE 8000

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
