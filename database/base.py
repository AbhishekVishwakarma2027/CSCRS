from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from database.models import *