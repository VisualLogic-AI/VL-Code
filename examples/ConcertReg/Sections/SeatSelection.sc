// VL_VERSION:2.91

# Frontend Variables
$concertId(STRING) = ""
$concertTitle(STRING) = ""
$seatZones(JSON) = []
$selectedZoneId(STRING) = ""
$selectedZone(JSON) = {}
$quantity(INT) = 1
$totalPrice(FLOAT) = 0
$loading(BOOL) = true

# Frontend Tree
<Column "root"> style:root
--<Row "navBar"> style:navBar
----<Touchable "backBtn"> @tap:onBack style:navBackBtn
------<Text "backIcon"> text:← style:navBackIcon
----<Text "navTitle"> text:选择座位区域 style:navTitle
----<Box "navSpacer"> style:navSpacer
--<ScrollView "scroll"> style:scroll
----<Column "body"> style:body
------<Column "concertInfo"> style:concertInfoCard
--------<Text "concertName"> text:$concertTitle style:concertInfoTitle numberOfLines:2
------<SeatZoneMap "zoneMap"> zones:$seatZones selectedZoneId:$selectedZoneId disabled:false @selectZone:onZoneSelect
------IF $selectedZoneId != ""
------<Column "selectedCard"> style:selectedCard
--------<Text "selectedTitle"> text:已选区域 style:selectedCardTitle
--------<Row "selectedRow"> style:selectedRow
----------<Column "selectedInfo"> style:selectedInfoCol
------------<Text "selectedName"> text:$selectedZone.zoneName style:selectedName
------------<Text "selectedSeats"> text:"剩余 " + $selectedZone.remainingSeats + " 个座位" style:selectedSeats
----------<Text "selectedPrice"> text:"¥" + $selectedZone.price + "/张" style:selectedUnitPrice
--------<Box "divider"> style:divider
--------<Text "qtyTitle"> text:购票数量 style:qtyTitle
--------<Row "qtyStepper"> style:qtyStepper
----------<Touchable "qtyMinus"> @tap:onQuantityMinus style:$quantity <= 1 ? qtyBtnDisabled : qtyBtn
------------<Text "minusIcon"> text:- style:$quantity <= 1 ? qtyBtnTextDisabled : qtyBtnText
----------<Text "qtyValue"> text:$quantity style:qtyValue
----------<Touchable "qtyPlus"> @tap:onQuantityPlus style:$quantity >= 5 ? qtyBtnDisabled : qtyBtn
------------<Text "plusIcon"> text:+ style:$quantity >= 5 ? qtyBtnTextDisabled : qtyBtnText
--------<Box "divider2"> style:divider
--------<Row "priceRow"> style:priceRow
----------<Text "priceLabel"> text:合计金额 style:priceLabel
----------<Text "priceTotal"> text:"¥" + $totalPrice style:priceTotal
------<Box "bottomSpacer"> style:bottomSpacer
--<Box "fixedBottom"> style:fixedBottom
----<Column "summaryCol"> style:summaryCol
------<Text "summaryLabel"> text:合计 style:summaryLabel
------<Text "summaryPrice"> text:"¥" + $totalPrice style:summaryPrice
----<Touchable "confirmBtn"> @tap:onConfirm style:$selectedZoneId == "" ? confirmBtnDisabled : confirmBtn
------<Text "confirmText"> text:确认选择 style:confirmBtnText

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL ConcertDomain.getSeatZones(concertId:$concertId)
----ON SUCCESS
------SET $seatZones = result.zones
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "加载座位区域失败"

HANDLER onBack()
--NAVIGATE BACK

HANDLER onZoneSelect(zoneId, zoneName, price)
--SET $selectedZoneId = zoneId
--SET $selectedZone = {id: zoneId, zoneName: zoneName, price: price, remainingSeats: 0}
--FOR $zone IN $seatZones
----IF $zone.id == zoneId
------SET $selectedZone = $zone
--SET $quantity = 1
--SET $totalPrice = price * 1

HANDLER onQuantityMinus()
--IF $quantity > 1
----SET $quantity = $quantity - 1
----SET $totalPrice = $selectedZone.price * $quantity

HANDLER onQuantityPlus()
--IF $quantity < 5
----IF $quantity < $selectedZone.remainingSeats
------SET $quantity = $quantity + 1
------SET $totalPrice = $selectedZone.price * $quantity

