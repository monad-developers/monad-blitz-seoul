FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8123
CMD ["gunicorn", "-b", "0.0.0.0:8123", "app:app"]
