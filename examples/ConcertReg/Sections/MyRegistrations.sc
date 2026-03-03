// VL_VERSION:2.91

# Frontend Variables
$registrationList(JSON) = []
$filteredList(JSON) = []
$activeTab(STRING) = "upcoming"
$loading(BOOL) = true
$cancellingId(STRING) = ""
$showCancelConfirm(BOOL) = false

# Frontend Tree
<Column "root"> style:root
--<Column "header"> style:header
----<Text "pageTitle"> text:我的报名 style:pageTitle
--<Row "tabBar"> style:tabBar
----<Touchable "tabUpcoming"> @tap:onTabChange("upcoming") style:tabItem
------<Text "tabUpcomingText"> text:即将参加 style:$activeTab == "upcoming" ? tabTextActive : tabText
------IF $activeTab == "upcoming"
------<Box "tabIndicator1"> style:tabIndicator
----<Touchable "tabHistory"> @tap:onTabChange("history") style:tabItem
------<Text "tabHistoryText"> text:历史记录 style:$activeTab == "history" ? tabTextActive : tabText
------IF $activeTab == "history"
------<Box "tabIndicator2"> style:tabIndicator
--<ScrollView "scroll"> style:scroll
----<Column "list"> style:list
------IF $loading == true
------<Column "loadingWrap"> style:centerState
--------<Text "loadingText"> text:加载中... style:stateText
------IF $filteredList.length == 0 AND $loading == false
------<Column "emptyState"> style:centerState
--------<Text "emptyIcon"> text:🎫 style:emptyEmoji
--------<Text "emptyTitle"> text:暂无报名记录 style:emptyTitle
--------<Text "emptyDesc"> text:去发现精彩的露天音乐会吧 style:emptyDesc
--------<Touchable "browseBtn"> @tap:onBrowseConcerts style:browseBtn
----------<Text "browseText"> text:去看看音乐会 → style:browseBtnText
------FOR $reg IN $filteredList
------<Touchable "regCard"> @tap:onViewTicket($reg.id) style:regCardTouch
--------<Row "regRow"> style:regCard
----------<Image "regCover"> src:$reg.concertCoverImage style:regCover resizeMode:cover
----------<Column "regInfo"> style:regInfo
------------<Text "regTitle"> text:$reg.concertTitle style:regTitle numberOfLines:1
------------<Row "regDateRow"> style:regMetaRow
--------------<Text "regDateIcon"> text:📅 style:regMetaIcon
--------------<Text "regDate"> text:$reg.concertStartTime style:regMeta
------------<Row "regVenueRow"> style:regMetaRow
--------------<Text "regVenueIcon"> text:📍 style:regMetaIcon
--------------<Text "regVenue"> text:$reg.concertVenue style:regMeta numberOfLines:1
------------<Row "regBottomRow"> style:regBottomRow
--------------<StatusTag "regStatus"> text:$reg.status == "confirmed" ? "已确认" : $reg.status == "cancelled" ? "已取消" : "已使用" colorType:$reg.status == "confirmed" ? "success" : $reg.status == "cancelled" ? "error" : "info"
--------------<Text "regQty"> text:$reg.quantity + "张 | " + $reg.zoneName style:regQtyText
--------IF $reg.status == "confirmed"
--------<Row "regActions"> style:regActions
----------<Touchable "viewTicket"> @tap:onViewTicket($reg.id) style:actionBtnPrimary
------------<Text "viewTicketText"> text:查看电子票 style:actionBtnPrimaryText
----------<Touchable "cancelReg"> @tap:onCancelTap($reg.id) style:actionBtnDanger
------------<Text "cancelText"> text:取消 style:actionBtnDangerText
--IF $showCancelConfirm
--<Box "cancelOverlay"> style:modalOverlay
----<Column "cancelModal"> style:cancelModal
------<Text "cancelModalTitle"> text:确认取消报名？ style:cancelModalTitle
------<Text "cancelModalDesc"> text:取消后座位将释放，您可以重新报名 style:cancelModalDesc
------<Row "cancelModalActions"> style:cancelModalActions
--------<Touchable "cancelDismiss"> @tap:onCancelDismiss style:modalBtnSecondary
----------<Text "cancelDismissText"> text:再想想 style:modalBtnSecondaryText
--------<Touchable "cancelConfirm"> @tap:onCancelConfirm style:modalBtnDanger
----------<Text "cancelConfirmText"> text:确认取消 style:modalBtnDangerText

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL RegistrationDomain.getMyRegistrations(userId:"user001")
----ON SUCCESS
------SET $registrationList = result.list
------CALL onFilterList()
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "加载报名记录失败"

HANDLER onTabChange(tab)
--SET $activeTab = tab
--CALL onFilterList()

HANDLER onFilterList()
--IF $activeTab == "upcoming"
----SET $filteredList = $registrationList.filter(r => r.status == "confirmed")
--ELSE
----SET $filteredList = $registrationList.filter(r => r.status == "cancelled" OR r.status == "used")

