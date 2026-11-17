# Use Python 3.14 slim image
FROM python:3.14-slim

# Set working directory
WORKDIR /app

# Install system dependencies (untuk mysql-connector dan Pillow)
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (untuk cache layer)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/barang uploads/donasi uploads/pembayaran uploads/profiles

# Expose port
EXPOSE 5001

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Run the application
CMD ["python", "app.py"]
