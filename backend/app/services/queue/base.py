from abc import ABC, abstractmethod

class QueueService(ABC):
    @abstractmethod
    def publish(
        self,
        queue_name: str,
        message: dict,
    ) -> None:
        """Publish a message to the queue."""
        pass