import sqlite3
import os

db = sqlite3.connect("data.db")

cursor = db.cursor()

print(cursor.execute("SELECT * FROM playlists").fetchall())

cursor.execute("DELETE FROM playlists;")
db.commit()


dirs = [f for f in os.listdir("data")]
print(dirs)

cmd = "INSERT INTO playlists (name, path, list) VALUES "

for dir in dirs:
    if (input("wanna add " + dir + "? y/n: ") == "n"):
        continue
    name = dir
    dir = os.path.join("data", dir)
    cmd += "('" + input(dir + " name: ") + "', '" + input(dir + " path: ") + "', '" + ";".join([(name + "/" + f).replace("'", "''") for f in os.listdir(dir) if os.path.isfile(os.path.join(dir, f))]) + "'),"

cmd = cmd[:-1] + ";";

print(cmd)

cursor.execute(cmd)
db.commit()
