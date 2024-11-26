import os
import redis
from rq import Worker, Queue, Connection


# Get Redis connection URL
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")  # Default to local Redis
redis_conn = redis.from_url(redis_url)

# Listen to the default queue
if __name__ == "__main__":
    with Connection(redis_conn):
        worker = Worker(["default"])
        worker.work()
