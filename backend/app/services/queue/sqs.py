import json
from typing import Any
from app.core.aws import AWSClients
from app.services.queue.base import QueueService

class SQSService(QueueService):
    def __init__(self):
        self.sqs = AWSClients.sqs()

    def publish(
        self,
        queue_url: str,
        message: dict[str, Any],
    ) -> None:
        """Publish a message to the SQS queue."""
        self.sqs.send_message(
            QueueUrl=queue_url,
            MessageBody=json.dumps(message),
        )

    def receive_messages(
        self,
        queue_url: str,
        max_messages: int = 1,
        wait_time: int = 20,
    ):
        response = self.sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=wait_time,
        )

        return response.get("Messages", [])

    def delete_message(
        self,
        queue_url: str,
        receipt_handle: str,
    ):
        self.sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=receipt_handle,
        )