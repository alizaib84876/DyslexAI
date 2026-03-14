import sqlite3
import os

db_path = r"c:\Users\abuba\OneDrive\Desktop\New folder\backend\data\dyslexai.db"

if os.path.exists(db_path):
    print(f"Migrating {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    try:
        cur.execute("ALTER TABLE ocrrun ADD COLUMN review_status VARCHAR")
        print("Added review_status column.")
    except sqlite3.OperationalError as e:
        print(f"review_status might already exist: {e}")
        
    try:
        cur.execute("ALTER TABLE ocrrun ADD COLUMN reviewed_text VARCHAR")
        print("Added reviewed_text column.")
    except sqlite3.OperationalError as e:
        print(f"reviewed_text might already exist: {e}")
        
    conn.commit()
    conn.close()
    print("Migration complete.")
else:
    print(f"DB not found at {db_path}")
