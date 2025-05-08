import logging

base_logger = logging.getLogger("api")
base_logger.setLevel(logging.INFO)  # or whatever level you want

# Create a handler (e.g., StreamHandler for console output)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
handler.setFormatter(formatter)

# Add the handler to your logger
base_logger.addHandler(handler)

# Prevent logs from propagating to the root logger (and thus to uvicorn's handlers)
base_logger.propagate = False
