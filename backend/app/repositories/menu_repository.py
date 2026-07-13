from app.db.mongo_db import db

class MenuRepository:
    def __init__(self):
        self.collection = db.menus

    def upsert_menu(self, res_id: str, platform: str, menu_array: list, append: bool = False):
        import datetime
        now = datetime.datetime.utcnow()
        
        update_op = {
            "$set": {
                "updatedAt": now
            },
            "$setOnInsert": {
                "createdAt": now,
                "__v": 0
            }
        }
        
        if append:
            update_op["$push"] = { "menu": { "$each": menu_array } }
        else:
            update_op["$set"]["menu"] = menu_array
            
        self.collection.update_one(
            {"resId": res_id, "platform": platform},
            update_op,
            upsert=True
        )