HANDLER onViewTicket(registrationId)
--NAVIGATE TicketView WITH registrationId:registrationId

HANDLER onCancelTap(registrationId)
--SET $cancellingId = registrationId
--SET $showCancelConfirm = true

HANDLER onCancelConfirm()
--SET $showCancelConfirm = false
--CALL RegistrationDomain.cancelRegistration(id:$cancellingId)
----ON SUCCESS
------TOAST "报名已取消"
------CALL onLoad()
----ON ERROR
------TOAST "取消失败: " + error.message

HANDLER onCancelDismiss()
--SET $showCancelConfirm = false
--SET $cancellingId = ""

HANDLER onBrowseConcerts()
--NAVIGATE ConcertList

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE header
--paddingTop: 56px
--paddingBottom: 12px
--paddingHorizontal: 20px
--backgroundColor: #ffffff

STYLE pageTitle
--fontSize: 24px
--fontWeight: 800
--color: #0f172a

STYLE tabBar
--flexDirection: row
--backgroundColor: #ffffff
--paddingHorizontal: 20px
--borderBottomWidth: 1px
--borderBottomColor: #f1f5f9

STYLE tabItem
--flex: 1
--alignItems: center
--paddingVertical: 14px

STYLE tabText
--fontSize: 15px
--fontWeight: 500
--color: #94a3b8

STYLE tabTextActive
--fontSize: 15px
--fontWeight: 700
--color: #6366f1

STYLE tabIndicator
--width: 32px
--height: 3px
--borderRadius: 2px
--backgroundColor: #6366f1
--marginTop: 6px

STYLE scroll
--flex: 1

STYLE list
--padding: 16px
--gap: 12px
--paddingBottom: 100px

STYLE centerState
--alignItems: center
--paddingVertical: 60px
--gap: 8px

STYLE stateText
--fontSize: 14px
--color: #94a3b8

STYLE emptyEmoji
--fontSize: 48px

STYLE emptyTitle
--fontSize: 18px
--fontWeight: 600
--color: #0f172a

STYLE emptyDesc
--fontSize: 14px
--color: #94a3b8

STYLE browseBtn
--marginTop: 12px
--backgroundColor: #6366f1
--borderRadius: 12px
--paddingHorizontal: 24px
--paddingVertical: 12px

STYLE browseBtnText
--color: #ffffff
--fontSize: 14px
--fontWeight: 600

STYLE regCardTouch
--borderRadius: 16px
--overflow: hidden

STYLE regCard
--flexDirection: row
--backgroundColor: #ffffff
--borderRadius: 16px
--overflow: hidden
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 2

STYLE regCover
--width: 90px
--height: 110px

STYLE regInfo
--flex: 1
--padding: 12px
--gap: 4px

STYLE regTitle
--fontSize: 15px
--fontWeight: 700
--color: #0f172a

STYLE regMetaRow
--flexDirection: row
--alignItems: center
--gap: 4px

STYLE regMetaIcon
--fontSize: 11px

STYLE regMeta
--fontSize: 12px
--color: #64748b
--flex: 1

STYLE regBottomRow
--flexDirection: row
--alignItems: center
--justifyContent: space-between
--marginTop: 4px

STYLE regQtyText
--fontSize: 12px
--color: #94a3b8

STYLE regActions
--flexDirection: row
--borderTopWidth: 1px
--borderTopColor: #f1f5f9

STYLE actionBtnPrimary
--flex: 1
--alignItems: center
--paddingVertical: 10px
--borderRightWidth: 1px
--borderRightColor: #f1f5f9

STYLE actionBtnPrimaryText
--fontSize: 13px
--fontWeight: 600
--color: #6366f1

STYLE actionBtnDanger
--flex: 1
--alignItems: center
--paddingVertical: 10px

STYLE actionBtnDangerText
--fontSize: 13px
--fontWeight: 500
--color: #ef4444

STYLE modalOverlay
--position: absolute
--top: 0
--left: 0
--right: 0
--bottom: 0
--backgroundColor: rgba(0,0,0,0.5)
--justifyContent: center
--alignItems: center

STYLE cancelModal
--backgroundColor: #ffffff
--borderRadius: 20px
--padding: 28px
--width: 300px
--alignItems: center
--gap: 10px

STYLE cancelModalTitle
--fontSize: 18px
--fontWeight: 700
--color: #0f172a

STYLE cancelModalDesc
--fontSize: 14px
--color: #64748b
--textAlign: center

STYLE cancelModalActions
--flexDirection: row
--gap: 12px
--marginTop: 8px

STYLE modalBtnSecondary
--flex: 1
--alignItems: center
--paddingVertical: 12px
--borderRadius: 12px
--backgroundColor: #f1f5f9

STYLE modalBtnSecondaryText
--fontSize: 14px
--fontWeight: 600
--color: #64748b

STYLE modalBtnDanger
--flex: 1
--alignItems: center
--paddingVertical: 12px
--borderRadius: 12px
--backgroundColor: #ef4444

STYLE modalBtnDangerText
--fontSize: 14px
--fontWeight: 600
--color: #ffffff
