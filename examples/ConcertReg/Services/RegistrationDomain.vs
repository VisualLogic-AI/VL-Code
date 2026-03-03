// VL_VERSION:2.91

# Service Domain
DOMAIN RegistrationDomain

# Virtual Tables
VT VT_Registration FROM Registration
--id(STRING)
--userId(STRING)
--concertId(STRING)
--zoneId(STRING)
--quantity(INT)
--totalPrice(FLOAT)
--contactName(STRING)
--contactPhone(STRING)
--contactEmail(STRING)
--ticketCode(STRING)
--status(STRING)
--createdAt(TIMESTAMP)
--cancelledAt(TIMESTAMP)

# Services
SERVICE createRegistration(userId(STRING), concertId(STRING), zoneId(STRING), quantity(INT), totalPrice(FLOAT), contactName(STRING), contactPhone(STRING), contactEmail(STRING)); RETURN {registration:JSON}
SERVICE getMyRegistrations(userId(STRING)); RETURN {list:JSON}
SERVICE cancelRegistration(id(STRING)); RETURN {success:BOOL}
SERVICE getTicketDetail(id(STRING)); RETURN {registration:JSON, concertTitle:STRING, concertStartTime:STRING, concertVenue:STRING, concertAddress:STRING, zoneName:STRING, weatherInfo:STRING, weatherTip:STRING}
SERVICE getRecentRegistrations(limit(INT)); RETURN {list:JSON}
SERVICE adminListRegistrations(concertId(STRING), status(STRING), page(INT), pageSize(INT)); RETURN {list:JSON, total:INT, page:INT}
SERVICE exportRegistrations(concertId(STRING), format(STRING)); RETURN {fileUrl:STRING, fileName:STRING}
SERVICE getRegistrationTrend(dateStart(STRING), dateEnd(STRING), period(STRING)); RETURN {data:JSON}
SERVICE getRegistrationsByConcert(limit(INT)); RETURN {data:JSON}
SERVICE getRegistrationsByZone(concertId(STRING)); RETURN {data:JSON}
SERVICE getRevenueStats(dateStart(STRING), dateEnd(STRING)); RETURN {totalRevenue:FLOAT, totalOrders:INT, totalTickets:INT, averageOrderPrice:FLOAT, revenueByMonth:JSON}
