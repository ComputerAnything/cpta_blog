FROM python:3.11-slim

WORKDIR /backend

# Copy backend code
COPY ./backend ./

# Copy the pre-built React frontend (from local build)
COPY ./backend/frontend/build ./frontend/build

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["gunicorn", "-w", "5", "-b", "0.0.0.0:5000", "--timeout", "120", "app:app"]
