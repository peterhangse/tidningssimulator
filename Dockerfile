FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files (saved/ is not copied: it starts empty in the container)
COPY app.py .
COPY templates/ templates/
COPY static/ static/
COPY data/ data/

RUN mkdir -p saved

ENV PORT=8080
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["python", "app.py"]
