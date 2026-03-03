// VL_VERSION:2.91

# Frontend Variables
$registrationId(STRING) = ""
$ticketDetail(JSON) = {}
$concertTitle(STRING) = ""
$concertStartTime(STRING) = ""
$concertVenue(STRING) = ""
$concertAddress(STRING) = ""
$zoneName(STRING) = ""
$ticketCode(STRING) = ""
$quantity(INT) = 1
$status(STRING) = "confirmed"
$weatherInfo(STRING) = ""
$weatherTip(STRING) = ""
$loading(BOOL) = true

# Frontend Tree
<Column "root"> style:root
--<Row "navBar"> style:navBar
----<Touchable "backBtn"> @tap:onBack style:navBackBtn
------<Text "backIcon"> text:← style:navBackIcon
----<Text "navTitle"> text:电子票 style:navTitle
----<Box "navSpacer"> style:navSpacer
--IF $loading == true
--<Column "loadingState"> style:centerState
----<Text "loadingText"> text:加载中... style:loadingMsg
--IF $loading == false
--<ScrollView "scroll"> style:scroll
----<Column "body"> style:body
------<TicketQrCode "ticket"> ticketCode:$ticketCode concertTitle:$concertTitle dateText:$concertStartTime venue:$concertVenue zoneName:$zoneName quantity:$quantity status:$status @save:onSave
------IF $weatherTip != ""
------<Column "weatherSection"> style:weatherSection
--------<Text "weatherSectionTitle"> text:🌤 天气提醒 style:weatherSectionTitle
--------<WeatherBadge "weatherBadge"> weatherIcon:"sun" temperature:"" description:$weatherInfo showTip:true tip:$weatherTip
------<Column "noticeSection"> style:noticeSection
--------<Text "noticeTitle"> text:📌 入场须知 style:noticeTitle
--------<Column "noticeList"> style:noticeList
----------<Row "notice1"> style:noticeRow
------------<Box "noticeDot1"> style:noticeDot
------------<Text "noticeText1"> text:请凭电子票二维码在入口处扫码入场 style:noticeText
----------<Row "notice2"> style:noticeRow
------------<Box "noticeDot2"> style:noticeDot
------------<Text "noticeText2"> text:请携带本人有效身份证件以备查验 style:noticeText
----------<Row "notice3"> style:noticeRow
------------<Box "noticeDot3"> style:noticeDot
------------<Text "noticeText3"> text:开门时间后方可入场，请勿过早到达 style:noticeText
----------<Row "notice4"> style:noticeRow
------------<Box "noticeDot4"> style:noticeDot
------------<Text "noticeText4"> text:露天场地请根据天气情况做好防晒或防雨准备 style:noticeText
------<Column "addressSection"> style:addressSection
--------<Text "addressTitle"> text:📍 场地地址 style:addressSectionTitle
--------<Text "addressText"> text:$concertAddress style:addressText
--------<Touchable "navBtn"> @tap:onNavigate style:navToBtn
----------<Text "navBtnText"> text:导航前往 → style:navToBtnText

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL RegistrationDomain.getTicketDetail(id:$registrationId)
----ON SUCCESS
------SET $ticketDetail = result.registration
------SET $concertTitle = result.concertTitle
------SET $concertStartTime = result.concertStartTime
------SET $concertVenue = result.concertVenue
------SET $concertAddress = result.concertAddress
------SET $zoneName = result.zoneName
------SET $ticketCode = result.registration.ticketCode
------SET $quantity = result.registration.quantity
------SET $status = result.registration.status
------SET $weatherInfo = result.weatherInfo
------SET $weatherTip = result.weatherTip
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "加载电子票详情失败"

HANDLER onBack()
--NAVIGATE BACK

HANDLER onSave()
--TOAST "已保存至相册"

HANDLER onNavigate()
--TOAST "正在打开导航..."

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #6366f1

STYLE navBar
--flexDirection: row
--alignItems: center
--paddingTop: 48px
--paddingBottom: 12px
--paddingHorizontal: 16px

STYLE navBackBtn
--width: 40px
--height: 40px
--alignItems: center
--justifyContent: center

STYLE navBackIcon
--fontSize: 20px
--fontWeight: 700
--color: #ffffff

STYLE navTitle
--flex: 1
--fontSize: 17px
--fontWeight: 700
--color: #ffffff
--textAlign: center

STYLE navSpacer
--width: 40px

STYLE centerState
--flex: 1
--alignItems: center
--justifyContent: center

STYLE loadingMsg
--fontSize: 15px
--color: rgba(255,255,255,0.8)

STYLE scroll
--flex: 1

STYLE body
--padding: 16px
--gap: 20px
--paddingBottom: 40px

STYLE weatherSection
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 18px
--gap: 12px

STYLE weatherSectionTitle
--fontSize: 15px
--fontWeight: 700
--color: #0f172a

STYLE noticeSection
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 18px
--gap: 12px

STYLE noticeTitle
--fontSize: 15px
--fontWeight: 700
--color: #0f172a

STYLE noticeList
--gap: 10px

STYLE noticeRow
--flexDirection: row
--alignItems: flex-start
--gap: 10px

STYLE noticeDot
--width: 6px
--height: 6px
--borderRadius: 3px
--backgroundColor: #6366f1
--marginTop: 7px

STYLE noticeText
--flex: 1
--fontSize: 13px
--color: #475569
--lineHeight: 20px

STYLE addressSection
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 18px
--gap: 10px

STYLE addressSectionTitle
--fontSize: 15px
--fontWeight: 700
--color: #0f172a

STYLE addressText
--fontSize: 14px
--color: #475569
--lineHeight: 20px

STYLE navToBtn
--alignSelf: flex-start
--marginTop: 4px
--backgroundColor: #6366f1
--borderRadius: 10px
--paddingHorizontal: 18px
--paddingVertical: 10px

STYLE navToBtnText
--color: #ffffff
--fontSize: 13px
--fontWeight: 600
