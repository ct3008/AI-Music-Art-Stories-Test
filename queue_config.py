import os
from redis import Redis
from rq import Queue

# Redis connection URL
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_conn = Redis.from_url(redis_url)

# Create the RQ queue
queue = Queue(connection=redis_conn)