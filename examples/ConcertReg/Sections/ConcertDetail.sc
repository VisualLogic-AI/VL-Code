// VL_VERSION:2.91

# Frontend Variables
$concertId(STRING) = ""
$concert(JSON) = {}
$performers(JSON) = []
$seatZones(JSON) = []
$loading(BOOL) = true
$showPerformerModal(BOOL) = false
$selectedPerformer(JSON) = {}

# Frontend Tree
<Column "root"> style:root
--IF $loading == true
--<Column "loadingState"> style:loadingState
----<Text "loadingText"> text:加载中... style:loadingMsg
--IF $loading == false
--<ScrollView "scroll"> style:scroll
----<Column "content"> style:content
------<Box "banner"> style:banner
--------<Image "coverImg"> src:$concert.coverImage style:coverImg resizeMode:cover
--------<Box "bannerOverlay"> style:bannerOverlay
--------<Touchable "backBtn"> @tap:onBack style:backBtn
----------<Text "backIcon"> text:← style:backIcon
--------<Box "musicBadge"> style:musicBadge
----------<Text "musicBadgeText"> text:$concert.musicType style:musicBadgeText
------<Column "infoSection"> style:infoSection
--------<Text "concertTitle"> text:$concert.title style:concertTitle
--------<Row "dateRow"> style:infoRow
----------<Text "dateIcon"> text:📅 style:infoIcon
----------<Column "dateInfo"> style:dateInfoCol
------------<Text "dateLabel"> text:演出时间 style:infoLabel
------------<Text "dateValue"> text:$concert.startTime + " - " + $concert.endTime style:infoValue
--------<Row "venueRow"> style:infoRow
----------<Text "venueIcon"> text:📍 style:infoIcon
----------<Column "venueInfo"> style:dateInfoCol
------------<Text "venueLabel"> text:演出地点 style:infoLabel
------------<Text "venueValue"> text:$concert.venue style:infoValue
------------<Text "addressValue"> text:$concert.address style:infoSubValue
--------<Row "gateRow"> style:infoRow
----------<Text "gateIcon"> text:🚪 style:infoIcon
----------<Column "gateInfo"> style:dateInfoCol
------------<Text "gateLabel"> text:入场时间 style:infoLabel
------------<Text "gateValue"> text:$concert.gateOpenTime style:infoValue
------IF $concert.weatherInfo != ""
------<Column "weatherSection"> style:section
--------<Text "weatherTitle"> text:🌤 天气提醒 style:sectionTitle
--------<WeatherBadge "weather"> weatherIcon:$concert.weatherIcon temperature:$concert.weatherTemp description:$concert.weatherDesc showTip:true tip:$concert.weatherTip
------IF $performers.length > 0
------<Column "performerSection"> style:section
--------<Row "performerHeader"> style:sectionHeader
----------<Text "performerTitle"> text:🎤 演出阵容 style:sectionTitle
----------<Text "performerCount"> text:$performers.length + "组艺人" style:sectionCount
--------<ScrollView "performerScroll"> horizontal:true style:performerScroll showsHorizontalScrollIndicator:false
----------<Row "performerList"> style:performerList
------------FOR $performer IN $performers
------------<Touchable "pTouch"> @tap:onPerformerTap($performer)
--------------<Column "pCard"> style:performerCard
----------------<Image "pAvatar"> src:$performer.avatarUrl style:performerAvatar resizeMode:cover
----------------<Text "pName"> text:$performer.name style:performerName numberOfLines:1
----------------<Text "pGenre"> text:$performer.genre style:performerGenre numberOfLines:1
------<Column "zoneSection"> style:section
--------<Text "zoneTitle"> text:🎫 座位区域 style:sectionTitle
--------<Column "zoneList"> style:zoneList
----------FOR $zone IN $seatZones
----------<Row "zoneItem"> style:zoneItem
------------<Box "zoneDot"> style:zoneDot
------------<Column "zoneInfo"> style:zoneInfo
--------------<Text "zoneNameText"> text:$zone.zoneName style:zoneNameText
--------------<Text "zoneSeatsText"> text:"剩余 " + $zone.remainingSeats + " 座" style:$zone.remainingSeats > 0 ? zoneSeatsText : zoneSeatsEmpty
------------<Text "zonePriceText"> text:"¥" + $zone.price style:zonePriceText
------IF $concert.description != ""
------<Column "descSection"> style:section
--------<Text "descTitle"> text:📝 活动详情 style:sectionTitle
--------<Text "descText"> text:$concert.description style:descText
------<Box "bottomSpacer"> style:bottomSpacer
--IF $loading == false
--<Box "fixedBottom"> style:fixedBottom
----<Column "priceInfo"> style:priceInfo
------<Text "fromText"> text:票价 style:fromLabel
------<Text "priceRange"> text:"¥" + $concert.minPrice + " 起" style:priceRangeText
----<Touchable "registerBtn"> @tap:onRegisterTap style:registerBtn
------<Text "registerText"> text:立即报名 style:registerBtnText
--IF $showPerformerModal
--<Box "modalOverlay"> @tap:onClosePerformerModal style:modalOverlay
----<Column "performerModal"> style:performerModal
------<Image "modalAvatar"> src:$selectedPerformer.avatarUrl style:modalAvatar resizeMode:cover
------<Text "modalName"> text:$selectedPerformer.name style:modalName
------<Text "modalGenre"> text:$selectedPerformer.genre style:modalGenre
------IF $selectedPerformer.representative != ""
------<Text "modalRep"> text:"代表作: " + $selectedPerformer.representative style:modalRep
------IF $selectedPerformer.bio != ""
------<Text "modalBio"> text:$selectedPerformer.bio style:modalBio

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL ConcertDomain.getConcertDetail(id:$concertId)
----ON SUCCESS
------SET $concert = result.concert
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "加载音乐会详情失败"
--CALL PerformerDomain.getPerformersByConcert(concertId:$concertId)
----ON SUCCESS
------SET $performers = result.list
----ON ERROR
------SET $performers = []
--CALL ConcertDomain.getSeatZones(concertId:$concertId)
----ON SUCCESS
------SET $seatZones = result.zones
----ON ERROR
------SET $seatZones = []

