// VL_VERSION:2.91

# Service Domain
DOMAIN ConcertDomain

# Virtual Tables
VT VT_Concert FROM Concert
--id(STRING)
--title(STRING)
--description(STRING)
--coverImage(STRING)
--musicType(STRING)
--venue(STRING)
--address(STRING)
--startTime(TIMESTAMP)
--endTime(TIMESTAMP)
--gateOpenTime(TIMESTAMP)
--status(STRING)
--weatherInfo(STRING)
--weatherTip(STRING)
--totalCapacity(INT)
--registrationCount(INT)
--createdAt(TIMESTAMP)
--updatedAt(TIMESTAMP)

VT VT_SeatZone FROM SeatZone
--id(STRING)
--concertId(STRING)
--zoneName(STRING)
--capacity(INT)
--remainingSeats(INT)
--price(FLOAT)
--sortOrder(INT)

VT VT_Favorite FROM Favorite
--id(STRING)
--userId(STRING)
--concertId(STRING)
--createdAt(TIMESTAMP)

# Services
SERVICE listConcerts(page(INT), pageSize(INT)); RETURN {list:JSON, total:INT, page:INT}
SERVICE searchConcerts(keyword(STRING), musicType(STRING), dateStart(STRING), dateEnd(STRING), priceMin(STRING), priceMax(STRING), page(INT), pageSize(INT)); RETURN {list:JSON, total:INT, page:INT}
SERVICE getConcertDetail(id(STRING)); RETURN {concert:JSON}
SERVICE getSeatZones(concertId(STRING)); RETURN {zones:JSON}
SERVICE getDashboardStats(); RETURN {totalConcerts:INT, totalRegistrations:INT, monthlyRevenue:FLOAT, upcomingCount:INT}
SERVICE getUpcomingConcerts(limit(INT)); RETURN {list:JSON}
SERVICE adminListConcerts(status(STRING), page(INT), pageSize(INT)); RETURN {list:JSON, total:INT, page:INT}
SERVICE createConcert(title(STRING), description(STRING), coverImage(STRING), musicType(STRING), venue(STRING), address(STRING), startTime(TIMESTAMP), endTime(TIMESTAMP), gateOpenTime(TIMESTAMP), totalCapacity(INT)); RETURN {concert:JSON}
SERVICE updateConcert(id(STRING), title(STRING), description(STRING), coverImage(STRING), musicType(STRING), venue(STRING), address(STRING), startTime(TIMESTAMP), endTime(TIMESTAMP), gateOpenTime(TIMESTAMP)); RETURN {concert:JSON}
SERVICE deleteConcert(id(STRING)); RETURN {success:BOOL}
SERVICE updateConcertStatus(id(STRING), status(STRING)); RETURN {concert:JSON}
SERVICE saveSeatZones(concertId(STRING), zones(JSON)); RETURN {zones:JSON}
