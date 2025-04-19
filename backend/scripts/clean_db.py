import sqlite3
import os

db = sqlite3.connect("data.db")

cursor = db.cursor()

print(cursor.execute("SELECT * FROM playlists").fetchall())

cursor.execute("DELETE FROM playlists;")
db.commit()
