# import bcrypt

# hashed = b"$2b$10$vA1O4ZIXk8hcMgS8L53uGOTBzHnDLGt3FVqXkqPqplOUa.OjweDRm"
# password = b"password123"

# if bcrypt.checkpw(password, hashed):
#     print("Password matches")
# else:
#     print("Password does not match")

import bcrypt

# Define the password you want to hash
password = b"wassup"

# Generate the salt
salt = bcrypt.gensalt()

# Generate the bcrypt hash
hashed_password = bcrypt.hashpw(password, salt)

# Print the hashed password
print(hashed_password.decode())  # .decode() to convert bytes to a string