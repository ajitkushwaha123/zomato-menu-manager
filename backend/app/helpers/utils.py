from uuid import uuid4

class Utils:
    def __init__(self):
        pass    

    @staticmethod
    def generate_job_id():
        return str(uuid4())