HANDLER onBack()
--NAVIGATE BACK

HANDLER onRegisterTap()
--NAVIGATE SeatSelection WITH concertId:$concertId, concertTitle:$concert.title

HANDLER onPerformerTap(performer)
--SET $selectedPerformer = performer
--SET $showPerformerModal = true

HANDLER onClosePerformerModal()
--SET $showPerformerModal = false

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE loadingState
--flex: 1
--alignItems: center
--justifyContent: center

STYLE loadingMsg
--fontSize: 15px
--color: #94a3b8

STYLE scroll
--flex: 1

STYLE content
--paddingBottom: 0px

STYLE banner
--width: 100%
--height: 260px
--position: relative

STYLE coverImg
--width: 100%
--height: 100%

STYLE bannerOverlay
--position: absolute
--bottom: 0
--left: 0
--right: 0
--height: 100px
--backgroundColor: rgba(0,0,0,0.3)

STYLE backBtn
--position: absolute
--top: 48px
--left: 16px
--width: 40px
--height: 40px
--borderRadius: 20px
--backgroundColor: rgba(0,0,0,0.4)
--alignItems: center
--justifyContent: center

STYLE backIcon
--color: #ffffff
--fontSize: 20px
--fontWeight: 700

STYLE favBtnDetail
--position: absolute
--top: 48px
--right: 16px
--width: 44px
--height: 44px
--borderRadius: 22px
--backgroundColor: rgba(255,255,255,0.9)
--alignItems: center
--justifyContent: center
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.15
--shadowRadius: 4px
--elevation: 3

STYLE favIconDetail
--fontSize: 22px

STYLE musicBadge
--position: absolute
--bottom: 16px
--left: 16px
--backgroundColor: rgba(99,102,241,0.9)
--paddingHorizontal: 14px
--paddingVertical: 6px
--borderRadius: 20px

