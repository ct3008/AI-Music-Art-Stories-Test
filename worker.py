import os
import redis
from rq import Worker, Queue, Connection
from urllib.parse import urlparse
import ssl

# Ensure you're using the Heroku Redis URL from the environment variables
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

if not redis_url:
    raise ValueError("REDIS_URL environment variable is not set!")

# Parse the Redis URL
url = urlparse(redis_url)
print("REDIS URL: ", url)
print("SEGMENT: ", url.hostname, url.port, url.password)

# Configure Redis connection with SSL/TLS support and certificate validation disabled
# redis_conn = redis.StrictRedis(
#     host=url.hostname,
#     port=url.port,
#     password=url.password,
#     ssl=False,
#     ssl_cert_reqs=ssl.CERT_NONE  # Disable certificate validation for self-signed certificates
# )

redis_conn = redis.StrictRedis(
    host='ec2-18-206-36-186.compute-1.amazonaws.com',
    port=23840,
    ssl=True,  # Enable SSL/TLS
    ssl_certfile=None,  # Path to client certificate (if needed)
    ssl_keyfile=None,   # Path to client key file (if needed)
    ssl_ca_certs=None,  # Path to CA certificate if you're verifying the server's certificate
    ssl_check_hostname=False  # This will skip verification of the server's hostname (useful if using a self-signed certificate)
)

redis_conn.ssl_context.verify_mode = ssl.CERT_NONE  # Disable certificate verification


# Listen to the default queue
if __name__ == "__main__":
    with Connection(redis_conn):
        worker = Worker(["default"])
        worker.work()


# import os
# import redis
# from rq import Worker, Queue, Connection

# # Ensure you're using the Heroku Redis URL from the environment variables
# redis_url = os.getenv("REDIS_URL","redis://localhost:6379/0")

# if not redis_url:
#     raise ValueError("REDIS_URL environment variable is not set!")

# # Connect to Redis
# redis_conn = redis.from_url(redis_url)

# # Listen to the default queue
# if __name__ == "__main__":
#     with Connection(redis_conn):
#         worker = Worker(["default"])
#         worker.work()
