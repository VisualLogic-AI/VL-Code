// VL_VERSION:2.91

# Service Domain
DOMAIN PerformerDomain

# Virtual Tables
VT VT_Performer FROM Performer
--id(STRING)
--name(STRING)
--avatarUrl(STRING)
--bio(STRING)
--genre(STRING)
--representative(STRING)
--createdAt(TIMESTAMP)

VT VT_ConcertPerformer FROM ConcertPerformer
--id(STRING)
--concertId(STRING)
--performerId(STRING)
--performOrder(INT)

# Services
SERVICE listPerformers(keyword(STRING)); RETURN {list:JSON}
SERVICE getPerformersByConcert(concertId(STRING)); RETURN {list:JSON}
SERVICE createPerformer(name(STRING), avatarUrl(STRING), bio(STRING), genre(STRING), representative(STRING)); RETURN {performer:JSON}
SERVICE updatePerformer(id(STRING), name(STRING), avatarUrl(STRING), bio(STRING), genre(STRING), representative(STRING)); RETURN {performer:JSON}
SERVICE deletePerformer(id(STRING)); RETURN {success:BOOL}
