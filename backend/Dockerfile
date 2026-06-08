FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (required for Firebird client)
RUN apt-get update && apt-get install -y \
    libfbclient2 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 8000

# Run Uvicorn (adjust if your entrypoint is different, assuming 'main:app')
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