HANDLER onConfirm()
--IF $selectedZoneId == ""
----TOAST "请先选择座位区域"
----RETURN
--NAVIGATE RegistrationConfirm WITH concertId:$concertId, zoneId:$selectedZoneId, quantity:$quantity, totalPrice:$totalPrice, concertTitle:$concertTitle, zoneName:$selectedZone.zoneName

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE navBar
--flexDirection: row
--alignItems: center
--paddingTop: 48px
--paddingBottom: 12px
--paddingHorizontal: 16px
--backgroundColor: #ffffff
--borderBottomWidth: 1px
--borderBottomColor: #f1f5f9

STYLE navBackBtn
--width: 40px
--height: 40px
--alignItems: center
--justifyContent: center

STYLE navBackIcon
--fontSize: 20px
--fontWeight: 700
--color: #0f172a

STYLE navTitle
--flex: 1
--fontSize: 17px
--fontWeight: 700
--color: #0f172a
--textAlign: center

STYLE navSpacer
--width: 40px

STYLE scroll
--flex: 1

STYLE body
--padding: 16px
--gap: 16px
--paddingBottom: 120px

STYLE concertInfoCard
--backgroundColor: #ffffff
--borderRadius: 14px
--padding: 16px

STYLE concertInfoTitle
--fontSize: 16px
--fontWeight: 700
--color: #0f172a

STYLE selectedCard
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 20px
--gap: 16px
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 2

STYLE selectedCardTitle
--fontSize: 14px
--fontWeight: 600
--color: #94a3b8

STYLE selectedRow
--flexDirection: row
--alignItems: center

STYLE selectedInfoCol
--flex: 1
--gap: 2px

STYLE selectedName
--fontSize: 18px
--fontWeight: 700
--color: #0f172a

STYLE selectedSeats
--fontSize: 13px
--color: #64748b

STYLE selectedUnitPrice
--fontSize: 16px
--fontWeight: 700
--color: #f59e0b

STYLE divider
--height: 1px
--backgroundColor: #f1f5f9

STYLE qtyTitle
--fontSize: 14px
--fontWeight: 600
--color: #0f172a

STYLE qtyStepper
--flexDirection: row
--alignItems: center
--alignSelf: center
--gap: 20px

STYLE qtyBtn
--width: 40px
--height: 40px
--borderRadius: 20px
--backgroundColor: #6366f1
--alignItems: center
--justifyContent: center

STYLE qtyBtnDisabled
--width: 40px
--height: 40px
--borderRadius: 20px
--backgroundColor: #e2e8f0
--alignItems: center
--justifyContent: center

STYLE qtyBtnText
--fontSize: 20px
--fontWeight: 700
--color: #ffffff

STYLE qtyBtnTextDisabled
--fontSize: 20px
--fontWeight: 700
--color: #94a3b8

STYLE qtyValue
--fontSize: 28px
--fontWeight: 800
--color: #0f172a
--minWidth: 40px
--textAlign: center

STYLE priceRow
--flexDirection: row
--alignItems: center
--justifyContent: space-between

STYLE priceLabel
--fontSize: 14px
--fontWeight: 600
--color: #0f172a

STYLE priceTotal
--fontSize: 24px
--fontWeight: 800
--color: #f59e0b

STYLE bottomSpacer
--height: 20px

STYLE fixedBottom
--position: absolute
--bottom: 0
--left: 0
--right: 0
--flexDirection: row
--alignItems: center
--justifyContent: space-between
--padding: 16px
--paddingBottom: 32px
--backgroundColor: #ffffff
--borderTopWidth: 1px
--borderTopColor: #f1f5f9
--shadowColor: #000000
--shadowOffset: 0px -2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 4

STYLE summaryCol
--gap: 2px

STYLE summaryLabel
--fontSize: 12px
--color: #94a3b8

STYLE summaryPrice
--fontSize: 22px
--fontWeight: 800
--color: #f59e0b

STYLE confirmBtn
--backgroundColor: #6366f1
--borderRadius: 14px
--paddingHorizontal: 32px
--paddingVertical: 14px

STYLE confirmBtnDisabled
--backgroundColor: #cbd5e1
--borderRadius: 14px
--paddingHorizontal: 32px
--paddingVertical: 14px

STYLE confirmBtnText
--color: #ffffff
--fontSize: 16px
--fontWeight: 700
