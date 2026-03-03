// VL_VERSION:2.91

# Service Domain
DOMAIN AnnouncementDomain

# Virtual Tables
VT VT_Announcement FROM Announcement
--id(STRING)
--title(STRING)
--content(STRING)
--type(STRING)
--concertId(STRING)
--status(STRING)
--publishedAt(TIMESTAMP)
--createdAt(TIMESTAMP)

# Services
SERVICE getAnnouncements(page(INT), pageSize(INT)); RETURN {list:JSON, total:INT}
SERVICE adminListAnnouncements(status(STRING), page(INT), pageSize(INT)); RETURN {list:JSON, total:INT}
SERVICE createAnnouncement(title(STRING), content(STRING), type(STRING), concertId(STRING)); RETURN {announcement:JSON}
SERVICE updateAnnouncement(id(STRING), title(STRING), content(STRING), type(STRING), concertId(STRING)); RETURN {announcement:JSON}
SERVICE deleteAnnouncement(id(STRING)); RETURN {success:BOOL}
SERVICE publishAnnouncement(id(STRING), publish(BOOL)); RETURN {announcement:JSON}
