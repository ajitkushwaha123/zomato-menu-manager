from app.workers.worker import MenuWorker

if __name__ == "__main__":
    worker = MenuWorker()
    worker.start()