// VL_VERSION:2.91

# Service Domain
DOMAIN UserDomain

# Virtual Tables
VT VT_User FROM User
--id(STRING)
--nickname(STRING)
--realName(STRING)
--phone(STRING)
--email(STRING)
--avatarUrl(STRING)
--role(STRING)
--createdAt(TIMESTAMP)

# Services
SERVICE getUserProfile(id(STRING)); RETURN {user:JSON}
SERVICE updateUserProfile(id(STRING), nickname(STRING), realName(STRING), phone(STRING), email(STRING), avatarUrl(STRING)); RETURN {user:JSON}
