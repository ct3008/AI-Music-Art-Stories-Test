import os
import redis
from rq import Worker, Queue, Connection

# Ensure you're using the Heroku Redis URL from the environment variables
redis_url = os.getenv("REDIS_URL")

if not redis_url:
    raise ValueError("REDIS_URL environment variable is not set!")

# Connect to Redis
redis_conn = redis.from_url(redis_url)

# Listen to the default queue
if __name__ == "__main__":
    with Connection(redis_conn):
        worker = Worker(["default"])
        worker.work()