STYLE musicBadgeText
--color: #ffffff
--fontSize: 13px
--fontWeight: 600

STYLE infoSection
--padding: 20px
--gap: 16px
--backgroundColor: #ffffff

STYLE concertTitle
--fontSize: 24px
--fontWeight: 800
--color: #0f172a
--lineHeight: 32px

STYLE infoRow
--flexDirection: row
--alignItems: flex-start
--gap: 12px

STYLE infoIcon
--fontSize: 18px
--marginTop: 2px

STYLE dateInfoCol
--flex: 1
--gap: 2px

STYLE infoLabel
--fontSize: 12px
--color: #94a3b8
--fontWeight: 500

STYLE infoValue
--fontSize: 14px
--color: #0f172a
--fontWeight: 600

STYLE infoSubValue
--fontSize: 12px
--color: #64748b

STYLE section
--padding: 20px
--backgroundColor: #ffffff
--marginTop: 8px
--gap: 12px

STYLE sectionHeader
--flexDirection: row
--alignItems: center
--justifyContent: space-between

STYLE sectionTitle
--fontSize: 16px
--fontWeight: 700
--color: #0f172a

STYLE sectionCount
--fontSize: 13px
--color: #94a3b8

STYLE performerScroll
--marginHorizontal: -20px
--paddingHorizontal: 20px

STYLE performerList
--flexDirection: row
--gap: 14px

STYLE performerCard
--width: 100px
--alignItems: center
--gap: 6px

STYLE performerAvatar
--width: 80px
--height: 80px
--borderRadius: 40px
--backgroundColor: #f1f5f9

STYLE performerName
--fontSize: 13px
--fontWeight: 600
--color: #0f172a
--textAlign: center

STYLE performerGenre
--fontSize: 11px
--color: #6366f1
--textAlign: center

STYLE zoneList
--gap: 8px

STYLE zoneItem
--flexDirection: row
--alignItems: center
--padding: 14px
--backgroundColor: #f8fafc
--borderRadius: 12px
--gap: 12px

STYLE zoneDot
--width: 10px
--height: 10px
--borderRadius: 5px
--backgroundColor: #6366f1

STYLE zoneInfo
--flex: 1
--gap: 2px

STYLE zoneNameText
--fontSize: 14px
--fontWeight: 600
--color: #0f172a

STYLE zoneSeatsText
--fontSize: 12px
--color: #64748b

STYLE zoneSeatsEmpty
--fontSize: 12px
--color: #ef4444

STYLE zonePriceText
--fontSize: 16px
--fontWeight: 700
--color: #f59e0b

STYLE descText
--fontSize: 14px
--color: #475569
--lineHeight: 22px

STYLE bottomSpacer
--height: 100px

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

STYLE priceInfo
--gap: 2px

STYLE fromLabel
--fontSize: 12px
--color: #94a3b8

STYLE priceRangeText
--fontSize: 22px
--fontWeight: 800
--color: #f59e0b

STYLE registerBtn
--backgroundColor: #6366f1
--borderRadius: 14px
--paddingHorizontal: 32px
--paddingVertical: 14px

STYLE registerBtnText
--color: #ffffff
--fontSize: 16px
--fontWeight: 700

STYLE modalOverlay
--position: absolute
--top: 0
--left: 0
--right: 0
--bottom: 0
--backgroundColor: rgba(0,0,0,0.5)
--justifyContent: center
--alignItems: center

STYLE performerModal
--backgroundColor: #ffffff
--borderRadius: 20px
--padding: 24px
--width: 300px
--alignItems: center
--gap: 10px

STYLE modalAvatar
--width: 100px
--height: 100px
--borderRadius: 50px
--backgroundColor: #f1f5f9

STYLE modalName
--fontSize: 18px
--fontWeight: 700
--color: #0f172a

STYLE modalGenre
--fontSize: 13px
--color: #6366f1
--fontWeight: 500

STYLE modalRep
--fontSize: 13px
--color: #64748b
--textAlign: center

STYLE modalBio
--fontSize: 13px
--color: #475569
--textAlign: center
--lineHeight: 20px
