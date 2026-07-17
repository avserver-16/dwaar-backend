FROM node:20-bookworm

WORKDIR /app

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv

# Use virtual environment
ENV PATH="/opt/venv/bin:$PATH"

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy Python requirements and install
COPY src/python/requirements.txt ./src/python/requirements.txt
RUN pip install --no-cache-dir -r ./src/python/requirements.txt

# Copy the rest of the application
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]