FROM python:3.11-slim

WORKDIR /

COPY ./backend ./backend
COPY ./frontend/build ./backend/frontend/build

WORKDIR /backend

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

# ENV PYTHONPATH=/

CMD ["gunicorn", "-w", "5", "-b", "0.0.0.0:5000", "--timeout", "120", "backend.app:app"]
