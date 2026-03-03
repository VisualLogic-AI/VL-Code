// VL_VERSION:2.91

# Frontend Variables
$announcements(JSON) = []
$loading(BOOL) = true

# Frontend Tree
<Column "root"> style:root
--<Column "header"> style:header
----<Text "pageTitle"> text:📢 公告通知 style:pageTitle
----<Text "pageSubtitle"> text:了解最新音乐会动态 style:pageSubtitle
--<ScrollView "scroll"> style:scroll
----<Column "list"> style:list
------IF $loading == true
------<Column "loadingWrap"> style:centerState
--------<Text "loadingText"> text:加载中... style:stateText
------IF $announcements.length == 0 AND $loading == false
------<Column "emptyState"> style:centerState
--------<Text "emptyIcon"> text:📭 style:emptyEmoji
--------<Text "emptyTitle"> text:暂无公告 style:emptyTitle
--------<Text "emptyDesc"> text:目前没有新的公告信息 style:emptyDesc
------FOR $item IN $announcements
------<Column "annCard"> style:annCard
--------<Row "annHeader"> style:annHeader
----------<Box "typeBadge"> style:$item.type == "urgent" ? badgeUrgent : badgeNormal
------------<Text "typeText"> text:$item.type == "urgent" ? "紧急" : "通知" style:$item.type == "urgent" ? badgeUrgentText : badgeNormalText
----------<Text "annDate"> text:$item.publishedAt style:annDate
--------<Text "annTitle"> text:$item.title style:annTitle
--------<Text "annContent"> text:$item.content style:annContent numberOfLines:3

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL AnnouncementDomain.getAnnouncements(page:1, pageSize:20)
----ON SUCCESS
------SET $announcements = result.list
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "加载公告失败"

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE header
--paddingTop: 56px
--paddingBottom: 16px
--paddingHorizontal: 20px
--backgroundColor: #6366f1

STYLE pageTitle
--fontSize: 24px
--fontWeight: 800
--color: #ffffff

STYLE pageSubtitle
--fontSize: 14px
--color: rgba(255,255,255,0.8)
--marginTop: 4px

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

STYLE annCard
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 18px
--gap: 10px
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 2

STYLE annHeader
--flexDirection: row
--alignItems: center
--justifyContent: space-between

STYLE badgeNormal
--backgroundColor: #dbeafe
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px

STYLE badgeNormalText
--fontSize: 11px
--color: #2563eb
--fontWeight: 600

STYLE badgeUrgent
--backgroundColor: #fee2e2
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px
--borderWidth: 1px
--borderColor: #ef4444

STYLE badgeUrgentText
--fontSize: 11px
--color: #dc2626
--fontWeight: 600

STYLE annDate
--fontSize: 12px
--color: #94a3b8

STYLE annTitle
--fontSize: 16px
--fontWeight: 700
--color: #0f172a

STYLE annContent
--fontSize: 14px
--color: #475569
--lineHeight: 22px
