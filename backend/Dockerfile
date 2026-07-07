# Use the official AWS Lambda Python 3.11 base image
FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY app/ ${LAMBDA_TASK_ROOT}/app/

# Set the handler to the Mangum-wrapped FastAPI app
CMD ["app.main.handler"]